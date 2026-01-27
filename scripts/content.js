import matter from "gray-matter";
import { io as _io, config as _cfg, format as _fmt } from "@shevky/base";

class ContentSummary {
  /**
   * @param {ContentFile} item
   */
  constructor(item) {
    this._item = item;
  }

  get id() {
    return this._item.id;
  }

  get title() {
    return this._item.title;
  }

  get date() {
    return this._item.date;
  }

  get description() {
    return this._item.description;
  }

  get cover() {
    return this._item.cover;
  }

  get coverAlt() {
    return this._item.coverAlt;
  }

  get coverCaption() {
    return this._item.coverCaption;
  }

  get readingTime() {
    return this._item.readingTime;
  }

  get dateDisplay() {
    return this._item.dateDisplay;
  }
}

class ContentHeader {
  /**
   * @param {Record<string, unknown>} data
   */
  constructor(data) {
    this._data = data ?? {};
  }

  get raw() {
    return this._data;
  }

  get status() {
    return typeof this._data.status === "string"
      ? this._data.status.trim().toLowerCase()
      : "";
  }

  get id() {
    return typeof this._data.id === "string" ? this._data.id.trim() : "";
  }

  get lang() {
    return typeof this._data.lang === "string" ? this._data.lang : "";
  }

  get slug() {
    return typeof this._data.slug === "string" ? this._data.slug : "";
  }

  get canonical() {
    return typeof this._data.canonical === "string" ? this._data.canonical : "";
  }

  get title() {
    return typeof this._data.title === "string" ? this._data.title : "";
  }

  get template() {
    return typeof this._data.template === "string"
      ? this._data.template.trim()
      : "page";
  }

  get isFeatured() {
    return _fmt.boolean(this._data.featured);
  }

  get category() {
    return _fmt.slugify(
      typeof this._data.category === "string" ? this._data.category : "",
    );
  }

  get tags() {
    const tags = _fmt.normalizeStringArray(this._data.tags);
    return tags.map((t) => {
      return _fmt.slugify(t);
    });
  }

  get keywords() {
    const keywords = _fmt.normalizeStringArray(this._data.keywords);
    return keywords.filter((item) => item && item.trim().length > 0);
  }

  get series() {
    return _fmt.slugify(
      typeof this._data.series === "string" ? this._data.series : "",
    );
  }

  get collectionType() {
    return typeof this._data.collectionType === "string"
      ? this._data.collectionType.trim()
      : "";
  }

  get isCollectionPage() {
    const type = this.collectionType;
    return type === "tag" || type === "category" || type === "series";
  }

  get isPolicy() {
    const category =
      typeof this._data.category === "string" ? this._data.category.trim() : "";
    return _fmt.boolean(category === "policy");
  }

  get isAboutPage() {
    const type =
      typeof this._data.type === "string" ? this._data.type.trim() : "";
    return _fmt.boolean(type === "about");
  }

  get isContactPage() {
    const type =
      typeof this._data.type === "string" ? this._data.type.trim() : "";
    return _fmt.boolean(type === "contact");
  }

  get date() {
    return this._data.date instanceof Date ||
      typeof this._data.date === "string" ||
      typeof this._data.date === "number"
      ? this._data.date
      : "";
  }

  get updated() {
    return this._data.updated instanceof Date ||
      typeof this._data.updated === "string" ||
      typeof this._data.updated === "number"
      ? this._data.updated
      : "";
  }

  get dateDisplay() {
    const dateValue = this._data.date instanceof Date
      ? this._data.date
      : (typeof this._data.date === "string" ||
          typeof this._data.date === "number")
        ? this._data.date
        : null;
    const langValue = typeof this._data.lang === "string"
      ? this._data.lang
      : undefined;
    return dateValue ? _fmt.date(dateValue, langValue) : null;
  }

  get description() {
    return typeof this._data.description === "string"
      ? this._data.description
      : "";
  }

  get cover() {
    return typeof this._data.cover === "string" &&
        this._data.cover.trim().length > 0
      ? this._data.cover
      : _cfg.seo.defaultImage;
  }

  get coverAlt() {
    return typeof this._data.coverAlt === "string" ? this._data.coverAlt : "";
  }

  get coverCaption() {
    return typeof this._data.coverCaption === "string"
      ? this._data.coverCaption
      : "";
  }

  get readingTime() {
    const value =
      typeof this._data.readingTime === "number" ||
        typeof this._data.readingTime === "string"
        ? this._data.readingTime
        : 0;
    return _fmt.readingTime(value);
  }

  get seriesTitle() {
    if (!this._data.series) {
      return "";
    }

    const rawTitle =
      typeof this._data.seriesTitle === "string"
        ? this._data.seriesTitle.trim()
        : "";
    if (rawTitle.length > 0) {
      return rawTitle;
    }

    return typeof this._data.series === "string" ? this._data.series : "";
  }

