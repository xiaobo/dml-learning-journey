(function () {
 'use strict';
 const catalogs = window.SmallJourneyLocales;
 const supported = ['en','zh','ja','de'];
 const storageKey = 'dml-small-journey-language-v1';
 let locale = document.documentElement.dataset.courseLocale || 'en';
 try { const saved = localStorage.getItem(storageKey); if (!document.documentElement.dataset.courseLocale && supported.includes(saved)) locale = saved; } catch {}
 const select = document.getElementById('course-language');
 function names(text) {
  const terms=window.DMLLearningSamples?.[locale]?.terms || {};
  return text.replace(/TABLE_[A-Z_]+\.[A-Za-z_]+|[A-Za-z_][A-Za-z_0-9]*/g,k=>terms[k]||k);
 }
 function t(key,args={}) {
  let value = catalogs[locale].ui[key] ?? catalogs.en.ui[key];
  if (typeof value === 'object') value = value[new Intl.PluralRules(locale).select(args.n)] || value.other;
  if (typeof value !== 'string') throw Error('Missing message: '+key);
  return names(value.replace(/\{(\w+)\}/g,(match,name) => args[name] === undefined ? match : String(args[name])));
 }
 function staticText() {
  for (const element of document.querySelectorAll('[data-i18n]')) {
   const key = element.dataset.i18n;
   element.innerHTML = (catalogs[locale].static[key] ?? catalogs.en.static[key]).split(/(<[^>]+>)/).map(part=>part.startsWith('<')?part:names(part)).join('');
  }
  for (const attr of ['aria-label','alt']) {
   for (const element of document.querySelectorAll('[data-i18n-'+attr+']')) {
    const key = element.getAttribute('data-i18n-'+attr);
    element.setAttribute(attr,catalogs[locale].static[key] ?? catalogs.en.static[key]);
   }
  }
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : locale;
  document.title = document.documentElement.dataset.searchTitle || t('pageTitle');
  select.value = locale; select.setAttribute('aria-label',t('language'));
  document.getElementById('language-label').textContent = t('language');
 }
 function change(next) {
  if (!supported.includes(next) || locale === next) return;
  if (document.documentElement.dataset.courseLocale) { try { localStorage.setItem(storageKey,next); } catch {} location.assign('journey.'+next+'.html'+location.search+location.hash); return; }
  const line = document.querySelector('.topbar').getBoundingClientRect().bottom;
  const anchors = [...document.querySelectorAll('main section.chapter, main h2, main form, main .stage-board, main .lab-controls, main pre')]
   .map(element => ({element,top:element.getBoundingClientRect().top,height:element.getBoundingClientRect().height}))
   .filter(item => item.height && item.top < window.innerHeight).sort((a,b) => Math.abs(a.top-line)-Math.abs(b.top-line));
  const anchor = anchors[0];
  document.dispatchEvent(new Event('course-language-will-change'));
  locale = next; staticText();
  try { localStorage.setItem(storageKey,locale); } catch {}
  document.dispatchEvent(new Event('course-language-change'));
  if (anchor) requestAnimationFrame(() => window.scrollBy({top:anchor.element.getBoundingClientRect().top-anchor.top,behavior:'instant'}));
 }
 window.SmallJourneyI18n = {
  t, change, names,
  get locale() { return locale; },
  chapter(index) { return catalogs[locale].chapters[index]; },
  quiz(quiz) { const base={...quiz,...catalogs[locale].quizzes[quiz.chapter]}; for(const key of ['question','hint','explanation']) if(typeof base[key]==='string') base[key]=names(base[key]); base.options=base.options.map(names); return base; },
  number(value) { return new Intl.NumberFormat(locale,{maximumFractionDigits:2,useGrouping:false}).format(value); },
  percent(value) { return new Intl.NumberFormat(locale,{style:'percent',maximumFractionDigits:2,useGrouping:false}).format(value); }
 };
 select.addEventListener('change',() => change(select.value));
 staticText();
})();
