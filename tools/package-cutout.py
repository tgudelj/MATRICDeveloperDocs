"""Build or verify the isolated Windows cutout preview deck from its flat source."""

import argparse
import json
from pathlib import Path
import struct
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "examples/decks/windows-cutouts"
PACKAGE = ROOT / "examples/decks/windows-cutouts.deck"


def main():
    """Check the example's geometry/resources and synchronize its deterministic archive."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    deck = json.loads((SOURCE / "deck2.json").read_text(encoding="utf-8"))
    controls = deck["Pages"][0]["Controls"]
    page = deck["Pages"][0]
    assert deck["DeckFileVersion"] == 3 and 1 <= page["Cols"] <= 80 and 1 <= page["Rows"] <= 80
    for index, control in enumerate(controls):
        x, y, w, h = (control[k] for k in ("X", "Y", "Width", "Height"))
        assert all(type(n) is int for n in (x, y, w, h))
        assert x >= 0 and y >= 0 and w > 0 and h > 0 and x + w <= page["Cols"] and y + h <= page["Rows"]
        assert control["ControlEvents"] == []
        for other in controls[index + 1:]:
            assert not (x < other["X"] + other["Width"] and other["X"] < x + w and y < other["Y"] + other["Height"] and other["Y"] < y + h)
    png = (SOURCE / "panel.png").read_bytes()
    assert png[:8] == b"\x89PNG\r\n\x1a\n" and len(png) <= 8 * 1024 * 1024
    width, height = struct.unpack(">II", png[16:24])
    assert 0 < width * height <= 16_777_216
    assert controls[0]["Config"]["BackgroundImage"] == "panel.png"
    assert controls[0]["Config"]["FileResources"] == ["panel.png"]
    files = sorted(SOURCE.iterdir())
    assert {p.name for p in files} == {"deck2.json", "panel.png"}
    expected = {deck["Id"] + "/" + p.name: p.read_bytes() for p in files}
    if args.check:
        with zipfile.ZipFile(PACKAGE) as archive:
            assert set(archive.namelist()) == set(expected)
            assert all(archive.read(name) == data for name, data in expected.items())
    else:
        with zipfile.ZipFile(PACKAGE, "w", zipfile.ZIP_DEFLATED) as archive:
            for name, data in expected.items():
                entry = zipfile.ZipInfo(name, (2026, 11, 18, 0, 0, 0))
                entry.compress_type = zipfile.ZIP_DEFLATED
                archive.writestr(entry, data)
    print("PASS cutout preview: flat resources, no overlap/actions, PNG limits and synchronized package")


if __name__ == "__main__":
    main()
