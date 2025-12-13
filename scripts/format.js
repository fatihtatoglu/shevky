import _i18n from "./i18n.js";

const extraMap = {
    ß: "ss",
    Ø: "o", ø: "o",
    Æ: "ae", æ: "ae",
    Å: "a", å: "a",
    Đ: "d", đ: "d",
    Ł: "l", ł: "l",
    Ń: "n", ń: "n",
    Ř: "r", ř: "r",
    Ś: "s", ś: "s",
    Š: "s", š: "s",
    Ž: "z", ž: "z",
    Ż: "z", ż: "z",
    Ź: "z", ź: "z",
    Ý: "y", ý: "y",
    Ğ: "g", ğ: "g",
    Ș: "s", ș: "s",
    Ț: "t", ț: "t",
    Ñ: "n", ñ: "n",
    Ç: "c", ç: "c"
};

function slugify(str) {
    if (!str || typeof str !== "string") {
        return "";
    }

    let normalized = str.normalize("NFD");
    normalized = normalized.replace(/[\u0300-\u036f]/g, "");
    normalized = normalized
        .split("")
        .map((ch) => extraMap[ch] ?? ch)
        .join("");

    return normalized
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}

// ========== API Definition ========== //
const API = {
    escape: function (value) {
        if (value == null) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
    },

    rssDate: function (date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }

        if (Number.isNaN(date.getTime())) {
            return new Date().toUTCString();
        }

        return date.toUTCString();
    },
    lastMod: function (date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }

        if (Number.isNaN(date.getTime())) {
            return null;
        }

        return date.toISOString().split("T")[0];
    },
    date: function (value, lang) {
        if (!value) {
            return null;
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return new Intl.DateTimeFormat(_i18n.culture(lang).replace("_", "-"), {
            day: "2-digit",
            month: "long",
            year: "numeric",
        }).format(date);
    },

    readingTime: function (value) {
        const num = typeof value === "number" ? value : Number.parseFloat(value);
        if (!Number.isFinite(num) || num <= 0) {
            return 0;
        }

        return Math.round(num);
    },

    normalizeStringArray: function (value) {
        if (!Array.isArray(value)) {
            return [];
        }

        return value
            .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
            .filter((tag) => tag.length > 0);
    },
    slugify,
    boolean: function (value) {
        if (typeof value === "boolean") {
            return value;
        }

        if (typeof value === "string") {
            const normalized = value.trim().toLowerCase();
            if (normalized === "true") {
                return true;
            }

            if (normalized === "false") {
                return false;
            }
        }

        return Boolean(value);
    },
    order: function (value) {
        const num = typeof value === "number" ? value : Number.parseFloat(value);
        return Number.isFinite(num) ? num : Number.MAX_SAFE_INTEGER;
    }
};

export default API;
