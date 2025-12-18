import _cfg from "./config.js";

const COLORS = {
    reset: "\x1b[0m",
    info: "\x1b[36m",
    warn: "\x1b[33m",
    err: "\x1b[31m",
    debug: "\x1b[35m",
    step: "\x1b[32m",
};

const DEBUG_ENABLED = function () {
    return _cfg.build.debug;
};

function formatLabel(label, color) {
    return `${color}[shevky:${label}]${COLORS.reset}`;
}

function logWith(label, color, ...args) {
    console.log(formatLabel(label, color), ...args);
}

function formatDetails(details) {
    if (!details || typeof details !== "object") {
        return "";
    }
    const entries = Object.entries(details)
        .filter(([, value]) => value !== undefined && value !== null && `${value}`.length > 0)
        .map(([key, value]) => `${key}=${value}`);
    return entries.length ? entries.join(" ") : "";
}

const API = {
    info: function (...args) {
        logWith("INFO", COLORS.info, ...args);
    },
    warn: function (...args) {
        logWith("WARN", COLORS.warn, ...args);
    },
    err: function (...args) {
        logWith("ERR", COLORS.err, ...args);
    },
    debug(message, details) {
        if (!DEBUG_ENABLED()) {
            return;
        }
        
        const suffix = formatDetails(details);
        if (suffix) {
            logWith("DEBUG", COLORS.debug, message, suffix);
            return;
        }

        logWith("DEBUG", COLORS.debug, message);
    },
    step(action, details) {
        if (!DEBUG_ENABLED()) {
            return;
        }

        const suffix = formatDetails(details);
        if (suffix) {
            logWith("STEP", COLORS.step, action, suffix);
            return;
        }

        logWith("STEP", COLORS.step, action);
    }
};

export default API;
