# MCP tools from MATRIC controls

MATRIC can act as an MCP client: a button, slider or applet event invokes a tool on a configured Model Context Protocol server. The server runs separately, while MATRIC Desktop owns the connection and executes calls. No AI model or Stream Deck plugin is required.

This feature requires a MATRIC Desktop build with **Settings > MCP Connections**. Older builds cannot execute MCP actions. Use the bundled client from the matching desktop build for page visibility cancellation.

## Run a small server

The [standalone example](../examples/mcp/server.cjs) needs Node.js 20 or later and no additional packages. Download it, then run:

```sh
node server.cjs
```

It listens on `http://127.0.0.1:13509/mcp` and keeps a synthetic value in memory. Its `get_value` tool reads that value; `set_value` accepts a number from 0 to 1. It controls no devices and writes no files. Restarting resets the value. Stop it with Ctrl+C. You can also run `node server.cjs --stdio` and configure Node's installed executable plus the script's absolute path in a Stdio connection.

## Add a connection

1. Open **Settings > MCP Connections > Add connection**.
2. Name it `Local MCP example`, select `StreamableHttp`, and enter `http://127.0.0.1:13509/mcp`.
3. Click **Save connection**, then **Connect**.
4. Choose **Tools** and inspect both tool schemas.

Saving and discovery never invoke tools. New profiles are enabled; automatic connection on startup is off. Defaults are a 10-second connect timeout, 30-second call timeout and four concurrent calls per profile. Startup connection performs discovery only.

For a real server, use its configured endpoint. HTTP on another machine requires the explicit **Allow insecure HTTP for a remote server** option; use HTTPS when possible. Bearer tokens sent over HTTP are visible to the network. A URL cannot include user information, query strings or fragments. Redirects and invalid TLS certificates are rejected.

**Automatic browser sign-in** is the default. Click **Connect**; if authorization is required, MATRIC discovers the server’s OAuth endpoints and opens its login page in your browser. Enter your username/password and any extra verification there, approve access and return to MATRIC. MATRIC protects the resulting access and refresh tokens for your Windows account and can refresh them after restart. It never reads your login password. This flow is generic OAuth authorization code with PKCE; Home Assistant’s `/api/mcp` supports browser sign-in without manually creating a token.

The connection list shows **Name**, **Status** and **Actions**. One button changes from **Connect** to **Disconnect**. During login it becomes **Cancel sign-in**. Closing MCP Connections cancels its pending login too; an unattended sign-in expires after five minutes. Connecting and signing in only discover tools. Disconnect retains your protected authorization for reconnect. Startup, previews and action execution can reuse/refresh existing credentials, but never open a browser: fresh authorization must start from Connect in Settings.

**Advanced authentication** offers:

- **Automatic browser sign-in**: normal default. Optional OAuth client ID and HTTPS client metadata URL cover servers requiring a pre-registered or published client identity. Dynamic registration is used when supported. Server login and token URLs are discovered automatically; you do not configure those separately. Registration requirements differ between servers, so automatic setup is not universal.
- **Manual bearer token**: for a server-issued token. Paste it into the protected password field. Blank retains the stored token; **Clear configured token** removes it. Earlier configured bearer profiles retain manual mode when upgraded.
- **None**: send no application authentication credentials.

After a 401, use Connect to sign in or review the selected advanced mode. A 403 indicates denied access or insufficient permissions; check the server account and allowed tools. **Forget sign-in** removes local OAuth credentials while keeping the connection profile. For server-side revocation, remove MATRIC’s authorization in the server’s account settings. Editing the endpoint, authentication mode or client registration invalidates cached authorization. Deck exports and imported deck files never contain OAuth credentials.

Stdio starts an already installed `.exe` directly. Supply an absolute executable path, a JSON array of argument strings, an optional absolute working directory and optional environment overrides as a JSON object of strings. MATRIC supplies a small standard OS environment plus your overrides. It runs no shell and installs no packages. Disconnect closes the child it started; disconnecting HTTP leaves the independent server running.

