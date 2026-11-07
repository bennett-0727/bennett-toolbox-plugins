import * as React from "react";
import Component from "./component";
import { mountReact } from "@shared/plugin";
import { GlobalWorkerOptions } from "pdfjs-dist";

window.__BENNETT_REGISTER_PLUGIN__?.("bennett.pdf-to-images", (api) => ({
  mount(container) {
    GlobalWorkerOptions.workerSrc = api.assets.url("pdf.worker.min.mjs");
    return mountReact(container, <Component />, api);
  },
}));
