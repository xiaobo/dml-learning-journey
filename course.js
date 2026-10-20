(function () {
	'use strict';
	// Remove only this tutorial's retired analytics data; keep learning preferences.
	function clearRetiredAnalytics() {
		if (location.hostname !== 'xiaobo.github.io' || !location.pathname.startsWith('/dml-learning-journey/')) return;
		try {
			localStorage.removeItem('dml-analytics-choice-v1');
			for (const part of document.cookie.split(';')) {
				const name = part.split('=')[0].trim();
				if (name.startsWith('dmljourney_')) document.cookie = name+'=; Max-Age=0; Path=/; SameSite=Lax; Secure';
			}
		} catch { /* Storage can be unavailable; the tutorial still works. */ }
	}
	clearRetiredAnalytics();
	const data = window.SmallJourneyCourse;
	const snapshots = window.SmallJourneyObservations;
	const $ = id => document.getElementById(id);
	const i18n = window.SmallJourneyI18n, t = i18n.t;
	const chapterIds = [...data.quizzes.map(q => q.chapter),'capstone'];
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const rewards = window.SmallJourneyRewards;
	let celebrationDelay, celebrationReveal;
	const storageKey = 'dml-small-journey-progress-v1';
	let completed = new Set();
	try {
		const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
		if (Array.isArray(stored)) completed = new Set(stored.filter(id => chapterIds.includes(id)));
	} catch { /* The lessons also work when local storage is unavailable. */ }
	function updateProgress() {
		$('course-progress').value = completed.size;
		$('progress-label').textContent = t('progress',{n:completed.size,total:chapterIds.length});
		$('progress-label').setAttribute('aria-label',t('progressAria',{n:completed.size,total:chapterIds.length}));
		$('learning-progress').dataset.complete = String(completed.size === chapterIds.length);
		for (const progress of document.querySelectorAll('.reward-progress')) progress.textContent = t('stops',{n:completed.size,total:chapterIds.length});
		for (const trail of document.querySelectorAll('.reward-journey')) updateStops(trail);
		const next = chapterIds.find(id => !completed.has(id));
		const entry = $('start-learning');
		entry.href = '#'+(next || 'capstone');
		entry.textContent = t(!next ? 'review' : completed.size ? 'resumeChapter' : 'startLearning',{n:chapterIds.indexOf(next)+1});
		$('learning-progress').dataset.resume = next || 'capstone';
		$('resume-learning').href = '#'+(next || 'capstone');
		$('resume-learning').textContent = t(next ? 'resume' : 'review');
		$('reset-progress').textContent = t('reset');
		for (const id of chapterIds) {
			const anchor = document.querySelector(`.chapter-nav a[href="#${id}"]`);
			anchor.dataset.complete = String(completed.has(id));
			anchor.setAttribute('aria-label',t(completed.has(id) ? 'chapterDoneAria' : 'chapterAria',{n:chapterIds.indexOf(id)+1,name:i18n.chapter(chapterIds.indexOf(id))}));
		}
		try { localStorage.setItem(storageKey,JSON.stringify([...completed])); } catch {}
		document.dispatchEvent(new Event('course-progress-change'));
	}
	function finishChapter(id) {
		const first = !completed.has(id); completed.add(id); updateProgress();
		return first;
	}
	function updateStops(trail) {
		trail.setAttribute('aria-label',t('stops',{n:completed.size,total:chapterIds.length}));
		for (const stop of trail.children) stop.classList.toggle('visited',completed.has(stop.dataset.stopChapter));
	}
	function journey() {
		const trail = document.createElement('div'); trail.className = 'reward-journey'; trail.setAttribute('role','img');
		for (const id of chapterIds) { const stop = document.createElement('span'); stop.dataset.stopChapter = id; stop.setAttribute('aria-hidden','true'); trail.append(stop); }
		updateStops(trail); return trail;
	}
	function planet() {
		const mark = document.createElement('span'); mark.className = 'reward-planet'; mark.setAttribute('aria-hidden','true');
		const image = document.createElement('img'); image.src = 'assets--journey-planet.svg'; image.alt = ''; image.width = 180; image.height = 180; mark.append(image);
		return mark;
	}
	$('journey-track').append(journey());
	function clearCelebration() {
		clearTimeout(celebrationDelay); celebrationDelay = undefined;
		celebrationReveal?.cancel(); celebrationReveal = undefined;
		rewards.clear();
	}
	document.addEventListener('course-navigation-change',clearCelebration);
	document.addEventListener('course-language-will-change',clearCelebration);
	window.addEventListener('hashchange',clearCelebration);
	window.addEventListener('pagehide',clearCelebration);
	document.addEventListener('visibilitychange',() => { if (document.hidden) clearCelebration(); });
	reducedMotion.addEventListener('change',event => { if (event.matches) clearCelebration(); });
	function celebrate(host) {
		rewards.play(host);
	}
	function showCompletion(host,first) {
		clearCelebration();
		const reduced = reducedMotion.matches;
		const needsScroll = host.getBoundingClientRect().bottom > window.innerHeight-20;
		if (needsScroll) host.scrollIntoView({block:'nearest',behavior:reduced ? 'instant' : 'smooth'});
		if (reduced || typeof host.animate !== 'function') return;
		if (!first) { rewards.play(host,true); return; }
		celebrationReveal = host.animate([{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:850,easing:'ease-in-out'});
		celebrationDelay = setTimeout(() => {
			celebrationDelay = undefined;
			if (host.isConnected && !host.hidden) celebrate(host);
		},needsScroll ? 700 : 160);
	}
	function clearFeedback(form,feedback) {
		clearCelebration();
		feedback.className = 'feedback'; feedback.replaceChildren(); delete feedback.dataset.state;
		delete form.dataset.result;
		delete feedback.dataset.kind;
		delete feedback.dataset.finalMilestone;
		for (const option of form.querySelectorAll('.answer-option')) delete option.dataset.correct;
	}
	function reward(form,feedback,quiz,index,first=false) {
		const finalMilestone = first && completed.size === chapterIds.length || feedback.dataset.finalMilestone === 'true';
		clearFeedback(form,feedback); form.dataset.result = 'correct'; feedback.dataset.state = 'correct'; feedback.classList.add('reward-feedback');
		if (finalMilestone) feedback.dataset.finalMilestone = 'true';
		const header = document.createElement('div'); header.className = 'reward-header';
		const mark = planet();
		const text = document.createElement('div'), title = document.createElement('strong'), progress = document.createElement('span');
		feedback.dataset.kind = 'correct';
		title.className = 'reward-title'; title.textContent = t(finalMilestone ? 'journeyComplete' : first ? 'award' : 'chapterComplete',{n:index+1});
		progress.className = 'reward-progress'; progress.textContent = t('stops',{n:completed.size,total:chapterIds.length});
		text.append(title,progress); header.append(mark,text);
		const explanation = document.createElement('p'); explanation.textContent = i18n.quiz(quiz).why; feedback.append(header,journey(),explanation);
		form.querySelector('input:checked')?.closest('.answer-option').setAttribute('data-correct','true');
		rewards.decorate(feedback,index,finalMilestone);
	}
	for (const [index,quiz] of data.quizzes.entries()) {
		const initialWords = i18n.quiz(quiz);
		const form = document.createElement('form'); form.className = 'chapter-check'; form.id = quiz.chapter+'-check'; form.setAttribute('aria-labelledby',quiz.chapter+'-question');
		const fieldset = document.createElement('fieldset');
		const legend = document.createElement('legend'); legend.id = quiz.chapter+'-question'; legend.textContent = t('tryQuestion',{question:initialWords.question}); fieldset.append(legend);
		initialWords.options.forEach((option,i) => {
			const label = document.createElement('label'); label.className = 'answer-option';
			const input = document.createElement('input'); input.type = 'radio'; input.name = 'chapter-'+quiz.chapter; input.value = String(i);
			if (completed.has(quiz.chapter) && i === quiz.answer) input.checked = true;
			label.append(input,document.createTextNode(option)); fieldset.append(label);
		});
		const actions = document.createElement('div'); actions.className = 'actions';
		const check = document.createElement('button'); check.type = 'submit'; check.textContent = t('checkChapter',{n:index+1});
		const submitNote = document.createElement('p'); submitNote.className = 'answer-submit-note'; submitNote.id = quiz.chapter+'-submit-note'; submitNote.setAttribute('role','status');
		check.setAttribute('aria-describedby',submitNote.id);
		function updateSubmitNote() {
			submitNote.hidden = feedback.dataset.kind === 'correct';
			submitNote.textContent = t(form.querySelector('input:checked') ? 'submitSelected' : 'submitInstruction');
			check.setAttribute('aria-label',t('submitChapter',{n:index+1}));
		}
		const hint = document.createElement('button'); hint.type = 'button'; hint.className = 'secondary'; hint.textContent = t('hint');
		const feedback = document.createElement('div'); feedback.className = 'feedback'; feedback.setAttribute('role','status'); feedback.setAttribute('aria-atomic','true');
		hint.addEventListener('click',() => { clearFeedback(form,feedback); feedback.dataset.kind = 'hint'; feedback.textContent = t('hintAnswer',{why:i18n.quiz(quiz).why}); updateSubmitNote(); });
		form.addEventListener('change',() => { clearFeedback(form,feedback); updateSubmitNote(); });
		form.addEventListener('reset',() => requestAnimationFrame(updateSubmitNote));
		form.addEventListener('submit',event => {
			event.preventDefault(); const selected = form.querySelector('input:checked');
			clearFeedback(form,feedback);
			if (!selected) { feedback.textContent = t('chooseAnswer'); feedback.dataset.kind = 'choose'; feedback.dataset.state = 'retry'; return; }
			const correct = Number(selected.value) === quiz.answer;
			if (correct) {
				const first = finishChapter(quiz.chapter); reward(form,feedback,quiz,index,first);
				showCompletion(feedback,first);
			} else { feedback.textContent = t('wrongAnswer',{why:i18n.quiz(quiz).why}); feedback.dataset.kind = 'wrong'; feedback.dataset.state = 'retry'; }
			updateSubmitNote();
		});
		actions.append(check,hint); form.append(fieldset,submitNote,actions,feedback); $(quiz.chapter).append(form);
		if (completed.has(quiz.chapter)) reward(form,feedback,quiz,index);
		function translateQuiz() {
			const words = i18n.quiz(quiz);
			legend.textContent = t('tryQuestion',{question:words.question});
			[...form.querySelectorAll('.answer-option')].forEach((label,i) => { label.lastChild.textContent = words.options[i]; });
			check.textContent = t('checkChapter',{n:index+1}); hint.textContent = t('hint');
			updateSubmitNote();
			const kind = feedback.dataset.kind;
			if (kind === 'correct') reward(form,feedback,quiz,index);
			else if (kind === 'choose') feedback.textContent = t('chooseAnswer');
			else if (kind === 'hint' || kind === 'wrong') feedback.textContent = t(kind === 'hint' ? 'hintAnswer' : 'wrongAnswer',{why:words.why});
		}
		translateQuiz(); document.addEventListener('course-language-change',translateQuiz);
	}
	$('reset-progress').addEventListener('click',() => {
		$('chapter-menu').open = false; $('chapter-toggle').focus();
		completed.clear();
		for (const form of document.querySelectorAll('.chapter-check')) { form.reset(); clearFeedback(form,form.querySelector('.feedback')); }
		finalReport(); updateProgress();
	});
	const number = n => n === null ? 'NULL' : i18n.number(n);
	const percent = n => n === null ? 'NULL' : i18n.percent(n);
	function table(id,columns,rows) {
		const host = $(id);
		let el = host.querySelector('table');
		if (!el) {
			el = document.createElement('table');
			el.createTHead().insertRow(); el.createTBody();
		}
		function cells(line,values,header=false) {
			while (line.cells.length > values.length) line.deleteCell(-1);
			values.forEach((value,index) => {
				let cell = line.cells[index];
				if (!cell) { cell = document.createElement(header ? 'th' : 'td'); if (header) cell.scope = 'col'; line.append(cell); }
				const text = value === null ? 'NULL' : String(value);
				if (cell.textContent !== text) cell.textContent = text;
			});
		}
		cells(el.tHead.rows[0],columns,true);
		const body = el.tBodies[0];
		while (body.rows.length > rows.length) body.deleteRow(-1);
		rows.forEach((row,index) => cells(body.rows[index] || body.insertRow(),row));
		if (!el.isConnected) host.append(el);
	}
	const current = (month='2025-02-01',region='all') => data.rows.filter(row => row.dt_month === month && (region === 'all' || row.region === region));
	const sum = rows => rows.length ? rows.reduce((n,row) => n+row.amount,0) : null;
	function previousMonth(month) { const date = new Date(month+'T00:00:00Z'); date.setUTCMonth(date.getUTCMonth()-1); return date.toISOString().slice(0,10); }
	function grouped(rows,fields) {
		const groups = new Map();
		for (const row of rows) { const key = JSON.stringify(fields.map(field => row[field])); if (!groups.has(key)) groups.set(key,{key:fields.map(field => row[field]),rows:[]}); groups.get(key).rows.push(row); }
		return [...groups.values()];
	}
	function queryFor(measures,{month='2025-02-01',region='all',fields=['region']}={}) {
		return 'SELECT '+[...fields,...measures.map(name => `AGG(${name})`)].join(', ')+'\nFROM MODEL\nWHERE dt_month = '+`'${month}'`+(region !== 'all' ? ` AND region = '${region}'` : '')+(fields.length ? '\nGROUP BY '+fields.join(', ') : '');
	}
	function customerValues(rows) { return grouped(rows,['customer']).map(group => sum(group.rows)); }
	function metrics(rows,{month,region,groupRegion}) {
		const total = sum(rows), prior = current(previousMonth(month),groupRegion || region), previous = sum(prior);
		const customers = customerValues(rows), completedRows = rows.filter(row => row.status === 'completed');
		const allTotal = sum(current(month));
		return {
			sales:total,completed_sales:sum(completedRows),previous_sales:previous,
			average_customer_sales:customers.length ? customers.reduce((a,b) => a+b,0)/customers.length : null,
			all_region_share:allTotal ? total/allTotal : null,
			sales_change:previous ? total/previous-1 : null
		};
	}
	$('full-model').textContent = data.model;
	$('final-full-model').textContent = data.model;
	const atomicDeclarations = new Map([...data.model.match(/  measures:\n((?:    [^\n]+\n)+)/)[1].matchAll(/^    (\w+): (.*)$/gm)].map(match => [match[1],match[0]]));
	const compositeDeclarations = new Map(data.model.split(/\n(?=\w+:\n)/).filter(block => /^\w+:\n  type: measure\n/.test(block)).map(block => [block.split(':')[0],block.trim()]));
	function modelNotebook(measures) {
		const needed = new Set();
		function include(name) {
			if (needed.has(name)) return;
			const declaration = atomicDeclarations.get(name) || compositeDeclarations.get(name);
			if (!declaration) return;
			needed.add(name);
			for (const reference of declaration.matchAll(/\{(\w+)/g)) include(reference[1]);
		}
		measures.forEach(include);
		const atomic = [...atomicDeclarations].filter(([name]) => needed.has(name)).map(([,code]) => code);
		const composite = [...needed].filter(name => compositeDeclarations.has(name)).map(name => compositeDeclarations.get(name));
		return [atomic.length ? 'FACT_SALES:\n  measures:\n'+atomic.join('\n') : '',...composite].filter(Boolean).join('\n\n');
	}
	table('extended-source',['id','region','customer','dt_month','status','amount'],data.rows.map(row => [row.id,row.region,row.customer,row.dt_month,row.status,row.amount]));
	function filters() {
		const region = $('filter-region').value;
		$('filter-query').textContent = queryFor(['sales','completed_sales'],{region});
		table('filter-result',['region','sales','completed_sales'],grouped(current(undefined,region),['region']).map(g => [g.key[0],sum(g.rows),sum(g.rows.filter(r => r.status === 'completed'))]));
		$('filter-note').textContent = t(region === 'South' ? 'filterSouth' : 'filterNorth')+' '+t('filterExplanation');
	}
	function shares() {
		const region = $('share-region').value, remove = $('share-mode').value === 'remove', modifier = remove ? '-df' : '-d', name = remove ? 'all_region_share' : 'within_slice_share';
		const denominator = sum(current(undefined,remove ? 'all' : region));
		$('share-formula').textContent = `${name}:\n  type: measure\n  formula: 'DIVIDE({sales}, {sales: {${modifier}: region}})'`;
		$('share-context').textContent = t(remove || region === 'all' ? 'denominatorAll' : 'denominatorRegion',{n:number(denominator),region});
		$('share-query').textContent = queryFor(['sales',name],{region});
		table('share-result',['region','sales',name+' (%)'],grouped(current(undefined,region),['region']).map(g => [g.key[0],sum(g.rows),percent(sum(g.rows)/denominator)]));
	}
	function grain() {
		const op = $('grain-operation').value;
		const name = {AVG:'average_customer_sales',SUM:'sum_customer_sales',MAX:'max_customer_sales'}[op];
		$('grain-formula').textContent = `${name}:\n  type: measure\n  formula: '${op}({sales: {+d: customer}})'`;
		const detail = grouped(current(),['region','customer']);
		table('grain-detail',['region','customer',t('customerSales')],detail.map(g => [...g.key,sum(g.rows)]));
		table('grain-result',['region',name,t('averageTransaction')],grouped(current(),['region']).map(g => {
			const values = customerValues(g.rows), total = sum(g.rows);
			const value = op === 'AVG' ? values.reduce((a,b) => a+b,0)/values.length : op === 'SUM' ? total : Math.max(...values);
			return [g.key[0],number(value),number(total/g.rows.length)];
		}));
		$('grain-query').textContent = queryFor([...(op === 'AVG' ? ['average_sale'] : []),name]);
	}
	function time() {
		const month = $('time-month').value;
		$('time-query').textContent = queryFor(['sales','previous_sales','sales_change'],{month,fields:['region','dt_month']});
		table('time-result',['region','sales','previous_sales','sales_change (%)'],grouped(current(month),['region']).map(g => {
			const m = metrics(g.rows,{month,region:'all',groupRegion:g.key[0]}); return [g.key[0],m.sales,m.previous_sales,percent(m.sales_change)];
		}));
	}
	function lookups() {
		const duplicate = $('duplicate-key').checked, directory = [...data.regions,...(duplicate ? [{region:'North',manager:'Grace'}] : [])];
		const joined = current().flatMap(row => directory.filter(d => d.region === row.region).map(d => ({...row,manager:d.manager})));
		table('lookup-directory',['region','manager'],directory.map(r => [r.region,r.manager]));
		table('lookup-rows',['id','region','manager','amount'],joined.map(r => [r.id,r.region,r.manager,r.amount]));
		$('lookup-note').textContent = t(duplicate ? 'lookupInvalid' : 'lookupValid');
	}
	function missing() {
		const filled = $('missing-mode').value === 'zero', name = filled ? 'previous_sales_filled' : 'previous_sales';
		$('missing-formula').textContent = `${name}:\n  type: measure\n  formula: '${filled ? 'ISNULL({sales: pp}, 0)' : '{sales: pp}'}'`;
		table('missing-result',['region',t('januarySales'),name],grouped(current('2025-01-01'),['region']).map(g => [g.key[0],sum(g.rows),filled ? 0 : null]));
	}
	function finalState() {
		return {month:$('final-month').value,region:$('final-region').value,fields:$('final-group').value === 'region' ? ['region'] : [],measures:[...$('final-measures').querySelectorAll('input:checked')].map(input => input.value)};
	}
	function finalReport(clear=true) {
		clearCelebration();
		const state = finalState();
		$('final-model-excerpt').textContent = modelNotebook(state.measures);
		$('final-query').textContent = queryFor(state.measures,state);
		const rows = current(state.month,state.region), groups = state.fields.length ? grouped(rows,state.fields) : [{key:[],rows}];
		table('final-result',[...state.fields,...state.measures.map(name => name+(name.endsWith('share') || name === 'sales_change' ? ' (%)' : ''))],groups.map(group => {
			const values = metrics(group.rows,{...state,groupRegion:state.fields.length ? group.key[0] : null});
			return [...group.key,...state.measures.map(name => name.endsWith('share') || name === 'sales_change' ? percent(values[name]) : number(values[name]))];
		}));
		if (clear) { $('final-feedback').textContent = ''; delete $('final-feedback').dataset.state; delete $('final-feedback').dataset.kind;
		delete $('capstone-check').dataset.result; $('course-finish').hidden = true; }
	}
	$('final-hint').addEventListener('click',() => {
		clearCelebration();
		$('course-finish').hidden = true; delete $('capstone-check').dataset.result;
		delete $('final-feedback').dataset.state;
		$('final-feedback').dataset.kind = 'hint'; $('final-feedback').textContent = t('finalHint');
	});
	$('capstone-check').addEventListener('submit',event => {
		event.preventDefault();
		clearCelebration();
		$('course-finish').hidden = true; delete $('capstone-check').dataset.result;
		const state = finalState(), required = ['sales','completed_sales','previous_sales','average_customer_sales','all_region_share'];
		const missing = required.filter(name => !state.measures.includes(name));
		const issues = [...(state.month !== '2025-02-01' ? [t('selectFebruary')] : []),...(state.fields[0] !== 'region' ? [t('groupRegion')] : []),...(state.region !== 'all' ? [t('includeAll')] : []),...(missing.length ? [t('includeMeasures',{names:missing.join(', ')})] : [])];
		const p = $('final-feedback');
		if (issues.length) { p.textContent = t('finalIssues',{issues:issues.join('; ')}); p.dataset.state = 'retry'; p.dataset.kind = 'issues'; return; }
		finishChapter('capstone'); p.dataset.state = 'correct';
		$('capstone-check').dataset.result = 'correct';
		p.textContent = t('finalCorrect'); p.dataset.kind = 'correct';
		$('course-finish').hidden = false;
		$('course-finish').querySelector('h3').textContent = t(completed.size === chapterIds.length ? 'journeyComplete' : 'ready');
		if (!$('course-finish').querySelector('.reward-planet')) $('course-finish').prepend(planet());
		if (!$('course-finish').querySelector('.reward-journey')) $('course-finish').querySelector('h3').after(journey());
		rewards.decorate($('course-finish'),11,true);
		showCompletion($('course-finish'),true);
	});
	$('download-query').addEventListener('click',() => {
		const url = URL.createObjectURL(new Blob([$('final-query').textContent+'\n'],{type:'text/plain;charset=utf-8'}));
		const link = document.createElement('a'); link.href = url; link.download = 'query.sql'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url),1000);
	});
	for (const element of document.querySelectorAll('.compiler-observation')) {
		const item = snapshots.cases.find(c => c.name === element.dataset.probe);
		if (!item) { element.textContent = t('evidenceMissing'); continue; }
		const label = document.createElement('p');
		const details = document.createElement('details'), summary = document.createElement('summary');
		function translateEvidence() {
			label.textContent = t('evidenceRecord',{version:snapshots.version.split('\n')[0].replace('dmlc version ',''),status:item.status,exit:item.exit,note:t(item.status === 'findings' ? 'strictRemaining' : 'strictSucceeded')});
			summary.textContent = t(item.status === 'findings' ? 'evidenceFindings' : 'evidencePass',{exit:item.exit});
		}
		translateEvidence(); document.addEventListener('course-language-change',translateEvidence);
		const pre = document.createElement('pre'); pre.textContent = item.query+'\n\n'+item.diagnostics.map(d => d.severity+': '+d.message).join('\n')+'\n\n'+item.sql;
		details.append(summary,label,pre); element.append(details);
	}
	function contentChanged(chapter) { document.dispatchEvent(new CustomEvent('course-content-change',{detail:{chapter}})); }
	const bind = (ids,fn) => ids.forEach(id => $(id).addEventListener('change',() => { fn(); contentChanged($(id).closest('.chapter').id); }));
	bind(['filter-region'],filters); bind(['share-region','share-mode'],shares); bind(['grain-operation'],grain); bind(['time-month'],time); bind(['duplicate-key'],lookups); bind(['missing-mode'],missing); bind(['final-month','final-group','final-region','final-measures'],finalReport);
	filters(); shares(); grain(); time(); lookups(); missing(); finalReport(); updateProgress();
	if (completed.has('capstone')) { $('final-feedback').textContent = t('finalReview'); $('final-feedback').dataset.kind = 'review'; }
	function translateCourse() {
		filters(); shares(); grain(); time(); lookups(); missing(); finalReport(false); updateProgress();
		$('check-final').textContent = t('checkChapter',{n:12}); $('final-hint').textContent = t('hint'); $('download-query').textContent = t('downloadQuery');
		$('check-final').setAttribute('aria-label',t('submitChapter',{n:12}));
		$('course-finish').querySelector('h3').textContent = t(completed.size === chapterIds.length ? 'journeyComplete' : 'ready');
		if (!$('course-finish').hidden) rewards.decorate($('course-finish'),11,true);
		const feedback = $('final-feedback'), kind = feedback.dataset.kind;
		if (kind === 'hint' || kind === 'correct' || kind === 'review') feedback.textContent = t({hint:'finalHint',correct:'finalCorrect',review:'finalReview'}[kind]);
		if (kind === 'issues') $('capstone-check').dispatchEvent(new Event('submit',{cancelable:true}));
		contentChanged(null);
	}
	translateCourse(); document.addEventListener('course-language-change',translateCourse);
})();
