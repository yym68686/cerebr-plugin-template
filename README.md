# Cerebr Plugin Template

This folder is a standalone starter repository for Cerebr plugins.

The root of the repository is already a valid local `page` script plugin, and the rest of the repository turns the runtime contract into something that can be used without reading the Cerebr source tree.

## What is included

- A ready-to-sideload root plugin: [plugin.json](./plugin.json) + [page.js](./page.js)
- A runtime architecture guide in [docs/runtime-architecture.md](./docs/runtime-architecture.md)
- Complete runtime notes in [docs/api-reference.md](./docs/api-reference.md)
- Permissions, slots, and bridge notes in [docs/permissions-and-slots.md](./docs/permissions-and-slots.md)
- Local install and marketplace packaging guidance in [docs/publishing.md](./docs/publishing.md)
- Extra examples for `shell`, `background`, and `declarative` plugins in [examples](./examples)
- Local schema copies in [schemas](./schemas)
- A no-dependency manifest checker in [scripts/check-manifests.mjs](./scripts/check-manifests.mjs)

## Quick start

1. Rename the plugin id in [plugin.json](./plugin.json) and [page.js](./page.js).
2. Edit `displayName`, `description`, `permissions`, and `compatibility.versionRange`.
3. Replace the sample logic in [page.js](./page.js) or switch the root manifest to `shell` / `background`.
4. Run `npm run check`.
5. In Cerebr, enable developer mode.
6. Open `Settings -> Plugins -> Developer`.
7. Drag this folder into Cerebr, or use `Choose Plugin Folder`.

## Root plugin layout

```text
cerebr-plugin-template/
  plugin.json
  page.js
  docs/
  examples/
  schemas/
  scripts/
```

The root plugin exports a plain plugin object on purpose.

That is now the safest default across every host:

- `page` plugins can stay plain and sideload cleanly
- dropped local `shell` plugins can run inside the guest runtime
- reviewed packages do not need to reach into Cerebr's private `/src/...` files

`definePlugin(...)` is optional. If you want helper wrappers, bundle them inside your own plugin folder instead of importing them from the Cerebr repository.

## Supported plugin kinds

- `script`: executable plugins for `page`, `shell`, or `background`
- `declarative`: data-only plugins for `prompt_fragment`, `request_policy`, or `page_extractor`
- `builtin`: reserved for Cerebr itself, not for third-party plugins

## Recommended reading order

If you want to learn the current plugin system without opening the main Cerebr repository, read these files in order:

1. [docs/runtime-architecture.md](./docs/runtime-architecture.md)
2. [docs/api-reference.md](./docs/api-reference.md)
3. [docs/permissions-and-slots.md](./docs/permissions-and-slots.md)
4. One concrete example under [examples](./examples)

That sequence explains:

- how Cerebr splits `page`, `shell`, `background`, and `prompt`
- which APIs are host-rendered vs plugin-owned
- how permissions are normalized
- which UI surfaces are preferred in the new architecture

## Import rules

- Relative imports inside your plugin folder are supported.
- Absolute imports that start with `/` are resolved against the current Cerebr origin for host-loaded plugins.
- Bare specifiers such as `react`, `lodash`, or `@scope/pkg` are not supported by the runtime loader.
- Cross-origin script imports are rejected for local sideloaded plugins.
- Dropped local `shell` plugins in the browser extension host must be self-contained and should stick to relative imports only.

If you want to use npm packages or TypeScript, bundle them into local files before you install the plugin.

For guest `shell` plugins, prefer local JS/JSON module imports over runtime `fetch(new URL('./file.json', import.meta.url))`. Relative module imports are rewritten by the loader and stay self-contained; runtime fetches against `import.meta.url` are fragile once the plugin is running from a bundled guest URL.

## Example folders

- [examples/shell-script](./examples/shell-script): native input actions, native slash commands, first-level menu items, host page, plus prompt fragment setup
- [examples/background-script](./examples/background-script): bridge a background event back into the shell runtime
- [examples/declarative-prompt-fragment](./examples/declarative-prompt-fragment): minimal prompt fragment package
- [examples/declarative-request-policy](./examples/declarative-request-policy): retry policy package
- [examples/declarative-page-extractor](./examples/declarative-page-extractor): page content extractor package
- [examples/registry/plugin-registry.json](./examples/registry/plugin-registry.json): example marketplace registry payload

## Recommended workflow

1. Start with the root `page` example and make sure local sideload works.
2. Copy one of the example manifests if you need `shell`, `background`, or `declarative` behavior.
3. For `shell` plugins, prefer host-rendered UI (`shell.setInputActions()`, `shell.setSlashCommands()`, `shell.setMenuItems()`, `shell.openPage({ view })`) over custom DOM/CSS.
4. Keep the plugin folder self-contained.
5. Use `npm run check` before every publish or handoff.

## Current template baseline

- Tested against the current Cerebr manifest version `2.4.84`
- Compatibility range in the examples: `>=2.4.84 <3.0.0`

Update those ranges when the host runtime changes.
