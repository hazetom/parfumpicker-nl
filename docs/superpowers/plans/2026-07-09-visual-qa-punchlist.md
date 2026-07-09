# Visual QA punch list — desktop + mobile

Audited at desktop viewport (1280x800) against the design-system tokens in
`dist/assets/css/style.css` (`--accent:#025F61`, `--accent-dark:#014547`,
`--bg:#FDFCFB`, `--text:#22262A`, `--text-muted:#5B6472`, `--border:#E4E7EB`,
`--gold:#C8952E`) and the approved mockup
(`C:\ParfumIdee\Website\ChatGPT Image Jul 9, 2026, 03_21_56 PM.png`).

Method note: the preview browser's screenshot tool (`preview_screenshot`)
timed out consistently for this session (retried after a server restart,
still failed) while `preview_eval`, `preview_snapshot`, and `preview_inspect`
all worked normally. The audit below was done using those tools instead —
DOM/computed-style inspection, accessibility-tree snapshots, and
`document.body.scrollWidth` vs `window.innerWidth` overflow checks on every
page — which gives equivalent ground truth for layout/color/overflow issues,
just without a pixel screenshot artifact. Every page below was navigated to
live on `http://localhost:4173` and its rendered DOM was inspected, not just
its source HTML.

## Desktop

### 1. Homepage (`/`)
- [x] Homepage embedded wizard-preview widget shows "Stap 1 van 5" (matching the
      "Zo werkt het" 5-step section below it), but the real wizard at `/wizard/`
      has 7 steps ("Stap 1 van 7": geslacht, gelegenheid, bekend, persoonlijkheid,
      moment, budget, seizoen). The homepage teaser undersells/misstates the
      actual flow length — worth reconciling copy vs. the real step count.
      **Fixed:** `wizard_preview_panel_html()` in `build.py` now reads "Stap 1
      van 7" with progress-fill at 14% (1/7), matching the real wizard.
- [x] "Top 10 populaire geuren" row (`.perfume-scroll`) is horizontally
      scrollable (`scrollWidth` 2466px vs `clientWidth` 1140px, i.e. only ~4-5
      of 10 cards are visible) but has no visible next/prev affordance — no
      arrow button, no fade edge. The approved mockup shows an explicit
      circular ">" button hinting scrollability; the live page relies on the
      browser's default (often near-invisible) scrollbar only.
      **Fixed:** added a `.perfume-scroll-wrap` wrapper with a right-edge fade
      (`::after` gradient) and a circular `.scroll-next` button (44px, reuses
      the existing arrow icon) that calls `scrollBy({left:260,behavior:'smooth'})`
      on the scroll container. CSS in `dist/assets/css/style.css`, markup in
      `build.py`'s homepage top-10 section.
- [x] Header, hero, feature icons, "Start ParfumPicker tool" widget, "Zo werkt
      het" steps: colors/spacing match tokens, no overflow
      (`bodyScrollWidth` 1265 vs `innerWidth` 1280), icon sizes consistent
      (20px small icons, 34px feature icons) — none found beyond the two items
      above.

### 2. Wizard — step 1 (`/wizard/`)
- none found. Progress bar fill color `rgb(2,95,97)` = `--accent`, selected
  option-card background `rgb(228,239,238)` = `--accent-light`, panel
  background white with `--shadow`, no horizontal overflow. Consistent header
  and footer.

### 3. Wizard — results view (after completing all 7 steps)
- none found. Verified by scripting through the full flow (man → gelegenheid
  → optional merk → 2 persoonlijkheid tags → moment → budget → seizoen →
  "Bekijk mijn advies"). Result cards, "Onze aanrader" badge
  (`--accent-light`/`--accent-dark`), reason-text callout, dashed
  "Advertentie" ad-slot placeholder (border/padding/radius all present via
  computed style, just returns a stale 0-height box from the bounding-box
  inspector — not an actual rendering bug), and "Bekijk details" links (all
  resolve 200, e.g. `/parfums/diesel-spirit-of-the-brave/index.html`) all
  check out. No overflow.

