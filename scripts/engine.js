import crypto from "node:crypto";
import Mustache from "mustache";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import { config as _cfg, format as _fmt } from "@shevky/base";

import _view from "./view.js";

/**
 * @typedef {{ token: string, marker: string, html: string }} Placeholder
 */

const markdownRenderer = new marked.Renderer();

/**
 * @param {any} token
 * @returns {string}
 */
function renderMarkdownCode(token) {
  const isTokenObject = token && typeof token === "object";
  const languageSource =
    isTokenObject && typeof token.lang === "string" ? token.lang : "";
  const language =
    (languageSource || "").trim().split(/\s+/)[0]?.toLowerCase() || "text";
  const langClass = language ? ` class="language-${language}"` : "";
  const value =
    isTokenObject && typeof token.text === "string"
      ? token.text
      : (token ?? "");
  const alreadyEscaped = Boolean(isTokenObject && token.escaped);
  const content = alreadyEscaped ? value : _fmt.escape(value);
  return `<pre class="code-block" data-code-language="${language}"><code${langClass}>${content}</code></pre>`;
}

function setupMarkdown() {
  marked.setOptions(
    /** @type {any} */ ({ mangle: false, headerIds: false, gfm: true }),
  );
  if (_cfg.markdown.highlight) {
    /**
     * @param {string} code
     * @param {string} lang
     * @returns {string}
     */
    function highlightCode(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    }

    marked.use(
      markedHighlight({
        langPrefix: "hljs language-",
        highlight: highlightCode,
      }),
    );
  }

  markdownRenderer.code = renderMarkdownCode;
  marked.use({ renderer: markdownRenderer });
}

/**
 * @param {{ layoutName: string, view: Record<string, any> }} input
 */
function renderLayoutHtml({ layoutName, view }) {
  const layoutTemplate = _view.layouts.get(layoutName);
  return Mustache.render(layoutTemplate, view, {
    ..._view.partials.files,
    ..._view.components.files,
  });
}

/**
 * @param {string} markdown
 * @param {Record<string, any>} [context]
 * @returns {{ markdown: string, placeholders: Placeholder[] }}
 */
function renderMarkdownComponents(markdown, context = {}) {
  if (!markdown || typeof markdown !== "string") {
    return { markdown: markdown ?? "", placeholders: [] };
  }
  /** @type {Placeholder[]} */
  const placeholders = [];
  const baseContext = context ?? {};
  const writer = new Mustache.Writer();
  const writerAny = /** @type {any} */ (writer);
  const originalRenderPartial = writer.renderPartial;

  /**
   * @this {any}
   * @param {any} token
   * @param {any} tokenContext
   * @param {any} partials
   * @param {any} config
   */
  writer.renderPartial = function renderPartial(
    token,
    tokenContext,
    partials,
    config,
  ) {
    const name = token?.[1];
    if (name?.startsWith("components/")) {
      const template = _view.components.files[name];
      if (!template) return "";
      const tokenId = `COMPONENT_SLOT_${placeholders.length}_${name.replace(/[^A-Za-z0-9_-]/g, "_")}_${crypto
        .randomBytes(4)
        .toString("hex")}`;
      const comment = `<!--${tokenId}-->`;
      const marker = `\n${comment}\n`;
      const tags =
        typeof writerAny.getConfigTags === "function"
          ? writerAny.getConfigTags(config)
          : undefined;
      const tokens = writerAny.parse(template, tags);
      const html = writerAny.renderTokens(
        tokens,
        tokenContext,
        partials,
        template,
        /** @type {any} */ (config),
      );
      placeholders.push({ token: tokenId, marker, html });
      return marker;
    }

    return originalRenderPartial.call(
      this,
      token,
      tokenContext,
      partials,
      /** @type {any} */ (config),
    );
  };

  let renderedMarkdown = writer.render(markdown, baseContext, {
    ..._view.partials.files,
    ..._view.components.files,
  });

  placeholders.forEach(({ token }) => {
    const marker = `<!--${token}-->`;
    const pattern = new RegExp(`^[ \\t]*${escapeRegExp(marker)}[ \\t]*$`, "gm");
    renderedMarkdown = renderedMarkdown.replace(pattern, marker);
  });

  return { markdown: renderedMarkdown, placeholders };
}

/** @param {string} [value] */
function escapeRegExp(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** @param {string} html @param {Placeholder[]} placeholders */
function injectMarkdownComponents(html, placeholders) {
  if (!html || !placeholders || !placeholders.length) {
    return html;
  }
  let output = html;
  for (let i = placeholders.length - 1; i >= 0; i -= 1) {
    const { token, marker, html: snippet } = placeholders[i];
    const safeSnippet = snippet ?? "";
    let nextOutput = output;

    if (token) {
      const pattern = new RegExp(
        `(?:<p>)?\\s*<!--${escapeRegExp(token)}-->\\s*(?:</p>)?`,
        "g",
      );
      const replaced = nextOutput.replace(pattern, safeSnippet);
      nextOutput = replaced;
    }

    if (nextOutput === output && marker) {
      nextOutput = nextOutput.split(marker).join(safeSnippet);
    }

    output = nextOutput;
  }
  return output;
}

/** @param {string} markdown */
function parseMarkdown(markdown) {
  return /** @type {string} */ (marked.parse(markdown ?? ""));
}

export {
  setupMarkdown,
  renderLayoutHtml,
  renderMarkdownComponents,
  injectMarkdownComponents,
  parseMarkdown,
};
