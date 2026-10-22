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

`getDraftSnapshot()` returns `{ text, imageTags, quotes, empty }`. `quotes` is an array of selected-text strings displayed above the text editor. A quote-only draft has `empty: false`. Image-only drafts have `empty: false`. Inside a guest runtime, `imageTags` is an array of serializable `{ dataUrl, fileName }` records; it never contains host DOM nodes. Trusted host-side runtimes receive the editor's image-tag nodes. Use the serializable guest API for self-contained plugins. Drafts now retain image attachments when switching chats or reloading.

The composer displays images in a separate attachment area above the text editor. Read attachments through `getDraftSnapshot()`; do not query the editable DOM for image nodes. `clear()` and `setDraft(text)` replace the whole draft, including attachments. `insertText()` / `importText()` preserve attachments. The optional `quotes` snapshot field is also serializable in guest runtimes. `clear()` and `setDraft(text)` clear quotes, while `insertText()` / `importText()` preserve existing quotes. Do not query or mutate the quote shelf DOM.

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

User messages sent with quoted selections may include `selectionQuotes` (string array) and `selectionQuestion` (string). The ordinary `content` still contains the complete quoted text and question, so request hooks and exports remain self-contained. These metadata fields only split their visual presentation; do not depend on them being present on older messages.

`getCurrentChat()` may include the optional ISO timestamp `lastUserMessageAt`, which the host uses to order chats. It advances when a new user message is appended; opening a chat, editing messages, renaming it, or streaming/regenerating an answer does not advance it. Older chats retain their previous sort time until the next new question, so this field is not a reliable historical send timestamp for migrated data. `updatedAt` still tracks content changes and must not be used to infer sidebar order. Treat these host-managed fields as read-only.

It may also include `modelSelection: { configId: string, modelName: string }`, the conversation's model binding. It contains no API key. The host synchronizes this binding with the chat, independently of the device's default model for future chats. Opening a chat or synchronizing API configurations does not change the device default. Older chats may omit the field until the user selects a model or actually sends a request; merely viewing legacy history does not persist or broadcast an inferred binding. do not infer their historic model from the current default or write this field directly. Request hooks receive the effective conversation API configuration in their existing `apiConfig` context, including for retries and regeneration.

`sendDraft()` and `regenerate(messageElement)` return a promise for the chat request lifecycle, not a disk-write acknowledgement. Once the request finishes or is stopped, the host releases its request lock and starts an immediate background save; storage delays or failures must not block the next send, retry, or chat navigation. Failed chat writes remain queued for automatic retry. Plugins can read the current in-memory messages with `getMessages()`, but must not treat a successful request result as a guarantee that those messages are already persisted. The host reports save failures to the user.

Requests are scoped to the conversation that was active when `sendDraft()` or `regenerate()` was called. Switching chats does not cancel its response; multiple conversations can stream concurrently. `abort()` stops only the currently selected conversation. Lifecycle hooks can run interleaved across conversations: use their `chatId` and request context rather than `getCurrentChat()` to identify the originating conversation. The latter always describes the conversation currently visible in the UI. A terminal SSE `[DONE]` or `finish_reason` settles the request even if the server keeps its HTTP connection open.

Rendered transcript snapshots preserve Markdown reasoning as native HTML `<details>` / `<summary>` so exported pages can expand it without host React handlers. Transient loading animations and live elapsed timers are excluded. Consumers should treat `html` as self-contained content and should not depend on private host collapse selectors. The snapshot return fields are unchanged.

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

These menu entries appear in the conversation/management section of the floating composer's **+** menu. The upper section adds images and webpage references. Its webpage picker replaces the menu contents in the same popover; plugin menu nodes remain mounted while hidden. Composer actions and the existing input slots remain available; add-ons must fit the responsive composer width and should not assume an edge-to-edge input bar. The host can move a multiline editor above its controls without remounting the editor or plugin slots.

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

Before `onBeforeSend`, the host collects all selected webpage/PDF content into `payload.webpageInfo.pages`. If a selected page cannot be read, the send is stopped with the draft preserved and the unavailable page identified; request hooks and the model are not called with silently incomplete context. With no pages selected, ordinary chat remains available. Webpage sources are explicitly selected per chat and remain selected after sending. A new chat starts without webpage references; the current browser tab is not implicitly included. Removing the last source returns to ordinary chat. Source chips are separate from editor drafts: `getDraftSnapshot()` still returns only message text and image attachments. PDF extraction does not require opening Cerebr's sidebar in each source tab.

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

## React host rendering

The host shows chat navigation beside the conversation on wide screens and as a full-screen navigation view on narrow screens. Conversation content and the composer share a bounded reading width. Existing slot IDs and APIs are unchanged; mounted content must adapt to the available width and must not assume that the conversation begins at the left edge of the viewport. Chat folder membership is navigation metadata and does not change message payloads.

Cerebr's host UI is rendered with React and built with Vite. Plugins continue to use the documented SDK: no React dependency is required for a plugin. Do not import host `/src` modules or mutate the host's React DOM. Use `openPage({ view })`, menu/input actions and slots. A plugin still owns the DOM or iframe node it mounts; closing a host page or modal restores that same node to its slot.

Host page updates preserve edited field values when descriptor defaults are unchanged, and honor `resetViewState` / `viewStateKey`. `showModal()` still returns its panel element synchronously; page/modal updates and dismissal commit their host surface before returning, including restoration of a mounted node. Slash-command selection events include the original trailing text, and the host preserves native editor composition, undo and selection behavior.

Default tutorial messages can be edited and deleted through the host message menu. Editing removes their seed-localization metadata, so future language changes preserve user edits. `chat.regenerate(messageElement)` continues to exclude an untouched tutorial message, but accepts an edited assistant message even when its preceding user question is still a tutorial seed. This does not change the method signature or required permissions.

For host development, run the Cerebr build before reloading the extension. A repository-root installation serves its compiled runtime from `dist/`; a packaged extension serves the same files from its root. Relative local sideload paths are resolved against this compiled resource directory. Guest URLs and the bundled marketplace are resolved by the host; self-contained plugins should continue using the SDK and manifest-relative package paths rather than hard-coding a host `/src` or `/dist` path. Permissions and registry schemas are unchanged.

The host supplies Selection Actions in chat and, by default, on webpages. The webpage-only preference can disable the host toolbar without disabling chat selections or third-party selection contributions. The legacy built-in single selection button is superseded by this host toolbar; third-party `watchSelection` and `showAnchoredAction` APIs are unchanged. Host settings and input controls use neutral surfaces without accent focus borders; keyboard buttons retain a neutral focus cue.
