(function () {
  'use strict';
  const search = document.getElementById('faq-search');
  if (!search) return;
  const entries = Array.from(document.querySelectorAll('.faq-entry'));
  const groups = Array.from(document.querySelectorAll('.faq-group'));
  const status = document.getElementById('faq-status');
  function filter() {
    const query = search.value.trim().toLocaleLowerCase();
    let count = 0;
    entries.forEach(function (entry) {
      const match = !query || entry.textContent.toLocaleLowerCase().includes(query);
      entry.hidden = !match;
      if (query && match) entry.open = true;
      if (match) count++;
    });
    groups.forEach(function (group) {
      group.hidden = !Array.from(group.querySelectorAll('.faq-entry')).some(e => !e.hidden);
    });
    status.textContent = query ? '找到 ' + count + ' 条相关问答' : '共 100 条问答 · 8 个主题';
    document.getElementById('faq-empty').hidden = count !== 0;
  }
  search.addEventListener('input', filter);
  document.getElementById('faq-clear').addEventListener('click', function () {
    search.value = '';
    entries.forEach(e => e.open = false);
    filter();
    search.focus();
  });
  filter();
})();
