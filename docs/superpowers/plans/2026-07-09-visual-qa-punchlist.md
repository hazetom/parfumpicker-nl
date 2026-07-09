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
- [ ] Homepage embedded wizard-preview widget shows "Stap 1 van 5" (matching the
      "Zo werkt het" 5-step section below it), but the real wizard at `/wizard/`
      has 7 steps ("Stap 1 van 7": geslacht, gelegenheid, bekend, persoonlijkheid,
      moment, budget, seizoen). The homepage teaser undersells/misstates the
      actual flow length — worth reconciling copy vs. the real step count.
- [ ] "Top 10 populaire geuren" row (`.perfume-scroll`) is horizontally
      scrollable (`scrollWidth` 2466px vs `clientWidth` 1140px, i.e. only ~4-5
      of 10 cards are visible) but has no visible next/prev affordance — no
      arrow button, no fade edge. The approved mockup shows an explicit
      circular ">" button hinting scrollability; the live page relies on the
      browser's default (often near-invisible) scrollbar only.
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
- [ ] Minor: the FAQ-style heading "Waarom vragen we dit niet gewoon: "welke
      geur vind jij lekker?"" uses straight double quotes (`"…"`) rather than
      typographic/curly quotes, which reads as less polished next to the
      site's otherwise careful use of accented characters (e.g. "hém of háár"
      on the homepage). Cosmetic only.
- Otherwise none found: steps list, two-column Q&A content, CTA band, no
  overflow.

### 6. Cadeau-inspiratie (`/cadeau-inspiratie/`)
- [ ] The article list reuses the `.perfume-grid` class (`grid-template-columns:
      270px 270px 270px 270px`, a 4-column grid meant for the Top-10/related
      product cards) but only has 2 article link-cards. On desktop this
      leaves roughly half the row (2 of 4 columns, ~620px of the 1180px
      container) as dead empty space to the right of the two cards instead of
      wrapping/centering them or using a layout suited to a 2-item list.
- Otherwise none found: header/footer consistent, no overflow.

### 7. Over ons (`/over-ons/`)
- none found. Body copy correctly constrained to a `.prose` column
  (~706px) for readability, hero subtitle full-width single line as
  expected, feature-icon bar and footer consistent with other pages, no
  overflow.

### 8. FAQ (`/faq/`)
- [ ] The page-hero section contains only the `<h1>Veelgestelde vragen</h1>`
      with no intro/subtitle paragraph underneath it. Every other content
      page checked (`hoe-het-werkt`, `cadeau-inspiratie`, `over-ons`) has a
      one-line subtitle under its `<h1>` in the same `.page-hero` block —
      FAQ is the outlier and reads as visually abrupt by comparison.
- [ ] Bug: two FAQ answers render the literal text `&mdash;` instead of an
      em dash. Confirmed via rendered `textContent` (not just source), e.g.
      "...wij verdienen (op termijn) via advertenties en eventuele
      partnerlinks naar winkels &mdash; nooit via een account of
      abonnement." Root cause is a double-escaped entity (`&amp;mdash;`) in
      `dist/faq/index.html` — grep confirms exactly 2 occurrences, both in
      that file only, nowhere else in `dist/`.
- Accordion (`<details>`/`<summary>`) itself works correctly (expand/collapse
  verified by click), border/spacing on-token. No overflow.
