import matter from "gray-matter";

import _io from "./io.js";
import _fmt from "./format.js";
import _cfg from "./config.js";

/**
 * @typedef {Object} ContentSummary
 * @property {string} id
 * @property {string} title
 * @property {Date|string} date
 * @property {string} description
 * @property {string} cover
 * @property {string} coverAlt
 * @property {string} coverCaption
 * @property {string} readingTime
 * @property {string} dateDisplay
 */

let container = {
    contents: {
        cache: [],
        files: []
    },
    partials: {},
    components: {},
    layouts: new Map(),
    templates: new Map()
};

/**
 * Reads markdown files under the provided directory and stores them in memory.
 * @param {string} path Directory path containing markdown files.
 * @returns {Promise<void>}
 */
async function loadContentFiles(path) {
    if (!(await _io.directory.exists(path))) {
        return;
    }

    const files = await _io.directory.read(path);
    for (const entry of files) {
        const filePath = _io.path.combine(path, entry);
        if (!entry.endsWith(".md")) {
            continue;
        }

        container.contents.cache.push(filePath);

        const file = await loadFromContentFile(filePath);
        container.contents.files.push(file);
    }
}

/**
 * Loads a single content file and parses its front matter and body.
 * @param {string} filePath Absolute path to the markdown file.
 * @returns {Promise<{header: object, content: string}>}
 */
async function loadFromContentFile(filePath) {
    if (!(await _io.file.exists(filePath))) {
        throw new Error(`Failed to read content file at ${filePath}`);
    }

    const raw = await _io.file.read(filePath);
    let isValid = false;
    let matterResponse;

    try {
        matterResponse = matter(raw);
        isValid = true;
    }
    catch { }

    const { data, content } = matterResponse;
    const item = {
        get header() { return data; },
        get content() { return content; },
        get isValid() { return isValid; },
        get isDraft() {
            return _fmt.boolean(data.draft);
        },
        get sourcePath() {
            return filePath;
        },
        get status() {
            return typeof data.status === "string" ? data.status.trim().toLowerCase() : "";
        },
        get id() {
            return typeof data.id === "string" ? data.id.trim() : "";
        },
        get lang() { return data.lang; },
        get slug() { return data.slug; },
        get canonical() { return data.canonical; },
        get title() { return data.title; },
        get template() {
            return typeof data.template === "string" ? data.template.trim() : "page";
        },
        get isFeatured() {
            return _fmt.boolean(data.featured);
        },
        get category() {
            return _fmt.slugify(data.category);
        },
        get tags() {
            const tags = _fmt.normalizeStringArray(data.tags);
            return tags.map((t) => {
                return _fmt.slugify(t);
            });
        },
        get series() {
            return _fmt.slugify(data.series);
        },
        get date() {
            return data.date;
        },
        get updated() {
            return data.updated;
        },
        get dateDisplay() {
            return _fmt.date(data.date, data.lang);
        },
        get description() {
            return data.description;
        },
        get cover() {
            return data.cover ?? _cfg.seo.defaultImage;
        },
        get coverAlt() {
            return data.coverAlt ?? "";
        },
        get coverCaption() {
            return data.coverCaption ?? "";
        },
        get readingTime() {
            return _fmt.readingTime(data.readingTime);
        },
        get seriesTitle() {
            if (!data.series) {
                return;
            }

            const title = data.seriesTitle.trim();
            return title.length > 0 ? title : data.series;
        },
        get menuLabel() {
            return (typeof data.menu === "string" && data.menu.trim().length > 0
                ? data.menu.trim()
                : typeof data.title === "string" && data.title.trim().length > 0
                    ? data.title.trim()
                    : key) ?? key;
        },
        get isHiddenOnMenu() {
            return !_fmt.boolean(data.show);
        },
        get menuOrder() {
            return _fmt.order(data.order);
        },
        get layout() {
            return typeof data.layout === "string" ? data.layout.trim() : "default";
        }
    };

    return {
        ...item,
        get isPublished() { return item.status === "published"; },
        get isPostTemplate() { return item.template === "post"; },
        /** @returns {ContentSummary} */
        get summary() {
            return {
                id: item.id,
                title: item.title,
                date: item.date,
                description: item.description,
                cover: item.cover,
                coverAlt: item.coverAlt,
                coverCaption: item.coverCaption,
                readingTime: item.readingTime,
                dateDisplay: item.dateDisplay,
            };
        }
    };
}

