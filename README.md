# Cerebr Plugin Template

This folder is a standalone starter repository for Cerebr plugins.

The root of the repository is already a valid local `page` script plugin, and the rest of the repository turns the runtime contract into something that can be used without reading the Cerebr source tree.

## What is included

- A ready-to-sideload root plugin: [plugin.json](./plugin.json) + [page.js](./page.js)
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
6. Open `Settings -> Plugins -> Developer` and drag this folder into Cerebr.

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

The root plugin uses this import on purpose:

```js
import { definePlugin } from '/src/plugin/shared/define-plugin.js';
```

That absolute path lets the plugin live outside the main Cerebr repository. During local sideload, Cerebr rewrites same-origin absolute imports back to the current host runtime.

## Supported plugin kinds

- `script`: executable plugins for `page`, `shell`, or `background`
- `declarative`: data-only plugins for `prompt_fragment`, `request_policy`, or `page_extractor`
- `builtin`: reserved for Cerebr itself, not for third-party plugins

## Import rules

- Relative imports inside your plugin folder are supported.
- Absolute imports that start with `/` are resolved against the current Cerebr origin.
- Bare specifiers such as `react`, `lodash`, or `@scope/pkg` are not supported by the runtime loader.
- Cross-origin script imports are rejected for local sideloaded plugins.

If you want to use npm packages or TypeScript, bundle them into local files before you install the plugin.

## Example folders

- [examples/shell-script](./examples/shell-script): slot mounting plus prompt fragment setup
- [examples/background-script](./examples/background-script): bridge a background event back into the shell runtime
- [examples/declarative-prompt-fragment](./examples/declarative-prompt-fragment): minimal prompt fragment package
- [examples/declarative-request-policy](./examples/declarative-request-policy): retry policy package
- [examples/declarative-page-extractor](./examples/declarative-page-extractor): page content extractor package
- [examples/registry/plugin-registry.json](./examples/registry/plugin-registry.json): example marketplace registry payload

## Recommended workflow

1. Start with the root `page` example and make sure local sideload works.
2. Copy one of the example manifests if you need `shell`, `background`, or `declarative` behavior.
3. Keep the plugin folder self-contained.
4. Use `npm run check` before every publish or handoff.

## Current template baseline

- Tested against the current Cerebr manifest version `2.4.75`
- Compatibility range in the examples: `>=2.4.75 <3.0.0`

Update those ranges when the host runtime changes.