### 4. Parfum detail template (`/parfums/dior-sauvage-edt/`)
- none found. Hero bottle illustration reasonably sized (220x280), tag chips
  use `--accent-light`/`--accent-dark`, spec grid, notes columns, "Lijkt op"
  related-product cards, and CTA band all present and on-token. No overflow.

### 5. Hoe het werkt (`/hoe-het-werkt/`)
- [x] Minor: the FAQ-style heading "Waarom vragen we dit niet gewoon: "welke
      geur vind jij lekker?"" uses straight double quotes (`"…"`) rather than
      typographic/curly quotes, which reads as less polished next to the
      site's otherwise careful use of accented characters (e.g. "hém of háár"
      on the homepage). Cosmetic only.
      **Fixed:** heading in `build.py`'s `build_hoe_het_werkt()` now uses
      `&ldquo;…&rdquo;` curly quotes.
- Otherwise none found: steps list, two-column Q&A content, CTA band, no
  overflow.

### 6. Cadeau-inspiratie (`/cadeau-inspiratie/`)
- [x] The article list reuses the `.perfume-grid` class (`grid-template-columns:
      270px 270px 270px 270px`, a 4-column grid meant for the Top-10/related
      product cards) but only has 2 article link-cards. On desktop this
      leaves roughly half the row (2 of 4 columns, ~620px of the 1180px
      container) as dead empty space to the right of the two cards instead of
      wrapping/centering them or using a layout suited to a 2-item list.
      **Fixed:** changed `.perfume-grid` in `dist/assets/css/style.css` from
      `repeat(auto-fill,minmax(230px,1fr))` to `repeat(auto-fit,minmax(230px,1fr))`
      so empty implicit tracks collapse and existing cards stretch to fill the
      row (verified: 2 cards now render at 561px each, 0px dead space).
      This is a shared class also used by the "Lijkt op" related-products
      section on parfum detail pages, which continues to render correctly
      with more cards.
- Otherwise none found: header/footer consistent, no overflow.

### 7. Over ons (`/over-ons/`)
- none found. Body copy correctly constrained to a `.prose` column
  (~706px) for readability, hero subtitle full-width single line as
  expected, feature-icon bar and footer consistent with other pages, no
  overflow.

### 8. FAQ (`/faq/`)
- [x] The page-hero section contains only the `<h1>Veelgestelde vragen</h1>`
      with no intro/subtitle paragraph underneath it. Every other content
      page checked (`hoe-het-werkt`, `cadeau-inspiratie`, `over-ons`) has a
      one-line subtitle under its `<h1>` in the same `.page-hero` block —
      FAQ is the outlier and reads as visually abrupt by comparison.
      **Fixed:** added `<p class="lead">Antwoorden op de vragen die we het
      vaakst krijgen over ParfumPicker.</p>` under the `<h1>` in
      `build_faq()` in `build.py`.
