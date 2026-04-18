const PLUGIN_ID = 'template.shell.quick-insert';
const PAGE_ID = `${PLUGIN_ID}:page`;

function buildSlashCommands() {
    return [
        {
            id: 'preset-short',
            name: 'brief',
            label: 'Brief Answer',
            description: 'Insert the concise-answer draft scaffold with native slash command UX.',
            prompt: createDraftText('short'),
            order: 10,
        },
        {
            id: 'preset-detailed',
            name: 'detail',
            label: 'Detailed Answer',
            description: 'Insert the detailed implementation scaffold with native slash command UX.',
            prompt: createDraftText('detailed'),
            order: 20,
        },
    ];
}

function buildPageModel({ source = 'menu', preset = 'short' } = {}) {
    const presetMeta = preset === 'detailed'
        ? {
            title: 'Detailed Draft',
            summary: 'Ask for a short answer first, then expand into implementation details and edge cases.',
        }
        : {
            title: 'Short Draft',
            summary: 'Ask for a short answer first, then expand into the important details.',
        };

    return {
        id: PAGE_ID,
        title: 'Quick Insert',
        subtitle: source === 'menu'
            ? 'Opened from the Cerebr settings menu'
            : 'Opened from a native composer action',
        viewStateKey: `${source}:${preset}`,
        view: {
            sections: [
                {
                    kind: 'card',
                    title: 'Overview',
                    description: 'This page is rendered by Cerebr itself. The plugin only sends page schema and receives interaction events back.',
                    variant: 'highlight',
                    body: [
                        {
                            kind: 'stats',
                            items: [
                                { label: 'Renderer', value: 'Host-native', tone: 'primary' },
                                { label: 'Preset', value: presetMeta.title, tone: 'success' },
                            ],
                        },
                        {
                            kind: 'note',
                            icon: '✨',
                            tone: 'primary',
                            title: 'Native settings styling',
                            text: 'Forms, lists, actions, and callouts use the host design system automatically, so plugins do not need to ship custom page CSS.',
                        },
                        {
                            kind: 'actions',
                            actions: [
                                {
                                    id: 'insert',
                                    label: 'Insert Draft',
                                    icon: '⚡',
                                    variant: 'primary',
                                },
                                {
                                    id: 'close',
                                    label: 'Close',
                                    variant: 'secondary',
                                },
                            ],
                        },
                    ],
                },
                {
                    kind: 'columns',
                    columns: [
                        [
                            {
                                kind: 'card',
                                title: 'Preset',
                                description: 'Switch between two host-rendered presets without touching host DOM.',
                                body: [
                                    {
                                        kind: 'note',
                                        icon: '⌘',
                                        tone: 'muted',
                                        title: 'Host-rendered controls',
                                        text: 'Use actions and forms for structure, then let Cerebr handle the visual system.',
                                    },
                                    {
                                        kind: 'actions',
                                        actions: [
                                            {
                                                id: 'preset:short',
                                                label: 'Short',
                                                variant: preset === 'short' ? 'primary' : 'secondary',
                                            },
                                            {
                                                id: 'preset:detailed',
                                                label: 'Detailed',
                                                variant: preset === 'detailed' ? 'primary' : 'secondary',
                                            },
                                        ],
                                    },
                                    {
                                        kind: 'text',
                                        text: presetMeta.summary,
                                        tone: 'muted',
                                    },
                                ],
                            },
                        ],
                        [
                            {
                                kind: 'card',
                                title: 'What this example uses',
                                description: 'This mirrors the recommended shell integration pattern.',
                                body: [
                                    {
                                        kind: 'list',
                                        items: [
                                            {
                                                id: 'actions',
                                                title: '`shell.setInputActions()`',
                                                description: 'Render native buttons below the composer.',
                                            },
                                            {
                                                id: 'slash',
                                                title: '`shell.setSlashCommands()`',
                                                description: 'Let the host own `/` picker UI, keyboard handling, and IME behavior.',
                                            },
                                            {
                                                id: 'menu',
                                                title: '`shell.setMenuItems()`',
                                                description: 'Expose a first-level settings entry.',
                                            },
                                            {
                                                id: 'page',
                                                title: '`shell.openPage({ view })`',
                                                description: 'Let Cerebr render the management page.',
                                            },
                                            {
                                                id: 'prompt',
                                                title: '`prompt.addFragment()`',
                                                description: 'Add a persistent prompt rule.',
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    ],
                },
            ],
        },
    };
}

function createDraftText(preset = 'short') {
    if (preset === 'detailed') {
        return 'Please answer with a concise summary first, then expand into the important implementation details, tradeoffs, and edge cases.';
    }

    return 'Please answer with a one-paragraph summary first, then add the important details.';
}

export default {
    id: PLUGIN_ID,
    displayName: 'Quick Insert Template',
    setup({ api, diagnostics }) {
        let pageState = {
            source: 'menu',
            preset: 'short',
        };
        void diagnostics;

        const fragmentHandle = api.prompt.addFragment({
            id: `${PLUGIN_ID}:default-fragment`,
            placement: 'system.append',
            priority: 0,
            content: 'Start with a short answer, then expand into the important details.',
        });

        const openHostPage = async (source = 'menu') => {
            pageState = {
                ...pageState,
                source,
            };
            await api.shell.openPage(buildPageModel(pageState));
        };

        const applyPreset = (preset) => {
            pageState = {
                ...pageState,
                preset,
            };
            void api.shell.updatePage(buildPageModel(pageState));
        };

        const insertDraft = () => {
            api.editor.importText(createDraftText(pageState.preset), {
                separator: '\n\n',
            });
            api.ui.showToast(`Inserted ${pageState.preset} draft scaffold`);
        };

        const stopInputActions = api.shell.onInputAction((event) => {
            if (event?.actionId === 'insert') {
                insertDraft();
            }

            if (event?.actionId === 'page') {
                void openHostPage('action');
            }
        });

        const stopMenuActions = api.shell.onMenuAction((event) => {
            if (event?.itemId === 'page') {
                void openHostPage('menu');
            }
        });

        const stopPageEvents = api.shell.onPageEvent((event) => {
            if (event?.type === 'action') {
                if (event.actionId === 'insert') {
                    insertDraft();
                } else if (event.actionId === 'close') {
                    void api.shell.closePage('button');
                } else if (event.actionId === 'preset:short') {
                    applyPreset('short');
                } else if (event.actionId === 'preset:detailed') {
                    applyPreset('detailed');
                }
            }
        });

        const stopSlashEvents = api.shell.onSlashCommandEvent((event) => {
            if (event?.type === 'select' && event.command?.name) {
                api.ui.showToast(`Expanded /${event.command.name}`);
            }
        });

        api.shell.setInputActions([
            {
                id: 'insert',
                label: 'TL;DR',
                icon: '⚡',
                title: 'Insert a concise-answer draft scaffold',
                order: 10,
            },
            {
                id: 'page',
                label: 'Quick Insert',
                icon: '🧩',
                title: 'Open the host-managed plugin page',
                order: 20,
            },
        ]);

        api.shell.setSlashCommands(buildSlashCommands());

        api.shell.setMenuItems([
            {
                id: 'page',
                label: 'Quick Insert',
                icon: '🧩',
                title: 'Open the Quick Insert plugin page',
                order: 60,
            },
        ]);

        return () => {
            stopInputActions?.();
            stopMenuActions?.();
            stopPageEvents?.();
            stopSlashEvents?.();
            api.shell.clearInputActions();
            api.shell.clearSlashCommands();
            api.shell.clearMenuItems();
            void api.shell.closePage('plugin-stop');
            fragmentHandle?.dispose?.();
        };
    },
};
