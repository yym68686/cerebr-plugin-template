# Permissions And Slots

This file maps manifest permissions to the runtime APIs and host surfaces they unlock.

Prefer the resource-scoped permissions below for all new plugins. Legacy namespace permissions such as `page:selection`, `page:read`, `shell:input`, or `bridge:send` still resolve for compatibility, but they are no longer the recommended baseline.

Runtime notes:

- Cerebr runs a preflight check before activation and refuses obvious host/runtime mismatches early.
- Prefer host-provided capability APIs such as `context.api.ui.copyText(...)` or `context.api.chat.getRenderedTranscript()` over direct browser globals.
- Extension-hosted `page` script plugins run through Cerebr's managed `user_script` execution surface when the manifest is compatible; plugin code should not call `chrome.userScripts` directly.
- If diagnostics report `userscripts-toggle-disabled`, the user still needs to enable **Allow User Scripts** for the Cerebr extension.
- Web-hosted local bundle plugins now load through stable `data:` module URLs by default; do not depend on `blob:` URL lifetime.
- `context.api.i18n` is available on `page`, `shell`, and `background` runtimes, and resolves plugin-private locale resources before host translations.

## Page runtime permissions

- `page:selection:read`
  - `page.getSelection()`
  - `page.getSelectedText()`
  - `page.watchSelection(...)`

- `page:selection:clear`
  - `page.clearSelection()`

- `page:snapshot`
  - `page.getSnapshot(...)`

- `page:extractors`
  - `page.registerExtractor(...)`
  - `page.listExtractors()`

- `page:query`
  - `page.query(...)`
  - `page.queryAll(...)`

- `page:observe:selectors`
  - `page.watchSelectors(...)`

- `site:query`
  - `site.query(...)`
  - `site.queryAll(...)`

- `site:fill`
  - `site.fill(...)`

- `site:click`
  - `site.click(...)`

- `site:observe`
  - `site.observe(...)`

- `shell:input:write`
  - `shell.open()`
  - `shell.toggle()`
  - `shell.focusInput()`
  - `shell.setDraft(...)`
  - `shell.insertText(...)`
  - `shell.importText(...)`

- `ui:anchored-action`
  - `ui.showAnchoredAction(...)`

- `ui:slots`
  - `ui.mountSlot(...)`

- `bridge:send:shell`
  - `bridge.send('shell', ...)`

- `bridge:send:background`
  - `bridge.send('background', ...)`

- `bridge:send:page`
  - `bridge.send('page', ...)`

## Shell runtime permissions

For `shell` plugins running in the guest runtime, the chat read APIs below are still bridged through the host. Permission names and return shapes stay the same.

- `chat:current`
  - `chat.getCurrentChat()`

- `chat:messages`
  - `chat.getMessages()`
  - `chat.getRenderedTranscript()`

- `chat:send`
  - `chat.sendDraft()`

- `chat:abort`
  - `chat.abort()`

- `chat:regenerate`
  - `chat.regenerate(...)`

- `chat:retry`
  - `chat.retry(...)`

- `chat:cancel`
  - `chat.cancel(...)`

- `prompt:fragments`
  - `prompt.addFragment(...)`

- `ui:slots`
  - `ui.mountSlot(...)`

- `bridge:send:page`
  - `bridge.send('page', ...)`

- `bridge:send:background`
  - `bridge.send('background', ...)`

- `shell:input:read`
  - `editor.getDraft()`
  - `editor.getDraftSnapshot()`
  - `editor.hasDraft()`

- `shell:input:write`
  - `editor.focus()`
  - `editor.blur()`
  - `editor.setDraft(...)`
  - `editor.insertText(...)`
  - `editor.importText(...)`
  - `editor.clear()`

- `shell:input:mount`
  - `shell.mountInputAddon(...)`

- `shell:input:actions`
  - `shell.setInputActions(...)`
  - `shell.clearInputActions()`
  - `shell.onInputAction(...)`

- `shell:input:slash-commands`
  - `shell.setSlashCommands(...)`
  - `shell.clearSlashCommands()`
  - `shell.onSlashCommandEvent(...)`

- `shell:input:modal`
  - `shell.showModal(...)`
  - `shell.updateModal(...)`
  - `shell.hideModal()`

- `shell:input:layout`
  - `shell.requestLayoutSync()`

- `shell:menu:items`
  - `shell.setMenuItems(...)`
  - `shell.clearMenuItems()`
  - `shell.onMenuAction(...)`

- `shell:page:control`
  - `shell.openPage(...)`
  - `shell.updatePage(...)`
  - `shell.closePage(...)`
  - `shell.onPageEvent(...)`

- `storage:read:local`
  - `storage.get(...)`

- `storage:write:local`
  - `storage.set(...)`
  - `storage.remove(...)`

- `storage:read:sync`
  - `storage.get(..., { area: 'sync' })`

- `storage:write:sync`
  - `storage.set(..., { area: 'sync' })`
  - `storage.remove(..., { area: 'sync' })`

## Background runtime permissions

- `tabs:query:active`
  - `browser.getCurrentTab()`
  - `browser.queryTabs({ active: true, currentWindow: true })`

- `tabs:get`
  - `browser.getTab(...)`

- `tabs:query`
  - `browser.queryTabs(...)`

- `tabs:reload`
  - `browser.reloadTab(...)`

- `tabs:message`
  - `browser.sendMessage(...)`

- `storage:read:local`
  - `storage.get(...)`

- `storage:write:local`
  - `storage.set(...)`
  - `storage.remove(...)`

- `storage:read:sync`
  - `storage.get(..., { area: 'sync' })`

- `storage:write:sync`
  - `storage.set(..., { area: 'sync' })`
  - `storage.remove(..., { area: 'sync' })`

- `bridge:send:page`
  - `bridge.send('page', ...)`
  - `bridge.sendToTab(tabId, 'page', ...)`
  - `bridge.broadcast('page', ...)`

- `bridge:send:shell`
  - `bridge.send('shell', ...)`
  - `bridge.sendToTab(tabId, 'shell', ...)`
  - `bridge.broadcast('shell', ...)`

- `bridge:send:background`
  - `bridge.send('background', ...)`

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

Use `ui.getAvailableSlots()` to inspect what the current host exposes.

## Activation strategy

Permissions answer "what can this plugin do".
Activation events answer "when should this plugin start".

Recommended pairings:

- page UI helpers: `page.ready`
- shell setup/UI plugins: `shell.ready`
- request modifiers: the specific hook they intercept
- background command handlers: `hook:onActionClicked`, `hook:onCommand`

Do not use `app.startup` unless the plugin really needs eager activation.

## Preferred UI decision tree

For shell plugins, choose the first surface that fits:

1. `shell.setInputActions()`
2. `shell.setSlashCommands()`
3. `shell.setMenuItems()`
4. `shell.openPage({ view })`
5. `shell.showModal()`
6. `shell.mountInputAddon()`

If a plugin page can be expressed as cards, forms, lists, notes, stats, and actions, use a host-rendered page instead of custom plugin CSS.

Host-rendered lists now also support drag sorting and inline expandable rows:

- `{ kind: 'list', sortable: true }` enables mouse drag reordering.
- list items can provide `token` for a compact code-style prefix such as `/translate`.
- list items can provide `body` with nested host-rendered nodes, which is useful for inline editors under the row.
- `shell.onPageEvent(...)` receives `type: 'reorder'` with `orderedItemIds`, `fromIndex`, and `toIndex` after a drag completes.
