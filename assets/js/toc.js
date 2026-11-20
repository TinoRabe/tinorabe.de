(function () {
  var body = document.getElementById('artikel'), toc = document.getElementById('toc');
  if (!body || !toc) return;
  var hs = body.querySelectorAll('h2');
  if (hs.length < 3) { var a = toc.closest('aside'); if (a) a.hidden = true; return; }
  hs.forEach(function (h, i) {
    if (!h.id) h.id = 'k' + (i + 1) + '-' + h.textContent.toLowerCase().replace(/[^a-z0-9äöüß]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
    var li = document.createElement('li'), a = document.createElement('a');
    a.href = '#' + h.id; a.textContent = h.textContent; li.appendChild(a); toc.appendChild(li);
  });
})();
