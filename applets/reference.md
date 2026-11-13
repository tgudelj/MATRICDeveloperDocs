# Custom applet reference

## Files and execution

An applet has `manifest.json` and `applet.html` beside each other. Include scripts, styles, images and fonts beneath that folder and use relative URLs. Files are installed on the server and served to each client; JavaScript executes in the client's embedded browser, not as a desktop process.

Each container loads its own iframe. MATRIC appends the **control ID** as the URL fragment, available through `location.hash.slice(1)`. Do not confuse this with `AppletId`, which identifies the installed applet package.

Use responsive CSS, pointer events and browser APIs supported by your target clients. Applets can run scripts and forms in the iframe. Use configured MATRIC actions for desktop work; an applet has no direct access to Windows processes. Browser permissions, iframe policy and client capabilities still apply. **Allowed features** configures the iframe's browser feature policy; it does not grant Windows process access.

See [Size and lay out an applet](layout.md) for container dimensions, aspect ratios, scaling, scrolling and a responsive HTML example. MATRIC fits the iframe to the control; your code is responsible for fitting its contents.

## Manifest

| Field | Purpose |
| --- | --- |
| `AppletId` | Stable ID and installed folder name; 1–128 letters, digits, hyphens or underscores, excluding Windows reserved names |
| `DisplayName`, `Description`, `Author` | Metadata shown to users |
| `VersionMajor`, `VersionMinor` | Nonnegative integer version components |
| `AppletParams` | Array of parameter definitions |
| `EventsDefinition` | Array of events users can bind to actions |

Use unique, nonempty `Name` values within each array. Manifests are limited to 1 MiB. Omitted or null top-level parameter/event arrays are accepted as empty; write explicit arrays in new applets.

### Parameters

Each parameter has `Name`, `DisplayName`, `ParamType` and `Default`. Supported types are:

| `ParamType` | Value delivered to the applet |
| --- | --- |
| `string` | Text |
| `number` | Number; validate it before arithmetic |
| `bool` | Boolean |
| `color` | CSS color string |
| `variable` | Server variable name, not its value |
| `list` | Selected string `Value` from `ListItems` |
| `image` | A resolved deck-resource URL; the editor presents MATRIC's image picker |

```json
{
  "Name": "Units",
  "DisplayName": "Units",
  "ParamType": "list",
  "Default": "celsius",
  "ListItems": [
    { "Text": "Celsius", "Value": "celsius" },
    { "Text": "Fahrenheit", "Value": "fahrenheit" }
  ]
}
```

Parameters are saved per container. Same-ID updates preserve existing values and add defaults for new parameters. Changing a default does not overwrite a user's saved value.

Numeric parameters can declare optional finite `Minimum` and `Maximum` values. The editor applies these as bounds and validation messages; the minimum must not exceed the maximum. Validate/clamp inputs inside the applet as well, including missing or older saved values.

```json
{"Name":"KnobSize","DisplayName":"Knob size","ParamType":"number","Default":50,"Minimum":10,"Maximum":100}
```

For an `image` parameter, use `Default: null`. The chosen filename is saved in the custom control's `Config.AdditionalResources` under the parameter's `Name`, not as an opaque string inside `AppletParams`. MATRIC resolves these resource entries to revision-aware URLs and merges them into `PARAMSUPDATE`, overriding a same-named ordinary parameter. Clearing an image removes its resource entry, so handle an absent URL. Custom controls participate in the ordinary resource lifecycle: copying, Save As and deck export/import retain files and remap filename collisions while preserving parameter keys. Selecting a different applet clears the prior applet's parameters, image resources and event actions. See the [combined encoder](../stream-deck/encoder-applet.md#applet-properties-and-deck-resources) for a complete example.

### Events

```json
{
  "Name": "level",
  "DisplayName": "Level changed",
  "AllowedActions": ["ActionMixerVolume", "ActionOBSVolume", "ActionVJoyAxis"]
}
```

`AllowedActions` chooses which action types the editor offers; it does not bind an action automatically. Short names and full `EXM.MatricPro.Actions.*` names are accepted. Unknown action names are not offered. The deck author must add and configure an action for your event.

## Messages from MATRIC

