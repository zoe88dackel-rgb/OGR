(function(){
  var header=document.querySelector('header.site');
  function measure(){if(header)document.documentElement.style.setProperty('--snap-header',Math.ceil(header.getBoundingClientRect().height+16)+'px');}
  measure();
  if(header&&'ResizeObserver' in window)new ResizeObserver(measure).observe(header);
  else addEventListener('resize',measure);
})();
