# Example validation

The guides were prepared for MATRIC 2.9.18 on 11 November 2026. This identifies their documentation baseline, not certification of every client, installer or third-party plugin.

## Checks performed

- Local documentation links, navigation, JSON examples and package/source consistency.
- Markdown rendering and visual inspection of illustrations and the starter preview.
- Python example against an isolated UDP responder, including nested replies and notifications sent from a separate source port.
- Applet messages and plugin registration/lifecycle behavior with simulated MATRIC messages.
- Eight repeatable starter browser tests: standalone preview; proportional fitting and real pointer clicks; both parameter/variable arrival orders; padding and malformed messages; instance isolation; resize/resume retention; and disabled editor interaction.

The starter browser checks ran in a Chromium-based browser on macOS. They cover wide, square, tall and tiny viewports, zero/false/missing values and state retention without document reload.

## Windows and device checks still needed

Live Windows/device walkthroughs have not been completed for these published examples. Verify authorization, actual device display, Text action execution, `.mapl` installation and plugin execution on the supported MATRIC/client versions you target. Also test touch usability and sharing dependencies on the destination PC.

Stream Deck support remains experimental. Successful import, backend registration or configuration does not establish compatibility for every action or external application.

## Record future results

When submitting a test result, include the example version or commit, MATRIC Desktop/client versions, operating system, tested action and outcome. Distinguish browser-message tests from actual device and Windows action tests. See [Contributing](CONTRIBUTING.md) to reproduce the automated checks.
