import { io as _io } from "@shevky/base";

/** @type {{
  partials: Record<string, string>;
  components: Record<string, string>;
  layouts: Map<string, string>;
  templates: Map<string, string>;
}} */
let container = {
  partials: {},
  components: {},
  layouts: new Map(),
  templates: new Map(),
};

/**
 * Loads Mustache partials that start with an underscore into the partial store.
 * @param {string} directoryPath Directory containing partial files.
 * @returns {Promise<void>}
 */
async function loadPartials(directoryPath) {
  if (!(await _io.directory.exists(directoryPath))) {
    return;
  }

  const entries = await _io.directory.read(directoryPath);
  for (const entry of entries) {
    if (!entry.startsWith("_") || !entry.endsWith(".mustache")) {
      continue;
    }

    const key = `partials/${entry.replace(/\.mustache$/, "")}`;
    const path = _io.path.combine(directoryPath, entry);

    container.partials[key] = await _io.file.read(path);
  }
}

/**
 * Loads component Mustache files into the component store.
 * @param {string} directoryPath Directory containing component templates.
 * @returns {Promise<void>}
 */
async function loadComponents(directoryPath) {
  if (!(await _io.directory.exists(directoryPath))) {
    return;
  }

  const entries = await _io.directory.read(directoryPath);
  for (const entry of entries) {
    if (!entry.endsWith(".mustache")) {
      continue;
    }

    const key = `components/${entry.replace(/\.mustache$/, "")}`;
    const path = _io.path.combine(directoryPath, entry);

    container.components[key] = await _io.file.read(path);
  }
}

/**
 * Loads layout Mustache files into the layout map keyed by file name.
 * @param {string} directoryPath Directory containing layout templates.
 * @returns {Promise<void>}
 */
async function loadLayout(directoryPath) {
  if (!(await _io.directory.exists(directoryPath))) {
    return;
  }

  const entries = await _io.directory.read(directoryPath);
  for (const entry of entries) {
    if (entry.startsWith("_") || !entry.endsWith(".mustache")) {
      continue;
    }

    const key = `${entry.replace(/\.mustache$/, "")}`;
    const path = _io.path.combine(directoryPath, entry);
    const layout = await _io.file.read(path);

    container.layouts.set(key, layout);
  }
}

/**
 * Loads template files into the template map keyed by file name.
 * @param {string} directoryPath Directory containing template files.
 * @returns {Promise<void>}
 */
async function loadTemplate(directoryPath) {
  if (!(await _io.directory.exists(directoryPath))) {
    return;
  }

  const entries = await _io.directory.read(directoryPath);
  for (const entry of entries) {
    if (!entry.endsWith(".mustache")) {
      continue;
    }
    const key = `${entry.replace(/\.mustache$/, "")}`;
    const path = _io.path.combine(directoryPath, entry);
    const template = await _io.file.read(path);

    container.templates.set(key, template);
  }
}

const API = {
  partials: {
    load: loadPartials,
    get files() {
      return container.partials;
    },
  },
  components: {
    load: loadComponents,
    get files() {
      return container.components;
    },
  },
  layouts: {
    load: loadLayout,
    list: function () {
      return Array.from(container.layouts.keys());
    },
    /**
     * Retrieves a layout by name.
     * @param {string} name Layout identifier.
     * @returns {string}
     */
    get: function (name) {
      const layout = container.layouts.get(name);
      if (typeof layout === "string") {
        return layout;
      }

      throw new Error(`Layout not found: ${name}`);
    },
  },
  templates: {
    load: loadTemplate,
    list: function () {
      return Array.from(container.templates.keys());
    },
    /**
     * Retrieves a template by name.
     * @param {string} name Template identifier.
     * @returns {string}
     */
    get: function (name) {
      const template = container.templates.get(name);
      if (typeof template === "string") {
        return template;
      }

      throw new Error(`Template not found: ${name}`);
    },
  },
};

export default API;
