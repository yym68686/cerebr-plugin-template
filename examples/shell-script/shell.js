import { definePlugin } from '/src/plugin/shared/define-plugin.js';

const PLUGIN_ID = 'template.shell.quick-insert';

function createActionButton(onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'TL;DR';
    button.title = 'Insert a concise-answer draft scaffold';
    button.style.cssText = [
        'border:1px solid rgba(127,127,127,0.24)',
        'background:transparent',
        'color:inherit',
        'border-radius:999px',
        'padding:4px 10px',
        'font-size:12px',
        'line-height:1.2',
        'cursor:pointer',
    ].join(';');
    button.addEventListener('click', onClick);
    return button;
}

export default definePlugin({
    id: PLUGIN_ID,
    displayName: 'Quick Insert Template',
    setup(api) {
        const fragmentHandle = api.prompt.addFragment({
            id: `${PLUGIN_ID}:default-fragment`,
            placement: 'system.append',
            priority: 0,
            content: 'Start with a short answer, then expand into the important details.',
        });

        const slotHandle = api.ui.mountSlot('shell.input.after', () => {
            const button = createActionButton(() => {
                api.editor.importText(
                    'Please answer with a one-paragraph summary first, then add the important details.',
                    { separator: '\n\n' }
                );
                api.ui.showToast('Inserted a draft scaffold');
            });

            return {
                element: button,
                dispose() {
                    button.remove();
                },
            };
        });

        return () => {
            slotHandle?.dispose?.();
            fragmentHandle?.dispose?.();
        };
    },
});
