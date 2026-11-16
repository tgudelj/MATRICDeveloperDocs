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

Create a disposable deck and add **MCP** to a button's press event. Select `Local MCP example`, discover tools and choose `get_value`. Leave arguments empty. Under **Preview arguments and run test**, use **Preview arguments** first, then **Run test** to perform the read.

Argument preview resolves values locally and makes no network call. Run test invokes the selected tool and may change the server's application. A test has a separate cancellation identity and does not publish to the saved action's variables. Closing the inspector cancels its test. Cancellation cannot undo a call already executed by the server.

You can also test without a deck: open **Settings > MCP Connections > Tools**, expand a tool and choose **Test tool**. This opens the same Fixed/Calculated argument editor, local function Test, argument Preview and explicit Run test controls. Opening the catalog or preparing the editor does not invoke anything. Settings tests are temporary and never save a deck action or publish live result variables. Closing Tools or collapsing the active tool cancels its test; cancellation cannot undo server effects.

After a tool test in either screen, **Display result as** defaults to **JSON**, showing the full normalized envelope including status, errors and structured data. **Text** shows returned text, with structured data as a fallback if no text is available. Returned markup is displayed literally. Switching views performs no network call and does not change publication settings. Images, audio and resource content are not rendered.

Arguments preserve JSON types. Fixed `false`, `0`, `null`, `""`, an omitted property and an unavailable source have different meanings. Optional arguments are omitted unless included. A literal string does not interpolate variables.

The value-source dropdown offers **Fixed** or **Calculated**. Choose Calculated to open the familiar function editor and enter the body of `function calculateValue(value, variables, eventData)`. `value` is `eventData.value` when that property exists (including false, zero and null); otherwise it is the entire event payload. `variables` contains typed server-variable values, with JSONOBJECT values decoded as JSON. `eventData` is the complete event payload. For example, `return variables["desired_target"];` reads a server variable.

For the example server, this function body converts a slider from 0–100 to 0–1:

```js
return Math.max(0, Math.min(1, value / 100));
```

Click **Test** in the function editor to evaluate locally using your test event JSON and the current server variables. It checks the argument type, and shows the value or error. It never discovers or invokes tools and does not change live result variables. **Save** applies the function; **Cancel** preserves the previous source/body. **Edit function / Test** reopens it. Whole-argument Preview also validates cross-property rules and the full tool input schema. The [runnable calculation example](../examples/mcp/calculations.cjs) uses the same slider function: run `node calculations.cjs` to see sample values.

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

At control-event admission MATRIC freezes event data and server-variable values. Later variable changes do not alter queued calculations. Latest value coalesces pending inputs before evaluating their functions, so discarded pending values do not each run a script.

Existing EventData, Variable and Context bindings retain their saved semantics. They appear as a disabled **Saved data binding** selection with replacement guidance. Selecting Fixed replaces the binding immediately; selecting Calculated drafts a function and replaces the binding only on Save. Calculations do not expose the former Context metadata. Advanced JSON retains compatibility with the saved contracts and supports nested argument targets. JSON Pointer escapes `~` as `~0` and `/` as `~1`; targets must not overlap. Omission applies to object properties, not array elements. Literal variable names inside function bodies are not remapped when copying controls or using Save As.

Resolved arguments must satisfy the discovered input schema before a call can be sent. Local JSON Pointer schema references work; external, named-anchor and recursive references are rejected. Regex validation has a finite deadline.

MATRIC saves the accepted input and output schemas with the action. If discovery reports a change, review it and choose **Use refreshed contract**. A call will not silently accept an incompatible tool contract.

## Set slider execution behavior

Calls are asynchronous: later MATRIC actions continue immediately. There is no wait-for-result mode. Queue expiry defaults to five seconds and call timeout to 30 seconds.

| Policy | Use it for | Behavior |
| --- | --- | --- |
| Ignore while busy | Discrete commands where repeat taps should be ignored | Suppresses another trigger while the saved action is waiting or running |
| Ordered queue | Relative steps and meaningful transitions | Preserves accepted order in a bounded queue |
| Latest value | Absolute setters such as volume or brightness | Replaces pending intermediate values and retains one trailing final value |

