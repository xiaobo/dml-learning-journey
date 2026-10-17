(function () {
	'use strict';
	const t = window.SmallJourneyI18n.t;
	const query = document.getElementById('query-code');
	const queryCode = query.querySelector('code');
	const model = window.SmallJourneyCourse.model;
	const fact = model.slice(model.indexOf('\nFACT_SALES:')+1,model.indexOf('\naverage_sale:'));
	const declaration = name => fact.match(new RegExp('^    '+name+':.*$','m'))[0].trimStart();
	const definitions = {
		region:{kind:'definitionColumn',scope:'FACT_SALES.columns',code:declaration('region'),description:'definitionRegion',references:[]},
		id:{kind:'definitionColumn',scope:'FACT_SALES.columns',code:declaration('id'),description:'definitionId',references:[]},
		amount:{kind:'definitionColumn',scope:'FACT_SALES.columns',code:declaration('amount'),description:'definitionAmount',references:[]},
		sales:{kind:'definitionAtomic',scope:'FACT_SALES.measures',code:declaration('sales'),description:'definitionSales',references:['amount']},
		cnt:{kind:'definitionAtomic',scope:'FACT_SALES.measures',code:declaration('cnt'),description:'definitionCnt',references:[]},
		average_sale:{kind:'definitionComposite',scope:'model.dml',code:model.match(/^average_sale:\n(?:  .*\n)+/m)[0].trimEnd(),description:'definitionAverageSale',references:['sales','cnt']}
	};
	let selected, returnName;
	const hint = document.createElement('p'); hint.className = 'small definition-hint';
	const panel = document.createElement('aside'); panel.id = 'query-definition'; panel.className = 'query-definition'; panel.hidden = true; panel.setAttribute('aria-labelledby','query-definition-title');
	query.after(hint,panel);
	function symbol(name) {
		const button = document.createElement('button'); button.type = 'button'; button.className = 'query-symbol'; button.dataset.definition = name; button.textContent = name;
		button.setAttribute('aria-label',t('definitionOpen',{name})); button.setAttribute('aria-controls',panel.id);
		button.setAttribute('aria-expanded',String(selected === name));
		return button;
	}
	function updateExpanded() {
		for (const button of query.querySelectorAll('[data-definition]')) button.setAttribute('aria-expanded',String(button.dataset.definition === selected));
	}
	function close() {
		selected = undefined; panel.hidden = true; updateExpanded();
		const opener = [...query.querySelectorAll('[data-definition]')].find(button => button.dataset.definition === returnName);
		(opener || query.querySelector('button'))?.focus({preventScroll:true});
	}
	function show(name,focus=false) {
		const entry = definitions[name]; if (!entry) return;
		selected = name;
		const header = document.createElement('div'); header.className = 'definition-header';
		const title = document.createElement('h3'); title.id = 'query-definition-title'; title.tabIndex = -1; title.textContent = name;
		const dismiss = document.createElement('button'); dismiss.type = 'button'; dismiss.className = 'definition-close'; dismiss.textContent = '×'; dismiss.setAttribute('aria-label',t('definitionClose')); dismiss.addEventListener('click',close);
		header.append(title,dismiss);
		const location = document.createElement('p'); location.className = 'definition-location'; location.textContent = t(entry.kind)+' · '+entry.scope;
		const code = document.createElement('code'); code.textContent = entry.code;
		const pre = document.createElement('pre'); pre.append(code);
		const description = document.createElement('p'); description.textContent = t(entry.description);
		panel.replaceChildren(header,location,pre,description);
		if (entry.references.length) {
			const references = document.createElement('div'); references.className = 'definition-references';
			const label = document.createElement('span'); label.textContent = t('definitionReferences'); references.append(label);
			for (const dependency of entry.references) references.append(symbol(dependency));
			panel.append(references);
		}
		panel.hidden = false; updateExpanded();
		if (focus) { title.focus({preventScroll:true}); panel.scrollIntoView({block:'nearest'}); }
	}
	query.addEventListener('click',event => {
		const button = event.target.closest('[data-definition]'); if (!button) return;
		returnName = button.dataset.definition; show(returnName,true);
	});
	panel.addEventListener('click',event => {
		const button = event.target.closest('[data-definition]'); if (button) show(button.dataset.definition,true);
	});
	panel.addEventListener('keydown',event => { if (event.key === 'Escape') { event.preventDefault(); close(); } });
	function enhance() {
		const text = queryCode.textContent, code = document.createDocumentFragment();
		for (const part of text.split(/\b(region|id|sales|average_sale)\b/g)) code.append(definitions[part] ? symbol(part) : document.createTextNode(part));
		queryCode.replaceChildren(code); hint.textContent = t('definitionHint');
		if (selected) show(selected);
	}
	document.addEventListener('course-query-change',enhance);
	enhance();
})();
