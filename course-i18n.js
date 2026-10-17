(function () {
 'use strict';
 const catalogs = window.SmallJourneyLocales;
 const supported = ['en','zh','ja','de'];
 const storageKey = 'dml-small-journey-language-v1';
 let locale = 'en';
 try { const saved = localStorage.getItem(storageKey); if (supported.includes(saved)) locale = saved; } catch {}
 const select = document.getElementById('course-language');
 function t(key,args={}) {
  let value = catalogs[locale].ui[key] ?? catalogs.en.ui[key];
  if (typeof value === 'object') value = value[new Intl.PluralRules(locale).select(args.n)] || value.other;
  if (typeof value !== 'string') throw Error('Missing message: '+key);
  return value.replace(/\{(\w+)\}/g,(match,name) => args[name] === undefined ? match : String(args[name]));
 }
 function staticText() {
  for (const element of document.querySelectorAll('[data-i18n]')) {
   const key = element.dataset.i18n;
   element.innerHTML = catalogs[locale].static[key] ?? catalogs.en.static[key];
  }
  for (const attr of ['aria-label','alt']) {
   for (const element of document.querySelectorAll('[data-i18n-'+attr+']')) {
    const key = element.getAttribute('data-i18n-'+attr);
    element.setAttribute(attr,catalogs[locale].static[key] ?? catalogs.en.static[key]);
   }
  }
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : locale;
  document.title = t('pageTitle');
  select.value = locale; select.setAttribute('aria-label',t('language'));
  document.getElementById('language-label').textContent = t('language');
 }
 function change(next) {
  if (!supported.includes(next) || locale === next) return;
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
  t, change,
  get locale() { return locale; },
  chapter(index) { return catalogs[locale].chapters[index]; },
  quiz(quiz) { return {...quiz,...catalogs[locale].quizzes[quiz.chapter]}; },
  number(value) { return new Intl.NumberFormat(locale,{maximumFractionDigits:2,useGrouping:false}).format(value); },
  percent(value) { return new Intl.NumberFormat(locale,{style:'percent',maximumFractionDigits:2,useGrouping:false}).format(value); }
 };
 select.addEventListener('change',() => change(select.value));
 staticText();
})();
