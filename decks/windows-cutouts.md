# Windows window cutouts (development preview)

This feature requires MATRIC Desktop **2.9.22 or later** and the matching WPF Windows development client. The existing Microsoft Store Windows client does not provide window holes. Keep the example in an isolated development deck collection until those builds are available.

A **Transparency** control reserves a normal rectangle in the deck grid. Choose a PNG or static SVG image in the control properties. Areas with alpha **exactly zero** create holes through the Windows client window. You can see and click the application underneath through those holes. The remaining areas display the artwork, which always stays inside the control.

Desktop **2.9.24** adds **Image scaling** with two options; use the matching WPF client **1.6.5** development build:

- **Stretch to fill** (default): fills the whole control and can distort the image. Existing decks retain this behavior.
- **Fit, keep proportions**: fits the whole image inside the control, anchored at the top-left. Unused space shows the ordinary deck and does not create additional window holes.

## Author a cutout

1. Drag the Transparency template from **Control templates → Other** into the editor. Its supplied SVG frame has a transparent centre; replace it with your own artwork if needed.
2. Move and resize it using the ordinary grid handles. Other controls cannot overlap its reserved rectangle, including the parts that will become holes.
3. Select a PNG or static SVG in its properties. The editor uses a checkerboard preview and remains a normal editor window.
4. Save the deck and open it in the WPF Windows client. Several Transparency controls can contribute separate holes.
5. Use **Keep deck above other windows** when the panel should stay visible over another application. **No focus** preserves that application's keyboard focus when using the deck. Settings and other native dialogs temporarily restore the rectangular window.

Use the control image for both the artwork and its mask. A page background scales separately and does not define holes. Nonzero alpha, including partially transparent edge pixels, keeps the native window intact. There is no color-key setting, soft desktop transparency, rotation or overlapping-control mode in this preview.

Clearing the image removes that control's holes. Missing, invalid or unsupported resources keep the window intact. Native mask-loading failures appear in the WPF client's status and diagnostics. Page/deck changes, renderer navigation, disconnect and hidden windows clear stale holes. In windowed presentation, the native toolbar stays outside the cutout area so Settings, Reload and Close remain reachable.

## Full screen and borderless windows

Choose **Immersive mode** in the WPF client's deck toolbar to fill the current monitor. The deck toolbar and status area disappear; **Exit full screen** remains visible above the deck, including when an image-defined hole falls beneath it. The renderer fits the new viewport and the native holes follow the resized controls. Leaving full screen restores the previous window size, position and state.

**Use a borderless deck window** in Settings independently removes the ordinary Windows frame in windowed presentation. It retains the deck toolbar and resizes from the window edges and corners, with no separate resize handle. Full screen does not change this saved preference. Use **Keep deck above other windows** separately when the overlay should remain visible while interacting with the application below it.

Custom applets should respond to ordinary size updates when entering or leaving full screen. This is a client presentation change; deck coordinates, non-overlap rules and integration messages remain unchanged.

## Compatibility and limits

- Clients using the updated shared renderer without native cutout support display the image as ordinary artwork. They do not provide click-through holes. Older server renderers do not understand the new control.
- Use a flat PNG or SVG filename beside `deck2.json`, such as `panel.png` or `panel.svg`. External URLs, data URLs and nested resource paths cannot define native holes.
- Use a static, self-contained SVG with embedded artwork. Standard SVG `DOCTYPE` declarations exported by graphics tools are supported, including `PUBLIC` and `SYSTEM` headers; no external DTD is loaded. Internal DTD declarations/entities, scripts, embedded web pages and animation are unsupported. External SVG images, fonts and styles are not loaded. The WPF client converts SVG artwork at the control's current physical size, so resizing refreshes the vector mask. Fully transparent areas create holes; anti-aliased or partly transparent edges remain in the window.
- Each source image is limited to **8 MiB encoded**. PNGs and rasterized SVG masks have a limit of **16,777,216 decoded pixels**; converted PNG masks must also fit the 8 MiB encoded limit. The active page has a **64 MiB decoded-image budget**, up to **128 cutout controls**, and **16,777,216 sampled physical pixels** across their rectangles.
- Native geometry is limited to **16,384 merged rectangles**, with a maximum sampled width or height of **16,384 physical pixels** per control. Very noisy masks, such as checkerboards of individual transparent pixels, may exceed the rectangle limit. Use clean, solid transparent areas. A failed page update leaves a rectangular window.
- Images follow the control's current rendered bounds, browser scaling and viewport clipping. Normal Save As, page/control copying, export and import carry the image through MATRIC's resource lifecycle.
- Mouse click-through, resizing, movement, native dialogs and deck/disconnect cleanup have been checked with the WPF development client. Touch/multitouch and transitions between different monitor DPI settings still require hardware validation.

## Example and file contract

The [preview example deck](../examples/decks/windows-cutouts.deck) requires Desktop 2.9.24 and contains separate PNG and SVG pages, each with one non-overlapping cutout rectangle and an ordinary harmless button. The wide PNG control stretches its frame; the wide SVG control fits its frame at the top-left and leaves unused space on the right. Its editable source is [deck2.json](../examples/decks/windows-cutouts/deck2.json), [panel.png](../examples/decks/windows-cutouts/panel.png) and [panel.svg](../examples/decks/windows-cutouts/panel.svg). It sends no keyboard, mouse or integration actions. Import it only in the matching development server. Use **Save As** to give a personal copy independent deck/page/control identities.

The serialized control uses these fields inside the page's `Controls` array:

```json
{
  "Id": "f76911ba-2c2e-4a99-bfca-69c22e9c2180",
  "ControlTypeName": "EXM.MatricPro.Controls.MCTransparency",
  "ControlConfigTypeName": "EXM.MatricPro.Controls.Config.MCTransparencyConfig",
  "Text": "",
  "X": 0,
  "Y": 0,
  "Width": 2,
  "Height": 2,
  "ControlEvents": [],
  "Config": {
    "BackgroundImage": "panel.png",
    "ImageScaling": "fill",
    "BackgroundColor": "transparent",
    "Padding": 0,
    "FileResources": ["panel.png"],
    "AdditionalResources": {},
    "ControlBindings": []
  }
}
```

`X`, `Y`, `Width` and `Height` are ordinary whole grid cells. The control has no action events. `BackgroundImage` uses the existing resource ownership rules; `FileResources` records the referenced image. Do not add another interactive control over its footprint. This is a deck control, not a custom applet, and it does not add UDP Integration API messages.

`ImageScaling` accepts `"fill"` (Stretch to fill) or `"contain"` (Fit, keep proportions). Missing, null or unrecognized values display as `"fill"`. This setting survives Save, Save As and export/import with the image.

For SVG artwork, set `BackgroundImage` to `panel.svg` and `FileResources` to `["panel.svg"]`. The optional version 1 cutout layout message carries the same revision-qualified `imageUrl` for either image format. Its `bounds` describe the painted image rectangle: the full control for stretch, or the fitted top-left image area for proportional fit. The whole grid rectangle remains reserved and may not overlap another control. Existing `MATRIC.capabilities.windowCutouts === 1` detection and message fields are unchanged.
