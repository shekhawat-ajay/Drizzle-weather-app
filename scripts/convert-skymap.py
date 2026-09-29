"""
Regenerate weather-app/public/data/skymap/*.json from Sky Map source-data.

Source: https://github.com/sky-map-team/stardroid (stardroid-v2/source-data/)
Positions/figures are factual catalog data (public domain, via Hipparcos/Yale BSC).
Star proper names: IAU WGSN Catalog of Star Names (CC BY 4.0, credited in CREDITS.md).

Usage (from weather-app root):
  python scripts/convert-skymap.py --src <path-to-stardroid>/stardroid-v2/source-data
"""
import argparse
import csv
import json
import pathlib
import shutil

OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "data" / "skymap"


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--src", type=pathlib.Path, required=True,
                   help="Path to stardroid-v2/source-data directory")
    return p.parse_args()


def main():
    args = parse_args()
    base = args.src
    OUT.mkdir(parents=True, exist_ok=True)

    stars = list(csv.DictReader(open(base / "stars.csv", encoding="utf-8")))

    def parse_star(r):
        names = r["names"].split("|") if r["names"] else [""]
        return {
            "id": r["id"],
            "ra": float(r["ra_deg"]),
            "dec": float(r["dec_deg"]),
            "mag": float(r["magnitude"]),
            "name": names[0],
        }

    full = [parse_star(r) for r in stars]
    bright = [s for s in full if s["mag"] <= 4.0]
    (OUT / "stars.full.json").write_text(json.dumps(full), encoding="utf-8")
    (OUT / "stars.bright.json").write_text(json.dumps(bright), encoding="utf-8")

    dso = list(csv.DictReader(open(base / "dso.csv", encoding="utf-8")))
    dso_j = []
    for r in dso:
        try:
            mag = float(r["magnitude"]) if r["magnitude"] else None
        except ValueError:
            mag = None
        desig = r["designations"].split("|")[0] if r["designations"] else ""
        dso_j.append({
            "id": r["id"],
            "ra": float(r["ra_deg"]),
            "dec": float(r["dec_deg"]),
            "mag": mag,
            "type": r["type"],
            "desig": desig,
            "name": r["names"],
        })
    (OUT / "dso.json").write_text(json.dumps(dso_j), encoding="utf-8")
    shutil.copy(base / "constellations" / "iau.json", OUT / "constellations.json")
    print(f"wrote full={len(full)} bright={len(bright)} dso={len(dso_j)} to {OUT}")


if __name__ == "__main__":
    main()
