import fsp from "fs/promises";
import { dirname, join, sep } from "path";
import { fileURLToPath } from "url";

// ========== Directory Functions ========== //
async function directoryExists(path) {
    try {
        await fsp.access(path);
        return true;
    }
    catch {
        return false;
    }
}

async function readDirectory(path) {
    return fsp.readdir(path, { recursive: true });
}

async function copyDirectory(sourcePath, destinationPath) {
    if (!directoryExists(destinationPath)) {
        createDirectory(destinationPath);
    }

    await fsp.cp(sourcePath, destinationPath, { recursive: true });
}

async function createDirectory(dir) {
    return await fsp.mkdir(dir, { recursive: true });
}

async function removeDirectory(path) {
    await fsp.rm(path, { recursive: true, force: true });
}

// ========== File Functions ========== //
async function fileExists(path) {
    try {
        await fsp.access(path);
        return true;
    }
    catch {
        return false;
    }
}

async function readFile(path) {
    return await fsp.readFile(path, { encoding: "utf8" });
}

async function writeFile(path, content) {
    await fsp.writeFile(path, content, "utf8");
}

async function copyFile(sourcePath, destinationPath) {
    return await fsp.cp(sourcePath, destinationPath, { force: true });
}

// ========== Path Functions ========== //
function getDirectoryName(path) {
    return dirname(path);
}

function combinePaths(...paths) {
    return join(...paths);
}

// ========== API Definition ========== //
const API = {
    directory: {
        exists: directoryExists,
        read: readDirectory,
        copy: copyDirectory,
        create: createDirectory,
        remove: removeDirectory
    },
    file: {
        exists: fileExists,
        read: readFile,
        write: writeFile,
        copy: copyFile
    },
    path: {
        name: getDirectoryName,
        combine: combinePaths,
        seperator: sep
    },
    url: {
        toPath: fileURLToPath
    }
};

export default API;
