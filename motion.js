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
      if (e.isIntersecting) {
        e.target.classList.add('in-view'); io.unobserve(e.target);
        // Reading pages stay legible before enhancement; movement never gates content.
        if (e.target.closest('.guide-readable') && e.target.animate) {
          e.target.animate([{opacity:.72,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}], {
            duration:520,delay:Math.min(parseFloat(e.target.style.transitionDelay)||0,210),
            easing:'cubic-bezier(.25,.8,.25,1)',fill:'backwards'
          });
        }
      }
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

// Replay a small icon animation on each click or keyboard activation.
document.querySelectorAll('.ico').forEach(function(icon){
  icon.addEventListener('click', function(){
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var picture = icon.querySelector('svg');
    if (!picture) return;
    picture.getAnimations().forEach(function(animation){ animation.cancel(); });
    // Keep the original artwork; each object responds to its own action.
    var frames;
    if (icon.classList.contains('b')) {
      frames = ['translate(0,0)', 'translate(-4px,1px) rotate(-3deg)', 'translate(9px,-2px) rotate(2deg)', 'translate(0,0)'];
    } else if (icon.classList.contains('l')) {
      frames = ['translateY(0) rotate(0)', 'translateY(-6px) rotate(-10deg)', 'translateY(1px) rotate(4deg)', 'translateY(0) rotate(0)'];
    } else if (icon.classList.contains('o')) {
      frames = ['translateY(0)', 'translateY(-5px) rotate(10deg)', 'translateY(1px) rotate(-4deg)', 'translateY(0)'];
    } else {
      frames = ['scale(1)', 'scale(.9)', 'scale(1.08)', 'scale(1)'];
      var check = picture.querySelector('path:last-child');
      if (check) check.animate([{opacity:.2,strokeDasharray:'30',strokeDashoffset:'30'},{opacity:1,strokeDasharray:'30',strokeDashoffset:'0'}],{duration:480,easing:'ease-out'});
    }
    picture.animate(frames.map(function(transform,i){return {transform:transform,offset:[0,.22,.56,1][i]};}), {
      duration:680,easing:'cubic-bezier(.25,.8,.25,1)'
    });
  });
});
