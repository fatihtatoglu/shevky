#!/usr/bin/env node

import crypto from "node:crypto";
import Mustache from "mustache";
import { minify as minifyHtml } from "html-minifier-terser";
import {
  io as _io,
  i18n as _i18n,
  config as _cfg,
  log as _log,
  format as _fmt,
  exec as _exec,
} from "@shevky/base";

import _prj from "./project.js";
import _analytics from "./analytics.js";
import _content from "./content.js";
import _view from "./view.js";
import _social from "./social.js";
import _plugin from "./plugin.js";
import { MetaEngine } from "./meta.js";
import {
  setupMarkdown,
  renderLayoutHtml,
  renderMarkdownComponents,
  parseMarkdown,
  injectMarkdownComponents,
} from "./engine.js";

const meta = new MetaEngine();

/**
 * @typedef {Object} ContentSummary
 * @property {string} id
 * @property {string} title
 * @property {string} slug
 * @property {string} lang
 * @property {string} canonical
 * @property {string | number | Date} date
 * @property {string | number | Date | undefined} updated
 * @property {string} description
 * @property {string} cover
 * @property {string} coverAlt
 * @property {string} coverCaption
 * @property {number} readingTime
 * @property {string | null} dateDisplay
 * @property {string | undefined} seriesTitle
 */

/**
 * @typedef {Object} ContentFile
 * @property {object} header
 * @property {string} content
 * @property {boolean} isValid
 * @property {boolean} isDraft
 * @property {boolean} isPublished
 * @property {boolean} isPostTemplate
 * @property {boolean} isFeatured
 * @property {string} category
 * @property {string[]} tags
 * @property {string} series
 * @property {string} seriesTitle
 * @property {string} id
 * @property {string} lang
 * @property {string} slug
 * @property {string} canonical
 * @property {string} title
 * @property {string} template
 * @property {string} layout
 * @property {string} menuLabel
 * @property {boolean} isHiddenOnMenu
 * @property {number} menuOrder
 * @property {string | number | Date} date
 * @property {string | number | Date | undefined} updated
 * @property {string} description
 * @property {string} cover
 * @property {string} coverAlt
 * @property {string} coverCaption
 * @property {number} readingTime
 * @property {string} sourcePath
 * @property {() => ContentSummary} toSummary
 */

/**
 * @typedef {Record<string, any>} FrontMatter
 */

/**
 * @typedef {ContentSummary & { type?: string, seriesTitle?: string }} CollectionEntry
 */

/**
 * @typedef {{ key: string, label: string, url: string }} MenuItem
 */

/**
 * @typedef {{ key: string, label: string, url: string, lang: string }} FooterPolicy
 */

const projectPaths = _prj.getPaths();
const ROOT_DIR = projectPaths.root;
const SRC_DIR = projectPaths.src;
const DIST_DIR = projectPaths.dist;
const CONTENT_DIR = projectPaths.content;
const LAYOUTS_DIR = projectPaths.layouts;
const COMPONENTS_DIR = projectPaths.components;
const TEMPLATES_DIR = projectPaths.templates;
const ASSETS_DIR = projectPaths.assets;
const SITE_CONFIG_PATH = projectPaths.siteConfig;
const I18N_CONFIG_PATH = projectPaths.i18nConfig;

await _i18n.load(I18N_CONFIG_PATH);
await _cfg.load(SITE_CONFIG_PATH);
_log.step("CONFIG_READY", {
  file: normalizeLogPath(SITE_CONFIG_PATH),
  debug: _cfg.build.debug ? "on" : "off",
});
_log.step("I18N_READY", {
  file: normalizeLogPath(I18N_CONFIG_PATH),
  locales: _i18n.supported.length,
});
await _content.contents.load(CONTENT_DIR);
const contentSample = previewList(
  _content.contents.files.map(describeContentEntry),
  8,
);
_log.step("CONTENT_LOADED", {
  dir: normalizeLogPath(CONTENT_DIR),
  files: _content.contents.count,
  sample: contentSample,
});
await _view.partials.load(LAYOUTS_DIR);
const partialKeys = Object.keys(_view.partials.files);
_log.step("PARTIALS_READY", {
  dir: normalizeLogPath(LAYOUTS_DIR),
  total: partialKeys.length,
  sample: previewList(partialKeys, 8),
});
await _view.components.load(COMPONENTS_DIR);
const componentKeys = Object.keys(_view.components.files);
_log.step("COMPONENTS_READY", {
  dir: normalizeLogPath(COMPONENTS_DIR),
  files: componentKeys.length,
  sample: previewList(componentKeys, 8),
});
await _view.layouts.load(LAYOUTS_DIR);
const layoutNames =
  typeof _view.layouts.list === "function" ? _view.layouts.list() : [];
_log.step("LAYOUTS_READY", {
  dir: normalizeLogPath(LAYOUTS_DIR),
  total: layoutNames.length,
  sample: previewList(layoutNames, 8),
});
await _view.templates.load(TEMPLATES_DIR);
const templateKeys =
  typeof _view.templates.list === "function" ? _view.templates.list() : [];
_log.step("TEMPLATES_READY", {
  dir: normalizeLogPath(TEMPLATES_DIR),
  total: templateKeys.length,
  sample: previewList(templateKeys, 8),
});

await _plugin.load(_cfg.plugins);
_log.step("PLUGINS_READY", {
  plugins: previewList(_cfg.plugins, 8) ?? "",
  count: Array.isArray(_cfg.plugins) ? _cfg.plugins.length : 0,
});

const versionToken = crypto.randomBytes(6).toString("hex");
const SEO_INCLUDE_COLLECTIONS = _cfg.seo.includeCollections;
const DEFAULT_IMAGE = _cfg.seo.defaultImage;
/** @type {Record<string, string>} */
const FALLBACK_TAGLINES = { tr: "-", en: "-" };
/** @type {Record<string, any>} */
const COLLECTION_CONFIG = _cfg.content.collections;

/** @type {Record<string, MenuItem[]>} */
const MENU_ITEMS = await buildMenuItemsFromContent();
/** @type {Record<string, Record<string, CollectionEntry[]>>} */
const PAGES = await buildCategoryTagCollections();
/** @type {Record<string, FooterPolicy[]>} */
const FOOTER_POLICIES = await buildFooterPoliciesFromContent();
/** @type {Record<string, Record<string, { id: string, lang: string, title: string, canonical: string }>>} */
const CONTENT_INDEX = await buildContentIndex();

const GENERATED_PAGES = new Set();
setupMarkdown();

/** @param {unknown} input */
function byteLength(input) {
  if (input === undefined || input === null) {
    return 0;
  }

  if (typeof input !== "string") {
    return Buffer.byteLength(String(input));
  }

  return Buffer.byteLength(input);
}

/** @param {number} bytes */
function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const precision = unitIndex === 0 ? 0 : 2;
  return `${value.toFixed(precision)}${units[unitIndex]}`;
}

/** @param {string | null | undefined} pathValue */
function normalizeLogPath(pathValue) {
  if (!pathValue) {
    return "";
  }

  const normalized = toPosixPath(pathValue);
  if (normalized.startsWith("./")) {
    return normalized.slice(2);
  }

  return normalized;
}

/** @param {unknown} values @param {number} [limit] */
function previewList(values, limit = 5) {
  if (!Array.isArray(values) || values.length === 0) {
    return undefined;
  }

  const normalized = values
    .map((value) => (value == null ? "" : String(value).trim()))
    .filter((value) => value.length > 0);
  if (!normalized.length) {
    return undefined;
  }

  const slice = normalized.slice(0, limit);
  const extra = normalized.length - slice.length;
  if (extra > 0) {
    return `${slice.join(", ")} +${extra}`;
  }

  return slice.join(", ");
}

/** @param {{ id?: unknown, slug?: unknown, title?: unknown, sourcePath?: unknown }} file */
function describeContentEntry(file) {
  if (!file || typeof file !== "object") {
    return "";
  }

  return (
    (typeof file.id === "string" && file.id.trim()) ||
    (typeof file.slug === "string" && file.slug.trim()) ||
    (typeof file.title === "string" && file.title.trim()) ||
    normalizeLogPath(
      typeof file.sourcePath === "string" ? file.sourcePath : "",
    ) ||
    ""
  );
}

async function ensureDist() {
  await _io.directory.remove(DIST_DIR);
  _log.step("DIST_CLEAN", { target: normalizeLogPath(DIST_DIR) });
  await _io.directory.create(DIST_DIR);
  _log.step("DIST_READY", { target: normalizeLogPath(DIST_DIR) });
}