Tokens and environment overrides are protected for the current Windows account and are never read back into the editor. Profiles and local mappings stay on the PC. Editing a profile retires its previous session and pending inputs; explicitly trigger new work after the change.

## Configure an action

Create a disposable deck and add **MCP** to a button's press event. Select `Local MCP example`. If its profile is already connected, opening the action automatically loads the tools through the shared catalog cache. Reopening the action checks the current connection status again. The small icon beside **Tool** (tooltip **Refresh list**) forces discovery when needed. Choose `get_value`. Opening the action never invokes a tool or starts browser sign-in. The Tool dropdown is sorted alphabetically by displayed name. Type part of a title or tool identifier to filter the list, ignoring case, then select a match with the mouse or keyboard. Searching alone neither changes the configured tool nor performs discovery or invocation. Leave arguments empty. Under **Preview arguments and run test**, use **Preview arguments** first, then **Run test** to perform the read.

Argument preview resolves values locally and makes no network call. Run test invokes the selected tool and may change the server's application. A test has a separate cancellation identity and does not publish to the saved action's variables. Closing the inspector cancels its test. Cancellation cannot undo a call already executed by the server.

To test without a deck, open **Settings > MCP Connections > Tools** and expand a tool. **Input and output schema** starts collapsed; expand it to view and copy the server's reference. **Test tool** starts expanded. Enter direct arguments as a JSON object, such as `{}` for no arguments or `{"value": 0.5}` for the example setter, then click **Run test**. Inspect the result as **JSON** or **Text**. Hover a tool title for its description; close with the title's X or the footer's Close button.

Invalid JSON and non-object arguments are rejected locally; the complete tool schema is checked before invocation. Tests never save actions or publish live variables. Collapsing the schema or Test tool section preserves drafts/results and leaves an active call running. Closing Tools, switching tools or collapsing the outer tool requests cancellation and ignores late responses; cancellation cannot undo server effects. Draft arguments remain available while the catalog dialog is open.

After a tool test in either screen, **Display result as** defaults to **JSON**, showing the full normalized envelope including status, errors and structured data. **Text** shows returned text, with structured data as a fallback if no text is available. Returned markup is displayed literally. Switching views performs no network call and does not change publication settings. Images, audio and resource content are not rendered.

Arguments preserve JSON types. Fixed `false`, `0`, `null`, `""`, an omitted property and an unavailable source have different meanings. Unused optional arguments collapse to their checkbox, name and description. Click the name or checkbox to include the parameter and reveal its inputs; unchecking removes its fixed value and calculated bindings from the invocation. Re-enabling restores the draft during the same editor session. Excluded drafts are not persisted in the deck. Required parameters stay expanded. A literal string does not interpolate variables.

The editor derives accepted formats from the advertised schema, including `anyOf`, `oneOf`, type arrays and supported local references. A **Value format** selector distinguishes alternatives such as Text and List of text. Enter plain text without JSON quotes; lists of text have Add item/Remove controls. Objects and complex lists retain a JSON editor. An unspecified schema starts in JSON mode and also lets the user select a value format manually; these choices are editing aids, not inferred server restrictions. A permissive schema is not interpreted as a specific type merely from its description. Relevant bounds and server examples appear as hints; the native validator still checks the complete original schema. Invalid JSON prevents argument Preview and Run test until corrected.

**Advanced parameter values** exposes the saved fixed JSON object behind the normal parameter controls, for nested or other complex literal data. For example, a fixed domain produces `{"domain":"light"}`; `{}` means no fixed values are configured. Calculated arguments are applied afterward and override a literal at the same target. Their `ArgumentBindings` representation is managed by the function editor and is no longer exposed as a raw array editor; existing saved bindings still execute unchanged. The separate read-only schema block describes the server's types, required fields and constraints and is never submitted as argument data. Both scrollbar and wheel scrolling are supported without dragging the containing action.

