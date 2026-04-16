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
- If you installed a plugin by dragging a folder, updating it means dragging the updated folder again.

## Script entry resolution

For local sideloaded bundles:

- `script.entry` is resolved relative to `plugin.json`
- relative imports inside the plugin folder are bundled and rewritten
- same-origin absolute imports like `/src/plugin/shared/define-plugin.js` are allowed
- bare imports like `lodash` are rejected
- cross-origin script imports are rejected

For reviewed marketplace packages:

- `plugin.json` is fetched from `install.packageUrl`
- `script.entry` is resolved relative to that fetched `plugin.json`
- `script.entry` must stay on the same origin as the package manifest

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
>=2.4.75 <3.0.0
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
