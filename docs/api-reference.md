# API Reference

This file documents the current Cerebr plugin runtime contract exposed by the host.

## Script plugin module contract

Every script plugin must export a plugin object created by `definePlugin(...)`.

```js
import { definePlugin } from '/src/plugin/shared/define-plugin.js';

export default definePlugin({
  id: 'your.plugin.id',
  displayName: 'Optional display name',
  priority: 0,
  hookTimeouts: {
    onBeforeSend: 1600
  },
  setup(api) {
    return () => {};
  }
});
```

## Plugin object fields

- `id`: required and must match `plugin.json`
- `displayName`: optional runtime label
- `priority`: optional number, higher values run first
- `hookTimeouts`: optional per-hook timeout override in milliseconds
- `setup(api)`: required, runs when the plugin starts
- `setup(api)` may return:
  - a cleanup function
  - an object with `dispose()`
  - nothing

## Default hook timeouts

- `onBeforeSend`: `1600`
- `onBuildPrompt`: `900`
- `onRequest`: `900`
- `onResponse`: host default
- `onRequestError`: host default
- `onStreamChunk`: `220`
- `onResponseError`: `900`
- `onAfterResponse`: `900`
- `onBridgeMessage`: `320`
- `onInputChanged`: `220`
- `onPageSnapshot`: `320`
- `onBackgroundReady`: `900`
- `onActionClicked`: `320`
- `onCommand`: `320`
- `onInstalled`: `900`
- `onTabActivated`: `320`
- `onTabUpdated`: `320`
- `onTabRemoved`: `320`
- all other hooks: `1500`

## Host APIs returned from `setup(api)`

### Page script plugins

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

### Shell script plugins

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
- `mountSlot(slotId, renderer, options)`
- `getAvailableSlots()`

`api.bridge`

- `send(target, command, payload)`

`api.shell`

- `isVisible()`
- `open()`
- `close()`
- `toggle()`

### Background script plugins

`api.browser`

- `getCurrentTab()`
- `getTab(tabId)`
- `queryTabs(queryInfo)`
- `reloadTab(tabId, options)`
- `sendMessage(tabId, message)`

`api.storage`

- `get(keys, options)`
- `set(items, options)`
- `remove(keys, options)`

`api.bridge`

- `send(target, command, payload, options)`
- `sendToTab(tabId, target, command, payload)`
- `broadcast(target, command, payload, queryInfo)`

`api.background`

- `isServiceWorker`

## Hook reference

### Shell hooks

- `onBeforeSend(payload, ctx)`
  - Waterfall hook
  - Return a new payload to modify the outgoing send/regenerate request
- `onBuildPrompt(ctx)`
  - Return one fragment or a fragment array
  - You can also call `ctx.prompt.addFragment(...)`
- `onRequest(requestDescriptor, ctx)`
  - Waterfall hook
  - Return a new request descriptor to patch URL, headers, or body
- `onResponse(responseDescriptor, ctx)`
- `onRequestError(error, ctx)`
- `onStreamChunk(chunk, ctx)`
- `onResponseError(error, ctx)`
- `onAfterResponse(result, ctx)`
- `onBridgeMessage(message, ctx)`
- `onInputChanged(draftSnapshot, ctx)`

### Page hooks

- `onBridgeMessage(message, ctx)`
- `onPageSnapshot(snapshot, ctx)`

### Background hooks

- `onBridgeMessage(message, ctx)`
- `onBackgroundReady(ctx)`
- `onActionClicked(tab, ctx)`
- `onCommand(command, ctx)`
- `onInstalled(details, ctx)`
- `onTabActivated(payload, ctx)`
- `onTabUpdated(payload, ctx)`
- `onTabRemoved(payload, ctx)`

## Hook data shapes

### `onBeforeSend(payload, ctx)`

`payload`

- `mode`: `send` or `regenerate`
- `draft`: `{ message, imageTags }` for normal sends
- `userMessage`: the normalized user message if available
- `messages`: current message history
- `apiConfig`
- `userLanguage`
- `webpageInfo`

### `onRequest(requestDescriptor, ctx)` and `onRequestError(error, ctx)`

`requestDescriptor`

- `url`
- `requestBody`
- `requestInit`

### `onResponse(responseDescriptor, ctx)`

`responseDescriptor`

- `response`
- `url`
- `requestBody`
- `requestInit`

### `onStreamChunk(chunk, ctx)`

`chunk`

- `chatId`
- `message`
- `mode`
- `attempt`

### `onAfterResponse(result, ctx)`

`result`

- `content`
- `reasoning_content`

### `onInputChanged(draftSnapshot, ctx)`

`draftSnapshot`

- `text`
- `imageTags`
- `empty`

### `api.page.getSelection()` and `watchSelection(...)`

Selection snapshots contain:

- `text`
- `collapsed`
- `rect`
- `rangeCount`
- `insideEditable`
- `insideCodeBlock`

### `api.page.getSnapshot(options)` and `onPageSnapshot(snapshot, ctx)`

Page snapshots contain:

- `title`
- `url`
- `text`
- `readyState`
- `selection`

`onPageSnapshot(...)` currently runs with `includeText: false`, so call `api.page.getSnapshot({ includeText: true })` if you need full page text.

### Background payloads

`onInstalled(details, ctx)`

- Chrome install/update details
- Cerebr also adds `occurredAt`

`onTabActivated(payload, ctx)`

- `activeInfo`
- `tab`

`onTabUpdated(payload, ctx)`

- `tabId`
- `changeInfo`
- `tab`

`onTabRemoved(payload, ctx)`

- `tabId`
- `removeInfo`

## Hook contexts

All hook contexts include:

- `plugin`: `{ id, manifest }`
- `runtime`: host metadata such as `host`, `isExtension`, and `isServiceWorker` when available

Additional context objects depend on the host:

- page hooks receive `page`, `site`, `ui`, `bridge`, `shell`
- shell hooks receive `editor`, `chat`, `prompt`, `ui`, `bridge`, `shell`
- background hooks receive `browser`, `storage`, `bridge`, `background`

Shell hook contexts also expose `directives` used internally for retry, cancel, and per-request prompt fragments.

## Prompt fragments

Prompt fragments support:

- `id`
- `content`
- `placement`: `system.prepend` or `system.append`
- `priority`

You can register them in two ways:

- persistently in `setup(api)` with `api.prompt.addFragment(...)`
- per request in a hook with `ctx.prompt.addFragment(...)`

## Page extractors

`api.page.registerExtractor(...)` accepts:

- `id`
- `matches`
- `includeSelectors`
- `excludeSelectors`
- `strategy`: `replace`, `prepend`, or `append`
- `priority`
- `maxTextLength`
- `collapseWhitespace`

## Notes

- Higher priority plugins start first and run first.
- Hook failures are isolated and logged by the host runtime.
- If a permission is missing, the runtime throws at the moment the protected API is used.
