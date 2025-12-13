#!/usr/bin/env node

import crypto from "node:crypto";
import Mustache from "mustache";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import { minify as minifyHtml } from "html-minifier-terser";

import _io from "./io.js";
import _cfg from "./config.js";
import _i18n from "./i18n.js";
import _npm from "./npm.js";
import _fmt from "./format.js";
import _analytics from "./analytics.js";
import _core from "./core.js";
import _social from "./social.js";

const __filename = _io.url.toPath(import.meta.url);
const __dirname = _io.path.name(__filename);
const ROOT_DIR = _io.path.combine(__dirname, "..");
const SRC_DIR = _io.path.combine(ROOT_DIR, "src");
const DIST_DIR = _io.path.combine(ROOT_DIR, "dist");
const CONTENT_DIR = _io.path.combine(SRC_DIR, "content");
const LAYOUTS_DIR = _io.path.combine(SRC_DIR, "layouts");
const COMPONENTS_DIR = _io.path.combine(SRC_DIR, "components");
const TEMPLATES_DIR = _io.path.combine(SRC_DIR, "templates");
const ASSETS_DIR = _io.path.combine(SRC_DIR, "assets");
const SITE_CONFIG_PATH = _io.path.combine(SRC_DIR, "site.json");
const I18N_CONFIG_PATH = _io.path.combine(SRC_DIR, "i18n.json");

await _i18n.load(I18N_CONFIG_PATH);
await _cfg.load(SITE_CONFIG_PATH);
await _core.contents.load(CONTENT_DIR);
await _core.partials.load(LAYOUTS_DIR);
await _core.components.load(COMPONENTS_DIR);
await _core.layouts.load(LAYOUTS_DIR);
await _core.templates.load(TEMPLATES_DIR);

const versionToken = crypto.randomBytes(6).toString("hex");
const SEO_INCLUDE_COLLECTIONS = _cfg.seo.includeCollections;
const DEFAULT_IMAGE = _cfg.seo.defaultImage;
const FALLBACK_ROLES = { tr: "-", en: "-", };
const FALLBACK_QUOTES = { tr: "-", en: "-", };
const FALLBACK_TITLES = { tr: "-", en: "-", };
const FALLBACK_DESCRIPTIONS = { tr: "-", en: "-", };
const FALLBACK_OWNER = "-";
const FALLBACK_TAGLINES = { tr: "-", en: "-", };
const COLLECTION_CONFIG = _cfg.content.collections;

const MENU_ITEMS = await buildMenuItemsFromContent();
const PAGES = await buildCategoryTagCollections();
const FOOTER_POLICIES = await buildFooterPoliciesFromContent();
const CONTENT_INDEX = await buildContentIndex();

const GENERATED_PAGES = new Set();

marked.setOptions({ mangle: false, headerIds: false, gfm: true });
if (_cfg.markdown.highlight) {
  marked.use(
    markedHighlight({
      langPrefix: "hljs language-",
      highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      },
    }),
  );
}
const markdownRenderer = new marked.Renderer();
markdownRenderer.code = (token, infostring) => {
  const isTokenObject = token && typeof token === "object";
  const languageSource = isTokenObject
    ? token.lang
    : typeof infostring === "string"
      ? infostring
      : "";
  const language = (languageSource || "").trim().split(/\s+/)[0]?.toLowerCase() || "text";
  const langClass = language ? ` class="language-${language}"` : "";
  const value = isTokenObject ? token.text ?? "" : token ?? "";
  const alreadyEscaped = Boolean(isTokenObject && token.escaped);
  const content = alreadyEscaped ? value : _fmt.escape(value);
  return `<pre class="code-block" data-code-language="${language}"><code${langClass}>${content}</code></pre>`;
};
marked.use({ renderer: markdownRenderer });

async function ensureDist() {
  await _io.directory.remove(DIST_DIR);
  await _io.directory.create(DIST_DIR);
}

async function buildCss() {
  const configPath = _io.path.combine(ROOT_DIR, "tailwind.config.js");
  const sourePath = _io.path.combine(SRC_DIR, "css", "app.css");
  const distPath = _io.path.combine(DIST_DIR, "output.css");
  const args = [
    "@tailwindcss/cli",
    "-c", configPath,
    "-i", sourePath,
    "-o", distPath
  ];

  if (_cfg.build.minify) {
    args.push("--minify");
  }

  await _npm.executeNpx(args, ROOT_DIR);
}

async function buildJs() {
  const sourePath = _io.path.combine(SRC_DIR, "js", "app.js");
  const distPath = _io.path.combine(DIST_DIR, "output.js");

  const args = [
    "esbuild",
    sourePath,
    "--bundle", "--format=esm", "--target=es2018", "--sourcemap",
    "--outfile=" + distPath,
  ];

  if (_cfg.build.minify) {
    args.push("--minify");
  }

  await _npm.executeNpx(args, ROOT_DIR);
}

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
    console.warn("[build] Failed to minify HTML:", error?.message ?? error);
  }

  return output;
}

function serializeForInlineScript(value) {
  return JSON.stringify(value ?? {})
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function toLocaleArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value.split(",").map((item) => item.trim());
  }

  return [];
}

function normalizeAlternateLocales(value, fallback = []) {
  const primary = toLocaleArray(value);
  const fallbackList = toLocaleArray(fallback);
  const source = primary.length ? primary : fallbackList;
  const seen = new Set();

  return source
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => {
      if (!item || seen.has(item)) {
        return false;
      }

      seen.add(item);
      return true;
    });
}

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
  const anchorPattern = /(<meta property="og:locale" content=".*?" data-og-locale\s*\/?>)/;

  if (anchorPattern.test(output)) {
    return output.replace(anchorPattern, `$1\n${tags}`);
  }

  return `${tags}\n${output}`;
}

function pickFallbackAlternateLang(lang) {
  const supported = _i18n.supported;
  if (!supported.length) {
    return null;
  }

  if (supported.length === 1) {
    return supported[0];
  }

  if (lang && lang !== _i18n.default) {
    return _i18n.default;
  }

  return supported.find((code) => code !== lang) ?? null;
}

