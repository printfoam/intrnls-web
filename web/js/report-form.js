/* Report form on calculator.html. Sending is js/contact-form.js, unchanged: this file only
   (1) opens and closes the form, (2) keeps the hidden topic ("report") and message (the
   slider settings and site name) current, (3) keeps the person's details in this browser
   session for the report's cover, and (4) opens the report when contact-form.js shows its
   success notice, or, if the send fails, after saying so. Reads the estimator's settings
   from the page; js/estimator.js is not touched. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var open = $("report-open"), form = $("contact-form"), est = $("est");
  if (!open || !form) return;

  function settings() {
    var kindEl = document.querySelector('#est input[name="kind"]:checked');
    var whenEl = document.querySelector('#est input[name="when"]:checked');
    var city = $("est-city");
    var tonsTxt = ($("est-tons-out") || {}).textContent || "";
    return {
      kind: kindEl ? kindEl.value : "tower",
      when: whenEl ? whenEl.value : "",
      whenLabel: whenEl && whenEl.parentNode ? whenEl.parentNode.textContent.trim() : "",
      city: city ? city.value : "",
      cityName: city && city.selectedIndex >= 0 ? city.options[city.selectedIndex].text : "",
      tons: Number(tonsTxt.replace(/[^0-9.]/g, "")) || 0,
      cents: Number(($("est-price") || {}).value) || 0,
      cut: Number(($("est-cut") || {}).value) || 0
    };
  }
  function reportUrl() {
    var s = settings();
    var p = new URLSearchParams({ kind: s.kind, city: s.city, tons: String(s.tons), cents: String(s.cents), cut: String(s.cut) });
    if (s.when) p.set("when", s.when);
    return "report.html?" + p.toString();
  }
  function fill() {
    var s = settings(), site = ($("r-site") || {}).value || "";
    $("c-message").value =
      "Report request from the estimator.\n" +
      "Equipment: " + (s.kind === "cooler" ? "Air cooler" : "Cooling tower") + "\n" +
      "Size: " + s.tons.toLocaleString("en-US") + " tons\n" +
      "City: " + s.cityName + "\n" +
      (s.when ? "Climate: " + (s.whenLabel || s.when) + "\n" : "") +
      "Power price: " + s.cents + " cents per kWh\n" +
      "What-if: " + s.cut + "% less fan work\n" +
      "Site or tower: " + (site.trim() || "not given");
    try {
      sessionStorage.setItem("intrnls-report-who", JSON.stringify({
        name: ($("c-name") || {}).value || "", company: ($("c-org") || {}).value || "", site: site.trim()
      }));
    } catch (e) {}
    var url = reportUrl();
    ["report-ok-link", "report-fb-link"].forEach(function (id) { var a = $(id); if (a) a.href = url; });
  }

  open.addEventListener("click", function () {
    var show = form.hidden;
    form.hidden = !show;
    open.setAttribute("aria-expanded", String(show));
    if (show) { fill(); var n = $("c-name"); if (n) n.focus(); }
  });
  if (est) { est.addEventListener("input", fill); est.addEventListener("change", fill); }
  form.addEventListener("input", fill);
  form.addEventListener("submit", fill, true);   // capture: runs before contact-form.js reads the message

  // The report opens in a NEW tab so the visitor keeps the estimator they were working on.
  // A tab opened after the send finishes counts as a pop-up, so the tab is opened on the
  // Send click itself (a user gesture), shows a short holding line, and is pointed at the
  // report once the send is acknowledged. If the browser still blocks it, the notice keeps
  // a link that opens the report in a new tab. Same origin and no "noopener": the new tab
  // must inherit this tab's sessionStorage, which carries the name for the report's cover.
  var win = null, opened = false;
  form.addEventListener("submit", function () {
    if (win || (form.checkValidity && !form.checkValidity())) return;
    try {
      win = window.open("", "_blank");
      if (win && win.document) {
        win.document.title = "Your fan energy report | Intrnls";
        win.document.body.style.cssText = "font:16px/1.5 system-ui,sans-serif;padding:2rem;background:#000;color:#fff";
        win.document.body.textContent = "Preparing your report…";
      }
    } catch (e) { win = null; }
  }, true);
  function go(delay) {
    if (opened) return; opened = true;
    setTimeout(function () {
      if (win && !win.closed) { win.location.href = reportUrl(); win.focus(); }
    }, delay);
  }
  // success: contact-form.js unhides #form-success only after the server acknowledges
  var ok = $("form-success");
  new MutationObserver(function () { if (!ok.hidden) go(0); }).observe(ok, { attributes: true, attributeFilter: ["hidden"] });
  // failure to send (not a validation error): contact-form.js titles it "That did not send."
  var alertBox = $("form-alert"), title = $("form-alert-title"), fb = $("report-fallback");
  new MutationObserver(function () {
    if (!alertBox.hidden && /did not send/i.test(title.textContent || "")) {
      fb.hidden = false; fb.focus(); go(4000);
    }
  }).observe(alertBox, { attributes: true, attributeFilter: ["hidden"] });
})();
