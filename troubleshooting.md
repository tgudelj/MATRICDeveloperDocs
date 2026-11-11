# Share and troubleshoot extensions

## Check the right environment

Use a disposable deck and a matching supported Desktop/client pair. Test applet interaction and plugin execution on a real client; the editor preview is not an action-execution test. For a plugin that controls another application, verify that application's connection separately.

| Symptom | Check |
| --- | --- |
| UDP example receives nothing | Integration is enabled, the port matches Settings, PIN approval is complete, and the program runs on the MATRIC PC |
| UDP client list is empty | Connect a client; an editor window is not a client device |
| UDP replies arrive but notifications do not | Reuse the same bound socket and stable listen port; do not restrict replies to source port 5300; restart MATRIC after changing the registered endpoint |
| A button does not update | Load the expected deck on the selected client; use the control Name or ID, not its label; check exact property spelling |
| Another device also changes | Supply `clientId`; omitting it broadcasts client commands. Server variables remain shared |
| An applet is absent from the picker | Check its server folder, `manifest.json`, `applet.html` and catalog diagnostics; refresh the catalog |
| Applet stays blank or shows an old value | Handle either message order; register before requesting state; check the variable name and browser console; reload the applet or reopen the client deck |
| Applet displays zero as missing | Use a null/missing check rather than `if (value)` |
| Applet button does nothing | Enable interaction, bind the exact event, configure the action, and test on the client |
| A held input gets stuck | Pair start/release events, handle pointer cancellation/focus loss, and update both MATRIC Desktop and the client |
| Plugin import fails | Select the parent containing complete `.sdPlugin` folders and read the package diagnostic; verify the supported Windows entry point/runtime |
| Plugin backend is registered but action does nothing | Check the external app/service, selected controller and saved binding; try a simple action with Elgato Stream Deck or StreamDock closed |
| Plugin cannot be configured | Save the deck successfully and check backend/runtime diagnostics; some actions have no Property Inspector |
| Undo or Discard does not restore plugin settings | Plugin settings API writes persist immediately; reopen Configure to change them |
| Shared deck is missing an applet or plugin | Install dependencies separately; a `.deck` export does not include their code |

## Share a complete example

| Extension | Include with your instructions |
| --- | --- |
| UDP integration | Script/application, language/runtime requirement, app name, API port and authorization steps; let each user authorize their own PIN |
| Custom applet | `.mapl`, compatible client requirements, required variables/services, and a `.deck` if useful |
| Stream Deck plugin | Complete permitted `.sdPlugin` package or source/build instructions, exact tested version/actions, external dependencies, and the experimental designation |

Document which settings belong to a deck and which require local setup. Test export/import on another isolated setup before claiming a deck is self-contained. Applet files, plugin binaries, plugin globals and external applications require separate installation. Plugin files only travel with the deck when explicitly captured through its resource API.

## Report a reproducible problem

Include the MATRIC Desktop/client versions, extension version, exact action/event, expected result, observed result and a minimal test deck or example. For plugins, include the package and backend status messages plus required external software versions. Enable **DEBUG** logging when more detail is needed, and remove credentials or private data before sharing logs.
