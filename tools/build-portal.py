"""Build or preview the documentation portal from the existing Markdown files."""

import argparse
import json
from pathlib import Path
import shutil
import subprocess
import sys

import yaml


ROOT = Path(__file__).resolve().parents[1]


def main():
    """Stage reader content, derive navigation, and invoke Zensical with strict checks."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--serve", action="store_true", help="Serve a local preview")
    parser.add_argument("--dev-addr", default="127.0.0.1:8000")
    args = parser.parse_args()
    content = ROOT / ".portal" / "content"
    if content.exists():
        shutil.rmtree(content)
    content.mkdir(parents=True)
    portal = json.loads((ROOT / "portal.json").read_text(encoding="utf-8"))

    def copy_file(relative):
        """Copy an explicit public resource while keeping paths within this repository."""
        source = ROOT / relative
        if source.is_symlink() or not source.is_file() or ROOT not in source.resolve().parents:
            raise ValueError("Invalid portal resource: " + str(relative))
        destination = content / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, destination)

    def navigation(items):
        """Use portal.json as the single source of sidebar ordering and page titles."""
        result = []
        for item in items:
            if "path" in item:
                copy_file(Path(item["path"]))
                result.append({item["title"]: item["path"]})
            else:
                result.append({item["title"]: navigation(item["pages"])})
        return result

    config = yaml.safe_load((ROOT / "mkdocs.yml").read_text(encoding="utf-8"))
    config["nav"] = navigation(portal["navigation"])
    for directory in portal["staticDirectories"]:
        for file in sorted((ROOT / directory).rglob("*")):
            if file.is_file() and file.name != ".DS_Store":
                copy_file(file.relative_to(ROOT))
    copy_file(Path("LICENSE"))
    styles = content / "assets" / "stylesheets"
    styles.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ROOT / "portal" / "styles.css", styles / "portal.css")
    shutil.copyfile(ROOT / "portal" / "downloads.js", content / "assets" / "downloads.js")
    config["docs_dir"] = ".portal/content"
    config["site_dir"] = "_site"
    if args.serve:
        config["site_url"] = "http://" + args.dev_addr + "/"
    generated = ROOT / ".portal.yml"
    generated.write_text(yaml.safe_dump(config, sort_keys=False), encoding="utf-8")
    command = [sys.executable, "-m", "zensical", "serve" if args.serve else "build",
               "--config-file", str(generated), "--strict"]
    if not args.serve:
        command.append("--clean")
    if args.serve:
        command += ["--dev-addr", args.dev_addr]
    subprocess.run(command, cwd=ROOT, check=True)
    if not args.serve:
        # GitHub Pages serves the generated artifact directly, without Jekyll processing.
        (ROOT / "_site" / ".nojekyll").touch()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        raise SystemExit(130)
    except subprocess.CalledProcessError as error:
        raise SystemExit(error.returncode)