function normalizeAlternateOverrides(alternate, lang) {
  if (!alternate) {
    return {};
  }

  if (typeof alternate === "string" && alternate.trim().length > 0) {
    const fallbackLang = pickFallbackAlternateLang(lang);
    if (!fallbackLang) {
      return {};
    }

    return { [fallbackLang]: resolveUrl(alternate.trim()) };
  }

  if (typeof alternate === "object" && !Array.isArray(alternate)) {
    const map = {};
    Object.keys(alternate).forEach((code) => {
      if (!_i18n.supported.includes(code)) {
        return;
      }
      const value = alternate[code];
      if (typeof value === "string" && value.trim().length > 0) {
        map[code] = resolveUrl(value.trim());
      }
    });
    return map;
  }

  return {};
}

function resolvePaginationSegment(lang) {
  const segmentConfig = _cfg?.content?.pagination?.segment ?? {};
  if (
    typeof segmentConfig[lang] === "string" &&
    segmentConfig[lang].trim().length > 0
  ) {
    return segmentConfig[lang].trim();
  }

  const defaultSegment = segmentConfig[_i18n.default];
  if (
    typeof defaultSegment === "string" &&
    defaultSegment.trim().length > 0
  ) {
    return defaultSegment.trim();
  }

  return "page";
}

function buildAlternateUrlMap(front, lang, canonicalUrl) {
  const overrides = normalizeAlternateOverrides(front?.alternate, lang);
  const result = {};

  _i18n.supported.forEach((code) => {
    if (code === lang) {
      result[code] = canonicalUrl;
      return;
    }

    if (overrides[code]) {
      result[code] = overrides[code];
      return;
    }

    const langConfig = _i18n.build[code];
    if (langConfig?.canonical) {
      result[code] = langConfig.canonical;
      return;
    }

    const fallbackPath = code === _i18n.default ? "/" : `/${code}/`;
    result[code] = resolveUrl(fallbackPath);
  });

  result.default = canonicalUrl;
  return result;
}

function buildAlternateLinkList(alternateMap) {
  if (!alternateMap) {
    return [];
  }

  return _i18n.supported.map((code) => ({
    lang: code,
    hreflang: code,
    url: alternateMap[code] ?? alternateMap.default ?? "",
  }));
}

function buildEasterEggPayload(view) {
  if (!_cfg.build.debug) {
    return "{}";
  }

  if (!view || typeof view !== "object") {
    return "{}";
  }

  try {
    return serializeForInlineScript(view);
  } catch {
    return "{}";
  }
}

async function writeHtmlFile(relativePath, html) {
  const destPath = _io.path.combine(DIST_DIR, relativePath);
  await _io.directory.create(_io.path.name(destPath));
  await _io.file.write(destPath, html);
}

