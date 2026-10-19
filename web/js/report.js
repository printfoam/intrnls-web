/* Fan energy report: fills report.html from window.IntrnlsReport.compute(inputs)
   (js/report-data.js; shape in its own documentation). Inputs come from the URL
   (?kind=tower&city=madison&tons=14000&cents=12&cut=30, optional &fanHp=30&fanControl=single|two|vfd for an
   installed tower fan motor). The person's name, company and
   site come from this browser session only (sessionStorage, written by the report form);
   nothing personal goes in the URL. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var q = new URLSearchParams(location.search);
  var inputs = {
    kind: q.get("kind") === "cooler" ? "cooler" : "tower",
    city: q.get("city") || "phoenix",
    tons: Math.max(1, Number(q.get("tons")) || 500),
    centsPerKwh: Math.max(1, Number(q.get("cents")) || 12),
    cutPct: Math.min(100, Math.max(0, Number(q.get("cut")) || 30))
  };
  if (Number(q.get("fanHp")) > 0) {
    inputs.fanHp = Number(q.get("fanHp"));
    inputs.fanControl = { single: "single", two: "two", vfd: "vfd" }[q.get("fanControl")] || "single";
  }

  function sig2(x) {
    if (!isFinite(x) || x <= 0) return "0";
    var p = Math.pow(10, Math.floor(Math.log10(x)) - 1);
    return (Math.round(x / p) * p).toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  function money(x) { return "$" + sig2(x); }
  function deg(x) { return (x < 0 ? "minus " : "") + Math.abs(x).toFixed(1) + "°F"; }
  function degShort(x) { return (x < 0 ? "−" : "") + Math.abs(x).toFixed(1) + "°F"; }
  function setText(id, v) { var el = $(id); if (el) el.textContent = v; }
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // ---------------------------------------------------------------- charts (inline SVG)
  var NS = "http://www.w3.org/2000/svg";
  function el(name, attrs, text) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function defs(svg) {
    var d = el("defs", {});
    [["rp-hatch-1", "pat-bg1", "pat1", 6], ["rp-hatch-2", "pat-bg2", "pat2", 4]].forEach(function (p) {
      var pat = el("pattern", { id: p[0], width: p[3] * 2, height: p[3] * 2, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" });
      pat.appendChild(el("rect", { width: p[3] * 2, height: p[3] * 2, "class": p[1] }));
      pat.appendChild(el("line", { x1: 0, y1: 0, x2: 0, y2: p[3] * 2, "class": p[2] }));
      d.appendChild(pat);
    });
    svg.appendChild(d);
  }
  // Three horizontal bars (today, 2030, 2050), each labeled directly with its name and value,
  // so the chart reads in grayscale and for every color vision: solid, sparse hatch, dense
  // hatch. Signed: a negative value draws left of a zero line, and the zero line is labeled.
  function bars3(host, rows, valueOf, fmt) {
    var W = 640, rowH = 34, H = rows.length * rowH + 6, x0 = 92, x1 = W - 80;
    var vals = rows.map(valueOf);
    var lo = Math.min(0, Math.min.apply(null, vals)), hi = Math.max(0, Math.max.apply(null, vals));
    var span = (hi - lo) || 1, zx = x0 + (x1 - x0) * (-lo / span);
    var svg = el("svg", { viewBox: "0 0 " + W + " " + (H + (lo < 0 ? 16 : 0)), "aria-hidden": "true", focusable: "false" });
    defs(svg);
    if (lo < 0) {
      svg.appendChild(el("line", { x1: zx, y1: 0, x2: zx, y2: H, "class": "axis zero" }));
      svg.appendChild(el("text", { x: zx, y: H + 13, "text-anchor": "middle", "class": "t-quiet", "font-size": "11" }, "0"));
    }
    rows.forEach(function (r, i) {
      var y = i * rowH + 4, v = vals[i], w = Math.max(2, (x1 - x0) * Math.abs(v) / span), x = v < 0 ? zx - w : zx;
      svg.appendChild(el("text", { x: 0, y: y + 19, "class": "t-strong" }, r.short));
      svg.appendChild(el("rect", { x: x, y: y + 4, width: w, height: 22, rx: 3, "class": "b" + i }));
      if (i > 0) svg.appendChild(el("rect", { x: x, y: y + 4, width: w, height: 22, rx: 3, "class": "outline" + i }));
      var tx = v < 0 ? Math.max(x0, x) - 8 : x + w + 8;
      svg.appendChild(el("text", { x: v < 0 ? zx + 8 : tx, y: y + 19, "class": "t-strong" }, fmt(v)));
    });
    host.textContent = ""; host.appendChild(svg);
  }
  function monthBars(host, monthly) {
    var W = 640, H = 200, top = 22, bottom = 22, n = monthly.length, gap = 8;
    var bw = (W - gap * (n - 1)) / n, max = Math.max.apply(null, monthly.map(function (m) { return m.kwh; })) || 1;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, "aria-hidden": "true", focusable: "false" });
    svg.appendChild(el("line", { x1: 0, y1: H - bottom, x2: W, y2: H - bottom, "class": "axis" }));
    monthly.forEach(function (m, i) {
      var h = (H - top - bottom) * m.kwh / max, x = i * (bw + gap), y = H - bottom - h;
      svg.appendChild(el("rect", { x: x, y: y, width: bw, height: Math.max(1, h), rx: 2, "class": "bm" }));
      svg.appendChild(el("text", { x: x + bw / 2, y: H - 6, "text-anchor": "middle", "class": "t-quiet" }, m.month));
      svg.appendChild(el("text", { x: x + bw / 2, y: y - 6, "text-anchor": "middle", "font-size": "10" }, sig2(m.kwh)));
    });
    host.textContent = ""; host.appendChild(svg);
  }
  function cells(tr, values) {
    values.forEach(function (v, i) {
      var td = document.createElement(i ? "td" : "th"); if (!i) td.scope = "row"; td.textContent = v; tr.appendChild(td);
    });
  }

  // ---------------------------------------------------------------- fill the sheets
  function render(r) {
    var who = {};
    try { who = JSON.parse(sessionStorage.getItem("intrnls-report-who") || "{}"); } catch (e) {}
    if (who.name) setText("rp-name", who.name);
    if (who.company) setText("rp-company", who.company);
    if (who.site) setText("rp-site", who.site);
    setText("rp-date", new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));

    var inp = r.inputs, tower = inp.kind !== "cooler";
    var H = {}; r.horizons.forEach(function (h) { H[h.key] = h; });
    var now = H.present;
    var three = [
      { short: "Today", h: H.present },
      { short: "2030", h: H["2030_mid"] },
      { short: "2050", h: H["2050_mid"] }
    ];

    // sheet 1
    setText("rp-in-kind", tower ? "Cooling tower" : "Evaporative air cooler");
    setText("rp-in-tons", Number(inp.tons).toLocaleString("en-US") + " tons of cooling");
    if (inp.fanHp) {
      var ctlWords = { single: "single speed", two: "two speed", vfd: "variable speed" }[inp.fanControl];
      setText("rp-in-fan", inp.fanHp.toLocaleString("en-US") + " HP, " + ctlWords + ". Fan energy is this motor's full-load power times the hours the tower model runs it at full load (about " +
        sig2(now.equivalentFullLoadHours) + " hours a year today).");
      var fr = $("rp-in-fan-row"); if (fr) fr.hidden = false;
    }
    setText("rp-in-city", inp.cityName + " (weather station: " + inp.station + ")");
    // optional plain-text source for the price (?priceSrc=...), shown after the rate; textContent, so never markup
    var priceSrc = (q.get("priceSrc") || "").slice(0, 120);
    setText("rp-in-price", inp.centsPerKwh + " cents per kWh" + (priceSrc ? ", " + priceSrc : ""));
    setText("rp-kwh", sig2(now.fanKwh));
    setText("rp-dollars", money(now.fanDollars));

    // sheet 2: the margin, today, 2030 and 2050 (middle case)
    var anyNeg = three.some(function (t) { return t.h.marginF < 0; });
    if (!tower) {
      setText("rp-climate-lede", "Your air cooler cools air by evaporating water into it. As the wet-bulb temperature rises, the coolest air it can make gets warmer, so it has fewer degrees to work with." +
        (anyNeg ? " Below zero means that on the muggiest hour the outside air is already too wet to cool to your target by evaporation alone." : ""));
      setText("rp-gap-h", "Degrees between your target air temperature and the wet-bulb, on the muggiest hour");
      setText("rp-col-water", "Target air");
    } else {
      setText("rp-gap-h", "Degrees between the cold water and the air, on the muggiest hour");
    }
    bars3($("rp-gap-chart"), three, function (t) { return t.h.marginF; }, degShort);
    var hard = $("rp-hard-chart");
    if (hard) bars3(hard, three, function (t) { return t.h.hoursAboveTodaysDesignWetBulb; }, function (v) { return sig2(v) + " hours"; });

    var tb = $("rp-climate-table").tBodies[0]; tb.textContent = "";
    r.horizons.forEach(function (h) {
      var tr = document.createElement("tr");
      var other = tower ? (h.leavingWaterAtDesignHourF == null ? "n/a" : h.leavingWaterAtDesignHourF.toFixed(1) + "°F") : "75.2°F";
      cells(tr, [h.label, h.designWetBulbF.toFixed(1) + "°F", other, degShort(h.marginF),
                 sig2(h.hoursAboveTodaysDesignWetBulb), sig2(h.fanKwh)]);
      tb.appendChild(tr);
    });
    setText("rp-margin-def", r.definitions && r.definitions.marginF ? r.definitions.marginF : "");
    var ch = $("rp-changes"); ch.textContent = "";
    (r.changes || []).forEach(function (s) { var li = document.createElement("li"); li.textContent = s; ch.appendChild(li); });

    // sheet 3: month by month, today
    var monthly = now.fanKwhMonthly.map(function (k, i) { return { month: MONTHS[i], kwh: k, dollars: k * inp.centsPerKwh / 100 }; });
    monthBars($("rp-month-chart"), monthly);
    var head = $("rp-month-head");
    while (head.children.length > 1) head.removeChild(head.lastChild);
    monthly.concat([{ month: "Year" }]).forEach(function (m) {
      var th = document.createElement("th"); th.scope = "col"; th.textContent = m.month; head.appendChild(th);
    });
    var mb = $("rp-month-table").tBodies[0]; mb.textContent = "";
    [["Fan energy, kWh", function (m) { return sig2(m.kwh); }, sig2(now.fanKwh)],
     ["Cost", function (m) { return money(m.dollars); }, money(now.fanDollars)]].forEach(function (row) {
      var tr = document.createElement("tr");
      var th = document.createElement("th"); th.scope = "row"; th.textContent = row[0]; tr.appendChild(th);
      monthly.forEach(function (m) { var td = document.createElement("td"); td.textContent = row[1](m); tr.appendChild(td); });
      var td = document.createElement("td"); td.className = "yr"; td.textContent = row[2]; tr.appendChild(td);
      mb.appendChild(tr);
    });
    setText("rp-whatif-text", "If your fans did " + inp.cutPct + "% less work, you would save about " +
      money(now.savingsPerYear) + " a year, " + money(now.savings10Years) + " over 10 years, at today’s power price. In the 2050 middle case climate, the same cut would save about " +
      money(H["2050_mid"].savingsPerYear) + " a year.");
    if (inp.fanHp && inp.fanControl !== "vfd" && window.IntrnlsReport) renderPaths(inp, now);
    var pb = $("rp-problem");
    if (pb && r.problem && r.problem.text) { setText("rp-problem-text", r.problem.text); pb.hidden = false; }
    document.documentElement.setAttribute("data-report", "ready");
  }

  // Upgrade paths: today's fans, the same fans on a variable-speed drive (modeled, standard fill),
  // and the drive plus fill that lowers fan work (the what-if, applied on top of the drive).
  function renderPaths(inp, now) {
    var v;
    try {
      v = window.IntrnlsReport.compute({ kind: inp.kind, city: inputs.city, tons: inp.tons, centsPerKwh: inp.centsPerKwh,
        cutPct: inp.cutPct, fanHp: inp.fanHp, fanControl: "vfd" });
    } catch (e) { return; }
    var vNow = v.horizons.filter(function (h) { return h.key === "present"; })[0];
    if (!vNow) return;
    var ctl = inp.fanControl === "two" ? "two-speed" : "single-speed";
    var c = inp.centsPerKwh / 100, cut = inp.cutPct / 100;
    var bothKwh = vNow.fanKwh * (1 - cut);
    var rows = [
      ["Today, " + ctl + " fans", now.fanKwh, null],
      ["Add a variable-speed drive", vNow.fanKwh, now.fanKwh - vNow.fanKwh],
      ["Drive plus fill that lowers fan work by " + inp.cutPct + "% (what-if)", bothKwh, now.fanKwh - bothKwh]
    ];
    var tb = $("rp-paths-body");
    rows.forEach(function (r) {
      var tr = document.createElement("tr");
      [r[0], sig2(r[1]) + " kWh", money(r[1] * c), r[2] === null ? "" : money(r[2] * c) + " (" + Math.round(100 * r[2] / now.fanKwh) + "%)"]
        .forEach(function (txt, i) { var el = document.createElement(i ? "td" : "th"); if (!i) el.scope = "row"; el.textContent = txt; tr.appendChild(el); });
      tb.appendChild(tr);
    });
    setText("rp-whatif-h", "Upgrade paths. The last row is a what-if, not a promise.");
    setText("rp-whatif-text", "Your fans today against the same fans on a variable-speed drive, both modeled with standard fill in today's climate. " +
      "Fan power falls steeply as a fan slows, so a drive saves the most where the tower rarely needs full airflow.");
    setText("rp-paths-note", "The last row assumes fill that lets the fans do " + inp.cutPct + "% less work, on top of the drive. " +
      "Over 10 years the drive alone saves about " + money((now.fanKwh - vNow.fanKwh) * c * 10) + " at today's power price.");
    $("rp-paths").hidden = false; $("rp-paths-note").hidden = false;
  }

  function fail(msg) {
    var s = $("rp-sample"); s.textContent = msg; s.hidden = false;
    document.documentElement.setAttribute("data-report", "error");
  }
  function go() {
    var api = window.IntrnlsReport;
    if (!api || typeof api.compute !== "function") { fail("The report data could not load. Reload the page, or email contact@intrnls.com."); return; }
    var r;
    try { r = api.compute(inputs); } catch (e) { fail("We could not build a report for those settings. Go back to the estimator and try again."); return; }
    render(r);
  }

  var btn = $("rp-print");
  if (btn) btn.addEventListener("click", function () { window.print(); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
})();
