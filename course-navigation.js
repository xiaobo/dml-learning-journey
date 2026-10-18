(function () {
	'use strict';
	const header = document.querySelector('.topbar');
	const i18n = window.SmallJourneyI18n, t = i18n.t;
	const chapters = [...document.querySelectorAll('.chapter-nav a')].map((link,index) => ({
		link,index,id:link.hash.slice(1),name:i18n.chapter(index),nameNode:[...link.childNodes].find(node => node.nodeType === 3 && node.textContent.trim()),section:document.querySelector(link.hash)
	}));
	const nav = document.querySelector('.topbar-inner nav'); nav.className = 'course-location';
	const previous = document.createElement('a'); previous.textContent = '←';
	const menu = document.getElementById('chapter-menu');
	const toggle = document.getElementById('chapter-toggle');
	const currentLabel = document.getElementById('chapter-current');
	const links = document.getElementById('chapter-menu-links');
	const next = document.createElement('a'); next.textContent = '→';
	function chapterLink(id,text) { const item = document.createElement('a'); item.href = '#'+id; item.textContent = text; links.append(item); return item; }
	links.replaceChildren();
	const introduction = chapterLink('journey',t('introduction'));
	for (const chapter of chapters) chapter.menuLink = chapterLink(chapter.id,`${chapter.index+1}. ${chapter.name}`);
	nav.prepend(previous); nav.append(next);
	nav.addEventListener('click',followLink);
	document.querySelector('.chapter-nav').addEventListener('click',followLink);
	document.addEventListener('click',event => { if (!menu.contains(event.target)) menu.open = false; });
	document.addEventListener('keydown',event => {
		if (event.key === 'Escape' && menu.open) { menu.open = false; toggle.focus(); }
	});
	menu.addEventListener('focusout',event => { if (event.relatedTarget && !menu.contains(event.relatedTarget)) menu.open = false; });
	function completion() {
		for (const chapter of chapters) {
			const done = chapter.link.dataset.complete === 'true';
			chapter.menuLink.textContent = `${chapter.index+1}. ${chapter.name}${done ? ' ✓' : ''}`;
			chapter.menuLink.setAttribute('aria-label',t(done ? 'chapterDoneAria' : 'chapterAria',{n:chapter.index+1,name:chapter.name}));
			let mark = chapter.link.querySelector('.chapter-completion');
			if (done && !mark) { mark = document.createElement('span'); mark.className = 'chapter-completion'; mark.textContent = ' ✓'; mark.setAttribute('aria-hidden','true'); chapter.link.append(mark); }
			if (!done && mark) mark.remove();
		}
		label();
	}
	let active;
	function label() {
		const chapter = chapters[active];
		currentLabel.textContent = chapter ? `${chapter.index+1}. ${chapter.name}${chapter.link.dataset.complete === 'true' ? ' ✓' : ''}` : t('introduction');
		toggle.setAttribute('aria-label',t('navChapters',{name:currentLabel.textContent}));
	}
	function locate() {
		const line = header.getBoundingClientRect().height+32;
		let current = -1;
		for (const chapter of chapters) { if (chapter.section.getBoundingClientRect().top <= line) current = chapter.index; else break; }
		if (current === active) return;
		active = current;
		label();
		if (current < 0) introduction.setAttribute('aria-current','location');
		else introduction.removeAttribute('aria-current');
		previous.hidden = current < 0;
		previous.href = '#'+(chapters[current-1]?.id || 'journey');
		previous.setAttribute('aria-label',current > 0 ? t('previous',{name:chapters[current-1].name}) : t('back'));
		next.href = '#'+(chapters[current+1]?.id || 'journey');
		next.textContent = chapters[current+1] ? '→' : '↶';
		next.setAttribute('aria-label',chapters[current+1] ? t('next',{n:current+2,name:chapters[current+1].name}) : t('back'));
		previous.title = previous.getAttribute('aria-label'); next.title = next.getAttribute('aria-label');
		for (const chapter of chapters) {
			for (const link of [chapter.link,chapter.menuLink]) {
				if (chapter.index === current) link.setAttribute('aria-current','location');
				else link.removeAttribute('aria-current');
			}
		}
		document.dispatchEvent(new CustomEvent('course-chapter-view',{detail:{chapter:chapters[current]?.id || 'journey'}}));
	}
	let scheduled = false;
	function schedule() {
		if (scheduled) return;
		scheduled = true; requestAnimationFrame(() => { scheduled = false; locate(); });
	}
	function headerSize() {
		document.documentElement.style.setProperty('--course-header-height',header.getBoundingClientRect().height+'px'); schedule();
	}
	function initialAnchor() {
		const target = document.getElementById(location.hash.slice(1));
		if (target) requestAnimationFrame(() => { target.scrollIntoView({block:'start'}); schedule(); });
	}
	function goTo(id) {
		const target = document.getElementById(id);
		if (!target) return;
		menu.open = false;
		document.dispatchEvent(new Event('course-navigation-change'));
		location.hash = id;
		target.scrollIntoView({block:'start'});
		const heading = target?.querySelector('h2,h1');
		if (heading) { heading.tabIndex = -1; heading.focus({preventScroll:true}); }
		active = undefined; locate();
	}
	function followLink(event) {
		const link = event.target.closest('a');
		if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
		event.preventDefault(); goTo(link.hash.slice(1));
	}
	window.addEventListener('hashchange',() => {
		menu.open = false;
		const target = document.getElementById(location.hash.slice(1));
		const heading = target?.querySelector('h2,h1');
		if (heading) { heading.tabIndex = -1; heading.focus({preventScroll:true}); }
		schedule();
	});
	window.addEventListener('scroll',schedule,{passive:true});
	window.addEventListener('resize',headerSize);
	if (typeof ResizeObserver !== 'undefined') new ResizeObserver(headerSize).observe(header);
	document.addEventListener('course-progress-change',completion);
	function translateNavigation() {
		for (const chapter of chapters) { chapter.name = i18n.chapter(chapter.index); chapter.nameNode.textContent = chapter.name; }
		introduction.textContent = t('introduction');
		completion(); active = undefined; headerSize(); locate();
	}
	document.addEventListener('course-language-change',translateNavigation);
	translateNavigation();
	if (document.readyState === 'complete') initialAnchor();
	else window.addEventListener('load',initialAnchor,{once:true});
})();
