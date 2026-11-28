/* La Route Premium client-review site (Phase 3B): progressive enhancement only.
 * Pages are complete static HTML. This file adds the mobile menu and dropdown groups, the homepage five-card
 * destination carousel, and the NON-OPERATIONAL inquiry preview.
 * It makes no network requests and stores nothing. */

/* Homepage destination carousel: MANUAL ONLY. Nothing moves by itself (no autoplay, no timers), so no pause control is needed.
 * Controls: previous/next arrows, the five destination buttons, clicking a side card, swipe, and the Left/Right arrow keys while
 * focus is inside the hero. Without JavaScript the first destination shows and every link works. */
(function () {
  var root = document.querySelector('.hero3');
  if (!root) return;
  var cards = [].slice.call(root.querySelectorAll('.dcard'));
  var bgs = [].slice.call(root.querySelectorAll('.hero3-bg .bg'));
  var thumbs = [].slice.call(root.querySelectorAll('.thumb'));
  var ui = root.querySelector('.selector');
  var stage = root.querySelector('.cards');
  var n = cards.length;
  if (n < 2 || !ui) return;
  var cur = 0;
  root.classList.add('is-ready');
  ui.hidden = false;

  function offset(i) { var d = ((i - cur) % n + n) % n; return d > n / 2 ? d - n : d; }
  function show(i, announce) {
    cur = (i % n + n) % n;
    cards.forEach(function (c, k) {
      var on = k === cur;
      c.classList.toggle('is-active', on);
      c.setAttribute('data-o', String(offset(k)));
      c.setAttribute('aria-hidden', on ? 'false' : 'true');
      [].forEach.call(c.querySelectorAll('a'), function (a) { a.tabIndex = on ? 0 : -1; });
    });
    bgs.forEach(function (b, k) { b.classList.toggle('is-active', k === cur); });
    thumbs.forEach(function (t, k) {
      t.classList.toggle('is-active', k === cur);
      if (k === cur) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });
    if (announce) stage.setAttribute('aria-live', 'polite');
  }
  show(0, false);

  root.querySelector('.prev').addEventListener('click', function () { show(cur - 1, true); });
  root.querySelector('.next').addEventListener('click', function () { show(cur + 1, true); });
  thumbs.forEach(function (t) { t.addEventListener('click', function () { show(Number(t.getAttribute('data-go')), true); }); });
  cards.forEach(function (c, k) { c.addEventListener('click', function (e) { if (k !== cur && !e.target.closest('a')) show(k, true); }); });
  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { show(cur - 1, true); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { show(cur + 1, true); e.preventDefault(); }
  });
  var x0 = null, y0 = null;
  stage.addEventListener('touchstart', function (e) { var t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) show(cur + (dx < 0 ? 1 : -1), true);
  }, { passive: true });

  /* the floating "Contact us" bar is hidden while the hero (which has its own call to action) is on screen */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { document.body.classList.toggle('hero-in-view', en[0].isIntersecting); }, { threshold: 0.35 }).observe(root);
  }
  /* ...and while the gold world map is on screen, so the bar never covers the map labels */
  var wm = document.querySelector('.coverage-map');
  if (wm && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { document.body.classList.toggle('map-in-view', en[0].isIntersecting); }, { threshold: 0 }).observe(wm);
  }
})();

(function () {
  var nav = document.getElementById('nav');
  var btn = document.querySelector('.menu-button');
  if (nav && btn) {
    var setOpen = function (open) { nav.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open)); };
    btn.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); btn.focus(); } });
  }

  /* dropdown groups: hover/focus reveal on desktop (CSS), toggle buttons for touch and keyboard, accordion on mobile */
  var groups = [].slice.call(document.querySelectorAll('.nav-group'));
  var closeAll = function (except) {
    groups.forEach(function (g) {
      if (g === except) return;
      g.classList.remove('open');
      g.querySelector('.nav-toggle').setAttribute('aria-expanded', 'false');
    });
  };
  groups.forEach(function (g) {
    var tg = g.querySelector('.nav-toggle');
    tg.addEventListener('click', function () {
      var open = !g.classList.contains('open');
      closeAll(g);
      g.classList.toggle('open', open);
      tg.setAttribute('aria-expanded', String(open));
    });
    g.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && g.classList.contains('open')) { g.classList.remove('open'); tg.setAttribute('aria-expanded', 'false'); tg.focus(); e.stopPropagation(); }
    });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.nav-group')) closeAll(null); });

  var form = document.getElementById('inquiry');
  if (!form) return;
  var q = new URLSearchParams(location.search);
  var svc = q.get('service');
  if (svc && form.service && /^(visa|dmc|other)$/.test(svc)) form.service.value = svc;
  if (q.get('dest') && form.dest) form.dest.value = q.get('dest').slice(0, 60);

  var msg = function (k) { return form.getAttribute('data-' + k); };
  var setErr = function (id, text) {
    var field = form.elements[id], err = document.getElementById('err-' + id);
    if (!err) return;
    err.hidden = !text; err.textContent = text || '';
    if (field) field.setAttribute('aria-invalid', text ? 'true' : 'false');
  };
  var blocked = document.getElementById('blocked');
  var run = function () {
    var bad = [];
    ['name', 'service', 'message'].forEach(function (id) { var empty = !form.elements[id].value.trim(); setErr(id, empty ? msg('required') : ''); if (empty) bad.push(id); });
    var phone = form.phone.value.trim(), email = form.email.value.trim();
    setErr('phone', ''); setErr('email', '');
    if (!phone && !email) { setErr('phone', msg('contact-one')); bad.push('phone'); }
    else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('email', msg('email')); bad.push('email'); }
    if (bad.length) { blocked.hidden = true; form.elements[bad[0]].focus(); return; }
    // Design preview: nothing is sent or stored, and no success message is shown.
    blocked.hidden = false;
  };
  document.getElementById('preview-submit').addEventListener('click', run);
  form.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); run(); } });
})();