function applyLanguageMetadata(html, langKey) {
  const config = _i18n.build[langKey];
  if (!config) {
    return html;
  }

  const altLocales = normalizeAlternateLocales(config.altLocale);

  let output = html
    .replace(/(<html\b[^>]*\slang=")(.*?)"/, `$1${config.langAttr}"`)
    .replace(/(<meta name="language" content=")(.*?)"/, `$1${config.metaLanguage}"`)
    .replace(/(<link rel="canonical" href=")(.*?)" data-canonical/, `$1${config.canonical}" data-canonical`)
    .replace(/(<meta property="og:url" content=")(.*?)" data-og-url/, `$1${config.canonical}" data-og-url`)
    .replace(/(<meta name="twitter:url" content=")(.*?)" data-twitter-url/, `$1${config.canonical}" data-twitter-url`)
    .replace(/(<meta property="og:locale" content=")(.*?)" data-og-locale/, `$1${config.ogLocale}" data-og-locale`);

  output = injectAlternateLocaleMeta(output, altLocales);
  return output;
}

function resolveUrl(value) {
  if (!value) return _cfg.identity.url;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("~/")) {
    return `${_cfg.identity.url}/${value.slice(2)}`.replace(/([^:]\/)\/+/g, "$1");
  }
  if (value.startsWith("/")) {
    return `${_cfg.identity.url}${value}`.replace(/([^:]\/)\/+/g, "$1");
  }
  return `${_cfg.identity.url}/${value}`.replace(/([^:]\/)\/+/g, "$1");
}

function buildSiteData(lang) {
  const fallbackOwner = FALLBACK_OWNER;
  const author = _cfg.identity.author;
  const owner = _i18n.t(lang, "site.owner", fallbackOwner);
  const title = _i18n.t(
    lang,
    "site.title",
    FALLBACK_TITLES[lang] ?? FALLBACK_TITLES[_i18n.default] ?? fallbackOwner,
  );

  const description = _i18n.t(
    lang,
    "site.description",
    FALLBACK_DESCRIPTIONS[lang] ?? FALLBACK_DESCRIPTIONS[_i18n.default] ?? "",
  );

  const role = _i18n.t(
    lang,
    "site.role",
    FALLBACK_ROLES[lang] ?? FALLBACK_ROLES[_i18n.default] ?? FALLBACK_ROLES.en,
  );

  const quote = _i18n.t(
    lang,
    "site.quote",
    FALLBACK_QUOTES[lang] ?? FALLBACK_QUOTES[_i18n.default] ?? FALLBACK_QUOTES.en,
  );

  return {
    title,
    description,
    author,
    owner,
    role,
    quote,
    home: resolveLanguageHomePath(lang),
    url: _cfg.identity.url,
    themeColor: _cfg.identity.themeColor,
    analyticsEnabled: _analytics.enabled,
    gtmId: _analytics.google.gtm,
    year: new Date().getFullYear(),
    languages: {
      supported: _i18n.supported,
      default: _i18n.default,
    },
    languagesCsv: _i18n.supported.join(","),
    defaultLanguage: _i18n.default,
    pagination: {
      pageSize: _cfg.content.pagination.pageSize
    },
    features: {
      postOperations: _cfg.features.postOperations,
      search: _cfg.features.search
    },
  };
}

function getMenuData(lang, activeKey) {
  const baseItems = MENU_ITEMS[lang] ?? MENU_ITEMS[_i18n.default] ?? [];
  const normalizedActiveKey =
    typeof activeKey === "string" && activeKey.trim().length > 0 ? activeKey.trim() : null;
  const hasExplicitMatch = normalizedActiveKey
    ? baseItems.some((item) => item.key === normalizedActiveKey)
    : false;
  const resolvedActiveKey = hasExplicitMatch
    ? normalizedActiveKey
    : baseItems[0]?.key ?? "";
  const items = baseItems.map((item) => ({
    ...item,
    label: _i18n.t(lang, `menu.${item.key}`, item.label ?? item.key),
    isActive: item.key === resolvedActiveKey,
  }));
  return { items, activeKey: resolvedActiveKey };
}

function resolveActiveMenuKey(frontMatter) {
  if (!frontMatter) return null;
  if (typeof frontMatter.id === "string" && frontMatter.id.trim().length > 0) {
    return frontMatter.id.trim();
  }
  if (typeof frontMatter.slug === "string" && frontMatter.slug.trim().length > 0) {
    return frontMatter.slug.trim();
  }
  return null;
}

function buildTagSlug(key, lang) {
  if (!key) {
    return null;
  }

  const tagsConfig = _cfg.content.collections.tags;
  const slugPattern =
    tagsConfig && typeof tagsConfig.slugPattern === "object" ? tagsConfig.slugPattern : {};

  const langPattern = typeof slugPattern[lang] === "string" ? slugPattern[lang] : null;
  if (langPattern) {
    return langPattern.includes("{{key}}") ? langPattern.replace("{{key}}", key) : langPattern;
  }

  if (lang === "en") {
    return `tag/${key}`;
  }

  if (lang === "tr") {
    return `etiket/${key}`;
  }

  return key;
}

function buildTagUrlFromKey(key, lang) {
  const slug = buildTagSlug(key, lang);
  if (!slug) {
    return null;
  }

  return buildContentUrl(null, lang, slug);
}

function buildTagUrlFromLabel(label, lang) {
  const key = _fmt.slugify(label);
  if (!key) {
    return null;
  }

  return buildTagUrlFromKey(key, lang);
}

function buildFooterTags(lang, limit = 20) {
  const langCollections = PAGES[lang] ?? {};
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

function getFooterData(lang) {
  const policiesSource = FOOTER_POLICIES[lang] ?? FOOTER_POLICIES[_i18n.default] ?? [];
  const tagsSource = buildFooterTags(lang, 20);
  const social = _social.get().map((item) => {
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
    label: _i18n.t(lang, `footer.tags.${tag.key}`, tag.label ?? tag.key),
  }));

  const policies = policiesSource.map((policy) => ({
    ...policy,
    label: _i18n.t(lang, `footer.policies.${policy.key}`, policy.label ?? policy.key),
  }));

  const tagline = _i18n.t(
    lang,
    "footer.tagline",
    FALLBACK_TAGLINES[lang] ?? FALLBACK_TAGLINES[_i18n.default] ?? FALLBACK_TAGLINES.en,
  );

  return {
    tags,
    policies,
    social,
    tagline,
  };
}

function buildPageMeta(front, lang, slug) {
  const canonicalUrl = resolveUrl(front.canonical ?? defaultCanonical(lang, slug));
  const langConfig = _i18n.build[lang] ?? {};
  const pageTitleSource =
    typeof front.metaTitle === "string" && front.metaTitle.trim().length > 0
      ? front.metaTitle.trim()
      : typeof front.title === "string" && front.title.trim().length > 0
        ? front.title.trim()
        : "Untitled";
  const ogLocale = langConfig.ogLocale ?? _i18n.culture(lang);
  const defaultAltLocales =
    langConfig.altLocale ??
    _i18n.supported
      .filter((code) => code !== lang)
      .map((code) => _i18n.culture(code));
  const altLocales = normalizeAlternateLocales(front.ogAltLocale, defaultAltLocales);
  const coverSource =
    typeof front.cover === "string" && front.cover.trim().length > 0
      ? front.cover.trim()
      : DEFAULT_IMAGE;
  const ogImage = resolveUrl(coverSource);
  const alternates = buildAlternateUrlMap(front, lang, canonicalUrl);
  const alternateLinks = buildAlternateLinkList(alternates);
  const twitterImage = resolveUrl(coverSource);

  const typeValue = typeof front.type === "string" ? front.type.trim().toLowerCase() : "";
  const templateValue = typeof front.template === "string" ? front.template.trim().toLowerCase() : "";
  const isArticle =
    templateValue === "post" ||
    typeValue === "article" ||
    typeValue === "guide" ||
    typeValue === "post";

  let structuredData = null;
  if (isArticle) {
    structuredData = buildArticleStructuredData(front, lang, canonicalUrl, ogImage);
  } else if (templateValue === "home") {
    structuredData = buildHomeStructuredData(front, lang, canonicalUrl);
  } else if (templateValue === "page") {
    structuredData = buildWebPageStructuredData(front, lang, canonicalUrl);
  }

  const ogType = front.ogType ?? (isArticle ? "article" : "website");

  return {
    title: pageTitleSource,
    description: front.description ?? "",
    robots: front.robots ?? "index,follow",
    canonical: canonicalUrl,
    alternates,
    alternateLinks,
    og: {
      title: front.ogTitle ?? pageTitleSource,
      description: front.description ?? "",
      type: ogType,
      url: canonicalUrl,
      image: ogImage,
      locale: front.ogLocale ?? ogLocale,
      altLocale: altLocales,
    },
    twitter: {
      card: front.twitterCard ?? "summary_large_image",
      title: front.twitterTitle ?? pageTitleSource,
      description: front.description ?? "",
      image: twitterImage,
      url: canonicalUrl,
    },
    structuredData,
  };
}

function resolveArticleSection(front, lang) {
  const rawCategory = typeof front.category === "string" ? front.category.trim().toLowerCase() : "";
  if (!rawCategory) return "";
  if (lang === "tr") {
    if (rawCategory === "yasam-ogrenme") return "Yaşam & Öğrenme";
    if (rawCategory === "teknik-notlar") return "Teknik Notlar";
  }
  if (lang === "en") {
    if (rawCategory === "life-learning") return "Life & Learning";
    if (rawCategory === "technical-notes") return "Technical Notes";
  }
  return rawCategory;
}

function buildArticleStructuredData(front, lang, canonicalUrl, ogImageUrl) {
  const authorName = _cfg.identity.author;
  const articleSection = resolveArticleSection(front, lang);
  const keywordsArray = Array.isArray(front.keywords) && front.keywords.length
    ? front.keywords
    : Array.isArray(front.tags) && front.tags.length
      ? front.tags
      : [];

  const structured = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: front.title ?? "",
    description: front.description ?? "",
    author: { "@type": "Person", name: authorName },
    inLanguage: lang,
    mainEntityOfPage: canonicalUrl,
  };

  if (front.date) {
    structured.datePublished = front.date;
  }
  if (front.updated) {
    structured.dateModified = front.updated;
  }
  if (ogImageUrl) {
    structured.image = [ogImageUrl];
  }
  if (articleSection) {
    structured.articleSection = articleSection;
  }
  if (keywordsArray.length) {
    structured.keywords = keywordsArray;
  }

  return serializeForInlineScript(structured);
}

function buildHomeStructuredData(front, lang, canonicalUrl) {
  const siteData = buildSiteData(lang);
  const authorName = _cfg.identity.author;
  const structured = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteData.title ?? "",
    description: siteData.description ?? "",
    url: canonicalUrl,
    inLanguage: lang,
    publisher: {
      "@type": "Person",
      name: authorName,
    },
  };
  return serializeForInlineScript(structured);
}

function buildWebPageStructuredData(front, lang, canonicalUrl) {
  const authorName = _cfg.identity.author;
  const keywordsArray = Array.isArray(front.keywords) && front.keywords.length
    ? front.keywords
    : Array.isArray(front.tags) && front.tags.length
      ? front.tags
      : [];

  const structured = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    headline: front.title ?? "",
    description: front.description ?? "",
    author: { "@type": "Person", name: authorName },
    inLanguage: lang,
    mainEntityOfPage: canonicalUrl,
  };

  if (keywordsArray.length) {
    structured.keywords = keywordsArray;
  }

  return serializeForInlineScript(structured);
}

function defaultCanonical(lang, slug) {
  const cleanedSlug = (slug ?? "").replace(/^\/+/, "").replace(/\/+$/, "");
  const langConfig = _i18n.build[lang];
  let base = langConfig?.canonical;
  if (!base) {
    const fallbackPath = lang === _i18n.default ? "/" : `/${lang}/`;
    base = resolveUrl(fallbackPath);
  }

  const normalizedBase = base.replace(/\/+$/, "/");
  if (!cleanedSlug) {
    return normalizedBase;
  }

  return `${normalizedBase}${cleanedSlug}/`;
}

function canonicalToRelativePath(value) {
  if (!value) return null;
  let path = value;
  if (path.startsWith("~/")) {
    path = path.slice(2);
  } else if (/^https?:\/\//i.test(path)) {
    path = path.replace(/^https?:\/\/[^/]+/i, "");
  }
  path = path.trim();
  if (!path) return null;
  return path.replace(/^\/+/, "").replace(/\/+$/, "");
}

function resolveLanguageHomePath(lang) {
  if (typeof _i18n.homePath === "function") {
    const resolved = _i18n.homePath(lang);
    if (resolved && typeof resolved === "string") {
      return resolved;
    }
  }

  if (!lang || lang === _i18n.default) {
    return "/";
  }

  return `/${lang}/`.replace(/\/+/g, "/");
}

async function renderContentTemplate(templateName, contentHtml, front, lang, dictionary, listingOverride) {
  const template = _core.templates.get(templateName);
  const normalizedTags = Array.isArray(front.tags)
    ? front.tags.filter((tag) => typeof tag === "string" && tag.trim().length > 0)
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
  const categoryUrl = categorySlug ? buildContentUrl(null, lang, categorySlug) : null;
  const resolvedDictionary = dictionary ?? _i18n.get(lang);
  const normalizedFront = {
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
  };
  normalizedFront.seriesListing = buildSeriesListing(normalizedFront, lang);
  const listing = listingOverride ?? buildCollectionListing(normalizedFront, lang);
  const site = buildSiteData(lang);
  const languageFlags = _i18n.flags(lang);
  return Mustache.render(template, {
    content: { html: decorateHtml(contentHtml, templateName) },
    front: normalizedFront,
    lang,
    listing,
    site,
    locale: languageFlags.locale,
    isEnglish: languageFlags.isEnglish,
    isTurkish: languageFlags.isTurkish,
    i18n: resolvedDictionary,
  });
}

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

function renderMarkdownComponents(markdown, context = {}) {
  if (!markdown || typeof markdown !== "string") {
    return { markdown: markdown ?? "", placeholders: [] };
  }
  const placeholders = [];
  const componentPattern = /{{>\s*components\/([A-Za-z0-9_\-./]+)\s*}}/g;
  let working = markdown;

  working = working.replace(componentPattern, (_, componentName) => {
    const partialKey = componentName.startsWith("components/")
      ? componentName
      : `components/${componentName}`;
    const template = _core.components.files[partialKey];
    if (!template) return "";
    const tokenId = `COMPONENT_SLOT_${placeholders.length}_${componentName.replace(/[^A-Za-z0-9_-]/g, "_")}_${crypto.randomBytes(4).toString("hex")}`;
    const marker = `\n<!--${tokenId}-->\n`;

    const html = Mustache.render(template, context, {
      ..._core.partials.files,
      ..._core.components.files,
    });

    placeholders.push({ marker, html });
    return marker;
  });

  const renderedMarkdown = Mustache.render(working, context, {
    ..._core.partials.files,
    ..._core.components.files,
  });

  return { markdown: renderedMarkdown, placeholders };
}

function injectMarkdownComponents(html, placeholders) {
  if (!html || !placeholders || !placeholders.length) {
    return html;
  }
  let output = html;
  placeholders.forEach(({ marker, html: snippet }) => {
    output = output.split(marker).join(snippet);
  });
  return output;
}

function decorateHtml(html, templateName) {
  return html;
}

function buildOutputPath(front, lang, slug) {
  const canonicalRelative = canonicalToRelativePath(front.canonical);
  if (canonicalRelative) {
    return _io.path.combine(canonicalRelative, "index.html");
  }
  const cleaned = (slug ?? "").replace(/^\/+/, "");
  const segments = [];
  if (lang && lang !== _i18n.default) {
    segments.push(lang);
  }
  if (cleaned) {
    segments.push(cleaned);
  }
  return _io.path.combine(...segments.filter(Boolean), "index.html");
}

function toPosixPath(value) {
  return value.split(_io.path.seperator).join("/");
}

function buildContentUrl(canonical, lang, slug) {
  const normalizedLang = lang ?? _i18n.default;
  if (typeof canonical === "string" && canonical.trim().length > 0) {
    const relative = canonicalToRelativePath(canonical.trim());
    if (relative) {
      return `/${relative}`.replace(/\/+/g, "/");
    }

    return canonical.trim();
  }
  const fallback = canonicalToRelativePath(defaultCanonical(normalizedLang, slug));
  if (fallback) {
    return `/${fallback}`.replace(/\/+/g, "/");
  }
  const slugSegment = slug ? `/${slug}` : "/";
  if (normalizedLang !== _i18n.default) {
    return `/${normalizedLang}${slugSegment}`.replace(/\/+/g, "/");
  }

  return slugSegment.replace(/\/+/g, "/");
}

async function buildFooterPoliciesFromContent() {
  if (_core.contents.count === 0) {
    return {};
  }

  const policiesByLang = {};
  for (const file of _core.contents.files) {
    if (!file.isValid || file.isDraft || !file.isPublished || file.category !== "policy") {
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
  if (_core.contents.count === 0) {
    return {};
  }

  const index = {};
  for (const file of _core.contents.files) {
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
  if (_core.contents.count === 0) {
    return {};
  }

  const pagesByLang = {};
  for (const file of _core.contents.files) {
    if (!file.isValid || file.isDraft || !file.isPublished) {
      continue;
    }

    const summary = {
      ...file.summary,
      canonical: buildContentUrl(file.canonical, file.lang, file.slug)
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
      addCollectionEntry(langStore, file.series, {
        ...summary,
        seriesTitle: file.seriesTitle
      }, "series");
    }
  }

  return sortCollectionEntries(pagesByLang);
}

function buildCollectionListing(front, lang) {
  const normalizedLang = lang ?? _i18n.default;
  const langCollections = PAGES[normalizedLang] ?? {};
  const key = resolveListingKey(front);
  const sourceItems = key && Array.isArray(langCollections[key]) ? langCollections[key] : [];
  const items = dedupeCollectionItems(sourceItems);
  return {
    key,
    lang: normalizedLang,
    items,
    hasItems: items.length > 0,
    emptyMessage: resolveListingEmpty(front, normalizedLang),
    heading: resolveListingHeading(front),
  };
}

function buildSeriesListing(front, lang) {
  const relatedSource = Array.isArray(front?.related) ? front.related : [];
  const seriesName = typeof front?.seriesTitle === "string" && front.seriesTitle.trim().length > 0
    ? front.seriesTitle.trim()
    : typeof front?.series === "string"
      ? front.series.trim()
      : "";
  const currentId = typeof front?.id === "string" ? front.id.trim() : "";
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
      summary = summaryLookup[summaryLang] ?? summaryLookup[front?.lang] ?? Object.values(summaryLookup)[0];
    }
    const label = summary?.title ?? (isCurrent ? front?.title ?? value : value);
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

function resolveListingEmpty(front, lang) {
  if (!front) return "";
  const { listingEmpty } = front;
  if (typeof listingEmpty === "string" && listingEmpty.trim().length > 0) {
    return listingEmpty.trim();
  }
  if (listingEmpty && typeof listingEmpty === "object") {
    const localized = listingEmpty[lang];
    if (typeof localized === "string" && localized.trim().length > 0) {
      return localized.trim();
    }
    const fallback = listingEmpty[_i18n.default];
    if (typeof fallback === "string" && fallback.trim().length > 0) {
      return fallback.trim();
    }
  }
  return "";
}

function resolveListingHeading(front) {
  if (!front) return "";
  if (typeof front.listHeading === "string" && front.listHeading.trim().length > 0) {
    return front.listHeading.trim();
  }
  if (typeof front.title === "string" && front.title.trim().length > 0) {
    return front.title.trim();
  }
  return "";
}

function addCollectionEntry(store, key, entry, type) {
  if (!store[key]) {
    store[key] = [];
  }
  store[key].push({
    ...entry,
    type,
  });
}

function sortCollectionEntries(collections) {
  const sorted = {};
  Object.keys(collections).forEach((lang) => {
    sorted[lang] = {};
    Object.keys(collections[lang]).forEach((key) => {
      sorted[lang][key] = collections[lang][key]
        .slice()
        .sort((a, b) => {
          const aDate = Date.parse(a.date ?? "") || 0;
          const bDate = Date.parse(b.date ?? "") || 0;
          if (aDate === bDate) {
            return (a.title ?? "").localeCompare(b.title ?? "", lang);
          }
          return bDate - aDate;
        });
    });
  });
  return sorted;
}

async function collectRssEntriesForLang(lang, limit = 50) {
  if (_core.contents.count === 0) {
    return [];
  }

  const entries = [];
  for (const file of _core.contents.files) {
    if (!file.isValid || file.isDraft || !file.isPublished || !file.isPostTemplate || file.lang !== lang) {
      continue;
    }

    entries.push({
      title: file.title,
      description: file.description,
      link: resolveUrl(file.canonical),
      guid: resolveUrl(file.canonical),
      date: file.date,
      category: file.category
    });
  }

  entries.sort((a, b) => {
    const aTime = a.date ? Date.parse(a.date) || 0 : 0;
    const bTime = b.date ? Date.parse(b.date) || 0 : 0;
    return bTime - aTime;
  });

  if (limit && Number.isFinite(limit) && limit > 0) {
    return entries.slice(0, limit);
  }

  return entries;
}

async function collectSitemapEntriesFromContent() {
  if (_core.contents.count === 0) {
    return [];
  }

  const urls = [];
  for (const file of _core.contents.files) {
    if (!file.isValid || file.isDraft || !file.isPublished) {
      continue;
    }

    const absoluteLoc = resolveUrl(file.canonical);
    const updated = file.updated ?? file.date;
    const baseLastmod = _fmt.lastMod(updated);

    urls.push({
      loc: absoluteLoc,
      lastmod: baseLastmod,
    });

    if (_cfg.seo.includePaging && (file.template === "collection" || file.template === "home")) {
      const langCollections = PAGES[file.lang] ?? {};
      const key = resolveListingKey(file.header);
      const allItems = key && Array.isArray(langCollections[key]) ? langCollections[key] : [];
      const pageSizeSetting = _cfg.content.pagination.pageSize;
      const pageSize = pageSizeSetting > 0 ? pageSizeSetting : 5;
      const totalPages = Math.max(1, pageSize > 0 ? Math.ceil(allItems.length / pageSize) : 1);

      if (totalPages > 1) {
        const segment = resolvePaginationSegment(file.lang);

        const baseSlug = file.slug.replace(/\/+$/, "");

        let latestTimestamp = null;
        if (Array.isArray(allItems)) {
          allItems.forEach((item) => {
            if (!item || !item.date) return;
            const ts = Date.parse(item.date);
            if (!Number.isNaN(ts)) {
              if (latestTimestamp == null || ts > latestTimestamp) {
                latestTimestamp = ts;
              }
            }
          });
        }
        const listingLastmod =
          latestTimestamp != null ? _fmt.lastMod(new Date(latestTimestamp)) : baseLastmod;

        for (let pageIndex = 2; pageIndex <= totalPages; pageIndex += 1) {
          const pageSlug = baseSlug
            ? `${baseSlug}/${segment}-${pageIndex}`
            : `${segment}-${pageIndex}`;

          let canonicalOverride;
          if (typeof data.canonical === "string" && data.canonical.trim().length > 0) {
            const trimmed = data.canonical.trim().replace(/\/+$/, "");
            canonicalOverride = `${trimmed}/${segment}-${pageIndex}/`;
          } else {
            canonicalOverride = undefined;
          }

          const pageCanonical = buildContentUrl(canonicalOverride, file.lang, pageSlug);
          const pageAbsoluteLoc = resolveUrl(pageCanonical);
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

async function buildRssFeeds() {
  const email = _cfg.identity.email;
  const authorName = _cfg.identity.author;
  const languages = _i18n.supported.length ? _i18n.supported : [_i18n.default];

  for (const lang of languages) {
    const rssEntries = await collectRssEntriesForLang(lang, 50);
    if (!rssEntries.length) {
      return;
    }

    const siteTitle = _i18n.t(lang, "site.title", _cfg.identity.author);
    const siteDescription = _i18n.t(lang, "site.description", "");
    const langConfig = _i18n.build[lang] ?? _i18n.build[_i18n.default];
    const channelLink = langConfig?.canonical ?? _cfg.identity.url;
    const languageCulture = _i18n.culture(lang) ?? lang;
    const languageCode = languageCulture.replace("_", "-");
    const lastBuildDate = _fmt.rssDate(new Date());

    const itemsXml = rssEntries
      .map((entry) => {
        const description = entry.description ? entry.description.trim() : "";
        const descriptionCdata = description ? `<![CDATA[ ${description} ]]>` : "";
        const authorField =
          email && authorName ? `${email} (${authorName})` : email || authorName || "";
        const categoryLine =
          entry.category && entry.category.length
            ? `    <category>${_fmt.escape(entry.category)}</category>`
            : "";
        return [
          "  <item>",
          `    <title>${_fmt.escape(entry.title)}</title>`,
          `    <link>${_fmt.escape(entry.link)}</link>`,
          `    <guid isPermaLink="true">${_fmt.escape(entry.guid)}</guid>`,
          entry.date ? `    <pubDate>${_fmt.rssDate(entry.date)}</pubDate>` : "",
          descriptionCdata ? `    <description>${descriptionCdata}</description>` : "",
          authorField ? `    <author>${_fmt.escape(authorField)}</author>` : "",
          categoryLine,
          "  </item>",
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n");

    const rssXml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<?xml-stylesheet type="text/xsl" href="/assets/rss.xsl"?>',
      '<rss version="2.0">',
      "  <channel>",
      `    <title>${_fmt.escape(siteTitle)}</title>`,
      `    <link>${_fmt.escape(channelLink)}</link>`,
      `    <description>${_fmt.escape(siteDescription)}</description>`,
      `    <language>${_fmt.escape(languageCode)}</language>`,
      `    <lastBuildDate>${lastBuildDate}</lastBuildDate>`,
      itemsXml,
      "  </channel>",
      "</rss>",
      "",
    ].join("\n");

    const relativePath =
      lang === _i18n.default ? "feed.xml" : _io.path.combine(lang, "feed.xml");
    await writeHtmlFile(relativePath, rssXml);
  }
}

async function collectSitemapEntriesFromFeeds() {
  const urls = [];
  const languages = _i18n.supported.length ? _i18n.supported : [_i18n.default];

  for (const lang of languages) {
    const rssEntries = await collectRssEntriesForLang(lang, 1);
    if (!rssEntries.length) {
      return;
    }

    const latest = rssEntries[0];
    const relativeUrl = lang === _i18n.default ? "/feed.xml" : `/${lang}/feed.xml`;
    const lastmod = latest?.date ? _fmt.lastMod(latest.date) : null;

    urls.push({
      loc: resolveUrl(relativeUrl),
      ...(lastmod ? { lastmod } : {}),
    });
  }

  return urls;
}

async function buildSitemap() {
  const contentEntries = await collectSitemapEntriesFromContent();
  const collectionEntries = SEO_INCLUDE_COLLECTIONS ? collectSitemapEntriesFromDynamicCollections() : [];

  let feedEntries = await collectSitemapEntriesFromFeeds();
  if (!feedEntries) {
    feedEntries = [];
  }

  const combined = [...contentEntries, ...collectionEntries, ...feedEntries];
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
    const existingDate = existing.lastmod ? Date.parse(existing.lastmod) : null;
    const incomingDate = entry.lastmod ? Date.parse(entry.lastmod) : null;
    if (
      incomingDate != null
      && !Number.isNaN(incomingDate)
      && (existingDate == null || Number.isNaN(existingDate) || incomingDate > existingDate)
    ) {
      entryByLoc.set(key, entry);
    }
  });

  const entries = Array.from(entryByLoc.values()).sort((a, b) =>
    (a.loc || "").localeCompare(b.loc || ""),
  );

  const urlset = entries
    .map((entry) => {
      const parts = [
        "  <url>",
        `    <loc>${_fmt.escape(entry.loc)}</loc>`,
      ];
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

  await writeHtmlFile("sitemap.xml", sitemapXml);
}

function collectSitemapEntriesFromDynamicCollections() {
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
      config.slugPattern && typeof config.slugPattern === "object" ? config.slugPattern : {};

    const types =
      Array.isArray(config.types) && config.types.length > 0
        ? config.types
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter((value) => value.length > 0)
        : null;

    if (!types || types.length === 0) {
      continue;
    }

    const languages = Object.keys(PAGES);
    for (const lang of languages) {
      const langCollections = PAGES[lang] ?? {};
      const langSlugPattern = typeof slugPattern[lang] === "string" ? slugPattern[lang] : null;

      const collectionKeys = Object.keys(langCollections);
      for (const key of collectionKeys) {
        const sourceItems = langCollections[key] ?? [];
        if (!Array.isArray(sourceItems) || sourceItems.length === 0) {
          continue;
        }
        const items = dedupeCollectionItems(sourceItems);
        if (items.length === 0) {
          continue;
        }

        const hasMatchingType = items.some((entry) => types.includes(entry.type));
        if (!hasMatchingType) {
          continue;
        }

        const slug =
          langSlugPattern && langSlugPattern.includes("{{key}}")
            ? langSlugPattern.replace("{{key}}", key)
            : (langSlugPattern ?? key);

        const canonical = buildContentUrl(null, lang, slug);
        const absoluteLoc = resolveUrl(canonical);

        let latestTimestamp = null;
        items.forEach((item) => {
          if (!item || !item.date) return;
          const ts = Date.parse(item.date);
          if (!Number.isNaN(ts)) {
            if (latestTimestamp == null || ts > latestTimestamp) {
              latestTimestamp = ts;
            }
          }
        });
        const lastmod =
          latestTimestamp != null ? _fmt.lastMod(new Date(latestTimestamp)) : null;

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

async function buildRobotsTxt() {
  const base = (_cfg.identity.url).replace(/\/+$/, "");
  const allowList = _cfg.robots.allow;
  const disallowList = _cfg.robots.disallow;

  const lines = ["User-agent: *"];

  allowList.forEach((path) => {
    if (typeof path === "string" && path.trim().length > 0) {
      lines.push(`Allow: ${path.trim()}`);
    }
  });

  disallowList.forEach((path) => {
    if (typeof path === "string" && path.trim().length > 0) {
      lines.push(`Disallow: ${path.trim()}`);
    }
  });

  lines.push("");
  lines.push(`Sitemap: ${base}/sitemap.xml`);
  lines.push("");

  await writeHtmlFile("robots.txt", lines.join("\n"));
}

async function buildMenuItemsFromContent() {
  if (_core.contents.count === 0) {
    return {};
  }

  const itemsByLang = {};
  for (const file of _core.contents.files) {
    if (!file.isValid || file.isDraft || !file.isPublished || file.isHiddenOnMenu) {
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
        if (a.order === b.order) {
          return a.label.localeCompare(b.label, lang);
        }
        return a.order - b.order;
      })
      .forEach((item) => {
        delete item.order;
      });
  });

  return itemsByLang;
}

async function buildContentPages() {
  if (!_core.contents.count === 0) {
    return;
  }

  for (const file of _core.contents.files) {
    const dictionary = _i18n.get(file.lang);
    const componentContext = buildContentComponentContext(file.header, file.lang, dictionary);
    const { markdown: markdownSource, placeholders } = renderMarkdownComponents(file.content, componentContext);

    const markdownHtml = marked.parse(markdownSource ?? "");
    const hydratedHtml = injectMarkdownComponents(markdownHtml ?? "", placeholders);

    if (file.template === "collection" || file.template === "home") {
      await buildPaginatedCollectionPages({
        frontMatter: file.header,
        lang: file.lang,
        baseSlug: file.slug,
        layoutName: file.layout,
        templateName: file.template,
        contentHtml: hydratedHtml,
        dictionary,
      });

      continue;
    }

    const contentHtml = await renderContentTemplate(file.template, hydratedHtml, file.header, file.lang, dictionary);
    const pageMeta = buildPageMeta(file.header, file.lang, file.slug);
    const layoutTemplate = _core.layouts.get(file.layout);
    const activeMenuKey = resolveActiveMenuKey(file.header);
    const languageFlags = _i18n.flags(file.lang);
    const view = {
      lang: file.lang,
      locale: languageFlags.locale,
      isEnglish: languageFlags.isEnglish,
      isTurkish: languageFlags.isTurkish,
      theme: "light",
      site: buildSiteData(file.lang),
      menu: getMenuData(file.lang, activeMenuKey),
      footer: getFooterData(file.lang),
      pages: PAGES,
      i18n: dictionary,
      i18nInline: _i18n.serialize(),
      page: pageMeta,
      content: contentHtml,
      scripts: {
        analytics: _analytics.snippets,
        body: [],
      },
    };
    view.easterEgg = buildEasterEggPayload(view);
    const rendered = Mustache.render(layoutTemplate, view, _core.partials.files);
    const finalHtml = await transformHtml(rendered);
    const relativePath = buildOutputPath(file.header, file.lang, file.slug);
    await writeHtmlFile(relativePath, finalHtml);
    GENERATED_PAGES.add(toPosixPath(relativePath));
    registerLegacyPaths(file.lang, file.slug);
  }

  await buildDynamicCollectionPages();
}

async function buildPaginatedCollectionPages(options) {
  const {
    frontMatter,
    lang,
    baseSlug,
    layoutName,
    templateName,
    contentHtml,
    dictionary,
  } = options;

  const langCollections = PAGES[lang] ?? {};
  const key = resolveListingKey(frontMatter);
  const sourceItems = key && Array.isArray(langCollections[key]) ? langCollections[key] : [];
  const allItems = dedupeCollectionItems(sourceItems);
  const pageSizeSetting = _cfg.content.pagination.pageSize;
  const pageSize = pageSizeSetting > 0 ? pageSizeSetting : 5;
  const totalPages = Math.max(1, pageSize > 0 ? Math.ceil(allItems.length / pageSize) : 1);
  const emptyMessage = resolveListingEmpty(frontMatter, lang);

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

    const nextSlug = base ? `${base}/${segment}-${pageIndex + 1}` : `${segment}-${pageIndex + 1}`;

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
    };

    let canonical = frontMatter.canonical;
    if (pageIndex > 1) {
      if (typeof frontMatter.canonical === "string" && frontMatter.canonical.trim().length > 0) {
        const trimmed = frontMatter.canonical.trim().replace(/\/+$/, "");
        canonical = `${trimmed}/${segment}-${pageIndex}/`;
      } else {
        canonical = undefined;
      }
    }

    const frontForPage = {
      ...frontMatter,
      slug: pageSlug,
      canonical,
    };

    const renderedContent = await renderContentTemplate(
      templateName,
      contentHtml,
      frontForPage,
      lang,
      dictionary,
      listing,
    );
    const pageMeta = buildPageMeta(frontForPage, lang, pageSlug);
    const layoutTemplate = _core.layouts.get(layoutName);
    const activeMenuKey = resolveActiveMenuKey(frontForPage);
    const languageFlags = _i18n.flags(lang);
    const view = {
      lang,
      locale: languageFlags.locale,
      isEnglish: languageFlags.isEnglish,
      isTurkish: languageFlags.isTurkish,
      theme: "light",
      site: buildSiteData(lang),
      menu: getMenuData(lang, activeMenuKey),
      footer: getFooterData(lang),
      pages: PAGES,
      i18n: dictionary,
      i18nInline: _i18n.serialize(),
      page: pageMeta,
      content: renderedContent,
      scripts: {
        analytics: _analytics.snippets,
        body: [],
      },
    };
    view.easterEgg = buildEasterEggPayload(view);
    const rendered = Mustache.render(layoutTemplate, view, _core.partials.files);
    const finalHtml = await transformHtml(rendered);
    const relativePath = buildOutputPath(frontForPage, lang, pageSlug);
    await writeHtmlFile(relativePath, finalHtml);
    GENERATED_PAGES.add(toPosixPath(relativePath));
    registerLegacyPaths(lang, pageSlug);
  }
}

function resolveCollectionDisplayKey(configKey, defaultKey, items) {
  if (configKey === "series" && Array.isArray(items)) {
    const entryWithTitle = items.find((entry) =>
      entry && typeof entry.seriesTitle === "string" && entry.seriesTitle.trim().length > 0,
    );
    if (entryWithTitle) {
      return entryWithTitle.seriesTitle.trim();
    }
  }
  return defaultKey;
}

function dedupeCollectionItems(items) {
  if (!Array.isArray(items) || items.length === 0) return items;
  const seen = new Map();
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
      config.slugPattern && typeof config.slugPattern === "object" ? config.slugPattern : {};
    const pairs =
      config.pairs && typeof config.pairs === "object" ? config.pairs : null;

    const types =
      Array.isArray(config.types) && config.types.length > 0
        ? config.types
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
      const langSlugPattern = typeof slugPattern[lang] === "string" ? slugPattern[lang] : null;
      const titleSuffix = _i18n.t(
        lang,
        `seo.collections.${configKey}.titleSuffix`,
        "",
      );

      const collectionKeys = Object.keys(langCollections);
      for (const key of collectionKeys) {
        const items = langCollections[key] ?? [];
        if (!Array.isArray(items) || items.length === 0) {
          continue;
        }

        const hasMatchingType = items.some((entry) => types.includes(entry.type));
        if (!hasMatchingType) {
          continue;
        }

        const dedupedItems = dedupeCollectionItems(items);
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
            const altMap = {};
            _i18n.supported.forEach((altLang) => {
              if (altLang === lang) {
                return;
              }
              const altKey =
                typeof pairEntry[altLang] === "string" ? pairEntry[altLang].trim() : "";
              if (!altKey) {
                return;
              }
              const altSlugPattern =
                typeof slugPattern[altLang] === "string" ? slugPattern[altLang] : null;
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

        const displayKey = resolveCollectionDisplayKey(configKey, key, dedupedItems);
        const baseTitle = displayKey;
        const normalizedTitleSuffix =
          typeof titleSuffix === "string" && titleSuffix.trim().length > 0
            ? titleSuffix.trim()
            : "";
        const effectiveTitle = normalizedTitleSuffix
          ? `${baseTitle} | ${normalizedTitleSuffix}`
          : baseTitle;
        const frontTitle =
          configKey === "series"
            ? displayKey
            : effectiveTitle;
        const front = {
          title: frontTitle,
          metaTitle: effectiveTitle,
          slug,
          template: templateName,
          listKey: key,
          ...(alternate ? { alternate } : {}),
        };
        front.listHeading = effectiveTitle;
        if (configKey === "series") {
          front.series = key;
          front.seriesTitle = displayKey;
        }

        const contentHtml = await renderContentTemplate(templateName, "", front, lang, dictionary);
        const pageMeta = buildPageMeta(front, lang, slug);
        const layoutName = "default";
        const layoutTemplate = _core.layouts.get(layoutName);
        const activeMenuKey = resolveActiveMenuKey(front);
        const languageFlags = _i18n.flags(lang);
        const view = {
          lang,
          locale: languageFlags.locale,
          isEnglish: languageFlags.isEnglish,
          isTurkish: languageFlags.isTurkish,
          theme: "light",
          site: buildSiteData(lang),
          menu: getMenuData(lang, activeMenuKey),
          footer: getFooterData(lang),
          pages: PAGES,
          i18n: dictionary,
          i18nInline: _i18n.serialize(),
          page: pageMeta,
          content: contentHtml,
          scripts: {
            analytics: _analytics.snippets,
            body: [],
          },
        };
        view.easterEgg = buildEasterEggPayload(view);
        const rendered = Mustache.render(layoutTemplate, view, _core.partials.files);
        const finalHtml = await transformHtml(rendered);
        const relativePath = buildOutputPath(front, lang, slug);
        await writeHtmlFile(relativePath, finalHtml);
        GENERATED_PAGES.add(toPosixPath(relativePath));
        registerLegacyPaths(lang, slug);
      }
    }
  }
}

function registerLegacyPaths(lang, slug) {
  const cleaned = (slug ?? "").replace(/^\/+/, "");
  if (!cleaned) return;
  const legacyFile = cleaned.endsWith(".html") ? cleaned : `${cleaned}.html`;
  GENERATED_PAGES.add(toPosixPath(legacyFile));
  if (lang && lang !== _i18n.default) {
    GENERATED_PAGES.add(toPosixPath(_io.path.combine(lang, legacyFile)));
  }
}

async function copyHtmlRecursive(currentDir = SRC_DIR, relative = "") {
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
        const segments = [];

        if (langCode !== _i18n.default) {
          segments.push(langCode);
        }

        segments.push("index.html");
        await writeHtmlFile(_io.path.combine(...segments), localized);
      });

      continue;
    }

    await writeHtmlFile(relPath, transformed);
  }
}

async function copyStaticAssets() {
  if (!(await _io.directory.exists(ASSETS_DIR))) {
    return;
  }

  const targetDir = _io.path.combine(DIST_DIR, "assets");

  await _io.directory.copy(ASSETS_DIR, targetDir);
}

async function main() {
  await ensureDist();
  await buildCss();
  await buildJs();
  await copyStaticAssets();

  await buildContentPages();
  await copyHtmlRecursive();
  await buildRssFeeds();
  await buildSitemap();
  await buildRobotsTxt();
}

const API = {
  execute: main
};

export default API;