Enter a fixed value directly, or click the **(x)** binding button to the right of the parameter input to open the calculation editor. The symbol lights cyan when a saved binding is active; a calculated input displays **Calculated value** instead of an editable fixed value. Click the lit symbol to edit it. The editor shares its layout, variable browser, Test/result/log display and **Test / Clear / Cancel / Save** actions with text and state bindings. Enter the body of `function calculateValue(value, variables, eventData)`. `value` is `eventData.value` when that property exists (including false, zero and null); otherwise it is the entire event payload. `variables` contains typed server-variable values, with JSONOBJECT values decoded as JSON. `eventData` is the complete event payload. For example, `return variables["desired_target"];` reads a server variable.

For the example server, this function body converts a slider from 0–100 to 0–1:

```js
return Math.max(0, Math.min(1, value / 100));
```

Return a JavaScript value of the advertised parameter type. The editor shows type-specific syntax guidance. For a Boolean parameter such as `enable`, use `return true;` or `return false;` without quotes; `return "true";` returns Text and is rejected. Use a quoted string for a text parameter, an object for an object parameter, or an array for a list parameter. Do not call `JSON.stringify` unless the parameter expects text.

Click **Test** in the function editor to evaluate locally using your test event JSON and the current server variables. The result shows its actual returned type and value, including `false`, zero and null. A type mismatch leaves that value visible alongside an error explaining the expected type; an execution failure shows the error without inventing a returned value. Undefined is shown explicitly and can omit an optional argument. Text/JSON views use a bounded literal preview rather than displaying the internal result wrapper. Results retain at most 32,768 characters plus a shortening marker, 50 entries per container, 1,000 nodes and depth eight; nested strings are summarized after 2,048 characters. It never discovers or invokes tools and does not change live result variables. **Save** applies the function; **Cancel**, Escape or dismissing the dialog preserves the saved binding. **Clear** removes the binding and restores the previous fixed value, or the schema default if no fixed value exists. New drafts use the fixed value when its source fits within 4,096 characters, otherwise `return value;`. The lit **(x)** button reopens the function. The optional-argument undefined policy is staged in the dialog and is applied on Save. Whole-argument Preview also validates cross-property rules and the full tool input schema. The [runnable calculation example](../examples/mcp/calculations.cjs) uses the same slider function: run `node calculations.cjs` to see sample values.

The **Server variables** browser beside the function editor uses the variable updates already received by MATRIC. Search by variable name, JSON field/path or type. Each row shows its type and a compact current-value preview. Expand an object or array to inspect fields; clicking a name inserts a reference at the cursor, replacing selected text. Keyboard activation works too. References use quoted brackets, such as `variables["light_status"]["brightness"]` or `variables["light_status"]["lights"][0]["name"]`, so spaces, quotes and numeric object keys remain unambiguous. The browser inserts references rather than copying literal values. Undo/Redo work through the editor history.

