# Publishing And Install Notes

This file explains how Cerebr currently loads plugins in developer mode and from a reviewed marketplace package.

## Local developer sideload

Local sideload is intended for development and private testing.

Rules:

- developer mode must be enabled before local script plugins can run
- drag the whole plugin folder into `Settings -> Plugins -> Developer`
- the folder must contain exactly one `plugin.json` at the plugin root
- if the folder also contains nested example manifests, Cerebr prefers the shallowest `plugin.json` and ignores deeper ones under that selected root
- local sideload currently supports script plugins only
- supported script scopes are `page`, `shell`, and `background`
- `background` plugins only run in the browser extension host and must set `requiresExtension: true`
- dropped local `shell` plugins in the extension host run inside the sandboxed guest runtime and must stay self-contained

## Script entry resolution

For local sideloaded script plugins:

- `script.entry` is resolved relative to `plugin.json`
- relative imports inside the plugin folder stay relative to the plugin folder
- bare imports like `lodash` are rejected
- cross-origin script imports are rejected
- dropped local `shell` plugins should use relative imports only
- dropped local `shell` plugins should keep structured assets as local JS/JSON modules instead of runtime fetches against `import.meta.url`

For reviewed marketplace packages:

- `plugin.json` is fetched from `install.packageUrl`
- `script.entry` is resolved relative to that fetched `plugin.json`
- `script.entry` must stay on the same origin as the package manifest
- remote script packages should be self-contained

## Manifest guidance

New packages should prefer:

- `schemaVersion: 2`
- explicit `activationEvents`
- declarative `contributions` instead of legacy `declarative.type` when shipping a new data-only package

## Declarative package notes

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

## Registry payload

Registry entries need:

- `id`
- `kind`
- `scope`
- `displayName`
- `description`
- `latestVersion`

Package entries for `script` and `declarative` plugins also need:

- `install.mode: "package"`
- `install.packageUrl`

Optional metadata that the refactored host understands:

- `activationEvents`
- `contributionTypes`

## Suggested release checklist

1. Run `npm run check`.
2. Verify that `plugin.json` and the exported plugin object use the same id.
3. Verify that your permissions match the APIs or declarative surfaces you actually use.
4. Verify that `activationEvents` are narrow and intentional.
5. Verify that `requiresExtension` is set correctly.
6. Verify that `script.entry` points at the published file.
7. If you publish a registry entry, make sure `install.packageUrl` points to the versioned `plugin.json`.

## Compatibility baseline

The template examples currently target:

```text
>=2.4.86 <3.0.0
```
