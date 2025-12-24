import _io from "./io.js";
import _cfg from "./config.js";

let cache = {};
const LANGUAGE_LABELS = {
    tr: "Türkçe",
    en: "English",
    de: "Deutsch"
};

function getLanguageConfig() {
    return _cfg?.content?.languages ?? { default: "tr", supported: ["tr"], canonical: { tr: "/" } };
}

function getLanguageContext() {
    const config = getLanguageConfig();
    const supported = config.supported;
    const defaultLang = supported.includes(config.default) ? config.default : supported[0];
    const canonical = config.canonical ?? {};

    return {
        config,
        supported,
        canonical,
        defaultLang,
        langSet: new Set(supported)
    };
}

async function loadLanguage(path) {
    try {
        if (!(await _io.file.exists(path))) {
            return {};
        }

        const raw = await _io.file.read(path);
        const parsed = JSON.parse(raw);
        const context = getLanguageContext();
        for (const lang of context.supported) {
            cache[lang] = extractLang(parsed, lang, context);
        }

        return cache;
    } catch (error) {
        console.warn(`Failed to read site config at ${path}:`, error);
        return {};
    }
}

function isLangMap(obj, langSet) {
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
        return false;
    }

    const keys = Object.keys(obj);
    if (keys.length === 0) {
        return false;
    }

    return keys.every((key) => {
        if (!langSet.has(key)) {
            return false;
        }

        const value = obj[key];
        return typeof value !== "object" || value === null;
    });
}

function extractLang(obj, lang, context) {
    if (typeof obj !== "object" || obj === null) {
        return obj;
    }

    const ctx = context ?? getLanguageContext();

    if (Array.isArray(obj)) {
        return obj.map((item) => extractLang(item, lang, ctx));
    }

    if (isLangMap(obj, ctx.langSet)) {
        if (obj[lang] != null) {
            return obj[lang];
        }

        if (obj[ctx.defaultLang] != null) {
            return obj[ctx.defaultLang];
        }

        const firstKey =
            ctx.supported.find((code) => obj[code] != null) ??
            Object.keys(obj)[0];

        return obj[firstKey];
    }

    const result = {};
    for (const key of Object.keys(obj)) {
        result[key] = extractLang(obj[key], lang, ctx);
    }

    return result;
}

function getBaseUrl() {
    const raw = _cfg?.identity?.url ?? "";
    return raw.replace(/\/+$/, "");
}

function normalizeCanonicalPath(path) {
    if (typeof path !== "string") {
        return "/";
    }

    const trimmed = path.trim();
    if (!trimmed) {
        return "/";
    }

    if (/^https?:\/\//i.test(trimmed)) {
        try {
            const parsed = new URL(trimmed);
            return parsed.pathname || "/";
        } catch {
            return "/";
        }
    }

    const prefixed = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return prefixed.replace(/\/{2,}/g, "/");
}

function resolveCanonicalPath(lang, context) {
    const ctx = context ?? getLanguageContext();
    const candidate = ctx.canonical?.[lang];
    if (typeof candidate === "string" && candidate.trim()) {
        return normalizeCanonicalPath(candidate.replace("{base}", ""));
    }

    if (lang === ctx.defaultLang) {
        return "/";
    }

    return normalizeCanonicalPath(`/${lang}/`);
}

function ensureUrlTrailingSlash(value) {
    if (typeof value !== "string" || !value.trim()) {
        return "/";
    }

    try {
        const parsed = new URL(value);
        let pathname = parsed.pathname || "/";
        pathname = pathname.replace(/\/{2,}/g, "/");
        if (!pathname.endsWith("/")) {
            pathname += "/";
        }
        parsed.pathname = pathname;
        parsed.search = "";
        parsed.hash = "";
        return parsed.toString();
    } catch {
        const trimmed = value.trim();
        const normalized = trimmed.replace(/\/{2,}/g, "/");
        return normalized.endsWith("/") ? normalized : `${normalized}/`;
    }
}