For one call on release, enable the slider's **Send value after interaction end** and use Ordered or Ignore while busy. For live absolute updates, disable that setting and use Latest value. Its interval defaults to 200 ms, with a 100 ms minimum. Values remain subject to validation, expiry and cancellation.

Auto-reset produces the selected value followed by the default value. Enable send-after-interaction and use Ordered to preserve both. Latest value is rejected for auto-reset sliders and rotary controls. Do not coalesce toggles, relative steps, screenshots or other commands where each input matters. Result-driven control updates do not emit another slider input.

The same saved action shares one execution lane across clients, with at most one call running. Hiding the client, replacing its deck/page or disconnecting discards that view's inputs. Other clients' inputs remain. Capacity is bounded: 32 profiles, 16 global concurrent calls, up to 16 calls per profile, 64 pending items per action, 256 pending work items and 8 MiB queued argument data globally. Input admission has separate per-origin and global bounds. Rejections are visible rather than silently growing queues.

## Consume results

The action editor shows its stable prefix:

```text
mcp_d<deck ID without hyphens>_a<action instance ID without hyphens>
```

Suffixes are `_result` (JSON snapshot), `_status` (string), `_busy` (boolean), `_success` (nullable boolean), `_pending_count` and `_sequence` (numbers). Mapped fields use `_field_<key>`. Results are read-only, nonpersistent server variables. They use existing [applet variable updates](../applets/reference.md) and control property bindings; no new UDP API message is required. An integration cannot overwrite or delete these owned values. A generated-name collision with another producer is reported as `variablePublicationError`.

Add this result mapping for the example:

```json
{"Key":"value","SourcePointer":"/value","ExpectedType":"number","Required":true}
```

A successful `_result` includes the following fields, with execution metadata such as sequence and client ID:

```json
{
  "status": "succeeded",
  "success": true,
  "outcomeUnknown": false,
  "fields": {"value": 0.5},
  "available": {"value": true},
  "fieldTypes": {"value": "number"},
  "pendingCount": 0,
  "suspended": false,
  "suppressedCount": 0,
  "lastRejectedInput": null,
  "variablePublicationError": false
}
```

Consume `_result` when several fields must agree: separate convenience variables do not form an atomic read. Check `success`, `available` and field type before displaying state. An optional missing field has value null and availability false; present false or zero remains available. A text-only response can succeed without supplying structured state. Required missing fields or incompatible output types report a contract error.

Tool `isError` is a failure even when HTTP returned 200. Statuses include `idle`, `queued`, `running`, `succeeded`, `failed`, `timed_out` and `cancelled`. Error envelopes contain a sanitized code and message. Returned text and full structured data are excluded from live variables by default. Explicit publication enables them; mapped fields are published independently. Variables are shared with connected clients, applets and authorized integrations, so select output fields deliberately.

If a dispatched call times out or is cancelled without a response, `outcomeUnknown` is true. MATRIC suspends the action and discards pending work. Inspect the external application, then use **Resume after reviewing an uncertain outcome** to accept new input. Resume never replays discarded calls. Mutating calls are not automatically retried. Tool annotations such as `readOnlyHint` are advisory and cannot enforce a server's behavior.

## Share and troubleshoot

Save/reopen retains action IDs. Copying controls/pages and Save As generate independent action IDs and remap typed result references within copied controls. Free-form script strings are not rewritten. Save As on the same PC retains explicit local mappings. Exported decks contain action settings, tool contracts and portable requirements, without endpoints, executable profiles or credentials. Import, including replacement, requires explicit mapping to a local connection before execution.

This version supports tool discovery and calls over Streamable HTTP and stdio, including older initialization negotiation on those transports. Legacy HTTP/SSE-only transport, resources/prompts, server-requested sampling, interactive elicitation and task workflows are excluded. Text is displayed as text. Images, audio and resource content are not rendered. Catalog, JSON size/depth and response limits reject excessive payloads. Use a read-only status tool to verify a real connection before configuring effects.

To test this example from the documentation checkout:

```sh
node --test tests/mcp-example.test.cjs
```
