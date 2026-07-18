(function(){
  "use strict";

  var PRICE_RANK = {"€":1,"€€":2,"€€€":3,"€€€€":4};
  var PERSONALITY_OPTIONS = ["gedurfd","zelfverzekerd","stoer","warm","fris","klassiek","modern","elegant","verfijnd","mysterieus","sportief","speels"];
  var AUTO_ADVANCE_DELAY = 220;
  var MAX_SHOWN = 12;
  var RESULTS_PER_PAGE = 6;

  var SILLAGE_OPTIONS = [
    {v:"subtiel", l:"Liever subtiel", match:["licht","intiem"]},
    {v:"gemiddeld", l:"Gemiddeld, hoeft niet op te vallen", match:["gemiddeld"]},
    {v:"opvallend", l:"Mag goed opvallen", match:["sterk","zeer sterk"]},
    {v:"geen_voorkeur", l:"Maakt me niet uit", match:null}
  ];
  var MOMENT_OPTIONS = [
    {v:"dagelijks", l:"Dagelijks"},
    {v:"kantoor", l:"Op werk / kantoor"},
    {v:"avond", l:"'s Avonds"},
    {v:"uitgaan", l:"Uitgaan"}
  ];
  var SEIZOEN_OPTIONS = [
    {v:"lente_zomer", l:"Lente / Zomer", match:["lente","zomer"]},
    {v:"herfst_winter", l:"Herfst / Winter", match:["herfst","winter"]}
  ];
  var BUDGET_OPTIONS = [
    {v:"€", p:"€", l:"Tot €40"},{v:"€€", p:"€€", l:"€40 tot €80"},
    {v:"€€€", p:"€€€", l:"€80 tot €150"},{v:"€€€€", p:"€€€€", l:"Geen limiet"}
  ];

  var state = {
    geslacht: null,
    bekendeGeur: "",
    persoonlijkheid: [],
    sillage: null,
    moment: [],
    seizoen: [],
    budget: null,
    bekendheid: { uniek: false, bekend: false },
    step: 0,
    shown: []
  };

  var STEPS = ["geslacht","bekend","persoonlijkheid","sillage","budget","voorkeur"];
  var STEP_LABELS = {geslacht:"GESLACHT", bekend:"BEKENDE GEUR", persoonlijkheid:"PERSOONLIJKHEID", sillage:"SILLAGE", budget:"BUDGET", voorkeur:"VOORKEUR"};
  function pad2(n){ return n < 10 ? "0"+n : ""+n; }

  var root = document.getElementById("wizardApp");
  var DATA = [];
  var CFG = window.WIZARD_CONFIG || { parfumBase: "../parfums/", assetBase: "../assets/img/" };
  var FALLBACK_PHOTO = { heren: "fallback-heren.jpg", dames: "fallback-dames.jpg" };

  function fetchData(){
    // Dataset wordt inline meegeleverd door build.py (window.PARFUM_DATA) i.p.v. via fetch(),
    // zodat de wizard ook werkt als de site lokaal via file:// wordt geopend (fetch naar
    // lokale bestanden wordt daar door de browser geblokkeerd).
    return new Promise(function(resolve, reject){
      if (window.PARFUM_DATA && window.PARFUM_DATA.length) {
        DATA = window.PARFUM_DATA;
        resolve();
      } else {
        reject(new Error("Parfumdataset niet gevonden (window.PARFUM_DATA ontbreekt)."));
      }
    });
  }

  function el(html){
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  var RING_R = 42;
  var RING_C = 2 * Math.PI * RING_R;
  var RING_TICKS = 20;
  var lastShownCount = null;
  var bootDone = false;
  var hasGivenInput = false;

  function matchSentence(n){
    if (!state.geslacht) return "We doorzoeken " + n + " parfums voor je.";
    if (state.moment.length || state.seizoen.length) {
      return n + " parfums die passen bij hoe en wanneer je 'm wil dragen.";
    }
    if (state.budget) {
      return n + " parfums binnen je budget.";
    }
    if (state.sillage && state.sillage !== "geen_voorkeur") {
      return n + " parfums met precies de sterkte die je zoekt.";
    }
    if (state.persoonlijkheid.length) {
      return n + " parfums die passen bij " + state.persoonlijkheid.join(", ") + ".";
    }
    var label = state.geslacht === "heren" ? "herenassortiment" : (state.geslacht === "dames" ? "damesassortiment" : "volledige assortiment");
    return n + " parfums in het " + label + ".";
  }

  function matchRingPct(n){
    var total = DATA.length || 1;
    return Math.max(0, Math.min(1, 1 - (n / total)));
  }

  function ringDotsHtml(onCount){
    var dots = "";
    var cx = 48, cy = 48, r = 42;
    for (var i = 0; i < RING_TICKS; i++){
      var angle = (i / RING_TICKS) * Math.PI * 2 - Math.PI/2;
      var x = (cx + r * Math.cos(angle)).toFixed(2);
      var y = (cy + r * Math.sin(angle)).toFixed(2);
      dots += '<circle class="match-ring-dot' + (i < onCount ? ' on' : '') + '" data-i="' + i + '" cx="' + x + '" cy="' + y + '" r="3.4"/>';
    }
    return dots;
  }

  function matchRingHtml(displayCount, displayPct){
    var onCount = Math.round(displayPct * RING_TICKS);
    return '<div class="match-ring-row">' +
      '<div class="match-ring-wrap" id="matchRingWrap">' +
      '<div class="match-ring-radar" id="matchRingRadar1"></div>' +
      '<div class="match-ring-radar match-ring-radar-2" id="matchRingRadar2"></div>' +
      '<div class="match-ring-grid" id="matchRingGrid"></div>' +
      '<svg class="match-ring-svg" viewBox="0 0 96 96" id="matchRingSvg">' +
      ringDotsHtml(onCount) +
      '</svg>' +
      '<div class="match-ring-center"><span class="match-ring-count" id="matchRingCount">' + (hasGivenInput ? displayCount : "") + '</span></div>' +
      '</div>' +
      '<div class="match-ring-copy"><p class="match-ring-sentence" id="matchRingSentence">' + matchSentence(displayCount) + '</p>' +
      '<div class="match-ring-micro" id="matchRingMicro">Berekenen&hellip;</div></div>' +
      '</div>';
  }

  function easeOutBack(t){
    var c1 = 1.15, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function fillRingDots(pct){
    var svg = document.getElementById("matchRingSvg");
    if (!svg) return;
    var on = Math.round(Math.max(0, Math.min(1, pct)) * RING_TICKS);
    var dots = svg.querySelectorAll(".match-ring-dot");
    for (var i = 0; i < dots.length; i++) dots[i].classList.toggle("on", i < on);
  }

  function animateMatchRing(target){
    var countEl = document.getElementById("matchRingCount");
    var wrapEl = document.getElementById("matchRingWrap");
    var sentenceEl = document.getElementById("matchRingSentence");
    var microEl = document.getElementById("matchRingMicro");
    var radar1 = document.getElementById("matchRingRadar1");
    var radar2 = document.getElementById("matchRingRadar2");
    var gridEl = document.getElementById("matchRingGrid");
    if (!countEl) return;
    if (sentenceEl) sentenceEl.innerHTML = matchSentence(target);
    if (lastShownCount === null) {
      lastShownCount = target;
      return;
    }
    hasGivenInput = true;
    if (lastShownCount === target) {
      return;
    }
    var start = lastShownCount;
    // Commit the target immediately: if AUTO_ADVANCE_DELAY fires renderShell() again
    // before this animation finishes (e.g. auto-advancing single-select steps), the
    // interrupting call must see "nothing changed" instead of restarting from scratch.
    lastShownCount = target;
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      countEl.textContent = target;
      fillRingDots(matchRingPct(target));
      return;
    }
    if (wrapEl) wrapEl.classList.add("calculating");
    if (microEl) microEl.classList.add("show");
    if (radar1) radar1.classList.add("go");
    if (radar2) radar2.classList.add("go");
    if (gridEl) gridEl.classList.add("show");
    var panelEl = document.querySelector(".wizard-panel");
    if (panelEl) panelEl.classList.add("panel-calculating");
    var rowWait = document.getElementById("statusRowWait");
    var textWait = document.getElementById("statusTextWait");
    if (rowWait) rowWait.classList.add("processing");
    if (textWait) textWait.textContent = "Input verwerken…";
    var dur = 680, beginTs = null;
    function step(ts){
      if (!beginTs) beginTs = ts;
      var t = Math.min(1, (ts - beginTs) / dur);
      var eased = easeOutBack(t);
      var v = Math.round(start + (target - start) * eased);
      countEl.textContent = Math.max(1, v);
      fillRingDots(matchRingPct(Math.max(1, v)));
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        countEl.textContent = target;
        fillRingDots(matchRingPct(target));
        if (wrapEl) wrapEl.classList.remove("calculating");
        if (microEl) microEl.classList.remove("show");
        if (radar1) radar1.classList.remove("go");
        if (radar2) radar2.classList.remove("go");
        if (gridEl) gridEl.classList.remove("show");
        if (panelEl) panelEl.classList.remove("panel-calculating");
        if (rowWait) rowWait.classList.remove("processing");
        if (textWait) textWait.textContent = "Laatste update: zojuist";
      }
    }
    requestAnimationFrame(step);
  }

  // Boot-sequence status stack: shown once above the matchring. Row 1 (Tool
  // laden -> Tool online) plays once and then stays permanently green; row 2
  // reflects whether the visitor has given input yet, and flips to "Input
  // verwerken..." during a live recalculation (see animateMatchRing above).
  function statusStackHtml(){
    var showClass = bootDone ? " show" : "";
    var onlineClass = bootDone ? " online" : "";
    var bootText = bootDone ? "Tool online" : "Tool laden&hellip;";
    var waitText = hasGivenInput ? "Laatste update: zojuist" : "Wachten op input&hellip;";
    return '<div class="wizard-status-stack">' +
      '<div class="wizard-status-row' + showClass + '" id="statusRowBoot"><span class="wizard-status-dot' + onlineClass + '" id="statusDotBoot"></span><span id="statusTextBoot">' + bootText + '</span></div>' +
      '<div class="wizard-status-row' + showClass + '" id="statusRowWait"><span class="wizard-status-dot pulse" id="statusDotWait"></span><span id="statusTextWait">' + waitText + '</span></div>' +
      '</div>';
  }

  function runBootSequence(){
    if (bootDone) return;
    var rowBoot = document.getElementById("statusRowBoot");
    var dotBoot = document.getElementById("statusDotBoot");
    var textBoot = document.getElementById("statusTextBoot");
    var rowWait = document.getElementById("statusRowWait");
    if (!rowBoot || !rowWait) return;
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      rowBoot.classList.add("show"); rowWait.classList.add("show");
      dotBoot.classList.add("online"); textBoot.textContent = "Tool online";
      bootDone = true;
      return;
    }
    setTimeout(function(){ rowBoot.classList.add("show"); }, 30);
    setTimeout(function(){ dotBoot.classList.add("online"); textBoot.textContent = "Tool online"; }, 680);
    setTimeout(function(){ rowWait.classList.add("show"); bootDone = true; }, 1080);
  }

  var BRAND_MARK = '<span class="mark"></span>';

  function renderShell(inner){
    var canBack = state.step > 0;
    var target = liveMatchCount();
    var initialCount = lastShownCount === null ? target : lastShownCount;
    var initialPct = matchRingPct(initialCount);
    var stepKey = STEPS[state.step];
    var progressPct = Math.round(Math.min(state.step+1, STEPS.length) / STEPS.length * 100);
    root.innerHTML =
      '<div class="wizard-panel">' +
      '<div class="wizard-topbar">' +
      '<div class="wizard-topbar-left">' +
      (canBack ? '<button type="button" class="wizard-back" id="wizardBack"><span class="wizard-back-chevron">&#8249;</span>Vorige</button>' : '') +
      '<span class="wizard-steplabel">STAP ' + pad2(state.step+1) + ' / ' + pad2(STEPS.length) + ' &mdash; ' + STEP_LABELS[stepKey] + '</span>' +
      '</div>' +
      '<div class="wizard-progress"><div class="wizard-progress-fill" style="width:' + progressPct + '%"></div></div>' +
      '</div>' +
      '<div class="wizard-body">' +
      '<div class="wizard-main"><div id="wizardInner"></div></div>' +
      '<div class="wizard-side">' +
      '<div class="wizard-brand">' + BRAND_MARK + 'ParfumPicker</div>' +
      statusStackHtml() +
      matchRingHtml(initialCount, initialPct) +
      '</div>' +
      '</div>' +
      '</div>';
    document.getElementById("wizardInner").innerHTML = inner;
    if (canBack) {
      document.getElementById("wizardBack").onclick = function(){ state.step = Math.max(0, state.step-1); render(); };
    }
    runBootSequence();
    animateMatchRing(target);
  }

  function goNext(){ state.step++; render(); }

  function navForward(canNext, nextLabel, onNext, skip){
    var bar = document.createElement("div");
    bar.className = "wizard-nav";
    if (skip) {
      var skipBtn = document.createElement("button");
      skipBtn.className = "btn btn-outline";
      skipBtn.textContent = "Sla over";
      skipBtn.onclick = skip;
      bar.appendChild(skipBtn);
    }
    var next = document.createElement("button");
    next.className = "btn btn-primary";
    next.textContent = nextLabel || "Volgende";
    next.disabled = !canNext;
    next.onclick = onNext;
    bar.appendChild(next);
    document.getElementById("wizardInner").appendChild(bar);
  }

  function optionCard(label, selected, onClick, multi){
    var d = document.createElement("div");
    d.className = "option-pill" + (selected ? " selected" : "") + (multi ? " multi" : "");
    d.innerHTML = label;
    d.onclick = onClick;
    return d;
  }

  var UNISEX_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/></svg>';

  function optionRow(iconHtml, label, selected, onClick){
    var d = document.createElement("button");
    d.type = "button";
    d.className = "option-row" + (selected ? " selected" : "");
    d.innerHTML = '<span class="option-row-icon">' + iconHtml + '</span>' +
      '<span class="option-row-label">' + label + '</span>' +
      '<span class="option-row-chevron">&#8250;</span>';
    d.onclick = onClick;
    return d;
  }

  function staggerGrid(container){
    if (!container) return;
    Array.prototype.forEach.call(container.children, function(el, i){
      el.style.animationDelay = (i * 35) + "ms";
    });
  }

  // Measures the track once per drag (its size can't change mid-drag) and
  // coalesces painting to one requestAnimationFrame per frame, always using
  // the latest pointer position - raw pointermove can fire faster than the
  // display repaints, and calling getBoundingClientRect() (a forced
  // synchronous layout flush) on every single one of those events is what
  // makes a drag feel like it's lagging behind the real cursor.
  function makeDraggableSlider(trackEl, onMove, onEnd){
    var dragging = false, rect = null, pendingPct = null, rafId = null;
    function pctFromClientX(clientX){
      var pct = (clientX - rect.left) / rect.width * 100;
      return Math.max(0, Math.min(100, pct));
    }
    function flush(){
      rafId = null;
      if (pendingPct !== null) { onMove(pendingPct); pendingPct = null; }
    }
    function schedule(pct){
      pendingPct = pct;
      if (rafId === null) rafId = requestAnimationFrame(flush);
    }
    function down(e){
      dragging = true;
      rect = trackEl.getBoundingClientRect();
      schedule(pctFromClientX(e.clientX));
      e.preventDefault();
    }
    function move(e){
      if (!dragging) return;
      schedule(pctFromClientX(e.clientX));
    }
    function up(){
      if (!dragging) return;
      dragging = false;
      if (rafId !== null) { cancelAnimationFrame(rafId); flush(); }
      onEnd();
    }
    trackEl.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function genderIconHtml(key){
    if (key === "unisex") return UNISEX_ICON;
    var wantId = key === "heren" ? "dior-sauvage-edt" : "chanel-coco-mademoiselle-edp";
    var p = DATA.filter(function(x){ return x.id === wantId; })[0];
    if (p && p.afbeelding_url) return '<img src="' + p.afbeelding_url + '" alt="" loading="lazy">';
    return UNISEX_ICON;
  }

  function renderStepGeslacht(){
    renderShell('<span class="wizard-question">Voor wie zoek je een parfum?</span><p class="wizard-hint">Dit bepaalt meteen welke geuren we je laten zien.</p><div class="option-row-list" id="opts"></div>');
    var opts = document.getElementById("opts");
    [["dames","Voor een vrouw"],["heren","Voor een man"],["unisex","Unisex / geen voorkeur"]].forEach(function(o){
      var card = optionRow(genderIconHtml(o[0]), o[1], state.geslacht===o[0], function(){
        Array.prototype.forEach.call(opts.children, function(el){ el.classList.remove("selected"); });
        state.geslacht = o[0];
        card.classList.add("selected");
        animateMatchRing(liveMatchCount());
        var nextBtn = document.querySelector(".wizard-nav .btn-primary");
        if (nextBtn) nextBtn.disabled = false;
      });
      opts.appendChild(card);
    });
    staggerGrid(opts);
    navForward(!!state.geslacht, "Volgende", goNext);
  }

  // The 3 ordered SILLAGE_OPTIONS buckets, expressed as ranges along a 0-100
  // slider so the drag can feel continuous while still landing on exactly
  // the same 3 values the matching engine already understands.
  var SILLAGE_BUCKETS = [
    {v:"subtiel", l:"Subtiel", from:0, to:100/3},
    {v:"gemiddeld", l:"Gemiddeld", from:100/3, to:200/3},
    {v:"opvallend", l:"Opvallend", from:200/3, to:100}
  ];
  function sillageBucketForPct(pct){
    for (var i=0;i<SILLAGE_BUCKETS.length;i++) if (pct <= SILLAGE_BUCKETS[i].to) return SILLAGE_BUCKETS[i];
    return SILLAGE_BUCKETS[SILLAGE_BUCKETS.length-1];
  }
  function sillageSnapCenter(b){ return (b.from + b.to) / 2; }
  function sillagePctForValue(v){
    var b = SILLAGE_BUCKETS.filter(function(x){ return x.v === v; })[0];
    return b ? sillageSnapCenter(b) : 50;
  }

  var SILLAGE_BOTTLE_ICON = '<svg class="sillage-wave-bottle" viewBox="0 0 24 32" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v4.5c0 .8-.4 1.3-1 1.8-1.6 1.3-3 2.7-3 5.2v13c0 1.4 1.1 2.5 2.5 2.5h7c1.4 0 2.5-1.1 2.5-2.5v-13c0-2.5-1.4-3.9-3-5.2-.6-.5-1-1-1-1.8V3"/></svg>';
  var SILLAGE_TICK_ICONS = {
    subtiel: '<svg viewBox="0 0 24 24"><path d="M12 5c-2 3-2 6 0 9"/></svg>',
    gemiddeld: '<svg viewBox="0 0 24 24"><path d="M9 5c-2.5 3.3-2.5 6.7 0 10"/><path d="M14 5c-2.5 3.3-2.5 6.7 0 10"/></svg>',
    opvallend: '<svg viewBox="0 0 24 24"><path d="M6 4c-3 4-3 8 0 12"/><path d="M11 4c-3 4-3 8 0 12"/><path d="M16 4c-3 4-3 8 0 12"/></svg>'
  };

  function renderStepSillage(){
    // A slider always shows a resting position, so treat "never touched" as
    // an implicit choice of the middle bucket rather than leaving state.sillage
    // null while the handle visually sits on "Gemiddeld" - otherwise the UI
    // would imply a filter that isn't actually being applied.
    if (state.sillage === null) state.sillage = "gemiddeld";
    var skipped = state.sillage === "geen_voorkeur";

    renderShell(
      '<span class="wizard-question">Hoe subtiel of opvallend mag de geur zijn?</span>' +
      '<p class="wizard-hint">Dit bepaalt de sterkte (sillage) van het parfum.</p>' +
      '<div class="sillage-wave-stage">' + SILLAGE_BOTTLE_ICON +
        '<svg class="sillage-wave-svg" viewBox="0 0 220 92" preserveAspectRatio="xMinYMid meet">' +
          '<path class="sillage-wave-arc" id="sillageWave1" d="M14,32 A14,14 0 0 1 14,60"/>' +
          '<path class="sillage-wave-arc" id="sillageWave2" d="M14,18 A28,28 0 0 1 14,74"/>' +
          '<path class="sillage-wave-arc" id="sillageWave3" d="M14,4 A42,42 0 0 1 14,88"/>' +
          '<path class="sillage-wave-arc" id="sillageWave4" d="M14,-10 A56,56 0 0 1 14,102"/>' +
        '</svg>' +
      '</div>' +
      '<div class="sillage-slider-wrap" id="sillageSliderWrap">' +
        '<div class="sillage-slider-bubble" id="sillageBubble"></div>' +
        '<div class="sillage-slider-track" id="sillageTrack">' +
          '<div class="sillage-slider-fill" id="sillageFill"></div>' +
          '<div class="sillage-slider-handle" id="sillageHandle" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="100" aria-label="Sillage"></div>' +
        '</div>' +
        '<div class="sillage-wave-ticks" id="sillageTicks">' +
          '<span data-b="subtiel">' + SILLAGE_TICK_ICONS.subtiel + 'Subtiel</span>' +
          '<span data-b="gemiddeld">' + SILLAGE_TICK_ICONS.gemiddeld + 'Gemiddeld</span>' +
          '<span data-b="opvallend">' + SILLAGE_TICK_ICONS.opvallend + 'Opvallend</span>' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:22px"><button type="button" class="skip-link' + (skipped ? " active" : "") + '" id="sillageSkip">Maakt me niet uit &mdash; sla deze vraag over</button></div>'
    );

    var track = document.getElementById("sillageTrack");
    var fill = document.getElementById("sillageFill");
    var handle = document.getElementById("sillageHandle");
    var bubble = document.getElementById("sillageBubble");
    var ticks = document.querySelectorAll("#sillageTicks span");
    var waves = [document.getElementById("sillageWave1"), document.getElementById("sillageWave2"), document.getElementById("sillageWave3"), document.getElementById("sillageWave4")];
    var wrap = document.getElementById("sillageSliderWrap");
    var skipBtn = document.getElementById("sillageSkip");
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function paintWaves(pct){
      var level = pct / 100 * waves.length;
      waves.forEach(function(w, i){
        var local = Math.max(0, Math.min(1, level - i));
        w.style.opacity = local * 0.75;
        w.style.strokeWidth = 1.4 + local * 1.4;
      });
    }
    function paint(pct, snapping){
      track.dataset.pct = pct;
      fill.style.width = pct + "%";
      handle.style.left = pct + "%";
      bubble.style.left = pct + "%";
      handle.classList.toggle("snap", !reduceMotion && !!snapping);
      paintWaves(pct);
      var b = sillageBucketForPct(pct);
      bubble.textContent = b.l;
      Array.prototype.forEach.call(ticks, function(t){ t.classList.toggle("on", t.getAttribute("data-b") === b.v); });
    }
    function setSkippedVisual(skip){
      wrap.style.opacity = skip ? ".35" : "1";
      wrap.style.pointerEvents = skip ? "none" : "";
    }
    function commit(v){
      if (state.sillage === v) return;
      state.sillage = v;
      animateMatchRing(liveMatchCount());
    }

    paint(sillagePctForValue(skipped ? "gemiddeld" : state.sillage), false);
    setSkippedVisual(skipped);

    makeDraggableSlider(track, function(pct){
      if (state.sillage === "geen_voorkeur") return;
      paint(pct, false);
    }, function(){
      if (state.sillage === "geen_voorkeur") return;
      var b = sillageBucketForPct(parseFloat(track.dataset.pct));
      paint(sillageSnapCenter(b), true);
      commit(b.v);
    });

    // Keyboard: step directly to the adjacent bucket rather than nudging by
    // a few percent - a percent-nudge from a bucket's own center (the
    // resting position) lands back inside the same bucket, so reusing the
    // drag-release snap would silently cancel every keypress out.
    handle.addEventListener("keydown", function(e){
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      if (state.sillage === "geen_voorkeur") return;
      var idx = SILLAGE_BUCKETS.indexOf(sillageBucketForPct(parseFloat(track.dataset.pct)));
      var next = Math.max(0, Math.min(SILLAGE_BUCKETS.length - 1, idx + (e.key === "ArrowLeft" ? -1 : 1)));
      var b = SILLAGE_BUCKETS[next];
      paint(sillageSnapCenter(b), true);
      commit(b.v);
    });

    skipBtn.onclick = function(){
      var willSkip = state.sillage !== "geen_voorkeur";
      if (willSkip) {
        commit("geen_voorkeur");
      } else {
        commit("gemiddeld");
        paint(sillagePctForValue("gemiddeld"), true);
      }
      skipBtn.classList.toggle("active", willSkip);
      setSkippedVisual(willSkip);
    };

    navForward(true, "Volgende", goNext);
  }

  function renderStepBekend(){
    renderShell(
      '<span class="wizard-question">Ken je al een merk of parfum dat diegene mooi vindt?</span>' +
      '<p class="wizard-hint">Optioneel: helpt ons een nog betere match te vinden.</p>' +
      '<div class="autocomplete">' +
        '<input id="bekendInput" type="text" autocomplete="off" placeholder="Begin te typen, bijv. Dior Sauvage" value="' + (state.bekendeGeur||"") + '" style="width:100%;padding:14px 16px;border:2px solid var(--border);border-radius:12px;font-size:15px;font-family:inherit">' +
        '<div class="autocomplete-list" id="bekendSuggest"></div>' +
      '</div>' +
      '<div class="wizard-feedback" id="bekendFeedback"></div>'
    );

    var input = document.getElementById("bekendInput");
    var list = document.getElementById("bekendSuggest");
    var feedback = document.getElementById("bekendFeedback");

    function showFeedback(){
      var q = state.bekendeGeur.trim();
      var exact = q && autocompletePool().find(function(p){ return p.naam.toLowerCase() === q.toLowerCase(); });
      if (exact) {
        feedback.innerHTML = '<span class="feedback-ok">&#10003; Herkend: ' + exact.naam + ', we wegen dit mee in je advies.</span>';
      } else if (q.length > 1) {
        feedback.innerHTML = '<span class="feedback-neutral">Niet in onze database gevonden, geen probleem: we gebruiken dan gewoon je andere antwoorden.</span>';
      } else {
        feedback.innerHTML = "";
      }
    }

    function closeList(){ list.innerHTML = ""; list.classList.remove("open"); }

    function selectMatch(p){
      state.bekendeGeur = p.naam;
      input.value = p.naam;
      closeList();
      showFeedback();
      setTimeout(goNext, 320);
    }

    function renderSuggestions(){
      var q = input.value.trim();
      var matches = findMatches(q, 6);
      if (!q || !matches.length) { closeList(); showFeedback(); return; }
      list.innerHTML = matches.map(function(p){
        var label = p.naam.toLowerCase().indexOf(p.merk.toLowerCase()) === 0 ? p.naam : (p.merk + " " + p.naam);
        // Real photo when we have one; otherwise the existing SVG bottle illustration -
        // never the labelled fallback-photo used elsewhere, since "Geen productfoto
        // gevonden" is illegible at this size and would misrepresent as a real caption.
        var thumb = p.afbeelding_url
          ? '<img src="' + p.afbeelding_url + '" alt="" loading="lazy">'
          : bottleSvg(p.familie_hoofd, p.id, 60, 76);
        return '<button type="button" class="autocomplete-item" data-id="' + p.id + '">' +
          '<span class="autocomplete-item-thumb">' + thumb + '</span>' +
          '<span class="autocomplete-item-text"><span class="nm">' + label + '</span></span>' +
          '<span>' + p.merk + '</span></button>';
      }).join("");
      list.classList.add("open");
      Array.prototype.forEach.call(list.querySelectorAll(".autocomplete-item"), function(btn){
        btn.onclick = function(){
          var match = autocompletePool().find(function(p){ return p.id === btn.getAttribute("data-id"); });
          if (match) selectMatch(match);
        };
      });
      showFeedback();
    }

    input.oninput = function(e){ state.bekendeGeur = e.target.value; renderSuggestions(); };
    input.onfocus = renderSuggestions;
    input.onblur = function(){ setTimeout(closeList, 150); };
    showFeedback();

    navForward(true, "Volgende", goNext, function(){ state.bekendeGeur=""; goNext(); });
  }

  function renderStepPersoonlijkheid(){
    renderShell('<span class="wizard-question">Hoe zou je de persoonlijkheid omschrijven?</span><p class="wizard-hint">Kies tot 3 kenmerken (optioneel).</p><div class="option-pill-grid" id="opts"></div>');
    var opts = document.getElementById("opts");

    function refreshCap(){
      var atCap = state.persoonlijkheid.length >= 3;
      Array.prototype.forEach.call(opts.children, function(el){
        if (!el.classList.contains("selected")) el.classList.toggle("at-cap", atCap);
      });
    }

    PERSONALITY_OPTIONS.forEach(function(v){
      var selected = state.persoonlijkheid.indexOf(v) > -1;
      var card = optionCard(v.charAt(0).toUpperCase()+v.slice(1), selected, function(){
        var i = state.persoonlijkheid.indexOf(v);
        if (i > -1) {
          state.persoonlijkheid.splice(i, 1);
          card.classList.remove("selected");
        } else {
          if (state.persoonlijkheid.length >= 3) return;
          state.persoonlijkheid.push(v);
          card.classList.add("selected");
        }
        refreshCap();
        animateMatchRing(liveMatchCount());
      }, true);
      opts.appendChild(card);
    });
    staggerGrid(opts);
    refreshCap();
    navForward(true, "Volgende", goNext);
  }

  var BUDGET_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8.5c-1-1.3-2.7-2-4.5-2-3 0-5.5 2.5-5.5 5.5s2.5 5.5 5.5 5.5c1.8 0 3.5-.7 4.5-2"/><path d="M4 10h8M4 14h8"/></svg>';

  function renderStepBudget(){
    renderShell('<span class="wizard-question">Wat is je budget?</span><p class="wizard-hint">We houden ons hieraan bij elk advies.</p><div class="option-row-list" id="opts"></div>');
    var opts = document.getElementById("opts");
    BUDGET_OPTIONS.forEach(function(o){
      var label = '<span class="price">' + o.p + '</span> ' + o.l;
      opts.appendChild(optionRow(BUDGET_ICON, label, state.budget===o.v, function(){
        state.budget = o.v;
        renderStepBudget();
        setTimeout(goNext, AUTO_ADVANCE_DELAY);
      }));
    });
    staggerGrid(opts);
  }

  function renderStepVoorkeur(){
    renderShell(
      '<span class="wizard-question">Wanneer wordt dit vooral gedragen?</span>' +
      '<p class="wizard-hint">Optioneel, voor extra verfijning. Mag meerdere per groep.</p>' +
      '<div class="option-pill-grid" id="optsMoment"></div>' +
      '<p class="wizard-subhead">In welk seizoen?</p>' +
      '<div class="option-pill-grid" id="optsSeizoen"></div>' +
      '<p class="wizard-microlabel">Nog een voorkeur? (optioneel)</p>' +
      '<div class="bk-switch-row" id="optsBekendheid"></div>'
    );
    var optsMoment = document.getElementById("optsMoment");
    MOMENT_OPTIONS.forEach(function(o){
      var selected = state.moment.indexOf(o.v) > -1;
      var card = optionCard(o.l, selected, function(){
        var i = state.moment.indexOf(o.v);
        if (i>-1) { state.moment.splice(i,1); card.classList.remove("selected"); }
        else { state.moment.push(o.v); card.classList.add("selected"); }
        animateMatchRing(liveMatchCount());
      }, true);
      optsMoment.appendChild(card);
    });
    staggerGrid(optsMoment);
    var optsSeizoen = document.getElementById("optsSeizoen");
    SEIZOEN_OPTIONS.forEach(function(o){
      var selected = state.seizoen.indexOf(o.v) > -1;
      var card = optionCard(o.l, selected, function(){
        var i = state.seizoen.indexOf(o.v);
        if (i>-1) { state.seizoen.splice(i,1); card.classList.remove("selected"); }
        else { state.seizoen.push(o.v); card.classList.add("selected"); }
        animateMatchRing(liveMatchCount());
      }, true);
      optsSeizoen.appendChild(card);
    });
    staggerGrid(optsSeizoen);
    var optsBekendheid = document.getElementById("optsBekendheid");
    var bkItemUniek, bkItemBekend;
    function bkSwitchItem(label, key, other){
      var item = document.createElement("div");
      item.className = "bk-switch-item";
      item.innerHTML = '<span class="bk-switch' + (state.bekendheid[key] ? " on" : "") + '"><i></i></span><span class="lbl">' + label + '</span>';
      item.onclick = function(){
        state.bekendheid[key] = !state.bekendheid[key];
        item.querySelector(".bk-switch").classList.toggle("on", state.bekendheid[key]);
        if (state.bekendheid[key] && state.bekendheid[other]) {
          state.bekendheid[other] = false;
          (key === "uniek" ? bkItemBekend : bkItemUniek).querySelector(".bk-switch").classList.remove("on");
        }
      };
      return item;
    }
    bkItemUniek = bkSwitchItem("Liever iets unieks, niet de bekendste keuze", "uniek", "bekend");
    bkItemBekend = bkSwitchItem("Liever een bekende, veilige keuze", "bekend", "uniek");
    optsBekendheid.appendChild(bkItemUniek);
    optsBekendheid.appendChild(bkItemBekend);
    navForward(true, "Bekijk mijn advies", function(){ runMatchScan(showResults); }, function(){ state.moment=[]; state.seizoen=[]; state.bekendheid={uniek:false,bekend:false}; runMatchScan(showResults); });
  }

  function sillageBucket(){
    return SILLAGE_OPTIONS.filter(function(o){ return o.v === state.sillage; })[0] || null;
  }

  function seizoenOverlapCount(item){
    var n = 0;
    state.seizoen.forEach(function(sKey){
      var bucket = SEIZOEN_OPTIONS.filter(function(o){ return o.v === sKey; })[0];
      if (bucket && item.seizoen.some(function(s){ return bucket.match.indexOf(s) > -1; })) n++;
    });
    return n;
  }

  function scoreItem(item, ref){
    var score = 0;
    state.persoonlijkheid.forEach(function(t){ if (item.persoonlijkheid.indexOf(t) > -1) score += 2; });
    var bucket = sillageBucket();
    if (bucket && bucket.match && bucket.match.indexOf(item.sillage) > -1) score += 2;
    state.moment.forEach(function(m){ if (item.moment.indexOf(m) > -1) score += 1; });
    score += seizoenOverlapCount(item);
    if (ref && ref.id !== item.id) {
      var overlap = item.accords.filter(function(a){ return ref.accords.indexOf(a) > -1; }).length;
      score += overlap * 1.2;
      if ((item.lijkt_op||[]).some(function(n){ return n.toLowerCase().indexOf(ref.naam.toLowerCase())>-1; })) score += 4;
    }
    return score;
  }

  function findMatches(query, limit, pool){
    var q = (query||"").trim().toLowerCase();
    if (!q) return [];
    var src = pool || autocompletePool();
    var out = [];
    for (var i = 0; i < src.length && out.length < limit; i++) {
      var p = src[i];
      if (p.naam.toLowerCase().indexOf(q) > -1 || (p.merk+" "+p.naam).toLowerCase().indexOf(q) > -1) out.push(p);
    }
    return out;
  }

  function findRef(){
    return findMatches(state.bekendeGeur, 1)[0] || null;
  }

  function genderPool(){
    if (!state.geslacht || state.geslacht === "unisex") return DATA;
    return DATA.filter(function(p){ return p.geslacht === state.geslacht; });
  }

  // Voor "ken je al een geur": mag ook unisex tonen naast het gekozen geslacht
  // (bij heren dus heren + unisex, niet alleen strikt heren).
  function autocompletePool(){
    if (!state.geslacht || state.geslacht === "unisex") return DATA;
    return DATA.filter(function(p){ return p.geslacht === state.geslacht || p.geslacht === "unisex"; });
  }

  // Elk criterium is een keiharde AND-filter (meerdere keuzes binnen hetzelfde
  // criterium tellen als OR: één overlap is genoeg). Dat garandeert dat het
  // aantal alleen kan dalen of gelijk blijven naarmate je meer kiest — nooit
  // stijgen, zoals de score-drempel van vroeger soms deed. De "bekende geur"
  // telt hier bewust niet mee: die is een zachte hint voor de eindresultaten,
  // geen expliciete eis, dus hij mag de teller niet laten springen.
  function itemMatchesCriteria(item){
    if (state.persoonlijkheid.length && !state.persoonlijkheid.some(function(t){ return item.persoonlijkheid.indexOf(t) > -1; })) return false;
    if (state.sillage && state.sillage !== "geen_voorkeur") {
      var bucket = sillageBucket();
      if (bucket && bucket.match && bucket.match.indexOf(item.sillage) === -1) return false;
    }
    if (state.moment.length && !state.moment.some(function(m){ return item.moment.indexOf(m) > -1; })) return false;
    if (state.seizoen.length && seizoenOverlapCount(item) === 0) return false;
    return true;
  }

  function liveMatchCount(){
    var pool = genderPool();
    if (state.budget) {
      var budgetRank = PRICE_RANK[state.budget] || 4;
      pool = pool.filter(function(p){ return PRICE_RANK[p.prijsklasse] <= budgetRank; });
    }
    var count = 0;
    for (var i = 0; i < pool.length; i++) {
      if (itemMatchesCriteria(pool[i])) count++;
    }
    // Vloer: de teller (en dus de belofte "zoveel passen er") mag nooit op
    // (bijna) nul uitkomen voor een ongebruikelijke combinatie — het
    // eindresultaat rangschikt sowieso altijd de hele pool op score, dus er
    // worden hoe dan ook parfums getoond; deze vloer houdt dat getal daarmee
    // in lijn i.p.v. iets te beloven dat kleiner is dan wat je straks ziet.
    return Math.max(count, Math.min(6, pool.length));
  }

  function rankedList(){
    var budgetRank = PRICE_RANK[state.budget] || 4;
    var ref = findRef();
    var pool = genderPool().filter(function(p){ return PRICE_RANK[p.prijsklasse] <= budgetRank; });
    pool = pool.map(function(p){ return {p:p, s: scoreItem(p, ref)}; });
    pool.sort(function(a,b){ return b.s - a.s; });
    return pool.map(function(x){ return x.p; });
  }

  // Mirrors build.py's FAMILY_TINT / bottle_svg() / bottle_visual_html() exactly,
  // so a perfume renders identically here and in the statically-built pages.
  var FAMILY_TINT = {"Fris":["#BFE3DE","#5FA79E"],"Amber":["#F0D9B5","#C2833F"],"Houtachtig":["#DCD3C1","#8C7355"],"Bloemig":["#F2D9E6","#C97AA0"]};
  var SHAPE_COUNT = 6;

  function shapeIndex(id){
    if (!id) return 0;
    var s = 0;
    for (var i=0; i<id.length; i++) s += id.charCodeAt(i);
    return s % SHAPE_COUNT;
  }

  function bottleSvg(fam, id, w, h){
    w = w || 140; h = h || 180;
    var t = FAMILY_TINT[fam] || FAMILY_TINT["Fris"];
    var light = t[0], dark = t[1];
    var shape = shapeIndex(id), cap, body, label;
    if (shape === 1) {
      body = '<path d="M70 30c-12 0-22 4-22 16v112c0 10 10 18 22 18s22-8 22-18V46c0-12-10-16-22-16Z" fill="'+light+'" stroke="'+dark+'" stroke-width="2"/>';
      cap = '<rect x="58" y="16" width="24" height="14" rx="3" fill="#ccc"/><rect x="54" y="4" width="32" height="14" rx="4" fill="#3a3a3a"/>';
      label = '<rect x="54" y="86" width="32" height="40" rx="4" fill="#FDFCFB" opacity=".78"/><rect x="58" y="96" width="24" height="4" rx="2" fill="'+dark+'" opacity=".55"/><rect x="58" y="104" width="16" height="4" rx="2" fill="'+dark+'" opacity=".35"/>';
    } else if (shape === 2) {
      body = '<rect x="20" y="32" width="100" height="118" rx="35" fill="'+light+'" stroke="'+dark+'" stroke-width="2"/>';
      cap = '<rect x="50" y="20" width="20" height="12" rx="3" fill="#ccc"/><rect x="46" y="10" width="28" height="12" rx="4" fill="#3a3a3a"/>';
      label = '<rect x="35" y="70" width="70" height="50" rx="6" fill="#FDFCFB" opacity=".78"/><rect x="45" y="85" width="50" height="4" rx="2" fill="'+dark+'" opacity=".55"/><rect x="45" y="97" width="34" height="4" rx="2" fill="'+dark+'" opacity=".35"/>';
    } else if (shape === 3) {
      body = '<path d="M48 32h44l14 20v92c0 10-8 18-18 18H52c-10 0-18-8-18-18V52Z" fill="'+light+'" stroke="'+dark+'" stroke-width="2"/>';
      cap = '<rect x="58" y="18" width="24" height="16" rx="2" fill="#ccc"/><rect x="54" y="6" width="32" height="14" rx="3" fill="#3a3a3a"/>';
      label = '<rect x="34" y="76" width="72" height="48" rx="4" fill="#FDFCFB" opacity=".78"/><rect x="42" y="88" width="50" height="4" rx="2" fill="'+dark+'" opacity=".55"/><rect x="42" y="98" width="34" height="4" rx="2" fill="'+dark+'" opacity=".35"/>';
    } else if (shape === 4) {
      body = '<rect x="42" y="36" width="56" height="124" rx="12" fill="'+light+'" stroke="'+dark+'" stroke-width="2"/>';
      cap = '<rect x="58" y="20" width="24" height="16" rx="3" fill="#ccc"/><rect x="54" y="8" width="32" height="14" rx="4" fill="#3a3a3a"/>';
      label = '<rect x="46" y="82" width="48" height="46" rx="4" fill="#FDFCFB" opacity=".78"/><rect x="52" y="94" width="36" height="4" rx="2" fill="'+dark+'" opacity=".55"/><rect x="52" y="104" width="24" height="4" rx="2" fill="'+dark+'" opacity=".35"/>';
    } else if (shape === 5) {
      body = '<path d="M34 34c0-4 3-6 7-6h58c4 0 7 2 7 6v26c0 8-16 14-16 36s16 28 16 36v26c0 4-3 6-7 6H41c-4 0-7-2-7-6v-26c0-8 16-14 16-36S34 68 34 60Z" fill="'+light+'" stroke="'+dark+'" stroke-width="2"/>';
      cap = '<rect x="58" y="14" width="24" height="16" rx="3" fill="#ccc"/><rect x="54" y="2" width="32" height="14" rx="4" fill="#3a3a3a"/>';
      label = '<rect x="40" y="70" width="60" height="42" rx="4" fill="#FDFCFB" opacity=".78"/><rect x="48" y="80" width="44" height="4" rx="2" fill="'+dark+'" opacity=".55"/><rect x="48" y="90" width="30" height="4" rx="2" fill="'+dark+'" opacity=".35"/>';
    } else {
      body = '<path d="M36 34h40c6 0 10 5 10 11v96c0 8-6 14-14 14H40c-8 0-14-6-14-14V45c0-6 4-11 10-11Z" fill="'+light+'" stroke="'+dark+'" stroke-width="2"/>';
      cap = '<rect x="44" y="18" width="24" height="16" rx="3" fill="#ccc"/><rect x="40" y="6" width="32" height="16" rx="4" fill="#3a3a3a"/>';
      label = '<rect x="26" y="70" width="60" height="50" rx="4" fill="#FDFCFB" opacity=".78"/><rect x="32" y="82" width="48" height="4" rx="2" fill="'+dark+'" opacity=".55"/><rect x="32" y="92" width="34" height="4" rx="2" fill="'+dark+'" opacity=".35"/>';
    }
    return '<svg viewBox="0 0 140 180" width="'+w+'" height="'+h+'">'+cap+body+label+'</svg>';
  }

  function bottleVisualHtml(p, w, h){
    if (p.afbeelding_url) {
      return '<img class="bottle-photo" src="' + p.afbeelding_url + '" alt="' + p.naam + '" loading="lazy">';
    }
    var fallback = FALLBACK_PHOTO[p.geslacht];
    if (fallback) {
      return '<img class="bottle-photo bottle-photo-fallback" src="' + CFG.assetBase + fallback + '" alt="' + p.naam + '" loading="lazy">' +
        '<span class="photo-label">Geen productfoto gevonden</span>';
    }
    return bottleSvg(p.familie_hoofd, p.id, w, h);
  }

  function matchChecklist(p){
    var bucket = sillageBucket();
    var overlap = state.persoonlijkheid.filter(function(t){ return p.persoonlijkheid.indexOf(t)>-1; });
    var momentOverlap = state.moment.filter(function(m){ return p.moment.indexOf(m)>-1; });
    return [
      {label: overlap.length ? "sluit aan bij " + overlap.join(", ") : "past bij je persoonlijkheid", on: overlap.length > 0},
      {label: "heeft de sterkte die je zocht", on: !!(bucket && bucket.match && bucket.match.indexOf(p.sillage) > -1)},
      {label: "past bij hoe je 'm wil dragen", on: momentOverlap.length > 0},
      {label: "past bij het seizoen dat je koos", on: seizoenOverlapCount(p) > 0}
    ];
  }

  function shopBtnHtml(p){
    return p.affiliate_url ?
      '<a class="shop-btn" href="' + p.affiliate_url + '" target="_blank" rel="noopener nofollow sponsored">Shop bij ICI Paris XL</a>' :
      '<button type="button" class="shop-btn shop-btn-empty" disabled>Geen prijs gevonden</button>';
  }

  function cardHtml(p, badge, pct){
    var whyItems = matchChecklist(p).map(function(c){
      return '<li class="' + (c.on ? "match" : "") + '"><span class="tick">' + (c.on ? "&#10003;" : "") + '</span>' + c.label + '</li>';
    }).join("");
    return '<article class="perfume-card" style="width:auto">' +
      (badge ? '<div class="badge' + (badge.grey?' grey':'') + '">' + badge.text + '</div>' : '') +
      '<span class="match-badge' + (badge?' match-badge-best':'') + '">' + pct + '% match</span>' +
      '<div class="bottle">' + bottleVisualHtml(p) + '</div>' +
      '<h3>' + p.naam + '</h3><div class="meta">' + p.merk + ' &middot; ' + p.concentratie + ' &middot; ' + p.prijsklasse + '</div>' +
      '<p>' + p.beschrijving + '</p>' +
      shopBtnHtml(p) +
      '<div class="card-actions-row">' +
      '<button type="button" class="why-toggle">Waarom goede match?<span class="why-car">&rsaquo;</span></button>' +
      '<a class="details-link" href="' + CFG.parfumBase + p.id + '/index.html" data-id="' + p.id + '">Bekijk details<span class="why-car">&rsaquo;</span></a>' +
      '</div>' +
      '<ul class="why-list">' + whyItems + '</ul>' +
      '</article>';
  }

  function capitalize(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  function tagListHtml(items){
    return (items||[]).map(function(t){ return '<span class="tag">' + t + '</span>'; }).join("");
  }

  // Mirrors build_perfume_page()'s spec_items/notes_html in build.py, so the
  // modal shows the exact same facts as the standalone product page.
  function detailModalContentHtml(p){
    var whyItems = matchChecklist(p).map(function(c){
      return '<li class="' + (c.on ? "match" : "") + '"><span class="tick">' + (c.on ? "&#10003;" : "") + '</span>' + c.label + '</li>';
    }).join("");
    var specs = [
      ["Merk", p.merk], ["Jaar", p.jaar], ["Concentratie", p.concentratie],
      ["Geurfamilie", p.familie_hoofd + " &middot; " + p.familie_sub],
      ["Longevity", capitalize(p.longevity)], ["Sillage", capitalize(p.sillage)],
      ["Prijsklasse", p.prijsklasse], ["Geslacht", capitalize(p.geslacht)],
      ["Seizoen", capitalize((p.seizoen||[]).join(", "))]
    ].map(function(kv){
      return '<div class="spec-item"><div class="k">' + kv[0] + '</div><div class="v">' + kv[1] + '</div></div>';
    }).join("");
    var notes = [["noten_top","Topnoten"],["noten_hart","Hartnoten"],["noten_basis","Basisnoten"]].map(function(kv){
      var vals = p[kv[0]] || [];
      return '<div><h4>' + kv[1] + '</h4><p>' + (vals.length ? vals.join(", ") : "n.v.t.") + '</p></div>';
    }).join("");
    return '<button type="button" class="detail-modal-close" id="detailModalClose" aria-label="Sluiten">&times;</button>' +
      '<div class="detail-modal-grid">' +
      '<div class="detail-modal-photo">' + bottleVisualHtml(p, 220, 280) + '</div>' +
      '<div>' +
      '<div class="detail-modal-eyebrow">' + p.merk + '</div>' +
      '<h3 class="detail-modal-title">' + p.naam + '</h3>' +
      '<p class="detail-modal-lead">' + p.beschrijving + '</p>' +
      '<ul class="detail-modal-checklist">' + whyItems + '</ul>' +
      shopBtnHtml(p) +
      '</div>' +
      '</div>' +
      '<div class="spec-grid">' + specs + '</div>' +
      '<div class="note-cols">' + notes + '</div>' +
      '<div>' + tagListHtml(p.persoonlijkheid) + '</div>' +
      '<div class="detail-modal-fullpage"><a href="' + CFG.parfumBase + p.id + '/index.html">Volledige productpagina &rsaquo;</a></div>';
  }

  var detailModalOverlay = null;

  function ensureDetailModal(){
    if (detailModalOverlay) return detailModalOverlay;
    var overlay = document.createElement("div");
    overlay.className = "detail-modal-overlay";
    overlay.innerHTML = '<div class="detail-modal-panel" id="detailModalPanel"></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener("click", function(e){ if (e.target === overlay) closeDetailModal(); });
    document.addEventListener("keydown", function(e){ if (e.key === "Escape") closeDetailModal(); });
    detailModalOverlay = overlay;
    return overlay;
  }

  function openDetailModal(id){
    var p = DATA.filter(function(x){ return x.id === id; })[0];
    if (!p) return;
    var overlay = ensureDetailModal();
    document.getElementById("detailModalPanel").innerHTML = detailModalContentHtml(p);
    document.getElementById("detailModalClose").onclick = closeDetailModal;
    overlay.classList.add("show");
    document.body.classList.add("modal-open");
  }

  function closeDetailModal(){
    if (!detailModalOverlay) return;
    detailModalOverlay.classList.remove("show");
    document.body.classList.remove("modal-open");
  }

  var TICK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';

  function heroPillsHtml(p){
    var onItems = matchChecklist(p).filter(function(c){ return c.on; });
    if (!onItems.length) return "";
    return '<div class="hero-pills">' + onItems.map(function(c){
      return '<span class="hero-pill on">' + TICK_SVG + c.label + '</span>';
    }).join("") + '</div>';
  }

  function heroCardHtml(p, rank, pct, isTop){
    return '<div class="hero-row' + (isTop ? ' rank-top' : '') + '">' +
      '<div class="hero-rank">' + (isTop ? "" : rank) + '</div>' +
      '<div class="hero-bottle-wrap">' +
      '<div class="hero-badge-pct"><span class="pct">' + pct + '%</span><span class="lbl">Match</span></div>' +
      '<div class="hero-bottle">' + bottleVisualHtml(p) + '</div>' +
      '</div>' +
      '<div class="hero-body">' +
      (isTop ? '<span class="hero-toplabel">Onze aanrader</span>' : '') +
      '<h3 class="hero-name">' + p.naam + '</h3>' +
      '<div class="hero-meta">' + p.merk + ' &middot; ' + p.concentratie + ' &middot; ' + p.prijsklasse + '</div>' +
      heroPillsHtml(p) +
      '<p class="hero-why">' + p.beschrijving + '</p>' +
      '<div class="hero-actions">' + shopBtnHtml(p) + '<a class="details-mini" href="' + CFG.parfumBase + p.id + '/index.html" data-id="' + p.id + '">Bekijk details &rarr;</a></div>' +
      '</div>' +
      '</div>';
  }

  function runMatchScan(cb){
    var panel = document.querySelector(".wizard-panel");
    if (!panel) { cb(); return; }
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) { setTimeout(cb, 150); return; }

    var all = rankedList();
    var poolCount = liveMatchCount();
    var finalCount = Math.min(RESULTS_PER_PAGE, all.length);

    var overlay = document.createElement("div");
    overlay.className = "wizard-scan-overlay";
    overlay.innerHTML =
      '<div class="scan-ring-wrap">' +
      '<svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="' + RING_R + '" fill="none" stroke="var(--border)" stroke-width="6"/>' +
      '<circle id="scanArc" cx="48" cy="48" r="' + RING_R + '" fill="none" stroke="var(--accent)" stroke-width="6" stroke-linecap="round" ' +
      'stroke-dasharray="' + RING_C.toFixed(1) + '" stroke-dashoffset="' + RING_C.toFixed(1) + '" transform="rotate(-90 48 48)"/></svg>' +
      '<div class="scan-ring-center" id="scanRingLabel">' + DATA.length + '</div>' +
      '</div>' +
      '<ul class="scan-stage-list">' +
      '<li><span class="scan-stage-tick">&#10003;</span>Profiel samengesteld</li>' +
      '<li><span class="scan-stage-tick">&#10003;</span>' + DATA.length + ' parfums doorzocht</li>' +
      '<li><span class="scan-stage-tick">&#10003;</span>Beste matches geselecteerd</li>' +
      '</ul>';
    panel.appendChild(overlay);

    var arc = overlay.querySelector("#scanArc");
    var label = overlay.querySelector("#scanRingLabel");
    var items = overlay.querySelectorAll(".scan-stage-list li");

    requestAnimationFrame(function(){
      overlay.classList.add("show");
      arc.setAttribute("stroke-dashoffset", "0");
    });

    setTimeout(function(){ items[0].classList.add("done"); }, 300);
    setTimeout(function(){ items[1].classList.add("done"); label.textContent = poolCount; }, 850);
    setTimeout(function(){ items[2].classList.add("done"); label.textContent = finalCount; }, 1400);
    setTimeout(cb, 1800);
  }

  function stateToParams(){
    var sp = new URLSearchParams();
    if (state.geslacht) sp.set("g", state.geslacht);
    if (state.persoonlijkheid.length) sp.set("p", state.persoonlijkheid.join(","));
    if (state.sillage) sp.set("s", state.sillage);
    if (state.moment.length) sp.set("m", state.moment.join(","));
    if (state.seizoen.length) sp.set("z", state.seizoen.join(","));
    if (state.budget) sp.set("b", state.budget);
    if (state.bekendeGeur) sp.set("r", state.bekendeGeur);
    sp.set("n", state.shown.length);
    return sp;
  }

  function updateUrl(){
    // pushState kan een SecurityError gooien wanneer de pagina via file:// geopend is;
    // dat mag de wizard niet blokkeren, dus vangen we het stilletjes af.
    try { history.pushState({}, "", "?" + stateToParams().toString()); } catch (e) {}
  }

  function paramsToState(sp){
    var g = sp.get("g");
    if (!g) return 0;
    state.geslacht = g;
    state.persoonlijkheid = sp.get("p") ? sp.get("p").split(",").filter(Boolean) : [];
    state.sillage = sp.get("s") || null;
    state.moment = sp.get("m") ? sp.get("m").split(",").filter(Boolean) : [];
    state.seizoen = sp.get("z") ? sp.get("z").split(",").filter(Boolean) : [];
    state.budget = sp.get("b") || null;
    state.bekendeGeur = sp.get("r") || "";
    var n = parseInt(sp.get("n"), 10);
    return (n && n > 0) ? Math.min(n, MAX_SHOWN) : RESULTS_PER_PAGE;
  }

  function shareUrl(){
    return location.href;
  }

  function shareText(){
    return "Ik heb via ParfumPicker.nl parfums gevonden die bij me passen, kijk maar:";
  }

  var SHARE_ICONS = {
    whatsapp: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H5l-2 2v-2.5A8.5 8.5 0 1 1 21 11.5Z"/></svg>',
    mail: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    link: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 15 15 9"/><path d="M11 6l1-1a4 4 0 0 1 6 6l-1 1"/><path d="M13 18l-1 1a4 4 0 0 1-6-6l1-1"/></svg>',
    pdf: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 19h14"/></svg>'
  };

  function renderShareBar(){
    var url = shareUrl();
    var waHref = "https://wa.me/?text=" + encodeURIComponent(shareText() + " " + url);
    var mailHref = "mailto:?subject=" + encodeURIComponent("Mijn ParfumPicker-advies") +
      "&body=" + encodeURIComponent(shareText() + "\n\n" + url);
    return '<div class="share-section">' +
      '<h3 class="share-heading">Bewaar of deel je advies!</h3>' +
      '<p class="share-subtext">Wil je dit advies bewaren? Sla &rsquo;m op als PDF of stuur &rsquo;m met 1 klik door via WhatsApp of de mail.</p>' +
      '<div class="share-bar">' +
      '<a class="share-btn" href="' + waHref + '" target="_blank" rel="noopener">' + SHARE_ICONS.whatsapp + '<span>WhatsApp</span></a>' +
      '<a class="share-btn" href="' + mailHref + '">' + SHARE_ICONS.mail + '<span>E-mail</span></a>' +
      '<button type="button" class="share-btn" id="copyLinkBtn">' + SHARE_ICONS.link + '<span>Kopieer link</span></button>' +
      '<button type="button" class="share-btn" id="savePdfBtn">' + SHARE_ICONS.pdf + '<span>Bewaar als PDF</span></button>' +
      '</div>' +
      '</div>';
  }

  function bindShareBar(){
    var copyBtn = document.getElementById("copyLinkBtn");
    var copyLabel = copyBtn.querySelector("span");
    copyBtn.onclick = function(){
      var url = shareUrl();
      var done = function(){ copyLabel.textContent = "Gekopieerd!"; setTimeout(function(){ copyLabel.textContent = "Kopieer link"; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done).catch(function(){ window.prompt("Kopieer deze link:", url); });
      } else {
        window.prompt("Kopieer deze link:", url);
      }
    };
    document.getElementById("savePdfBtn").onclick = function(){ window.print(); };
  }

  function showResults(count){
    var all = rankedList();

    if (!all.length) {
      try { history.pushState({}, "", "?resultaat=1"); } catch (e) {}
      root.innerHTML =
        '<div class="wizard-panel" style="max-width:640px;margin:32px auto;text-align:center">' +
        '<h2 style="font-size:22px">Geen match gevonden</h2>' +
        '<p style="color:var(--text-muted)">Voor deze combinatie van antwoorden hebben we nog geen passend advies. Probeer een ruimer budget of begin opnieuw.</p>' +
        '<button class="btn btn-primary" id="opnieuwBtn">Opnieuw beginnen</button>' +
        '</div>';
      document.getElementById("opnieuwBtn").onclick = function(){ resetWizard(); };
      return;
    }

    state.shown = all.slice(0, count || RESULTS_PER_PAGE);
    updateUrl();
    renderResultsList(all);
  }

  function renderResultsList(all){
    var ref = findRef();
    var topScore = all.length ? scoreItem(all[0], ref) : 0;
    function pctFor(p){
      return topScore > 0 ? Math.max(45, Math.min(100, Math.round((scoreItem(p, ref)/topScore)*100))) : 60;
    }

    var heroItems = state.shown.slice(0, 3);
    var restItems = state.shown.slice(3);
    var heroHtml = heroItems.map(function(p, i){ return heroCardHtml(p, i+1, pctFor(p), i===0); }).join("");
    var restCards = restItems.map(function(p){ return cardHtml(p, null, pctFor(p)); }).join("");

    var shownIds = state.shown.map(function(p){ return p.id; });
    var remaining = all.filter(function(p){ return shownIds.indexOf(p.id) === -1; });
    var canShowMore = remaining.length > 0 && state.shown.length < MAX_SHOWN;
    var moreTile = canShowMore ?
      '<button type="button" class="show-more-tile" id="meerBtn"><span class="show-more-plus">+</span>Laat meer zien</button>' : '';
    var moreSectionHtml = (restItems.length || canShowMore) ?
      '<h3 class="results-section-heading results-section-heading-more">Meer aanbevelingen</h3>' +
      '<div class="perfume-grid" id="resultsGrid">' + restCards + moreTile + '</div>' : '';

    root.innerHTML =
      '<div class="results-summary container" style="max-width:920px;margin:0 auto">' +
      '<h1 class="results-title">Uitslag ParfumPicker</h1>' +
      '<p class="sub" style="margin-bottom:0">Gebaseerd op jouw antwoorden &middot; 100% gratis &middot; We sturen op match, niet op populariteit.</p>' +
      '</div>' +
      '<div class="hero-list container" style="max-width:920px;margin:20px auto 0" id="heroList">' +
      '<h3 class="results-section-heading">Jouw gepersonaliseerde Top 3</h3>' +
      '<div class="hero-rows-wrap">' + heroHtml + '</div>' +
      moreSectionHtml +
      '</div>' +
      '<div class="container" style="max-width:920px;margin:30px auto;display:flex;justify-content:center">' +
      '<div class="ad-unit ad-unit-leaderboard" aria-hidden="true"><span>Advertentie</span><span class="ad-unit-size">728&times;90</span></div>' +
      '</div>' +
      '<div class="container" style="max-width:920px;margin:20px auto 0">' + renderShareBar() + '</div>' +
      '<div style="text-align:center;margin:28px 0 30px"><button type="button" class="btn btn-outline" id="opnieuwLink">Opnieuw beginnen</button></div>';

    document.getElementById("opnieuwLink").onclick = function(){ resetWizard(); };
    bindShareBar();
    staggerGrid(document.querySelector("#heroList .hero-rows-wrap"));

    var grid = document.getElementById("resultsGrid");
    if (grid) staggerGrid(grid);

    var heroList = document.getElementById("heroList");
    if (heroList) {
      heroList.addEventListener("click", function(e){
        var btn = e.target.closest(".why-toggle");
        if (btn) {
          btn.classList.toggle("open");
          var row = btn.closest(".card-actions-row");
          var list = row ? row.nextElementSibling : null;
          if (list) list.classList.toggle("open");
          return;
        }
        var link = e.target.closest(".details-link, .details-mini");
        if (link) {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
          openDetailModal(link.getAttribute("data-id"));
        }
      });
    }

    if (canShowMore) {
      document.getElementById("meerBtn").onclick = function(){
        var prevCount = state.shown.length - 3;
        var room = MAX_SHOWN - state.shown.length;
        var add = remaining.slice(0, Math.min(RESULTS_PER_PAGE, room));
        state.shown = state.shown.concat(add);
        updateUrl();
        renderResultsList(all);
        var newGrid = document.getElementById("resultsGrid");
        var newCard = newGrid && newGrid.children[prevCount];
        if (newCard) newCard.scrollIntoView({behavior:"smooth", block:"center"});
      };
    }
  }

  var STEP_RENDERERS = {
    geslacht: renderStepGeslacht,
    bekend: renderStepBekend,
    persoonlijkheid: renderStepPersoonlijkheid,
    sillage: renderStepSillage,
    budget: renderStepBudget,
    voorkeur: renderStepVoorkeur
  };

  function render(){
    var key = STEPS[state.step];
    var fn = STEP_RENDERERS[key];
    if (fn) fn();
  }

  function resetWizard(){
    state.geslacht = null;
    state.bekendeGeur = "";
    state.persoonlijkheid = [];
    state.sillage = null;
    state.moment = [];
    state.seizoen = [];
    state.budget = null;
    state.bekendheid = { uniek: false, bekend: false };
    state.step = 0;
    state.shown = [];
    lastShownCount = null;
    hasGivenInput = false;
    try { history.pushState({}, "", location.pathname + location.hash); } catch (e) {}
    render();
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  fetchData().then(function(){
    var sp = new URLSearchParams(location.search);
    var sharedCount = paramsToState(sp);
    if (sharedCount) {
      var pr = document.getElementById("proofRow");
      if (pr) pr.style.display = "none";
      var wh = document.getElementById("wizardHost");
      if (wh) wh.classList.add("show");
      showResults(sharedCount);
    } else {
      render();
    }
  }).catch(function(err){
    root.innerHTML = '<div class="wizard-panel" style="max-width:640px;margin:32px auto;text-align:center">' +
      '<p style="color:var(--text-muted)">' + err.message + '</p></div>';
  });
})();