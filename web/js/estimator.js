/* Fan energy estimator. Plain JS, no libraries.
   KWH_PER_TON: modeled annual fan energy per ton of cooling at each tool's default
   settings, present climate, read from calculator/data on 2026-10-18:
     tower = tower bundle stations[].map.present.fan_kwh_per_ton
     cooler = evaporative pad tool, annual fan energy at its defaults (1,000 tons) / 1,000
   Both tools scale linearly with tons, so the estimate is that rate times the size. When js/report-data.js is
   loaded (same bundles, all five horizons) its rates are used, and the Today / 2030 / 2050 switch picks the horizon
   (middle climate case); this table is the fallback for Today. */
(function () {
  "use strict";
  var KWH_PER_TON = {
    atlanta:     { name: "Atlanta",     tower: 99.13,  cooler: 428.5 },
    chicago:     { name: "Chicago",     tower: 60.27,  cooler: 419.1 },
    dallas:      { name: "Dallas",      tower: 101.51, cooler: 433.6 },
    denver:      { name: "Denver",      tower: 76.99,  cooler: 496.5 },
    houston:     { name: "Houston",     tower: 131.06, cooler: 463.9 },
    las_vegas:   { name: "Las Vegas",   tower: 76.5,   cooler: 447.3 },
    los_angeles: { name: "Los Angeles", tower: 103.48, cooler: 406.5 },
    madison:     { name: "Madison",     tower: 56.75,  cooler: 421 },
    miami:       { name: "Miami",       tower: 165.91, cooler: 487.7 },
    new_york:    { name: "New York",    tower: 68.55,  cooler: 410.2 },
    oakland:     { name: "Oakland",     tower: 101.99, cooler: 404.6 },
    phoenix:     { name: "Phoenix",     tower: 93.73,  cooler: 433.9 },
    seattle:     { name: "Seattle",     tower: 76.64,  cooler: 410.4 }
  };

  var form = document.getElementById("est");
  if (!form) return;
  var $ = function (id) { return document.getElementById(id); };
  var tons = $("est-tons"), city = $("est-city"), price = $("est-price"), cut = $("est-cut");

  // two significant figures, with thousands separators: 46,865 -> 47,000
  function sig2(x) {
    if (!isFinite(x) || x <= 0) return "0";
    var p = Math.pow(10, Math.floor(Math.log10(x)) - 1);
    return (Math.round(x / p) * p).toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  // The size slider is logarithmic so 100 tons and 20,000 tons are both easy to reach:
  // position 0 to 1000 maps to 100 * 200^(v/1000) tons, shown to two significant figures.
  function tonsAt(v) {
    var raw = 100 * Math.pow(200, v / 1000);
    var p = Math.pow(10, Math.floor(Math.log10(raw)) - 1);
    return Math.round(raw / p) * p;
  }
  function kind() { return form.querySelector('input[name="kind"]:checked').value; }
  // Today / 2030 / 2050 (middle climate case): read from js/report-data.js, the same bundles as the table above.
  function when() { var w = form.querySelector('input[name="when"]:checked'); return w ? w.value : "present"; }
  function rate(cityId, k) {
    var R = window.IntrnlsReport, h = when();
    if (R && R.table.cities[cityId]) {
      var m = R.table.cities[cityId].h[h][k].m, s = 0;
      for (var i = 0; i < m.length; i++) s += m[i];
      return s;
    }
    return KWH_PER_TON[cityId][k];
  }

  function update() {
    var t = tonsAt(Number(tons.value)), c = Number(price.value), w = Number(cut.value);
    var kwh = rate(city.value, kind()) * t;
    var dollars = kwh * c / 100;
    var save = dollars * w / 100;

    $("est-tons-out").textContent = t.toLocaleString("en-US") + " tons";
    tons.setAttribute("aria-valuetext", t.toLocaleString("en-US") + " tons of cooling");
    $("est-price-out").textContent = c + "¢ per kWh";
    price.setAttribute("aria-valuetext", c + " cents per kilowatt hour");
    $("est-cut-out").textContent = w + "% less";
    cut.setAttribute("aria-valuetext", w + " percent less fan work");

    $("est-kwh").textContent = sig2(kwh);
    $("est-dollars").textContent = "$" + sig2(dollars);
    $("est-save").textContent = "$" + sig2(save);
    $("est-save10").textContent = "$" + sig2(save * 10);
    var machine = kind() === "tower" ? "cooling tower" : "air cooler";
    $("est-machine").textContent = machine;
  }

  form.addEventListener("input", update);
  form.addEventListener("change", update);
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  update();
})();
