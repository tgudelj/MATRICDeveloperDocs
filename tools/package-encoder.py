"""Build the encoder download from its four self-contained source files."""

from pathlib import Path
import zipfile


def main():
    """Write a reproducible applet package and verify each archived source file."""
    root = Path(__file__).resolve().parents[1] / "examples" / "applets"
    source = root / "matric-plugin-encoder"
    destination = root / "matric-plugin-encoder.mapl"
    names = ["manifest.json", "applet.html", "applet.js", "encoder.js"]
    with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED) as archive:
        for name in names:
            info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, (source / name).read_bytes())
    with zipfile.ZipFile(destination) as archive:
        assert archive.testzip() is None
        assert sorted(archive.namelist()) == sorted(names)
        for name in names:
            assert archive.read(name) == (source / name).read_bytes()
    print(destination)


if __name__ == "__main__":
    main()