**Hide variables** gives the editor, test-event input, result and Test log the full dialog width; **Show variables** restores the panel. Hiding preserves the current script, cursor, search and expanded branches while the dialog stays open. On narrow windows the visible browser stacks below the editor. The same browser is available when testing a tool from MCP Connections. Text/state property bindings can leave their trigger empty and use automatic variable dependencies; see [automatic property updates](../recipes/live-status.md#calculate-a-built-in-control-property). MCP argument functions continue to run on their button/slider event, without subscriptions that would invoke tools on variable changes.

Large JSON is never rendered in full. Objects start collapsed, scalar previews use at most 120 characters, browsing shows up to 50 children per node, and the panel renders at most 250 rows to a depth of eight. Search inspects at most 2,000 nodes and can find fields beyond the first 50 children. JSON text over 262,144 characters is not parsed; a pass parses at most 1,048,576 characters in total. Very long field names (over 512 characters) are skipped. The browser indicates inspection limits; whole-variable insertion remains available. Invalid JSON text is shown as unavailable JSON with the explanation that calculations receive null. These UI inspection limits do not alter saved values or runtime input limits.

Browser values reflect the latest received update, not a frozen future execution value. Test takes its own current snapshot, and control events freeze their inputs at admission. Browsing, searching, expanding and inserting do not invoke a tool or change live variables. Literal variable references inside saved scripts remain unchanged on copy/Save As and travel with exported decks, so recipients must provide the corresponding variables.

For example, after inserting the brightness field, a numeric argument can use:

```javascript
return Math.max(0, Math.min(1, variables["light_status"]["brightness"] / 100));
```

The runnable calculation example includes this variable-based function with a sample input.

The saved binding for this function is:

```json
{
  "TargetPointer": "/value",
  "Source": "Calculated",
  "Calculation": "return Math.max(0, Math.min(1, value / 100));",
  "ExpectedType": "number",
  "OnMissing": "Fail"
}
```

Functions return synchronous JSON values. There is no implicit type coercion: use `Math.round` for an integer result when needed. Root `undefined` fails by default; `OnMissing: "Omit"` removes the target object property. Explicit null remains a value. Promises, nonfinite numbers, functions, circular data and undefined nested values are rejected. Function bodies are limited to 16 KiB, with a two-second total script budget per argument build, a 64 MiB monitored runtime heap and 64 KiB output/argument bounds. No host objects, filesystem or network APIs are exposed. Event data and server-variable snapshots are independent JSON copies; modifying them in a function cannot change MATRIC variables. Event payloads are bounded to 64 KiB and calculation-visible variable snapshots to 256 KiB. Oversized input is rejected rather than silently truncated.

`console.log`, `console.info`, `console.warn` and `console.error` are local test diagnostics. The Test log renders literal text, with up to 6,000 characters plus a shortening notice, at most 1,000 characters per entry and 20 arguments per entry. Objects and arrays use compact summaries instead of dumping their contents. A preceding log remains visible if the function throws. Console calls do not publish variables, contact the server or change runtime arguments; logging is discarded during ordinary action execution.

Invalid JSON and server-variable values containing non-finite numbers are supplied as null in independent snapshots, leaving their producer values unchanged. An unrelated NaN or Infinity cannot prevent a constant Boolean function from running. The tester identifies non-finite inputs in its log, with at most ten variable warnings. Returning a non-finite number from the function itself still fails. Snapshot size/depth limits continue to apply.

At control-event admission MATRIC freezes event data and server-variable values. Later variable changes do not alter queued calculations. Latest value coalesces pending inputs before evaluating their functions, so discarded pending values do not each run a script.

Existing EventData, Variable and Context bindings retain their saved semantics. Their input displays **Saved data binding** with a lit symbol and replacement guidance. Clicking the symbol drafts a function, including existing pointer/scaling/rounding behavior; the saved binding changes only on Save or Clear. Cancel leaves it intact. Clear restores fixed input. Calculations do not expose the former Context metadata. Advanced JSON retains compatibility with the saved contracts and supports nested argument targets. JSON Pointer escapes `~` as `~0` and `/` as `~1`; targets must not overlap. Omission applies to object properties, not array elements. Literal variable names inside function bodies are not remapped when copying controls or using Save As.

Resolved arguments must satisfy the discovered input schema before a call can be sent. Local JSON Pointer schema references work; external, named-anchor and recursive references are rejected. Regex validation has a finite deadline.

MATRIC saves the accepted input and output schemas with the action. If discovery reports a change, review it and choose **Use refreshed contract**. A call will not silently accept an incompatible tool contract.

## Set slider execution behavior

Calls are asynchronous: later MATRIC actions continue immediately. There is no wait-for-result mode. The UI labels these limits **Waiting command expiry** (five seconds) and **Response timeout** (30 seconds), with values shown in seconds. The former discards a command that waits too long before sending; the latter limits waiting for completion. Neither delays later actions. Saved `QueueMaxAgeMs`, `CallTimeoutMs` and `MinIntervalMs` remain integer milliseconds for compatibility.

| Policy | Use it for | Behavior |
| --- | --- | --- |
| Ignore extra commands (`IgnoreWhileBusy`) | Discrete commands where repeat taps should be ignored | Suppresses another trigger while the saved action is waiting or running |
| Send commands in order (`Ordered`) | Relative steps and meaningful transitions | Preserves accepted order in a bounded queue |
| Keep the latest slider value (`LatestValue`) | Absolute setters such as volume or brightness | Replaces pending intermediate values and retains one trailing final value |

For one call on release, enable the slider's **Send value after interaction end** and use Ordered or Ignore while busy. For live absolute updates, disable that setting and use Latest value. The UI shows **Minimum time between calls (seconds)**, default 0.2 with a 0.1 minimum. Values remain subject to validation, expiry and cancellation.

Auto-reset produces the selected value followed by the default value. Enable send-after-interaction and use Ordered to preserve both. Latest value is rejected for auto-reset sliders and rotary controls. Do not coalesce toggles, relative steps, screenshots or other commands where each input matters. Result-driven control updates do not emit another slider input.

The same saved action shares one execution lane across clients, with at most one call running. Hiding the client, replacing its deck/page or disconnecting discards that view's inputs. Other clients' inputs remain. Capacity is bounded: 32 profiles, 16 global concurrent calls, up to 16 calls per profile, 64 pending items per action, 256 pending work items and 8 MiB queued argument data globally. Input admission has separate per-origin and global bounds. Rejections are visible rather than silently growing queues.

## Consume results

Enable **Publish returned text to server variables** or **Publish full structured output to server variables**. Each reveals a name input prefilled with its generated default. Type to filter autocomplete suggestions for existing variable names, choose a suggestion, or enter a new name. Publication defaults to off; settings and action tests never publish live variables.

Default names use the stable occurrence prefix `mcp_d<deck ID without hyphens>_a<action instance ID without hyphens>` plus `_text` or `_data`. The text variable is STRING; structured output is JSONOBJECT. The latter contains the tool's `structuredContent`, not its entire normalized result envelope, and is null for text-only responses. A failed completed call clears unavailable output. Starting a call, refreshing status, or registering an additional producer preserves the last value. These variables are read-only and nonpersistent and use the existing [applet variable updates](../applets/reference.md) and control property bindings.

The portable action properties are:

```json
{
  "PublishText": true,
  "TextVariableName": "example_text",
  "PublishStructuredData": true,
  "StructuredDataVariableName": "example_data"
}
```

Null or absent name properties retain generated defaults. An explicit name must contain 1–200 ASCII letters, digits or underscores and start with a letter or underscore. Names are case-sensitive. Text and structured output need distinct names. Multiple MCP actions may publish to the same name when their output types match. The last completed call updates the shared value; a failed call clears it. A text output and structured output cannot share a name because their types differ. Existing ordinary variables and variables owned by other sources remain protected. Renaming, disabling publication or deleting one producer preserves a shared value while another producer remains; removing its last producer or shutting down clears and releases it. Changing a display name does not create a new action identity.

Default variable names change with copied action/deck identities. Explicit custom names are preserved across copy/Save As and intentionally share the original output when types match; rename them if separate values are wanted. Names derived from a generated prefix and typed references to them are remapped during copying. Literal names inside function bodies are never rewritten.

Only explicitly enabled outputs create server variables. Automatic `_result`, `_status`, `_busy`, `_success`, `_pending_count` and `_sequence` diagnostics are no longer published. Existing bindings or integrations using those names must move to an explicitly published output where appropriate. The action properties do not display saved-action status notifications or poll execution status. Settings/tool tests and **Preview arguments and run test** retain their explicit result inspection. There is no replacement broadcast status-variable contract. Existing saved `ResultMappings` and `_field_<key>` variables remain supported for compatibility, but the action editor no longer creates or edits them. No new UDP message is required. Prefer the full structured-output variable and calculated bindings for new setups.

MCP `isError` is failure even when HTTP returned 200. A text-only call can succeed without structured data. Omitted and null `outputSchema` both mean no structured-output schema and are equivalent when checking a saved tool contract. Genuine changes to inputs or a declared output schema still require review. Saved-action diagnostics retain returned text and structured data only when the corresponding publication option is enabled; an explicit test can inspect its own returned output. Select outputs deliberately: published variables are shared with clients, applets and authorized integrations.

Timeouts, protocol errors and other failures end that attempt without suspending the action. Later taps and already queued commands may run, subject to their normal policy, expiry, configuration validation and origin lifetime. If a dispatched call times out or is cancelled without a conclusive reply, its local diagnostic has `outcomeUnknown: true`: the command may have run. The status display explains this in plain language. MATRIC does not automatically retry the failed command, and cancellation cannot roll back a remote effect. A received JSON-RPC rejection is reported as `protocol_error` with `outcomeUnknown: false` and leaves a healthy connection ready. Transport failures retain bounded reconnect backoff; a later request waits for that delay within its timeout, without replaying the failed call. Read-only annotations remain advisory.

## Share and troubleshoot

Decks containing MCP actions require an MCP-enabled MATRIC importer. Opening a `.deck` file in Windows uses the registered installed executable. Running a newer build from another folder does not change that association; an older installed copy cannot recognize MCP actions. Install the matching MCP-enabled build before importing shared decks. For testing a separate build, invoke that build directly from its folder in PowerShell:

```powershell
& ".\MatricServer.exe" -i "C:\Decks\example.deck"
```

This imports into the normal local library and retains the explicit connection-mapping requirement. It does not change Windows file associations.

Save/reopen retains action IDs. Copying controls/pages and Save As generate independent action IDs and remap typed result references within copied controls. Free-form script strings are not rewritten. Save As on the same PC retains explicit local mappings. Exported decks contain action settings, tool contracts and portable requirements, without endpoints, executable profiles or credentials. After import, MATRIC asks you to map each required connection to a profile configured on this PC. Select profiles and click **Apply mappings**. Each row applies to all actions sharing its connection key, across every page and control. A deck requiring several connections shows a separate row for each; matching display names do not combine distinct keys. No profile is chosen automatically.

**Configure later** leaves the deck imported and remembers the dismissal for this import. Unmapped actions cannot execute. Finish setup, change connections or clear a mapping under **Deck properties > MCP connections**. Mapping only saves local permissions: it does not connect, open browser sign-in, discover tools or invoke them. Use **Manage connections** to create a profile, then **Refresh** to select it. Profiles and authorizations remain in **Settings > MCP Connections**.

Mappings and review dismissals are local to the installed deck revision. Reimporting or replacing a deck requires a fresh review, even when its deck ID is unchanged. Pending setup is also offered for an unresolved imported deck when the editor starts, so importing while MATRIC is closed is covered. Existing unresolved imports may prompt once when first using this version. Changing a shared mapping cancels pending work for its affected actions; it does not replay commands. Clearing a mapping leaves other connection keys intact. A stale setup form cannot authorize a replacement import.

This version supports tool discovery and calls over Streamable HTTP and stdio, including older initialization negotiation on those transports. Legacy HTTP/SSE-only transport, resources/prompts, server-requested sampling, interactive elicitation and task workflows are excluded. Text is displayed as text. Images, audio and resource content are not rendered. Catalog, JSON size/depth and response limits reject excessive payloads. Use a read-only status tool to verify a real connection before configuring effects.

To test this example from the documentation checkout:

```sh
node --test tests/mcp-example.test.cjs
```


The portable references retain their existing shape:

```json
{
  "McpConnectionRequirements": [
    {"Key": "overlay", "Name": "NVIDIA Overlay", "Tools": ["nvapp_overlay_get_status"]}
  ]
}
```

Every action using that requirement retains `"ConnectionKey": "overlay"` and its `ConnectionName`, `ToolName` and `ToolSchemaSnapshot`. Selecting a local profile does not rewrite these action fields or add its profile ID, address or credentials to the deck. The same local profile may satisfy more than one key when appropriate. Connection names are labels, not a trusted server identity. Tool availability and argument/schema checks still apply when an action runs. No new UDP message or external applet permission is introduced.
