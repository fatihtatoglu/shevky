import { spawn } from "child_process";
import { createRequire } from "module";
import _io from "./io.js";

function getNpmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function getNpxCommand() {
  return process.platform === "win32" ? "npx.cmd" : "npx";
}

/**
 * @param {string[]} packages
 * @param {boolean} saveDev
 * @param {string?} cwd
 * @returns
 */
function installPackage(packages, saveDev = false, cwd = process.cwd()) {
  const options = ["install", ...packages];
  if (saveDev) {
    options.push("--save-dev");
  }

  return run(getNpmCommand(), options, cwd);
}

/**
 * @param {readonly string[]} args
 * @param {string?} cwd
 * @returns
 */
function runNpx(args, cwd = process.cwd()) {
  return run(getNpxCommand(), args, cwd);
}

/**
 * @param {String} command
 * @param {readonly string[]} options
 * @param {string?} cwd
 * @returns
 */
function run(command, options, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, options, { stdio: "inherit", cwd });
    child.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} exited with code ${code}`)),
    );
    child.on("error", reject);
  });
}

function watch(scriptPath, watchPath, cwd = process.cwd()) {
  if (!scriptPath) {
    throw new Error("watch requires a scriptPath to execute");
  }

  const options = ["--watch"];
  if (watchPath) {
    options.push("--watch-path", watchPath);
  }
  options.push(scriptPath);

  return run(process.execPath, options, cwd);
}

function serve(distPath, port = 3000, cwd = process.cwd()) {
  if (!distPath) {
    throw new Error("serve requires a distPath to host");
  }

  const listenArg = `--listen=${port}`;
  const args = ["-y", "serve@14", distPath, listenArg];
  return runNpx(args, cwd);
}

function getRequire() {
  const require = createRequire(import.meta.url);
  return require;
}

function resolve(name) {
  try {
    const resolved = getRequire().resolve(name, { paths: [process.cwd()] });
    return _io.url.toURL(resolved).href;
  } catch {
    return null;
  }
}

const API = {
  execute: run,
  executeNpx: runNpx,
  watch,
  serve,
  resolve,

  installPackage,
};

export default API;
