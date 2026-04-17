# API Reference

This file documents the current runtime contract exposed to script plugins.

## Script module contract

Every script plugin exports a plugin object.

```js
export default {
  id: 'your.plugin.id',
  displayName: 'Optional display name',
  priority: 0,
  hookTimeouts: {
    onBeforeSend: 1600
  },
  setup(api) {
    return () => {};
  }
};
```

`definePlugin(...)` is optional. If you use helpers, bundle them into your own plugin folder.

## Plugin object fields

- `id`: required and should match `plugin.json`
- `displayName`: optional runtime label
- `priority`: optional number, higher values run first
- `activationEvents`: optional runtime fallback when the manifest does not provide them
- `hookTimeouts`: optional per-hook timeout override
- `setup(api)`: required

`setup(api)` may return:

- a cleanup function
- an object with `dispose()`
- nothing

## Manifest-level activation

Prefer declaring activation in `plugin.json`:

```json
"activationEvents": ["shell.ready"]
```

Common values:

- `app.startup`
- `page.ready`
- `shell.ready`
- `background.ready`
- `hook:<hookName>`

## Page script APIs

`api.page`

- `getSelection()`
- `getSelectedText()`
- `watchSelection(callback)`
- `clearSelection()`
- `getSnapshot(options)`
- `watchSelectors(selectors, callback, options)`
- `registerExtractor(extractorDefinition)`
- `listExtractors()`
- `query(selector)`
- `queryAll(selector)`
- `getMessage(key, substitutions, fallback)`

`api.site`

- `query(selector)`
- `queryAll(selector)`
- `fill(selector, value)`
- `click(selector)`
- `observe(selector, callback, options)`

`api.ui`

- `showAnchoredAction(config)`
- `mountSlot(slotId, renderer, options)`
- `getAvailableSlots()`

`api.shell`

- `isOpen()`
- `open()`
- `toggle()`
- `focusInput()`
- `setDraft(text)`
- `insertText(text, options)`
- `importText(text, options)`

`api.bridge`

- `send(target, command, payload)`

## Shell script APIs

`api.browser`

- `getCurrentTab()`

`api.editor`

- `focus()`
- `blur()`
- `getDraft()`
- `getDraftSnapshot()`
- `hasDraft()`
- `setDraft(text)`
- `insertText(text, options)`
- `importText(text, options)`
- `clear()`

`api.chat`

- `getCurrentChat()`
- `getMessages()`
- `sendDraft()`
- `abort()`
- `regenerate(messageElement)`
- `retry(reason, options)`
- `cancel(reason)`

`api.prompt`

- `addFragment(fragment)`
- `removeFragment(fragmentId)`
- `listFragments()`

`api.ui`

- `showToast(message, options)`
- `copyText(text)`
- `mountSlot(slotId, renderer, options)`
- `getAvailableSlots()`

`api.bridge`

- `send(target, command, payload)`

`api.storage`

- `get(keys, options)`
- `set(items, options)`
- `remove(keys, options)`

`api.i18n`

- `getLocale()`
- `getMessage(key, substitutions, fallback)`
- `onLocaleChanged(callback, options)`

`api.shell`

- `isVisible()`
- `open()`
- `close()`
- `toggle()`
- `mountInputAddon(renderer, options)`
- `setInputActions(actions)`
- `clearInputActions()`
- `onInputAction(callback)`
- `setSlashCommands(commands, options)`
- `clearSlashCommands()`
- `onSlashCommandEvent(callback)`
- `setMenuItems(items)`
- `clearMenuItems()`
- `onMenuAction(callback)`
- `openPage(page)`
- `updatePage(page)`
- `closePage(reason)`
- `onPageEvent(callback)`
- `showModal(options)`
- `updateModal(options)`
- `hideModal()`
- `requestLayoutSync()`
- `observeTheme(callback, options)`
- `getThemeSnapshot()`

## Background script APIs

`api.browser`

- `getCurrentTab()`
- `getTab(tabId)`
- `queryTabs(query)`
- `reloadTab(tabId, options)`
- `sendMessage(tabId, message)`

`api.storage`

- `get(keys, options)`
- `set(items, options)`
- `remove(keys, options)`

`api.bridge`

- `send(target, command, payload)`
- `sendToTab(tabId, target, command, payload)`
- `broadcast(target, command, payload, options)`

## Hooks

Shell hooks:

- `onBeforeSend`
- `onBuildPrompt`
- `onRequest`
- `onResponse`
- `onRequestError`
- `onStreamChunk`
- `onResponseError`
- `onAfterResponse`

Shared hook:

- `onBridgeMessage`

Background hooks:

- `onBackgroundReady`
- `onActionClicked`
- `onCommand`
- `onInstalled`
- `onTabActivated`
- `onTabUpdated`
- `onTabRemoved`

If a plugin only implements one hook, pair it with `activationEvents: ["hook:<that-hook>"]`.

## Declarative note

Declarative packages do not export a module. Use manifest `contributions` instead. See:

- [../schemas/plugin.schema.json](../schemas/plugin.schema.json)
- [../examples](../examples)
