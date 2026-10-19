/* Hero video: pause/play control per clip, and the reduced-motion stop. Deferred; the page
   reads, navigates and shows the still without it. */
(function () {
  var figs = document.querySelectorAll('.hero-video');
  if (!figs.length) return;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)');

  figs.forEach(function (wrap) {
    var vid = wrap.querySelector('video');
    var btn = wrap.querySelector('.vid-toggle');
    if (!vid) return;
    function apply() { if (still.matches) { vid.pause(); vid.removeAttribute('autoplay'); } }
    apply();
    if (still.addEventListener) still.addEventListener('change', apply);
    if (!btn) return;
    var ic = btn.querySelector('.ic'), lb = btn.querySelector('.lb');
    function sync() {
      ic.textContent = vid.paused ? '▶' : '❙❙';
      lb.textContent = vid.paused ? 'Play' : 'Pause';
    }
    btn.addEventListener('click', function () {
      if (vid.paused) { wrap.userPaused = false; vid.play(); } else { wrap.userPaused = true; vid.pause(); }
    });
    vid.addEventListener('play', sync);
    vid.addEventListener('pause', sync);
    sync();
  });

  /* Browsers pause muted background video to save power, and a play() then rejects.
     Resume when the page is visible again, unless the visitor paused it. */
  function resume() {
    if (document.hidden || still.matches) return;
    figs.forEach(function (w) {
      var v = w.querySelector('video');
      if (v && v.paused && !w.userPaused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    });
  }
  document.addEventListener('visibilitychange', resume);
})();
