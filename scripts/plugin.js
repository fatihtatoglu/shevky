import _cfg from "./config.js";

const cache = new Map();

function normalizePluginName(entry) {
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

            const loaded = await import(resolvedName);
            const instance = loaded?.default ?? loaded;

            if (!instance || typeof instance !== "object") {
                continue;
            }

            const name = typeof instance.name === "string" && instance.name.trim().length > 0
                ? instance.name.trim()
                : resolvedName;

            cache.set(name, instance);
        }
    }
    catch (error) {
        console.warn("Failed to load plugins:", error);
    }
}

const API = {
    load: loadPlugins
};

export default API;
