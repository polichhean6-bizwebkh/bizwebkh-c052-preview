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
