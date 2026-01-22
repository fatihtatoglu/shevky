import _cfg from "./config.js";
import _npm from "./npm.js";
import _log from "./log.js";

const cache = new Map();

const HOOKS = Object.freeze({
  DIST_CLEAN: "dist:clean",
  ASSETS_COPY: "assets:copy"
});

async function loadPlugins(names) {
  try {
    const pluginNames = Array.isArray(names) ? names : [];
    for (const pluginName of pluginNames) {
      const fromCwd = _npm.resolve(pluginName);
      const loaded = fromCwd ? await import(fromCwd) : await import(pluginName);
      const instance = loaded?.default ?? loaded;

      if (!instance || typeof instance !== "object") {
        _log.warn(`Plugin cannot load correctly. Plugin name: ${pluginName}`);
        continue;
      }

      const name = instance.name.trim();
      cache.set(name, instance);

      if (instance.load) {
        instance.load(_cfg);
      }

      _log.debug(`The plugin '${pluginName}' has been loaded.`);
    }
  } catch (error) {
    _log.err("Failed to load plugins:", error);
  }
}

async function executePlugins(hook, ctx, services) {
  for (const [name, plugin] of cache.entries()) {
    const hooks = plugin.hooks || null;
    if (!hooks) {
      _log.warn(`The '${name}' plugin is invalid. Does not contains hook.`);
      continue;
    }

    const handler = hooks[hook];
    if (!handler) {
      continue;
    }

    await handler(ctx, services);
    _log.debug(`The '${name}' plugin has been triggered with '${hook}' hook.`);
  }
}

const API = {
  hooks: HOOKS,
  load: loadPlugins,
  execute: executePlugins,
};

export default API;
