#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Vlakke well-formedness check over alle dist/**/index.html-bestanden."""
import os
from html.parser import HTMLParser

class Checker(HTMLParser):
    def __init__(self):
        super().__init__()
        self.errors = []

def check_file(path):
    checker = Checker()
    with open(path, encoding="utf-8") as f:
        content = f.read()
    try:
        checker.feed(content)
        checker.close()
    except Exception as e:
        return [str(e)]
    return checker.errors

if __name__ == "__main__":
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dist")
    total = 0
    failed = 0
    for dirpath, _, filenames in os.walk(root):
        for fn in filenames:
            if fn == "index.html":
                total += 1
                path = os.path.join(dirpath, fn)
                errs = check_file(path)
                if errs:
                    failed += 1
                    print(f"{path}: {errs}")
    print(f"{total} HTML-bestanden gecontroleerd, {failed} met problemen")
