# ParfumPicker.nl professionalization pass — closing summary

**Date:** 2026-07-09
**Scope:** See [design spec](../specs/2026-07-09-parfumpicker-professionalization-design.md) and [implementation plan](2026-07-09-parfumpicker-professionalization.md). Executed via `superpowers:subagent-driven-development` for Tasks 2-12, then directly by the controller for Tasks 18-24 after the database-expansion tasks (13-17) were descoped and a subagent-dispatch rate limit was hit mid-session.

## What changed

**Critical bugs fixed (the site was non-functional before this pass):**
- `wizard.js` was truncated mid-file — the entire wizard (the product's core feature) rendered nothing. Fully reconstructed and verified end-to-end (all 7 steps, alternates, restart, both heren and vrouw paths).
- A CSS bug left every unscoped icon rendering at 100-240px instead of ~20px, site-wide.
- The mobile header overflowed past the viewport edge on every page under ~400px width.
- The mobile nav drawer collapsed to ~68px tall (links unreachable) — root cause: `backdrop-filter` on an ancestor `<header>` was creating a new CSS containing block for the fixed-position drawer. Fixed structurally by moving the drawer out of the header in `build.py`'s template.
- Wizard step 7's nav row (3 buttons) forced the page 52px wider than the viewport on mobile — fixed with `flex-wrap`.
- A stray `dist/dist/` partial-build directory (debris from before this session) was removed.
- A double-escaped HTML entity bug on the FAQ page (`&amp;mdash;` rendering literally) was fixed at the source.

**Database:** grew from 100 to 157 heren-parfums (2 new batches, ~57 entries). One batch initially passed schema validation but failed a factual accuracy check — a web-search-based review found wrong launch years and invented note pyramids in roughly half a sample. Took 3 correction rounds (including one the controller caught personally after the second "final" review still had 2 wrong entries) to actually resolve. **This is the main quality lesson from this pass:** schema validity is not the same as factual accuracy, and self-assessed "confidence" is not a substitute for actually checking a source.

**Scope change:** the user descoped further database expansion (Tasks 13-17, which would have grown the database to ~300) mid-session — 157 entries was judged sufficient for a working example. Full expansion remains a good candidate for a future pass, using the corrected process (mandatory web-search verification per entry from the start, not after).

**Visual variety:** bottle illustrations expanded from 1 shape (recolored 4 ways) to 3 shapes, deterministically assigned per perfume id so the same perfume always renders the same shape everywhere it appears. Verified the Python (`build.py`) and JS (`wizard.js`) generators produce identical results for the same id.

**Imagery:** searched for free, unbranded stock photography as an alternative to the SVG illustrations. Confirmed it exists (Unsplash) but integrating specific photos needs API access not currently set up — documented for a future pass, kept the (now more varied) illustration system.

**Content:** 12 new articles added (14 total, up from 2) — concentration/longevity/pricing explainers, 4 seasonal cadeaugidsen (verjaardag/kerst/valentijn/jubileum), and 3 geurfamilie deep-dives plus a "lijkt op"/dupes explainer. Discovered articles are generated from an `ARTICLES` list in `build.py`, not hand-authored HTML files as the plan assumed — used the actual, simpler mechanism.

**Tooling added:** `scripts/validate_parfums.py` (schema/duplicate gate), `scripts/check_html.py` (well-formedness), `scripts/check_links.py` (internal link integrity) — all three pass clean against the final build.

## Final verification (all passing)

- `python scripts/validate_parfums.py` — 157 records, 0 errors
- `python scripts/check_html.py` — 177 HTML files, 0 malformed
- `python scripts/check_links.py` — 4031 internal links, 0 broken
- Wizard: full heren path (7 steps → results → alternates ×5 → restart) and vrouw placeholder path (→ fallback to heren results) both verified live, zero console errors
- Mobile (375px): no horizontal overflow on homepage or new content pages

## What's still explicitly out of scope

- **Dames/unisex perfumes** — wizard still shows the "we're expanding" placeholder for that path, per original plan phasing.
- **Live deployment** — nothing was pushed to Vimexx/production. FTP credentials were never requested or provided. Everything is local, in `dist/`, ready for review.
- **Full database expansion to ~300** — descoped mid-session by the user; 157 entries currently.
- **New wizard UX mechanics** (match-counter, negative-signal question, cadeau-kaartje) — explicitly declined during brainstorming, not built.
- **Real per-brand product photography** — not sourced, for the trademark reasons the original plan flagged. Illustration system used instead.
- **Remote git** — version control is local only (`git log` in `parfumpicker-nl/`), no GitHub push.
- **Ad network integration, rating/star fields** — both explicitly cut from scope per prior decisions, unchanged.

## What Tom should look at before going further

1. **Review the site locally** at `http://localhost:4173/` (preview server config: `C:\ParfumIdee\Website\.claude\launch.json`) before any deployment decision.
2. **Decide on the database**: stay at 157, or resume expansion toward ~300 using the corrected (web-search-verified) process this pass established.
3. **Decide on imagery**: get Unsplash API access (or hand-pick specific licensed photos) if real photography is wanted over the illustration system.
4. **FTP credentials**, whenever ready to actually deploy.
