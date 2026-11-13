# Plugin touch strip and rotary source

This is the self-contained built-in MATRIC applet for one plugin encoder channel. The display, taps, rotary and center button share a single saved plugin action. Support is **experimental**.

Use a Desktop/client build that includes the combined encoder integration. Keep `AppletId: matric-plugin-encoder`; changing the ID disables the built-in routing. The original 2.9.19 installer may not include this integration.

- [Importable applet package](../matric-plugin-encoder.mapl)
- [Setup, properties, contracts and compatibility](../../../stream-deck/encoder-applet.md)
- Runtime source: [manifest.json](manifest.json), [applet.html](applet.html), [applet.js](applet.js), [encoder.js](encoder.js)

The package contains those four runtime files at its root. It does not include a plugin binary or external application. Configure an installed encoder-compatible plugin under **Plugin action** in the MATRIC editor. The default knob is drawn with CSS; custom artwork is selected through the applet properties and stored with the deck.

From this documentation repository's root, rebuild the download with `python tools/package-encoder.py`, then run `python tools/check-docs.py`. Keep these runtime files synchronized with the matching MATRIC built-in applet. The README is documentation and is not included in the runtime package.