- [x] Bug: two FAQ answers render the literal text `&mdash;` instead of an
      em dash. Confirmed via rendered `textContent` (not just source), e.g.
      "...wij verdienen (op termijn) via advertenties en eventuele
      partnerlinks naar winkels &mdash; nooit via een account of
      abonnement." Root cause is a double-escaped entity (`&amp;mdash;`) in
      `dist/faq/index.html` — grep confirms exactly 2 occurrences, both in
      that file only, nowhere else in `dist/`.
      **Fixed at the source:** `FAQS` in `build.py` had the literal text
      `&mdash;` in two answer strings, which then got passed through
      `esc()` (i.e. `html.escape`) in `build_faq()`, turning `&` into
      `&amp;` and producing `&amp;mdash;`. Replaced the entity text with an
      actual em-dash character (`—`) in both `FAQS` strings, which `esc()`
      leaves untouched. Verified via rendered `textContent` on both
      affected FAQ items (2 real em dashes render, no `&mdash;`/`&amp;mdash;`
      anywhere in `dist/`) and confirmed the fix survives a `python build.py`
      rerun (it's a source-string fix, not a patched HTML file).
- Accordion (`<details>`/`<summary>`) itself works correctly (expand/collapse
  verified by click), border/spacing on-token. No overflow.

## Mobile

Audited at mobile viewport (375x812). Same method note as Desktop applies:
`preview_screenshot` timed out again in this session (retried once), so this
pass also used `preview_eval`/`preview_snapshot`/`preview_inspect` — DOM and
computed-style inspection, `elementFromPoint` hit-testing, accessibility-tree
snapshots, and `document.body.scrollWidth`/`document.documentElement.scrollWidth`
vs `window.innerWidth` overflow checks — on every page, navigated to live on
`http://localhost:4173`. Findings below are new to mobile; issues already
logged under Desktop (wizard step-count mismatch, Top-10 scroll affordance,
curly quotes, cadeau-inspiratie grid, FAQ subtitle/`&mdash;` bug) were not
re-verified here except where mobile changes the picture (noted inline).

- [x] **Mobile nav drawer only paints/hit-tests the top ~68px band — most of
      its links are visually and functionally unreachable by tap.** Reproduced
      on two different pages (homepage `/` and `/faq/`). Opening the drawer
      (`#mobileNav.open`) sets `.mobile-nav`/`.panel` to `position:fixed`/
      `position:static` with `overflow:visible`, but both elements' own
      computed `height` collapses to `67.6px` (matching the header height)
      instead of the full viewport. The `<a>` links inside (`getBoundingClientRect`
      shows them correctly laid out at e.g. top 72px, 115px, 159px, 202px,
      246px) are geometrically positioned below that 68px line, but
      `document.elementFromPoint()` at those coordinates returns the
      underlying page content (e.g. the homepage `<section class="hero">` /
      `<h1>`, or the FAQ `<h1>`) instead of the nav panel — confirming the
      links are not actually paintable/tappable there, only the close button
      (`×`, which sits inside the 68px band) and the top 1–2 links are usable.
      In effect the mobile menu is broken for reaching "Cadeau-inspiratie",
      "Over ons", "FAQ", and "Start ParfumPicker" via a real touch tap, even
      though a `.click()` called directly on the `<a>` element (bypassing
      hit-testing) still works and the drawer's own open/close toggle (via the
      hamburger and `×` buttons) functions correctly. No horizontal overflow
      is introduced by this (`body.scrollWidth` stays 375 while the drawer is
      open) — this is purely a vertical/hit-test clipping bug on the drawer
      itself, most likely `.mobile-nav`/`.panel` needs an explicit
      `height:100dvh` (or `100vh`) instead of the auto/inherited height it's
      currently resolving to.
      **Root cause confirmed and fixed:** `.mobile-nav` was nested inside
      `<header class="site-header">` in the generated markup. `.site-header`
      has `backdrop-filter:blur(8px)`, which establishes a containing block
      for its fixed-position descendants — so `.mobile-nav`'s `inset:0`
      resolved against the ~69px header box instead of the viewport.
      Restructured `header_html()` in `build.py` so the `.mobile-nav` div is
      now a sibling of `<header>` (both direct children of `<body>`) instead
      of nested inside it — no containing-block trap. Verified live at
      375×812 on both `/` and `/faq/`: drawer height is now 812px (full
      viewport), `.mobile-nav`'s parent is `BODY`, and every link
      (Hoe het werkt, Cadeau-inspiratie, Over ons, FAQ, Start ParfumPicker)
      is correctly hit-testable via `elementFromPoint`. No horizontal
      overflow introduced (`body.scrollWidth` still 375 while open).
