(function () {
 'use strict';
 const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
 const running = new Set();
 const svg = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" aria-hidden="true">${body}</svg>`;
 const world = '<ellipse cx="60" cy="85" rx="33" ry="28" fill="#cbd7c3" stroke="#8b9c89"/><path d="M29 83q30 28 63-3" stroke="#a8bdb0"/><path d="M35 72q10-14 22-10l-8 10Z" fill="#eee5c7"/>';
 const rose = '<path d="M60 61V36m0 16q-13-1-13-12 12 1 13 12m0-8q12 0 12-10-10 1-12 10" stroke="#83966e" stroke-width="2"/><g class="rose-petals"><path d="M60 37C40 34 42 14 54 19c3-12 16-10 17 0 15-1 14 17-11 18Z" fill="#d8a29d"/><path d="M49 23q12 16 23-1M56 22q8-8 10 1-1 8-8 3" stroke="#b87d82" stroke-width="1.5"/></g>';
 const plane = '<g class="paper-plane"><path d="m38 63 43-24-11 40-12-17-20 1Z" fill="#faf5df" stroke="#849b99" stroke-linejoin="round"/><path d="m58 62 23-23-15 30" stroke="#849b99"/></g>';
 const pictures = {
  bloom: svg(world+rose),
  flight: svg('<path class="flight-path" d="M16 84C-4 55 56 89 55 46S112 7 101 35" stroke="#a3b9b3" stroke-dasharray="3 5" stroke-linecap="round"/>'+plane),
  orbit: svg('<ellipse class="orbit-path" cx="60" cy="66" rx="49" ry="21" transform="rotate(-22 60 66)" stroke="#b4c3b9" stroke-dasharray="3 5"/><circle cx="60" cy="66" r="27" fill="#c8d6cb" stroke="#8a9e92"/><path d="M40 56q12-16 24-12l-7 11-17 1Z" fill="#eee7cc"/><g class="orbit-moon"><circle cx="103" cy="48" r="8" fill="#dfb9ad" stroke="#bb9590"/></g>'),
  notebook: svg('<path d="M60 36Q40 21 21 31v58q21-9 39 5 18-14 39-5V31Q78 21 60 36Z" fill="#f4edd9" stroke="#8d9b89" stroke-width="1.5"/><path d="M60 37v57M31 45l18 3M31 56l18 3M31 67l18 3" stroke="#b5bda7"/><g class="notebook-page"><path d="M60 36q17-14 37-6v58q-21-6-37 6Z" fill="#faf7e9" stroke="#8d9b89"/><path d="m70 46 17-3m-17 15 17-3m-17 15 17-3" stroke="#b5bda7"/></g>')
 };
 const variants = ['bloom','notebook','orbit','flight','notebook','bloom','orbit','notebook','flight','orbit','bloom','flight'];
 function animate(element, frames, options) {
  if (!element || motion.matches || typeof element.animate !== 'function') return;
  const animation = element.animate(frames,{easing:'cubic-bezier(.4,0,.2,1)',...options});
  running.add(animation);
  const done = () => running.delete(animation);
  animation.finished.then(done,done);
 }
 function clear() { for (const animation of running) animation.cancel(); running.clear(); }
 function finale() {
  const scene = document.createElement('div'); scene.className = 'journey-finale'; scene.setAttribute('aria-hidden','true');
  let worlds = '';
  for (let n=0;n<12;n++) {
   const angle = (n/12)*Math.PI*2, x=300+Math.cos(angle)*236, y=83+Math.sin(angle)*54;
   worlds += `<g class="finale-world" style="--stop:${n}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)})"><circle r="${n%3===0?10:7}" fill="${['#c4d4c5','#dfb9ad','#dedbc2'][n%3]}" stroke="#91a69a"/><path d="M-5 0q5 5 10-1" stroke="#a0b2a0"/></g>`;
  }
  scene.innerHTML = `<svg viewBox="0 0 600 168" fill="none"><path class="finale-route" d="M536 83a236 54 0 1 1-472 0 236 54 0 1 1 472 0" stroke="#a8bfb5" stroke-dasharray="2 6" stroke-linecap="round"/>${worlds}<g class="finale-home" transform="translate(240 12)">${world}${rose}</g><g class="finale-plane" transform="translate(190 -10)">${plane}</g></svg>`;
  return scene;
 }
 function decorate(host,index,complete=false) {
  const variant=variants[index%variants.length];
  host.dataset.reward=variant;
  const mark=host.querySelector('.reward-planet');
  if(mark) mark.innerHTML=pictures[variant];
  host.querySelector('.journey-finale')?.remove();
  host.querySelector('.reward-replay')?.remove();
  host.classList.toggle('has-finale',complete);
  if(complete) {
   host.append(finale());
   const replay=document.createElement('button'); replay.type='button'; replay.className='secondary reward-replay';
   replay.textContent=window.SmallJourneyI18n.t('replayCelebration');
   replay.addEventListener('click',()=>{clear();play(host);}); host.append(replay);
  }
 }
 function play(host,review=false) {
  if(motion.matches || host.hidden) return;
  const mark=host.querySelector('.reward-planet'), variant=host.dataset.reward;
  if(review) {animate(mark,[{transform:'scale(1)'},{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:600});return;}
  // Each drawing grows into the space around its icon, then settles back into the page.
  animate(mark,[{transform:'scale(1)'},{transform:'scale(1.6)',offset:.4},{transform:'scale(1.55)',offset:.62},{transform:'scale(1)'}],{duration:2600});
  if(variant==='bloom') animate(host.querySelector('.reward-planet .rose-petals'),[{transform:'scale(.55) rotate(-12deg)'},{transform:'scale(1.12) rotate(3deg)',offset:.65},{transform:'scale(1) rotate(0)'}],{duration:2200});
  if(variant==='flight') {
   animate(host.querySelector('.reward-planet .paper-plane'),[{transform:'translate(-22px,18px) rotate(-12deg)',opacity:0},{transform:'translate(9px,-10px) rotate(5deg)',opacity:1,offset:.6},{transform:'translate(0,0) rotate(0)',opacity:1}],{duration:2600});
   animate(host.querySelector('.flight-path'),[{strokeDashoffset:42,opacity:0},{strokeDashoffset:0,opacity:1}],{duration:2400});
  }
  if(variant==='orbit') animate(host.querySelector('.orbit-moon'),[{transform:'rotate(0deg)'},{transform:'rotate(360deg)'}],{duration:3200});
  if(variant==='notebook') animate(host.querySelector('.notebook-page'),[{transform:'perspective(240px) rotateY(-70deg)'},{transform:'perspective(240px) rotateY(8deg)',offset:.7},{transform:'perspective(240px) rotateY(0deg)'}],{duration:2400});
  const stop=host.closest('section')?.id;
  animate(host.querySelector(`[data-stop-chapter="${stop}"]`),[{boxShadow:'0 0 0 0 #8eaaa370'},{boxShadow:'0 0 0 8px #8eaaa300'},{boxShadow:'0 0 0 0 #8eaaa300'}],{duration:2200});
  if(!host.classList.contains('has-finale')) return;
  animate(host.querySelector('.finale-route'),[{strokeDashoffset:80,opacity:.2},{strokeDashoffset:0,opacity:1}],{duration:4200});
  host.querySelectorAll('.finale-world').forEach((element,index)=>animate(element,[{opacity:0,scale:'.3'},{opacity:1,scale:'1.2',offset:.7},{opacity:1,scale:'1'}],{duration:1400,delay:index*150,fill:'backwards'}));
  animate(host.querySelector('.finale-home'),[{opacity:0,scale:'.75'},{opacity:1,scale:'1.06',offset:.7},{opacity:1,scale:'1'}],{duration:2600,delay:500,fill:'backwards'});
  animate(host.querySelector('.finale-plane'),[{transform:'translate(-70px,55px)',opacity:0},{transform:'translate(150px,-6px)',opacity:1,offset:.5},{transform:'translate(390px,55px)',opacity:0}],{duration:4800,delay:400,fill:'both'});
 }
 for(const event of ['course-navigation-change','course-language-will-change']) document.addEventListener(event,clear);
 for(const event of ['hashchange','pagehide']) window.addEventListener(event,clear);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
 motion.addEventListener('change',event=>{if(event.matches)clear();});
 window.SmallJourneyRewards={decorate,play,clear};
})();
