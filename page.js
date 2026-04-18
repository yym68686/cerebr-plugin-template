const PLUGIN_ID = 'template.page.selection-helper';
const MIN_SELECTION_LENGTH = 2;
const MAX_SELECTION_LENGTH = 4000;

function normalizeSelectedText(value) {
    return String(value ?? '')
        .replace(/\s+\n/g, '\n')
        .trim();
}

function shouldShowAction(selection) {
    const text = normalizeSelectedText(selection?.text);
    if (!text) return false;
    if (selection?.collapsed) return false;
    if (!selection?.rect) return false;
    if (selection?.insideEditable) return false;
    if (selection?.insideCodeBlock) return false;
    if (text.length < MIN_SELECTION_LENGTH) return false;
    if (text.length > MAX_SELECTION_LENGTH) return false;
    return true;
}

export default {
    id: PLUGIN_ID,
    displayName: 'Selection Helper Template',
    setup({ api }) {
        let actionHandle = null;

        const hideAction = () => {
            actionHandle?.dispose?.();
            actionHandle = null;
        };

        const stopWatchingSelection = api.page.watchSelection((selection) => {
            const text = normalizeSelectedText(selection?.text);
            if (!shouldShowAction(selection)) {
                hideAction();
                return;
            }

            const nextConfig = {
                rect: selection.rect,
                icon: 'dot',
                label: 'Ask Cerebr',
                title: 'Ask Cerebr about this selection',
                onClick() {
                    api.shell.importText(
                        `Please explain the selected text and extract the key points:\n\n${text}`,
                        { focus: true }
                    );
                    api.page.clearSelection();
                    hideAction();
                },
            };

            if (actionHandle) {
                actionHandle.update(nextConfig);
                return;
            }

            actionHandle = api.ui.showAnchoredAction(nextConfig);
        });

        return () => {
            stopWatchingSelection?.();
            hideAction();
        };
    },
};
