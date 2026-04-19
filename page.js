const PLUGIN_ID = 'template.page.selection-helper';
const MIN_SELECTION_LENGTH = 2;
const MAX_SELECTION_LENGTH = 4000;
const ACTION_LABEL_KEY = 'selection_helper.action_label';
const ACTION_TITLE_KEY = 'selection_helper.action_title';
const IMPORT_PROMPT_KEY = 'selection_helper.import_prompt';

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
                label: api.i18n.getMessage(ACTION_LABEL_KEY, [], 'Ask Cerebr'),
                title: api.i18n.getMessage(ACTION_TITLE_KEY, [], 'Ask Cerebr about this selection'),
                onClick() {
                    api.shell.importText(
                        api.i18n.getMessage(
                            IMPORT_PROMPT_KEY,
                            [text],
                            `Please explain the selected text and extract the key points:\n\n${text}`
                        ),
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
