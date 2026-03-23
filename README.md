# Copilot Studio Hero (Chrome Extension)

This extension currently includes two features: textarea autosize and Copilot Studio quick navigation.

## Current Feature

- Textareas auto-grow and auto-shrink while typing.
- Max textarea height is `1000px`; above that, textarea content becomes scrollable.
- Textareas with class `text-area-input` are excluded.
- Works automatically on initial page load and for dynamically added textareas.

## Quick Nav Menu

- On `copilotstudio.microsoft.com`, the **Quick Nav** menu is hidden by default.
- Click the extension icon to toggle the menu on/off.
- When the menu is open, clicking anywhere outside it hides it.
- The menu opens in a consistent top-right dock position (Level Up-style).
- The menu header shows a navigation icon next to the **Quick Nav** title.
- It extracts the environment ID from URLs containing `/environments/{environmentId}`.
- It provides one-click buttons that open in new tabs:
	- Tables
	- Connections
	- Custom Connectors
	- Prompts

## Code Organization For Multiple Features

The content script uses a feature registry pattern:

- A `features` array holds independent feature definitions.
- Each feature declares:
	- `selector`: elements to target
	- `setup(element)`: one-time setup logic
- A shared DOM pass + `MutationObserver` applies all registered features.

To add a new feature, create a `create...Feature()` function and add its result to the `features` array in `content.js`.

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder.
