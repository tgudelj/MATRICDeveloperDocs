# Windows window cutouts (development preview)

This feature requires matching development builds of MATRIC Desktop and the new WPF Windows client. It is **not included in the released MATRIC 2.9.21 server or the existing MAUI client**. Keep the example in an isolated development deck collection until those builds are available.

A **Transparency** control reserves a normal rectangle in the deck grid. Choose its PNG image in the control properties. The image stretches to fill that rectangle; pixels with alpha **exactly zero** create holes through the Windows client window. You can see and click the application underneath through those holes. The PNG's remaining pixels display its artwork.

## Author a cutout

1. Drag the Transparency template from **Control templates → Windows cutouts** into the editor.
2. Move and resize it using the ordinary grid handles. Other controls cannot overlap its reserved rectangle, including the parts that will become holes.
3. Select a PNG in its properties. The editor uses a checkerboard preview and remains a normal editor window.
4. Save the deck and open it in the WPF Windows client. Several Transparency controls can contribute separate holes.
5. Use **Keep deck above other windows** when the panel should stay visible over another application. **No focus** preserves that application's keyboard focus when using the deck. Settings and other native dialogs temporarily restore the rectangular window.

Use the control image for both the artwork and its mask. A page background scales separately and does not define holes. Nonzero alpha, including partially transparent edge pixels, keeps the native window intact. There is no color-key setting, soft desktop transparency, rotation or overlapping-control mode in this preview.

Clearing the image removes that control's holes. Missing, invalid or unsupported resources keep the window intact. Native mask-loading failures appear in the WPF client's status and diagnostics. Page/deck changes, renderer navigation, disconnect and hidden windows clear stale holes. In windowed presentation, the native toolbar stays outside the cutout area so Settings, Reload and Close remain reachable.

## Full screen and borderless windows

Choose **Immersive mode** in the WPF client's deck toolbar to fill the current monitor. The deck toolbar and status area disappear; **Exit full screen** remains visible above the deck, including when an image-defined hole falls beneath it. The renderer fits the new viewport and the native holes follow the resized controls. Leaving full screen restores the previous window size, position and state.

**Use a borderless deck window** in Settings independently removes the ordinary Windows frame in windowed presentation. It retains the deck toolbar and resize grip. Full screen does not change this saved preference. Use **Keep deck above other windows** separately when the overlay should remain visible while interacting with the application below it.

Custom applets should respond to ordinary size updates when entering or leaving full screen. This is a client presentation change; deck coordinates, non-overlap rules and integration messages remain unchanged.

## Compatibility and limits

- Clients using the updated shared renderer without native cutout support display the PNG as ordinary artwork. They do not provide click-through holes. Older server renderers do not understand the new control.
- Use a flat PNG filename beside `deck2.json`, such as `panel.png`. External URLs, data URLs, SVGs and nested resource paths cannot define native holes.
- Each PNG is limited to **8 MiB encoded** and **16,777,216 decoded pixels**. The active page has a **64 MiB decoded-image budget**, up to **128 cutout controls**, and **16,777,216 sampled physical pixels** across their rectangles.
- Native geometry is limited to **16,384 merged rectangles**, with a maximum sampled width or height of **16,384 physical pixels** per control. Very noisy masks, such as checkerboards of individual transparent pixels, may exceed the rectangle limit. Use clean, solid transparent areas. A failed page update leaves a rectangular window.
- Images follow the control's current rendered bounds, browser scaling and viewport clipping. Normal Save As, page/control copying, export and import carry the image through MATRIC's resource lifecycle.
- Mouse click-through, resizing, movement, native dialogs and deck/disconnect cleanup have been checked with the WPF development client. Touch/multitouch and transitions between different monitor DPI settings still require hardware validation.

## Example and file contract

The [preview example deck](../examples/decks/windows-cutouts.deck) contains one non-overlapping cutout rectangle and an ordinary harmless button. Its editable source is [deck2.json](../examples/decks/windows-cutouts/deck2.json) and [panel.png](../examples/decks/windows-cutouts/panel.png). It sends no keyboard, mouse or integration actions. Import it only in the matching development server. Use **Save As** to give a personal copy independent deck/page/control identities.

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
    "BackgroundColor": "transparent",
    "Padding": 0,
    "FileResources": ["panel.png"],
    "AdditionalResources": {},
    "ControlBindings": []
  }
}
```

`X`, `Y`, `Width` and `Height` are ordinary whole grid cells. The control has no action events. `BackgroundImage` uses the existing resource ownership rules; `FileResources` records the referenced image. Do not add another interactive control over its footprint. This is a deck control, not a custom applet, and it does not add UDP Integration API messages.