Listen to `window`'s `message` event. Accept only `event.source === window.parent` and validate the message and payload before use. The payloads are JavaScript objects, not JSON strings.

| `messageId` | `payload` |
| --- | --- |
| `PARAMSUPDATE` | Container parameters, such as `{VariableToDisplay: "hobby_temperature"}` |
| `VARIABLESUPDATE` | Dictionary of values, such as `{hobby_temperature: 23.5}` |
| `RESIZE` | `{containerWidth, containerHeight, environment}`; pixel dimensions and `editor` or `client` provided by current MATRIC versions |

Setup messages repeat and may arrive in either order. Store the latest parameters and variables, render after either changes, and handle missing values. Applet variable payloads contain **values**, whereas UDP variable notifications contain **definitions with a `Value` field**.

MATRIC supplies cached state and requests a refresh on load and resume. Do not use a fixed startup delay. Request state after installing your listener:

```javascript
emitEvent('reqvariables', null);
```

The example's `emitEvent` helper is your own function around `postMessage`, not a global MATRIC SDK function.

### Optional variable filtering

To request only the variables your applet needs, send:

```javascript
emitEvent('reqvariables', {
  variablePrefixes: ['hobby_'],
  revisionVariable: 'hobby_revision'
});
```

At most 16 nonempty prefixes are retained. Each request replaces the subscription. Omit `variablePrefixes` or send `null` for the full dictionary; an empty array selects no keys. Received payloads are filtered snapshots, not deltas.

Only set `revisionVariable` if your producer changes it whenever any selected value changes; otherwise updates can be suppressed. Include its prefix if you also need the revision value. Older client versions may ignore these optional fields and deliver the full dictionary. Reissue subscriptions after a new iframe load and continue to filter defensively.

## Messages to MATRIC

```javascript
const controlId = location.hash.slice(1);
parent.postMessage({
  messageId: 'cce-' + controlId,
  payload: { EventName: 'level', Data: { value: 50 } }
}, '*');
```

MATRIC matches the iframe, control ID and event. `EventName` must exactly match the event and saved binding. Interaction requires an active client view and enabled applet interaction; the editor preview does not execute it. Use the parent's observed origin for subsequent sends when available, as the example does.

| Bound action | Event `Data` |
| --- | --- |
| `ActionText` | `null`; text comes from saved configuration |
| `ActionMouseAxis`, `ActionMixerVolume`, `ActionOBSVolume`, `ActionVJoyAxis` | `{value: 50}` with an integer from 0 to 100 |
| `ActionVJoy2Axis` | `{horizontal: 50, vertical: 50}`, both 0–100 |

These are examples, not a universal payload for every action. For audio device/session discovery and mute requests, use the bundled mixer as the working reference.

### Release held input

A hotkey or vJoy hold needs an end event. For a custom `hold` event, send `hold-release` on pointer release or cancellation. The suffix needs no separate manifest event or action binding. The conventional `press`/`release` pair is also supported.

Capture the pointer when a gesture begins, and release on `pointerup`, `pointercancel`, lost capture and focus loss. Use simple ordinary event names without the reserved `-release` suffix. A click alone is not a complete held-input gesture.

Current MATRIC versions cancel held input on view changes, reload, disabled interaction and disconnect/timeout. Still pair your own gestures correctly, including on older clients. Release local state on page hiding and do not replay an ended gesture after resume.

## Package and share

Zip the files into a **`.mapl`** file, with `manifest.json` and `applet.html` at the archive root or together inside one immediate folder. On Windows, for the example:

```powershell
Compress-Archive -Path .\hello-applet\* -DestinationPath .\hello-applet.zip
Move-Item .\hello-applet.zip .\hello-applet.mapl
```

Double-click the package on the MATRIC PC to import it. Limits are 4096 entries, 128 MiB expanded content, path depth 16, and 1 MiB manifest metadata. Absolute/traversal paths, symlinks, duplicate paths and invalid Windows filenames are rejected.

Importing the same ID **replaces the whole installed folder**, without merging files or rejecting an older version. Back up the existing package before testing an update.

Applet files are **not included in a `.deck` export**. Share the `.mapl` dependency and installation instructions with the deck. Server variables and external services needed by the applet must also be available on the destination PC.
