# UDP API reference

## Transport and authorization

Send one UTF-8 JSON object per UDP datagram to `127.0.0.1:<Integration API port>`, normally `5300`. Receive using the same bound socket you send from. Server messages end with a newline; JSON parsers accept it as whitespace.

Use `sendto` and `recvfrom` rather than restricting incoming traffic to source port 5300: MATRIC creates separate sending sockets for replies and notifications. UDP provides no delivery, ordering or retry guarantee. Commands have no correlation ID or general success acknowledgement. Keep updates small, tolerate duplicates and use timeouts when waiting for a reply.

| Common field | Meaning |
| --- | --- |
| `command` | Command name below |
| `appName` | Stable application name shown in MATRIC's authorization UI |
| `appPIN` | PIN string issued by MATRIC when PIN checking is enabled |
| `clientId` | Destination device for client commands; omitted or `null` broadcasts to connected clients |

Send `CONNECT` without a PIN to begin authorization, then resend requests with the issued PIN. There is no PIN or CONNECT-success reply over UDP. The user approves locally; invalid credentials can open another authorization prompt. With PIN checking disabled, commands do not require a PIN.

For notifications, the server retains the first endpoint for a given application name and IP address. Keep a fixed local listening port. If you change it while MATRIC is running, notifications can still go to the old port; restart MATRIC to clear that runtime registration. `GETCONNECTEDCLIENTS` replies directly to the request's source endpoint.

## Commands

All examples below show fields to add to the common envelope.

| Command | Additional fields | Result |
| --- | --- | --- |
| `CONNECT` | None | Starts authorization or registers the endpoint |
| `GETCONNECTEDCLIENTS` | None | Replies with `ClientList` |
| `SETACTIVEPAGE` | `pageId` | Selects a page in the client's loaded deck |
| `SETDECK` | `deckId`, optional `pageId` | Loads a deck and optionally a page |
| `SETBUTTONPROPS` | `buttonId` or `buttonName`, `data` | Changes one matched control's visual properties |
| `SETBUTTONPROPSEX` | `data` array | Changes properties of multiple controls |
| `SETCONTROLSSTATE` | `data` array | Changes control runtime state |
| `SETVARIABLES` | `Variables` array | Adds or updates server variables |
| `SETBUTTONSVISUALSTATE` | `data` array | Legacy button state command; prefer `SETCONTROLSSTATE` |

Use a specific client ID when experimenting. `SETVARIABLES` is server-wide; `clientId` does not scope variables to a device. This command set does not enumerate decks/pages, edit action bindings, or provide a general action-execution command.

### Button properties

```json
{
  "command": "SETBUTTONPROPSEX",
  "appName": "Hobby status demo",
  "appPIN": "YOUR_PIN",
  "clientId": "YOUR_CLIENT_ID",
  "data": [
    { "buttonName": "Status", "text": "Ready", "backgroundcolorOff": "#164e3c" },
    { "buttonName": "Warning", "text": "", "imageOff": "" }
  ]
}
```

In `SETBUTTONPROPS`, properties go inside `data`. In `SETBUTTONPROPSEX`, each array entry contains its target and properties together.

| Property | Value |
| --- | --- |
| `text` | Label string |
| `textcolorOff`, `textcolorOn` | Normal and pressed text colors |
| `backgroundcolorOff`, `backgroundcolorOn` | Normal and pressed background colors |
| `imageOff`, `imageOn` | Image references understood by the client, such as deck image filenames |
| `halign` | `left`, `center`, `right` |
| `valign` | `top`, `mid`, `bottom` |
| `padding` | Numeric string; percent of grid cell size, clamped to 0–50 |
| `fontSize` | Numeric string as percent of grid cell size, or a size name below |

Size names `small`, `medium`, `large`, `xlarge`, `xxlarge`, `xxxlarge` map to 10, 15, 30, 40, 60, 80 percent. Invalid padding is ignored. Omit a property or send `null` to leave it unchanged. Empty strings clear `text`, `imageOff` and `imageOn`.

An ID takes precedence over a name when both are supplied. The single-property command updates the first name match; the batch command and state command update all name matches. Prefer unique names or IDs. Names are separate from the visible button text.

### Control state

```json
{
  "command": "SETCONTROLSSTATE",
  "appName": "Hobby status demo",
  "appPIN": "YOUR_PIN",
  "clientId": "YOUR_CLIENT_ID",
  "data": [
    { "controlName": "Status", "state": { "pressed": true } },
    { "controlName": "Level", "state": { "value": 50 } }
  ]
}
```

State is specific to the control type. Buttons accept `pressed` and `toggle` Booleans; sliders accept a numeric `value`. These updates do not simulate user gestures or execute the saved actions. Some controls defer a state update while the user is interacting.

The legacy `SETBUTTONSVISUALSTATE` uses entries such as `{"buttonName":"Status","state":"on"}` or `"off"`.

### Server variables

```json
{
  "command": "SETVARIABLES",
  "appName": "Hobby status demo",
  "appPIN": "YOUR_PIN",
  "Variables": [
    {
      "Name": "hobby_temperature",
      "Value": 23.5,
      "VariableType": "NUMBER",
      "IsPersistent": false,
      "IsUserEditable": false
    }
  ]
}
```

Types are `STRING`, `NUMBER`, `BOOL` and `JSONOBJECT`. Keep the JSON value consistent with its declared type. `Variables` and `variables` are both accepted. The example publishes temporary telemetry; set persistence and editability deliberately if you need another lifetime. Variables are shared across the server, so prefix their names.

## Server messages

The envelope uses **PascalCase** keys. `MessageData` is a JSON-encoded **string**, requiring a second parse.

```json
{
  "MessageType": "ClientList",
  "MessageData": "[{\"clientId\":\"device-1\",\"clientName\":\"My tablet\",\"currentDeckId\":null}]"
}
```

| `MessageType` | Decoded `MessageData` |
| --- | --- |
| `ClientList` | Array of clients with `clientId`, `clientName`, `IP`, `matricVersion`, and `currentDeckId` when available |
| `ControlInteraction` | Client message containing `MessageType`, `ClientInfo` and `MessageData` describing the interaction |
| `VariablesChange` | Object with `ChangedVariables` names and a `Variables` dictionary of variable definitions, each containing `Value` |

`currentDeckId` is device-reported, can be missing or null, and resets on reconnect. It is not proof that a deck has rendered. Request a fresh client list when needed; there is no dedicated client-list subscription command.

A decoded interaction looks like this; extra fields may be present:

```json
{
  "MessageType": "controlevent",
  "ClientInfo": { "clientId": "device-1", "clientName": "My tablet" },
  "MessageData": {
    "DeckId": "deck-id",
    "PageId": "page-id",
    "ControlId": "control-id",
    "ControlName": "Status",
    "EventName": "press",
    "Data": null
  }
}
```

Filter events by client, deck, control and event name before acting. The notifications are not filtered by the `clientId` in your last command.

Large `VariablesChange` notifications can be split into separate envelopes at variable boundaries. Merge dictionary entries rather than assuming one message replaces every server variable. A single oversized value is not further fragmented by MATRIC; avoid large payloads.

## C# examples and SDK

[MATRICIntegrationDemo](https://github.com/tgudelj/MATRICIntegrationDemo) provides runnable raw UDP and SDK examples with their own setup instructions. Use this reference for the message format and that project for the C# application walkthrough.

For an application using MATRIC alongside another data source, explore [DCS-BIOS-MATRIC-Middleware](https://github.com/tgudelj/DCS-BIOS-MATRIC-Middleware), which bridges DCS-BIOS cockpit state and commands.
