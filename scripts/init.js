import _io from "./io.js";
import _npm from "./npm.js";
import _log from "./log.js";

import { dirname, join } from "node:path";

const ROOT_DIR = dirname(".");
const SRC_DIR = join(ROOT_DIR, "src");
const CONTENT_DIR = join(SRC_DIR, "content");
const LAYOUTS_DIR = join(SRC_DIR, "layouts");
const COMPONENTS_DIR = join(SRC_DIR, "components");
const TEMPLATES_DIR = join(SRC_DIR, "templates");
const ASSETS_DIR = join(SRC_DIR, "assets");
const CSS_DIR = join(SRC_DIR, "css");
const JS_DIR = join(SRC_DIR, "js");

const packages = [
    "gray-matter",
    "highlight.js",
    "html-minifier-terser",
    "marked",
    "marked-highlight",
    "mustache",
    "tailwindcss",
    "postcss",
    "@tailwindcss/cli",
    "@tailwindcss/typography",
    "autoprefixer",
    "esbuild"
];

// ========== Initialization Functions ========== //
async function _ensurePackages() {
    try {
        // install required package
        await _npm.installPackage(packages, true);
        _log.info("Initial dependencies installed.");
    } catch (error) {
        _log.err(error.message || error);
        process.exitCode = 1;
    }
}

async function _ensureFolders() {
    await _io.directory.create(SRC_DIR);
    _log.info("src folder is OK.");

    await _io.directory.create(CONTENT_DIR);
    _log.info("content folder is OK.");

    await _io.directory.create(LAYOUTS_DIR);
    _log.info("layouts folder is OK.");

    await _io.directory.create(COMPONENTS_DIR);
    _log.info("components folder is OK.");

    await _io.directory.create(TEMPLATES_DIR);
    _log.info("templates folder is OK.");

    await _io.directory.create(ASSETS_DIR);
    _log.info("assets folder is OK.");

    await _io.directory.create(CSS_DIR);
    _log.info("css folder is OK.");

    await _io.directory.create(JS_DIR);
    _log.info("js folder is OK.");
}

async function createTailwindConfiguration() {
    const path = _io.path.combine(ROOT_DIR, "tailwind.config.js");
    const content = [
        `import typography from "@tailwindcss/typography";`,
        ``,
        `/** @type {import('tailwindcss').Config} */`,
        `export default {`,
        `content: ["./src/**/*.{html,js}"],`,
        `theme: {extend: {},},`,
        `plugins: [typography],`,
        `};`
    ];

    _io.file.write(path, content.join("\r\n"));
}

// ========== Initialization Functions ========== //

async function init() {
    await _ensurePackages();
    await _ensureFolders();

    // create config files (site.json, i18n.json)

    // create sample files

    // tailwind config
    await createTailwindConfiguration();
}

const initializeApi = {
    execute: init
};

export default initializeApi;