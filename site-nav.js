(function () {
  'use strict';
  const header = document.querySelector('header.site');
  const toggle = header && header.querySelector('.site-menu-toggle');
  const menu = header && header.querySelector('.mnav');
  if (!toggle || !menu) return;
  const compact = matchMedia('(max-width: 1180px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let menuMotion;
  function animateMenu(open) {
    const current = menu.hidden ? {opacity:0,transform:'translateY(-8px)'} : {
      opacity:getComputedStyle(menu).opacity,transform:getComputedStyle(menu).transform
    };
    if (menuMotion) menuMotion.cancel();
    toggle.setAttribute('aria-expanded', String(open));
    menu.inert = !open;
    if (reduced.matches || !menu.animate) { menu.hidden = !open; return; }
    menu.hidden = false;
    const destination = open ? {opacity:1,transform:'translateY(0)'} : {opacity:0,transform:'translateY(-8px)'};
    const animation = menu.animate([current,destination], {
      duration:open ? 240 : 160, easing:'cubic-bezier(.25,.8,.25,1)'
    });
    menuMotion = animation;
    animation.onfinish = function () {
      if (menuMotion !== animation) return;
      menu.hidden = !open;
      menuMotion = null;
    };
  }
  function close(returnFocus) {
    if (toggle.getAttribute('aria-expanded') === 'true') animateMenu(false);
    if (returnFocus) toggle.focus();
  }
  toggle.addEventListener('click', function () {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    animateMenu(open);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !menu.hidden) close(true);
  });
  document.addEventListener('click', function (event) {
    if (!header.contains(event.target)) close(false);
  });
  menu.addEventListener('click', function (event) {
    if (event.target.closest('a')) close(false);
  });
  compact.addEventListener('change', function () { close(false); });
  menu.hidden = true;
  menu.inert = true;
  toggle.setAttribute('aria-expanded', 'false');
  const readingLinks=Array.from(document.querySelectorAll('.page-index a[href^="#"]'));
  const readingNav=document.querySelector('.page-index');
  if (!readingNav || !readingLinks.length) return;
  const indicator=document.createElement('span');
  indicator.className='reading-indicator';indicator.setAttribute('aria-hidden','true');
  readingNav.append(indicator);
  let activeLink,scrollingTo,scrollFallback;
  function selectLink(active){
    activeLink=active;
    readingLinks.forEach(link=>{
      if(link===active)link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
    const left=active.offsetLeft+14;
    indicator.style.transform='translateX('+left+'px)';
    indicator.style.width=Math.max(16,active.offsetWidth-28)+'px';
  }
  function markReadingLink(){
    selectLink(readingLinks.find(link=>link.hash===location.hash)||readingLinks[0]);
  }
  addEventListener('hashchange',markReadingLink);
  markReadingLink();
  requestAnimationFrame(()=>readingNav.classList.add('reading-ready'));
  if ('ResizeObserver' in window) new ResizeObserver(()=>selectLink(activeLink)).observe(readingNav);
  if (document.fonts) document.fonts.ready.then(()=>selectLink(activeLink));
  const sections=readingLinks.map(link=>document.getElementById(link.hash.slice(1)));
  let queued=false;
  function followReading(){
    queued=false;
    if(scrollingTo)return;
    const line=Math.min(innerHeight*.32,220);
    let index=0;
    sections.forEach((section,i)=>{if(section && section.getBoundingClientRect().top<=line)index=i;});
    if (readingLinks[index]!==activeLink) selectLink(readingLinks[index]);
  }
  function finishScroll(){scrollingTo=null;clearTimeout(scrollFallback);followReading();}
  readingNav.addEventListener('click',event=>{
    const link=event.target.closest('a');
    if(!readingLinks.includes(link)||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    scrollingTo=link;selectLink(link);
    clearTimeout(scrollFallback);scrollFallback=setTimeout(finishScroll,1600);
  });
  addEventListener('scrollend',finishScroll);
  addEventListener('wheel',finishScroll,{passive:true});
  addEventListener('touchstart',finishScroll,{passive:true});
  addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(followReading);}}, {passive:true});
})();
