# API Reference

This file documents the current Cerebr plugin runtime contract exposed by the host.

## Script plugin module contract

Every script plugin must export a plugin object.

The safest default is a plain self-contained module:

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

`definePlugin(...)` is optional. If you use a helper wrapper, bundle it into your own plugin folder. Do not import Cerebr private helpers from `/src/...` in dropped local `shell` plugins.

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

## Manifest localization keys

`plugin.json` and registry entries can also carry host-facing localization keys:

- `nameKey`
- `descriptionKey`
- `availability.reasonKey` in registry entries
- `declarative.contentKey` for prompt fragments

Use these when the actual plugin package is distributed with locale resources and the host should resolve text through its i18n layer.

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
- `mountSlot(slotId, renderer, options)`
- `getAvailableSlots()`

Use `shell.input.after` for compact inline controls.
Use `shell.input.row.after` for full-width composer toolbars or panels.

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

### Host-rendered shell surfaces

#### `shell.setInputActions(actions)`

Each action item can include:

- `id`
- `label`
- `icon`
- `title`
- `order`
- `disabled`
- `variant` when supported by the current host

Use this when you want Cerebr to render native buttons below the composer and send clicks back through `onInputAction(...)`.

#### `shell.setSlashCommands(commands, options)`

Use this when your plugin needs `/` command behavior inside the composer and you want the host to own:

- suggestion UI
- keyboard selection with `ArrowUp`, `ArrowDown`, `Enter`, `Escape`
- IME/composition safety
- draft replacement when a command is selected

Each slash command descriptor can include:

- `id`
- `name`
- `label`
- `description`
- `aliases`
- `prompt`
- `separator`
- `order`
- `disabled`

Options currently support:

- `emptyText`

Selection events come back through `onSlashCommandEvent(callback)`.

#### `shell.setMenuItems(items)`

Each menu item can include:

- `id`
- `label`
- `icon`
- `title`
- `order`
- `disabled`

Use this for first-level entries inside the Cerebr settings/navigation menu.

`shell.openPage(page)` and `shell.updatePage(page)` accept either:

- a mount-backed page: Cerebr reuses the plugin's mounted shell surface as the page body
- a host-rendered page: pass `page.view` so Cerebr renders cards, forms, lists, and actions directly in the host document

Useful page fields:

- `id`
- `title`
- `subtitle`
- `view`
- `viewStateKey`
- `resetViewState`

Recommended page strategy:

- put page title/subtitle in `page.title` and `page.subtitle`
- prefer `card` sections for most settings pages
- use `columns` only when the host page is genuinely wide enough for split-pane management
- avoid duplicating the shell page header with another large in-page title block

Host-rendered page sections:

- `card`
- `columns`
- `hero` (use sparingly; prefer the shell page header for title/subtitle)

Host-rendered content nodes:

- `text`
- `note`
- `stats`
- `badges`
- `actions`
- `form`
- `list`

Host-rendered form field descriptors support:

- `id`
- `label`
- `type`
- `value`
- `placeholder`
- `description`
- `disabled`
- `span`
- `rows` for `textarea`
- `options` for `select`

Host-rendered action descriptors support:

- `id`
- `label`
- `icon`
- `title`
- `variant`
- `kind`
- `disabled`
- `confirm`
- `accept`
- `multiple`
- `data`

Host-rendered list items support:

- `id`
- `title`
- `description`
- `meta`
- `selected`
- `badges`
- `actionId`
- `actions`

Host-rendered pages automatically use Cerebr's native settings-page design system. Plugins should declare structure and interaction state, not custom page CSS.

Plugin permissions are normalized by the host. Legacy aliases such as `tabs:active` and `storage:local` are expanded to canonical capability names automatically, and namespace wildcards like `shell:*` or `page:*` are supported for advanced internal plugins.

`onPageEvent(callback)` can receive:

- lifecycle events: `open`, `close`
- interaction events from host-rendered pages: `action`, `change`

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
- shell hooks receive `browser`, `editor`, `chat`, `prompt`, `ui`, `bridge`, `storage`, `i18n`, `shell`
- background hooks receive `browser`, `storage`, `bridge`, `background`

Shell hook contexts also expose `directives` used internally for retry, cancel, and per-request prompt fragments.

## Prompt fragments

Prompt fragments support:

- `id`
- `content`
- `contentKey`
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
- For dropped local `shell` plugins, prefer local JS/JSON module imports over `fetch(new URL('./file.json', import.meta.url))` so the guest runtime can keep the package self-contained.
