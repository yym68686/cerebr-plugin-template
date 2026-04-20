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
  setup(context) {
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
- `setup(context)`: required

`setup(context)` may return:

- a cleanup function
- an object with `dispose()`
- nothing

## Unified runtime context

`setup(context)` receives a stable runtime context object:

- `context.api`: the namespaced host services (`page`, `shell`, `chat`, `ui`, ...)
- `context.capabilities`: alias of `context.api`
- `context.permissions`: `{ granted, has(), assert() }`
- `context.plugin`: normalized plugin metadata
- `context.runtime`: runtime metadata such as `host`, `isExtension`, `isGuest`
- `context.env`: normalized host flags for fast checks
- `context.diagnostics`: preflight and host diagnostics

For compatibility, Cerebr still exposes the service namespaces at the top level. These are equivalent:

```js
setup({ api }) {
  api.shell.open();
}
```

```js
setup({ shell }) {
  shell.open();
}
```

## Plugin-local i18n resources

Plugins can now ship private locale resources in `plugin.json`:

```json
"nameKey": "my_plugin.name",
"descriptionKey": "my_plugin.description",
"i18n": {
  "defaultLocale": "en",
  "messages": {
    "en": {
      "my_plugin.name": "My Plugin"
    }
  },
  "locales": {
    "zh-CN": "./locales/zh-CN.json"
  }
}
```

Resolution order is:

1. plugin-local `i18n.messages` / `i18n.locales`
2. host locale messages
3. the explicit fallback string passed to `getMessage(...)`

`getLocale()` and `getMessage(...)` are synchronous runtime APIs. `getMessage(...)` returns the resolved string directly in page, shell, background, and guest-proxied runtimes; do not `await` it.

Use localized keys for:

- `nameKey`
- `descriptionKey`
- `contentKey` in prompt fragments
- `labelKey` / `titleKey` / `promptKey` / `messageKey` in declarative contributions

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

Extension-hosted local or marketplace `page` script plugins now run on Cerebr's managed `user_script` execution surface when the host deems them compatible. Plugin authors should keep using `setup(context)` plus the stable `context.api.page / site / ui / shell / bridge` namespaces. Do not call `chrome.userScripts` directly from plugin code.

If Chrome reports `userscripts-toggle-disabled`, the host is telling you that the user still needs to enable **Allow User Scripts** for the Cerebr extension in `chrome://extensions`.

`context.api.page`

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

`context.api.i18n`

- `getLocale()`
- `getMessage(key, substitutions, fallback)`
- `onLocaleChanged(callback, options)`

`context.api.site`

- `query(selector)`
- `queryAll(selector)`
- `fill(selector, value)`
- `click(selector)`
- `observe(selector, callback, options)`

`context.api.ui`

- `showAnchoredAction(config)`
- `mountSlot(slotId, renderer, options)`
- `getAvailableSlots()`

`context.api.shell`

- `isOpen()`
- `open()`
- `toggle()`
- `focusInput()`
- `setDraft(text)`
- `insertText(text, options)`
- `importText(text, options)`

`context.api.bridge`

- `send(target, command, payload)`

## Shell script APIs

`context.api.browser`

- `getCurrentTab()`

`context.api.editor`

- `focus()`
- `blur()`
- `getDraft()`
- `getDraftSnapshot()`
- `hasDraft()`
- `setDraft(text)`
- `insertText(text, options)`
- `importText(text, options)`
- `clear()`

`context.api.chat`

- `getCurrentChat()`
- `getMessages()`
- `getRenderedTranscript()`
- `sendDraft()`
- `abort()`
- `regenerate(messageElement)`
- `retry(reason, options)`
- `cancel(reason)`

For `shell` plugins running in the guest runtime, `getCurrentChat()`, `getMessages()`, and `getRenderedTranscript()` are bridged back to the host and keep the same return shapes as the normal shell runtime.

`context.api.prompt`

- `addFragment(fragment)`
- `removeFragment(fragmentId)`
- `listFragments()`

`context.api.ui`

- `showToast(message, options)`
- `copyText(text)`
- `mountSlot(slotId, renderer, options)`
- `getAvailableSlots()`

`context.api.bridge`

- `send(target, command, payload)`

`context.api.storage`

- `get(keys, options)`
- `set(items, options)`
- `remove(keys, options)`

`context.api.i18n`

- `getLocale()`
- `getMessage(key, substitutions, fallback)`
- `onLocaleChanged(callback, options)`

`getMessage(...)` returns a string immediately. `onLocaleChanged(...)` keeps guest and non-guest shell runtimes aligned with the active host locale.

`context.api.shell`

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

Menu items passed to `setMenuItems(items)` can provide either `icon` (plain text) or `iconSvg` (sanitized inline SVG). Use `iconPlacement: 'leading'` for a left-side icon, or `iconPlacement: 'disclosure'` to replace the right-side chevron.

Host-rendered pages exposed via `openPage(page)` / `updatePage(page)` and observed through `onPageEvent(callback)` can emit:

- `open`
- `close`
- `action`
- `change`
- `reorder`

Sortable host lists use `{ kind: 'list', sortable: true }`. The host keeps inline row bodies attached while items move, reorders the DOM live during drag, and defaults to `dragPreview: 'inline'`, which runs host-managed pointer sorting instead of a browser drag session. That avoids browser-native ghost images, link/text drag decoration, and OS drag badges before the reorder commit lands. Set `dragPreview: 'native'` only if you explicitly want browser drag behavior. Sortable lists also accept `dragHandle: 'comfortable' | 'compact'` to control the host drag affordance size, `sortingStyle: 'emphasized' | 'default'` to tune how strongly the host de-emphasizes non-dragging rows during live reorder, and `dropIndicator: 'none' | 'line'` to control the legacy insertion marker. Sortable lists emit a `reorder` payload through `onPageEvent(...)` with `listId`, `itemId`, `targetItemId`, `fromIndex`, `toIndex`, `orderedItemIds`, and current `values`. List items can also provide `token` for an inline command-style pill and `body` for nested host-rendered sections such as inline forms and action rows.

## Background script APIs

`context.api.browser`

- `getCurrentTab()`
- `getTab(tabId)`
- `queryTabs(query)`
- `reloadTab(tabId, options)`
- `sendMessage(tabId, message)`

`context.api.storage`

- `get(keys, options)`
- `set(items, options)`
- `remove(keys, options)`

`context.api.bridge`

- `send(target, command, payload)`
- `sendToTab(tabId, target, command, payload)`
- `broadcast(target, command, payload, options)`

`context.api.i18n`

- `getLocale()`
- `getMessage(key, substitutions, fallback)`
- `onLocaleChanged(callback, options)`

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
