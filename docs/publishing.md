# Publishing And Install Notes

This file explains how Cerebr currently loads plugins in developer mode and from a reviewed registry package.

## Local developer sideload

Local script sideload is intended for development and private testing.

Rules:

- Developer mode must be enabled before local script plugins can run.
- Drag the whole plugin folder into `Settings -> Plugins -> Developer`.
- The folder must contain exactly one `plugin.json` at the plugin root.
- Local sideload currently supports script plugins only.
- Supported script scopes are `page`, `shell`, and `background`.
- `background` plugins only run in the browser extension host and must set `requiresExtension: true`.
- Dropped local `shell` plugins in the browser extension host run inside the static guest runtime and must be self-contained.
- Updating a dropped local plugin still means dragging the updated folder again or using the refresh action in the developer tab.

## Script entry resolution

For local sideloaded script plugins:

- `script.entry` is resolved relative to `plugin.json`
- relative imports inside the plugin folder stay relative to the plugin folder
- same-origin absolute imports like `/src/plugin/shared/define-plugin.js` are only safe for host-loaded plugins
- bare imports like `lodash` are rejected
- cross-origin script imports are rejected
- dropped local `shell` plugins in the extension host should use relative imports only
- dropped local `shell` plugins should keep structured assets as local JS/JSON modules instead of runtime fetches against `import.meta.url`
- for settings, dashboards, and management views, prefer `shell.openPage({ view })` plus host-rendered schema over shipping a custom plugin page design

For reviewed marketplace packages:

- `plugin.json` is fetched from `install.packageUrl`
- `script.entry` is resolved relative to that fetched `plugin.json`
- `script.entry` must stay on the same origin as the package manifest
- remote script packages should be self-contained and should not import host internals from the main Cerebr repository unless they are actually served from the same origin as the app

## Recommended package layout

For a reviewed package or a static-hosted plugin:

```text
plugins/<plugin-id>/<plugin-version>/
  plugin.json
  page.js | shell.js | background.js
  other-local-files.js
```

For a registry:

```text
plugin-registry.json
plugins/<plugin-id>/<plugin-version>/plugin.json
```

The example registry payload is in [../examples/registry/plugin-registry.json](../examples/registry/plugin-registry.json).

## Registry payload

The registry format needs:

- `schemaVersion`
- `registryId`
- `displayName`
- `generatedAt`
- `plugins`

Every plugin entry needs:

- `id`
- `kind`
- `scope`
- `displayName`
- `description`
- `latestVersion`

For `declarative` and `script` plugins, the registry entry must also include:

- `install.mode: "package"`
- `install.packageUrl`

## Declarative package notes

Current declarative plugin types:

- `prompt_fragment`
- `request_policy`
- `page_extractor`

Scope rules:

- `prompt_fragment`: `prompt` or `shell`
- `request_policy`: `shell`
- `page_extractor`: `page`

See the example folders under [../examples](../examples).

## Compatibility ranges

The template uses:

```text
>=2.4.84 <3.0.0
```

Update that range whenever:

- Cerebr changes a runtime API your plugin uses
- the host manifest version moves past your tested baseline
- you want to explicitly drop old host versions

## Suggested release checklist

1. Run `npm run check`.
2. Verify that `plugin.json` and the exported plugin object use the same id.
3. Verify that your permissions match the APIs you actually call.
4. Verify that `requiresExtension` is set correctly.
5. Verify that `script.entry` points at the published file.
6. If you publish a registry entry, make sure `install.packageUrl` points to the versioned `plugin.json`.

## Notes for page plugins

If your plugin depends on page DOM, user selection, or content script behavior, it is usually safest to mark it with:

```json
"requiresExtension": true
```

That matches the current template root plugin and the shipped page-oriented examples.
