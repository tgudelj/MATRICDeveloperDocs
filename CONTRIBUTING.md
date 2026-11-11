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

## Use the content in a portal

`portal.json` supplies ordered titles and paths. Keep relative file links working when generating routes, serve `assets/` as images, and offer the original files under `examples/` as downloads. Preserve the `.sdPlugin` directory name and contents.

Reader content uses ordinary Markdown with tables, fenced code and SVG/PNG images. `tests/` and `tools/` support maintenance and need not appear in reader navigation. Keep this repository as the editable source so the repository and any generated portal stay consistent.
