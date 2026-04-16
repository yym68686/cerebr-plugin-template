import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const pluginKinds = new Set(['builtin', 'declarative', 'script']);
const pluginScopes = new Set(['page', 'shell', 'prompt', 'background']);
const scriptScopes = new Set(['page', 'shell', 'background']);
const declarativeTypes = new Set(['prompt_fragment', 'request_policy', 'page_extractor']);
const promptPlacements = new Set(['system.prepend', 'system.append']);
const extractorStrategies = new Set(['replace', 'prepend', 'append']);
const registryAvailability = new Set(['active', 'disabled']);

function toPosix(relativePath) {
    return relativePath.split(path.sep).join('/');
}

function isObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function listDefaultTargets() {
    const targets = [];

    function walk(currentPath) {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
                continue;
            }

            if (entry.name === 'plugin.json' || entry.name === 'plugin-registry.json') {
                targets.push(fullPath);
            }
        }
    }

    walk(projectRoot);
    return targets.sort();
}

function assert(condition, message, errors) {
    if (!condition) {
        errors.push(message);
    }
}

function validatePluginManifest(manifest, filePath) {
    const errors = [];
    const relativeFile = toPosix(path.relative(projectRoot, filePath));

    assert(isObject(manifest), `${relativeFile}: manifest must be an object`, errors);
    if (errors.length > 0) {
        return errors;
    }

    const id = String(manifest.id ?? '').trim();
    const version = String(manifest.version ?? '').trim();
    const kind = String(manifest.kind ?? '').trim();
    const scope = String(manifest.scope ?? '').trim();
    const displayName = String(manifest.displayName ?? '').trim();
    const description = String(manifest.description ?? '').trim();

    assert(Number(manifest.schemaVersion) === 1, `${relativeFile}: schemaVersion must be 1`, errors);
    assert(id.length > 0, `${relativeFile}: id is required`, errors);
    assert(version.length > 0, `${relativeFile}: version is required`, errors);
    assert(pluginKinds.has(kind), `${relativeFile}: unsupported kind "${kind}"`, errors);
    assert(pluginScopes.has(scope), `${relativeFile}: unsupported scope "${scope}"`, errors);
    assert(displayName.length > 0, `${relativeFile}: displayName is required`, errors);
    assert(description.length > 0, `${relativeFile}: description is required`, errors);

    if (scope === 'background') {
        assert(
            manifest.requiresExtension === true,
            `${relativeFile}: background plugins must set requiresExtension to true`,
            errors
        );
    }

    if (kind === 'script') {
        assert(scriptScopes.has(scope), `${relativeFile}: script plugins must target page, shell, or background`, errors);
        assert(isObject(manifest.script), `${relativeFile}: script plugins need a script block`, errors);

        const entry = String(manifest.script?.entry ?? '').trim();
        assert(entry.length > 0, `${relativeFile}: script.entry is required`, errors);

        if (entry && !/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(entry) && !entry.startsWith('/')) {
            const resolvedEntry = path.resolve(path.dirname(filePath), entry);
            assert(fs.existsSync(resolvedEntry), `${relativeFile}: missing script entry "${entry}"`, errors);
        }
    }

    if (kind === 'declarative') {
        const declarative = manifest.declarative;
        assert(isObject(declarative), `${relativeFile}: declarative plugins need a declarative block`, errors);

        const type = String(declarative?.type ?? '').trim();
        assert(declarativeTypes.has(type), `${relativeFile}: unsupported declarative type "${type}"`, errors);

        if (type === 'prompt_fragment') {
            assert(
                scope === 'prompt' || scope === 'shell',
                `${relativeFile}: prompt_fragment plugins must target prompt or shell`,
                errors
            );
            assert(
                promptPlacements.has(String(declarative?.placement ?? '').trim()),
                `${relativeFile}: prompt_fragment needs placement system.prepend or system.append`,
                errors
            );
            assert(
                String(declarative?.content ?? '').trim().length > 0,
                `${relativeFile}: prompt_fragment needs content`,
                errors
            );
        }

        if (type === 'request_policy') {
            assert(scope === 'shell', `${relativeFile}: request_policy plugins must target shell`, errors);

            const hasPromptFragments = declarative?.promptFragments !== undefined;
            const hasRequestPatch = isObject(declarative?.requestPatch) && Object.keys(declarative.requestPatch).length > 0;
            const hasRetry = isObject(declarative?.retry) && Array.isArray(declarative.retry.onErrorCodes) && declarative.retry.onErrorCodes.length > 0;
            const hasCancel = isObject(declarative?.cancel) && (
                String(declarative.cancel.draftMatches ?? '').trim().length > 0 ||
                (Array.isArray(declarative.cancel.draftIncludes) && declarative.cancel.draftIncludes.length > 0)
            );

            assert(
                hasPromptFragments || hasRequestPatch || hasRetry || hasCancel,
                `${relativeFile}: request_policy needs promptFragments, requestPatch, retry, or cancel`,
                errors
            );
        }

        if (type === 'page_extractor') {
            assert(scope === 'page', `${relativeFile}: page_extractor plugins must target page`, errors);

            const strategy = String(declarative?.strategy ?? 'replace').trim();
            assert(
                extractorStrategies.has(strategy),
                `${relativeFile}: page_extractor strategy must be replace, prepend, or append`,
                errors
            );
        }
    }

    return errors;
}

