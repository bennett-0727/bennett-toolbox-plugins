export type PluginLocale = "zh-CN" | "en-US";

export interface PluginApi {
  apiVersion: 1;
  pluginId: string;
  hostVersion: string;
  readonly locale: PluginLocale;
  readonly theme: string;
  t(text: string): string;
  onLocaleChange(callback: (locale: PluginLocale) => void): () => void;
  onThemeChange(callback: (theme: string) => void): () => void;
  storage: {
    get(key: string): string | null;
    set(key: string, value: string): void;
    remove(key: string): void;
  };
  assets: {
    url(relative: string): string;
  };
  log(...args: unknown[]): void;
}

export interface PluginInstance {
  mount?(container: HTMLElement, api: PluginApi): void | (() => void) | Promise<void | (() => void)>;
  unmount?(): void | Promise<void>;
  activate?(api: PluginApi): void | Promise<void>;
  deactivate?(): void | Promise<void>;
}
