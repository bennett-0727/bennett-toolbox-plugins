import * as React from "react";
import Component from "./component";
import { mountReact } from "@shared/plugin";

window.__BENNETT_REGISTER_PLUGIN__?.("bennett.file-search", (api) => ({
  mount(container) {
    return mountReact(container, <Component />, api);
  },
}));
