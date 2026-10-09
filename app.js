const search = document.querySelector('#search');
const sections = [...document.querySelectorAll('.searchable')];
const status = document.querySelector('#search-status');
const clearButton = document.querySelector('#clear-search');
const indexed = sections.map(section => ({section, text: section.textContent.toLocaleLowerCase()}));
function unmark() {
  for (const mark of document.querySelectorAll('mark[data-search]')) {
    mark.replaceWith(document.createTextNode(mark.textContent));
  }
  sections.forEach(section => section.normalize());
}
function highlight(section, query) {
  const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT, {acceptNode: node => {
    const tag = node.parentElement?.tagName;
    return tag !== 'SCRIPT' && tag !== 'STYLE' && node.nodeValue.toLocaleLowerCase().includes(query) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
  }});
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const original = node.nodeValue;
    const lower = original.toLocaleLowerCase();
    const fragment = document.createDocumentFragment();
    let last = 0;
    let next;
    while ((next = lower.indexOf(query, last)) !== -1) {
      fragment.append(document.createTextNode(original.slice(last, next)));
      const mark = document.createElement('mark');
      mark.dataset.search = 'true';
      mark.textContent = original.slice(next, next + query.length);
      fragment.append(mark);
      last = next + query.length;
    }
    fragment.append(document.createTextNode(original.slice(last)));
    node.replaceWith(fragment);
  }
}
function runSearch() {
  unmark();
  const query = search.value.trim().toLocaleLowerCase();
  let count = 0;
  for (const entry of indexed) {
    const matches = !query || entry.text.includes(query);
    entry.section.hidden = !matches;
    if (matches) count++;
    if (matches && query) highlight(entry.section, query);
  }
  clearButton.hidden = !query;
  document.querySelector('#no-results').hidden = !query || count > 0;
  status.textContent = query ? `找到 ${count} 个相关章节；来源索引仍可浏览` : '输入关键词查找章节';
}
search.addEventListener('input', runSearch);
clearButton.addEventListener('click', () => {search.value = ''; runSearch(); search.focus();});
for (const link of document.querySelectorAll('.sidebar nav a, .hero-map a')) {
  link.addEventListener('click', () => {
    if (search.value) { search.value = ''; runSearch(); }
  });
}
document.querySelector('#print').addEventListener('click', () => window.print());
let toastTimer;
function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('visible'), 3500);
}
document.querySelector('#copy-link').addEventListener('click', async () => {
  const url = new URL(location.href);
  url.hash = '';
  try { await navigator.clipboard.writeText(url.href); toast('链接已复制，可以直接发给别人'); }
  catch { window.prompt('请复制网页链接：', url.href); }
});
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (!visible.length) return;
    for (const link of document.querySelectorAll('.sidebar nav a')) {
      const active = link.hash === `#${visible[0].target.id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    }
  }, {rootMargin:'-10% 0px -60% 0px'});
  document.querySelectorAll('.reading-section').forEach(section => observer.observe(section));
}
