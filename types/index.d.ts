import type {
  BasePluginContext,
  PluginHooks,
  PluginLoadContext as BasePluginLoadContext,
} from "@shevky/base";

export type ProjectPaths = {
  root: string;
  src: string;
  dist: string;
  tmp: string;
  content: string;
  layouts: string;
  components: string;
  templates: string;
  assets: string;
  siteConfig: string;
  i18nConfig: string;
};

export type PluginInstance = {
  name: string;
  version: string;
  hooks: PluginHooks;
  load: (ctx: PluginLoadContext) => void;
};

export type PluginLoadContext = BasePluginLoadContext;

export interface PluginExecutionContext extends BasePluginContext {
  paths: ProjectPaths;
}