function buildCanonicalUrlFromPath(path, baseUrl) {
    const normalizedBase = typeof baseUrl === "string" ? baseUrl.trim().replace(/\/+$/, "") : "";
    if (typeof path !== "string" || !path.trim()) {
        if (!normalizedBase) {
            return "/";
        }

        return ensureUrlTrailingSlash(normalizedBase);
    }

    let candidate = path.trim();
    if (candidate.includes("{base}")) {
        candidate = candidate.replace(/\{base\}/g, normalizedBase);
    }

    if (candidate.startsWith("/") && /^https?:\/\//i.test(candidate.slice(1))) {
        candidate = candidate.slice(1);
    }

    if (/^https?:\/\//i.test(candidate)) {
        return ensureUrlTrailingSlash(candidate);
    }

    if (!normalizedBase) {
        return ensureUrlTrailingSlash(candidate);
    }

    const prefix = candidate.startsWith("/") ? "" : "/";
    const combined = `${normalizedBase}${prefix}${candidate}`;
    return ensureUrlTrailingSlash(combined);
}

function buildHomePathFromCanonical(path) {
    if (typeof path !== "string" || !path.trim()) {
        return "/";
    }

    let normalized = path.replace(/\{base\}/g, "").trim();
    if (!normalized) {
        return "/";
    }

    if (!normalized.startsWith("/")) {
        normalized = `/${normalized}`;
    }

    normalized = normalized.replace(/\/{2,}/g, "/");
    if (!normalized.endsWith("/")) {
        normalized += "/";
    }

    return normalized;
}

function getCulture(lang) {
    const normalized = (lang ?? "").toLowerCase();
    switch (normalized) {
        case "en": return "en_US";
        case "tr": return "tr_TR";
        case "de": return "de_DE";
        default: return normalized ? `${normalized}_${normalized.toUpperCase()}` : "tr_TR";
    }
}

function getLanguage(lang) {
    const context = getLanguageContext();
    return cache[lang] ?? cache[context.defaultLang] ?? {};
}

function getLanguageLabel(lang) {
    const normalized = (lang ?? "").toLowerCase();
    return LANGUAGE_LABELS[normalized] ?? lang ?? "";
}

const out = {
    load: loadLanguage,

    dictionary: cache,

    get default() {
        return getLanguageContext().defaultLang;
    },

    get supported() {
        return [...getLanguageContext().supported];
    },

    get: getLanguage,

    serialize: function () {
        return JSON.stringify(cache)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e")
            .replace(/&/g, "\\u0026")
            .replace(/\u2028/g, "\\u2028")
            .replace(/\u2029/g, "\\u2029");
    },

    culture: getCulture,

    get build() {
        const context = getLanguageContext();
        const baseUrl = getBaseUrl();
        const entries = {};

        for (const lang of context.supported) {
            const canonicalPath = resolveCanonicalPath(lang, context);
            const canonicalUrl = buildCanonicalUrlFromPath(canonicalPath, baseUrl);

            entries[lang] = {
                langAttr: lang,
                metaLanguage: lang,
                ogLocale: getCulture(lang),
                altLocale: context.supported.map((s) => {
                    if (s === lang) {
                        return;
                    }

                    return getCulture(s);
                }).filter((s) => s && s.trim().length > 0),
                canonical: canonicalUrl,
                path: buildHomePathFromCanonical(canonicalPath)
            };
        }

        return entries;
    },

    homePath: function (lang) {
        const entries = this.build;
        if (entries[lang]?.path) {
            return entries[lang].path;
        }

        const fallback = entries[this.default];
        if (fallback?.path) {
            return fallback.path;
        }

        return "/";
    },

    flags: function (lang) {
        const normalized = getLanguageContext().supported.includes(lang) ? lang : getLanguageContext().defaultLang;
        const isEnglish = normalized === "en";
        const isTurkish = normalized === "tr";
        const isGerman = normalized === "de";

        return {
            locale: {
                code: normalized,
                isEn: isEnglish,
                isTr: isTurkish,
                isDe: isGerman,
                isEnglish,
                isTurkish,
                isGerman,
                isDefault: normalized === getLanguageContext().defaultLang
            },
            isEnglish,
            isTurkish,
            isGerman
        };
    },

    getValue: function (lang, path) {
        const dictionary = getLanguage(lang);
        const value = path.split(".").reduce((acc, segment) => {
            if (acc === undefined || acc === null) return undefined;
            return acc[segment];
        }, dictionary);

        return value;
    },

    languageLabel: getLanguageLabel
};

const API = out;
API.t = function (lang, path, fallback) {
    const value = out.getValue(lang, path);
    if (value !== undefined) {
        return value;
    }

    const defaultValue = out.getValue(out.default, path);
    if (defaultValue !== undefined) {
        return defaultValue;
    }

    return fallback;
};

export default API;
