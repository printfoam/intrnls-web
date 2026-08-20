/* ============================================================================
   intrnls.com — the site's only global script: the mobile menu.
   Nothing on any page needs this to render, read or be navigated; without JS the
   nav is a plain list of links (it is only display:none'd below 720px, where the
   toggle button is the thing that reveals it — see the no-JS note below).
   ============================================================================ */
(function () {
  var btn = document.getElementById('navToggle');
  var nav = document.getElementById('primary-nav');
  if (!btn || !nav) return;

  /* No-JS safety lives in CSS, keyed off the `js` class that the one-line inline
     script in <head> adds: without it the Menu button is hidden and the nav simply
     stacks open, so a scripting-off phone still has the whole nav. */

  function setOpen(open) {
    btn.setAttribute('aria-expanded', String(open));
    nav.setAttribute('data-open', String(open));
  }

  btn.addEventListener('click', function () {
    setOpen(btn.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      btn.focus();               /* Escape closes AND returns focus to the opener */
    }
  });
})();
