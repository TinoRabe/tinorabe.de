/* Animationen der Abbildungen (außer Abb. 1 der Startseite, die eigene Schleife hat).
   Progressive Enhancement: Ohne dieses Skript, im Druck und bei "Bewegung reduzieren" zeigen alle Grafiken den Endzustand.
   Das Skript setzt html.anim erst nach dem Laden; jede Grafik [data-anim] spielt einmal ab, sobald sie zu 40 % sichtbar ist (Klasse .an). */
(function () {
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still || !('IntersectionObserver' in window)) return;
  var els = document.querySelectorAll('[data-anim]');
  if (!els.length) return;
  // Reihenfolge aus den Daten: Elemente mit data-sort bekommen --i nach aufsteigendem Wert (bei Gleichstand DOM-Reihenfolge)
  els.forEach(function (el) {
    if (!el.hasAttribute('data-anim-sort')) return;
    var items = Array.prototype.slice.call(el.querySelectorAll('[data-sort]'));
    items.map(function (x, k) { return { x: x, v: parseFloat(x.getAttribute('data-sort')), k: k }; })
      .sort(function (a, b) { return a.v - b.v || a.k - b.k; })
      .forEach(function (o, i) { o.x.style.setProperty('--i', i); });
  });
  document.documentElement.classList.add('anim');
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('an');
      io.unobserve(e.target);
    });
  }, { threshold: 0.4 });
  els.forEach(function (el) { io.observe(el); });
})();
