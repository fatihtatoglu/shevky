import _cfg from "./config.js";
import _npm from "./npm.js";

const cache = new Map();

const HOOKS = Object.freeze({
    CONFIG_LOAD: "config:load",
    ASSETS_LOAD: "assets:load",
    PRECOMPUTE: "precompute",
    DIST_CLEAN: "dist:clean",
    BUILD_CSS: "build:css",
    BUILD_JS: "build:js",
    ASSETS_COPY: "assets:copy",
    CONTENT_PAGE_BEFORE: "content:page:before",
    CONTENT_MARKDOWN: "content:markdown",
    CONTENT_RENDER: "content:render",
    LAYOUT_RENDER: "layout:render",
    PAGE_WRITE: "page:write",
    COLLECTION_PAGINATE: "collection:paginate",
    COLLECTION_DYNAMIC: "collection:dynamic",
    HTML_COPY: "html:copy",
    POSTBUILD: "postbuild"
});

function normalizePluginName(entry) {
    const value = typeof entry === "string" ? entry.trim() : "";
    return value;
}

function normalizeHookName(entry) {
    const value = typeof entry === "string" ? entry.trim() : "";
    return value;
}

async function loadPlugins(names) {
    try {
        const pluginNames = Array.isArray(names) ? names : [];
        for (const pluginName of pluginNames) {
            const resolvedName = normalizePluginName(pluginName);
            if (!resolvedName) {
                continue;
            }

            const fromCwd = _npm.resolve(resolvedName);
            const loaded = fromCwd
                ? await import(fromCwd)
                : await import(resolvedName);
            const instance = loaded?.default ?? loaded;

            if (!instance || typeof instance !== "object") {
                continue;
            }

            const name = typeof instance.name === "string" && instance.name.trim().length > 0
                ? instance.name.trim()
                : resolvedName;

            cache.set(name, instance);
            if (typeof instance.load === "function") {
                await instance.load(_cfg);
            }


        }
    }
    catch (error) {
        console.warn("Failed to load plugins:", error);
    }
}

async function executePlugins(hook, ctx, payload) {
    const hookName = normalizeHookName(hook);
    if (!hookName) {
        return [];
    }

    const results = [];
    for (const [name, plugin] of cache.entries()) {
        if (!plugin || typeof plugin !== "object") {
            continue;
        }

        const hooks = (plugin.hooks && typeof plugin.hooks === "object") ? plugin.hooks : null;
        const handler = hooks?.[hookName];
        if (typeof handler === "function") {
            try {
                results.push(await handler(ctx, payload));
            }
            catch (error) {
                console.warn(`Plugin hook failed: ${name} (${hookName})`, error);
            }
            continue;
        }

        const type = typeof plugin.type === "string" ? plugin.type.trim() : "";
        if (type && type === hookName && typeof plugin.execute === "function") {
            try {
                results.push(await plugin.execute(ctx, payload));
            }
            catch (error) {
                console.warn(`Plugin execute failed: ${name} (${hookName})`, error);
            }
        }
    }

    return results;
}

const API = {
    hooks: HOOKS,
    load: loadPlugins,
    execute: executePlugins
};

export default API;
export { HOOKS };
