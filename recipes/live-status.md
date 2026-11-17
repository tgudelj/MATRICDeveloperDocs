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

Click the **(x)** button beside a control property and enter the body of `calculateValue(value, variables, resources)`. **Trigger variable (optional)** may be left empty. The function then updates automatically when variables it reads change. A selected trigger additionally causes updates and supplies `value`; existing selections are preserved. Without an available trigger, `value` is undefined. `variables` contains current decoded server-variable values, and `resources` is the control's read-only additional-resource map. The symbol lights cyan for a saved binding, including an automatic binding without a trigger. Text/state and MCP parameter calculations share the editor layout, browser and **Test / Clear / Cancel / Save** actions; their inputs remain specific to each context.

Client property functions track actual reads through a JavaScript Proxy, replacing the former function-text substring heuristic. For example, leave the trigger empty and use:

```javascript
return variables["fuel_x_100_liters"]
     + variables["fuel_x_10_liters"]
     + variables["fuel_1_liter"];
```

Each of the three names becomes a dependency. An update to any one recalculates the total. All values in a received update batch are applied before each affected binding runs once. This does not make separate messages an atomic transaction. The client evaluates bindings on page initialization, including constant functions, and requests the current variables. See the [runnable fuel example](../examples/bindings/automatic-fuel.cjs).

Computed names such as `variables[variables.selected_tank]`, conditional branches and missing names are tracked. A successful evaluation replaces its dependency set; after a failure, previous and newly observed dependencies remain eligible so an input change can recover it. Tracking is at server-variable granularity: reading a JSON field subscribes to its whole variable. Enumerating the variable map requires a conservative subscription to all updates. Reads through `this`, globals, clocks or external state are not automatically tracked; use an explicit trigger for these. If Proxy is unavailable, the updated client conservatively recalculates on every received batch.

Dependencies and compiled functions live only in client memory, keyed by the binding. They are rebuilt when a page or deck is loaded and invalidated when the function, trigger or resource map changes. Deck JSON keeps the existing `PropertyPath`, `VariableName` and `Transform` fields; no dependency list or new mode is saved. `VariableName` is null or empty for automatic updates. Existing nonempty names still supply `value` and remain explicit triggers alongside discovered dependencies. When including user variables in an export, literal references can be discovered; variables reached only through computed names must be supplied on the receiving desktop. Trigger-free calculations require the updated editor/client; older editors can require a trigger and older clients only have their previous literal-name heuristic. Reopen the client after updating MATRIC Desktop to load the bundled client changes.

Client failures **never display errors, popups or notifications**. They retain the last displayed value, log silently with repeated identical failures suppressed, and do not stop other bindings. Logging failures are swallowed too. Return synchronously; promises and non-finite numeric outputs are rejected, with promise rejections consumed to avoid unhandled errors. Editor **Test** still displays diagnostics for troubleshooting. Only received variable batches or a view/configuration change cause reevaluation; the client does not poll on a timer or invoke an action because a visual binding changed.


The **Server variables** browser shows names, types and compact current-value previews. Search by name, JSON field path or type; expand objects/arrays, then click a variable or field name to insert a quoted-bracket reference at the code selection. Insertion does not select a different trigger. Undo/Redo supports inserted references, including resource expressions. The JavaScript editor, result and Test log share one column. **Hide variables** expands that whole column to the full dialog width; **Show variables** restores the panel, search and expanded branches while it stays open. On narrow windows the browser stacks below the code.

For example, select `light_status` as the trigger and insert its brightness field. A text property can use:

```javascript
const status = variables["light_status"];
return status && status.brightness != null ? String(status.brightness) + "%" : "Waiting for value";
```

**Test** evaluates locally and brings a scrollable result area into view. The returned type is shown beside **Result**. **JSON** view formats objects and valid JSON text; **Text** shows returned text literally, including HTML-looking characters. Formatting a JSON string does not change the calculation's return type. The Test log is plain text and appears only when messages are present. `console.log/info/warn/error` use the same compact format as MCP tests; objects and arrays use summaries. Errors keep preceding log messages and show no invented return value. An empty text/state function tests the trigger value directly. Clear removes the saved binding; Cancel or dismissing the dialog preserves it. Test does not publish server variables, save the binding or invoke an MCP tool. Save applies the edited binding; Cancel preserves the saved one.

Large values stay bounded: the browser uses compact, collapsed object summaries and bounded field inspection; result previews retain at most 32,768 characters plus a truncation marker, inspect at most 50 entries per container, 1,000 nodes and depth eight, and shorten nested strings after 2,048 characters. Circular references receive a marker. Logs stop at 6,000 characters plus a shortening notice, with at most 1,000 characters and 20 arguments per entry. These limits affect inspection only, not the actual returned value or saved script. Invalid JSON variables are reported in the tester log and supplied as null. Missing trigger values are undefined. Browser values reflect the latest received update; Test takes the values available when it runs.

## HTTP response variables

In **Execute HTTP request > Return values**, enable **Publish returned text** and/or **Publish response as JSON**. Each option reveals a prefilled, editable name and suggestions for existing server variables. A generated name uses the stable action identity (`http_<identity>_text` or `http_<identity>_json`). Names accept 1-200 ASCII letters, digits or underscores and must start with a letter or underscore.

Text is the unchanged response body. JSON is parsed regardless of Content-Type, preserving objects, arrays, strings, numbers, booleans and null. For a body such as `{"power":"on","volume":35}`, publish JSON to `tv_status` and use `return variables["tv_status"].volume;` in a control calculation. HTTP actions can reuse the same name with the same type; the last completed request supplies the value. Text and JSON outputs need different names. Integration-owned variables, calculated variables and incompatible existing types are protected.

Actual HTTP responses, including 4xx/5xx bodies, are eligible. Network/request calculation failures retain both previous values; malformed or empty JSON retains the JSON value while text can still update. Failures are logged without client popups and do not suspend future requests. New output variables are runtime values shared with clients/integrations. Reusing an existing ordinary variable preserves its persistence and editability settings.

**Edit & Test > Run** sends the request and displays its body in Text or JSON view, but never publishes outputs. A JSON publication error is shown in the tester. Display formatting does not change the published type. Run no longer updates the legacy automatic response variables either; use a normal control action when testing bindings that depend on published values. New publication flags default to false. Existing `exec_http_<control-name-or-id>_success`, `_response_code` and `_response` variables retain their previous behavior. Existing HTTP bindings continue to work. Older MATRIC versions ignore the new publication settings and still execute requests. Deck exports include output configuration and names. New runtime output variables are not exported as user variables; an existing persistent user variable reused as an output retains its usual export behavior. Cloning/Save As separates generated identities and retains explicitly chosen shared names.

## A real-world integration

[DCS-BIOS-MATRIC-Middleware](https://github.com/tgudelj/DCS-BIOS-MATRIC-Middleware) applies this idea to a flight simulator: cockpit state updates MATRIC indicators and displays, and MATRIC controls send commands back to DCS-BIOS. Its README explains the DCS-BIOS requirements and connection setup.
