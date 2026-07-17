#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Matcht data/parfums.jsonl tegen een Awin (ICI Paris XL) datafeed en stelt
per parfum een afbeelding_url + affiliate_url voor.

Standaard: DRY RUN. Print alleen een rapport (matched/ambigu/geen match),
schrijft niets weg. Pas met --apply worden data/parfums.jsonl echt bijgewerkt,
en alleen voor de regels die als "confident" zijn aangemerkt.

Gebruik:
  python scripts/import_awin_feed.py <pad-naar-datafeed.csv.gz>
  python scripts/import_awin_feed.py <pad-naar-datafeed.csv.gz> --apply
"""
import csv
import gzip
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FILE = os.path.join(ROOT, "data", "parfums.jsonl")

# Merken waarvan de merchant-feed een andere naam gebruikt dan wij.
BRAND_ALIASES = {
    "giorgio armani": "armani",
    "emporio armani": "armani",
    "thierry mugler": "mugler",
    "paco rabanne": "rabanne",  # merk heette vroeger Paco Rabanne, feed gebruikt de nieuwe naam
}

# Concentratie -> mogelijke tekst-varianten in de feed, van specifiek naar generiek.
CONCENTRATIE_PATTERNS = {
    "EDT": ["eau de toilette"],
    "EDP": ["eau de parfum"],
    "Extrait de Parfum": ["extrait de parfum", "parfum extrait", "extrait"],
    "Parfum Intense": ["parfum intense"],
    "Parfum": ["parfum"],  # let op: matcht ook binnen "eau de parfum", dus als laatste proberen
}

# Non-fragrance companion-producten die we nooit willen (zelfde lijn, ander artikel).
EXCLUDE_KEYWORDS = [
    "deodorant", "deo stick", "deo spray", "douchegel", "shower gel", "zeep", "soap",
    "aftershave lotion", "aftershave balsem", "after shave", "scheergel", "shave gel",
    "bodylotion", "body lotion", "showergel", "gel douche", "creme", "crème",
    "hair", "haar", "candle", "kaars", "set", "geschenkset", "gift set", "coffret",
]


def norm(s):
    # The feed uses U+00B4 (acute accent, "L´eau") for apostrophes rather than
    # a straight quote or a typographic right-single-quote; our own data uses
    # a straight quote. Canonicalize all apostrophe-like characters so names
    # like "L'Eau" / "L’Eau" / "L´Eau" compare equal.
    s = re.sub(r"[‘’´`]", "'", s or "")
    return re.sub(r"\s+", " ", s).strip().lower()


def load_our_perfumes():
    items = []
    with open(DATA_FILE, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                items.append(json.loads(line))
    return items


def load_feed(path):
    opener = gzip.open if path.endswith(".gz") else open
    rows = []
    with opener(path, mode="rt", encoding="utf-8", errors="replace", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows


def index_by_brand(rows):
    idx = {}
    for row in rows:
        b = norm(row.get("brand_name"))
        if not b:
            continue
        idx.setdefault(b, []).append(row)
    return idx


def name_prefix_match(product_name, naam):
    """True als de tekst NA de eerste ' - ' begint met onze fragrance-naam
    als los woord (voorkomt 'Sauvage' matchend op 'Eau Sauvage')."""
    if " - " not in product_name:
        return False
    after = norm(product_name.split(" - ", 1)[1])
    target = norm(naam)
    if after == target:
        return True
    if after.startswith(target + " "):
        return True
    return False


def is_excluded(product_name):
    low = norm(product_name)
    return any(kw in low for kw in EXCLUDE_KEYWORDS)


def concentratie_score(product_name, concentratie):
    """Hoger = specifiekere/betere match van de concentratie-tekst. 0 = geen match."""
    low = norm(product_name)
    patterns = CONCENTRATIE_PATTERNS.get(concentratie, [norm(concentratie)])
    for rank, pat in enumerate(patterns):
        if pat in low:
            return len(patterns) - rank  # eerdere (specifiekere) patronen wegen zwaarder
    return 0


def extract_ml(product_name):
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*ML", product_name, re.IGNORECASE)
    if not m:
        return None
    try:
        return float(m.group(1).replace(",", "."))
    except ValueError:
        return None


def pick_best_size(candidates):
    """Bij meerdere maten van hetzelfde product: 100ml als die er is, anders
    de kleinste beschikbare (meest 'instap'-achtige, representatieve foto)."""
    with_ml = [(extract_ml(c["product_name"]), c) for c in candidates]
    for target in (100.0,):
        for ml, c in with_ml:
            if ml == target:
                return c
    with_ml_known = [(ml, c) for ml, c in with_ml if ml is not None]
    if with_ml_known:
        return min(with_ml_known, key=lambda x: x[0])[1]
    return candidates[0]


def find_match(perfume, brand_index):
    merk_norm = norm(perfume["merk"])
    merk_norm = BRAND_ALIASES.get(merk_norm, merk_norm)
    rows = brand_index.get(merk_norm, [])
    if not rows:
        return None, "geen merk in feed"

    name_matches = [r for r in rows if name_prefix_match(r["product_name"], perfume["naam"])]
    if not name_matches:
        return None, "merk gevonden, naam niet"

    fragrance_rows = [r for r in name_matches if not is_excluded(r["product_name"])]
    if not fragrance_rows:
        return None, "alleen non-parfum artikelen (deo/gel/etc.) gevonden"

    scored = [(concentratie_score(r["product_name"], perfume["concentratie"]), r) for r in fragrance_rows]
    best_score = max(s for s, _ in scored)
    if best_score == 0:
        # naam klopt, maar geen enkele rij heeft een herkenbare concentratie-tekst;
        # neem toch de kandidatenlijst mee maar markeer als "ambigu" voor handmatige check
        return None, f"naam gevonden, concentratie '{perfume['concentratie']}' niet herkend ({len(fragrance_rows)} kandidaten)"

    top = [r for s, r in scored if s == best_score]
    chosen = pick_best_size(top)
    return chosen, None


def main():
    if len(sys.argv) < 2:
        print("Gebruik: python scripts/import_awin_feed.py <datafeed.csv.gz> [--apply]")
        sys.exit(1)
    feed_path = sys.argv[1]
    apply = "--apply" in sys.argv[2:]

    perfumes = load_our_perfumes()
    feed_rows = load_feed(feed_path)
    brand_index = index_by_brand(feed_rows)

    matched, unmatched = [], []
    for p in perfumes:
        row, reason = find_match(p, brand_index)
        if row:
            matched.append((p, row))
        else:
            unmatched.append((p, reason))

    print(f"Feed: {len(feed_rows)} rijen, {len(brand_index)} merken.")
    print(f"Onze database: {len(perfumes)} parfums.")
    print(f"\n=== GEMATCHT: {len(matched)}/{len(perfumes)} ===")
    for p, row in matched:
        img = row.get("merchant_image_url") or row.get("aw_image_url") or "(geen foto-URL)"
        print(f"  {p['merk']} - {p['naam']} ({p['concentratie']})")
        print(f"    -> {row['product_name']}")
        print(f"    foto: {img[:90]}")
        print(f"    prijs: {row.get('store_price')} {row.get('currency')}  |  voorraad: {row.get('in_stock')}")

    print(f"\n=== GEEN MATCH: {len(unmatched)}/{len(perfumes)} ===")
    for p, reason in unmatched:
        print(f"  {p['merk']} - {p['naam']} ({p['concentratie']}): {reason}")

    if not apply:
        print("\nDit was een DRY RUN, er is niets weggeschreven.")
        print("Controleer de matches hierboven. Draai opnieuw met --apply om")
        print("data/parfums.jsonl bij te werken voor de 'GEMATCHT'-regels.")
        return

    by_id = {p["id"]: p for p in perfumes}
    updated = 0
    for p, row in matched:
        # merchant_image_url (media.iciparisxl.nl) is the one that actually
        # resolves to a real photo for real browser requests. aw_image_url
        # (Awin's images2.productserve.com proxy) was verified broken for
        # this feed - it silently serves a "no image available" placeholder
        # instead of erroring, so it is deliberately NOT used as a fallback:
        # no image (illustration fallback) beats a fake broken-image link.
        img = row.get("merchant_image_url")
        if not img:
            continue
        by_id[p["id"]]["afbeelding_url"] = img
        by_id[p["id"]]["affiliate_url"] = row.get("aw_deep_link") or row.get("merchant_deep_link") or ""
        updated += 1

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        for p in perfumes:
            f.write(json.dumps(p, ensure_ascii=False) + "\n")

    print(f"\n{updated} parfums bijgewerkt in {DATA_FILE}.")


if __name__ == "__main__":
    main()
