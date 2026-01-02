# Shevky Build Flow (Draft)

This document captures the current build flow and a working list of changes
we want to make. We will use this as a reference before defining plugin/hook
points.

## Flow Overview (visual)

```
Load config + i18n
  -> Load content + layouts + components + templates
  -> Precompute: menu, pages, footer policies, content index
  -> Build start:
       - clean dist
       - build CSS
       - build JS
       - copy assets
  -> Build content pages:
       - render markdown components
       - markdown -> HTML
       - inject component HTML
       - if collection/home: paginate + render each page
       - else: render template + render layout + write file
  -> Build dynamic collections
  -> Copy static HTML
  -> Build RSS + sitemap + robots
  -> Done
```

## Step-by-step (current)

1) Load site config + i18n config.
2) Load content, layouts, components, templates.
3) Compute menu items, collections (pages), footer policies, content index.
4) Prepare dist directory.
5) Build CSS (Tailwind CLI).
6) Build JS (esbuild).
7) Copy static assets.
8) Build content pages (per markdown file):
   - expand markdown components to placeholders
   - markdown -> HTML
   - inject placeholders
   - render template (Mustache)
   - render layout (Mustache)
   - write HTML output
9) Build paginated collection pages.
10) Build dynamic collection pages (from config).
11) Copy static HTML files in src. (optional; candidate to remove)
12) Build RSS feeds.
13) Build sitemap.
14) Build robots.txt.

## Worklist

- Confirm the flow above matches real behavior in `scripts/build.js`.
- Identify a minimal set of hook points that map to the steps.
- Define plugin interface (hook names, payloads, lifecycle).
- Decide plugin discovery/loading (config-based vs filesystem scan).
- Decide execution order and error handling.
- Add a simple example plugin to validate the design.
- First trial plugin: post-build SEO artifacts (RSS, Sitemap, Robots) using output metadata.

## Hook Points (draft)

- config:load (before/after site + i18n load)
- assets:load (before/after content + layouts + components + templates)
- precompute (before/after menu/pages/footer/index)
- dist:clean (before/after dist cleanup)
- build:css (before/after CSS pipeline)
- build:js (before/after JS pipeline)
- assets:copy (before/after static assets copy)
- content:page:before (per content file, before processing)
- content:markdown (before/after markdown -> HTML)
- content:render (before/after template render)
- layout:render (before/after layout render)
- page:write (before/after writing HTML to dist)
- collection:paginate (before/after pagination computation)
- collection:dynamic (before/after dynamic collections)
- html:copy (before/after copyHtmlRecursive, optional)
- postbuild (before/after RSS + Sitemap + Robots)

## Postbuild Outputs (candidates)

- RSS
- Sitemap
- Robots.txt
- search.json (client-side search)
- agent.txt (AI assistants)
- feed.json (JSON Feed)
- atom.xml (Atom Feed)
- humans.txt
- security.txt
- manifest.webmanifest
- browserconfig.xml
- opensearch.xml
- llms.txt / ai.txt

## Postbuild Metadata Needs (draft)

- id
- title
- content
- slug
- canonical
- tags
- dates (created / updated)
- cover, coverCaption
- lang + alternate (hreflang)
- description / excerpt
- category / series
- author(s)
- status (draft/published/hidden)
- type / template
- readingTime / wordCount
- collectionType / listKey
- permalink / url (if distinct from canonical)
- image alt + image url
- site metadata (baseUrl, title, description, defaults)

## Postbuild Item Schema (minimal v1)

Item (per content page):
- id
- lang
- slug
- canonical (used to build url)
- pair
- alternate
- description
- content
- tags
- category
- createdOn
- updatedOn
- cover
- coverCaption
- status
- type
- author
- collectionType (tag/category/series for dynamic collections)

Global context:
- site: { title, description, baseUrl, defaultLang }
- pagesIndex / collections (optional helpers)
