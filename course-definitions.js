(function () {
 'use strict';
 const i18n = window.SmallJourneyI18n, t = i18n.t, model = window.SmallJourneyCourse.model;
 const blocks = new Map(model.trim().split(/\n\n(?=\w+:\n)/).map(block => [block.split(':')[0],block]));
 const fact = blocks.get('FACT_SALES');
 const definitions = {};
 const add = (name,kind,scope,code,description) => { definitions[name] = {kind,scope,code,description,references:[]}; };
 const columnKeys = {id:'definitionId',region:'definitionRegion',amount:'definitionAmount',customer:'helpCustomer',dt_month:'helpMonth',status:'helpStatus',manager:'helpManager'};
 const columns = fact.slice(fact.indexOf('  columns:\n')+11,fact.indexOf('  measures:\n'));
 for (const match of columns.matchAll(/^    (\w+):.*$/gm)) add(match[1],'definitionColumn','FACT_SALES.columns',match[0].trimStart(),columnKeys[match[1]]);
 for (const match of fact.matchAll(/^    (sales|cnt):.*$/gm)) add(match[1],'definitionAtomic','FACT_SALES.measures',match[0].trimStart(),match[1] === 'sales' ? 'definitionSales' : 'definitionCnt');
 const measureKeys = {average_sale:'definitionAverageSale',completed_sales:'helpCompleted',within_slice_share:'helpWithinShare',all_region_share:'helpAllShare',average_customer_sales:'helpCustomerAverage',sum_customer_sales:'helpCustomerSum',max_customer_sales:'helpCustomerMax',previous_sales:'helpPrevious',sales_change:'helpChange',previous_sales_filled:'helpFilled'};
 for (const [name,key] of Object.entries(measureKeys)) add(name,'definitionComposite','model.dml',blocks.get(name),key);
 add('FACT_SALES','helpDataset','model.dml',fact.split('  columns:')[0].trim(),'helpFact');
 add('DIM_REGION','helpDataset','model.dml',blocks.get('DIM_REGION'),'helpRegions');
 add('TABLE_SALES','helpSourceTable','model.dml',fact.match(/  table:.*$/m)[0].trim(),'helpTableSales');
 add('TABLE_REGION','helpSourceTable','model.dml',blocks.get('DIM_REGION').match(/  table:.*$/m)[0].trim(),'helpTableRegion');
 for (const name of ['region','manager']) add('DIM_REGION.'+name,'definitionColumn','DIM_REGION.columns',blocks.get('DIM_REGION').match(new RegExp('^    '+name+':.*$','m'))[0].trimStart(),'helpDirectory'+(name === 'region' ? 'Region' : 'Manager'));
 const concepts = {
  dimension:['helpDimension',fact.match(/  dimension:.*$/m)[0].trim()],
  AGG:['helpAgg','AGG(sales)'], DIVIDE:['helpDivide','DIVIDE({sales}, {cnt})'], ISNULL:['helpIsnull','ISNULL({sales: pp}, 0)'],
  SUM:['helpSum','SUM({amount})'], COUNT:['helpCount','COUNT(1)'], AVG:['helpAvg','AVG({sales: {+d: customer}})'], MAX:['helpMax','MAX({sales: {+d: customer}})'],
  pk:['helpPk',definitions.manager.code.split(': ').slice(1).join(': ')],
  '+f':['helpPlusFilter','{sales: {+f: {status: completed}}}'], '+d':['helpPlusDimension','AVG({sales: {+d: customer}})'],
  '-d':['helpMinusDimension','{sales: {-d: region}}'], '-df':['helpMinusBoth','{sales: {-df: region}}'],
  pp:['helpPp','{sales: pp}'], pop:['helpPop','{sales: pop}'],
  'GROUP BY':['helpGroupBy','GROUP BY region'], WHERE:['helpWhere',"WHERE dt_month = '2025-02-01'"], 'FROM MODEL':['helpFromModel','FROM MODEL']
 };
 for (const [name,[key,code]] of Object.entries(concepts)) {
  const scope = name === 'dimension' ? 'DML · dataset.dimension' : ['AGG','GROUP BY','WHERE','FROM MODEL'].includes(name) ? 'Model Query' : 'DMX';
  add(name,'helpSyntax',scope,code,key);
 }
 const tokens = /GROUP BY|FROM MODEL|-df|-d|\+d|\+f|[A-Za-z_][A-Za-z_0-9]*/g;
 for (const [name,entry] of Object.entries(definitions)) {
  entry.references = [...new Set(Array.from(entry.code.matchAll(tokens),m=>m[0]).filter(key => key !== name && definitions[key] && !concepts[key]))];
 }
 definitions.DIM_REGION.references = ['DIM_REGION.region','DIM_REGION.manager'];
 const panel = document.createElement('aside'); panel.id = 'query-definition'; panel.className = 'query-definition'; panel.hidden = true; panel.setAttribute('aria-labelledby','query-definition-title');
 const tooltip = document.createElement('div'); tooltip.id = 'definition-tooltip'; tooltip.className = 'definition-tooltip'; tooltip.setAttribute('role','tooltip'); tooltip.hidden = true;
 document.body.append(panel,tooltip);
 const rendered = new WeakMap();
 let opener, previewed, delay, hideDelay, scheduled = false, restoringFocus = false;
 function symbol(key,text=key) {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'query-symbol'; button.dataset.definition = key; button.textContent = text;
  button.setAttribute('aria-label',t('definitionOpen',{name:text})); button.setAttribute('aria-controls',panel.id); button.setAttribute('aria-expanded','false');
  return button;
 }
 function expanded() {
  for (const button of document.querySelectorAll('[data-definition]')) button.setAttribute('aria-expanded',String(!panel.hidden && button === opener));
 }
 function hidePreview() {
  clearTimeout(delay); clearTimeout(hideDelay); tooltip.hidden = true;
  previewed?.removeAttribute('aria-describedby'); previewed = undefined;
 }
 function close(focus=false) {
  hidePreview(); panel.hidden = true; expanded();
  if (focus && opener?.isConnected) { restoringFocus = true; opener.focus({preventScroll:true}); opener.scrollIntoView({block:'nearest'}); restoringFocus = false; }
 }
 function show(key,trigger) {
  const entry = definitions[key]; if (!entry) return;
  hidePreview();
  if (!panel.contains(trigger)) {
   opener = trigger;
   (trigger.closest('pre,.formula,table') || trigger).after(panel);
  }
  const header = document.createElement('div'); header.className = 'definition-header';
  const title = document.createElement('h3'); title.id = 'query-definition-title'; title.tabIndex = -1; title.textContent = key;
  const dismiss = document.createElement('button'); dismiss.type = 'button'; dismiss.className = 'definition-close'; dismiss.textContent = '×'; dismiss.setAttribute('aria-label',t('definitionClose')); dismiss.addEventListener('click',()=>close(true)); header.append(title,dismiss);
  const location = document.createElement('p'); location.className = 'definition-location'; location.textContent = t(entry.kind)+' · '+entry.scope;
  const code = document.createElement('code'); code.textContent = entry.code; const pre = document.createElement('pre'); pre.append(code);
  const description = document.createElement('p'); description.textContent = t(entry.description);
  panel.replaceChildren(header,location,pre,description);
  if (entry.references.length) {
   const references = document.createElement('div'); references.className = 'definition-references';
   const label = document.createElement('span'); label.textContent = t('definitionReferences'); references.append(label);
   for (const dependency of entry.references) references.append(symbol(dependency)); panel.append(references);
  }
  panel.hidden = false; expanded(); title.focus({preventScroll:true}); panel.scrollIntoView({block:'nearest'});
 }
 function preview(button,immediate=false) {
  hidePreview();
  const display = () => {
   if (!button.isConnected) return;
   const entry = definitions[button.dataset.definition]; if (!entry) return;
   previewed = button; tooltip.textContent = t(entry.description); tooltip.hidden = false;
   button.setAttribute('aria-describedby',tooltip.id);
   const rect = button.getBoundingClientRect(), box = tooltip.getBoundingClientRect();
   tooltip.style.left = Math.max(12,Math.min(rect.left,window.innerWidth-box.width-12))+'px';
   tooltip.style.top = Math.max(12,rect.bottom+8+box.height < window.innerHeight ? rect.bottom+8 : rect.top-box.height-8)+'px';
  };
  if (immediate) display(); else delay = setTimeout(display,350);
 }
 function enhance() {
  scheduled = false;
  for (const node of document.querySelectorAll('main .chapter pre code, main .chapter .formula > code, main .chapter th')) {
   if (node.closest('.query-definition,.compiler-observation,.chapter-check')) continue;
   const text = node.textContent, prior = rendered.get(node);
   if (node.tagName === 'TH' && !/^[A-Za-z_]\w*(?: \(%\))?$/.test(text)) continue;
   if (prior?.text === text && prior.locale === i18n.locale && node.querySelector('[data-definition]')) continue;
   const fragment = document.createDocumentFragment(); let at = 0;
   for (const match of text.matchAll(tokens)) {
    const name = match[0]; let key = name;
    // The directory has its own columns, distinct from FACT_SALES mappings.
    const directoryEnd = text.search(/\n(?:FACT_SALES:|# Inside FACT_SALES\.columns:)/);
    if (['region','manager'].includes(name) && text.startsWith('DIM_REGION:\n') && (directoryEnd < 0 || match.index < directoryEnd)) key = 'DIM_REGION.'+name;
    if (['region','manager'].includes(name) && node.closest('#lookup-directory')) key = 'DIM_REGION.'+name;
    if (name === 'manager' && text.slice(0,match.index).endsWith('{DIM_REGION}.')) key = 'DIM_REGION.manager';
    if (!definitions[key]) continue;
    fragment.append(document.createTextNode(text.slice(at,match.index)),symbol(key,name)); at = match.index+name.length;
   }
   fragment.append(document.createTextNode(text.slice(at))); node.replaceChildren(fragment); rendered.set(node,{text,locale:i18n.locale});
  }
  const query = document.getElementById('query-code');
  let hint = document.getElementById('definition-hint');
  if (!hint) { hint = document.createElement('p'); hint.id = 'definition-hint'; hint.className = 'small definition-hint'; query.after(hint); }
  hint.textContent = t('definitionHint'); expanded();
  let firstHint = document.getElementById('model-definition-hint');
  if (!firstHint) { firstHint = document.createElement('p'); firstHint.id = 'model-definition-hint'; firstHint.className = 'small definition-hint'; document.querySelector('#model pre').after(firstHint); }
  firstHint.textContent = t('definitionHint');
  for (const cell of document.querySelectorAll('[data-help-entry]')) cell.textContent = t(definitions[cell.dataset.helpEntry].description);
 }
 function schedule() { close(); if (!scheduled) { scheduled = true; requestAnimationFrame(enhance); } }
 document.addEventListener('click',event => {
  const button = event.target.closest('[data-definition]');
  if (button) { if (button === opener && !panel.hidden) close(true); else show(button.dataset.definition,button); }
  else if (!panel.contains(event.target)) close();
 });
 document.addEventListener('pointerover',event => { const button = event.target.closest('[data-definition]'); if (button && !button.contains(event.relatedTarget)) preview(button); });
 document.addEventListener('pointerout',event => { if (event.target.closest('[data-definition]')) { clearTimeout(delay); hideDelay = setTimeout(hidePreview,120); } });
 tooltip.addEventListener('pointerenter',()=>clearTimeout(hideDelay)); tooltip.addEventListener('pointerleave',hidePreview);
 document.addEventListener('focusin',event => { const button = event.target.closest('[data-definition]'); if (button && !restoringFocus) requestAnimationFrame(()=>{ if (document.activeElement === button) preview(button,true); }); });
 document.addEventListener('focusout',event => { if (event.target.closest('[data-definition]')) hidePreview(); });
 document.addEventListener('keydown',event => { if (event.key === 'Escape' && (!panel.hidden || !tooltip.hidden)) { event.preventDefault(); close(!panel.hidden); } });
 document.addEventListener('scroll',hidePreview,true); window.addEventListener('resize',hidePreview); window.addEventListener('hashchange',()=>close());
 document.addEventListener('course-language-will-change',()=>close());
 for (const event of ['course-query-change','course-content-change','course-language-change']) document.addEventListener(event,schedule);
 schedule();
})();
