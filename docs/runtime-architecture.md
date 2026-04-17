# Runtime Architecture

This file explains the current Cerebr plugin architecture from the template repository alone.

## System model

Cerebr now treats plugins as:

- logic providers
- contribution providers
- host surface consumers

The host owns layout, page chrome, routing, and native shell controls whenever possible. Plugins focus on behavior and data.

## Runtime layers

The refactored runtime is split into:

- compiler
  - normalizes manifest-backed plugin entries
  - resolves `activationEvents`
  - summarizes contributions
- kernel
  - stores status
  - lazily activates plugins
  - keeps diagnostics and failure state
- host services
  - assemble the stable API seen by plugins
- hosts
  - `page`
  - `shell`
  - `background`

## Plugin kinds

### Script plugins

Use when you need:

- runtime hooks
- event handling
- page automation
- shell/editor/chat integration
- background tab/storage coordination

### Declarative plugins

Use when you need data-only behavior without shipping runtime code.

Legacy declarative types:

- `prompt_fragment`
- `request_policy`
- `page_extractor`

Preferred v2 contribution groups:

- `promptFragments`
- `requestPolicies`
- `pageExtractors`
- `selectionActions`
- `inputActions`
- `menuItems`
- `slashCommands`

### Builtin plugins

Reserved for Cerebr itself.

## Host runtimes

### `page`

Use for:

- selection helpers
- page extractors
- anchored actions
- lightweight page automation

Common services:

- `page.*`
- `site.*`
- `ui.showAnchoredAction(...)`
- `ui.mountSlot(...)`
- `shell.*`

### `shell`

Use for:

- draft manipulation
- chat/request hooks
- composer actions
- plugin settings pages
- prompt fragments

Common services:

- `browser.*`
- `editor.*`
- `chat.*`
- `prompt.*`
- `storage.*`
- `i18n.*`
- `shell.*`
- `ui.*`
- `bridge.*`

### `background`

Use for:

- tab coordination
- storage orchestration
- cross-tab bridge routing

Background plugins must set:

```json
"requiresExtension": true
```

## Activation events

Plugins no longer need to start eagerly.

Common activation events:

- `app.startup`
- `page.ready`
- `shell.ready`
- `background.ready`
- `hook:onBeforeSend`
- `hook:onResponseError`
- `hook:onCommand`
- `hook:onActionClicked`
- `hook:*`

Recommended defaults:

- page UI helpers: `page.ready`
- shell setup/UI plugins: `shell.ready`
- retry/request hooks: activate on the specific hook
- background command handlers: `hook:onActionClicked`, `hook:onCommand`, or both

## Local shell runtime

Dropped local `shell` plugins in the browser extension host run in the sandboxed guest runtime.

That means:

- keep the plugin self-contained
- use relative imports
- do not import `/src/...` host internals
- do not depend on direct host DOM access
- prefer local JS/JSON module imports over runtime fetches against `import.meta.url`

## Preferred shell UI stack

For shell UI, use these surfaces in order:

1. `shell.setInputActions()`
2. `shell.setSlashCommands()`
3. `shell.setMenuItems()`
4. `shell.openPage({ view })`
5. `shell.showModal()`
6. `shell.mountInputAddon()`

This keeps plugins aligned with Cerebr's native UI and reduces fragile DOM coupling.