/* Top 10 Global Destinations map (Global Destination page): click or tap opens the enlarged map in a native <dialog>.
 * Closes with the close button, Escape, or a click outside the map; focus returns to the map button. On small screens the
 * enlarged map is wider than the screen and can be panned, so the country names are readable. No network requests. */
(function () {
  var btn = document.querySelector('.map-zoom');
  var dlg = document.querySelector('.map-lightbox');
  if (!btn || !dlg || typeof dlg.showModal !== 'function') { if (btn) btn.style.cursor = 'default'; return; }
  var closeBtn = dlg.querySelector('.map-lb-close');
  var scroller = dlg.querySelector('.map-lb-scroll');
  function open() {
    dlg.showModal();
    document.body.classList.add('map-lb-open');
    if (scroller) { scroller.scrollLeft = 0; scroller.scrollTop = 0; }
    if (closeBtn) closeBtn.focus();
  }
  btn.addEventListener('click', open);
  closeBtn.addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) {
    var t = e.target;
    if (t === dlg || t.classList.contains('map-lb-stage') || t === scroller) dlg.close();
  });
  dlg.addEventListener('close', function () {
    document.body.classList.remove('map-lb-open');
    btn.focus();
  });
})();

/* Tour Packages banner: on phones (700px and below) the whole banner is shown uncropped; tapping it opens the full-size banner in a native <dialog>
 * (pan to read; Esc, the close button or a tap outside closes it; focus returns to the banner). On larger screens the banner is a plain image. */
(function () {
  var btn = document.querySelector('.tp-banner-zoom');
  var dlg = document.querySelector('.tpb-lightbox');
  if (!btn || !dlg || typeof dlg.showModal !== 'function') return;
  var mq = window.matchMedia('(max-width: 700px)');
  var closeBtn = dlg.querySelector('.map-lb-close');
  var scroller = dlg.querySelector('.map-lb-scroll');
  function sync() { if (mq.matches) { btn.removeAttribute('tabindex'); btn.removeAttribute('aria-hidden'); } else { btn.setAttribute('tabindex', '-1'); btn.setAttribute('aria-hidden', 'true'); if (dlg.open) dlg.close(); } }
  sync();
  if (mq.addEventListener) mq.addEventListener('change', sync);
  btn.addEventListener('click', function () {
    if (!mq.matches) return;
    dlg.showModal();
    document.body.classList.add('map-lb-open');
    if (scroller) { scroller.scrollTop = 0; scroller.scrollLeft = Math.max(0, 0.4 * 1100 - scroller.clientWidth / 2); }
    closeBtn.focus();
  });
  closeBtn.addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { var t = e.target; if (t === dlg || t.classList.contains('map-lb-stage') || t === scroller) dlg.close(); });
  dlg.addEventListener('close', function () { document.body.classList.remove('map-lb-open'); if (mq.matches) btn.focus(); });
})();

/* Tour Packages: the two client images under the banner each open complete in their own native <dialog> (click or tap). Esc, the close button or a click
 * outside closes it; focus returns to the image that opened it. On phones the enlarged image is 760px wide inside a pannable area (portrait image scrolls vertically). */
(function () {
  [].slice.call(document.querySelectorAll('.tp-j-zoom')).forEach(function (btn) {
    var dlg = document.getElementById(btn.getAttribute('aria-controls'));
    if (!dlg || typeof dlg.showModal !== 'function') { btn.style.cursor = 'default'; return; }
    var closeBtn = dlg.querySelector('.map-lb-close');
    var scroller = dlg.querySelector('.map-lb-scroll');
    btn.addEventListener('click', function () {
      dlg.showModal();
      document.body.classList.add('map-lb-open');
      if (scroller) { scroller.scrollTop = 0; scroller.scrollLeft = Math.max(0, (scroller.scrollWidth - scroller.clientWidth) / 2); }
      closeBtn.focus();
    });
    closeBtn.addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { var t = e.target; if (t === dlg || t.classList.contains('map-lb-stage') || t === scroller) dlg.close(); });
    dlg.addEventListener('close', function () { document.body.classList.remove('map-lb-open'); btn.focus(); });
  });
})();

/* Tour Packages page: "Explore by destination" filter (behaviour as in Demo B: default All destinations, ?destination=Name pre-selects,
 * choosing All destinations resets, no match shows the empty message). Without JavaScript the filter is hidden and all six cards show. */
(function () {
  var sel = document.getElementById('tp-filter');
  if (!sel) return;
  var cards = [].slice.call(document.querySelectorAll('.tp-card'));
  var empty = document.getElementById('tp-empty');
  var q = new URLSearchParams(location.search).get('destination');
  if (q) { for (var i = 0; i < sel.options.length; i++) { if (sel.options[i].value === q) { sel.value = q; break; } } }
  function update() {
    var v = sel.value, shown = 0;
    cards.forEach(function (c) { var m = !v || c.getAttribute('data-destination') === v; c.hidden = !m; if (m) shown++; });
    if (empty) empty.hidden = shown > 0;
  }
  sel.addEventListener('change', update);
  update();
})();
