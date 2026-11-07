import * as React from "react";
import { createRoot } from "react-dom/client";
import { setLanguage } from "./i18n/messages";
import type { PluginApi } from "./types";

export function mountReact(container: HTMLElement, node: React.ReactNode, api: PluginApi) {
  setLanguage(api.locale);
  const rootElement = document.createElement("div");
  rootElement.className = "plugin-ui";
  container.appendChild(rootElement);
  const root = createRoot(rootElement);
  root.render(node);
  return () => {
    root.unmount();
    rootElement.remove();
  };
}