function validateRegistryManifest(registry, filePath) {
    const errors = [];
    const relativeFile = toPosix(path.relative(projectRoot, filePath));

    assert(isObject(registry), `${relativeFile}: registry payload must be an object`, errors);
    if (errors.length > 0) {
        return errors;
    }

    assert(Number(registry.schemaVersion) === 1, `${relativeFile}: schemaVersion must be 1`, errors);
    assert(String(registry.registryId ?? '').trim().length > 0, `${relativeFile}: registryId is required`, errors);
    assert(String(registry.displayName ?? '').trim().length > 0, `${relativeFile}: displayName is required`, errors);
    assert(String(registry.generatedAt ?? '').trim().length > 0, `${relativeFile}: generatedAt is required`, errors);
    assert(Array.isArray(registry.plugins), `${relativeFile}: plugins must be an array`, errors);

    for (const [index, entry] of (registry.plugins || []).entries()) {
        const label = `${relativeFile}: plugins[${index}]`;
        assert(isObject(entry), `${label} must be an object`, errors);
        if (!isObject(entry)) {
            continue;
        }

        const kind = String(entry.kind ?? '').trim();
        const scope = String(entry.scope ?? '').trim();
        const install = isObject(entry.install) ? entry.install : {};

        assert(String(entry.id ?? '').trim().length > 0, `${label}.id is required`, errors);
        assert(pluginKinds.has(kind), `${label}.kind is invalid`, errors);
        assert(pluginScopes.has(scope), `${label}.scope is invalid`, errors);
        assert(String(entry.displayName ?? '').trim().length > 0, `${label}.displayName is required`, errors);
        assert(String(entry.description ?? '').trim().length > 0, `${label}.description is required`, errors);
        assert(String(entry.latestVersion ?? '').trim().length > 0, `${label}.latestVersion is required`, errors);

        if (isObject(entry.availability) && entry.availability.status !== undefined) {
            assert(
                registryAvailability.has(String(entry.availability.status).trim()),
                `${label}.availability.status must be active or disabled`,
                errors
            );
        }

        if (scope === 'background') {
            assert(entry.requiresExtension === true, `${label}.requiresExtension must be true`, errors);
        }

        if (kind === 'script' || kind === 'declarative') {
            assert(String(install.mode ?? '').trim() === 'package', `${label}.install.mode must be "package"`, errors);
            assert(String(install.packageUrl ?? '').trim().length > 0, `${label}.install.packageUrl is required`, errors);
        }
    }

    return errors;
}

function validateFile(filePath) {
    const parsed = readJson(filePath);
    if (path.basename(filePath) === 'plugin.json') {
        return validatePluginManifest(parsed, filePath);
    }
    if (path.basename(filePath) === 'plugin-registry.json') {
        return validateRegistryManifest(parsed, filePath);
    }
    return [`Unsupported target: ${filePath}`];
}

function main() {
    const cliTargets = process.argv.slice(2).map((target) => path.resolve(projectRoot, target));
    const targets = cliTargets.length > 0 ? cliTargets : listDefaultTargets();
    let failureCount = 0;

    for (const target of targets) {
        const relativeTarget = toPosix(path.relative(projectRoot, target));

        try {
            const errors = validateFile(target);
            if (errors.length === 0) {
                console.log(`OK  ${relativeTarget}`);
                continue;
            }

            failureCount += errors.length;
            console.error(`FAIL ${relativeTarget}`);
            for (const error of errors) {
                console.error(`  - ${error}`);
            }
        } catch (error) {
            failureCount += 1;
            console.error(`FAIL ${relativeTarget}`);
            console.error(`  - ${error.message}`);
        }
    }

    if (failureCount > 0) {
        process.exitCode = 1;
        return;
    }

    console.log(`Validated ${targets.length} manifest file(s).`);
}

main();
