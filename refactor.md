# Refactor map (scripts)

Bu liste scripts/ altindaki normalize/trim veya veri tipi kontrolu (typeof/Array.isArray/instanceof vb.) yapan tum satirlari ham olarak gosterir. Arama paterni:

- normalize
- trim(
- typeof
- Array.isArray
- instanceof
- Boolean(
- Number(
- String(
- ?.

Asagida rg cikisi: dosya:line:icerik

~~~
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/log.js:25:    if (!details || typeof details !== "object") {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/config.js:223:/** @type {EnginaerConfig & { load: typeof loadConfig }} */
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/config.js:253:        return Array.isArray(value) ? value : [];
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/plugin.js:7:function normalizePluginName(entry) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/plugin.js:8:    const value = typeof entry === "string" ? entry.trim() : "";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/plugin.js:14:        const pluginNames = Array.isArray(names) ? names : [];
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/plugin.js:16:            const resolvedName = normalizePluginName(pluginName);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/plugin.js:25:            const instance = loaded?.default ?? loaded;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/plugin.js:27:            if (!instance || typeof instance !== "object") {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/plugin.js:31:            const name = typeof instance.name === "string" && instance.name.trim().length > 0
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/plugin.js:32:                ? instance.name.trim()
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/core.js:84:            return typeof data.status === "string" ? data.status.trim().toLowerCase() : "";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/core.js:87:            return typeof data.id === "string" ? data.id.trim() : "";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/core.js:94:            return typeof data.template === "string" ? data.template.trim() : "page";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/core.js:103:            const tags = _fmt.normalizeStringArray(data.tags);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/core.js:140:            const title = data.seriesTitle.trim();
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/core.js:144:            return (typeof data.menu === "string" && data.menu.trim().length > 0
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/core.js:145:                ? data.menu.trim()
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/core.js:146:                : typeof data.title === "string" && data.title.trim().length > 0
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/core.js:147:                    ? data.title.trim()
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/core.js:157:            return typeof data.layout === "string" ? data.layout.trim() : "default";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:12:    return _cfg?.content?.languages ?? { default: "tr", supported: ["tr"], canonical: { tr: "/" } };
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:51:    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:66:        return typeof value !== "object" || value === null;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:71:    if (typeof obj !== "object" || obj === null) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:77:    if (Array.isArray(obj)) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:106:    const raw = _cfg?.identity?.url ?? "";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:110:function normalizeCanonicalPath(path) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:111:    if (typeof path !== "string") {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:115:    const trimmed = path.trim();
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:135:    const candidate = ctx.canonical?.[lang];
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:136:    if (typeof candidate === "string" && candidate.trim()) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:137:        return normalizeCanonicalPath(candidate.replace("{base}", ""));
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:144:    return normalizeCanonicalPath(`/${lang}/`);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:148:    if (typeof value !== "string" || !value.trim()) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:164:        const trimmed = value.trim();
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:165:        const normalized = trimmed.replace(/\/{2,}/g, "/");
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:166:        return normalized.endsWith("/") ? normalized : `${normalized}/`;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:171:    const normalizedBase = typeof baseUrl === "string" ? baseUrl.trim().replace(/\/+$/, "") : "";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:172:    if (typeof path !== "string" || !path.trim()) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:173:        if (!normalizedBase) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:177:        return ensureUrlTrailingSlash(normalizedBase);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:180:    let candidate = path.trim();
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:182:        candidate = candidate.replace(/\{base\}/g, normalizedBase);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:193:    if (!normalizedBase) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:198:    const combined = `${normalizedBase}${prefix}${candidate}`;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:203:    if (typeof path !== "string" || !path.trim()) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:207:    let normalized = path.replace(/\{base\}/g, "").trim();
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:208:    if (!normalized) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:212:    if (!normalized.startsWith("/")) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:213:        normalized = `/${normalized}`;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:216:    normalized = normalized.replace(/\/{2,}/g, "/");
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:217:    if (!normalized.endsWith("/")) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:218:        normalized += "/";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:221:    return normalized;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:225:    const normalized = (lang ?? "").toLowerCase();
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:226:    switch (normalized) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:230:        default: return normalized ? `${normalized}_${normalized.toUpperCase()}` : "tr_TR";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:240:    const normalized = (lang ?? "").toLowerCase();
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:241:    return LANGUAGE_LABELS[normalized] ?? lang ?? "";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:289:                }).filter((s) => s && s.trim().length > 0),
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:300:        if (entries[lang]?.path) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:305:        if (fallback?.path) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:313:        const normalized = getLanguageContext().supported.includes(lang) ? lang : getLanguageContext().defaultLang;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:314:        const isEnglish = normalized === "en";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:315:        const isTurkish = normalized === "tr";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:316:        const isGerman = normalized === "de";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:320:                code: normalized,
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/i18n.js:327:                isDefault: normalized === getLanguageContext().defaultLang
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/analytics.js:24:        return Boolean(getAnalyticsConfig().enabled);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/format.js:26:    if (!str || typeof str !== "string") {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/format.js:30:    let normalized = str.normalize("NFD");
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/format.js:31:    normalized = normalized.replace(/[\u0300-\u036f]/g, "");
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/format.js:32:    normalized = normalized
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/format.js:37:    return normalized
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/format.js:38:        .trim()
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/format.js:52:        return String(value)
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/format.js:61:        if (!(date instanceof Date)) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/format.js:72:        if (!(date instanceof Date)) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/format.js:100:        const num = typeof value === "number" ? value : Number.parseFloat(value);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/format.js:108:    normalizeStringArray: function (value) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/format.js:109:        if (!Array.isArray(value)) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/format.js:114:            .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/format.js:119:        if (typeof value === "boolean") {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/format.js:123:        if (typeof value === "string") {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/format.js:124:            const normalized = value.trim().toLowerCase();
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/format.js:125:            if (normalized === "true") {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/format.js:129:            if (normalized === "false") {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/format.js:134:        return Boolean(value);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/format.js:137:        const num = typeof value === "number" ? value : Number.parseFloat(value);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/io.js:70:    return stats?.size ?? 0;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:35:_log.step("CONFIG_READY", { file: normalizeLogPath(SITE_CONFIG_PATH), debug: _cfg.build.debug ? "on" : "off" });
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:36:_log.step("I18N_READY", { file: normalizeLogPath(I18N_CONFIG_PATH), locales: _i18n.supported.length });
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:40:  dir: normalizeLogPath(CONTENT_DIR),
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:47:  dir: normalizeLogPath(LAYOUTS_DIR),
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:54:  dir: normalizeLogPath(COMPONENTS_DIR),
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:59:const layoutNames = typeof _core.layouts.list === "function" ? _core.layouts.list() : [];
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:61:  dir: normalizeLogPath(LAYOUTS_DIR),
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:66:const templateKeys = typeof _core.templates.list === "function" ? _core.templates.list() : [];
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:68:  dir: normalizeLogPath(TEMPLATES_DIR),
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:107:  const isTokenObject = token && typeof token === "object";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:110:    : typeof infostring === "string"
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:113:  const language = (languageSource || "").trim().split(/\s+/)[0]?.toLowerCase() || "text";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:116:  const alreadyEscaped = Boolean(isTokenObject && token.escaped);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:127:  if (typeof input !== "string") {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:128:    return Buffer.byteLength(String(input));
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:152:function normalizeLogPath(pathValue) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:157:  const normalized = toPosixPath(pathValue);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:158:  if (normalized.startsWith("./")) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:159:    return normalized.slice(2);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:162:  return normalized;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:166:  if (!Array.isArray(values) || values.length === 0) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:170:  const normalized = values
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:171:    .map((value) => (value == null ? "" : String(value).trim()))
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:173:  if (!normalized.length) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:177:  const slice = normalized.slice(0, limit);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:178:  const extra = normalized.length - slice.length;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:187:  if (!file || typeof file !== "object") {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:192:    (typeof file.id === "string" && file.id.trim()) ||
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:193:    (typeof file.slug === "string" && file.slug.trim()) ||
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:194:    (typeof file.title === "string" && file.title.trim()) ||
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:195:    normalizeLogPath(file.sourcePath) ||
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:202:  _log.step("DIST_CLEAN", { target: normalizeLogPath(DIST_DIR) });
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:204:  _log.step("DIST_READY", { target: normalizeLogPath(DIST_DIR) });
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:213:    _log.step("BUILD_CSS_SKIP", { reason: "missing-config", target: normalizeLogPath(configPath) });
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:219:    _log.step("BUILD_CSS_SKIP", { reason: "missing-source", source: normalizeLogPath(sourePath) });
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:236:    source: normalizeLogPath(sourePath),
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:237:    target: normalizeLogPath(distPath),
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:248:    _log.step("BUILD_JS_SKIP", { reason: "missing-source", source: normalizeLogPath(sourePath) });
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:270:    source: normalizeLogPath(sourePath),
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:271:    target: normalizeLogPath(distPath),
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:302:    console.warn("[build] Failed to minify HTML:", error?.message ?? error);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:318:  if (Array.isArray(value)) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:322:  if (typeof value === "string" && value.trim().length > 0) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:323:    return value.split(",").map((item) => item.trim());
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:329:function normalizeAlternateLocales(value, fallback = []) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:336:    .map((item) => (typeof item === "string" ? item.trim() : ""))
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:353:  const indent = indentMatch?.[1] ?? "  ";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:392:function normalizeAlternateOverrides(alternate, lang) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:397:  if (typeof alternate === "string" && alternate.trim().length > 0) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:403:    return { [fallbackLang]: resolveUrl(alternate.trim()) };
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:406:  if (typeof alternate === "object" && !Array.isArray(alternate)) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:413:      if (typeof value === "string" && value.trim().length > 0) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:414:        map[code] = resolveUrl(value.trim());
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:424:  const segmentConfig = _cfg?.content?.pagination?.segment ?? {};
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:426:    typeof segmentConfig[lang] === "string" &&
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:427:    segmentConfig[lang].trim().length > 0
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:429:    return segmentConfig[lang].trim();
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:434:    typeof defaultSegment === "string" &&
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:435:    defaultSegment.trim().length > 0
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:437:    return defaultSegment.trim();
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:444:  const overrides = normalizeAlternateOverrides(front?.alternate, lang);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:450:    const baseUrl = langConfig?.canonical
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:465:    if (langConfig?.canonical) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:498:  if (!view || typeof view !== "object") {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:512:  const payload = typeof html === "string" ? html : String(html ?? "");
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:516:    target: normalizeLogPath(destPath),
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:517:    source: normalizeLogPath(meta.source),
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:523:    input: typeof meta.inputBytes === "number" ? formatBytes(meta.inputBytes) : undefined,
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:534:  const altLocales = normalizeAlternateLocales(config.altLocale);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:549:  if (typeof input !== "string") {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:553:  const value = input.trim();
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:588:  const trimmedValue = typeof value === "string" ? value.trim() : "";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:606:  const normalized = absolute.replace(/([^:]\/)\/+/g, "$1");
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:607:  return ensureDirectoryTrailingSlash(normalized);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:650:      const langConfig = _i18n.build?.[lang];
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:651:      if (langConfig?.canonical) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:657:    currentLangLabel: typeof _i18n.languageLabel === "function"
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:667:      canonical: (_cfg?.content?.languages?.canonical && typeof _cfg.content.languages.canonical === "object")
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:671:        const langConfig = _i18n.build?.[code];
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:672:        if (langConfig?.canonical) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:696:  const normalizedActiveKey =
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:697:    typeof activeKey === "string" && activeKey.trim().length > 0 ? activeKey.trim() : null;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:698:  const hasExplicitMatch = normalizedActiveKey
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:699:    ? baseItems.some((item) => item.key === normalizedActiveKey)
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:702:    ? normalizedActiveKey
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:703:    : baseItems[0]?.key ?? "";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:714:  if (typeof frontMatter.id === "string" && frontMatter.id.trim().length > 0) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:715:    return frontMatter.id.trim();
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:717:  if (typeof frontMatter.slug === "string" && frontMatter.slug.trim().length > 0) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:718:    return frontMatter.slug.trim();
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:730:    tagsConfig && typeof tagsConfig.slugPattern === "object" ? tagsConfig.slugPattern : {};
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:732:  const langPattern = typeof slugPattern[lang] === "string" ? slugPattern[lang] : null;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:772:    if (!Array.isArray(items) || items.length === 0) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:849:    typeof front.metaTitle === "string" && front.metaTitle.trim().length > 0
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:850:      ? front.metaTitle.trim()
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:851:      : typeof front.title === "string" && front.title.trim().length > 0
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:852:        ? front.title.trim()
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:860:  const altLocales = normalizeAlternateLocales(front.ogAltLocale, defaultAltLocales);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:862:    typeof front.cover === "string" && front.cover.trim().length > 0
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:863:      ? front.cover.trim()
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:870:  const typeValue = typeof front.type === "string" ? front.type.trim().toLowerCase() : "";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:871:  const templateValue = typeof front.template === "string" ? front.template.trim().toLowerCase() : "";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:920:  const rawCategory = typeof front.category === "string" ? front.category.trim().toLowerCase() : "";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:936:  const keywordsArray = Array.isArray(front.keywords) && front.keywords.length
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:938:    : Array.isArray(front.tags) && front.tags.length
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1014:      ].filter((i) => i && i.trim().length > 0)
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1022:  const keywordsArray = Array.isArray(front.keywords) && front.keywords.length
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1024:    : Array.isArray(front.tags) && front.tags.length
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1027:  const isPolicy = front.category && front.category.trim().length > 0 ? _fmt.boolean(front.category.trim() === "policy") : false;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1028:  const isAboutPage = front.type && front.type.trim().length > 0 ? _fmt.boolean(front.type.trim() === "about") : false;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1029:  const isContactPage = front.type && front.type.trim().length > 0 ? _fmt.boolean(front.type.trim() === "contact") : false;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1030:  const collectionType = front.collectionType && front.collectionType.trim().length > 0 ? front.collectionType.trim() : "";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1045:  ].filter((i) => i && i.trim().length > 0);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1081:  if (keywordsArray.filter((i) => i && i.trim().length > 0).length) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1082:    structured.keywords = keywordsArray.filter((i) => i && i.trim().length > 0);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1091:  let base = langConfig?.canonical;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1097:  const normalizedBase = base.replace(/\/+$/, "/");
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1099:    return normalizedBase;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1102:  return `${normalizedBase}${cleanedSlug}/`;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1113:  path = path.trim();
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1119:  if (typeof _i18n.homePath === "function") {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1121:    if (resolved && typeof resolved === "string") {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1135:  const normalizedTags = Array.isArray(front.tags)
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1136:    ? front.tags.filter((tag) => typeof tag === "string" && tag.trim().length > 0)
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1138:  const tagLinks = normalizedTags
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1145:    typeof front.category === "string" && front.category.trim().length > 0
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1150:  const normalizedFront = {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1152:    tags: normalizedTags,
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1154:    hasTags: normalizedTags.length > 0,
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1157:      typeof front.category === "string" && front.category.trim().length > 0
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1158:        ? front.category.trim()
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1166:  if (front?.collectionType) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1167:    normalizedFront.collectionType = normalizeCollectionTypeValue(front.collectionType);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1169:  normalizedFront.seriesListing = buildSeriesListing(normalizedFront, lang);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1170:  const listing = listingOverride ?? buildCollectionListing(normalizedFront, lang);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1172:    listing?.type ?? resolveCollectionType(normalizedFront, listing?.items),
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1178:    front: normalizedFront,
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1194:  const normalizedLang = lang ?? _i18n.default;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1195:  const languageFlags = _i18n.flags(normalizedLang);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1198:    lang: normalizedLang,
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1200:    pages: PAGES[normalizedLang] ?? {},
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1248:  if (!markdown || typeof markdown !== "string") {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1335:  const normalizedLang = lang ?? _i18n.default;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1336:  if (typeof canonical === "string" && canonical.trim().length > 0) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1337:    const trimmedCanonical = canonical.trim();
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1340:      const normalizedRelative = `/${relative}`.replace(/\/+/g, "/");
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1341:      return ensureDirectoryTrailingSlash(normalizedRelative);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1346:  const fallback = canonicalToRelativePath(defaultCanonical(normalizedLang, slug));
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1348:    const normalizedFallback = `/${fallback}`.replace(/\/+/g, "/");
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1349:    return ensureDirectoryTrailingSlash(normalizedFallback);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1352:  if (normalizedLang !== _i18n.default) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1353:    const langPath = `/${normalizedLang}${slugSegment}`.replace(/\/+/g, "/");
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1357:  const normalizedSlug = slugSegment.replace(/\/+/g, "/");
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1358:  return ensureDirectoryTrailingSlash(normalizedSlug);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1379:    if (!Array.isArray(policiesByLang[file.lang])) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1460:  const normalizedLang = lang ?? _i18n.default;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1461:  const langCollections = PAGES[normalizedLang] ?? {};
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1463:  const sourceItems = key && Array.isArray(langCollections[key]) ? langCollections[key] : [];
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1469:    lang: normalizedLang,
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1472:    emptyMessage: resolveListingEmpty(front, normalizedLang),
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1480:  const relatedSource = Array.isArray(front?.related) ? front.related : [];
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1481:  const seriesName = typeof front?.seriesTitle === "string" && front.seriesTitle.trim().length > 0
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1482:    ? front.seriesTitle.trim()
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1483:    : typeof front?.series === "string"
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1484:      ? front.series.trim()
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1486:  const currentId = typeof front?.id === "string" ? front.id.trim() : "";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1490:    const value = typeof entry === "string" ? entry.trim() : "";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1504:    const summaryLang = lang || front?.lang;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1507:      summary = summaryLookup[summaryLang] ?? summaryLookup[front?.lang] ?? Object.values(summaryLookup)[0];
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1509:    const label = summary?.title ?? (isCurrent ? front?.title ?? value : value);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1510:    const url = summary?.canonical ?? "";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1512:    const hasUrl = typeof url === "string" && url.length > 0;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1525:    hasLabel: Boolean(seriesName),
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1531:function normalizeCollectionTypeValue(value) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1532:  if (typeof value !== "string") {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1535:  return value.trim().toLowerCase();
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1540:    normalizeCollectionTypeValue(front?.collectionType) ||
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1541:    normalizeCollectionTypeValue(front?.listType) ||
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1542:    normalizeCollectionTypeValue(front?.type);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1547:  if (Array.isArray(items)) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1549:      (entry) => typeof entry?.type === "string" && entry.type.trim().length > 0,
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1552:      return entryWithType.type.trim().toLowerCase();
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1556:  if (typeof fallback === "string" && fallback.trim().length > 0) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1557:    return fallback.trim().toLowerCase();
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1564:  const normalized = normalizeCollectionTypeValue(type);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1566:    collectionType: normalized,
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1567:    isTag: normalized === "tag",
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1568:    isCategory: normalized === "category",
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1569:    isAuthor: normalized === "author",
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1570:    isSeries: normalized === "series",
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1571:    isHome: normalized === "home",
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1578:    typeof front.listKey === "string" ? front.listKey : null,
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1579:    typeof front.slug === "string" ? front.slug : null,
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1580:    typeof front.category === "string" ? front.category : null,
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1581:    typeof front.id === "string" ? front.id : null,
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1584:    if (typeof value !== "string") continue;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1585:    const normalized = _fmt.slugify(value);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1586:    if (normalized) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1587:      return normalized;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1596:  if (typeof listingEmpty === "string" && listingEmpty.trim().length > 0) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1597:    return listingEmpty.trim();
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1599:  if (listingEmpty && typeof listingEmpty === "object") {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1601:    if (typeof localized === "string" && localized.trim().length > 0) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1602:      return localized.trim();
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1605:    if (typeof fallback === "string" && fallback.trim().length > 0) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1606:      return fallback.trim();
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1614:  if (typeof front.listHeading === "string" && front.listHeading.trim().length > 0) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1615:    return front.listHeading.trim();
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1617:  if (typeof front.title === "string" && front.title.trim().length > 0) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1618:    return front.title.trim();
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1668:    if (Array.isArray(file.tags)) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1673:      typeof category === "string" ? category.trim() : "",
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1723:      const allItems = key && Array.isArray(langCollections[key]) ? langCollections[key] : [];
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1734:        if (Array.isArray(allItems)) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1754:          if (typeof data.canonical === "string" && data.canonical.trim().length > 0) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1755:            const trimmed = data.canonical.trim().replace(/\/+$/, "");
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1783:    const baseUrl = (langConfig?.canonical ?? _cfg.identity.url) || "";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1784:    const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1785:    acc[lang] = `${normalizedBase}feed.xml`;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1798:    const channelLink = langConfig?.canonical ?? _cfg.identity.url;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1813:        const description = entry.description ? entry.description.trim() : "";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1823:          typeof category === "string" ? category.trim() : "",
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1942:  if (!COLLECTION_CONFIG || typeof COLLECTION_CONFIG !== "object") {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1949:    if (!config || typeof config !== "object") {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1954:      config.slugPattern && typeof config.slugPattern === "object" ? config.slugPattern : {};
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1957:      Array.isArray(config.types) && config.types.length > 0
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1960:            normalizeCollectionTypeValue(typeof value === "string" ? value : ""),
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1972:      const langSlugPattern = typeof slugPattern[lang] === "string" ? slugPattern[lang] : null;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1977:        if (!Array.isArray(sourceItems) || sourceItems.length === 0) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:1985:        const hasMatchingType = items.some((entry) => types.includes(normalizeCollectionTypeValue(entry.type)));
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2031:    if (typeof path === "string" && path.trim().length > 0) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2032:      lines.push(`Allow: ${path.trim()}`);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2037:    if (typeof path === "string" && path.trim().length > 0) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2038:      lines.push(`Disallow: ${path.trim()}`);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2067:    if (!Array.isArray(itemsByLang[file.lang])) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2102:      file: normalizeLogPath(file.sourcePath),
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2113:        file: normalizeLogPath(file.sourcePath),
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2181:  const sourceItems = key && Array.isArray(langCollections[key]) ? langCollections[key] : [];
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2237:      if (typeof frontMatter.canonical === "string" && frontMatter.canonical.trim().length > 0) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2238:        const trimmed = frontMatter.canonical.trim().replace(/\/+$/, "");
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2295:  if (configKey === "series" && Array.isArray(items)) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2297:      entry && typeof entry.seriesTitle === "string" && entry.seriesTitle.trim().length > 0,
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2300:      return entryWithTitle.seriesTitle.trim();
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2307:  if (!Array.isArray(items) || items.length === 0) return items;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2311:    const id = item?.id;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2317:    const hasSeriesTitle = Boolean(item?.seriesTitle);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2324:    const existingHasSeries = Boolean(existing?.seriesTitle);
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2333:  if (!COLLECTION_CONFIG || typeof COLLECTION_CONFIG !== "object") {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2340:    if (!config || typeof config !== "object") {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2345:      typeof config.template === "string" && config.template.trim().length > 0
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2346:        ? config.template.trim()
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2350:      config.slugPattern && typeof config.slugPattern === "object" ? config.slugPattern : {};
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2352:      config.pairs && typeof config.pairs === "object" ? config.pairs : null;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2355:      Array.isArray(config.types) && config.types.length > 0
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2357:          .map((value) => (typeof value === "string" ? value.trim() : ""))
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2369:      const langSlugPattern = typeof slugPattern[lang] === "string" ? slugPattern[lang] : null;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2375:        if (!Array.isArray(items) || items.length === 0) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2397:          if (pairEntry && typeof pairEntry === "object") {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2405:                typeof pairEntry[altLang] === "string" ? pairEntry[altLang].trim() : "";
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2411:                typeof slugPattern[altLang] === "string" ? slugPattern[altLang] : null;
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2427:        const normalizedTitleSuffix =
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2428:          typeof titleSuffix === "string" && titleSuffix.trim().length > 0
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2429:            ? titleSuffix.trim()
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2431:        const effectiveTitle = normalizedTitleSuffix
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2432:          ? `${baseTitle} | ${normalizedTitleSuffix}`
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2453:        const fallbackType = normalizeCollectionTypeValue(types.length === 1 ? types[0] : "");
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2480:            source: normalizeLogPath(_io.path.combine("collections", configKey)),
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2556:    _log.step("ASSETS_SKIP", { reason: "missing", dir: normalizeLogPath(ASSETS_DIR) });
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2564:    source: normalizeLogPath(ASSETS_DIR),
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2565:    target: normalizeLogPath(targetDir),
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2577:      if (!stats || (typeof stats.isFile === "function" && !stats.isFile())) {
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2582:        source: normalizeLogPath(srcPath),
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2583:        target: normalizeLogPath(destPath),
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2584:        output: formatBytes(stats?.size ?? 0),
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2588:    _log.debug("ASSET_SCAN_FAILED", { message: error?.message ?? error });
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2593:  _log.step("BUILD_START", { dist: normalizeLogPath(DIST_DIR) });
/home/fatihtatoglu/workspace/fatihtatoglu/shevky/scripts/build.js:2604:  _log.step("BUILD_DONE", { dist: normalizeLogPath(DIST_DIR) });
~~~
