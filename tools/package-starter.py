"""Build the downloadable starter from its source files, without build tools."""

from pathlib import Path
import zipfile


def main():
    """Package only the starter files, with stable metadata for reproducible output."""
    root = Path(__file__).resolve().parents[1] / "examples" / "applets"
    source = root / "starter-applet"
    destination = root / "starter-applet.mapl"
    names = ["manifest.json", "applet.html", "applet.css", "applet.js", "README.md"]
    contents = {name: (source / name).read_bytes() for name in names}
    with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, content in contents.items():
            info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, content)
    with zipfile.ZipFile(destination) as archive:
        assert archive.testzip() is None
        assert all(archive.read(name) == content for name, content in contents.items())
    print(destination)


if __name__ == "__main__":
    main()
