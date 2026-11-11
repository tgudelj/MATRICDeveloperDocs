"""Check generated portal links, anchors, search data and example downloads."""

from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "_site"
BASE = "/MATRICDeveloperDocs/"


class Page(HTMLParser):
    """Collect generated links and fragment targets without running page scripts."""

    def __init__(self, text):
        super().__init__()
        self.links = []
        self.ids = set()
        self.feed(text)

    def handle_starttag(self, tag, attributes):
        """Collect local link, script, image and iframe references."""
        attrs = dict(attributes)
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        for key in ("href", "src"):
            if attrs.get(key):
                self.links.append(attrs[key])


def main():
    """Require generated reader navigation and downloadable source files to resolve."""
    pages = {file: Page(file.read_text(encoding="utf-8")) for file in SITE.rglob("*.html")}
    assert SITE / "index.html" in pages, "Build the portal first"
    for source, page in pages.items():
        for link in page.links:
            url = urlsplit(link)
            if url.scheme or url.netloc:
                continue
            location = unquote(url.path)
            if location.startswith(BASE):
                target = SITE / location[len(BASE):]
            elif location.startswith("/"):
                raise AssertionError("Link escapes the GitHub project path: " + link)
            else:
                target = source.parent / location if location else source
            target = target.resolve()
            assert SITE == target or SITE in target.parents, link
            if target.is_dir():
                target /= "index.html"
            assert target.is_file(), f"Missing generated target in {source.relative_to(SITE)}: {link}"
            if url.fragment and target in pages:
                assert unquote(url.fragment) in pages[target].ids, f"Missing generated anchor: {link}"

    search = json.loads((SITE / "search.json").read_text(encoding="utf-8"))
    assert any("Your first UDP integration" in item["title"] for item in search["items"])
    assert any("starter applet" in item["title"].lower() for item in search["items"])
    for file in (ROOT / "examples").rglob("*"):
        if file.is_file() and file.suffix != ".md" and file.name != ".DS_Store":
            assert (SITE / file.relative_to(ROOT)).read_bytes() == file.read_bytes(), file.name
    assert not (SITE / "tools").exists() and not (SITE / "tests").exists()
    print(f"Passed: {len(pages)} HTML pages, local links and anchors, search index and example downloads")


if __name__ == "__main__":
    main()
