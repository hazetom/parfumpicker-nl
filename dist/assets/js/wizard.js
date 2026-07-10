(function(){
  "use strict";

  var PRICE_RANK = {"€":1,"€€":2,"€€€":3,"€€€€":4};
  var PERSONALITY_OPTIONS = ["gedurfd","zelfverzekerd","stoer","warm","fris","klassiek","modern","elegant","verfijnd","mysterieus","sportief","speels"];

  var ICON_GIFT = '<svg class="oi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="9" width="18" height="4.2" rx="1"/><rect x="4.4" y="13.2" width="15.2" height="8" rx="1"/><path d="M12 9v12.2"/><path d="M12 9c-1.2-3-3-4.6-4.6-4.6a2.2 2.2 0 0 0 0 4.6Z"/><path d="M12 9c1.2-3 3-4.6 4.6-4.6a2.2 2.2 0 0 1 0 4.6Z"/></svg>';
  var ICON_SNOWFLAKE = '<svg class="oi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 2.5v19M4.7 7.1l14.6 9.8M19.3 7.1L4.7 16.9"/></svg>';
  var ICON_HEART = '<svg class="oi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M12 20.2c-.3 0-.6-.1-.8-.3l-6.8-6.2C2.3 11.8 2 9.9 3 8.3c1.3-2 4.2-2.4 6-.8l3 2.7 3-2.7c1.8-1.6 4.7-1.2 6 .8 1 1.6.7 3.5-1.4 5.4l-6.8 6.2c-.2.2-.5.3-.8.3Z"/></svg>';
  var ICON_CALENDAR = '<svg class="oi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17"/><path d="M8 3v4M16 3v4"/></svg>';
  var ICON_SUN = '<svg class="oi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7"/></svg>';
  var ICON_BRIEFCASE = '<svg class="oi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="2.7" y="7.5" width="18.6" height="12.3" rx="2"/><path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5"/><path d="M2.7 12.8h18.6"/></svg>';
  var ICON_MOON = '<svg class="oi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/></svg>';
  var ICON_SPARKLE = '<svg class="oi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2-5.2-1.8 5.2-1.8Z"/><path d="M19 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z"/></svg>';
  var ICON_FLOWER = '<svg class="oi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><circle cx="12" cy="12" r="2.3"/><path d="M12 9.7a2.6 2.6 0 1 1 0-5.2 2.6 2.6 0 0 1 0 5.2ZM12 19.5a2.6 2.6 0 1 1 0-5.2 2.6 2.6 0 0 1 0 5.2ZM14.3 12a2.6 2.6 0 1 1 5.2 0 2.6 2.6 0 0 1-5.2 0ZM4.5 12a2.6 2.6 0 1 1 5.2 0 2.6 2.6 0 0 1-5.2 0Z"/></svg>';
  var ICON_LEAF = '<svg class="oi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 19c8-1 14-6 15-15C10 5 5 11 4 19Z"/><path d="M6 18c3-4 6-7 12-12"/></svg>';

  var GELEGENHEID_OPTIONS = [
    {v:"verjaardag", l:"Verjaardag", icon:ICON_GIFT},
    {v:"kerst", l:"Kerst / Sinterklaas", icon:ICON_SNOWFLAKE},
    {v:"valentijn", l:"Valentijn", icon:ICON_HEART},
    {v:"jubileum", l:"Jubileum", icon:ICON_SPARKLE},
    {v:"elke gelegenheid", l:"Geen speciale gelegenheid", icon:ICON_CALENDAR}
  ];
  var MOMENT_OPTIONS = [
    {v:"dagelijks", l:"Dagelijks", icon:ICON_SUN},
    {v:"kantoor", l:"Op werk / kantoor", icon:ICON_BRIEFCASE},
    {v:"avond", l:"'s Avonds", icon:ICON_MOON},
    {v:"uitgaan", l:"Uitgaan", icon:ICON_SPARKLE}
  ];
  var SEIZOEN_OPTIONS = [
    {v:"lente", l:"Lente", icon:ICON_FLOWER},{v:"zomer", l:"Zomer", icon:ICON_SUN},
    {v:"herfst", l:"Herfst", icon:ICON_LEAF},{v:"winter", l:"Winter", icon:ICON_SNOWFLAKE}
  ];
  var BUDGET_OPTIONS = [
    {v:"€", p:"€", l:"Tot €40"},{v:"€€", p:"€€", l:"€40 tot €80"},
    {v:"€€€", p:"€€€", l:"€80 tot €150"},{v:"€€€€", p:"€€€€", l:"Geen limiet"}
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
  var CFG = window.WIZARD_CONFIG || { parfumBase: "../parfums/" };

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

  function progressSegs(){
    var segs = "";
    for (var i = 0; i < STEPS.length; i++) {
      var cls = i < state.step ? "done" : (i === state.step ? "current" : "");
      segs += '<div class="progress-seg ' + cls + '"><span></span></div>';
    }
    return segs;
  }

  function renderShell(inner){
    root.innerHTML =
      '<div class="wizard-panel">' +
      '<div class="wizard-step-label">Stap ' + Math.min(state.step+1, STEPS.length) + ' van ' + STEPS.length + '</div>' +
      '<div class="progress-track">' + progressSegs() + '</div>' +
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
    renderShell('<span class="wizard-question">Voor wie zoek je een parfum?</span><p class="wizard-hint">Dit bepaalt meteen welke geuren we je laten zien.</p><div class="option-grid" id="opts"></div>');
    var opts = document.getElementById("opts");
    [["heren","Voor een man"],["dames","Voor een vrouw"],["unisex","Unisex / geen voorkeur"]].forEach(function(o){
      opts.appendChild(optionCard(o[1], USER_ICON, state.geslacht===o[0], function(){ state.geslacht = o[0]; render(); }));
    });
    nav(false, !!state.geslacht, "Volgende", function(){ state.step++; render(); });
  }

  function renderStepGelegenheid(){
    renderShell('<span class="wizard-question">Wat is de gelegenheid?</span><p class="wizard-hint">Kies wat het dichtst in de buurt komt.</p><div class="option-grid" id="opts"></div>');
    var opts = document.getElementById("opts");
    GELEGENHEID_OPTIONS.forEach(function(o){
      opts.appendChild(optionCard(o.l, o.icon, state.gelegenheid===o.v, function(){ state.gelegenheid = o.v; render(); }));
    });
    nav(true, !!state.gelegenheid, "Volgende", function(){ state.step++; render(); });
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
      var exact = q && DATA.find(function(p){ return p.naam.toLowerCase() === q.toLowerCase(); });
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
    }

    function renderSuggestions(){
      var q = input.value.trim();
      var matches = findMatches(q, 6);
      if (!q || !matches.length) { closeList(); showFeedback(); return; }
      list.innerHTML = matches.map(function(p){
        return '<button type="button" class="autocomplete-item" data-id="' + p.id + '">' + p.naam + '<span>' + p.merk + '</span></button>';
      }).join("");
      list.classList.add("open");
      Array.prototype.forEach.call(list.querySelectorAll(".autocomplete-item"), function(btn){
        btn.onclick = function(){
          var match = DATA.find(function(p){ return p.id === btn.getAttribute("data-id"); });
          if (match) selectMatch(match);
        };
      });
      showFeedback();
    }

    input.oninput = function(e){ state.bekendeGeur = e.target.value; renderSuggestions(); };
    input.onfocus = renderSuggestions;
    input.onblur = function(){ setTimeout(closeList, 150); };
    showFeedback();

    nav(true, true, "Volgende", function(){ state.step++; render(); }, function(){ state.bekendeGeur=""; state.step++; render(); });
  }

  function renderStepPersoonlijkheid(){
    renderShell('<span class="wizard-question">Hoe zou je de persoonlijkheid omschrijven?</span><p class="wizard-hint">Kies 2 tot 3 kenmerken.</p><div class="option-grid" id="opts"></div>');
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
    renderShell('<span class="wizard-question">Draagt hij dit vooral dagelijks, of juist \'s avonds?</span><p class="wizard-hint">Kies wat past (optioneel, mag meerdere).</p><div class="option-grid" id="opts"></div>');
    var opts = document.getElementById("opts");
    MOMENT_OPTIONS.forEach(function(o){
      var selected = state.moment.indexOf(o.v) > -1;
      opts.appendChild(optionCard(o.l, o.icon, selected, function(){
        var i = state.moment.indexOf(o.v);
        if (i>-1) state.moment.splice(i,1); else state.moment.push(o.v);
        render();
      }, true));
    });
    nav(true, true, "Volgende", function(){ state.step++; render(); }, function(){ state.moment=[]; state.step++; render(); });
  }

  function renderStepBudget(){
    renderShell('<span class="wizard-question">Wat is je budget?</span><p class="wizard-hint">We houden ons hieraan bij elk advies.</p><div class="option-grid" id="opts"></div>');
    var opts = document.getElementById("opts");
    BUDGET_OPTIONS.forEach(function(o){
      var priceHtml = '<span class="price">' + o.p + '</span>';
      opts.appendChild(optionCard(priceHtml + o.l, "", state.budget===o.v, function(){ state.budget = o.v; render(); }));
    });
    nav(true, !!state.budget, "Volgende", function(){ state.step++; render(); });
  }

  function renderStepSeizoen(){
    renderShell('<span class="wizard-question">In welk seizoen wordt dit vooral gedragen?</span><p class="wizard-hint">Optioneel, voor extra verfijning.</p><div class="option-grid" id="opts"></div>');
    var opts = document.getElementById("opts");
    SEIZOEN_OPTIONS.forEach(function(o){
      var selected = state.seizoen.indexOf(o.v) > -1;
      opts.appendChild(optionCard(o.l, o.icon, selected, function(){
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

  function findMatches(query, limit){
    var q = (query||"").trim().toLowerCase();
    if (!q) return [];
    var out = [];
    for (var i = 0; i < DATA.length && out.length < limit; i++) {
      var p = DATA[i];
      if (p.naam.toLowerCase().indexOf(q) > -1 || (p.merk+" "+p.naam).toLowerCase().indexOf(q) > -1) out.push(p);
    }
    return out;
  }

  function findRef(){
    return findMatches(state.bekendeGeur, 1)[0] || null;
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
    return bottleSvg(p.familie_hoofd, p.id, w, h);
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
      '<div class="bottle">' + bottleVisualHtml(p) + '</div>' +
      '<h3>' + p.naam + '</h3><div class="meta">' + p.merk + ' &middot; ' + p.concentratie + ' &middot; ' + p.prijsklasse + '</div>' +
      '<p>' + p.beschrijving + '</p>' +
      '<div class="result-explain">' + reasonText(p) + '</div>' +
      '<a class="details-link" style="margin-top:10px" href="' + CFG.parfumBase + p.id + '/index.html">Bekijk details →</a>' +
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
      '<div class="container" style="max-width:920px;margin:30px auto;display:flex;justify-content:center">' +
      '<div class="ad-unit ad-unit-leaderboard" aria-hidden="true"><span>Advertentie</span><span class="ad-unit-size">728&times;90</span></div>' +
      '</div>' +
      '<div class="alt-actions"><button class="btn btn-outline" id="altBtn">Toon meer alternatieven</button></div>' +
      '<div style="text-align:center;margin-bottom:30px"><a href="#" id="opnieuwLink" class="details-link">Opnieuw beginnen</a></div>';

    document.getElementById("opnieuwLink").onclick = function(e){ e.preventDefault(); resetWizard(); };

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

  function resetWizard(){
    state.geslacht = null;
    state.gelegenheid = null;
    state.bekendeGeur = "";
    state.persoonlijkheid = [];
    state.moment = [];
    state.seizoen = [];
    state.budget = null;
    state.step = 0;
    state.shown = [];
    try { history.pushState({}, "", location.pathname + location.hash); } catch (e) {}
    render();
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  fetchData().then(function(){
    render();
  }).catch(function(err){
    root.innerHTML = '<div class="wizard-panel" style="max-width:640px;margin:32px auto;text-align:center">' +
      '<p style="color:var(--text-muted)">' + err.message + '</p></div>';
  });
})();