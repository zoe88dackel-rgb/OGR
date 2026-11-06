// Deep links into supporting material must remain useful when it is collapsed.
(function () {
  'use strict';
  function revealTarget() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    const disclosures = new Set(target.querySelectorAll('details'));
    if (target.matches('details')) disclosures.add(target);
    for (let node = target.parentElement; node; node = node.parentElement) {
      if (node.matches('details')) disclosures.add(node);
    }
    disclosures.forEach(detail => { detail.open = true; });
    // Wait for chapter navigation enhancement and the disclosure layout.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      target.scrollIntoView({block: 'start', behavior: 'instant'});
    }));
  }
  addEventListener('hashchange', revealTarget);
  revealTarget();
})();
