#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ParfumPicker.nl - statische site generator (geen build-framework nodig op de hosting).
Alle interne links zijn RELATIEF (met index.html-suffix) zodat de site zowel op een
echte server als lokaal via dubbelklikken (file://) werkt."""
import json, os, re, html

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, "dist")
DATA_FILE = os.path.join(ROOT, "data", "parfums.jsonl")
SITE_URL = "https://parfumpicker.nl"
ASSET_VERSION = "2026-07-11-6"  # ophogen bij elke CSS/JS-wijziging om browsercaches te forceren te verversen

# Echte stockfoto's: uitsluitend voor marketing/sfeercontent (hero, cadeau-inspiratie,
# over-ons) waar geen claim wordt gemaakt dat dit een specifiek product is.
MARKETING_PHOTOS = [
    "https://images.unsplash.com/photo-1622618991746-fe6004db3a47?fm=jpg&q=70&w=700&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1543422655-ac1c6ca993ed?fm=jpg&q=70&w=700&auto=format&fit=crop",
]
HERO_PHOTO = "https://images.unsplash.com/photo-1622618991746-fe6004db3a47?fm=jpg&q=75&w=1200&auto=format&fit=crop"

def load_data():
    items = []
    with open(DATA_FILE, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                items.append(json.loads(line))
    return items

PERFUMES = load_data()
BY_ID = {p["id"]: p for p in PERFUMES}

# ---------- relatieve links ----------
def depth_base(path):
    segs = [s for s in path.split("/") if s]
    return "../" * len(segs)

def rel(target, base):
    """Zet een absoluut site-pad (bv. '/wizard/', '/assets/css/style.css', '/#top10')
    om naar een relatief pad t.o.v. de huidige pagina, met index.html-suffix voor mappen."""
    if target.startswith("/#"):
        return base + "index.html" + target[1:]
    if target == "/":
        return base + "index.html"
    t = target.lstrip("/")
    last = t.rsplit("/", 1)[-1]
    if "." in last:  # bestand met extensie: assets/css/style.css, sitemap.xml, ...
        return base + t
    if not t.endswith("/"):
        t += "/"
    return base + t + "index.html"

# ---------- iconen (stroke-based, currentColor) ----------
ICONS = {
"tag": '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12.6 2.6H4a1.4 1.4 0 0 0-1.4 1.4v8.6c0 .4.2.7.4 1l9 9c.5.6 1.5.6 2 0l7.6-7.6c.6-.5.6-1.5 0-2l-9-9c-.3-.2-.6-.4-1-.4Z"/><circle cx="7.6" cy="7.6" r="1.4"/></svg>',
"search": '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8" stroke-linecap="round"/></svg>',
"tap": '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12V5a1.5 1.5 0 0 1 3 0v6"/><path d="M12 11V4a1.5 1.5 0 0 1 3 0v7"/><path d="M15 11.5V6a1.5 1.5 0 0 1 3 0v9c0 4-2.5 7-6.5 7-3 0-4.3-1-6-3l-3-4.3c-.6-.9-.3-2 .6-2.5.8-.4 1.7-.2 2.3.5L8 15"/></svg>',
"user": '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.4-3.8 4.2-5.6 7.5-5.6s6.1 1.8 7.5 5.6" stroke-linecap="round"/></svg>',
"card": '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="5.5" width="19" height="13" rx="2.2"/><path d="M2.5 10h19" /><path d="M6 14.5h4" stroke-linecap="round"/></svg>',
"shield": '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l7 3v5.5c0 4.6-3 8.3-7 9.5-4-1.2-7-4.9-7-9.5V6l7-3Z"/><path d="M9 12l2 2 4-4" stroke-linecap="round"/></svg>',
"gift": '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="9" width="18" height="4.2" rx="1"/><rect x="4.4" y="13.2" width="15.2" height="8" rx="1"/><path d="M12 9v12.2"/><path d="M12 9c-1.2-3-3-4.6-4.6-4.6a2.2 2.2 0 0 0 0 4.6Z"/><path d="M12 9c1.2-3 3-4.6 4.6-4.6a2.2 2.2 0 0 1 0 4.6Z"/></svg>',
"chat": '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 5.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H9l-4.5 4V16H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z"/></svg>',
"lock": '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
"check": '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6"/></svg>',
"arrow": '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>',
"leaf": '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 19c8-1 14-6 15-15C10 5 5 11 4 19Z"/><path d="M6 18c3-4 6-7 12-12"/></svg>',
"compass": '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M15 9l-2 6-6 2 2-6 6-2Z" stroke-linejoin="round"/></svg>',
"star": '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.6 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9 2.9-6Z"/></svg>',
}
def icon(name):
    return ICONS.get(name, "")

def esc(s):
    return html.escape(str(s), quote=True)

def marketing_photo_html(seed_or_index, alt=""):
    """Real stock photography for marketing/mood content only (hero, cadeau-
    inspiratie, over-ons). Never used to represent a specific named product -
    see bottle_visual_html() for that."""
    idx = seed_or_index if isinstance(seed_or_index, int) else sum(ord(c) for c in (seed_or_index or ""))
    src = MARKETING_PHOTOS[idx % len(MARKETING_PHOTOS)]
    return f'<img class="bottle-photo" src="{src}" alt="{esc(alt)}" loading="lazy">'

# ---------- productillustraties (geen echte foto's - zie afbeelding_url voor de
# affiliate-fallback zodra we die hebben) ----------
FAMILY_TINT = {
    "Fris": ("#BFE3DE", "#5FA79E"),
    "Amber": ("#F0D9B5", "#C2833F"),
    "Houtachtig": ("#DCD3C1", "#8C7355"),
    "Bloemig": ("#F2D9E6", "#C97AA0"),
}
SHAPE_COUNT = 6

def shape_index(id_seed):
    """Stable per-id shape pick (0-5). Not Python's hash() - that's randomized
    per-process (PYTHONHASHSEED) and would disagree with wizard.js's mirror
    of this same rule on every page load."""
    if not id_seed:
        return 0
    return sum(ord(c) for c in id_seed) % SHAPE_COUNT

def bottle_svg(familie_hoofd="Fris", id_seed="", w=140, h=180):
    light, dark = FAMILY_TINT.get(familie_hoofd, FAMILY_TINT["Fris"])
    shape = shape_index(id_seed)
    if shape == 1:
        # tall narrow capsule
        body = f'<path d="M70 30c-12 0-22 4-22 16v112c0 10 10 18 22 18s22-8 22-18V46c0-12-10-16-22-16Z" fill="{light}" stroke="{dark}" stroke-width="2"/>'
        cap = '<rect x="58" y="16" width="24" height="14" rx="3" fill="#ccc"/><rect x="54" y="4" width="32" height="14" rx="4" fill="#3a3a3a"/>'
        label = f'<rect x="54" y="86" width="32" height="40" rx="4" fill="#FDFCFB" opacity=".78"/><rect x="58" y="96" width="24" height="4" rx="2" fill="{dark}" opacity=".55"/><rect x="58" y="104" width="16" height="4" rx="2" fill="{dark}" opacity=".35"/>'
    elif shape == 2:
        # squat rounded flacon
        body = f'<rect x="20" y="32" width="100" height="118" rx="35" fill="{light}" stroke="{dark}" stroke-width="2"/>'
        cap = '<rect x="50" y="20" width="20" height="12" rx="3" fill="#ccc"/><rect x="46" y="10" width="28" height="12" rx="4" fill="#3a3a3a"/>'
        label = f'<rect x="35" y="70" width="70" height="50" rx="6" fill="#FDFCFB" opacity=".78"/><rect x="45" y="85" width="50" height="4" rx="2" fill="{dark}" opacity=".55"/><rect x="45" y="97" width="34" height="4" rx="2" fill="{dark}" opacity=".35"/>'
    elif shape == 3:
        # faceted / angular shoulders
        body = f'<path d="M48 32h44l14 20v92c0 10-8 18-18 18H52c-10 0-18-8-18-18V52Z" fill="{light}" stroke="{dark}" stroke-width="2"/>'
        cap = '<rect x="58" y="18" width="24" height="16" rx="2" fill="#ccc"/><rect x="54" y="6" width="32" height="14" rx="3" fill="#3a3a3a"/>'
        label = f'<rect x="34" y="76" width="72" height="48" rx="4" fill="#FDFCFB" opacity=".78"/><rect x="42" y="88" width="50" height="4" rx="2" fill="{dark}" opacity=".55"/><rect x="42" y="98" width="34" height="4" rx="2" fill="{dark}" opacity=".35"/>'
    elif shape == 4:
        # slim cylinder
        body = f'<rect x="42" y="36" width="56" height="124" rx="12" fill="{light}" stroke="{dark}" stroke-width="2"/>'
        cap = '<rect x="58" y="20" width="24" height="16" rx="3" fill="#ccc"/><rect x="54" y="8" width="32" height="14" rx="4" fill="#3a3a3a"/>'
        label = f'<rect x="46" y="82" width="48" height="46" rx="4" fill="#FDFCFB" opacity=".78"/><rect x="52" y="94" width="36" height="4" rx="2" fill="{dark}" opacity=".55"/><rect x="52" y="104" width="24" height="4" rx="2" fill="{dark}" opacity=".35"/>'
    elif shape == 5:
        # hourglass / pinched waist
        body = f'<path d="M34 34c0-4 3-6 7-6h58c4 0 7 2 7 6v26c0 8-16 14-16 36s16 28 16 36v26c0 4-3 6-7 6H41c-4 0-7-2-7-6v-26c0-8 16-14 16-36S34 68 34 60Z" fill="{light}" stroke="{dark}" stroke-width="2"/>'
        cap = '<rect x="58" y="14" width="24" height="16" rx="3" fill="#ccc"/><rect x="54" y="2" width="32" height="14" rx="4" fill="#3a3a3a"/>'
        label = f'<rect x="40" y="70" width="60" height="42" rx="4" fill="#FDFCFB" opacity=".78"/><rect x="48" y="80" width="44" height="4" rx="2" fill="{dark}" opacity=".55"/><rect x="48" y="90" width="30" height="4" rx="2" fill="{dark}" opacity=".35"/>'
    else:
        # classic flask
        body = f'<path d="M36 34h40c6 0 10 5 10 11v96c0 8-6 14-14 14H40c-8 0-14-6-14-14V45c0-6 4-11 10-11Z" fill="{light}" stroke="{dark}" stroke-width="2"/>'
        cap = '<rect x="44" y="18" width="24" height="16" rx="3" fill="#ccc"/><rect x="40" y="6" width="32" height="16" rx="4" fill="#3a3a3a"/>'
        label = f'<rect x="26" y="70" width="60" height="50" rx="4" fill="#FDFCFB" opacity=".78"/><rect x="32" y="82" width="48" height="4" rx="2" fill="{dark}" opacity=".55"/><rect x="32" y="92" width="34" height="4" rx="2" fill="{dark}" opacity=".35"/>'
    return f'<svg viewBox="0 0 140 180" width="{w}" height="{h}" xmlns="http://www.w3.org/2000/svg">{cap}{body}{label}</svg>'

def bottle_visual_html(p, w=140, h=180):
    """Product visual for one specific perfume. Uses a real affiliate product
    photo once p['afbeelding_url'] is set (see data/parfums.jsonl); until then,
    falls back to the illustration, never a generic stock photo (that would
    misrepresent a specific named product)."""
    url = p.get("afbeelding_url")
    if url:
        return f'<img class="bottle-photo" src="{esc(url)}" alt="{esc(p["naam"])}" loading="lazy" width="{w}" height="{h}">'
    return bottle_svg(p.get("familie_hoofd", "Fris"), p.get("id", ""), w=w, h=h)

print(f"Dataset geladen: {len(PERFUMES)} parfums")

# ---------- layout ----------
NAV_LINKS = [
    ("/hoe-het-werkt/", "Hoe het werkt"),
    ("/cadeau-inspiratie/", "Cadeau-inspiratie"),
    ("/over-ons/", "Over ons"),
    ("/faq/", "FAQ"),
]

def header_html(base, active=""):
    def _link(href, label):
        cur = ' aria-current="page"' if active == href else ""
        return f'<a href="{rel(href, base)}"{cur}>{label}</a>'
    links = "\n".join(_link(href, label) for href, label in NAV_LINKS)
    mobile_links = "\n".join(_link(href, label) for href, label in NAV_LINKS)
    return f'''<header class="site-header">
  <div class="inner">
    <a href="{rel("/", base)}" class="logo"><img src="{rel("/assets/img/logo.svg", base)}" alt="" width="38" height="38">ParfumPicker</a>
    <nav class="nav-links">{links}</nav>
    <div class="header-actions">
      <a href="{rel("/#wizard", base)}" class="btn btn-primary">Start ParfumPicker</a>
      <button class="hamburger" onclick="document.getElementById('mobileNav').classList.add('open')" aria-label="Menu openen">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
    </div>
  </div>
</header>
<div class="mobile-nav" id="mobileNav">
  <div class="panel">
    <button class="close" onclick="document.getElementById('mobileNav').classList.remove('open')" aria-label="Sluiten">&times;</button>
    {mobile_links}
    <a href="{rel("/#wizard", base)}" class="btn btn-primary btn-block">Start ParfumPicker</a>
  </div>
</div>'''

FOOTER_TRUST = [
    ("shield", "Eerlijk & onafhankelijk", "We sturen op match, niet op populariteit of prijs."),
    ("lock", "Jouw privacy is veilig", "We slaan niets op en delen geen gegevens."),
    ("gift", "Perfect als cadeau", "Zo kies je altijd iets dat écht bij iemand past."),
    ("chat", "Vragen?", "We staan klaar om je te helpen."),
]

def footer_html(base):
    trust_items = "\n".join(
        f'''<div class="item"><div class="icon">{icon(i)}</div><div><strong>{esc(t)}</strong><span>{esc(d)}</span></div></div>'''
        for i, t, d in FOOTER_TRUST
    )
    return f'''<div class="footer-trust"><div class="container grid">{trust_items}</div></div>
<footer class="site-footer">
  <div class="container">
    <div class="cols">
      <div>
        <a href="{rel("/", base)}" class="logo" style="margin-bottom:10px"><img src="{rel("/assets/img/logo.svg", base)}" alt="" width="32" height="32">ParfumPicker</a>
        <p style="max-width:36ch">Gratis, eerlijk parfumadvies voor iedereen die een geurcadeau zoekt en zelf geen parfumkennis heeft. Geen account, geen abonnement.</p>
      </div>
      <div><h4>ParfumPicker</h4><ul>
        <li><a href="{rel("/hoe-het-werkt/", base)}">Hoe het werkt</a></li>
        <li><a href="{rel("/over-ons/", base)}">Over ons</a></li>
        <li><a href="{rel("/faq/", base)}">FAQ</a></li>
      </ul></div>
      <div><h4>Ontdekken</h4><ul>
        <li><a href="{rel("/#wizard", base)}">Start ParfumPicker</a></li>
        <li><a href="{rel("/cadeau-inspiratie/", base)}">Cadeau-inspiratie</a></li>
        <li><a href="{rel("/#top10", base)}">Top 10 populaire geuren</a></li>
      </ul></div>
      <div><h4>Contact</h4><ul>
        <li><a href="mailto:hallo@parfumpicker.nl">hallo@parfumpicker.nl</a></li>
      </ul></div>
    </div>
    <div class="footer-bottom">
      <span>&copy; 2026 ParfumPicker.nl</span>
      <span>Gemaakt in Nederland &middot; Onafhankelijk parfumadvies</span>
    </div>
  </div>
</footer>'''

def base_page(title, description, content, path="/", noindex=False, active_nav="", extra_head=""):
    base = depth_base(path)
    canonical = SITE_URL + path
    robots = '<meta name="robots" content="noindex,follow">' if noindex else ""
    return f'''<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}">
<link rel="canonical" href="{canonical}">
{robots}
<link rel="icon" href="{rel("/assets/img/logo.svg", base)}" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600..800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{rel("/assets/css/style.css", base)}?v={ASSET_VERSION}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="{canonical}">
{extra_head}
</head>
<body>
{header_html(base, active_nav)}
{content}
{footer_html(base)}
<script src="{rel("/assets/js/main.js", base)}?v={ASSET_VERSION}" defer></script>
</body>
</html>'''

def write_page(rel_path, html_str):
    if rel_path.endswith("/"):
        out = os.path.join(DIST, rel_path.lstrip("/"), "index.html")
    else:
        out = os.path.join(DIST, rel_path.lstrip("/"))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        f.write(html_str)
    return out

print("layout-functies geladen")

with open(os.path.join(ROOT, "data", "top10.json"), encoding="utf-8") as f:
    TOP10_IDS = json.load(f)["ids"]

# ---------- componenten ----------
TRUST_ROW = [
    ("tag", "Gratis", "Helemaal gratis, zonder verborgen kosten."),
    ("search", "Slim algoritme, 100+ geuren", "We vergelijken tientallen geuren in seconden."),
    ("tap", "Klaar in enkele klikken", "Snel, simpel en toegankelijk."),
    ("user", "Geen account nodig", "Geen registratie, geen gedoe."),
    ("card", "Geen abonnement", "Geen onverwachte kosten, ooit."),
]

def trust_row_html():
    items = "\n".join(
        f'''<div class="trust-item"><div class="icon">{icon(i)}</div><div><strong>{esc(t)}</strong><span>{esc(d)}</span></div></div>'''
        for i, t, d in TRUST_ROW
    )
    return f'<section class="trust-row"><div class="container grid">{items}</div></section>'

def steps_html():
    return '''<section class="steps container" id="hoe-werkt-het">
  <h2>Zo werkt het</h2>
  <p class="steps-prose">Je beantwoordt een paar simpele vragen: voor wie je een parfum zoekt en hoe je die persoon zou omschrijven. Ken je al een merk dat diegene mooi vindt? Dan vullen we dat aan met details over hoe opvallend de geur mag zijn, wanneer hij gedragen wordt en je budget. Binnen een minuut zetten we al je antwoorden om in persoonlijk parfumadvies, m&eacute;t een duidelijke uitleg waarom elke geur past.</p>
</section>'''

def perfume_card_html(p, base, rank=None, badge=None):
    rank_html = f'<div class="rank{" top" if rank == 1 else ""}">{rank}</div>' if rank else ""
    badge_html = f'<div class="badge">{esc(badge)}</div>' if badge else ""
    return f'''<article class="perfume-card">
  {rank_html}{badge_html}
  <div class="bottle">{bottle_visual_html(p)}</div>
  <h3>{esc(p["naam"])}</h3>
  <div class="meta">{esc(p["merk"])} &middot; {esc(p["concentratie"])}</div>
  <p>{esc(p["beschrijving"][:70])}{"…" if len(p["beschrijving"])>70 else ""}</p>
  <a class="details-link" href="{rel('/parfums/'+p['id']+'/', base)}">Bekijk details {icon('arrow')}</a>
</article>'''

def ad_slot_html(width, height, label="Advertentie"):
    """Reserved, clearly-labeled placeholder. No ad network wired up yet -
    drop a real ad tag inside .ad-unit once one is configured. Deliberately
    NOT placed between clickable option tiles (accidental-click risk); see
    wizard_shell_html() for where this is allowed to live."""
    return f'''<div class="ad-unit" style="width:{width}px;height:{height}px" aria-hidden="true">
  <span>{esc(label)}</span><span class="ad-unit-size">{width}&times;{height}</span>
</div>'''

def wizard_shell_html(inner_html):
    return f'''<div class="wizard-layout">
  <div class="wizard-main">{inner_html}</div>
  <aside class="wizard-rail" aria-hidden="true">
    <div class="ad-rail-sticky">{ad_slot_html(300, 600)}</div>
  </aside>
</div>'''

def wizard_embed_html(base):
    data_json = json.dumps(PERFUMES, ensure_ascii=False)
    cfg_json = json.dumps({"parfumBase": base + "parfums/"})
    return f'''<section class="wizard-embed" id="wizard">
  <div class="container container-wide">
    <div class="wizard-kicker reveal">{icon('compass')} 6 korte vragen &middot; 1 minuut &middot; gratis</div>
    {wizard_shell_html('<div id="wizardApp"></div>')}
  </div>
</section>
<script>window.PARFUM_DATA = {data_json};window.WIZARD_CONFIG = {cfg_json};</script>
<script src="{rel("/assets/js/wizard.js", base)}?v={ASSET_VERSION}" defer></script>'''

print("componenten geladen")

# ---------- homepage ----------
def build_homepage():
    path = "/"
    base = depth_base(path)
    top10 = [BY_ID[i] for i in TOP10_IDS if i in BY_ID]
    cards = "\n".join(perfume_card_html(p, base, rank=idx+1) for idx, p in enumerate(top10))
    content = f'''
<section class="hero">
  <div class="container inner">
    <div>
      <div class="eyebrow">{icon('compass')} De leukste manier om een parfum cadeau te doen</div>
      <h1>Het parfum dat bij hém of háár past, in <span class="accent">5 klikken.</span></h1>
      <p class="lead">Ons algoritme doorzoekt tientallen geuren en toont je bekende favorieten én de verrassend goede match, zonder account, zonder abonnement.</p>
      <div class="hero-cta">
        <a href="{rel("/#wizard", base)}" class="btn btn-primary">Start ParfumPicker {icon('arrow')}</a>
        <div class="micro-trust">{icon('check')} 100% gratis &middot; Direct resultaat</div>
      </div>
    </div>
    <div class="hero-art reveal">
      <img src="{HERO_PHOTO}" alt="Parfumfles, sfeerbeeld" loading="eager">
    </div>
  </div>
</section>

{wizard_embed_html(base)}

{trust_row_html()}

{steps_html()}

<section class="section" id="top10">
  <div class="container">
    <div class="section-head reveal">
      <h2>Top 10 populaire geuren</h2>
      <p class="sub">Populair bij velen, geliefd om een reden, wekelijks bijgewerkt.</p>
    </div>
    <div class="perfume-scroll-wrap">
      <div class="perfume-scroll" id="top10Scroll">{cards}</div>
      <button type="button" class="scroll-next" aria-label="Meer geuren tonen" onclick="document.getElementById('top10Scroll').scrollBy({{left:260, behavior:'smooth'}})">{icon('arrow')}</button>
    </div>
  </div>
</section>

<section class="ink-band">
  <div class="container center reveal">
    <h2>Niet zeker welke je moet kiezen?</h2>
    <p class="sub">Onze wizard stelt een paar simpele vragen en laat je precies zien welke geur bij wie past, inclusief een eerlijke reden waarom.</p>
    <a href="{rel("/wizard/", base)}" class="btn btn-on-ink">Start ParfumPicker {icon('arrow')}</a>
  </div>
</section>
'''
    html_out = base_page(
        title="ParfumPicker.nl: gratis parfumadvies voor het perfecte cadeau",
        description="Vind in een paar klikken het parfum dat écht bij hem of haar past. Gratis, geen account, geen abonnement.",
        content=content,
        path=path,
        active_nav="",
    )
    write_page(path, html_out)

build_homepage()
print("homepage geschreven")

# ---------- parfumpagina's ----------
def _tag_list(items):
    return "".join(f'<span class="tag">{esc(t)}</span>' for t in items)

def _find_similar_link(name):
    name_l = name.lower()
    for p in PERFUMES:
        if p["naam"].lower() in name_l or name_l in p["naam"].lower():
            return p
    return None

def build_perfume_page(p):
    path = f'/parfums/{p["id"]}/'
    base = depth_base(path)
    notes_html = "".join(
        f'<div><h4>{label}</h4><p>{esc(", ".join(p.get(key, [])) or "n.v.t.")}</p></div>'
        for key, label in [("noten_top","Topnoten"),("noten_hart","Hartnoten"),("noten_basis","Basisnoten")]
    )
    similar_html = ""
    for sidx, naam in enumerate(p.get("lijkt_op", [])):
        match = _find_similar_link(naam)
        if match and match["id"] != p["id"]:
            similar_html += f'<a class="perfume-card" style="display:block;text-decoration:none" href="{rel("/parfums/"+match["id"]+"/", base)}">' \
                             f'<div class="bottle">{bottle_visual_html(match)}</div>' \
                             f'<h3 style="font-size:15px">{esc(match["naam"])}</h3><div class="meta">{esc(match["merk"])}</div></a>'
        else:
            similar_html += f'<div class="perfume-card"><div class="bottle">{bottle_svg(p.get("familie_hoofd","Fris"), p.get("id","")+naam)}</div>' \
                             f'<h3 style="font-size:15px">{esc(naam)}</h3><div class="meta">Vergelijkbare geur</div></div>'

    spec_items = [
        ("Merk", p["merk"]), ("Jaar", p["jaar"]), ("Concentratie", p["concentratie"]),
        ("Geurfamilie", f'{p["familie_hoofd"]} &middot; {p["familie_sub"]}'),
        ("Longevity", p["longevity"].capitalize()), ("Sillage", p["sillage"].capitalize()),
        ("Prijsklasse", p["prijsklasse"]), ("Geslacht", p["geslacht"].capitalize()),
        ("Seizoen", ", ".join(p.get("seizoen", [])).capitalize()),
    ]
    specs_html = "".join(
        f'<div class="spec-item"><div class="k">{esc(k)}</div><div class="v">{v}</div></div>' for k, v in spec_items
    )

    content = f'''
<section class="container pd-hero">
  <div class="pd-bottle reveal">{bottle_visual_html(p, w=220, h=280)}</div>
  <div>
    <div class="eyebrow">{esc(p["merk"])}</div>
    <h1 style="font-size:clamp(28px,4vw,40px)">{esc(p["naam"])}</h1>
    <p class="lead" style="font-size:16.5px">{esc(p["beschrijving"])}</p>
    <div style="margin:16px 0">{_tag_list(p.get("persoonlijkheid", []))}</div>
    <div class="hero-cta">
      <a href="{rel("/wizard/", base)}" class="btn btn-primary">Check de match {icon('arrow')}</a>
    </div>
  </div>
</section>

<section class="container">
  <div class="spec-grid">{specs_html}</div>
  <div class="note-cols">{notes_html}</div>
  <div style="margin:22px 0">
    <h4 style="font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted);margin-bottom:8px">Goed cadeau bij</h4>
    {_tag_list(p.get("cadeau_gelegenheid", []))}
  </div>
</section>

{f'<section class="section bg-soft"><div class="container"><div class="section-head reveal"><h2>Lijkt op {esc(p["naam"])}</h2><p class="sub">Vergelijkbare geuren om ook te overwegen.</p></div><div class="perfume-grid">{similar_html}</div></div></section>' if similar_html else ""}

<section class="section">
  <div class="container" style="text-align:center">
    <h2 style="font-size:22px">Twijfel je nog?</h2>
    <p class="sub">Doe de gratis wizard en krijg een advies op maat, inclusief eerlijke alternatieven.</p>
    <a href="{rel("/wizard/", base)}" class="btn btn-primary">Start ParfumPicker {icon('arrow')}</a>
  </div>
</section>
'''
    title = f'{p["naam"]} ({p["merk"]}): geurprofiel en cadeautip | ParfumPicker.nl'
    desc = f'{p["naam"]} van {p["merk"]}: {p["beschrijving"]} Notenpiramide, geurfamilie en cadeautips op ParfumPicker.nl.'
    html_out = base_page(title=title, description=desc, content=content, path=path)
    write_page(path, html_out)

for p in PERFUMES:
    build_perfume_page(p)
print(f"{len(PERFUMES)} parfumpagina's geschreven")

# ---------- wizard-pagina ----------
def build_wizard_page():
    path = "/wizard/"
    data_json = json.dumps(PERFUMES, ensure_ascii=False)
    content = f'''
<section class="container container-wide" style="padding-top:20px">
  <div class="section-head reveal">
    <h1 style="font-size:clamp(26px,4vw,36px)">Vind het parfum dat écht past</h1>
    <p class="sub">Een paar korte vragen, een eerlijk advies. Gratis, geen account, geen abonnement.</p>
  </div>
  {wizard_shell_html('<div id="wizardApp"></div>')}
</section>
<script>window.PARFUM_DATA = {data_json};window.WIZARD_CONFIG = {json.dumps({"parfumBase": "../parfums/"})};</script>
<script src="../assets/js/wizard.js?v={ASSET_VERSION}" defer></script>
'''
    html_out = base_page(
        title="Gratis parfumwizard: vind het perfecte cadeau | ParfumPicker.nl",
        description="Beantwoord een paar simpele vragen en ontvang gratis, eerlijk parfumadvies op maat. Geen account, geen abonnement.",
        content=content,
        path=path,
    )
    write_page(path, html_out)

build_wizard_page()
print("wizardpagina geschreven (dataset inline embedded, geen fetch nodig)")

# ---------- subpagina's ----------
def build_hoe_het_werkt():
    path = "/hoe-het-werkt/"
    base = depth_base(path)
    content = f'''
<section class="page-hero container">
  <h1>Hoe ParfumPicker werkt</h1>
  <p class="lead">Geen account, geen abonnement, geen verborgen addertjes. Gewoon een eerlijk advies, in een paar minuten.</p>
</section>
{steps_html()}
<section class="section container prose">
  <h2>Waarom vragen we dit niet gewoon: &ldquo;welke geur vind jij lekker?&rdquo;</h2>
  <p>Omdat je waarschijnlijk niet voor jezelf shopt. De meeste bezoekers van ParfumPicker zoeken een cadeau voor iemand anders, een partner, ouder, vriend(in) of collega, en kennen diens neus niet uit het hoofd. Daarom vragen we vooral naar dingen die jij wél weet: hoe je die persoon zou omschrijven, hoe opvallend de geur mag zijn, en je budget.</p>
  <h2>Hoe bepalen we de match?</h2>
  <p>Onze tool doorzoekt onze database met parfums en geeft elke geur een score op basis van jouw antwoorden: komt de persoonlijkheid overeen, past de sterkte (sillage) bij wat je zocht, valt het binnen budget. Geen zwarte doos, bij elk resultaat leggen we uit waarom het past.</p>
  <h2>Waarom laten jullie ook "minder populaire" opties zien?</h2>
  <p>Omdat een eerlijk advies niet alleen bestsellers pusht. Een geur kan populair zijn omdat hij goed en veilig is, maar dat maakt hem niet per se de beste match voor jouw situatie. We laten je daarom altijd meerdere opties zien, en je kunt met één klik meer alternatieven bekijken.</p>
</section>
<section class="section bg-soft"><div class="container" style="text-align:center">
  <h2 style="font-size:22px">Klaar om het te proberen?</h2>
  <a href="{rel("/wizard/", base)}" class="btn btn-primary">Start ParfumPicker {icon('arrow')}</a>
</div></section>
'''
    html_out = base_page("Hoe het werkt | ParfumPicker.nl", "Zo werkt de gratis ParfumPicker-wizard: geen account, geen abonnement, gewoon een eerlijk, uitgelegd parfumadvies.", content, path, active_nav="/hoe-het-werkt/")
    write_page(path, html_out)

def build_over_ons():
    path = "/over-ons/"
    content = f'''
<section class="page-hero container">
  <h1>Over ParfumPicker</h1>
  <p class="lead">Gemaakt voor iedereen die weleens voor een parfumschap heeft gestaan en geen idee had waar te beginnen.</p>
</section>
<section class="container reveal" style="max-width:900px;margin:0 auto 8px"><div class="bottle" style="height:260px;border-radius:var(--radius-lg)">{marketing_photo_html("over-ons", "ParfumPicker")}</div></section>
<section class="section container prose">
  <p>ParfumPicker.nl is gestart vanuit een simpele frustratie: parfum kopen als cadeau is verrassend lastig als je zelf geen parfumkenner bent. Bestaande parfumsites zijn gebouwd vóór en dóór liefhebbers, met vaktermen als "chypre" en "oosters-houtachtig" die weinig zeggen als je gewoon een leuk cadeau zoekt voor je moeder, partner of collega.</p>
  <p>Daarom bouwden we een tool die andersom werkt: jij beschrijft de persoon, wij vertalen dat naar een parfum dat past, mét uitleg waarom.</p>
  <p>We werken onafhankelijk: we sturen op match, niet op wat toevallig het duurst is of het meest in de aanbieding. Waar het kan bouwen we onze database uit en verbeteren we de aanbevelingen, altijd met hetzelfde uitgangspunt: eerlijk, gratis en zonder gedoe.</p>
</section>
'''
    html_out = base_page("Over ons | ParfumPicker.nl", "Waarom ParfumPicker bestaat: eerlijk, gratis parfumadvies voor iedereen die geen parfumkenner is.", content, path, active_nav="/over-ons/")
    write_page(path, html_out)

FAQS = [
    ("Is ParfumPicker echt helemaal gratis?", "Ja. Je betaalt niets, wij verdienen (op termijn) via advertenties en eventuele partnerlinks naar winkels, nooit via een account of abonnement."),
    ("Moet ik me registreren of een e-mailadres achterlaten?", "Nee. Je kunt de wizard direct gebruiken zonder account, zonder e-mailadres."),
    ("Hoe weten jullie of een parfum echt goed past?", "We combineren data over notenpiramide, geurfamilie en stemmingen met jouw antwoorden over persoonlijkheid, sillage en budget. Bij elk resultaat leggen we uit waarom het past."),
    ("Verkopen jullie zelf parfum?", "Nee, ParfumPicker is geen webshop. We geven onafhankelijk advies; waar je het uiteindelijk koopt is aan jou."),
    ("Waarom zie ik soms een parfum die ik niet ken?", "Omdat we bewust niet alleen bestsellers tonen. Een minder bekende geur kan alsnog de beste match zijn, dat is precies waar we op sturen."),
    ("Hebben jullie ook parfum voor dames?", "Onze database wordt uitgebreid; op dit moment is het aanbod het meest volledig voor herenparfums."),
]

def build_faq():
    path = "/faq/"
    items = "".join(f'<details class="faq-item"><summary>{esc(q)}</summary><p>{esc(a)}</p></details>' for q, a in FAQS)
    content = f'''
<section class="page-hero container"><h1>Veelgestelde vragen</h1><p class="lead">Antwoorden op de vragen die we het vaakst krijgen over ParfumPicker.</p></section>
<section class="container prose" style="max-width:760px">{items}</section>
'''
    html_out = base_page("Veelgestelde vragen | ParfumPicker.nl", "Antwoorden op veelgestelde vragen over ParfumPicker: gratis, geen account, onafhankelijk parfumadvies.", content, path, active_nav="/faq/")
    write_page(path, html_out)

ARTICLES = [
    {
        "slug": "parfum-cadeau-kiezen-zonder-kennis",
        "title": "Parfum cadeau kiezen zonder zelf verstand van parfum te hebben",
        "excerpt": "De meeste parfumgidsen gaan ervan uit dat je al weet wat een chypre-geur is. Wij niet. Hier is hoe je toch een goede keuze maakt.",
        "body": '''<p>Parfum is een van de meest gekozen cadeaus, en een van de moeilijkste om goed te doen als je zelf geen neus voor geuren hebt. Het goede nieuws: je hoeft geen kenner te zijn om een goede keuze te maken.</p>
<h2>Begin bij de persoon, niet bij de geur</h2>
<p>In plaats van te proberen "de juiste geurfamilie" te vinden, begin bij hoe je de ontvanger zou omschrijven. Stoer, elegant, speels, klassiek? Dat is veel makkelijker te bepalen dan of iemand van "aromatisch-fougère" houdt.</p>
<h2>Let op de gelegenheid</h2>
<p>Een verjaardagscadeau mag iets gedurfder zijn dan een eerste cadeau. Voor Kerst of een jubileum kan een net iets duurdere, meer luxe fles goed werken.</p>
<h2>Gebruik een tool die voor jou vertaalt</h2>
<p>Precies daarom bestaat ParfumPicker: jij beantwoordt vragen die je wél kan beantwoorden, wij vertalen dat naar een concreet advies, gratis en zonder verplichtingen.</p>''',
    },
    {
        "slug": "geurfamilies-uitgelegd",
        "title": "Geurfamilies uitgelegd: fris, houtachtig, amber en bloemig",
        "excerpt": "Vier hoofdcategorieën waarin (bijna) elk parfum past. Geen ingewikkelde vaktaal, gewoon een praktische uitleg.",
        "body": '''<p>Elk parfum valt grofweg in een van vier hoofdfamilies. Je hoeft ze niet uit je hoofd te kennen, maar een beetje gevoel ervoor helpt.</p>
<h2>Fris</h2><p>Citrus, water, groene tonen. Denkt aan een schone, actieve uitstraling, populair voor overdag en in de zomer.</p>
<h2>Houtachtig</h2><p>Cederhout, vetiver, sandelhout. Warm en aards, vaak veelzijdig genoeg voor overdag én 's avonds.</p>
<h2>Amber (voorheen "oosters")</h2><p>Vanille, kruiden, hars. Warm, soms zoet, meestal een avondkeuze.</p>
<h2>Bloemig</h2><p>Minder gangbaar bij herenparfum, maar wel aanwezig als subtiele laag in veel geuren.</p>
<p>Twijfel je nog steeds? Onze <a href="../../wizard/index.html">gratis wizard</a> vertaalt dit automatisch voor je.</p>''',
    },
    {
        "slug": "wat-betekent-edt-edp-parfum",
        "title": "Wat betekent EDT, EDP en Parfum eigenlijk?",
        "excerpt": "Die letters op het flesje zeggen meer dan je denkt: over hoe lang de geur blijft hangen én over de prijs. Kort uitgelegd.",
        "body": '''<p>Op bijna elk parfumflesje staat een afkorting: EDT, EDP, soms gewoon "Parfum". Dat is geen marketingtaal, het zegt iets concreets over wat je koopt.</p>
<h2>Het draait om concentratie</h2><p>Deze letters verwijzen naar het percentage geurolie in het flesje. Hoe meer geurolie, hoe intenser de geur ruikt en hoe langer hij blijft hangen. Eau de Toilette (EDT) zit meestal rond de 5-15%, Eau de Parfum (EDP) rond de 15-20%, en Parfum (of Extrait) kan boven de 20% zitten.</p>
<h2>Wat betekent dat in de praktijk?</h2><p>Een EDT is over het algemeen lichter en frisser, en werkt goed voor overdag of als je liever een subtiele geur draagt. Een EDP of Parfum trekt meer aandacht, houdt langer stand, vaak 6 tot 8 uur of meer, en is meestal ook duurder per flesje, al gebruik je er doorgaans ook minder van per keer.</p>
<h2>Wat betekent dit voor een cadeau?</h2><p>Voor een cadeau is dit vooral relevant als je weet hoe iemand geuren draagt. Houdt de ontvanger van een subtiele, alledaagse geur? Dan is een EDT een veilige keuze. Zoekt diegene juist iets met meer statement voor de avond of een speciale gelegenheid? Dan is een EDP of Parfum vaak een betere match.</p>
<p>Twijfel je welke concentratie bij iemand past? Onze <a href="../../wizard/index.html">gratis wizard</a> houdt hier automatisch rekening mee.</p>''',
    },
    {
        "slug": "hoe-lang-blijft-parfum-ruiken",
        "title": "Hoe lang blijft een parfum ruiken?",
        "excerpt": "Longevity en sillage zijn de twee termen die bepalen hoe een geur zich gedraagt. Wat betekenen ze, en wat kun je realistisch verwachten?",
        "body": '''<p>Een van de meestgestelde vragen bij een parfumcadeau: hoe lang ruik je dit eigenlijk nog? Het antwoord hangt af van twee dingen: longevity en sillage.</p>
<h2>Longevity: hoe lang je 'm zelf nog ruikt</h2><p>Longevity is de tijd dat je de geur op je eigen huid kunt blijven waarnemen. Dit varieert van een paar uur bij lichte, frisse geuren tot een hele dag bij zwaardere, houtachtige of amberachtige parfums. Concentratie speelt hierin een grote rol, zie ook ons artikel over EDT versus EDP.</p>
<h2>Sillage: wat anderen ruiken</h2><p>Sillage (Frans voor "spoor") is hoeveel geur er om je heen hangt, en hoe ver anderen het kunnen ruiken. Een parfum kan een prima longevity hebben maar toch een intieme sillage, wat betekent dat je 'm zelf nog goed ruikt terwijl anderen het pas merken als ze dichtbij komen.</p>
<h2>Wat is realistisch?</h2><p>Verwacht geen wondermiddel: huidtype, temperatuur en zelfs wat je eet kunnen invloed hebben op hoe een parfum zich gedraagt. Wat wij aangeven bij elke geur op ParfumPicker is een realistische inschatting op basis van het type parfum, geen belofte, maar een handvat om te weten wat je kunt verwachten.</p>
<p>Zoek je een geur die de hele dag meegaat? Geef dat aan in <a href="../../wizard/index.html">de wizard</a> en we houden er rekening mee.</p>''',
    },
    {
        "slug": "veelgemaakte-fouten-parfum-cadeau",
        "title": "De meest gemaakte fouten bij het kiezen van een parfumcadeau",
        "excerpt": "Een parfum cadeau doen lijkt simpel, tot je voor het schap staat. Dit zijn de valkuilen die een goedbedoeld cadeau alsnog laten mislukken.",
        "body": '''<p>Parfum is een populair cadeau, maar ook een cadeau waar je makkelijk de plank mee mis kunt slaan. Dit zijn de fouten die we het vaakst zien.</p>
<h2>Kiezen op basis van je eigen smaak</h2><p>De meest voorkomende valkuil: je koopt een geur die jíj lekker vindt, in plaats van iets dat past bij de persoonlijkheid en stijl van de ontvanger. Wat voor jou een fijne, frisse geur is, kan voor iemand anders volledig niet aanvoelen.</p>
<h2>Een te opvallende geur voor een onbekende gelegenheid</h2><p>Een sterke, gedurfde avondgeur is geweldig, voor de juiste gelegenheid. Als je niet zeker weet wanneer of waar iemand het gaat dragen, is een veelzijdigere, minder uitgesproken geur vaak de veiligere keuze.</p>
<h2>Afgaan op prijs in plaats van match</h2><p>Duurder is niet automatisch beter passend. Een goedkopere geur die precies bij iemand past, is een beter cadeau dan een prijzige fles die niemand ooit opmaakt.</p>
<h2>Geen idee hebben en dan maar gokken</h2><p>Begrijpelijk, parfumjargon is ontoegankelijk als je er niet middenin zit. Maar gokken op een merknaam die je toevallig kent, is niet nodig. Beantwoord een paar simpele vragen over de ontvanger en laat een tool het uitzoeken.</p>
<p>Precies hiervoor bestaat <a href="../../wizard/index.html">onze gratis wizard</a>: geen giswerk, wel een onderbouwd advies.</p>''',
    },
    {
        "slug": "prijsklasses-parfum-cadeau-uitgelegd",
        "title": "Wat kost een goed parfumcadeau? Prijsklasses uitgelegd",
        "excerpt": "Van budgetvriendelijk tot luxe: wat kun je verwachten voor je geld, en hoeveel moet je eigenlijk uitgeven voor een goed cadeau?",
        "body": '''<p>Een van de praktischste vragen bij een parfumcadeau: hoeveel geef je eigenlijk uit? Op ParfumPicker werken we met vier prijsklasses, van &euro; tot &euro;&euro;&euro;&euro;, zodat je precies binnen jouw budget kunt zoeken.</p>
<h2>&euro; - tot &euro;40</h2><p>In dit segment vind je toegankelijke, vaak fris-frisse geuren die prima werken als dagelijkse geur of als eerste kennismaking. Denk aan geuren als <a href="../../parfums/paco-1million/index.html">1 Million</a> of vergelijkbare toegankelijke klassiekers, niet de meest exclusieve keuze, maar wel een veilige.</p>
<h2>&euro;&euro; - &euro;40 tot &euro;80</h2><p>Dit is het segment waar de meeste bekende, veelgeprezen herengeuren in zitten, denk aan geuren als <a href="../../parfums/dior-sauvage-edt/index.html">Sauvage</a> of <a href="../../parfums/chanel-bleu-edt/index.html">Bleu de Chanel</a>. Een prima balans tussen prijs en kwaliteit voor de meeste cadeau-gelegenheden.</p>
<h2>&euro;&euro;&euro; - &euro;80 tot &euro;150</h2><p>Hier kom je in het segment van geconcentreerdere versies (EDP, Parfum) en meer exclusieve merken. Een goede keuze als je net iets meer wilt uitgeven voor een verjaardag of jubileum.</p>
<h2>&euro;&euro;&euro;&euro; - geen limiet</h2><p>Niche- en luxemerken, vaak met een meer uitgesproken karakter en kleinere oplages. Voor wie echt indruk wil maken of houdt van iets minder alledaags.</p>
<h2>Duurder is niet automatisch beter</h2><p>Het belangrijkste om te onthouden: een hogere prijs betekent niet automatisch een betere match. Een geur van &euro;35 die precies bij iemand past, is een beter cadeau dan een fles van &euro;120 die niet aanslaat.</p>
<p>Geef je budget aan in <a href="../../wizard/index.html">de wizard</a> en we zoeken binnen die grens naar de beste match.</p>''',
    },
    {
        "slug": "parfum-cadeau-verjaardag",
        "title": "Beste parfums voor een verjaardagscadeau (mannen)",
        "excerpt": "Een verjaardag is misschien wel de meest voorkomende gelegenheid om parfum cadeau te doen. Waar let je op, en welke geuren zijn een veilige gok?",
        "body": '''<p>Een verjaardag is de meest gekozen gelegenheid voor een parfumcadeau, en ook de gelegenheid met de meeste ruimte. Er is geen vaste "verjaardagsgeur", wat het juist makkelijker maakt: je hebt meer vrijheid om te kiezen op basis van wie de persoon is, in plaats van wat de gelegenheid vereist.</p>
<h2>Ken je de persoon goed? Ga wat gedurfder</h2><p>Bij een verjaardag van een partner, goede vriend of familielid die je goed kent, kun je iets specifieker kiezen, een geur die echt bij zijn of haar persoonlijkheid past, ook als die iets uitgesprokener is.</p>
<h2>Ken je de persoon minder goed? Kies veelzijdig</h2><p>Voor een collega of iemand die je minder goed kent, is een breed inzetbare, niet te overheersende geur de veiligere keuze. Klassiekers als <a href="../../parfums/dior-sauvage-edt/index.html">Sauvage</a> of <a href="../../parfums/chanel-bleu-edt/index.html">Bleu de Chanel</a> werken bij bijna iedereen, precies omdat ze veelzijdig zijn.</p>
<h2>Budget hoeft geen probleem te zijn</h2><p>Een verjaardagscadeau hoeft niet duur te zijn om goed te zijn, zie ook ons artikel over prijsklasses. Een geur die goed past, wint het altijd van een dure geur die niet aanslaat.</p>
<p>Beantwoord een paar vragen in <a href="../../wizard/index.html">de wizard</a> en ontvang een advies afgestemd op deze specifieke verjaardag.</p>''',
    },
    {
        "slug": "parfum-cadeau-kerst-sinterklaas",
        "title": "Parfum cadeau doen met Kerst en Sinterklaas",
        "excerpt": "De feestdagen zijn hét moment voor een iets luxere geur. Wat maakt een parfum geschikt als kerst- of sinterklaascadeau?",
        "body": '''<p>Kerst en Sinterklaas zijn traditioneel de piekmomenten voor parfumcadeaus, en met reden. De feestdagen lenen zich goed voor een iets luxere, warmere keuze dan je misschien de rest van het jaar zou kiezen.</p>
<h2>Warmere, rijkere geuren passen bij het seizoen</h2><p>Winterse gelegenheden zijn een goed moment voor houtachtige of amberachtige geuren, warmer en voller dan de frisse geuren die in de zomer populair zijn. Denk aan geuren met kruidige, houtige of vanille-achtige accenten.</p>
<h2>Het cadeau-moment zelf mag ook meespelen</h2><p>Bij Kerst wordt een cadeau vaak in gezelschap uitgepakt, en bij Sinterklaas hoort er soms een gedicht of verpakking bij. Een net iets mooiere doos of een bekender merk kan hier net dat beetje extra feestelijkheid geven, zonder dat het cadeau zelf duurder hoeft te zijn.</p>
<h2>Twijfel je? Een breed toepasbare geur is nooit fout</h2><p>Als je niet zeker weet wat iemand mooi vindt, blijft een veelzijdige, herkenbare geur als <a href="../../parfums/dior-sauvage-edt/index.html">Sauvage</a> of <a href="../../parfums/chanel-bleu-parfum/index.html">Bleu de Chanel Parfum</a> een solide keuze voor onder de kerstboom.</p>
<p>Laat <a href="../../wizard/index.html">onze wizard</a> een geur uitzoeken die past bij het seizoen én bij de ontvanger.</p>''',
    },
    {
        "slug": "parfum-cadeau-valentijn",
        "title": "Parfum als Valentijnscadeau: waar moet je op letten?",
        "excerpt": "Valentijn vraagt om een net iets persoonlijkere, verleidelijkere keuze. Dit maakt het verschil tussen een standaardcadeau en een cadeau dat opvalt.",
        "body": '''<p>Valentijnsdag is anders dan de meeste andere cadeau-momenten: het is intiemer, persoonlijker, en de geur mag best iets meer aandacht trekken dan op een doordeweekse dag.</p>
<h2>Ga voor iets met meer karakter</h2><p>Waar je bij een verjaardag of kantoorcadeau vaak kiest voor iets veelzijdigs, mag een Valentijnscadeau best iets gedurfder of sensueler zijn. Geuren als <a href="../../parfums/versace-eros-edt/index.html">Eros</a> zijn precies om deze reden populair rond Valentijn, warm, opvallend, gemaakt om herinnerd te worden.</p>
<h2>Denk aan het moment waarop het gedragen wordt</h2><p>Een Valentijnsgeur wordt meestal 's avonds gedragen, vaak tijdens een etentje of avondje uit. Dat betekent dat een geur met wat meer sillage (de "wolk" om iemand heen) hier juist goed op zijn plek is, in tegenstelling tot een subtiele kantoorgeur.</p>
<h2>Persoonlijk, maar niet te specifiek</h2><p>Het blijft een cadeau, dus je hoeft niet te gokken op iets heel specifieks. Een geur die bij de persoonlijkheid van je partner past, gedurfd, klassiek, speels, is een betere gok dan een geur die alleen "romantisch" moet klinken.</p>
<p><a href="../../wizard/index.html">Onze wizard</a> vraagt naar persoonlijkheid en hoe opvallend de geur mag zijn, dus je krijgt automatisch geuren die bij dit soort avond passen.</p>''',
    },
    {
        "slug": "parfum-cadeau-jubileum",
        "title": "Het perfecte parfumcadeau voor een jubileum",
        "excerpt": "Een jubileum, werk, huwelijk of anderszins, vraagt om een cadeau dat de gelegenheid recht doet. Zo kies je iets met net dat beetje meer statuur.",
        "body": '''<p>Een jubileum is een gelegenheid met gewicht, of het nu een werkjubileum, huwelijksjubileum of een andere mijlpaal is. Dat mag het cadeau ook laten zien, zonder dat het meteen extravagant hoeft te worden.</p>
<h2>Kies iets met net iets meer statuur</h2><p>Bij een jubileum is dit een goed moment om net een stap hoger te gaan dan je normaal zou doen, bijvoorbeeld een geconcentreerdere variant (EDP of Parfum in plaats van EDT) van een geur die de persoon al kent en waardeert, zoals <a href="../../parfums/chanel-bleu-parfum/index.html">Bleu de Chanel Parfum</a>.</p>
<h2>Klassieke, tijdloze geuren werken goed</h2><p>Een jubileum vraagt niet om het nieuwste, meest opvallende parfum, maar eerder om iets tijdloos, een geur waarvan je weet dat hij over jaren nog steeds relevant aanvoelt. Klassiekers hebben die status niet voor niets.</p>
<h2>De verpakking en presentatie mogen meetellen</h2><p>Bij een mijlpaalcadeau als dit hoort vaak ook een mooiere verpakking of een iets uitgebreidere presentatie. Dat verandert niets aan de geur zelf, maar versterkt wel het gevoel dat het cadeau bij de gelegenheid past.</p>
<p>Kies in <a href="../../wizard/index.html">de wizard</a> voor een verfijnde, klassieke persoonlijkheid en een iets hoger budget voor een advies dat recht doet aan het moment.</p>''',
    },
    {
        "slug": "frisse-geuren-uitgelegd",
        "title": "Frisse geuren uitgelegd: wanneer werkt een fris parfum het beste?",
        "excerpt": "Citrus, groen, watergedreven: frisse geuren zijn de meest gedragen categorie, en niet zonder reden. Dit is wanneer ze het beste werken.",
        "body": '''<p>Fris is verreweg de meest gedragen geurfamilie bij herenparfum, en dat is geen toeval. Deze geuren zijn ontworpen om schoon, actief en breed toepasbaar aan te voelen, wat ze tot een veilige keuze maakt in bijna elke situatie.</p>
<h2>Wat maakt een geur "fris"?</h2><p>Frisse geuren leunen op citrusnoten (bergamot, citroen, grapefruit), groene of aromatische tonen en soms watergedreven accenten. Ze missen de zwaarte van amber of hout, wat ze luchtiger en directer laat aanvoelen.</p>
<h2>Wanneer werkt een frisse geur het beste?</h2><p>Overdag, op kantoor, in warmere maanden en bij dagelijks gebruik, dit zijn de momenten waar frisse geuren het meest op hun plek zijn. Ze zijn subtieler dan een zware avondgeur en vallen minder snel op in een besloten ruimte zoals een kantoor.</p>
<h2>Goede voorbeelden</h2><p>Geuren als <a href="../../parfums/dior-sauvage-edt/index.html">Sauvage</a> combineren frisheid met net genoeg diepte om ook 's avonds te werken, precies waarom ze zo populair zijn als allround keuze.</p>
<p>Wil je weten of een frisse geur bij iemand past? <a href="../../wizard/index.html">Onze wizard</a> houdt rekening met de geurfamilie op basis van persoonlijkheid en hoe opvallend de geur mag zijn. Lees ook onze <a href="../geurfamilies-uitgelegd/index.html">algemene uitleg over geurfamilies</a> voor het volledige overzicht.</p>''',
    },
    {
        "slug": "amber-oosterse-geuren-uitgelegd",
        "title": "Amber en oosterse geuren uitgelegd: voor wie is dit een goed cadeau?",
        "excerpt": "Warm, kruidig, soms zoet: amber-geuren zijn de tegenpool van fris. Voor wie is dit een goede match, en wanneer werkt het het beste?",
        "body": '''<p>Waar frisse geuren luchtig en direct zijn, is de amberfamilie (vroeger vaak "oosters" genoemd) juist warm, rijk en soms zoet. Het is een geurfamilie met karakter, en niet voor elke gelegenheid de eerste keuze, maar wanneer het past, valt het echt op.</p>
<h2>Wat maakt een geur "amber"?</h2><p>Denk aan vanille, kruiden zoals kaneel of kardemom, harsachtige noten en soms tabak of leer. Deze noten geven een geur meer gewicht en een langere nazin dan de meeste frisse geuren.</p>
<h2>Voor wie is dit een goed cadeau?</h2><p>Amber-geuren passen goed bij iemand met een zelfverzekerde, warme of gedurfde persoonlijkheid, iemand die niet bang is om op te vallen. Het is ook een sterke keuze voor de koudere maanden, wanneer een frisse geur soms wat te licht aanvoelt.</p>
<h2>Wanneer werkt het het beste?</h2><p>'s Avonds, in de herfst en winter, en bij gelegenheden waar een geur mag opvallen, denk aan een avondje uit of een feestelijke gelegenheid. Geuren zoals <a href="../../parfums/paco-1million/index.html">1 Million</a> zijn een goed voorbeeld van hoe amber-accenten een geur direct herkenbaar en gedurfd maken.</p>
<p>Twijfel je of amber bij iemand past? <a href="../../wizard/index.html">De wizard</a> vraagt naar persoonlijkheid en moment, en weegt dat automatisch mee.</p>''',
    },
    {
        "slug": "houtachtige-geuren-uitgelegd",
        "title": "Houtachtige geuren uitgelegd: de klassieke, tijdloze keuze",
        "excerpt": "Cederhout, vetiver, sandelhout: houtachtige geuren zitten tussen fris en amber in, en zijn daardoor een van de veelzijdigste categorieën.",
        "body": '''<p>Houtachtige geuren zijn misschien wel de meest tijdloze categorie binnen herenparfum. Ze combineren de toegankelijkheid van fris met net iets meer diepte, wat ze geschikt maakt voor bijna elke gelegenheid.</p>
<h2>Wat maakt een geur "houtachtig"?</h2><p>De basis ligt in noten als cederhout, vetiver, sandelhout en patchouli, aardse, droge tonen die een geur warmte geven zonder dat het meteen zwaar of zoet wordt.</p>
<h2>Waarom deze categorie zo veelzijdig is</h2><p>Houtachtige geuren zitten precies tussen fris en amber in qua karakter. Ze werken overdag én 's avonds, in de zomer én de winter, wat ze tot een van de veiligste keuzes maakt als je niet zeker weet in welke context de geur gedragen gaat worden.</p>
<h2>Goede voorbeelden</h2><p>Klassiekers als <a href="../../parfums/chanel-bleu-edt/index.html">Bleu de Chanel</a> laten precies zien waarom deze familie zo populair is: elegant genoeg voor kantoor, veelzijdig genoeg voor de avond.</p>
<p>Zoek je een geur die niet te uitgesproken is, maar ook niet saai? <a href="../../wizard/index.html">Onze wizard</a> houdt hier rekening mee. Meer weten over de andere families? Bekijk onze <a href="../geurfamilies-uitgelegd/index.html">algemene uitleg over geurfamilies</a>.</p>''',
    },
    {
        "slug": "lijkt-op-parfums-dupes-uitgelegd",
        "title": "'Lijkt op'-parfums: hoe werkt dupe-zoeken en is het de moeite waard?",
        "excerpt": "Een goedkopere geur die lijkt op een bekende, dure klassieker, hoe eerlijk is dat eigenlijk, en wanneer is het een goed idee?",
        "body": '''<p>Je ziet het steeds vaker: een parfum dat wordt aangeprezen als "lijkt op" een bekende, duurdere geur. Dat roept een logische vraag op: is dat eigenlijk eerlijk, en is het de moeite waard?</p>
<h2>Wat betekent "lijkt op" precies?</h2><p>Het gaat hier niet om een illegale kopie of namaak, dat is iets anders en raden we altijd af. Het gaat om geuren die, door overlappende noten en accords, een vergelijkbaar geurprofiel hebben als een bekendere, vaak duurdere geur, zonder de formule te kopiëren. Op ParfumPicker gebruiken we dit veld puur als extra informatie: welke geuren een vergelijkbaar karakter hebben, zodat je een budgetvriendelijker alternatief kunt overwegen.</p>
<h2>Een bekend voorbeeld</h2><p><a href="../../parfums/dior-sauvage-edt/index.html">Sauvage</a> van Dior is een van de meest "gedupliceerde" geuren ter wereld, juist omdat het zo'n herkenbaar en populair profiel heeft. Alternatieven met een vergelijkbaar karakter zijn vaak een fractie van de prijs.</p>
<h2>Is het de moeite waard?</h2><p>Dat hangt af van wat je zoekt. Voor een budgetvriendelijk cadeau of als eerste kennismaking met een bepaald geurprofiel, kan een "lijkt op"-alternatief prima werken. Maar een dupe is zelden identiek, de nuances en de nazin verschillen vaak net genoeg om het geen 1-op-1 vervanging te maken. Zie het als een verwant alternatief, niet als een kopie.</p>
<p>Op elke <a href="../../parfums/dior-sauvage-edt/index.html">parfumpagina</a> op ParfumPicker vind je, waar relevant, vergelijkbare geuren, zodat je zelf kunt vergelijken.</p>''',
    },
]

def build_cadeau_inspiratie():
    path = "/cadeau-inspiratie/"
    base = depth_base(path)
    cards = "".join(
        f'''<a href="{rel("/cadeau-inspiratie/"+a["slug"]+"/", base)}" class="article-card reveal" style="display:block">
<div class="bottle" style="height:140px;border-radius:0">{marketing_photo_html(aidx, a["title"])}</div>
<div class="art-body"><h3>{esc(a["title"])}</h3><p>{esc(a["excerpt"])}</p>
<span class="details-link">Lees verder {icon("arrow")}</span></div></a>'''
        for aidx, a in enumerate(ARTICLES)
    )
    content = f'''
<section class="page-hero container"><h1>Cadeau-inspiratie</h1><p class="lead">Praktische gidsen om zonder gedoe het juiste parfumcadeau te kiezen.</p></section>
<section class="container"><div class="perfume-grid">{cards}</div></section>
'''
    html_out = base_page("Cadeau-inspiratie | ParfumPicker.nl", "Praktische artikelen en gidsen over het kiezen van het perfecte parfumcadeau.", content, path, active_nav="/cadeau-inspiratie/")
    write_page(path, html_out)

    for a in ARTICLES:
        apath = f'/cadeau-inspiratie/{a["slug"]}/'
        abase = depth_base(apath)
        acontent = f'''
<section class="page-hero container"><a href="{rel("/cadeau-inspiratie/", abase)}" style="font-size:13.5px;color:var(--text-muted)">&larr; Cadeau-inspiratie</a><h1 style="margin-top:10px">{esc(a["title"])}</h1></section>
<section class="container reveal" style="max-width:900px;margin:0 auto 8px"><div class="bottle" style="height:220px;border-radius:var(--radius-lg)">{marketing_photo_html(a["slug"], a["title"])}</div></section>
<section class="container prose">{a["body"]}</section>
<section class="section bg-soft"><div class="container" style="text-align:center">
  <a href="{rel("/wizard/", abase)}" class="btn btn-primary">Start ParfumPicker {icon('arrow')}</a>
</div></section>
'''
        ahtml = base_page(f'{a["title"]} | ParfumPicker.nl', a["excerpt"], acontent, apath, active_nav="/cadeau-inspiratie/")
        write_page(apath, ahtml)

build_hoe_het_werkt()
build_over_ons()
build_faq()
build_cadeau_inspiratie()
print("subpaginas geschreven")

# ---------- sitemap & robots (blijven absolute site-URLs, dit is voor Google, niet voor lokaal bekijken) ----------
def build_sitemap():
    static_paths = ["/", "/wizard/", "/hoe-het-werkt/", "/over-ons/", "/faq/", "/cadeau-inspiratie/"]
    static_paths += [f'/cadeau-inspiratie/{a["slug"]}/' for a in ARTICLES]
    perfume_paths = [f'/parfums/{p["id"]}/' for p in PERFUMES]
    all_paths = static_paths + perfume_paths
    urls = "\n".join(f'  <url><loc>{SITE_URL}{p}</loc></url>' for p in all_paths)
    xml = f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n'
    with open(os.path.join(DIST, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write(xml)
    print(f"sitemap.xml geschreven met {len(all_paths)} URLs")

def build_robots():
    txt = f"User-agent: *\nAllow: /\nSitemap: {SITE_URL}/sitemap.xml\n"
    with open(os.path.join(DIST, "robots.txt"), "w", encoding="utf-8") as f:
        f.write(txt)
    print("robots.txt geschreven")

build_sitemap()
build_robots()
