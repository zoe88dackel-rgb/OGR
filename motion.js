// Motion: reveal-on-scroll (content below the fold only), count-up numbers, hero word stagger.
(function(){
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');
  if (reduce || !('IntersectionObserver' in window)) return;

  // 1) Hero headline: stagger each phrase/icon in
  var h = document.querySelector('.ihero h1, .phead h1');
  if (h) {
    Array.prototype.forEach.call(h.children, function(el, i){
      el.style.animationDelay = (120 + i * 90) + 'ms';
      el.classList.add('pop');
    });
  }

  // 2) Reveal: only things not already on screen get the pre-state
  var vh = window.innerHeight;
  var items = document.querySelectorAll('.card, .tbl, .mock .m, .h2, .eyebrow, .next, .chips span');
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach(function(el){
    if (el.getBoundingClientRect().top > vh * 0.92) {
      var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.transitionDelay = Math.min(sib, 6) * 70 + 'ms';
      el.classList.add('rv');
      io.observe(el);
    }
  });

  // 3) Count-up for big numbers like 8%, 1–2 天, 8 万元, 1600
  function countUp(el){
    var txt = el.textContent, m = txt.match(/\d+(\.\d+)?/);
    if (!m || el.dataset.counted) return;
    el.dataset.counted = 1;
    var end = parseFloat(m[0]), dec = (m[1]||'').length - (m[1]?1:0), t0 = null, dur = 900;
    function step(t){
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = txt.replace(m[0], (end * e).toFixed(Math.max(0,dec)));
      if (p < 1) requestAnimationFrame(step); else el.textContent = txt;
    }
    requestAnimationFrame(step);
  }
  var nio = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if (e.isIntersecting) { countUp(e.target); nio.unobserve(e.target); } });
  }, { threshold: .6 });
  document.querySelectorAll('.big, .mock .v').forEach(function(el){ nio.observe(el); });
})();
