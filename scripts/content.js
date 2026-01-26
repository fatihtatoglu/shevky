import matter from "gray-matter";
import { io as _io, config as _cfg, format as _fmt } from "@shevky/base";

/**
 * @typedef {Object} ContentSummary
 * @property {string} id
 * @property {string} title
 * @property {Date|string|number} date
 * @property {string} description
 * @property {string} cover
 * @property {string} coverAlt
 * @property {string} coverCaption
 * @property {number} readingTime
 * @property {string | null} dateDisplay
 */

/**
 * @typedef {Object} ContentFile
 * @property {object} header
 * @property {string} content
 * @property {boolean} isValid
 * @property {string} sourcePath
 * @property {string} status
 * @property {string} id
 * @property {string} lang
 * @property {string} slug
 * @property {string} canonical
 * @property {string} title
 * @property {string} template
 * @property {boolean} isFeatured
 * @property {string} category
 * @property {string[]} tags
 * @property {string} series
 * @property {string | number | Date} date
 * @property {string | number | Date} updated
 * @property {string | null} dateDisplay
 * @property {string} description
 * @property {string} cover
 * @property {string} coverAlt
 * @property {string} coverCaption
 * @property {number} readingTime
 * @property {string} seriesTitle
 * @property {string} menuLabel
 * @property {boolean} isHiddenOnMenu
 * @property {number} menuOrder
 * @property {string} layout
 * @property {boolean} isPublished
 * @property {boolean} isDraft
 * @property {boolean} isPostTemplate
 * @property {ContentSummary} summary
 */

/** @type {{ contents: { cache: string[]; files: ContentFile[] } }} */
let container = {
  contents: {
    cache: [],
    files: [],
  },
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
 * @returns {Promise<ContentFile>}
 */
async function loadFromContentFile(filePath) {
  if (!(await _io.file.exists(filePath))) {
    throw new Error(`Failed to read content file at ${filePath}`);
  }

  const raw = await _io.file.read(filePath);
  let isValid = false;
  /** @type {{ data: Record<string, unknown>, content: string }} */
  let matterResponse = { data: {}, content: "" };

  try {
    matterResponse = matter(raw);
    isValid = true;
  } catch {}

  const { data, content } = matterResponse;
  const item = {
    get header() {
      return data;
    },
    get content() {
      return content;
    },
    get isValid() {
      return isValid;
    },
    get sourcePath() {
      return filePath;
    },
    get status() {
      return typeof data.status === "string"
        ? data.status.trim().toLowerCase()
        : "";
    },
    get id() {
      return typeof data.id === "string" ? data.id.trim() : "";
    },
    get lang() {
      return typeof data.lang === "string" ? data.lang : "";
    },
    get slug() {
      return typeof data.slug === "string" ? data.slug : "";
    },
    get canonical() {
      return typeof data.canonical === "string" ? data.canonical : "";
    },
    get title() {
      return typeof data.title === "string" ? data.title : "";
    },
    get template() {
      return typeof data.template === "string" ? data.template.trim() : "page";
    },
    get isFeatured() {
      return _fmt.boolean(data.featured);
    },
    get category() {
      return _fmt.slugify(typeof data.category === "string" ? data.category : "");
    },
    get tags() {
      const tags = _fmt.normalizeStringArray(data.tags);
      return tags.map((t) => {
        return _fmt.slugify(t);
      });
    },
    get series() {
      return _fmt.slugify(typeof data.series === "string" ? data.series : "");
    },
    get date() {
      return data.date instanceof Date || typeof data.date === "string" || typeof data.date === "number"
        ? data.date
        : "";
    },
    get updated() {
      return data.updated instanceof Date || typeof data.updated === "string" || typeof data.updated === "number"
        ? data.updated
        : "";
    },
    get dateDisplay() {
      const dateValue = data.date instanceof Date
        ? data.date
        : (typeof data.date === "string" || typeof data.date === "number")
          ? data.date
          : null;
      const langValue = typeof data.lang === "string" ? data.lang : undefined;
      return dateValue ? _fmt.date(dateValue, langValue) : null;
    },
    get description() {
      return typeof data.description === "string" ? data.description : "";
    },
    get cover() {
      return typeof data.cover === "string" && data.cover.trim().length > 0
        ? data.cover
        : _cfg.seo.defaultImage;
    },
    get coverAlt() {
      return typeof data.coverAlt === "string" ? data.coverAlt : "";
    },
    get coverCaption() {
      return typeof data.coverCaption === "string" ? data.coverCaption : "";
    },
    get readingTime() {
      const value =
        typeof data.readingTime === "number" || typeof data.readingTime === "string"
          ? data.readingTime
          : 0;
      return _fmt.readingTime(value);
    },
    get seriesTitle() {
      if (!data.series) {
        return "";
      }

      const rawTitle =
        typeof data.seriesTitle === "string" ? data.seriesTitle.trim() : "";
      if (rawTitle.length > 0) {
        return rawTitle;
      }

      return typeof data.series === "string" ? data.series : "";
    },
    get menuLabel() {
      const fallbackKey =
        (typeof data.id === "string" && data.id.trim()) ||
        (typeof data.slug === "string" && data.slug.trim()) ||
        "";
      return (
        (typeof data.menu === "string" && data.menu.trim().length > 0
          ? data.menu.trim()
          : typeof data.title === "string" && data.title.trim().length > 0
            ? data.title.trim()
            : fallbackKey) ?? fallbackKey
      );
    },
    get isHiddenOnMenu() {
      return !_fmt.boolean(data.show);
    },
    get menuOrder() {
      const value =
        typeof data.order === "number" || typeof data.order === "string"
          ? data.order
          : 0;
      return _fmt.order(value);
    },
    get layout() {
      return typeof data.layout === "string" ? data.layout.trim() : "default";
    },
  };

  return {
    ...item,
    get isPublished() {
      return item.status === "published";
    },
    get isDraft() {
      return item.status === "draft";
    },
    get isPostTemplate() {
      return item.template === "post";
    },
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
    },
  };
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
     *   readonly date: string | number | Date,
     *   readonly dateDisplay: string | null,
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
    },
  },
};

export default API;
