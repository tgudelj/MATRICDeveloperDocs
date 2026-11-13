# Plugin touch strip and rotary

**Experimental:** the **Plugin touch strip + rotary** applet represents one encoder channel: a touch display above a rotary, with one plugin action instance and one settings record. Place several containers beside each other for several channels. This follows Stream Deck+'s [dial and touch-strip model](https://docs.elgato.com/streamdeck/sdk/guides/dials/).

Use a MATRIC Desktop/client build that includes this applet. Earlier 2.9.19 installers may not include it. Windows native, Node and OpenAction action plugins still have the [ordinary compatibility limits](guide.md#know-the-compatibility-boundary); import success does not certify display or touch behavior.

[Download the applet](../examples/applets/matric-plugin-encoder.mapl) or inspect its [source files](../examples/applets/matric-plugin-encoder). The installer bundles the same applet. The default deck's **Applets** page includes an example with custom knob artwork and an empty plugin selection; copy the read-only deck before configuring it. Plugin binaries are a separate dependency.

## Configure one channel

1. Import the plugin through MATRIC's plugin manager.
2. Add a **Custom applet container** and select **Plugin touch strip + rotary**.
3. Under **Events and actions > Plugin action**, add **Stream Deck plugin container**, then choose an encoder-compatible action. Configure it once. The editor permits one plugin action in this event.
4. Adjust the applet properties, save the deck and load it on a connected client. Live feedback is rendered on the client; the editor provides the layout preview.

The applet sends rotation, center-button and touch input to this same saved occurrence. Separate applets or ordinary rotary event bindings create separate instances. They do not automatically share settings or plugin-local state. A plugin can refresh several instances from shared external state, such as Windows volume, but the protocol does not guarantee that synchronization.

The former touch-only applet is no longer distributed or given encoder routing. Existing controls are not migrated. Replace them manually if needed; the combined applet retains the ID `matric-plugin-encoder`.

## Applet properties and deck resources

| Parameter | Type | Default | Meaning |
| --- | --- | --- | --- |
| `KnobImage` | `image` | None | Idle artwork; the built-in knob is used when absent or unavailable |
| `KnobImageActive` | `image` | None | Artwork while dragging, holding the center, or briefly after a wheel/keyboard step; falls back to the idle artwork |
| `KnobSize` | `number` | `50` | Knob size as a percentage of applet width; range 10–100 |
| `KnobGap` | `number` | `4` | Minimum separation from the strip as a percentage of applet width; range 0–100 |

The layout reserves room for the diagonal of rotating artwork, centers the strip and knob, and scales the complete group down when the available height is insufficient. The requested size can therefore be reduced in a short container. Images retain their aspect ratio. A long rectangular image may leave unused space.

The editor's image picker stores a flat deck filename in `Config.AdditionalResources`, keyed by the parameter name. `AppletParams` holds the numeric values. On `PARAMSUPDATE`, MATRIC merges the resource entries into the parameter object as resolved, revision-aware deck URLs. For example:

```json
{
  "messageId": "PARAMSUPDATE",
  "payload": {
    "KnobSize": 50,
    "KnobGap": 4,
    "KnobImage": "http://matric-host:39728/decks/deck-id/knob.svg?v=revision",
    "KnobImageActive": "http://matric-host:39728/decks/deck-id/knob-active.svg?v=revision"
  }
}
```

These URLs are examples, not connection settings. Preserve resource keys and let MATRIC resolve filenames; do not save a server URL in place of a deck resource. Save, page/control copying, Save As and `.deck` export/import retain the images and remap colliding filenames. Applet files and plugin binaries are not embedded in a deck export; share/install those separately.

## Input contract

The manifest exposes one event, `input`, allowing `ActionStreamDeckContainer`. Its `Data` is one of:

```json
{"type":"dialRotate","ticks":1,"pressed":false}
```

```json
{"type":"dialDown"}
```

```json
{"type":"dialUp"}
```

```json
{"type":"touchTap","tapPos":[123,45],"hold":false}
```

Rotation is relative: `ticks` is exactly `1` or `-1`; `pressed` reports the applet's center-button state. Drag the outer knob, scroll the mouse wheel, or focus the knob and use the arrow keys. The center supports pointer input and Space/Enter. Repeated down/up notifications do not create duplicate transitions for the same source.

Touch coordinates are integers in the logical 200 × 100 display, with `0 <= x < 200` and `0 <= y < 100`. A short touch is sent on release. Holding for 500 ms sends `hold: true` once, without a second tap on release. Moving more than eight logical pixels, leaving the touch region or cancelling the pointer cancels a pending touch. The applet does not implement swipe navigation.

MATRIC emits the corresponding plugin `dialRotate`, `dialDown`, `dialUp` or `touchTap` event with the same action context, device position, current settings and resources. Elgato/OpenAction actions use wire controller `Encoder`; legacy Stream Dock actions declaring `Knob` retain `Knob` on the wire. Plugin reactions to tapping and holding remain plugin-specific; MATRIC does not convert a tap into a dial press.

Pointer cancellation, focus/page hiding, disabled interaction, view replacement, disconnect and context teardown release held input through the normal MATRIC lifecycle. Resume restores the latest display without replaying gestures. Multiple clients loading the same saved deck share its action instances; avoid simultaneous holds on the same action.

## Display feedback

Supported built-in layouts are `$X1`, `$A0`, `$A1`, `$B1`, `$B2` and `$C1`, selected initially from the action's `Encoder.layout` when present. The default is `$X1` for Encoder and `$A0` for legacy Knob. Each logical section is 200 × 100. This example selects an indicator layout and updates it:

```javascript
send({ event: 'setFeedbackLayout', context, payload: { layout: '$B1' } });
send({ event: 'setFeedback', context, payload: {
  title: 'Volume', value: '73%', indicator: { value: 73, bar_fill_c: '#00c8ce' }
} });
// Omitted items keep their previous values.
send({ event: 'setFeedback', context, payload: { value: '74%', indicator: 74 } });
```

Complete images can be supplied to the `$A0` layout's `full-canvas` pixmap. Legacy Knob `setImage` updates that full-surface image. Encoder `setImage` retains its software-icon semantics and is not used as a touch-surface image. `setTitle` updates the layout's title. Hardware-only and combined targets are accepted for Knob images; software-only images do not change the touch surface.

Fixed layout item geometry is retained. Supported feedback includes text and pixmap values, visibility, opacity, stacking order, text size/weight/alignment/color, and indicator values, ranges, colors and built-in subtypes. Unknown item keys are ignored; unsupported properties and invalid values are rejected. Custom layout files and arbitrary drawing instructions are not implemented and produce an explanatory display message. Trigger descriptions, continuous sliders, special hardware screens and full-device touchbar modes remain outside this applet's scope. Use static images; animated touch-strip rendering is not guaranteed.

The host decodes and validates package/data images before sending feedback to clients. Existing image limits and self-contained SVG restrictions apply. Image work is asynchronous and coalesced; stale work cannot overwrite a replacement layout or action context. The shared 64 MiB prepared-image cache and 8 MiB/8,192-entry image-work bounds also apply to touch feedback.

### Built-in host message

This applet also receives `TOUCHSTRIPUPDATE` from its actual parent. Its payload is `{display, enabled}`. A display has `version: 1`, `width: 200`, `height: 100`, the selected `layout`, and bounded `items` with keys, types, rectangles and values; an unsupported layout may supply `message`. `display: null` clears feedback. This is a reserved built-in channel, not a general permission for arbitrary applets to host plugin encoders. Changing the applet ID disables this routing. See the source for the renderer; ordinary applets should use the [general applet messages](../applets/reference.md#messages-from-matric).

### Logical device metadata

The default host device is named **MATRIC**, uses the SDK's Stream Deck+ type `7`, and advertises a 6 × 6 key grid with four encoder positions per bank. Larger saved decks receive additional logical banks rather than truncating their actions. The editor preview is separate. Each combined applet occupies one encoder position; input and feedback use its action context. Do not persist coordinates or runtime context IDs as durable identities.

## Volume Controller example and validation

Volume Controller **1.4.260325** was checked using an isolated copy of the unchanged Windows package. Choose **System volume controller** (`系统音量控制器`) for master volume. The plugin's **Show title** option changes its own presentation: enabled settings produced a device name and icon; disabling it produced a volume percentage, or an `X` when muted. MATRIC displays the plugin's output and does not invent a percentage. In these checks, images were 128 × 128; they are fitted without stretching into the logical strip section.

Master-volume rotation, center mute, generated images and refresh of another independent instance were checked. Original Windows volume/mute values were restored. Tap/hold wire routing was checked with a controlled backend; a native Volume Controller touch response is not certified. Different device selections or plugin versions can behave differently.

Browser checks cover actual pointer dragging, held rotation, wheel/keyboard input, tap/hold, disabled input, resizing, custom artwork and narrow/wide/tall layouts. Current native checks cover shared settings/context identity, restart recovery, stale work, retired controls without migration, image persistence and the default deck's Save As/export/reimport workflow. These checks do not certify every mobile client or every encoder plugin.
