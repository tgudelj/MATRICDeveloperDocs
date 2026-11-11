"""Check local documentation links, examples, navigation and applet packaging."""

from collections import Counter
import json
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit
import zipfile


ROOT = Path(__file__).resolve().parents[1]


def heading_ids(text):
    """Build the heading fragments used by the repository's Markdown pages."""
    counts = Counter()
    result = set()
    # Ignore headings inside fenced code examples.
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    for heading in re.findall(r"^#{1,6}\s+(.+)$", text, re.M):
        base = re.sub(r"[^\w\- ]", "", heading.lower()).replace(" ", "-")
        number = counts[base]
        result.add(base + ("-" + str(number) if number else ""))
        counts[base] += 1
    return result


def main():
    """Validate the publication files without network access or MATRIC installation."""
    for page in ROOT.rglob("*.md"):
        if "node_modules" in page.parts:
            continue
        text = page.read_text(encoding="utf-8")
        assert text.count("```") % 2 == 0, f"Unclosed code fence: {page.relative_to(ROOT)}"
        for value in re.findall(r"\]\(([^)]+)\)", text):
            url = urlsplit(value)
            if url.scheme or url.netloc:
                assert url.scheme in ("https", "http", "mailto"), f"Unsupported URL: {value}"
                continue
            target = (page.parent / unquote(url.path)).resolve() if url.path else page
            assert target == ROOT or ROOT in target.parents, f"Link leaves repository: {value}"
            assert target.exists(), f"Missing link in {page.relative_to(ROOT)}: {value}"
            if url.fragment and target.suffix == ".md":
                assert unquote(url.fragment) in heading_ids(target.read_text(encoding="utf-8")), f"Missing anchor: {value}"
        for example in re.findall(r"```json\n(.*?)\n```", text, re.S):
            json.loads(example)

    for file in ROOT.rglob("*.json"):
        if "node_modules" not in file.parts:
            json.loads(file.read_text(encoding="utf-8"))

    portal = json.loads((ROOT / "portal.json").read_text(encoding="utf-8"))

    def navigation(items):
        """Require every reader navigation entry to resolve to a Markdown page."""
        for item in items:
            if "path" in item:
                target = ROOT / item["path"]
                assert target.is_file() and target.suffix == ".md", item["path"]
            navigation(item.get("pages", []))

    navigation(portal["navigation"])
    assert (ROOT / portal["entry"]).is_file()
    for directory in portal["staticDirectories"]:
        assert (ROOT / directory).is_dir(), directory

    applets = ROOT / "examples" / "applets"
    for manifest_file in applets.glob("*/manifest.json"):
        manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
        assert manifest["AppletId"] == manifest_file.parent.name
        assert (manifest_file.parent / "applet.html").is_file()
        for key in ("AppletParams", "EventsDefinition"):
            names = [entry["Name"] for entry in manifest[key]]
            assert all(names) and len(set(names)) == len(names), manifest_file.name

    starter = applets / "starter-applet"
    with zipfile.ZipFile(applets / "starter-applet.mapl") as archive:
        names = ["manifest.json", "applet.html", "applet.css", "applet.js", "README.md"]
        assert sorted(archive.namelist()) == sorted(names)
        assert archive.testzip() is None
        for name in names:
            assert archive.read(name) == (starter / name).read_bytes(), f"Rebuild starter package: {name}"
    print("Passed: local links and anchors, JSON examples, navigation, manifests and starter package")


if __name__ == "__main__":
    main()
