# Starter applet

Copy this whole folder to `Documents\MATRIC\custom\starter-applet` on the MATRIC Windows PC, or install the accompanying `starter-applet.mapl`. No npm, build step, CDN or network service is needed. Open `applet.html` in a browser for a standalone preview with sample data.

In MATRIC, add a Custom applet container, select **Starter applet**, enable interaction, set **Variable to display**, then bind **Activate** to **Text** and configure its text. Save and test on a client with a blank text editor focused on the PC. The editor preview intentionally disables the button.

The design is **600 × 400**, fitted proportionally inside the iframe using the same centered CSS transform and viewport measurement pattern as bundled clock/counter applets. Start with a **6 × 4 cell** container. For interaction, use at least approximately **480 × 320 CSS pixels with the default 12px padding**; the button then remains above 44 CSS pixels high. This is a design recommendation, not a manifest-enforced minimum. Larger padding needs a larger container. Small containers still fit but may be unusable for touch.

- Edit `applet.html` and `applet.css` for your UI. Long values are ellipsized; the full text is in the element's `title`.
- Change `DESIGN_WIDTH` and `DESIGN_HEIGHT` at the top of `applet.js` to change the design size. Those constants set both the DOM dimensions and the fitting calculation. Adjust the internal layout to suit them.
- Keep the root height/margin reset, centered transform, padding clamp and viewport observers. Do not add another scale around the design.
- `Padding` is an unscaled outer inset; the design's own 24px internal padding scales with its content. Unused space is intentional when aspect ratios differ.
- Copy to a new folder and change `AppletId` to that folder's name before making your own applet. Use a new `DisplayName`, author and version too.
- The sample event supports **Text** only. If you add hotkey or vJoy holds, implement paired release/cancellation as described in the developer reference.

After edits, use **Reload applet** in the editor and reopen the client deck if necessary. Applet files are not bundled in a `.deck` export; share your `.mapl` too.

To package your renamed folder on Windows, zip its contents (not its parent collection) and rename `.zip` to `.mapl`. The archive root must contain `manifest.json` and `applet.html` alongside the CSS and JavaScript. Importing an existing ID replaces its installed folder.
