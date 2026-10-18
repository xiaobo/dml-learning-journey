(function () {
 'use strict';
 const measurementId = 'G-MVE2VY7REB';
 // Keep local previews and other projects on the same github.io host out of this property.
 if (location.protocol !== 'https:' || location.hostname !== 'xiaobo.github.io' || !location.pathname.startsWith('/dml-learning-journey/')) return;
 if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;
 const preferenceKey = 'dml-analytics-choice-v1';
 const chapters = ['identity','model','expressions','grouping','compiler','filters','shares','grain','time','lookups','missing','capstone'];
 const messages = {
  en:{settings:'Analytics settings',title:'Optional usage statistics',text:'Allow Google Analytics cookies to measure visits and learning activity? Your answers and report contents are not sent. You can change this choice here.',allow:'Allow statistics',deny:'Decline',privacy:'Google privacy information'},
  zh:{settings:'访问统计设置',title:'可选的使用统计',text:'是否允许 Google Analytics 使用分析 Cookie，统计访问和学习活动？不会发送你的答案或报表内容。你可以在这里更改选择。',allow:'允许统计',deny:'拒绝',privacy:'Google 隐私说明'},
  ja:{settings:'アクセス解析の設定',title:'任意の利用状況の解析',text:'Google Analytics の Cookie を使って訪問と学習活動を集計してもよろしいですか？回答やレポートの内容は送信しません。設定はここで変更できます。',allow:'解析を許可',deny:'拒否する',privacy:'Google のプライバシー情報'},
  de:{settings:'Analyseeinstellungen',title:'Optionale Nutzungsstatistik',text:'Darf Google Analytics Cookies verwenden, um Besuche und Lernaktivitäten zu messen? Antworten und Berichtsinhalte werden nicht gesendet. Sie können Ihre Auswahl hier ändern.',allow:'Statistik erlauben',deny:'Ablehnen',privacy:'Google-Datenschutzinformationen'}
 };
 function language() {
  const code = window.SmallJourneyI18n?.locale || document.documentElement.lang.split('-')[0];
  return Object.hasOwn(messages,code) ? code : 'en';
 }
 let choice;
 try { choice = localStorage.getItem(preferenceKey); } catch {}
 let active = false, loaded = false, tutorialStarted = false, tutorialFinished = false;
 let currentChapter = chapters.includes(location.hash.slice(1)) ? location.hash.slice(1) : null;
 let previousLanguage = language();
 const viewed = new Set(), finished = new Set();
 const pageLocation = location.origin + location.pathname;
 let pageReferrer = '';
 try { const source = new URL(document.referrer); if (source.origin !== location.origin) pageReferrer = source.origin + '/'; } catch {}
 const page = {page_location:pageLocation,page_referrer:pageReferrer,page_title:'DML learning journey'};
 function send(name,properties={}) {
  if (!active || window['ga-disable-'+measurementId]) return;
  window.gtag('event',name,{...page,send_to:measurementId,course_language:language(),...properties});
 }
 function chapterView() {
  if (!active || document.hidden || !currentChapter || viewed.has(currentChapter)) return;
  viewed.add(currentChapter);
  send('chapter_view',{chapter_id:currentChapter,chapter_number:chapters.indexOf(currentChapter)+1});
 }
 function start() {
  window['ga-disable-'+measurementId] = false;
  if (!loaded) {
   loaded = true;
   window.dataLayer = window.dataLayer || [];
   window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
   window.gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
   window.gtag('js',new Date());
   // Google owns page_view; chapter navigation uses separate course events.
   window.gtag('config',measurementId,{...page,course_language:language(),allow_google_signals:false,allow_ad_personalization_signals:false,cookie_domain:'none',cookie_prefix:'dmljourney',cookie_expires:7776000});
   const script = document.createElement('script'); script.async = true;
   script.src = 'https://www.googletagmanager.com/gtag/js?id='+measurementId;
   script.onerror = () => { active = false; };
   document.head.append(script);
  } else window.gtag('consent','update',{analytics_storage:'granted'});
  active = true; chapterView();
 }
 function choose(next) {
  choice = next;
  try { localStorage.setItem(preferenceKey,next); } catch {}
  if (next === 'granted') start();
  else {
   active = false; window['ga-disable-'+measurementId] = true;
   if (loaded) window.gtag('consent','update',{analytics_storage:'denied'});
   // Clear only this tutorial's analytics cookies; lesson progress is separate.
   for (const part of document.cookie.split(';')) {
    const name = part.split('=')[0].trim();
    if (name.startsWith('dmljourney_')) document.cookie = name+'=; Max-Age=0; Path=/; SameSite=Lax; Secure';
   }
  }
  panel.hidden = true; settings.setAttribute('aria-expanded','false'); settings.focus({preventScroll:true});
 }
 const settings = document.createElement('button'); settings.type = 'button'; settings.className = 'analytics-settings';
 settings.setAttribute('aria-controls','analytics-choice'); settings.setAttribute('aria-expanded','false');
 const panel = document.createElement('aside'); panel.id = 'analytics-choice'; panel.className = 'analytics-choice';
 panel.setAttribute('aria-labelledby','analytics-choice-title');
 const title = document.createElement('strong'); title.id = 'analytics-choice-title';
 const text = document.createElement('p'), actions = document.createElement('div'); actions.className = 'analytics-actions';
 const allow = document.createElement('button'), deny = document.createElement('button'), privacy = document.createElement('a');
 allow.type = deny.type = 'button'; deny.className = 'secondary';
 privacy.href = 'https://policies.google.com/technologies/partner-sites'; privacy.target = '_blank'; privacy.rel = 'noopener noreferrer';
 allow.addEventListener('click',()=>choose('granted')); deny.addEventListener('click',()=>choose('denied'));
 actions.append(allow,deny,privacy); panel.append(title,text,actions);
 let footer = document.querySelector('footer');
 if(!footer){footer=document.createElement('footer');footer.className='analytics-footer';document.body.append(footer);}
 footer.append(settings); document.body.append(panel);
 function translate() {
  const words = messages[language()];
  settings.textContent = words.settings; title.textContent = words.title; text.textContent = words.text;
  allow.textContent = words.allow; deny.textContent = words.deny; privacy.textContent = words.privacy;
 }
 settings.addEventListener('click',()=>{panel.hidden = !panel.hidden; settings.setAttribute('aria-expanded',String(!panel.hidden));});
 document.addEventListener('keydown',event=>{if(event.key === 'Escape' && !panel.hidden){panel.hidden=true;settings.setAttribute('aria-expanded','false');settings.focus({preventScroll:true});}});
 document.addEventListener('course-chapter-view',event=>{const id=event.detail?.chapter;if(!chapters.includes(id))return;currentChapter=id;chapterView();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)chapterView();});
 document.addEventListener('course-chapter-complete',event=>{
  const id=event.detail?.chapter;
  if(!active || !chapters.includes(id) || finished.has(id)) return;
  finished.add(id); send('chapter_complete',{chapter_id:id,chapter_number:chapters.indexOf(id)+1});
  if(event.detail.completed === chapters.length && !tutorialFinished){tutorialFinished=true;send('tutorial_complete');}
 });
 document.addEventListener('course-language-change',()=>{
  translate(); const next=language();
  if(next!==previousLanguage){send('language_change',{previous_language:previousLanguage});previousLanguage=next;}
 });
 document.addEventListener('click',event=>{
  if(!active) return;
  const startLink = event.target.closest('#start-learning');
  if(startLink && !tutorialStarted){
   tutorialStarted=true;
   const isReview=document.getElementById('learning-progress')?.dataset.complete === 'true';
   send(isReview ? 'tutorial_review' : startLink.getAttribute('href') === '#identity' ? 'tutorial_begin' : 'tutorial_resume');
  }
  const link = event.target.closest('a[download], #download-query');
  if(!link) return;
  const href=link.getAttribute('href') || '';
  const kind = link.id === 'download-query' ? 'query' : /(?:^|\/)lesson-files\.zip$/.test(href) ? 'project' : /(?:^|\/)model\.dml$/.test(href) ? 'model' : null;
  if(kind) send('tutorial_download',{download_type:kind});
 });
 translate();
 panel.hidden = choice === 'granted' || choice === 'denied';
 settings.setAttribute('aria-expanded',String(!panel.hidden));
 if(choice === 'granted') start();
})();
