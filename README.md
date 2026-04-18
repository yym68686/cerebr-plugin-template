# Cerebr Plugin Template

This repository is the standalone starter template for Cerebr plugins.

The root of the repository is already a valid local `page` script plugin, and the rest of the repository documents the refactored plugin runtime without requiring a read through the main Cerebr source tree.

## What is included

- a ready-to-sideload root plugin: [plugin.json](./plugin.json) + [page.js](./page.js)
- architecture notes in [docs/runtime-architecture.md](./docs/runtime-architecture.md)
- runtime contract notes in [docs/api-reference.md](./docs/api-reference.md)
- permissions, slots, and activation guidance in [docs/permissions-and-slots.md](./docs/permissions-and-slots.md)
- local install and marketplace packaging notes in [docs/publishing.md](./docs/publishing.md)
- script and declarative examples in [examples](./examples)
- local schema copies in [schemas](./schemas)
- a no-dependency manifest checker in [scripts/check-manifests.mjs](./scripts/check-manifests.mjs)

## Quick start

1. Rename the plugin id in [plugin.json](./plugin.json) and [page.js](./page.js).
2. Update `displayName`, `description`, resource-scoped `permissions`, `activationEvents`, and `compatibility.versionRange`.
3. Replace the sample logic in [page.js](./page.js), or switch the root manifest to `shell` / `background`.
4. Run `npm run check`.
5. In Cerebr, enable developer mode.
6. Open `Settings -> Plugins -> Developer`.
7. Drag this folder into Cerebr, or use `Choose Plugin Folder`.

The root [plugin.json](./plugin.json) is the sideload entry. Nested example manifests under [examples](./examples) are ignored as long as the root manifest is present.

## Root layout

```text
cerebr-plugin-template/
  plugin.json
  page.js
  docs/
  examples/
  schemas/
  scripts/
```

## Supported package formats

- `script`
  - executable plugin for `page`, `shell`, or `background`
- `declarative`
  - data-only plugin using legacy `declarative.type` or preferred v2 `contributions`
- `builtin`
  - reserved for Cerebr itself

Supported manifest schema versions:

- `schemaVersion = 1`
- `schemaVersion = 2`

New plugins should prefer schema v2.

## Declarative contribution coverage

Legacy declarative types still work:

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

## Example folders

- [examples/shell-script](./examples/shell-script): native input actions, slash commands, menu items, host page, plus prompt fragment setup
- [examples/background-script](./examples/background-script): bridge a background event back into the shell runtime
- [examples/declarative-prompt-fragment](./examples/declarative-prompt-fragment): schema v2 prompt fragment package
- [examples/declarative-request-policy](./examples/declarative-request-policy): schema v2 request policy package
- [examples/declarative-page-extractor](./examples/declarative-page-extractor): schema v2 page extractor package
- [examples/declarative-selection-action](./examples/declarative-selection-action): anchored page action without page runtime code
- [examples/declarative-shell-actions](./examples/declarative-shell-actions): native shell buttons, menu item, and slash command without shell runtime code
- [examples/registry/plugin-registry.json](./examples/registry/plugin-registry.json): example marketplace registry payload with activation metadata

## Recommended reading order

1. [docs/runtime-architecture.md](./docs/runtime-architecture.md)
2. [docs/api-reference.md](./docs/api-reference.md)
3. [docs/permissions-and-slots.md](./docs/permissions-and-slots.md)
4. one concrete example under [examples](./examples)

## Import rules

- relative imports inside your plugin folder are supported
- dropped local `shell` plugins should keep using relative bundle imports; absolute imports that start with `/` are rejected during local shell bundle validation
- bare specifiers such as `react`, `lodash`, or `@scope/pkg` are not supported by the runtime loader
- cross-origin script imports are rejected for local sideloaded plugins
- dropped local `shell` plugins in the extension host must be self-contained and should stick to relative imports only

If you want npm packages or TypeScript, bundle them into local files before installing the plugin.

## Recommended workflow

1. Start with the root `page` example and confirm local sideload works.
2. Copy the closest example manifest for `shell`, `background`, or declarative behavior.
3. Add explicit `activationEvents` instead of defaulting to eager startup.
4. For shell integrations, prefer host-rendered UI (`shell.setInputActions()`, `shell.setSlashCommands()`, `shell.setMenuItems()`, `shell.openPage({ view })`) over custom DOM/CSS.
5. Keep the plugin folder self-contained.
6. Run `npm run check` before publish or handoff.

## Current template baseline

- tested against Cerebr `2.4.86`
- compatibility range in template examples: `>=2.4.86 <3.0.0`

Update those ranges when the host runtime changes.

## License

This template follows Cerebr and is licensed under the GPLv3 License. See [LICENSE](./LICENSE).
