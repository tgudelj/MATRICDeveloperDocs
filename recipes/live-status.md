# Display external data in an applet

Combine UDP and an applet to build a small telemetry display. The external program owns the data; the applet owns its presentation.

1. Complete the [UDP quickstart](../udp/quickstart.md) and leave `status.py` running on the MATRIC PC.
2. Install the [Hello applet](../applets/quickstart.md) and set **Variable to display** to `hobby_temperature`.
3. Save and load that deck on a client. It should display `23.5`.
4. In your Python copy, replace `23.5` in `SETVARIABLES` with a value from a sensor, game or local service. Send another update when the value changes.

The route is:

```text
Sensor or game → Python → UDP SETVARIABLES → MATRIC server variable
                                           ↓
                           Applet VARIABLESUPDATE → displayed value
```

In the applet, the lookup is simply:

```javascript
const name = params.VariableToDisplay;
const value = variables[name];
output.textContent = value == null ? 'Waiting for value' : String(value);
```

Use `value == null`, rather than a truthiness check, so `0` and `false` remain visible. Render text with `textContent` rather than treating external data as HTML.

For the return path, an applet emits an event and the deck binds an appropriate action. Your UDP integration can observe the resulting `ControlInteraction` notification and filter its deck, control and event name. Emitting an applet event does not send an arbitrary UDP packet or call a desktop function directly.

For a display with no custom drawing, you can also bind a built-in control property to the server variable in the editor. Use an applet when you need your own layout or interaction.

## Calculate a built-in control property

Click the variable-binding button beside a control property, choose its trigger variable, and enter the body of `calculateValue(value, variables, resources)`. The trigger determines when the binding updates. `value` is its current value, `variables` contains current server-variable values, and `resources` contains this control's registered additional-resource filenames. Existing saved scripts and resource references keep the same contract.

The **Server variables** browser shows names, types and compact current-value previews. Search by name, JSON field path or type; expand objects/arrays, then click a variable or field name to insert a quoted-bracket reference at the code selection. Insertion does not select a different trigger. Undo/Redo supports inserted references, including resource expressions. **Hide variables** expands the JavaScript editor to the full dialog width; **Show variables** restores the panel, search and expanded branches while it stays open. On narrow windows the browser stacks below the code.

For example, select `light_status` as the trigger and insert its brightness field. A text property can use:

```javascript
const status = variables["light_status"];
return status && status.brightness != null ? String(status.brightness) + "%" : "Waiting for value";
```

**Test** evaluates locally and brings a scrollable result area into view. The returned type is shown beside **Result**. **JSON** view formats objects and valid JSON text; **Text** shows returned text literally, including HTML-looking characters. Formatting a JSON string does not change the calculation's return type. The Test log is plain text and appears only when messages are present. Test does not publish server variables, save the binding or invoke an MCP tool. Save applies the edited binding; Cancel preserves the saved one.

Large values stay bounded: the browser uses compact, collapsed object summaries and bounded field inspection; result previews retain at most 32,768 characters plus a truncation marker, inspect at most 50 entries per container, 1,000 nodes and depth eight, and shorten nested strings after 2,048 characters. Circular references receive a marker. Logs stop at 8,000 characters plus a shortening notice. These limits affect inspection only, not the actual returned value or saved script. Invalid JSON variables are reported in the tester log and supplied as null. Browser values reflect the latest received update; Test takes the values available when it runs.

## A real-world integration

[DCS-BIOS-MATRIC-Middleware](https://github.com/tgudelj/DCS-BIOS-MATRIC-Middleware) applies this idea to a flight simulator: cockpit state updates MATRIC indicators and displays, and MATRIC controls send commands back to DCS-BIOS. Its README explains the DCS-BIOS requirements and connection setup.
