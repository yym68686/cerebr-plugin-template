# Permissions And Slots

This file maps manifest permissions to the runtime APIs they unlock.

## Page runtime permissions

- `page:selection`
  - `page.getSelection()`
  - `page.getSelectedText()`
  - `page.watchSelection(...)`
  - `page.clearSelection()`

- `page:read`
  - `page.getSnapshot(...)`
  - `page.registerExtractor(...)`
  - `page.listExtractors()`
  - `page.query(...)`
  - `page.queryAll(...)`

- `page:observe`
  - `page.watchSelectors(...)`

- `site:read`
  - `site.query(...)`
  - `site.queryAll(...)`

- `site:write`
  - `site.fill(...)`

- `site:click`
  - `site.click(...)`

- `site:observe`
  - `site.observe(...)`

- `shell:input`
  - `shell.open()`
  - `shell.toggle()`
  - `shell.focusInput()`
  - `shell.setDraft(...)`
  - `shell.insertText(...)`
  - `shell.importText(...)`

- `ui:mount`
  - `ui.showAnchoredAction(...)`
  - `ui.mountSlot(...)`

- `bridge:send`
  - `bridge.send(...)`

## Shell runtime permissions

- `chat:read`
  - `chat.getCurrentChat()`
  - `chat.getMessages()`

- `chat:write`
  - `chat.sendDraft()`
  - `chat.abort()`
  - `chat.regenerate(...)`
  - `chat.retry(...)`
  - `chat.cancel(...)`

- `prompt:extend`
  - `prompt.addFragment(...)`
  - hook-level `ctx.prompt.addFragment(...)`

- `prompt:write`
  - alias for operations that can extend prompt state

- `ui:mount`
  - `ui.mountSlot(...)`

- `bridge:send`
  - `bridge.send(...)`

- `shell:input`
  - `shell.mountInputAddon(...)`
  - `shell.setInputActions(...)`
  - `shell.clearInputActions()`
  - `shell.onInputAction(...)`
  - `shell.setSlashCommands(...)`
  - `shell.clearSlashCommands()`
  - `shell.onSlashCommandEvent(...)`
  - `shell.showModal(...)`
  - `shell.updateModal(...)`
  - `shell.hideModal()`
  - `shell.requestLayoutSync()`

- `shell:menu`
  - `shell.setMenuItems(...)`
  - `shell.clearMenuItems()`
  - `shell.onMenuAction(...)`

- `shell:page`
  - `shell.openPage(...)`
  - `shell.updatePage(...)`
  - `shell.closePage(...)`
  - `shell.onPageEvent(...)`

- `storage:read`
  - `storage.get(...)`

- `storage:write`
  - `storage.set(...)`
  - `storage.remove(...)`

`ui.showToast(...)` and `editor.*` are currently available without extra manifest permissions.
`i18n.getLocale()`, `i18n.getMessage(...)`, and `i18n.onLocaleChanged(...)` are currently available without extra manifest permissions.

## Background runtime permissions

- `tabs:read`
  - `browser.getCurrentTab()`
  - `browser.getTab(...)`
  - `browser.queryTabs(...)`

- `tabs:write`
  - `browser.reloadTab(...)`

- `tabs:message`
  - `browser.sendMessage(...)`

- `storage:read`
  - `storage.get(...)`

- `storage:write`
  - `storage.set(...)`
  - `storage.remove(...)`

- `bridge:send`
  - `bridge.send(...)`
  - `bridge.sendToTab(...)`
  - `bridge.broadcast(...)`

## Slot ids

### Shell slots

- `shell.chat.before`
- `shell.chat.after`
- `shell.input.before`
- `shell.input.after`
- `shell.input.row.after`
- `shell.settings.section`

### Page slots

- `page.floating`
- `page.selection-bubble`

Use `ui.getAvailableSlots()` if you want to inspect the slots exposed by the current host runtime.

Use `shell.input.after` for compact trailing actions that live on the same row as the composer.
Use `shell.input.row.after` for full-width toolbars or panels that should sit under the composer row.
Use `shell.setInputActions()` when you want Cerebr to render native buttons under the composer and only send click events back to the plugin.
Use `shell.setSlashCommands()` when you need native `/` command behavior in the composer and want the host to own keyboard, IME, and picker UI.
Use `shell.setMenuItems()` when a plugin needs a first-level entry inside the Cerebr settings menu.
Use `shell.openPage({ view })` when a plugin needs a settings page or management view that should live inside Cerebr's own page chrome and should be rendered natively by the host.
Use `shell.updatePage({ view, viewStateKey, resetViewState })` to refresh host-rendered page content while keeping or resetting transient form state explicitly.
Use `shell.showModal()` only when the interaction is genuinely modal and should temporarily block the chat area.

## Bridge targets

Current bridge targets:

- `page`
- `shell`
- `background`

## Built-in shell bridge commands

These are the built-in commands already handled by the shell runtime:

- `editor.focus`
- `editor.setDraft`
- `editor.insertText`
- `editor.importText`

Background plugins can send them back into a tab with:

```js
await ctx.bridge.sendToTab(tabId, 'shell', 'editor.focus');
```

Page plugins can use the higher-level `shell.*` helpers instead of sending those bridge commands directly.

## Permissions strategy

- Request the smallest permission set you need.
- Keep `ui:mount` off data-only plugins.
- Use `chat:write` only when you truly need retry, cancel, regenerate, or send control.
- Treat `site:*` permissions as privileged page automation capabilities.
- `background` plugins must set `requiresExtension: true`.

## Capability normalization

The host normalizes manifest permissions before runtime use.

Current legacy aliases:

- `prompt:write` -> `prompt:extend`
- `tabs:active` -> `tabs:read`
- `storage:local` -> `storage:read`, `storage:write`

Namespace wildcards are also supported:

- `shell:*`
- `page:*`
- `site:*`

Wildcards are mostly for internal or experimental plugins. Prefer explicit capabilities for published plugins.

## Preferred UI decision tree

For shell plugins, choose the first surface that fits:

1. `shell.setInputActions()` for native composer buttons
2. `shell.setSlashCommands()` for native `/` picker behavior in the composer
3. `shell.setMenuItems()` for first-level navigation/settings entries
4. `shell.openPage({ view })` for settings, dashboards, and management pages
5. `shell.showModal()` only for truly modal interactions
6. `shell.mountInputAddon()` only when the host cannot render the surface natively

If a plugin page can be expressed as cards, forms, lists, notes, stats, and actions, use a host-rendered page instead of custom plugin CSS.
