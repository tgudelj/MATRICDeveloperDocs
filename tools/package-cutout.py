"""Build or verify the isolated Windows cutout preview deck from its flat source."""

import argparse
import json
from pathlib import Path
import struct
import zipfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "examples/decks/windows-cutouts"
PACKAGE = ROOT / "examples/decks/windows-cutouts.deck"


def main():
    """Check the example's geometry/resources and synchronize its deterministic archive."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    deck = json.loads((SOURCE / "deck2.json").read_text(encoding="utf-8"))
    assert deck["DeckFileVersion"] == 3 and len(deck["Pages"]) == 2
    for page, image, scaling in zip(deck["Pages"], ("panel.png", "panel.svg"), ("fill", "contain")):
        assert 1 <= page["Cols"] <= 80 and 1 <= page["Rows"] <= 80
        controls = page["Controls"]
        for index, control in enumerate(controls):
            x, y, w, h = (control[k] for k in ("X", "Y", "Width", "Height"))
            assert all(type(n) is int for n in (x, y, w, h))
            assert x >= 0 and y >= 0 and w > 0 and h > 0 and x + w <= page["Cols"] and y + h <= page["Rows"]
            assert control["ControlEvents"] == []
            for other in controls[index + 1:]:
                assert not (x < other["X"] + other["Width"] and other["X"] < x + w and y < other["Y"] + other["Height"] and other["Y"] < y + h)
        assert controls[0]["Config"]["BackgroundImage"] == image
        assert controls[0]["Config"]["ImageScaling"] == scaling
        assert controls[0]["Width"] == 2 and controls[0]["Height"] == 1
        assert controls[0]["Config"]["FileResources"] == [image]
    png = (SOURCE / "panel.png").read_bytes()
    assert png[:8] == b"\x89PNG\r\n\x1a\n" and len(png) <= 8 * 1024 * 1024
    width, height = struct.unpack(">II", png[16:24])
    assert 0 < width * height <= 16_777_216
    svg = (SOURCE / "panel.svg").read_bytes()
    assert len(svg) <= 8 * 1024 * 1024 and ET.fromstring(svg).tag == "{http://www.w3.org/2000/svg}svg"
    files = sorted(SOURCE.iterdir())
    assert {p.name for p in files} == {"deck2.json", "panel.png", "panel.svg"}
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
    print("PASS cutout preview: flat PNG/SVG resources, no overlap/actions, image limits and synchronized package")


if __name__ == "__main__":
    main()
