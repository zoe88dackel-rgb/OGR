(function(){
  var chapters = Array.from(document.querySelectorAll('.complete-guide > .chapter'));
  var links = document.querySelectorAll('header.site a[href^="#"]');
  function update(){
    var active = chapters[0];
    chapters.forEach(function(chapter){if(chapter.getBoundingClientRect().top <= 190) active=chapter;});
    links.forEach(function(link){
      if(link.getAttribute('href') === '#'+active.id) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
  }
  var scheduled=false;
  addEventListener('scroll',function(){if(!scheduled){scheduled=true;requestAnimationFrame(function(){update();scheduled=false;});}}, {passive:true});
  update();
})();
