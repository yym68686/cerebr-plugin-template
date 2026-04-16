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

`ui.showToast(...)` and `editor.*` are currently available without extra manifest permissions.

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
- `shell.settings.section`

### Page slots

- `page.floating`
- `page.selection-bubble`

Use `ui.getAvailableSlots()` if you want to inspect the slots exposed by the current host runtime.

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
