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

## A real-world integration

[DCS-BIOS-MATRIC-Middleware](https://github.com/tgudelj/DCS-BIOS-MATRIC-Middleware) applies this idea to a flight simulator: cockpit state updates MATRIC indicators and displays, and MATRIC controls send commands back to DCS-BIOS. Its README explains the DCS-BIOS requirements and connection setup.
