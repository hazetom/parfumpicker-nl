#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Valideert data/parfums.jsonl tegen het datamodel uit README-data.md:
schema-velden, toegestane waarden, en unieke ids."""
import json
import os
import sys

REQUIRED_FIELDS = [
    "id", "naam", "merk", "jaar", "geslacht", "concentratie",
    "familie_hoofd", "familie_sub", "accords", "noten_top", "noten_hart",
    "noten_basis", "longevity", "sillage", "seizoen", "moment",
    "prijsklasse", "persoonlijkheid", "cadeau_gelegenheid", "beschrijving",
    "lijkt_op",
]
LIST_FIELDS = [
    "accords", "noten_top", "noten_hart", "noten_basis", "seizoen",
    "moment", "persoonlijkheid", "cadeau_gelegenheid", "lijkt_op",
]
VALID_GESLACHT = {"heren", "dames", "unisex"}
VALID_PRIJSKLASSE = {"€", "€€", "€€€", "€€€€"}
VALID_CONCENTRATIE = {"EDT", "EDP", "Parfum", "Extrait de Parfum", "Parfum Intense"}


def validate(path):
    errors = []
    ids_seen = {}
    count = 0
    with open(path, encoding="utf-8") as f:
        for lineno, raw in enumerate(f, 1):
            line = raw.strip()
            if not line:
                continue
            count += 1
            try:
                d = json.loads(line)
            except json.JSONDecodeError as e:
                errors.append(f"regel {lineno}: ongeldige JSON ({e})")
                continue

            missing = [k for k in REQUIRED_FIELDS if k not in d]
            if missing:
                errors.append(f"regel {lineno} ({d.get('id', '?')}): ontbrekende velden: {missing}")

            pid = d.get("id")
            if pid in ids_seen:
                errors.append(f"regel {lineno}: dubbel id '{pid}' (ook op regel {ids_seen[pid]})")
            elif pid:
                ids_seen[pid] = lineno

            if "geslacht" in d and d["geslacht"] not in VALID_GESLACHT:
                errors.append(f"regel {lineno} ({pid}): ongeldig geslacht '{d['geslacht']}'")
            if "prijsklasse" in d and d["prijsklasse"] not in VALID_PRIJSKLASSE:
                errors.append(f"regel {lineno} ({pid}): ongeldige prijsklasse '{d['prijsklasse']}'")
            if "concentratie" in d and d["concentratie"] not in VALID_CONCENTRATIE:
                errors.append(f"regel {lineno} ({pid}): ongeldige concentratie '{d['concentratie']}'")

            for field in LIST_FIELDS:
                if field in d and not isinstance(d[field], list):
                    errors.append(f"regel {lineno} ({pid}): veld '{field}' moet een lijst zijn, is {type(d[field]).__name__}")

    return count, errors


if __name__ == "__main__":
    default_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "parfums.jsonl")
    path = sys.argv[1] if len(sys.argv) > 1 else default_path
    count, errors = validate(path)
    print(f"{count} record(en) gecontroleerd in {path}")
    if errors:
        print(f"{len(errors)} fout(en) gevonden:")
        for e in errors:
            print(" -", e)
        sys.exit(1)
    print("Geen fouten gevonden.")
    sys.exit(0)
