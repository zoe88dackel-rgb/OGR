(function(){
  var header=document.querySelector('header.site');
  function measure(){document.documentElement.style.setProperty('--snap-header',Math.ceil(header.getBoundingClientRect().height+16)+'px');}
  if(header){measure();if('ResizeObserver' in window)new ResizeObserver(measure).observe(header);else addEventListener('resize',measure);}
})();