/** @param {string} html */
async function transformHtml(html) {
  let output = html
    .replace(/\/output\.css(\?v=[^"']+)?/g, `/output.css?v=${versionToken}`)
    .replace(/\/output\.js(\?v=[^"']+)?/g, `/output.js?v=${versionToken}`)
    .replace(/\b(src|href)="~\//g, '$1="/');

  if (!_cfg.build.minify) {
    return output;
  }

  try {
    output = await minifyHtml(output, {
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      decodeEntities: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      removeEmptyAttributes: false,
      sortAttributes: true,
      sortClassName: true,
      minifyCSS: true,
      minifyJS: true,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn("[build] Failed to minify HTML:", msg);
  }

  return output;
}

/** @param {string} html @param {string[]} locales */
function injectAlternateLocaleMeta(html, locales) {
  const cleanupPattern =
    /[^\S\r\n]*<meta property="og:locale:alternate" content=".*?" data-og-locale-alt\s*\/?>\s*/g;
  const indentMatch = html.match(
    /([^\S\r\n]*)<meta property="og:locale:alternate" content=".*?" data-og-locale-alt\s*\/?>/,
  );
  const indent = indentMatch?.[1] ?? "  ";
  let output = html.replace(cleanupPattern, "");

  if (!locales.length) {
    return output;
  }

  const tags = locales
    .map(
      (locale) =>
        `${indent}<meta property="og:locale:alternate" content="${locale}" data-og-locale-alt />`,
    )
    .join("\n");
  const anchorPattern =
    /(<meta property="og:locale" content=".*?" data-og-locale\s*\/?>)/;

  if (anchorPattern.test(output)) {
    return output.replace(anchorPattern, `$1\n${tags}`);
  }

  return `${tags}\n${output}`;
}

/** @param {string} lang */
function resolvePaginationSegment(lang) {
  /** @type {Record<string, string>} */
  const segmentConfig = _cfg?.content?.pagination?.segment ?? {};
  if (
    typeof segmentConfig[lang] === "string" &&
    segmentConfig[lang].trim().length > 0
  ) {
    return segmentConfig[lang].trim();
  }

  const defaultSegment = segmentConfig[_i18n.default];
  if (typeof defaultSegment === "string" && defaultSegment.trim().length > 0) {
    return defaultSegment.trim();
  }

  return "page";
}

/** @param {unknown} view */
function buildEasterEggPayload(view) {
  if (!_cfg.build.debug) {
    return "{}";
  }

  if (!view || typeof view !== "object") {
    return "{}";
  }

  try {
    return meta.serializeForInlineScript(view);
  } catch {
    return "{}";
  }
}

/** @param {string} relativePath @param {string} html @param {{action?: string, source?: string, type?: string, lang?: string, template?: string, items?: number, page?: string | number, inputBytes?: number}} [meta] */
async function writeHtmlFile(relativePath, html, meta = {}) {
  const destPath = _io.path.combine(DIST_DIR, relativePath);
  await _io.directory.create(_io.path.name(destPath));
  const payload = typeof html === "string" ? html : String(html ?? "");
  await _io.file.write(destPath, payload);
  const outputBytes = byteLength(payload);

  _log.step(meta.action ?? "WRITE_HTML", {
    target: normalizeLogPath(destPath),
    source: normalizeLogPath(meta.source),
    type: meta.type ?? "html",
    lang: meta.lang,
    template: meta.template,
    items: meta.items,
    page: meta.page,
    input:
      typeof meta.inputBytes === "number"
        ? formatBytes(meta.inputBytes)
        : undefined,
    output: formatBytes(outputBytes),
  });
}

/** @param {string} html @param {string} langKey */
function applyLanguageMetadata(html, langKey) {
  const config = _i18n.build[langKey];
  if (!config) {
    return html;
  }

  const altLocales = meta.normalizeAlternateLocales(config.altLocale);

  let output = html
    .replace(/(<html\b[^>]*\slang=")(.*?)"/, `$1${config.langAttr}"`)
    .replace(
      /(<meta name="language" content=")(.*?)"/,
      `$1${config.metaLanguage}"`,
    )
    .replace(
      /(<link rel="canonical" href=")(.*?)" data-canonical/,
      `$1${config.canonical}" data-canonical`,
    )
    .replace(
      /(<meta property="og:url" content=")(.*?)" data-og-url/,
      `$1${config.canonical}" data-og-url`,
    )
    .replace(
      /(<meta name="twitter:url" content=")(.*?)" data-twitter-url/,
      `$1${config.canonical}" data-twitter-url`,
    )
    .replace(
      /(<meta property="og:locale" content=")(.*?)" data-og-locale/,
      `$1${config.ogLocale}" data-og-locale`,
    );

  output = injectAlternateLocaleMeta(output, altLocales);
  return output;
}

/** @param {string} lang @param {string | null} activeKey */
function getMenuData(lang, activeKey) {
  const baseItems = MENU_ITEMS[lang] ?? MENU_ITEMS[_i18n.default] ?? [];
  const normalizedActiveKey =
    typeof activeKey === "string" && activeKey.trim().length > 0
      ? activeKey.trim()
      : null;
  const hasExplicitMatch = normalizedActiveKey
    ? baseItems.some((item) => item.key === normalizedActiveKey)
    : false;
  const resolvedActiveKey = hasExplicitMatch
    ? normalizedActiveKey
    : (baseItems[0]?.key ?? "");
  const items = baseItems.map((item) => ({
    ...item,
    label: _i18n.t(lang, `menu.${item.key}`, item.label ?? item.key),
    isActive: item.key === resolvedActiveKey,
  }));
  return { items, activeKey: resolvedActiveKey };
}

/** @param {{ id?: unknown, slug?: unknown } | null | undefined} frontMatter */
function resolveActiveMenuKey(frontMatter) {
  if (!frontMatter) return null;
  if (typeof frontMatter.id === "string" && frontMatter.id.trim().length > 0) {
    return frontMatter.id.trim();
  }
  if (
    typeof frontMatter.slug === "string" &&
    frontMatter.slug.trim().length > 0
  ) {
    return frontMatter.slug.trim();
  }
  return null;
}

/** @param {string} key @param {string} lang */
function buildTagSlug(key, lang) {
  if (!key) {
    return null;
  }

  /** @type {any} */
  const tagsConfig = _cfg.content.collections.tags;
  const slugPattern =
    tagsConfig && typeof tagsConfig.slugPattern === "object"
      ? /** @type {Record<string, string>} */ (tagsConfig.slugPattern)
      : {};

  const langPattern =
    typeof slugPattern[lang] === "string" ? slugPattern[lang] : null;
  if (langPattern) {
    return langPattern.includes("{{key}}")
      ? langPattern.replace("{{key}}", key)
      : langPattern;
  }

  if (lang === "en") {
    return `tag/${key}`;
  }

  if (lang === "tr") {
    return `etiket/${key}`;
  }

  return key;
}

/** @param {string} key @param {string} lang */
function buildTagUrlFromKey(key, lang) {
  const slug = buildTagSlug(key, lang);
  if (!slug) {
    return null;
  }

  return buildContentUrl(null, lang, slug);
}

/** @param {string} label @param {string} lang */
function buildTagUrlFromLabel(label, lang) {
  const key = _fmt.slugify(label);
  if (!key) {
    return null;
  }

  return buildTagUrlFromKey(key, lang);
}

/** @param {string} lang */
function buildFooterTags(lang) {
  /** @type {Record<string, CollectionEntry[]>} */
  /** @type {Record<string, CollectionEntry[]>} */
  const langCollections = PAGES[lang] ?? {};
  const limit = _cfg.seo.footerTagCount;
  /** @type {Array<{ key: string, count: number, url: string }>} */
  const results = [];
  Object.keys(langCollections).forEach((key) => {
    const items = langCollections[key] ?? [];
    if (!Array.isArray(items) || items.length === 0) {
      return;
    }

    const count = items.filter((entry) => entry.type === "tag").length;
    if (count === 0) {
      return;
    }

    const url = buildTagUrlFromKey(key, lang);
    if (!url) {
      return;
    }

    results.push({ key, count, url });
  });

  results.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }

    return a.key.localeCompare(b.key, lang);
  });

  if (limit && Number.isFinite(limit) && limit > 0) {
    return results.slice(0, limit);
  }

  return results;
}

/** @param {string} lang */
function getFooterData(lang) {
  const policiesSource =
    FOOTER_POLICIES[lang] ?? FOOTER_POLICIES[_i18n.default] ?? [];
  const tagsSource = buildFooterTags(lang);
  const socialSource =
    /** @type {Array<{ key: string, url: string, icon?: string }>} */ (
      Array.isArray(_social.get()) ? _social.get() : []
    );
  const social = socialSource.filter(Boolean).map((item) => {
    let url = item.url;
    if (item.key === "rss") {
      url = lang === _i18n.default ? "/feed.xml" : `/${lang}/feed.xml`;
    }

    return {
      ...item,
      url,
      icon: item.icon,
      label: _i18n.t(lang, `footer.social.${item.key}`, item.key.toUpperCase()),
    };
  });

  const tags = tagsSource.map((tag) => ({
    ...tag,
    label: _i18n.t(lang, `footer.tags.${tag.key}`, tag.key),
  }));

  const policies = policiesSource.map((policy) => ({
    ...policy,
    label: _i18n.t(
      lang,
      `footer.policies.${policy.key}`,
      policy.label ?? policy.key,
    ),
  }));

  const tagline = _i18n.t(
    lang,
    "footer.tagline",
    FALLBACK_TAGLINES[lang] ??
      FALLBACK_TAGLINES[_i18n.default] ??
      FALLBACK_TAGLINES.en,
  );

  return {
    tags,
    policies,
    social,
    tagline,
  };
}

/**
 * @param {string} templateName
 * @param {string} contentHtml
 * @param {FrontMatter} front
 * @param {string} lang
 * @param {Record<string, any>} dictionary
 * @param {any} [listingOverride]
 */
async function renderContentTemplate(
  templateName,
  contentHtml,
  front,
  lang,
  dictionary,
  listingOverride,
) {
  const template = _view.templates.get(templateName);
  const normalizedTags = Array.isArray(front.tags)
    ? front.tags.filter(
        (tag) => typeof tag === "string" && tag.trim().length > 0,
      )
    : [];
  const tagLinks = normalizedTags
    .map((tag) => {
      const url = buildTagUrlFromLabel(tag, lang);
      return url ? { label: tag, url } : null;
    })
    .filter(Boolean);
  const categorySlug =
    typeof front.category === "string" && front.category.trim().length > 0
      ? _fmt.slugify(front.category)
      : "";
  const categoryUrl = categorySlug
    ? buildContentUrl(null, lang, categorySlug)
    : null;
  const resolvedDictionary = dictionary ?? _i18n.get(lang);
  const normalizedFront = /** @type {FrontMatter} */ ({
    ...front,
    tags: normalizedTags,
    tagLinks,
    hasTags: normalizedTags.length > 0,
    categoryUrl,
    categoryLabel:
      typeof front.category === "string" && front.category.trim().length > 0
        ? front.category.trim()
        : "",
    dateDisplay: _fmt.date(front.date, lang),
    updatedDisplay: _fmt.date(front.updated, lang),
    cover: front.cover ?? DEFAULT_IMAGE,
    coverAlt: front.coverAlt ?? "",
    lang,
  });
  if (front?.collectionType) {
    normalizedFront.collectionType = normalizeCollectionTypeValue(
      front.collectionType,
    );
  }
  normalizedFront.seriesListing = buildSeriesListing(normalizedFront, lang);
  const listing =
    listingOverride ?? buildCollectionListing(normalizedFront, lang);
  const collectionFlags = buildCollectionTypeFlags(
    listing?.type ?? resolveCollectionType(normalizedFront, listing?.items),
  );
  const site = meta.buildSiteData(lang);
  const languageFlags = _i18n.flags(lang);
  return Mustache.render(
    template,
    {
      content: { html: decorateHtml(contentHtml, templateName) },
      front: normalizedFront,
      lang,
      listing,
      site,
      locale: languageFlags.locale,
      isEnglish: languageFlags.isEnglish,
      isTurkish: languageFlags.isTurkish,
      i18n: resolvedDictionary,
      ...collectionFlags,
    },
    {
      ..._view.partials.files,
      ..._view.components.files,
    },
  );
}

/**
 * @param {FrontMatter} frontMatter
 * @param {string} lang
 * @param {Record<string, any>} dictionary
 */
function buildContentComponentContext(frontMatter, lang, dictionary) {
  const normalizedLang = lang ?? _i18n.default;
  const languageFlags = _i18n.flags(normalizedLang);
  return {
    front: frontMatter ?? {},
    lang: normalizedLang,
    i18n: dictionary ?? {},
    pages: PAGES[normalizedLang] ?? {},
    allPages: PAGES,
    locale: languageFlags.locale,
    isEnglish: languageFlags.isEnglish,
    isTurkish: languageFlags.isTurkish,
  };
}

/**
 * @param {{ lang: string, activeMenuKey: string | null, pageMeta: any, content: string, dictionary: Record<string, any> }} input
 */
function buildViewPayload({
  lang,
  activeMenuKey,
  pageMeta,
  content,
  dictionary,
}) {
  const languageFlags = _i18n.flags(lang);
  const view = {
    lang,
    locale: languageFlags.locale,
    isEnglish: languageFlags.isEnglish,
    isTurkish: languageFlags.isTurkish,
    theme: "light",
    site: meta.buildSiteData(lang),
    menu: getMenuData(lang, activeMenuKey),
    footer: getFooterData(lang),
    pages: PAGES,
    i18n: dictionary,
    i18nInline: _i18n.serialize(),
    page: pageMeta,
    content,
    scripts: {
      analytics: _analytics.snippets,
      body: [],
    },
    easterEgg: "",
  };
  view.easterEgg = buildEasterEggPayload(view);
  return view;
}

/**
 * @param {{ layoutName: string, view: Record<string, any>, front: FrontMatter, lang: string, slug: string, writeMeta?: { action?: string, source?: string, type?: string, lang?: string, template?: string, items?: number, page?: string | number, inputBytes?: number } }} input
 */
async function renderPage({ layoutName, view, front, lang, slug, writeMeta }) {
  const rendered = renderLayoutHtml({ layoutName, view });
  const finalHtml = await transformHtml(rendered);
  const relativePath = buildOutputPath(front, lang, slug);
  await writeHtmlFile(relativePath, finalHtml, writeMeta);
  GENERATED_PAGES.add(toPosixPath(relativePath));
  registerLegacyPaths(lang, slug);
  return relativePath;
}

/** @param {string} html @param {string} templateName */
function decorateHtml(html, templateName) {
  return html;
}

/** @param {FrontMatter} front @param {string} lang @param {string} slug */
function buildOutputPath(front, lang, slug) {
  const canonicalRelative = meta.canonicalToRelativePath(front.canonical);
  if (canonicalRelative) {
    return _io.path.combine(canonicalRelative, "index.html");
  }
  const cleaned = (slug ?? "").replace(/^\/+/, "");
  /** @type {string[]} */
  const segments = [];
  if (lang && lang !== _i18n.default) {
    segments.push(lang);
  }
  if (cleaned) {
    segments.push(cleaned);
  }
  return _io.path.combine(...segments.filter(Boolean), "index.html");
}

/** @param {string} value */
function toPosixPath(value) {
  return value.split(_io.path.separator).join("/");
}

/** @param {string | null | undefined} canonical @param {string} lang @param {string} slug */
function buildContentUrl(canonical, lang, slug) {
  const normalizedLang = lang ?? _i18n.default;
  if (typeof canonical === "string" && canonical.trim().length > 0) {
    const trimmedCanonical = canonical.trim();
    const relative = meta.canonicalToRelativePath(trimmedCanonical);
    if (relative) {
      const normalizedRelative = `/${relative}`.replace(/\/+/g, "/");
      return meta.ensureDirectoryTrailingSlash(normalizedRelative);
    }

    return meta.ensureDirectoryTrailingSlash(trimmedCanonical);
  }
  const fallback = meta.canonicalToRelativePath(
    meta.defaultCanonical(normalizedLang, slug),
  );
  if (fallback) {
    const normalizedFallback = `/${fallback}`.replace(/\/+/g, "/");
    return meta.ensureDirectoryTrailingSlash(normalizedFallback);
  }
  const slugSegment = slug ? `/${slug}` : "/";
  if (normalizedLang !== _i18n.default) {
    const langPath = `/${normalizedLang}${slugSegment}`.replace(/\/+/g, "/");
    return meta.ensureDirectoryTrailingSlash(langPath);
  }

  const normalizedSlug = slugSegment.replace(/\/+/g, "/");
  return meta.ensureDirectoryTrailingSlash(normalizedSlug);
}

async function buildFooterPoliciesFromContent() {
  if (_content.contents.count === 0) {
    return {};
  }

  /** @type {Record<string, FooterPolicy[]>} */
  const policiesByLang = {};
  const contentFiles = /** @type {ContentFile[]} */ (
    /** @type {unknown} */ (_content.contents.files)
  );
  for (const file of contentFiles) {
    if (
      !file.isValid ||
      file.isDraft ||
      !file.isPublished ||
      file.category !== "policy"
    ) {
      continue;
    }

    const policy = {
      lang: file.lang,
      key: file.id,
      label: file.menuLabel,
      url: buildContentUrl(file.canonical, file.lang, file.slug),
    };

    if (!Array.isArray(policiesByLang[file.lang])) {
      policiesByLang[file.lang] = [];
    }

    policiesByLang[file.lang].push(policy);
  }

  Object.keys(policiesByLang).forEach((lang) => {
    policiesByLang[lang].sort((a, b) => a.label.localeCompare(b.label, lang));
  });

  return policiesByLang;
}

async function buildContentIndex() {
  if (_content.contents.count === 0) {
    return {};
  }

  /** @type {Record<string, Record<string, { id: string, lang: string, title: string, canonical: string }>>} */
  const index = {};
  const contentFiles = /** @type {ContentFile[]} */ (
    /** @type {unknown} */ (_content.contents.files)
  );
  for (const file of contentFiles) {
    if (!file.isValid || file.isDraft || !file.isPublished || !file.id) {
      continue;
    }

    if (!index[file.id]) {
      index[file.id] = {};
    }

    index[file.id][file.lang] = {
      id: file.id,
      lang: file.lang,
      title: file.title,
      canonical: buildContentUrl(file.canonical, file.lang, file.slug),
    };
  }

  return index;
}

async function buildCategoryTagCollections() {
  if (_content.contents.count === 0) {
    return {};
  }

  /** @type {Record<string, Record<string, CollectionEntry[]>>} */
  const pagesByLang = {};
  const contentFiles = /** @type {ContentFile[]} */ (
    /** @type {unknown} */ (_content.contents.files)
  );
  for (const file of contentFiles) {
    if (!file.isValid || file.isDraft || !file.isPublished) {
      continue;
    }

    const summary = {
      ...file.toSummary(),
      canonical: buildContentUrl(file.canonical, file.lang, file.slug),
    };
    const langStore = pagesByLang[file.lang] ?? (pagesByLang[file.lang] = {});

    if (file.isPostTemplate && file.isFeatured) {
      addCollectionEntry(langStore, "home", summary, "home");
    }

    if (file.category) {
      addCollectionEntry(langStore, file.category, summary, "category");
    }

    for (const tag of file.tags) {
      addCollectionEntry(langStore, tag, summary, "tag");
    }

    if (file.series) {
      addCollectionEntry(
        langStore,
        file.series,
        {
          ...file.toSummary(),
          seriesTitle: file.seriesTitle,
        },
        "series",
      );
    }
  }

  return sortCollectionEntries(pagesByLang);
}

/** @param {FrontMatter} front @param {string} lang */
function buildCollectionListing(front, lang) {
  const normalizedLang = lang ?? _i18n.default;
  /** @type {Record<string, CollectionEntry[]>} */
  const langCollections = PAGES[normalizedLang] ?? {};
  const key = resolveListingKey(front);
  const sourceItems =
    key && Array.isArray(langCollections[key]) ? langCollections[key] : [];
  const items = dedupeCollectionItems(sourceItems);
  const collectionType = resolveCollectionType(front, items);
  const typeFlags = buildCollectionTypeFlags(collectionType);
  return {
    key,
    lang: normalizedLang,
    items,
    hasItems: items.length > 0,
    emptyMessage: resolveListingEmpty(front, normalizedLang),
    heading: resolveListingHeading(front),
    type: collectionType,
    ...typeFlags,
  };
}

/** @param {FrontMatter} front @param {string} lang */
function buildSeriesListing(front, lang) {
  const relatedSource = Array.isArray(front?.related) ? front.related : [];
  const seriesName =
    typeof front?.seriesTitle === "string" &&
    front.seriesTitle.trim().length > 0
      ? front.seriesTitle.trim()
      : typeof front?.series === "string"
        ? front.series.trim()
        : "";
  const currentId = typeof front?.id === "string" ? front.id.trim() : "";
  /** @type {Array<{ id: string, label: string, url: string, hasUrl?: boolean, isCurrent: boolean, isPlaceholder: boolean }>} */
  const items = [];

  relatedSource.forEach((entry) => {
    const value = typeof entry === "string" ? entry.trim() : "";
    if (!value) {
      items.push({
        id: "",
        label: "...",
        url: "",
        isCurrent: false,
        isPlaceholder: true,
      });
      return;
    }

    const isCurrent = value === currentId;
    const summaryLookup = CONTENT_INDEX[value];
    const summaryLang = lang || front?.lang;
    let summary = null;
    if (summaryLookup) {
      const summaryFallback =
        /** @type {{ title?: string, canonical?: string }} */ (
          Object.values(summaryLookup)[0]
        );
      summary =
        summaryLookup[summaryLang] ??
        summaryLookup[front?.lang] ??
        summaryFallback;
    }
    const label =
      summary?.title ?? (isCurrent ? (front?.title ?? value) : value);
    const url = summary?.canonical ?? "";

    const hasUrl = typeof url === "string" && url.length > 0;
    items.push({
      id: value,
      label,
      url,
      hasUrl,
      isCurrent,
      isPlaceholder: false,
    });
  });

  return {
    label: seriesName,
    hasLabel: Boolean(seriesName),
    hasItems: items.length > 0,
    items,
  };
}

/** @param {unknown} value */
function normalizeCollectionTypeValue(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().toLowerCase();
}

/** @param {FrontMatter} front @param {CollectionEntry[] | undefined} items @param {string} [fallback] */
function resolveCollectionType(front, items, fallback) {
  const explicitCandidate =
    normalizeCollectionTypeValue(front?.collectionType) ||
    normalizeCollectionTypeValue(front?.listType) ||
    normalizeCollectionTypeValue(front?.type);
  if (explicitCandidate) {
    return explicitCandidate;
  }

  if (Array.isArray(items)) {
    const entryWithType = items.find(
      (entry) =>
        typeof entry?.type === "string" && entry.type.trim().length > 0,
    );
    const entryType =
      typeof entryWithType?.type === "string" ? entryWithType.type.trim() : "";
    if (entryType) {
      return entryType.toLowerCase();
    }
  }

  if (typeof fallback === "string" && fallback.trim().length > 0) {
    return fallback.trim().toLowerCase();
  }

  return "";
}

/** @param {string} type */
function buildCollectionTypeFlags(type) {
  const normalized = normalizeCollectionTypeValue(type);
  return {
    collectionType: normalized,
    isTag: normalized === "tag",
    isCategory: normalized === "category",
    isAuthor: normalized === "author",
    isSeries: normalized === "series",
    isHome: normalized === "home",
  };
}

/** @param {FrontMatter} front */
function resolveListingKey(front) {
  if (!front) return "";
  const candidates = [
    typeof front.listKey === "string" ? front.listKey : null,
    typeof front.slug === "string" ? front.slug : null,
    typeof front.category === "string" ? front.category : null,
    typeof front.id === "string" ? front.id : null,
  ];
  for (const value of candidates) {
    if (typeof value !== "string") continue;
    const normalized = _fmt.slugify(value);
    if (normalized) {
      return normalized;
    }
  }
  return "";
}

/** @param {FrontMatter} front @param {string} lang */
function resolveListingEmpty(front, lang) {
  if (!front) return "";
  const { listingEmpty } = front;
  if (typeof listingEmpty === "string" && listingEmpty.trim().length > 0) {
    return listingEmpty.trim();
  }
  if (listingEmpty && typeof listingEmpty === "object") {
    const listingEmptyMap = /** @type {Record<string, string>} */ (
      listingEmpty
    );
    const localized = listingEmptyMap[lang];
    if (typeof localized === "string" && localized.trim().length > 0) {
      return localized.trim();
    }
    const fallback = listingEmptyMap[_i18n.default];
    if (typeof fallback === "string" && fallback.trim().length > 0) {
      return fallback.trim();
    }
  }
  return "";
}

/** @param {FrontMatter} front */
function resolveListingHeading(front) {
  if (!front) return "";
  if (
    typeof front.listHeading === "string" &&
    front.listHeading.trim().length > 0
  ) {
    return front.listHeading.trim();
  }
  if (typeof front.title === "string" && front.title.trim().length > 0) {
    return front.title.trim();
  }
  return "";
}

/** @param {Record<string, CollectionEntry[]>} store @param {string} key @param {ContentSummary} entry @param {string} type */
function addCollectionEntry(store, key, entry, type) {
  if (!store[key]) {
    store[key] = [];
  }
  store[key].push({
    ...entry,
    type,
  });
}

/** @param {Record<string, Record<string, CollectionEntry[]>>} collections */
function sortCollectionEntries(collections) {
  /** @type {Record<string, Record<string, CollectionEntry[]>>} */
  const sorted = {};
  Object.keys(collections).forEach((lang) => {
    sorted[lang] = {};
    Object.keys(collections[lang]).forEach((key) => {
      sorted[lang][key] = collections[lang][key].slice().sort((a, b) => {
        const aDate = Date.parse(String(a.date ?? "")) || 0;
        const bDate = Date.parse(String(b.date ?? "")) || 0;
        if (aDate === bDate) {
          return (a.title ?? "").localeCompare(b.title ?? "", lang);
        }
        return bDate - aDate;
      });
    });
  });
  return sorted;
}

/** @param {string} lang @param {number} [limit] */
async function collectRssEntriesForLang(lang, limit = 50) {
  if (_content.contents.count === 0) {
    return [];
  }

  /** @type {Array<{ title: string, description: string, link: string, guid: string, date: string | number | Date, category: string, categories: string[] }>} */
  const entries = [];
  const contentFiles = /** @type {ContentFile[]} */ (
    /** @type {unknown} */ (_content.contents.files)
  );
  for (const file of contentFiles) {
    if (
      !file.isValid ||
      file.isDraft ||
      !file.isPublished ||
      !file.isPostTemplate ||
      file.lang !== lang
    ) {
      continue;
    }

    /** @type {string[]} */
    const categories = [];
    if (file.category) {
      categories.push(file.category);
    }
    if (Array.isArray(file.tags)) {
      categories.push(...file.tags);
    }

    const uniqueCategories = [
      ...new Set(
        categories
          .map((category) =>
            typeof category === "string" ? category.trim() : "",
          )
          .filter(Boolean),
      ),
    ];

    entries.push({
      title: file.title,
      description: file.description,
      link: meta.resolveUrl(file.canonical),
      guid: meta.resolveUrl(file.canonical),
      date: file.date,
      category: file.category,
      categories: uniqueCategories,
    });
  }

  entries.sort((a, b) => {
    const aTime = a.date ? Date.parse(String(a.date)) || 0 : 0;
    const bTime = b.date ? Date.parse(String(b.date)) || 0 : 0;
    return bTime - aTime;
  });

  if (limit && Number.isFinite(limit) && limit > 0) {
    return entries.slice(0, limit);
  }

  return entries;
}

async function collectSitemapEntriesFromContent() {
  if (_content.contents.count === 0) {
    return [];
  }

  /** @type {Array<{ loc: string, lastmod: string }>} */
  const urls = [];
  const contentFiles = /** @type {ContentFile[]} */ (
    /** @type {unknown} */ (_content.contents.files)
  );
  for (const file of contentFiles) {
    if (!file.isValid || file.isDraft || !file.isPublished) {
      continue;
    }

    const absoluteLoc = meta.resolveUrl(file.canonical);
    const updated = file.updated ?? file.date;
    const baseLastmod = _fmt.lastMod(updated) ?? new Date().toISOString();

    urls.push({
      loc: absoluteLoc,
      lastmod: baseLastmod,
    });

    if (
      _cfg.seo.includePaging &&
      (file.template === "collection" || file.template === "home")
    ) {
      /** @type {Record<string, CollectionEntry[]>} */
      const langCollections = PAGES[file.lang] ?? {};
      const key = resolveListingKey(file.header);
      const allItems =
        key && Array.isArray(langCollections[key]) ? langCollections[key] : [];
      const pageSizeSetting = _cfg.content.pagination.pageSize;
      const pageSize = pageSizeSetting > 0 ? pageSizeSetting : 5;
      const totalPages = Math.max(
        1,
        pageSize > 0 ? Math.ceil(allItems.length / pageSize) : 1,
      );

      if (totalPages > 1) {
        const segment = resolvePaginationSegment(file.lang);

        const baseSlug = file.slug.replace(/\/+$/, "");

        /** @type {number | null} */
        let latestTimestamp = null;
        if (Array.isArray(allItems)) {
          allItems.forEach((item) => {
            if (!item || !item.date) return;
            const ts = Date.parse(String(item.date));
            if (!Number.isNaN(ts)) {
              if (latestTimestamp == null || ts > latestTimestamp) {
                latestTimestamp = ts;
              }
            }
          });
        }
        const listingLastmod =
          latestTimestamp != null
            ? (_fmt.lastMod(new Date(latestTimestamp)) ??
              new Date().toISOString())
            : baseLastmod;

        for (let pageIndex = 2; pageIndex <= totalPages; pageIndex += 1) {
          const pageSlug = baseSlug
            ? `${baseSlug}/${segment}-${pageIndex}`
            : `${segment}-${pageIndex}`;

          let canonicalOverride;
          const header = /** @type {FrontMatter} */ (file.header);
          const canonicalSource =
            typeof header?.canonical === "string"
              ? header.canonical
              : file.canonical;
          if (
            typeof canonicalSource === "string" &&
            canonicalSource.trim().length > 0
          ) {
            const trimmed = canonicalSource.trim().replace(/\/+$/, "");
            canonicalOverride = `${trimmed}/${segment}-${pageIndex}/`;
          } else {
            canonicalOverride = undefined;
          }

          const pageCanonical = buildContentUrl(
            canonicalOverride,
            file.lang,
            pageSlug,
          );
          const pageAbsoluteLoc = meta.resolveUrl(pageCanonical);
          urls.push({
            loc: pageAbsoluteLoc,
            lastmod: listingLastmod,
          });
        }
      }
    }
  }

  urls.sort((a, b) => (a.loc || "").localeCompare(b.loc || ""));

  return urls;
}

function collectSitemapEntriesFromDynamicCollections() {
  /** @type {Array<{ loc: string, lastmod: string }>} */
  const urls = [];
  if (!COLLECTION_CONFIG || typeof COLLECTION_CONFIG !== "object") {
    return urls;
  }

  const configKeys = Object.keys(COLLECTION_CONFIG);
  for (const configKey of configKeys) {
    const config = COLLECTION_CONFIG[configKey];
    if (!config || typeof config !== "object") {
      continue;
    }

    const slugPattern =
      config.slugPattern && typeof config.slugPattern === "object"
        ? /** @type {Record<string, string>} */ (config.slugPattern)
        : {};

    const rawTypes =
      Array.isArray(config.types) && config.types.length > 0
        ? /** @type {unknown[]} */ (config.types)
        : null;
    const types = rawTypes
      ? rawTypes
          .map((value) =>
            normalizeCollectionTypeValue(
              typeof value === "string" ? value : "",
            ),
          )
          .filter((value) => value.length > 0)
      : null;

    if (!types || types.length === 0) {
      continue;
    }

    const languages = Object.keys(PAGES);
    for (const lang of languages) {
      /** @type {Record<string, CollectionEntry[]>} */
      /** @type {Record<string, CollectionEntry[]>} */
      const langCollections = PAGES[lang] ?? {};
      const langSlugPattern =
        typeof slugPattern[lang] === "string" ? slugPattern[lang] : null;

      const collectionKeys = Object.keys(langCollections);
      for (const key of collectionKeys) {
        const sourceItems = langCollections[key] ?? [];
        if (!Array.isArray(sourceItems) || sourceItems.length === 0) {
          continue;
        }
        /** @type {CollectionEntry[]} */
        const items = dedupeCollectionItems(sourceItems);
        if (items.length === 0) {
          continue;
        }

        const hasMatchingType = items.some((entry) =>
          types.includes(normalizeCollectionTypeValue(entry.type)),
        );
        if (!hasMatchingType) {
          continue;
        }

        const slug =
          langSlugPattern && langSlugPattern.includes("{{key}}")
            ? langSlugPattern.replace("{{key}}", key)
            : (langSlugPattern ?? key);

        const canonical = buildContentUrl(null, lang, slug);
        const absoluteLoc = meta.resolveUrl(canonical);

        /** @type {number | null} */
        let latestTimestamp = null;
        items.forEach((item) => {
          if (!item || !item.date) return;
          const ts = Date.parse(String(item.updated ?? item.date));
          if (!Number.isNaN(ts)) {
            if (latestTimestamp == null || ts > latestTimestamp) {
              latestTimestamp = ts;
            }
          }
        });

        const lastmod =
          latestTimestamp != null
            ? (_fmt.lastMod(new Date(latestTimestamp)) ??
              new Date().toISOString())
            : new Date().toISOString();

        urls.push({
          loc: absoluteLoc,
          lastmod,
        });
      }
    }
  }

  urls.sort((a, b) => (a.loc || "").localeCompare(b.loc || ""));
  return urls;
}

async function buildRssFeeds() {
  const email = _cfg.identity.email;
  const authorName = _cfg.identity.author;
  const languages = _i18n.supported.length ? _i18n.supported : [_i18n.default];
  const feedUrls = languages.reduce((acc, lang) => {
    const langConfig = _i18n.build[lang] ?? _i18n.build[_i18n.default];
    const baseUrl = (langConfig?.canonical ?? _cfg.identity.url) || "";
    const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    acc[lang] = `${normalizedBase}feed.xml`;
    return acc;
  }, /** @type {Record<string, string>} */ ({}));

  for (const lang of languages) {
    const rssEntries = await collectRssEntriesForLang(lang, 50);
    if (!rssEntries.length) {
      return;
    }

    const siteTitle = _i18n.t(lang, "site.title", _cfg.identity.author);
    const siteDescription = _i18n.t(lang, "site.description", "");
    const langConfig = _i18n.build[lang] ?? _i18n.build[_i18n.default];
    const channelLink = langConfig?.canonical ?? _cfg.identity.url;
    const selfFeedLink = feedUrls[lang] ?? `${channelLink}feed.xml`;
    const languageCulture = _i18n.culture(lang) ?? lang;
    const languageCode = languageCulture.replace("_", "-");
    const lastBuildDate = _fmt.rssDate(new Date());
    const alternateFeedLinks = languages
      .filter(
        (alternateLang) => alternateLang !== lang && feedUrls[alternateLang],
      )
      .map(
        (alternateLang) =>
          `    <atom:link href="${_fmt.escape(feedUrls[alternateLang])}" rel="alternate" hreflang="${_fmt.escape(alternateLang)}" type="application/rss+xml" />`,
      )
      .join("\n");

    const itemsXml = rssEntries
      .map((entry) => {
        const description = entry.description ? entry.description.trim() : "";
        const descriptionCdata = description
          ? `<![CDATA[ ${description} ]]>`
          : "";
        const authorField =
          email && authorName
            ? `${email} (${authorName})`
            : email || authorName || "";
        /** @type {string[]} */
        const categories = [];
        if (entry.category) {
          categories.push(entry.category);
        }

        const categoryLines = [
          ...new Set(
            categories
              .map((category) =>
                typeof category === "string" ? category.trim() : "",
              )
              .filter(Boolean),
          ),
        ]
          .map(
            (category) => `    <category>${_fmt.escape(category)}</category>`,
          )
          .join("\n");

        return [
          "  <item>",
          `    <title>${_fmt.escape(entry.title)}</title>`,
          `    <link>${_fmt.escape(entry.link)}</link>`,
          `    <guid isPermaLink="true">${_fmt.escape(entry.guid)}</guid>`,
          entry.date
            ? `    <pubDate>${_fmt.rssDate(entry.date)}</pubDate>`
            : "",
          descriptionCdata
            ? `    <description>${descriptionCdata}</description>`
            : "",
          authorField ? `    <author>${_fmt.escape(authorField)}</author>` : "",
          categoryLines,
          "  </item>",
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n");

    const rssXml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<?xml-stylesheet type="text/xsl" href="/assets/rss.xsl"?>',
      '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
      "  <channel>",
      `    <title>${_fmt.escape(siteTitle)}</title>`,
      `    <link>${_fmt.escape(channelLink)}</link>`,
      `    <atom:link href="${_fmt.escape(selfFeedLink)}" rel="self" type="application/rss+xml" />`,
      ...(alternateFeedLinks ? [alternateFeedLinks] : []),
      `    <description>${_fmt.escape(siteDescription)}</description>`,
      `    <language>${_fmt.escape(languageCode)}</language>`,
      `    <lastBuildDate>${lastBuildDate}</lastBuildDate>`,
      `    <generator>Shevky Static Site Generator</generator>`,
      `    <managingEditor>${_cfg.identity.email} (${_cfg.identity.author})</managingEditor>`,
      `    <ttl>1440</ttl>`,
      itemsXml,
      "  </channel>",
      "</rss>",
      "",
    ].join("\n");

    const relativePath =
      lang === _i18n.default ? "feed.xml" : _io.path.combine(lang, "feed.xml");
    await writeHtmlFile(relativePath, rssXml, {
      action: "BUILD_FEED",
      type: "xml",
      lang,
      items: rssEntries.length,
      inputBytes: byteLength(itemsXml),
    });
  }
}

async function buildSitemap() {
  const contentEntries = await collectSitemapEntriesFromContent();
  const collectionEntries = SEO_INCLUDE_COLLECTIONS
    ? collectSitemapEntriesFromDynamicCollections()
    : [];
  const combined = [...contentEntries, ...collectionEntries];
  if (!combined.length) {
    return;
  }

  const entryByLoc = new Map();
  combined.forEach((entry) => {
    if (!entry || !entry.loc) return;
    const key = entry.loc;
    const existing = entryByLoc.get(key);
    if (!existing) {
      entryByLoc.set(key, entry);
      return;
    }
    const existingDate = existing.lastmod
      ? Date.parse(String(existing.lastmod))
      : null;
    const incomingDate = entry.lastmod
      ? Date.parse(String(entry.lastmod))
      : null;
    if (
      incomingDate != null &&
      !Number.isNaN(incomingDate) &&
      (existingDate == null ||
        Number.isNaN(existingDate) ||
        incomingDate > existingDate)
    ) {
      entryByLoc.set(key, entry);
    }
  });

  const entries = Array.from(entryByLoc.values()).sort((a, b) =>
    (a.loc || "").localeCompare(b.loc || ""),
  );

  const urlset = entries
    .map((entry) => {
      const parts = ["  <url>", `    <loc>${_fmt.escape(entry.loc)}</loc>`];
      if (entry.lastmod) {
        parts.push(`    <lastmod>${_fmt.escape(entry.lastmod)}</lastmod>`);
      }
      parts.push("  </url>");
      return parts.join("\n");
    })
    .join("\n");

  const sitemapXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml-stylesheet type="text/xsl" href="/assets/sitemap.xsl"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlset,
    "</urlset>",
    "",
  ].join("\n");

  await writeHtmlFile("sitemap.xml", sitemapXml, {
    action: "BUILD_SITEMAP",
    type: "xml",
    items: entries.length,
    inputBytes: byteLength(urlset),
  });
}

async function buildMenuItemsFromContent() {
  if (_content.contents.count === 0) {
    return {};
  }

  /** @type {Record<string, Array<MenuItem & { order?: number }>>} */
  const itemsByLang = {};
  const contentFiles = /** @type {ContentFile[]} */ (
    /** @type {unknown} */ (_content.contents.files)
  );
  for (const file of contentFiles) {
    if (
      !file.isValid ||
      file.isDraft ||
      !file.isPublished ||
      file.isHiddenOnMenu
    ) {
      continue;
    }

    const url = buildContentUrl(file.canonical, file.lang, file.slug);

    if (!Array.isArray(itemsByLang[file.lang])) {
      itemsByLang[file.lang] = [];
    }

    itemsByLang[file.lang].push({
      key: file.id,
      label: file.menuLabel,
      url,
      order: file.menuOrder,
    });
  }

  Object.keys(itemsByLang).forEach((lang) => {
    itemsByLang[lang]
      .sort((a, b) => {
        const aOrder = typeof a.order === "number" ? a.order : 0;
        const bOrder = typeof b.order === "number" ? b.order : 0;
        if (aOrder === bOrder) {
          return a.label.localeCompare(b.label, lang);
        }
        return aOrder - bOrder;
      })
      .forEach((item) => {
        delete item.order;
      });
  });

  return itemsByLang;
}

async function buildContentPages() {
  if (_content.contents.count === 0) {
    return;
  }

  const contentFiles = /** @type {ContentFile[]} */ (
    /** @type {unknown} */ (_content.contents.files)
  );
  for (const file of contentFiles) {
    _log.step("PROCESS_CONTENT", {
      file: normalizeLogPath(file.sourcePath),
      lang: file.lang,
      template: file.template,
      size: formatBytes(byteLength(file.content)),
    });

    const dictionary = _i18n.get(file.lang);
    const componentContext = buildContentComponentContext(
      file.header,
      file.lang,
      dictionary,
    );
    const { markdown: markdownSource, placeholders } = renderMarkdownComponents(
      file.content,
      componentContext,
    );
    if (placeholders.length > 0) {
      _log.step("COMPONENT_SLOTS", {
        file: normalizeLogPath(file.sourcePath),
        count: placeholders.length,
      });
    }

    const markdownHtml = parseMarkdown(markdownSource ?? "");
    const hydratedHtml = injectMarkdownComponents(
      markdownHtml ?? "",
      placeholders,
    );

    if (file.template === "collection" || file.template === "home") {
      await buildPaginatedCollectionPages({
        frontMatter: file.header,
        lang: file.lang,
        baseSlug: file.slug,
        layoutName: file.layout,
        templateName: file.template,
        contentHtml: hydratedHtml,
        dictionary,
        sourcePath: file.sourcePath,
      });

      continue;
    }

    const contentHtml = await renderContentTemplate(
      file.template,
      hydratedHtml,
      file.header,
      file.lang,
      dictionary,
    );
    const pageMeta = meta.buildPageMeta(file.header, file.lang, file.slug);
    const activeMenuKey = resolveActiveMenuKey(file.header);
    const view = buildViewPayload({
      lang: file.lang,
      activeMenuKey,
      pageMeta,
      content: contentHtml,
      dictionary,
    });

    await renderPage({
      layoutName: file.layout,
      view,
      front: file.header,
      lang: file.lang,
      slug: file.slug,
      writeMeta: {
        action: "BUILD_PAGE",
        type: file.template,
        source: file.sourcePath,
        lang: file.lang,
        template: file.layout,
        inputBytes: byteLength(file.content),
      },
    });
  }

  await buildDynamicCollectionPages();
}

/**
 * @param {{ frontMatter: FrontMatter, lang: string, baseSlug: string, layoutName: string, templateName: string, contentHtml: string, dictionary: Record<string, any>, sourcePath: string }} options
 */
async function buildPaginatedCollectionPages(options) {
  const {
    frontMatter,
    lang,
    baseSlug,
    layoutName,
    templateName,
    contentHtml,
    dictionary,
    sourcePath,
  } = options;

  const langCollections = PAGES[lang] ?? {};
  const key = resolveListingKey(frontMatter);
  const sourceItems =
    key && Array.isArray(langCollections[key]) ? langCollections[key] : [];
  const allItems = dedupeCollectionItems(sourceItems);
  const pageSizeSetting = _cfg.content.pagination.pageSize;
  const pageSize = pageSizeSetting > 0 ? pageSizeSetting : 5;
  const totalPages = Math.max(
    1,
    pageSize > 0 ? Math.ceil(allItems.length / pageSize) : 1,
  );
  const emptyMessage = resolveListingEmpty(frontMatter, lang);
  const collectionType = resolveCollectionType(frontMatter, allItems);
  const collectionFlags = buildCollectionTypeFlags(collectionType);

  for (let pageIndex = 1; pageIndex <= totalPages; pageIndex += 1) {
    const startIndex = (pageIndex - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = allItems.slice(startIndex, endIndex);
    const hasItems = items.length > 0;
    const hasPrev = pageIndex > 1;
    const hasNext = pageIndex < totalPages;

    const segment = resolvePaginationSegment(lang);

    const base = baseSlug.replace(/\/+$/, "");

    const pageSlug =
      pageIndex === 1
        ? baseSlug
        : base
          ? `${base}/${segment}-${pageIndex}`
          : `${segment}-${pageIndex}`;

    const prevSlug =
      pageIndex > 2
        ? base
          ? `${base}/${segment}-${pageIndex - 1}`
          : `${segment}-${pageIndex - 1}`
        : baseSlug;

    const nextSlug = base
      ? `${base}/${segment}-${pageIndex + 1}`
      : `${segment}-${pageIndex + 1}`;

    const listing = {
      key,
      lang,
      items,
      hasItems,
      emptyMessage,
      page: pageIndex,
      totalPages,
      hasPrev,
      hasNext,
      hasPagination: totalPages > 1,
      prevUrl: hasPrev ? buildContentUrl(null, lang, prevSlug) : "",
      nextUrl: hasNext ? buildContentUrl(null, lang, nextSlug) : "",
      type: collectionType,
      ...collectionFlags,
    };

    let canonical = frontMatter.canonical;
    if (pageIndex > 1) {
      if (
        typeof frontMatter.canonical === "string" &&
        frontMatter.canonical.trim().length > 0
      ) {
        const trimmed = frontMatter.canonical.trim().replace(/\/+$/, "");
        canonical = `${trimmed}/${segment}-${pageIndex}/`;
      } else {
        canonical = undefined;
      }
    }

    const frontForPage = /** @type {FrontMatter} */ ({
      ...frontMatter,
      slug: pageSlug,
      canonical,
    });

    if (collectionType) {
      frontForPage.collectionType = collectionType;
    }

    const renderedContent = await renderContentTemplate(
      templateName,
      contentHtml,
      frontForPage,
      lang,
      dictionary,
      listing,
    );

    const pageMeta = meta.buildPageMeta(frontForPage, lang, pageSlug);
    const activeMenuKey = resolveActiveMenuKey(frontForPage);
    const view = buildViewPayload({
      lang,
      activeMenuKey,
      pageMeta,
      content: renderedContent,
      dictionary,
    });

    await renderPage({
      layoutName,
      view,
      front: frontForPage,
      lang,
      slug: pageSlug,
      writeMeta: {
        action: "BUILD_COLLECTION",
        type: templateName,
        source: sourcePath,
        lang,
        template: layoutName,
        items: items.length,
        page: `${pageIndex}/${totalPages}`,
        inputBytes: byteLength(renderedContent),
      },
    });
  }
}

/** @param {string} configKey @param {string} defaultKey @param {CollectionEntry[]} items */
function resolveCollectionDisplayKey(configKey, defaultKey, items) {
  if (configKey === "series" && Array.isArray(items)) {
    const entryWithTitle = items.find(
      (entry) =>
        entry &&
        typeof entry.seriesTitle === "string" &&
        entry.seriesTitle.trim().length > 0,
    );
    const seriesTitle =
      typeof entryWithTitle?.seriesTitle === "string"
        ? entryWithTitle.seriesTitle.trim()
        : "";
    if (seriesTitle) {
      return seriesTitle;
    }
  }
  return defaultKey;
}

/** @param {CollectionEntry[]} items */
function dedupeCollectionItems(items) {
  if (!Array.isArray(items) || items.length === 0) return items;
  const seen = new Map();
  /** @type {CollectionEntry[]} */
  const order = [];
  items.forEach((item) => {
    const id = item?.id;
    if (!id) {
      order.push(item);
      return;
    }
    const existingIndex = seen.get(id);
    const hasSeriesTitle = Boolean(item?.seriesTitle);
    if (existingIndex == null) {
      seen.set(id, order.length);
      order.push(item);
      return;
    }
    const existing = order[existingIndex];
    const existingHasSeries = Boolean(existing?.seriesTitle);
    if (hasSeriesTitle && !existingHasSeries) {
      order[existingIndex] = item;
    }
  });
  return order;
}

async function buildDynamicCollectionPages() {
  if (!COLLECTION_CONFIG || typeof COLLECTION_CONFIG !== "object") {
    return;
  }

  const configKeys = Object.keys(COLLECTION_CONFIG);
  for (const configKey of configKeys) {
    const config = COLLECTION_CONFIG[configKey];
    if (!config || typeof config !== "object") {
      continue;
    }

    const templateName =
      typeof config.template === "string" && config.template.trim().length > 0
        ? config.template.trim()
        : "category";

    const slugPattern =
      config.slugPattern && typeof config.slugPattern === "object"
        ? /** @type {Record<string, string>} */ (config.slugPattern)
        : {};
    const pairs =
      config.pairs && typeof config.pairs === "object"
        ? /** @type {Record<string, Record<string, string>>} */ (config.pairs)
        : null;

    const rawTypes =
      Array.isArray(config.types) && config.types.length > 0
        ? /** @type {unknown[]} */ (config.types)
        : null;
    const types = rawTypes
      ? rawTypes
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter((value) => value.length > 0)
      : null;

    if (!types || types.length === 0) {
      continue;
    }

    const languages = Object.keys(PAGES);
    for (const lang of languages) {
      const langCollections = PAGES[lang] ?? {};
      const dictionary = _i18n.get(lang);
      const langSlugPattern =
        typeof slugPattern[lang] === "string" ? slugPattern[lang] : null;
      const titleSuffix = _i18n.t(
        lang,
        `seo.collections.${configKey}.titleSuffix`,
        "",
      );

      const collectionKeys = Object.keys(langCollections);
      for (const key of collectionKeys) {
        /** @type {CollectionEntry[]} */
        const items = langCollections[key] ?? [];
        if (!Array.isArray(items) || items.length === 0) {
          continue;
        }

        const typedItems = items.filter((entry) => {
          if (!entry) {
            return false;
          }
          const entryType =
            typeof entry.type === "string" ? entry.type.trim() : "";
          if (!entryType) {
            return false;
          }
          return types.includes(entryType);
        });
        if (!typedItems.length) {
          continue;
        }

        const dedupedItems = dedupeCollectionItems(typedItems);
        if (!dedupedItems.length) {
          continue;
        }

        const slug =
          langSlugPattern && langSlugPattern.includes("{{key}}")
            ? langSlugPattern.replace("{{key}}", key)
            : (langSlugPattern ?? key);

        let alternate;
        if (pairs) {
          const pairEntry = pairs[key];
          if (pairEntry && typeof pairEntry === "object") {
            /** @type {Record<string, string>} */
            const altMap = {};
            _i18n.supported.forEach((altLang) => {
              if (altLang === lang) {
                return;
              }

              const altKey =
                typeof pairEntry[altLang] === "string"
                  ? pairEntry[altLang].trim()
                  : "";
              if (!altKey) {
                return;
              }

              const altSlugPattern =
                typeof slugPattern[altLang] === "string"
                  ? slugPattern[altLang]
                  : null;
              const altSlug =
                altSlugPattern && altSlugPattern.includes("{{key}}")
                  ? altSlugPattern.replace("{{key}}", altKey)
                  : (altSlugPattern ?? altKey);
              altMap[altLang] = buildContentUrl(null, altLang, altSlug);
            });

            if (Object.keys(altMap).length > 0) {
              alternate = altMap;
            }
          }
        }

        const displayKey = resolveCollectionDisplayKey(
          configKey,
          key,
          dedupedItems,
        );
        const baseTitle = displayKey;
        const normalizedTitleSuffix =
          typeof titleSuffix === "string" && titleSuffix.trim().length > 0
            ? titleSuffix.trim()
            : "";
        const effectiveTitle = normalizedTitleSuffix
          ? `${baseTitle} | ${normalizedTitleSuffix}`
          : baseTitle;
        const frontTitle = configKey === "series" ? displayKey : effectiveTitle;
        const front = /** @type {FrontMatter} */ ({
          title: frontTitle,
          metaTitle: effectiveTitle,
          slug,
          template: templateName,
          listKey: key,
          ...(alternate ? { alternate } : {}),
        });

        front.listHeading = effectiveTitle;
        if (configKey === "series") {
          front.series = key;
          front.seriesTitle = displayKey;
        }

        const fallbackType = normalizeCollectionTypeValue(
          types.length === 1 ? types[0] : "",
        );
        const resolvedCollectionType = resolveCollectionType(
          front,
          dedupedItems,
          fallbackType,
        );
        if (resolvedCollectionType) {
          front.collectionType = resolvedCollectionType;
        }

        const contentHtml = await renderContentTemplate(
          templateName,
          "",
          front,
          lang,
          dictionary,
        );
        const pageMeta = meta.buildPageMeta(front, lang, slug);
        const layoutName = "default";
        const activeMenuKey = resolveActiveMenuKey(front);
        const view = buildViewPayload({
          lang,
          activeMenuKey,
          pageMeta,
          content: contentHtml,
          dictionary,
        });

        await renderPage({
          layoutName,
          view,
          front,
          lang,
          slug,
          writeMeta: {
            action: "BUILD_DYNAMIC_COLLECTION",
            type: templateName,
            source: normalizeLogPath(
              _io.path.combine("collections", configKey),
            ),
            lang,
            template: layoutName,
            items: dedupedItems.length,
            inputBytes: byteLength(contentHtml),
          },
        });
      }
    }
  }
}

/** @param {string} lang @param {string} slug */
function registerLegacyPaths(lang, slug) {
  const cleaned = (slug ?? "").replace(/^\/+/, "");
  if (!cleaned) return;
  const legacyFile = cleaned.endsWith(".html") ? cleaned : `${cleaned}.html`;
  GENERATED_PAGES.add(toPosixPath(legacyFile));
  if (lang && lang !== _i18n.default) {
    GENERATED_PAGES.add(toPosixPath(_io.path.combine(lang, legacyFile)));
  }
}

/** @param {string} currentDir @param {string} relative */
async function copyHtmlRecursive(currentDir = SRC_DIR, relative = "") {
  if (!(await _io.directory.exists(currentDir))) {
    return;
  }

  const entries = await _io.directory.read(currentDir);
  for (const entry of entries) {
    const fullPath = _io.path.combine(currentDir, entry);
    const relPath = relative ? _io.path.combine(relative, entry) : entry;

    if (!entry.endsWith(".html")) {
      continue;
    }

    if (GENERATED_PAGES.has(toPosixPath(relPath))) {
      continue;
    }

    const raw = await _io.file.read(fullPath);
    const transformed = await transformHtml(raw);
    if (relPath === "index.html") {
      _i18n.supported.forEach(async (langCode) => {
        const localized = applyLanguageMetadata(transformed, langCode);
        /** @type {string[]} */
        const segments = [];

        if (langCode !== _i18n.default) {
          segments.push(langCode);
        }

        segments.push("index.html");
        await writeHtmlFile(_io.path.combine(...segments), localized, {
          action: "COPY_HTML",
          type: "static",
          source: fullPath,
          lang: langCode,
          inputBytes: byteLength(transformed),
        });
      });

      continue;
    }

    await writeHtmlFile(relPath, transformed, {
      action: "COPY_HTML",
      type: "static",
      source: fullPath,
      lang: _i18n.default,
      inputBytes: byteLength(transformed),
    });
  }
}

async function copyStaticAssets() {
  if (!(await _io.directory.exists(ASSETS_DIR))) {
    _log.step("ASSETS_SKIP", {
      reason: "missing",
      dir: normalizeLogPath(ASSETS_DIR),
    });
    return;
  }

  const targetDir = _io.path.combine(DIST_DIR, "assets");

  await _io.directory.copy(ASSETS_DIR, targetDir);
  _log.step("ASSETS_COPIED", {
    source: normalizeLogPath(ASSETS_DIR),
    target: normalizeLogPath(targetDir),
  });

  if (!_cfg.build.debug) {
    return;
  }

  try {
    const entries = await _io.directory.read(ASSETS_DIR);
    for (const entry of entries) {
      const srcPath = _io.path.combine(ASSETS_DIR, entry);
      const stats = await _io.file.stat(srcPath);
      if (!stats || (typeof stats.isFile === "function" && !stats.isFile())) {
        continue;
      }
      const destPath = _io.path.combine(targetDir, entry);
      _log.step("COPY_ASSET", {
        source: normalizeLogPath(srcPath),
        target: normalizeLogPath(destPath),
        output: formatBytes(stats?.size ?? 0),
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    _log.debug("ASSET_SCAN_FAILED", { message });
  }
}

async function main() {
  _log.step("BUILD_START", { dist: normalizeLogPath(DIST_DIR) });
  await ensureDist();

  // <--- dist:clean
  await _plugin.execute(_plugin.hooks.DIST_CLEAN);
  // dist:clean --->

  // <--- assets:copy
  await copyStaticAssets();
  await _plugin.execute(_plugin.hooks.ASSETS_COPY);
  // assets:copy --->

  await buildContentPages();
  await copyHtmlRecursive();
  await buildRssFeeds();
  await buildSitemap();
  _log.step("BUILD_DONE", { dist: normalizeLogPath(DIST_DIR) });
}

const API = {
  execute: main,
};

export default API;
