import { io as _io, exec as _exec } from "@shevky/base";

/**
 * Resolve project directory paths relative to the given base directory.
 * @param {string} [baseDir="."] Base directory for the project.
 * @returns {{
 *   root: string,
 *   src: string,
 *   dist: string,
 *   tmp: string,
 *   content: string,
 *   layouts: string,
 *   components: string,
 *   templates: string,
 *   assets: string,
 *   siteConfig: string,
 *   i18nConfig: string
 * }}
 */
function getPaths(baseDir = ".") {
  const rootDir = _io.path.combine(baseDir);
  const srcDir = _io.path.combine(rootDir, "src");
  const distDir = _io.path.combine(rootDir, "dist");

  return {
    root: rootDir,
    src: srcDir,
    dist: distDir,
    tmp: _io.path.combine(rootDir, "tmp"),
    content: _io.path.combine(srcDir, "content"),
    layouts: _io.path.combine(srcDir, "layouts"),
    components: _io.path.combine(srcDir, "components"),
    templates: _io.path.combine(srcDir, "templates"),
    assets: _io.path.combine(srcDir, "assets"),
    siteConfig: _io.path.combine(srcDir, "site.json"),
    i18nConfig: _io.path.combine(srcDir, "i18n.json"),
  };
}

/** @type {{ getPaths: typeof getPaths }} */
const API = {
  getPaths,
};

export default API;
