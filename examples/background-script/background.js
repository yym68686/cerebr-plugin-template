const PLUGIN_ID = 'template.background.focus-input';

async function focusShellInput(ctx, tabId = null) {
    const normalizedTabId = Number.isFinite(Number(tabId))
        ? Math.floor(Number(tabId))
        : null;
    const resolvedTabId = normalizedTabId ?? (await ctx.browser.getCurrentTab())?.id;

    if (!Number.isFinite(Number(resolvedTabId))) {
        return;
    }

    await ctx.bridge.sendToTab(resolvedTabId, 'shell', 'editor.focus');
}

export default {
    id: PLUGIN_ID,
    displayName: 'Focus Input Template',
    setup(context) {
        void context;
    },
    async onActionClicked(tab, ctx) {
        await focusShellInput(ctx, tab?.id);
    },
    async onCommand(command, ctx) {
        if (command !== 'toggle_sidebar') {
            return;
        }

        await focusShellInput(ctx);
    },
};
