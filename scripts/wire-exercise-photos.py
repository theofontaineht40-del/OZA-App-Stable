#!/usr/bin/env python3
"""Ajoute `photoUrl` aux exercices de constants/exercise-library.ts dont l'image
existe dans assets/exercise-library/ (nom du fichier = id de l'exercice)."""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.path.join(ROOT, "constants", "exercise-library.ts")
IMG_DIR = os.path.join(ROOT, "assets", "exercise-library")

src = open(LIB, encoding="utf-8").read()
lines = src.split("\n")
added = []
for i, line in enumerate(lines):
    m = re.match(r'^(\s*)\{ id: "([^"]+)",', line)
    if not m or "photoUrl" in line:
        continue
    ex_id = m.group(2)
    for ext in ("png", "jpg", "jpeg"):
        if os.path.exists(os.path.join(IMG_DIR, f"{ex_id}.{ext}")):
            url = f'photoUrl: `${{IMAGE_BASE}}/{ex_id}.{ext}?v=${{IMAGE_VERSION}}`'
            # insère avant l'accolade fermante de la ligne (« }, » ou « } »)
            trailing_comma = line.rstrip().endswith(",")
            body = re.sub(r"\s*\},?\s*$", "", line)
            new = f"{body}, {url} }}" + ("," if trailing_comma else "")
            lines[i] = new
            added.append(ex_id)
            break

if added:
    open(LIB, "w", encoding="utf-8").write("\n".join(lines))
    print("Photos branchées :", ", ".join(added))
    print("Pense à pousser les images sur GitHub (jsDelivr les sert depuis main).")
else:
    print("Aucune nouvelle image trouvée dans assets/exercise-library/.")
