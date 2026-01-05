import _io from "./io.js";

/**
 * @typedef {Object} SeoConfig
 * @property {string} defaultImage Absolute or relative fallback image URL.
 * @property {boolean} includeCollections Adds collection listings into SEO metadata.
 * @property {boolean} includePaging Adds pagination references into SEO metadata.
 * @property {number} footerTagCount Number of tags in footer.
 */

/**
 * @typedef {Object} AnalyticsConfig
 * @property {boolean} enabled Enables all analytics integrations.
 * @property {string} gtmId Google Tag Manager container id.
 * @property {string} gaId Google Analytics measurement id.
 * @property {string} clarityId Microsoft Clarity project id.
 * @property {string} metaPixelId Meta Pixel id.
 */

/**
 * @typedef {Object} ShareOptions
 * @property {boolean} enabled Toggles share buttons completely.
 * @property {boolean} whatsapp Enables WhatsApp share button.
 * @property {boolean} x Enables X/Twitter share button.
 * @property {boolean} linkedin Enables LinkedIn share button.
 * @property {boolean} facebook Enables Facebook share button.
 * @property {boolean} copy Enables "copy link" action.
 */

/**
 * @typedef {Object} PostOperationsConfig
 * @property {boolean} enabled Enables post interaction block.
 * @property {boolean} like Enables the like action.
 * @property {boolean} dislike Enables the dislike action.
 * @property {boolean} comment Enables the comment action.
 * @property {ShareOptions} share Share configuration for each network.
 */

/**
 * @typedef {Object} FeaturesConfig
 * @property {PostOperationsConfig} postOperations Post level interaction controls.
 * @property {boolean} search Enables the global search UI.
 */

/**
 * @typedef {Object} MarkdownConfig
 * @property {boolean} highlight Enables syntax highlighting.
 */

/**
 * @typedef {Object} PaginationConfig
 * @property {number} pageSize Default number of items per page.
 * @property {{tr: string, en: string}} segment Localized pagination segment labels.
 */

/**
 * @typedef {Object} ContentConfig
 * @property {PaginationConfig} pagination Pagination defaults.
 * @property {{default: string, supported: string[], canonical: Record<string, string>}} languages Supported locales and canonical base paths per locale.
 * @property {Record<string, unknown>} collections Custom collection definitions.
 */

/**
 * @typedef {Object} BuildConfig
 * @property {boolean} minify Minifies generated bundles.
 * @property {boolean} debug Emits debug logs/outputs.
 */

/**
 * @typedef {Object} IdentityConfig
 * @property {string} author Author name for meta tags.
 * @property {string} email Public contact email.
 * @property {string} url Canonical site url.
 * @property {string} themeColor Theme color meta tag value.
 * @property {SocialIdentityConfig} social
 */

/**
 * @typedef {Object} SocialIdentityConfig
 * @property {boolean} rss
 * @property {string} github
 * @property {string} linkedin
 * @property {string} x
 * @property {string} facebook
 * @property {string} instagram
 * @property {string} youtube
 * @property {string} tiktok
 * @property {string} substack
 * @property {string} medium
 * @property {string} devto
 * @property {string} stackoverflow
 * @property {string} mastodon
 */

/**
 * @typedef {Object} RobotsConfig
 * @property {string[]} allow Paths allowed for bots.
 * @property {string[]} disallow Paths disallowed for bots.
 */

/**
 * @typedef {Object} EnginaerConfig
 * @property {SeoConfig} seo SEO fallbacks.
 * @property {AnalyticsConfig} analytics Analytics integration defaults.
 * @property {FeaturesConfig} features UI feature toggles.
 * @property {MarkdownConfig} markdown Markdown renderer options.
 * @property {ContentConfig} content Content defaults.
 * @property {BuildConfig} build Build pipeline flags.
 * @property {IdentityConfig} identity Identity metadata.
 * @property {RobotsConfig} robots Robots.txt directives.
 * @property {string[]} plugins Plugin package list.
 */

/** @type {Partial<EnginaerConfig>} */
let cache = {};

/** @type {EnginaerConfig} */
const FALLBACKS = {
    seo: {
        defaultImage: "",
        includeCollections: false,
        includePaging: false,
        footerTagCount: 8
    },
    analytics: {
        enabled: false,
        gtmId: "GTM-XXXXXXX",
        gaId: "G-XXXXXXXXXX",
        clarityId: "CLARITY-ID",
        metaPixelId: "META-PIXEL-ID"
    },
    features: {
        postOperations: {
            enabled: false,
            like: false,
            dislike: false,
            comment: false,
            share: {
                enabled: false,
                whatsapp: false,
                x: false,
                linkedin: false,
                facebook: false,
                copy: false
            }
        },
        search: false
    },
    markdown: {
        highlight: false
    },
    content: {
        pagination: {
            pageSize: 10,
            segment: {
                tr: "sayfa",
                en: "page"
            }
        },
        languages: {
            default: "tr",
            supported: ["tr", "en"],
            canonical: {
                tr: "/",
                en: "/en/"
            }
        },
        collections: {}
    },
    build: {
        minify: false,
        debug: false
    },
    identity: {
        author: "<name> <surname>",
        email: "<name>@<surname>.net",
        url: "http://localhost:3000",
        themeColor: "#5a8df0",
        social: {
            rss: false,
            github: "",
            linkedin: "",
            x: "",
            facebook: "",
            instagram: "",
            youtube: "",
            tiktok: "",
            substack: "",
            medium: "",
            devto: "",
            stackoverflow: "",
            mastodon: ""
        }
    },
    robots: {
        allow: ["/"],
        disallow: []
    },
    plugins: []
}

async function loadConfig(path) {
    try {
        if (!(await _io.file.exists(path))) {
            return {};
        }

        const raw = await _io.file.read(path);
        cache = JSON.parse(raw);

        return cache;

    } catch (error) {
        console.warn(`Failed to read site config at ${path}:`, error);
        return {};
    }
}

function resolveConfig(section) {
    return cache[section] ?? FALLBACKS[section];
}

/** @type {EnginaerConfig & { load: typeof loadConfig }} */
const API = {
    load: loadConfig,

    get seo() {
        return resolveConfig("seo");
    },
    get analytics() {
        return resolveConfig("analytics");
    },
    get features() {
        return resolveConfig("features");
    },
    get markdown() {
        return resolveConfig("markdown");
    },
    get content() {
        return resolveConfig("content");
    },
    get build() {
        return resolveConfig("build");
    },
    get identity() {
        return resolveConfig("identity");
    },
    get robots() {
        return resolveConfig("robots");
    },
    get plugins() {
        const value = resolveConfig("plugins");
        return Array.isArray(value) ? value : [];
    }
};

export default API;
