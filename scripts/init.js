import degit from "degit";

import _io from "./io.js";
import _npm from "./npm.js";
import _log from "./log.js";

const TEMPLATE_REPO = "fatihtatoglu/shevky-simple-blog";

const ROOT_DIR = _io.path.name(".");
const SRC_DIR = _io.path.combine(ROOT_DIR, "src");
const TEMP_DIR = _io.path.combine(ROOT_DIR, "tmp");

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

async function _cloneRepo() {
    try {
        const emitter = degit(TEMPLATE_REPO, {
            cache: false,
            force: true,
            verbose: true,
        });

        await emitter.clone(TEMP_DIR);

        await _io.directory.create(SRC_DIR);
        await _io.directory.copy(_io.path.combine(TEMP_DIR, "src"), SRC_DIR);

        await _io.file.copy(_io.path.combine(TEMP_DIR, "tailwind.config.js"), _io.path.combine(ROOT_DIR, "tailwind.config.js"));

        await _io.directory.remove(TEMP_DIR);

        _log.info("simpe blog code is cloned.");
    } catch (err) {
        console.log(err.message || err)
        process.exit(1);
    }
}

async function _addRequiredFiles() {
    const gitignore = [
        `node_modules/`,
        `dist/`,
        ``
    ];
    await _io.file.write(_io.path.combine(ROOT_DIR, ".gitignore"), gitignore.join('\r\n'));

    _log.info("required files are added.");
}

async function _updatePackageJSON() {
    const filePath = _io.path.combine(ROOT_DIR, "package.json");
    if (!(await _io.file.exists(filePath))) {
        _log.err("package.json not found.");
        process.exit(1);
    }

    const pkgRaw = await _io.file.read(filePath);
    let pkg;

    try {
        pkg = JSON.parse(pkgRaw);
    } catch (err) {
        _log.err("Invalid package.json");
        process.exit(1);
    }

    pkg.scripts = pkg.scripts || {};

    pkg.scripts.build = "npx shevky --build";
    pkg.scripts.dev = "npx shevky --dev";

    await _io.file.write(
        filePath,
        JSON.stringify(pkg, null, 2) + "\n"
    );

    _log.info("package.json scripts updated.");
}

// ========== Initialization Functions ========== //
async function init() {
    await _cloneRepo();
    await _ensurePackages();
    await _addRequiredFiles();
    await _updatePackageJSON();
}

const initializeApi = {
    execute: init
};

export default initializeApi;