- [x] **Wizard step 7 ("In welk seizoen...") footer button row overflows the
      viewport and expands the whole page's layout width, producing real
      horizontal scroll site-wide on that step only.** Verified live: on step
      7, `document.body.scrollWidth`, `document.documentElement.scrollWidth`,
      and even `window.innerWidth` all read `427` instead of `375` (the
      overflowing content forces the mobile layout viewport itself to widen,
      not just the body). Root cause: `.wizard-nav` is `display:flex;
      justify-content:space-between` with two children — "Vorige" (94px) and
      an unlabeled right-hand `flex-wrap:nowrap` group containing "Sla over"
      (106px) + "Bekijk mijn advies" (178px) with a 10px gap (294px total,
      positioned `left:133px` to `right:427px`, i.e. 52px past the 375px
      viewport edge). The equivalent 3-button rows on the other two optional
      steps (step 3: "Vorige"/"Sla over"/"Volgende"; step 5: same) do **not**
      overflow (`scrollWidth` stays 375) — step 7 is unique because "Bekijk
      mijn advies" is much longer than "Volgende" and is the only step where
      that longer label combines with the "Sla over" skip button in the same
      nowrap row. All other wizard steps (1, 2, 4, 6) and the results page
      (`/wizard/?resultaat=1`) confirmed no overflow, and `innerWidth` reverts
      to 375 immediately after advancing past step 7 to the results page — the
      bug is isolated to step 7's button row.
      **Fixed:** added `flex-wrap:wrap` to `.wizard-nav` in
      `dist/assets/css/style.css`. Verified live at 375px width by scripting
      through the wizard to step 7: `window.innerWidth`, `document.body.scrollWidth`,
      and `document.documentElement.scrollWidth` all stayed at 375 (previously
      forced to 427). "Vorige" now sits on its own row; "Sla over" and "Bekijk
      mijn advies" wrap to a second row and fit fully within 0-375px.
- [x] Minor: FAQ accordion `<summary>` tap targets are inconsistent in height
      — the first FAQ item's clickable row is only 24px tall (`padding: 0`,
      `line-height: 24px`, full 335px width) while the next two are 48px tall
      (two-line question text). 24px sits right at the WCAG 2.5.8 (AA) 24×24px
      minimum but well under the more comfortable 44px touch-target guideline,
      and the inconsistency between items (24px vs 48px) makes the row heights
      look uneven when scanning the accordion on a phone.
      **Fixed:** added `padding:12px 0` (plus `display:flex;align-items:center`)
      to `.faq-item summary` in `dist/assets/css/style.css`. All FAQ rows are
      now at least 48px tall (verified: 48/72/72/48/72/48px across the 6
      items on `/faq/`), comfortably above the 44px touch-target guideline,
      and the accordion still expands/collapses correctly on click.
- Confirmed clean (no horizontal overflow anywhere — `body`/`documentElement`
  `scrollWidth` equals `window.innerWidth` at 375 on every check — and header
  present/non-overflowing on every template checked): homepage (`/`, including
  hero, feature-icon rows, embedded wizard-preview teaser, "Zo werkt het"
  steps, Top-10 row — scroll-only overflow inside `.perfume-scroll` as
  expected, same pattern as the Desktop finding, not re-logged here), wizard
  step 1 (`/wizard/`, `option-card` tap targets 156×100px), wizard step 2
  (gelegenheid), step 3 (merk, skippable), step 4 (persoonlijkheid tags,
  `option-card.multi` 156×60px, 12 tags), step 5 (moment), step 6 (budget),
  results view (`/wizard/?resultaat=1`, result cards, "Onze aanrader" badge,
  ad-slot placeholder, "Bekijk details →" links), parfum detail template
  (`/parfums/dior-sauvage-edt/`, tag chips, spec grid), `/hoe-het-werkt/`,
  `/cadeau-inspiratie/` (`.perfume-grid` correctly collapses to a single
  335px column on mobile — the Desktop 4-column dead-space issue does not
  reproduce here), `/over-ons/`, and `/faq/` (baseline layout/header; see
  drawer and accordion-tap-target findings above for this page's actual
  issues).
