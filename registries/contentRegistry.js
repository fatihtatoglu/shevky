import { io as _io } from "@shevky/base";
import matter from "gray-matter";

import { ContentFile } from "../lib/contentFile.js";

export class ContentRegistry {
  /**
   * @type {ContentFile[]}
   */
  #_cache = [];

  /**
   * @param {string} path
   * @returns
   */
  async load(path) {
    const isExists = await _io.directory.exists(path);
    if (!isExists) {
      return;
    }

    const files = await _io.directory.read(path);
    for (const entry of files) {
      if (!entry.endsWith(".md")) {
        continue;
      }

      const filePath = _io.path.combine(path, entry);
      const isFileExists = await _io.file.exists(filePath);
      if (!isFileExists) {
        throw new Error(`Failed to read content file at ${filePath}`);
      }

      const contentFile = await this.#_loadFromFile(filePath);
      this.#_cache.push(contentFile);
    }
  }

  get count() {
    return this.#_cache.length;
  }

  get files() {
    return this.#_cache;
  }

  /**
   * @param {string} filePath
   * @returns {Promise<ContentFile>}
   */
  async #_loadFromFile(filePath) {
    const raw = await _io.file.read(filePath);
    let isValid = false;

    /**
     * @type {{data: Record<string, unknown>, content: string}}
     */
    let matterResponse = { data: {}, content: "" };

    try {
      matterResponse = matter(raw);
      isValid = true;
    } catch {}

    const { data, content } = matterResponse;
    return new ContentFile(data, content, filePath, isValid);
  }
}
