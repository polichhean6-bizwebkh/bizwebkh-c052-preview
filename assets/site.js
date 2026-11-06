/* La Route Premium client-review site: progressive enhancement only.
 * Pages are complete static HTML. This file adds the mobile menu and the NON-OPERATIONAL inquiry preview.
 * It makes no network requests and stores nothing. */
(function () {
  var nav = document.getElementById('nav');
  var btn = document.querySelector('.menu-button');
  if (nav && btn) {
    var setOpen = function (open) { nav.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open)); };
    btn.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); btn.focus(); } });
  }

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
