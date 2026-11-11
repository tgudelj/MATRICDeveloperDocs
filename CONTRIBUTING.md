# Contribute to MATRIC Developer Docs

Use an issue or pull request to suggest a correction, improve an explanation or add a small example. Include the MATRIC Desktop/client versions and exact steps when reporting a compatibility problem. Remove credentials and private data from examples and logs.

## Write for applet and integration authors

Explain the public messages, files and setup steps. Keep quickstarts short and put optional fields and edge cases in the references. Use the names people see in MATRIC. Avoid implementation terminology and links to source code outside the public projects referenced here.

Update prose and examples together. State compatibility limits beside the feature they affect. Keep Stream Deck support labeled experimental and preserve its documented exclusions.

When changing applet layouts, test wide, square and tall containers, long content, padding, interaction and resize/resume behavior. A fitted preview does not prove that touch controls remain readable or usable on a phone.

## Check documentation and packages

From the repository root, with Python 3 installed:

```sh
python tools/check-docs.py
```

This checks local Markdown links and anchors, navigation paths, JSON examples, applet manifests and starter-package contents. It does not make network requests or validate external services.

After changing `examples/applets/starter-applet`, rebuild its downloadable package:

```sh
python tools/package-starter.py
python tools/check-docs.py
```

The package is generated from the five starter source files with stable metadata. Commit both the source changes and the updated `.mapl`.

## Run starter browser checks

With Node.js 20 or later installed:

```sh
cd tests
npm ci
npx playwright install chromium
npm test
```

On Linux, Playwright may also require its system dependencies; use `npx playwright install --with-deps chromium` when setting up a dedicated test environment. Alternatively, set `MATRIC_DOCS_BROWSER` to an installed Chromium browser executable.

The tests use isolated pages and a temporary local server. They check layout, real pointer input through scaling, variable updates, separate instances and resize/resume behavior. They do not run Windows actions or access installed MATRIC applets/decks. Add meaningful checks when an example introduces new behavior.

## Build and preview the portal

The [developer portal](https://tgudelj.github.io/MATRICDeveloperDocs/) is built with [Zensical](https://zensical.org/) and published to GitHub Pages. With Python 3.13 installed, run from the repository root:

```sh
python -m venv .venv
```

Activate that environment (`source .venv/bin/activate` on macOS/Linux, or `.venv\Scripts\Activate.ps1` in PowerShell), then run:

```sh
python -m pip install -r requirements-docs.txt
python tools/build-portal.py
python tools/check-portal.py
python tools/build-portal.py --serve
```

After building, the portal's browser checks can be run with `npm run test:portal --prefix tests`, using the same Playwright installation as the starter tests. They exercise the GitHub project URL prefix, search, navigation, anchors, downloads and the mobile menu.

Open the local URL printed by the preview server. Stop and rerun the preview command after editing the original Markdown or portal configuration, so the staged content is refreshed.

`portal.json` is the source of page titles and sidebar ordering. `mkdocs.yml` controls the theme and site settings; `portal/` holds the small visual customizations. The build stages only reader pages and public resources, rewrites Markdown links, and preserves the downloadable example files. Generated content stays under `.portal/` and `_site/` and is ignored by Git.

The **Developer portal** GitHub Actions workflow builds and validates pushes and pull requests. Successful pushes to `main` deploy to Pages; pull requests only validate. In repository **Settings > Pages**, the publishing source is **GitHub Actions**. This follows [GitHub's custom Pages workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Reader content uses ordinary Markdown with tables, fenced code and SVG/PNG images. `tests/` and `tools/` support maintenance and need not appear in reader navigation. Keep this repository as the editable source so the repository and any generated portal stay consistent.
