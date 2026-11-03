(function () {
  'use strict';
  const header = document.querySelector('header.site');
  const toggle = header && header.querySelector('.site-menu-toggle');
  const menu = header && header.querySelector('.mnav');
  if (!toggle || !menu) return;
  const compact = matchMedia('(max-width: 1180px)');
  function close(returnFocus) {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) toggle.focus();
  }
  toggle.addEventListener('click', function () {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
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
  close(false);
})();
