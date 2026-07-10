(function(){
  "use strict";

  var PRICE_RANK = {"€":1,"€€":2,"€€€":3,"€€€€":4};
  var PERSONALITY_OPTIONS = ["gedurfd","zelfverzekerd","stoer","warm","fris","klassiek","modern","elegant","verfijnd","mysterieus","sportief","speels"];
  var GELEGENHEID_OPTIONS = [
    {v:"verjaardag", l:"Verjaardag"},
    {v:"kerst", l:"Kerst / Sinterklaas"},
    {v:"valentijn", l:"Valentijn"},
    {v:"jubileum", l:"Jubileum"},
    {v:"elke gelegenheid", l:"Geen speciale gelegenheid"}
  ];
  var MOMENT_OPTIONS = [
    {v:"dagelijks", l:"Dagelijks"},
    {v:"kantoor", l:"Op werk / kantoor"},
    {v:"avond", l:"'s Avonds"},
    {v:"uitgaan", l:"Uitgaan"}
  ];
  var SEIZOEN_OPTIONS = [
    {v:"lente", l:"Lente"},{v:"zomer", l:"Zomer"},{v:"herfst", l:"Herfst"},{v:"winter", l:"Winter"}
  ];
  var BUDGET_OPTIONS = [
    {v:"€", l:"Tot €40"},{v:"€€", l:"€40 – €80"},{v:"€€€", l:"€80 – €150"},{v:"€€€€", l:"Geen limiet"}
  ];

  var state = {
    geslacht: null,
    gelegenheid: null,
    bekendeGeur: "",
    persoonlijkheid: [],
    moment: [],
    seizoen: [],
    budget: null,
    step: 0,
    shown: []
  };

  var STEPS = ["geslacht","gelegenheid","bekend","persoonlijkheid","moment","budget","seizoen"];

  var root = document.getElementById("wizardApp");
  var DATA = [];

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

  function progress(){
    return Math.round(((state.step) / (STEPS.length)) * 100);
  }

  function renderShell(inner){
    root.innerHTML =
      '<div class="wizard-panel" style="max-width:760px;margin:32px auto">' +
      '<div class="wizard-step-label">Stap ' + Math.min(state.step+1, STEPS.length) + ' van ' + STEPS.length + '</div>' +
      '<div class="progress-track"><div class="progress-fill" style="width:' + progress() + '%"></div></div>' +
      '<div id="wizardInner"></div>' +
      '</div>';
    document.getElementById("wizardInner").innerHTML = inner;
  }

  function nav(canBack, canNext, nextLabel, onNext, skip){
    var bar = document.createElement("div");
    bar.className = "wizard-nav";
    var back = document.createElement("button");
    back.className = "btn btn-outline";
    back.textContent = "Vorige";
    back.disabled = !canBack;
    back.onclick = function(){ state.step = Math.max(0, state.step-1); render(); };
    var right = document.createElement("div");
    right.style.display = "flex"; right.style.gap = "10px";
    if (skip) {
      var skipBtn = document.createElement("button");
      skipBtn.className = "btn btn-outline";
      skipBtn.textContent = "Sla over";
      skipBtn.onclick = skip;
      right.appendChild(skipBtn);
    }
    var next = document.createElement("button");
    next.className = "btn btn-primary";
    next.textContent = nextLabel || "Volgende";
    next.disabled = !canNext;
    next.onclick = onNext;
    right.appendChild(next);
    bar.appendChild(back); bar.appendChild(right);
    document.getElementById("wizardInner").appendChild(bar);
  }

  function optionCard(label, iconSvg, selected, onClick, multi){
    var d = document.createElement("div");
    d.className = "option-card" + (selected ? " selected" : "") + (multi ? " multi" : "");
    d.innerHTML = (iconSvg||"") + "<div>" + label + "</div>";
    d.onclick = onClick;
    return d;
  }

  var USER_ICON = '<svg class="oi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.4-3.8 4.2-5.6 7.5-5.6s6.1 1.8 7.5 5.6" stroke-linecap="round"/></svg>';

  function renderStepGeslacht(){
    renderShell('<strong style="display:block;margin-bottom:14px;font-size:19px">Voor wie zoek je een parfum?</strong><div class="option-grid" id="opts"></div>');
    var opts = document.getElementById("opts");
    [["heren","Voor een man"],["dames","Voor een vrouw"],["unisex","Unisex / geen voorkeur"]].forEach(function(o){
      opts.appendChild(optionCard(o[1], USER_ICON, state.geslacht===o[0], function(){ state.geslacht = o[0]; render(); }));
    });
    nav(false, !!state.geslacht, "Volgende", function(){ state.step++; render(); });
  }

  function renderStepGelegenheid(){
    renderShell('<strong style="display:block;margin-bottom:14px;font-size:19px">Wat is de gelegenheid?</strong><div class="option-grid" id="opts"></div>');
    var opts = document.getElementById("opts");
    GELEGENHEID_OPTIONS.forEach(function(o){
      opts.appendChild(optionCard(o.l, "", state.gelegenheid===o.v, function(){ state.gelegenheid = o.v; render(); }));
    });
    nav(true, !!state.gelegenheid, "Volgende", function(){ state.step++; render(); });
  }

  function renderStepBekend(){
    renderShell(
      '<strong style="display:block;margin-bottom:10px;font-size:19px">Ken je al een merk of parfum dat diegene mooi vindt?</strong>' +
      '<p style="color:var(--text-muted);font-size:14px;margin-bottom:14px">Optioneel — helpt ons een nog betere match te vinden.</p>' +
      '<input id="bekendInput" type="text" placeholder="Bijv. Dior Sauvage, of gewoon leeg laten" value="' + (state.bekendeGeur||"") + '" style="width:100%;padding:14px 16px;border:2px solid var(--border);border-radius:12px;font-size:15px;font-family:inherit">'
    );
    document.getElementById("bekendInput").oninput = function(e){ state.bekendeGeur = e.target.value; };
    nav(true, true, "Volgende", function(){ state.step++; render(); }, function(){ state.bekendeGeur=""; state.step++; render(); });
  }

  function renderStepPersoonlijkheid(){
    renderShell('<strong style="display:block;margin-bottom:6px;font-size:19px">Hoe zou je de persoonlijkheid omschrijven?</strong><p style="color:var(--text-muted);font-size:14px;margin-bottom:14px">Kies 2 tot 3 kenmerken.</p><div class="option-grid" id="opts"></div>');
    var opts = document.getElementById("opts");
    PERSONALITY_OPTIONS.forEach(function(v){
      var selected = state.persoonlijkheid.indexOf(v) > -1;
      opts.appendChild(optionCard(v.charAt(0).toUpperCase()+v.slice(1), "", selected, function(){
        var i = state.persoonlijkheid.indexOf(v);
        if (i>-1) state.persoonlijkheid.splice(i,1);
        else if (state.persoonlijkheid.length < 3) state.persoonlijkheid.push(v);
        render();
      }, true));
    });
    nav(true, state.persoonlijkheid.length>0, "Volgende", function(){ state.step++; render(); });
  }

  function renderStepMoment(){
    renderShell('<strong style="display:block;margin-bottom:6px;font-size:19px">Draagt hij dit vooral dagelijks, of juist \'s avonds?</strong><p style="color:var(--text-muted);font-size:14px;margin-bottom:14px">Kies wat past (optioneel, mag meerdere).</p><div class="option-grid" id="opts"></div>');
    var opts = document.getElementById("opts");
    MOMENT_OPTIONS.forEach(function(o){
      var selected = state.moment.indexOf(o.v) > -1;
      opts.appendChild(optionCard(o.l, "", selected, function(){
        var i = state.moment.indexOf(o.v);
        if (i>-1) state.moment.splice(i,1); else state.moment.push(o.v);
        render();
      }, true));
    });
    nav(true, true, "Volgende", function(){ state.step++; render(); }, function(){ state.moment=[]; state.step++; render(); });
  }

  function renderStepBudget(){
    renderShell('<strong style="display:block;margin-bottom:14px;font-size:19px">Wat is je budget?</strong><div class="option-grid" id="opts"></div>');
    var opts = document.getElementById("opts");
    BUDGET_OPTIONS.forEach(function(o){
      opts.appendChild(optionCard(o.l, "", state.budget===o.v, function(){ state.budget = o.v; render(); }));
    });
    nav(true, !!state.budget, "Volgende", function(){ state.step++; render(); });
  }

  function renderStepSeizoen(){
    renderShell('<strong style="display:block;margin-bottom:6px;font-size:19px">In welk seizoen wordt dit vooral gedragen?</strong><p style="color:var(--text-muted);font-size:14px;margin-bottom:14px">Optioneel, voor extra verfijning.</p><div class="option-grid" id="opts"></div>');
    var opts = document.getElementById("opts");
    SEIZOEN_OPTIONS.forEach(function(o){
      var selected = state.seizoen.indexOf(o.v) > -1;
      opts.appendChild(optionCard(o.l, "", selected, function(){
        var i = state.seizoen.indexOf(o.v);
        if (i>-1) state.seizoen.splice(i,1); else state.seizoen.push(o.v);
        render();
      }, true));
    });
    nav(true, true, "Bekijk mijn advies", function(){ showResults(); }, function(){ state.seizoen=[]; showResults(); });
  }

  function scoreItem(item, ref){
    var score = 0;
    if (state.gelegenheid) {
      if (item.cadeau_gelegenheid.indexOf(state.gelegenheid) > -1) score += 3;
      else if (item.cadeau_gelegenheid.indexOf("elke gelegenheid") > -1) score += 1;
    }
    state.persoonlijkheid.forEach(function(t){ if (item.persoonlijkheid.indexOf(t) > -1) score += 2; });
    state.moment.forEach(function(m){ if (item.moment.indexOf(m) > -1) score += 1; });
    state.seizoen.forEach(function(s){ if (item.seizoen.indexOf(s) > -1) score += 1; });
    if (ref && ref.id !== item.id) {
      var overlap = item.accords.filter(function(a){ return ref.accords.indexOf(a) > -1; }).length;
      score += overlap * 1.2;
      if ((item.lijkt_op||[]).some(function(n){ return n.toLowerCase().indexOf(ref.naam.toLowerCase())>-1; })) score += 4;
    }
    return score;
  }

  function findRef(){
    var q = (state.bekendeGeur||"").trim().toLowerCase();
    if (!q) return null;
    var found = DATA.find(function(p){ return p.naam.toLowerCase().indexOf(q)>-1 || (p.merk+" "+p.naam).toLowerCase().indexOf(q)>-1; });
    return found || null;
  }

  function rankedList(){
    if (state.geslacht !== "heren") return [];
    var budgetRank = PRICE_RANK[state.budget] || 4;
    var ref = findRef();
    var pool = DATA.filter(function(p){ return PRICE_RANK[p.prijsklasse] <= budgetRank; });
    pool = pool.map(function(p){ return {p:p, s: scoreItem(p, ref)}; });
    pool.sort(function(a,b){ return b.s - a.s; });
    return pool.map(function(x){ return x.p; });
  }

  function bottleShapeIndex(id){
    // Mirrors build.py's shape_index() exactly: sum of char codes mod 3.
    // Must NOT use any language/runtime-randomized hash - this has to agree
    // with the Python side for the same id on every page load.
    if (!id) return 0;
    var s = 0;
    for (var i=0; i<id.length; i++) s += id.charCodeAt(i);
    return s % 3;
  }

  function bottleSvgInline(fam, id){
    var tints = {"Fris":["#BFE3DE","#5FA79E"],"Amber":["#F0D9B5","#C2833F"],"Houtachtig":["#DCD3C1","#8C7355"],"Bloemig":["#F2D9E6","#C97AA0"]};
    var t = tints[fam] || tints["Fris"];
    var shape = bottleShapeIndex(id);
    var cap, body, label;
    if (shape === 1) {
      body = '<path d="M70 30c-12 0-22 4-22 16v112c0 10 10 18 22 18s22-8 22-18V46c0-12-10-16-22-16Z" fill="'+t[0]+'" stroke="'+t[1]+'" stroke-width="2"/>';
      cap = '<rect x="58" y="16" width="24" height="14" rx="3" fill="#ccc"/><rect x="54" y="4" width="32" height="14" rx="4" fill="#3a3a3a"/>';
      label = '<rect x="54" y="86" width="32" height="40" rx="4" fill="#FDFCFB" opacity=".78"/><rect x="58" y="96" width="24" height="4" rx="2" fill="'+t[1]+'" opacity=".55"/><rect x="58" y="104" width="16" height="4" rx="2" fill="'+t[1]+'" opacity=".35"/>';
    } else if (shape === 2) {
      body = '<rect x="20" y="32" width="100" height="118" rx="35" fill="'+t[0]+'" stroke="'+t[1]+'" stroke-width="2"/>';
      cap = '<rect x="50" y="20" width="20" height="12" rx="3" fill="#ccc"/><rect x="46" y="10" width="28" height="12" rx="4" fill="#3a3a3a"/>';
      label = '<rect x="35" y="70" width="70" height="50" rx="6" fill="#FDFCFB" opacity=".78"/><rect x="45" y="85" width="50" height="4" rx="2" fill="'+t[1]+'" opacity=".55"/><rect x="45" y="97" width="34" height="4" rx="2" fill="'+t[1]+'" opacity=".35"/>';
    } else {
      body = '<path d="M36 34h40c6 0 10 5 10 11v96c0 8-6 14-14 14H40c-8 0-14-6-14-14V45c0-6 4-11 10-11Z" fill="'+t[0]+'" stroke="'+t[1]+'" stroke-width="2"/>';
      cap = '<rect x="44" y="18" width="24" height="16" rx="3" fill="#ccc"/><rect x="40" y="6" width="32" height="16" rx="4" fill="#3a3a3a"/>';
      label = '<rect x="26" y="70" width="60" height="50" rx="4" fill="#FDFCFB" opacity=".78"/><rect x="32" y="82" width="48" height="4" rx="2" fill="'+t[1]+'" opacity=".55"/><rect x="32" y="92" width="34" height="4" rx="2" fill="'+t[1]+'" opacity=".35"/>';
    }
    return '<svg viewBox="0 0 140 180" width="140" height="180">'+cap+body+label+'</svg>';
  }

  function reasonText(p){
    var bits = [];
    if (state.gelegenheid && p.cadeau_gelegenheid.indexOf(state.gelegenheid)>-1) bits.push("past bij de gelegenheid die je koos");
    var overlap = state.persoonlijkheid.filter(function(t){ return p.persoonlijkheid.indexOf(t)>-1; });
    if (overlap.length) bits.push("sluit aan bij " + overlap.join(", "));
    if (!bits.length) bits.push("scoort goed op prijs en breed toepasbare kenmerken");
    return "Dit " + bits.join(" en ") + ".";
  }

  function cardHtml(p, badge){
    return '<article class="perfume-card" style="width:auto">' +
      (badge ? '<div class="badge' + (badge.grey?' grey':'') + '">' + badge.text + '</div>' : '') +
      '<div class="bottle">' + bottleSvgInline(p.familie_hoofd, p.id) + '</div>' +
      '<h3>' + p.naam + '</h3><div class="meta">' + p.merk + ' &middot; ' + p.concentratie + ' &middot; ' + p.prijsklasse + '</div>' +
      '<p>' + p.beschrijving + '</p>' +
      '<div class="result-explain">' + reasonText(p) + '</div>' +
      '<a class="details-link" style="margin-top:10px" href="../parfums/' + p.id + '/index.html">Bekijk details →</a>' +
      '</article>';
  }

  function showResults(){
    // pushState kan een SecurityError gooien wanneer de pagina via file:// geopend is;
    // dat mag de wizard niet blokkeren, dus vangen we het stilletjes af.
    try { history.pushState({}, "", "?resultaat=1"); } catch (e) {}
    var all = rankedList();

    if (state.geslacht !== "heren") {
      root.innerHTML =
        '<div class="wizard-panel" style="max-width:640px;margin:32px auto;text-align:center">' +
        '<h2 style="font-size:22px">Bijna zover!</h2>' +
        '<p style="color:var(--text-muted)">Onze database voor dames- en unisex-parfums breiden we op dit moment nog uit. Op dit moment hebben we het meeste advies voor herenparfums klaarstaan.</p>' +
        '<button class="btn btn-primary" id="terugHeren">Toon adviezen voor herenparfums</button>' +
        '</div>';
      document.getElementById("terugHeren").onclick = function(){ state.geslacht = "heren"; showResults(); };
      return;
    }

    state.shown = all.slice(0, 4);
    renderResultsList(all);
  }

  function renderResultsList(all){
    var shownIds = state.shown.map(function(p){ return p.id; });
    var cards = state.shown.map(function(p, i){
      var badge = i===0 ? {text:"Onze aanrader"} : null;
      return cardHtml(p, badge);
    }).join("");

    root.innerHTML =
      '<div class="results-summary container" style="max-width:920px;margin:0 auto">' +
      '<h2 style="font-size:24px">Jouw persoonlijke aanbevelingen</h2>' +
      '<p class="sub" style="margin-bottom:0">Gebaseerd op jouw antwoorden &middot; 100% gratis &middot; We sturen op match, niet op populariteit.</p>' +
      '</div>' +
      '<div class="perfume-grid container" style="max-width:920px;margin:20px auto" id="resultsGrid">' + cards + '</div>' +
      '<div class="ad-slot container" style="max-width:920px;margin:30px auto">Advertentie</div>' +
      '<div class="alt-actions"><button class="btn btn-outline" id="altBtn">Toon meer alternatieven</button></div>' +
      '<div style="text-align:center;margin-bottom:30px"><a href="index.html" id="opnieuwLink" class="details-link">Opnieuw beginnen</a></div>';

    document.getElementById("opnieuwLink").onclick = function(e){ e.preventDefault(); location.href = "index.html"; };

    document.getElementById("altBtn").onclick = function(){
      var remaining = all.filter(function(p){ return shownIds.indexOf(p.id) === -1; });
      var next;
      if (remaining.length >= 4) {
        next = remaining.slice(0, 4);
      } else if (remaining.length > 0) {
        next = remaining;
      } else {
        // pool uitgeput: herschud de volledige lijst zodat het nooit doodloopt
        next = all.slice().sort(function(){ return Math.random()-0.5; }).slice(0,4);
      }
      state.shown = next;
      renderResultsList(all);
      window.scrollTo({top: document.getElementById("resultsGrid").offsetTop - 100, behavior:"smooth"});
    };
  }

  var STEP_RENDERERS = {
    geslacht: renderStepGeslacht,
    gelegenheid: renderStepGelegenheid,
    bekend: renderStepBekend,
    persoonlijkheid: renderStepPersoonlijkheid,
    moment: renderStepMoment,
    budget: renderStepBudget,
    seizoen: renderStepSeizoen
  };

  function render(){
    var key = STEPS[state.step];
    var fn = STEP_RENDERERS[key];
    if (fn) fn();
  }

  fetchData().then(function(){
    render();
  }).catch(function(err){
    root.innerHTML = '<div class="wizard-panel" style="max-width:640px;margin:32px auto;text-align:center">' +
      '<p style="color:var(--text-muted)">' + err.message + '</p></div>';
  });
})();