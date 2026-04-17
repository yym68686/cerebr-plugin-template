# Runtime Architecture

This file explains how the current Cerebr plugin system is structured, so plugin authors can work from the template repository alone.

## System model

Cerebr now treats plugins as:

- **logic providers**: plugins decide behavior, data flow, and event handling
- **host surface consumers**: the Cerebr host owns the default UI system, layout, and navigation chrome

The goal is:

- plugins declare structure and logic
- Cerebr renders native-looking UI whenever possible
- plugin authors should avoid shipping custom page CSS for common settings/management pages

## Plugin kinds

### Script plugins

Executable plugins that run code in one of these hosts:

- `page`
- `shell`
- `background`

Use script plugins when you need:

- runtime hooks
- event handling
- page automation
- shell/editor/chat integration
- background tab/storage coordination

### Declarative plugins

Data-only plugins that describe behavior without shipping executable runtime code.

Current declarative types:

- `prompt_fragment`
- `request_policy`
- `page_extractor`

Use declarative plugins when the plugin only needs to:

- add prompt instructions
- patch request policy / retry rules
- improve page extraction selectors

### Builtin plugins

Reserved for Cerebr itself. Third-party developers should not use `kind = "builtin"`.

## Host runtimes

### `page`

Runs inside the content-script/page runtime.

Use it for:

- selection helpers
- page extractors
- anchored actions
- lightweight page automation

Key APIs:

- `page.*`
- `site.*`
- `ui.showAnchoredAction(...)`
- `ui.mountSlot(...)`
- `shell.*` bridge helpers for composer interaction

### `shell`

Runs inside the Cerebr shell runtime.

Use it for:

- draft manipulation
- chat/request hooks
- composer actions
- plugin settings pages
- prompt fragments

Key APIs:

- `browser.getCurrentTab()`
- `editor.*`
- `chat.*`
- `prompt.*`
- `storage.*`
- `i18n.*`
- `shell.*`
- `ui.showToast(...)`
- `bridge.*`

### `background`

Runs in the extension background/service worker host.

Use it for:

- tab coordination
- storage orchestration
- broadcasting plugin bridge messages into tabs

Background plugins must set:

```json
"requiresExtension": true
```

## Local shell plugin runtime

Local dropped `shell` plugins in the browser extension host run in a **static guest runtime**.

That means:

- keep the plugin self-contained
- use relative imports inside the plugin folder
- do not import `/src/...` host internals
- do not depend on direct host DOM access
- prefer local JS/JSON module imports over runtime `fetch(new URL('./file.json', import.meta.url))`

Preferred shell plugin layout:

```text
my-shell-plugin/
  plugin.json
  shell.js
  vendor/
```

## Capability model

Manifest `permissions` are treated as **capabilities**.

Examples:

- `shell:input`
- `shell:menu`
- `shell:page`
- `chat:write`
- `page:read`
- `site:write`
- `tabs:read`
- `storage:write`

The host normalizes permissions before runtime use.

Legacy aliases currently supported:

- `prompt:write` -> `prompt:extend`
- `tabs:active` -> `tabs:read`
- `storage:local` -> `storage:read`, `storage:write`

Namespace wildcards are also supported:

- `shell:*`
- `page:*`
- `site:*`

Wildcards are mainly useful for internal or experimental plugins. For published plugins, prefer explicit fine-grained permissions.

## Preferred shell UI stack

The new plugin architecture is intentionally opinionated.

For shell UI, use these surfaces in this order:

1. `shell.setInputActions()` for native buttons under the composer
2. `shell.setSlashCommands()` for native `/` command UX in the composer
3. `shell.setMenuItems()` for first-level settings/navigation entries
4. `shell.openPage({ view })` for settings, dashboards, and management pages
5. `shell.showModal()` only when the interaction is truly modal
6. `shell.mountInputAddon()` only when you need a custom inline surface that the host cannot render for you

This keeps plugins visually aligned with Cerebr and avoids fragile iframe/overlay/layout behavior.

## Host-rendered pages

`shell.openPage({ view })` lets the plugin send a serializable page schema to Cerebr.

The host then renders the page using the built-in design system.

Use this for:

- settings pages
- import/review flows
- configuration dashboards
- management UIs

Prefer host-rendered pages over custom plugin pages when the UI is mostly:

- cards
- forms
- lists
- stats
- notes
- action rows

### Sections

Current top-level section kinds:

- `card`
- `columns`
- `hero`

### Content nodes

Current card/body node kinds:

- `text`
- `note`
- `stats`
- `badges`
- `actions`
- `form`
- `list`

### Form field types

Current supported field types:

- `text`
- `textarea`
- `color`
- `checkbox`
- `select`

### Interaction model

Host-rendered pages emit:

- lifecycle events: `open`, `close`
- interaction events: `action`, `change`

Use:

- `viewStateKey` to control when transient field state should be preserved
- `resetViewState` to force field-state reset on page updates

## When to still mount custom UI

Custom mounted UI is still valid for:

- inline composer add-ons
- special visualizations
- dynamic toolbars/popovers that are not yet expressible with host schema
- page-side UI surfaces such as anchored actions

Even then, keep the mount surface narrow and let the host own as much layout as possible.

## Recommended plugin recipes

### Page helper

Use:

- `scope = "page"`
- `page.watchSelection(...)`
- `ui.showAnchoredAction(...)`
- `shell.importText(...)`

Reference:

- root [plugin.json](../plugin.json)
- root [page.js](../page.js)

### Shell settings/management plugin

Use:

- `scope = "shell"`
- `shell.setInputActions(...)`
- `shell.setMenuItems(...)`
- `shell.openPage({ view })`
- `shell.onPageEvent(...)`

Reference:

- [examples/shell-script/plugin.json](../examples/shell-script/plugin.json)
- [examples/shell-script/shell.js](../examples/shell-script/shell.js)

### Background coordinator

Use:

- `scope = "background"`
- `browser.*`
- `storage.*`
- `bridge.sendToTab(...)`

Reference:

- [examples/background-script/plugin.json](../examples/background-script/plugin.json)
- [examples/background-script/background.js](../examples/background-script/background.js)

### Declarative package

Use:

- `kind = "declarative"`
- one of `prompt_fragment`, `request_policy`, `page_extractor`

Reference:

- [examples/declarative-prompt-fragment](../examples/declarative-prompt-fragment)
- [examples/declarative-request-policy](../examples/declarative-request-policy)
- [examples/declarative-page-extractor](../examples/declarative-page-extractor)

## Design rule of thumb

If you are about to write a large block of page-level CSS for a plugin settings screen, stop and check whether the same UI can be expressed as:

- host input actions
- host menu items
- a host-rendered page schema

In the current Cerebr architecture, that is the preferred path.