/**
 * Loads Mustache partials that start with an underscore into the partial store.
 * @param {string} directoryPath Directory containing partial files.
 * @returns {Promise<void>}
 */
async function loadPartials(directoryPath) {
    if (!(await _io.directory.exists(directoryPath))) {
        return;
    }

    (await _io.directory.read(directoryPath)).forEach(async (entry) => {
        if (!entry.startsWith("_") || !entry.endsWith(".mustache")) {
            return;
        }

        const key = `partials/${entry.replace(/\.mustache$/, "")}`;
        const path = _io.path.combine(directoryPath, entry);

        container.partials[key] = await _io.file.read(path);
    });
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

    (await _io.directory.read(directoryPath)).forEach(async (entry) => {
        if (!entry.endsWith(".mustache")) {
            return;
        }

        const key = `components/${entry.replace(/\.mustache$/, "")}`;
        const path = _io.path.combine(directoryPath, entry);

        container.components[key] = await _io.file.read(path);
    });
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

    (await _io.directory.read(directoryPath)).forEach(async (entry) => {
        if (entry.startsWith("_") || !entry.endsWith(".mustache")) {
            return;
        }

        const key = `${entry.replace(/\.mustache$/, "")}`;
        const path = _io.path.combine(directoryPath, entry);
        const layout = await _io.file.read(path);

        container.layouts.set(key, layout);
    });
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

    (await _io.directory.read(directoryPath)).forEach(async (entry) => {
        const key = `${entry.replace(/\.mustache$/, "")}`;
        const path = _io.path.combine(directoryPath, entry);
        const template = await _io.file.read(path);

        container.templates.set(key, template);
    });
}

const API = {
    contents: {
        load: loadContentFiles,
        get filePaths() {
            return container.contents.cache;
        },
        get count() {
            return container.contents.cache.length;
        },

        /**
         * Gets the loaded content objects along with convenience accessors.
         * @type {Array<{
         *   readonly header: object,
         *   readonly content: string,
         *   readonly isValid: boolean,
         *   readonly isDraft: boolean,
         *   readonly status: string,
         *   readonly id: string,
         *   readonly lang: string,
         *   readonly slug: string,
         *   readonly canonical: string,
         *   readonly title: string,
         *   readonly template: string,
         *   readonly isFeatured: boolean,
         *   readonly category: string,
         *   readonly tags: string[],
         *   readonly series: string,
         *   readonly date: string,
         *   readonly dateDisplay: string,
         *   readonly description: string,
         *   readonly cover: string,
         *   readonly coverAlt: string,
         *   readonly coverCaption: string,
         *   readonly readingTime: number,
         *   readonly seriesTitle: string,
         *   readonly menuLabel: string,
         *   readonly isHiddenOnMenu: boolean,
         *   readonly menuOrder: number,
         *   readonly layout: string,
         *   readonly isPublished: boolean,
         *   readonly isPostTemplate: boolean,
         *   readonly summary: ContentSummary
         * }>}
         */
        get files() {
            return container.contents.files;
        }
    },
    partials: {
        load: loadPartials,
        get files() {
            return container.partials;
        }
    },
    components: {
        load: loadComponents,
        get files() {
            return container.components;
        }
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
            if (container.layouts.has(name)) {
                return container.layouts.get(name);
            }

            throw new Error(`Layout not found: ${name}`);
        }
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
            if (container.templates.has(name)) {
                return container.templates.get(name);
            }

            throw new Error(`Template not found: ${name}`);
        }
    }
};

export default API;
