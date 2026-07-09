# ParfumPicker.nl — professionalization pass (design)

**Date:** 2026-07-09
**Status:** Approved by Tom, ready for implementation planning.

## Context

`parfumpicker-nl/` contains a working static build (`build.py` generates `dist/`) covering a homepage, a 5-step cadeau-wizard, 100 heren-parfum pages, and four subpages, per the strategic plan (`../../../Parfum-Website-Strategisch-Plan.md`) and the approved homepage mockup (`../../../Website/ChatGPT Image Jul 9, 2026, 03_21_56 PM.png`).

A live review of the built site (not just the source) surfaced defects the plan's self-QA missed:

- `assets/js/wizard.js` is truncated mid-file (312 lines, cuts off inside an object literal). The wizard — the product's core differentiator — renders nothing.
- `.icon` SVGs are unstyled outside `.trust-item`/`.footer-trust`, so icons in the hero eyebrow badge and the homepage wizard-preview panel render 100–240px instead of ~20–30px.
- The site header overflows the viewport under ~400px width (logo, CTA button, and hamburger collide), on every page — contradicting the plan's own "harde eis" that mobile must be 100% workable from the first build.
- `dist/dist/` is a stray nested duplicate of the build output, suggesting `build.py` isn't idempotent.
- No git repository exists yet, despite a full build already being in place.

This spec covers fixing those defects and bringing the site to a professional, review-ready state, without expanding scope beyond what the strategic plan already committed to (no dames/unisex, no live deployment, no new wizard mechanics beyond what's specified).

## Goals

1. The wizard works end-to-end (all 5 steps + results + "toon alternatieven") and matches the field-driven flow in plan section 4.
2. Every screen — homepage, wizard, results, parfum template, 4 subpages — is visually correct against the mockup's design system, verified by actually looking at rendered screenshots (desktop + mobile), not just reading HTML.
3. The parfum database grows from 100 to ~300 heren-entries, using only well-documented mainstream releases, with original (non-copied) descriptions.
4. A first batch of 10–15 evergreen core articles exists per plan section 9's fase-1 list, ready for review.
5. The project is under local git version control.
6. Nothing is deployed live. Everything lands in `dist/` (and source) for Tom to review before he publishes.

## Non-goals (explicitly out of scope this pass)

- Dames/unisex perfumes — wizard keeps its existing "we're expanding" placeholder for that path.
- Live deployment / FTP — no credentials are available, and even if they were, this pass stops at "ready to review."
- New wizard mechanics beyond the plan: no match-counter, no negative-signal ("wat vindt hij/zij zeker niet lekker") question, no printable "cadeau-kaartje." These were proposed during brainstorming and explicitly declined for this pass.
- Real per-brand product photography. Trademark/copyright risk, called out in the plan itself (section 11) and compounded by scaling to 300 branded products.
- Remote git (GitHub push) — local repository only.
- Ad network integration — the placeholder ad slot stays a placeholder.
- Rating/star fields — explicitly cut in the plan and staying cut.

## Design

### 1. Bug fixes (do first — everything else depends on a working build)

- Rewrite `assets/js/wizard.js` in full (the truncation lost the tail: `STEP_RENDERERS` map, the `render()` dispatcher, and the init call). Reconstruct from the visible logic already in the file (all step-renderer functions, `rankedList`, `showResults` are intact) plus the flow described in plan section 4.
- Fix `.icon` sizing: give it a sane default size in the base stylesheet (not just inside two specific parent selectors), so every future usage is safe by default rather than accidentally unconstrained.
- Fix the mobile header: header actions need to wrap/collapse correctly under the nav breakpoint so the logo, CTA, and hamburger never overlap or overflow.
- Diagnose and fix whatever in `build.py` produces `dist/dist/`; delete the stray directory once the root cause is fixed.
- `git init` in `parfumpicker-nl/`, with an initial commit capturing the current (pre-fix) state so the history shows what changed and why.

### 2. Visual QA pass across all screens

No new screens to design — everything from the plan already exists in code. This is a verification-and-polish pass:

- Render each screen (homepage, wizard steps 1–5, results, a sample parfum page, all 4 subpages) at both desktop and mobile widths and actually look at them.
- Compare against the mockup's design system (accent `#025F61`, background `#FDFCFB`, charcoal text, Inter-style geometric sans, rounded-square logo mark) for consistency — flag and fix any page that drifts from it.
- Verify keyboard/focus behavior on the wizard's option-cards, since it's the only interactive product surface and accessibility wasn't addressed anywhere in the plan.

### 3. Database expansion (100 → ~300)

- Same schema as the existing 100 entries (`parfumpicker-nl/data/parfums.jsonl`): naam, merk, jaar, familie_hoofd/sub, noten, concentratie, prijsklasse, seizoen, gelegenheid-tags, persoonlijkheidstags, sillage/longevity, eigen beschrijving, lijkt-op.
- Only add perfumes that are widely documented and mainstream enough that notes/accords/launch year are consistent across common knowledge — skip anything obscure enough to require a guess.
- Descriptions written fresh, not copied from any source, matching the tone of the existing 100.
- No dames/unisex additions.

### 4. Imagery

- Search for free-to-use, unbranded, generic fragrance-bottle stock photography (Unsplash/Pexels-style, commercially licensed for free use) for decorative placements (hero, general atmosphere shots).
- For the ~300 individual product pages, expand the current illustration system from 4 recolored silhouettes to a handful of additional shape variants, so pages within the same geurfamilie don't look identical. This stays fully placeholder/IP-safe — real per-brand photography is not in scope (see Non-goals).
- If suitable free stock imagery can't be found for a given placement, fall back to the illustration system rather than using anything of uncertain license.

### 5. Content — first article batch

- Draft 10–15 evergreen core articles per plan section 9 / section 5 pillars: geurfamilies uitgelegd, "hoe kies je een parfumcadeau", and similar foundational pieces (not yet the seasonal cadeaugidsen, which are timed to specific moments).
- Written using the database as factual grounding (plan section 5's "AI schrijft, mens fiatteert" approach) — these sit ready for Tom's review, not auto-published.

## Testing / verification approach

- Wizard: manually drive all 5 steps plus "toon alternatieven" in a live preview browser, for at least two different answer paths (including a narrow/edge-case combination) to confirm the empty-list and exhausted-list behaviors already specified in the plan work.
- Visual QA: screenshot every screen at desktop and mobile widths as the pass proceeds — this is the check the original build skipped.
- Links: re-run whatever produced the "2,759 links, 0 broken" claim in the plan (or reconstruct an equivalent check) after the database grows to ~300, since link count triples.
- HTML validation: re-check as pages are added, same bar as the original 0-errors claim.

## Open items for Tom (non-blocking — noted, not asked, since he's stepping away)

- FTP/SFTP credentials for Vimexx, whenever he's ready to actually deploy.
- A final decision on the permanent, rights-cleared image solution (own photography vs. affiliate feed) — this pass only ships placeholders.
