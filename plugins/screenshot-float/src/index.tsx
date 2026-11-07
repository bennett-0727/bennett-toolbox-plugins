import * as React from "react";
import Component from "./component";
import { mountReact } from "@shared/plugin";

window.__BENNETT_REGISTER_PLUGIN__?.("bennett.screenshot-float", (api) => ({
  mount(container) {
    return mountReact(container, <Component />, api);
  },
}));
