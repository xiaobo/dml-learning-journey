const article = document.querySelector('.repurchase');
const comparison = article.querySelector('[data-comparison]');
const items = key => [...article.querySelectorAll('[data-'+key+']')];
function select(key, index) {
  for (const button of items(key)) button.setAttribute('aria-pressed',String(button.dataset[key]===index));
}
function scenario(index) {
  select('scenario',index);
  for (const panel of items('case')) panel.hidden = panel.dataset.case!==index;
}
for (const button of items('scenario')) button.addEventListener('click',()=>scenario(button.dataset.scenario));
for (const button of items('vote')) button.addEventListener('click',()=>{
  select('vote',button.dataset.vote);
  for (const feedback of items('feedback')) feedback.hidden = feedback.dataset.feedback!==button.dataset.vote;
  scenario('0');
  comparison.hidden=false;
});
scenario('0');
article.querySelector('[data-voting]').hidden=false;
article.querySelector('[data-picker]').hidden=false;
