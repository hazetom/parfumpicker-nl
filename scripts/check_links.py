#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Controleert dat elke relatieve interne link in dist/**/index.html naar een bestaand bestand wijst."""
import os
import re

LINK_RE = re.compile(r'href="([^"]+)"')

if __name__ == "__main__":
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dist")
    total = 0
    broken = []
    for dirpath, _, filenames in os.walk(root):
        for fn in filenames:
            if fn != "index.html":
                continue
            path = os.path.join(dirpath, fn)
            with open(path, encoding="utf-8") as f:
                content = f.read()
            for href in LINK_RE.findall(content):
                if href.startswith(("http://", "https://", "mailto:", "#")):
                    continue
                total += 1
                target = os.path.normpath(os.path.join(dirpath, href.split("#")[0].split("?")[0]))
                if not os.path.exists(target):
                    broken.append((path, href))
    print(f"{total} interne links gecontroleerd")
    if broken:
        print(f"{len(broken)} gebroken link(en):")
        for src, href in broken:
            print(f" - {src} -> {href}")
    else:
        print("Geen gebroken links gevonden.")
