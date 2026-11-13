# Example validation

The integration and applet guides have a MATRIC 2.9.18 baseline from 11 November 2026. Stream Deck compatibility includes the MATRIC 2.9.19 Windows checks below, performed on 13 November 2026. These records do not certify every client, installer or third-party plugin.

## Checks performed

- Local documentation links, navigation, JSON examples and package/source consistency.
- Markdown rendering and visual inspection of illustrations and the starter preview.
- Python example against an isolated UDP responder, including nested replies and notifications sent from a separate source port.
- Applet messages and plugin registration/lifecycle behavior with simulated MATRIC messages.
- Eight repeatable starter browser tests: standalone preview; proportional fitting and real pointer clicks; both parameter/variable arrival orders; padding and malformed messages; instance isolation; resize/resume retention; and disabled editor interaction.
- Four portal browser checks: navigation and section anchors from the custom domain root; full-text search and code-copy button availability; unchanged package/source downloads; and mobile navigation without page overflow. The publishing workflow also validates generated page links, anchors and search data before deployment.

The starter browser checks ran in a Chromium-based browser on macOS. They cover wide, square, tall and tiny viewports, zero/false/missing values and state retention without document reload.

## Windows and device checks still needed

The Windows OpenAction checks below cover only the named plugin releases. Live Windows/device walkthroughs have not been completed for the UDP and applet examples. Verify authorization, actual device display, Text action execution, `.mapl` installation and plugin execution on the supported MATRIC/client versions you target. Also test touch usability and sharing dependencies on the destination PC.

Stream Deck support remains experimental. Successful import, backend registration or configuration does not establish compatibility for every action or external application.

## Record future results

When submitting a test result, include the example version or commit, MATRIC Desktop/client versions, operating system, tested action and outcome. Distinguish browser-message tests from actual device and Windows action tests. See [Contributing](CONTRIBUTING.md) to reproduce the automated checks.

## Windows plugin regression checks for MATRIC 2.9.19

On 13 November 2026, the Windows native harness exercised unchanged Counter 1.0.1 and System Information 1.0.0 release binaries with isolated deck/plugin collections. It checked Counter keypad/encoder input, independent settings, saved-deck writes and backend restart, and System Information live CPU/RAM/uptime/OS titles. Counter's native CEF inspector rendered its step input, saved an edited value and retained it after a separate-process restart. Original source package files were unchanged.

Controlled fixtures checked the plugin-wide settings request/button and arbitrary JSON settings; neither release example supplies its own plugin-wide settings window. Third-party native GUI interaction and actual phone/tablet display were not verified by these tests. Device-provider and Linux actions remain excluded. See the [Windows OpenAction guide](stream-deck/guide.md#windows-openaction-plugins) for the compatibility boundary.

The production marketplace resolver also downloaded Counter and System Information from their catalogue entries and imported both into an isolated managed collection without starting either backend. Repeating an import retained the installed copy. Controlled HTTP checks covered link validation, repository and download hosts, redirect restrictions, stable-release selection, Windows asset preference, ambiguous assets, checksums, size limits, cancellation and network errors. Package identity mismatch checks prevented installation and replacement. Native cross-process tests covered marketplace links sent to hidden and delayed-start windows. Installer authoring checks verified alternative-handler registration and preservation of the existing protocol command and user choice. A browser-to-installed-MATRIC walkthrough and Windows Default Apps selection were not performed; those OS integration steps still need an installed-build check.

The manager's browser test clicks **OpenAction marketplace** in both the separate window and Settings. It verifies the exact HTTPS URL through the existing default-browser bridge, no embedded marketplace frame, unchanged folder import source and no automatic import or backend start. It does not launch the operator's browser or exercise Windows default-handler selection.

The no-handler installation failure was reproduced on Windows with the original 2.9.19 registration: advertising an alternative, even with a protocol marker, supplies no launch command. The corrected registration passed 23 isolated Windows checks, including a real shell URI activation with exact arguments, an executable path containing spaces and Unicode, foreign-handler preservation, repair, changed-path upgrade, uninstall, rollback and write failure. These checks use unique temporary protocol names and an inert receiver; they do not modify the installed `opendeck` association. The installer suite passed 70 controlled checks, including generated actions and actual sequence numbers from a compiled diagnostic MSI. Full MSI install/upgrade/repair/uninstall execution and a browser-to-installed-MATRIC walkthrough remain unverified.

| Plugin release | Observed behavior |
| --- | --- |
| Counter 1.0.1 | Keypad and encoder input, independent values, saved settings, live titles and inspector editing |
| System Information 1.0.0 | Live CPU, RAM, uptime and OS titles; no Property Inspector supplied |
| TikClock 1.1.0 | Changing SVG images, inspector editing, settings retention, backend restart and a simple Windows command |
| Clocks 0.9.5 | HTML backend, digital and smooth analog images, inspector editing and restart |
| Rotary Generic Command 1.1.0 | Clockwise/counterclockwise commands, short/long press, message-based inspector startup and settings retention |
| Windows Essentials 0.16.3 | Node backend, native audio helper, enumeration of three real audio outputs and inspector messaging |
| Discord 0.5.1 | Native backend and seven inspector views; authenticated Discord actions not tested |
| CommandSender 1.5 | Ten-mode cycle and wraparound, matching images, real UDP/TCP press/release commands and independent occurrences |
| Web Requests 0.1.1 | HTTP POST body and custom headers, HTTP failure feedback, Unicode WebSocket delivery and inspector settings |
| Dice 1.0.4 | Deterministic rolls, published images, independent results, saved settings and backend restart |

All ten unchanged source packages were preserved. Native configuration checks covered initial opening and a separate-process restart; edited settings were restored where an edit scenario was supplied. Windows Essentials volume/media/power/display mutations were not invoked. TikClock's quoted Windows-command failure also reproduced in a standalone protocol fixture without MATRIC; the simple-command test passed.

Controlled inspector tests covered both named startup functions, delayed function definition, a delayed message listener, slow registration, exactly one initialization, failure deadlines and closing during pending startup. Real browser pointer tests changed plugin mode while a physical MATRIC button was held and verified that release did not reset the mode. Client recovery tests, invalid state tokens, per-state images/titles and shared cache capacity were also checked. The ten-state CommandSender and wire-fixture run passed 106 checks; shared protocol, appearance and input suites passed 114, 55 and 231 checks respectively. The Release build and mandatory editor/persistence workflow gate also passed.

These checks do not establish live phone/tablet display, authenticated Discord behavior or a third-party plugin-owned general settings GUI. Stream Deck support remains experimental and its documented exclusions still apply.