  get menuLabel() {
    const fallbackKey =
      (typeof this._data.id === "string" && this._data.id.trim()) ||
      (typeof this._data.slug === "string" && this._data.slug.trim()) ||
      "";
    return (
      (typeof this._data.menu === "string" &&
          this._data.menu.trim().length > 0
        ? this._data.menu.trim()
        : typeof this._data.title === "string" &&
            this._data.title.trim().length > 0
          ? this._data.title.trim()
          : fallbackKey) ?? fallbackKey
    );
  }

  get isHiddenOnMenu() {
    return !_fmt.boolean(this._data.show);
  }

  get menuOrder() {
    const value =
      typeof this._data.order === "number" ||
        typeof this._data.order === "string"
        ? this._data.order
        : 0;
    return _fmt.order(value);
  }

  get layout() {
    return typeof this._data.layout === "string"
      ? this._data.layout.trim()
      : "default";
  }
}

class ContentBody {
  /**
   * @param {{
   *   content: string,
   * }} params
   */
  constructor({ content }) {
    this._content = content ?? "";
  }

  get content() {
    return this._content;
  }
}

class ContentFile {
  /**
   * @param {{
   *   data: Record<string, unknown>,
   *   content: string,
   *   filePath: string,
   *   isValid: boolean
   * }} params
   */
  constructor({ data, content, filePath, isValid }) {
    this._header = new ContentHeader(data);
    this._body = new ContentBody({ content });
    this._filePath = filePath;
    this._isValid = isValid;
    /** @type {ContentSummary | null} */
    this._summary = null;
  }

  get header() {
    return this._header;
  }

  get body() {
    return this._body;
  }

  get content() {
    return this._body.content;
  }

  get isValid() {
    return this._isValid;
  }

  get sourcePath() {
    return this._filePath;
  }

  get status() {
    return this._header.status;
  }

  get id() {
    return this._header.id;
  }

  get lang() {
    return this._header.lang;
  }

  get slug() {
    return this._header.slug;
  }

  get canonical() {
    return this._header.canonical;
  }

  get title() {
    return this._header.title;
  }

  get template() {
    return this._header.template;
  }

  get isFeatured() {
    return this._header.isFeatured;
  }

  get category() {
    return this._header.category;
  }

  get tags() {
    return this._header.tags;
  }

  get keywords() {
    return this._header.keywords;
  }

  get series() {
    return this._header.series;
  }

  get collectionType() {
    return this._header.collectionType;
  }

  get isCollectionPage() {
    return this._header.isCollectionPage;
  }

  get isPolicy() {
    return this._header.isPolicy;
  }

  get isAboutPage() {
    return this._header.isAboutPage;
  }

  get isContactPage() {
    return this._header.isContactPage;
  }

  get date() {
    return this._header.date;
  }

  get updated() {
    return this._header.updated;
  }

  get dateDisplay() {
    return this._header.dateDisplay;
  }

  get description() {
    return this._header.description;
  }

  get cover() {
    return this._header.cover;
  }

  get coverAlt() {
    return this._header.coverAlt;
  }

  get coverCaption() {
    return this._header.coverCaption;
  }

  get readingTime() {
    return this._header.readingTime;
  }

  get seriesTitle() {
    return this._header.seriesTitle;
  }

  get menuLabel() {
    return this._header.menuLabel;
  }

  get isHiddenOnMenu() {
    return this._header.isHiddenOnMenu;
  }

  get menuOrder() {
    return this._header.menuOrder;
  }

  get layout() {
    return this._header.layout;
  }

  get isPublished() {
    return this.status === "published";
  }

  get isDraft() {
    return this.status === "draft";
  }

  get isPostTemplate() {
    return this.template === "post";
  }

  /** @returns {ContentSummary} */
  toSummary() {
    if (!this._summary) {
      this._summary = new ContentSummary(this);
    }
    return this._summary;
  }
}

class ContentStore {
  constructor() {
    /** @type {string[]} */
    this._cache = [];
    /** @type {ContentFile[]} */
    this._files = [];
  }

  /**
   * Reads markdown files under the provided directory and stores them in memory.
   * @param {string} path Directory path containing markdown files.
   * @returns {Promise<void>}
   */
  async load(path) {
    if (!(await _io.directory.exists(path))) {
      return;
    }

    const files = await _io.directory.read(path);
    for (const entry of files) {
      const filePath = _io.path.combine(path, entry);
      if (!entry.endsWith(".md")) {
        continue;
      }

      this._cache.push(filePath);

      const file = await this._loadFromContentFile(filePath);
      this._files.push(file);
    }
  }

  /**
   * Loads a single content file and parses its front matter and body.
   * @param {string} filePath Absolute path to the markdown file.
   * @returns {Promise<ContentFile>}
   */
  async _loadFromContentFile(filePath) {
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
    return new ContentFile({
      data,
      content,
      filePath,
      isValid,
    });
  }

  get filePaths() {
    return this._cache;
  }

  get count() {
    return this._cache.length;
  }

  get files() {
    return this._files;
  }
}

const API = {
  contents: new ContentStore(),
};

export default API;
