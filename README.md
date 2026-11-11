# MATRIC Developer Docs

Build your own MATRIC integrations and applets, or use supported Stream Deck plugin actions. These guides are written for hobbyist developers and include illustrations, runnable examples and a ready-to-customize starter applet.

Start with [Extend MATRIC](index.md) to choose the right extension path.

**[Read the developer portal](https://tgudelj.github.io/MATRICDeveloperDocs/)** for sidebar navigation, full-text search, section links and example downloads. The Markdown files here remain the editable source.

## Find your starting point

| You want to… | Read |
| --- | --- |
| Connect a Python program, game or local service | [Your first UDP integration](udp/quickstart.md) · [API reference](udp/reference.md) |
| Create your own interface inside a deck | [Copy the starter applet](applets/starter.md) · [Sizing and proportions](applets/layout.md) |
| Learn the applet messages with a minimal example | [Your first custom applet](applets/quickstart.md) · [Applet reference](applets/reference.md) |
| Reuse or write a supported Stream Deck plugin | [Stream Deck compatibility](stream-deck/guide.md) |
| Display external data in an applet | [Live status recipe](recipes/live-status.md) |
| Share an extension or solve a problem | [Sharing and troubleshooting](troubleshooting.md) |

**Stream Deck plugin support is experimental.** Compatibility varies by plugin, version and action. Profile switching, Stream Deck deep links, Elgato action/profile import and export, continuous sliders and touch strips are excluded.

## Download examples

- [Starter applet package](examples/applets/starter-applet.mapl): install on the MATRIC Windows PC, then customize the [source files](examples/applets/starter-applet). Includes proportional sizing, parameters, variable display and an action event.
- [Python UDP example](examples/udp/status.py): no third-party Python packages required.
- [Hello applet](examples/applets/hello-applet): a minimal two-file message example.
- [Hello Stream Deck plugin](examples/stream-deck/com.example.matrichello.sdPlugin): a small Node 24 action example.

The applets require no npm install or build step. Open the starter's `applet.html` locally for a standalone preview, or follow its [installation guide](applets/starter.md) to use MATRIC actions.

## Public integration examples

[MATRICIntegrationDemo](https://github.com/tgudelj/MATRICIntegrationDemo) contains complete Windows C# applications using raw UDP and the MATRIC SDK, plus a demo deck and build instructions. This repository provides the broader developer guides; that project provides the C# walkthroughs.

[DCS-BIOS-MATRIC-Middleware](https://github.com/tgudelj/DCS-BIOS-MATRIC-Middleware) is a real-world, two-way integration between DCS World and MATRIC: cockpit indicators update deck displays, and deck controls send commands to DCS-BIOS. It requires a configured DCS-BIOS setup; see that project for installation and connection instructions.

## Compatibility and validation

These guides were prepared for MATRIC **2.9.18**. Check the [validation notes](VALIDATION.md) for the checks performed and the remaining Windows/device walkthroughs. Each example's guide describes its runtime requirements. Contributions should identify the MATRIC and client versions used for testing.

## Contribute and reuse

Corrections, examples and clearer explanations are welcome. See [Contributing](CONTRIBUTING.md) for checks and packaging instructions. Keep explanations practical and self-contained; readers should not need access to MATRIC's application source code.

Documentation, illustrations and examples in this repository are available under the [MIT License](LICENSE). Referenced third-party projects retain their own licenses.
