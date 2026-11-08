import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import type { PluginApi, PluginInstance } from "../../../plugin-api";
import SqliteApp from "./SqliteApp";
import { mountStyle } from "./SqliteSession";

function factory(api: PluginApi): PluginInstance {
  let root: Root | null = null;
  return {
    mount(container) {
      mountStyle();
      const node = document.createElement("div");
      node.className = "plugin-panel btp-sqlite-panel";
      container.appendChild(node);
      root = createRoot(node);
      root.render(<SqliteApp api={api} />);
      return () => {
        root?.unmount();
        root = null;
        node.remove();
      };
    },
    unmount() {
      root?.unmount();
      root = null;
    },
  };
}

window.__BENNETT_REGISTER_PLUGIN__?.("bennett.sqlite-viewer", factory);
