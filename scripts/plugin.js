import { exec as _exec, log as _log, plugin as _plugin } from "@shevky/base";
import _prj from "./project.js";
import _content from "./content.js";

/**
 * @typedef {Object} PluginInstance
 * @property {string} name
 * @property {Record<string, Function>} [hooks]
 * @property {(config: import("@shevky/base").ConfigApi) => void | Promise<void>} [load]
 */

/** @type {Map<string, PluginInstance>} */
const cache = new Map();

/**
 * @param {import("@shevky/base").PluginHook | string} hook
 * @returns {import("@shevky/base").PluginContext}
 */
function _createContext(hook) {
  const projectPaths = _prj.getPaths(process.cwd());
  const baseContext = _plugin.createBaseContext();

  return {
    ...baseContext,
    paths: projectPaths,
    ...(hook === _plugin.hooks.CONTENT_LOAD
      ? {
          contentFiles: _content.contents.files,
        }
      : {}),
  };
}

/**
 * @param {string[] | undefined | null} names
 * @returns {Promise<void>}
 */
async function loadPlugins(names) {
  const pluginNames = Array.isArray(names) ? names.filter(Boolean) : [];
  if (!pluginNames.length) {
    return;
  }

  const projectPaths = _prj.getPaths(process.cwd());
  const resolveBase = projectPaths.root;
  for (const pluginName of pluginNames) {
    try {
      const fromCwd = _exec.resolve(pluginName, resolveBase);
      const loaded = fromCwd ? await import(fromCwd) : await import(pluginName);
      const instance = loaded?.default ?? loaded;

      if (!instance || typeof instance !== "object") {
        _log.warn(`Plugin cannot load correctly. Plugin name: ${pluginName}`);
        continue;
      }

      const name =
        typeof instance.name === "string" ? instance.name.trim() : "";
      if (!name) {
        _log.warn(`Plugin cannot load correctly. Missing name: ${pluginName}`);
        continue;
      }

      if (cache.has(name)) {
        _log.warn(`Duplicate plugin name detected: ${name}`);
        continue;
      }

      cache.set(name, instance);

      if (instance.load) {
        const baseContext = _plugin.createBaseContext();
        await instance.load(baseContext.config);
      }

      _log.debug(`The plugin '${pluginName}' has been loaded.`);
    } catch (error) {
      _log.err(`Failed to load plugin '${pluginName}':`, error);
    }
  }
}

/**
 * @param {import("@shevky/base").PluginHook | string} hook
 * @returns {Promise<void>}
 */
async function executePlugins(hook) {
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

    try {
      const ctx = _createContext(hook);

      _log.debug(
        `The '${name}' plugin has been triggered with '${hook}' hook.`,
      );

      await handler(ctx);
    } catch (error) {
      _log.err(
        `The '${name}' plugin has been failed with '${hook}' hook. Error: `,
        error,
      );
    }
  }
}

const API = {
  hooks: _plugin.hooks,
  load: loadPlugins,
  execute: executePlugins,
};

export default API;
