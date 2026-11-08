import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { marked } from "marked";
import DOMPurify from "dompurify";
import mermaid from "mermaid";
import type { PluginApi, PluginInstance, PluginLocale } from "../../../plugin-api";

const SAMPLES = {
  "zh-CN": `# Markdown / Mermaid

实时预览 Markdown，并渲染 Mermaid 图表。

## 表格

| 工具 | 用途 |
| --- | --- |
| Markdown | 文档 |
| Mermaid | 图表 |

\`\`\`mermaid
flowchart LR
  A[Edit] --> B[Preview]
  B --> C{Diagram?}
  C -- Yes --> D[Mermaid]
  C -- No --> E[HTML]
\`\`\`

\`\`\`ts
const answer = 42;
\`\`\`
`,
  "en-US": `# Markdown / Mermaid

Preview Markdown live and render Mermaid diagrams.

## Table

| Tool | Purpose |
| --- | --- |
| Markdown | Documentation |
| Mermaid | Diagrams |

\`\`\`mermaid
flowchart LR
  A[Edit] --> B[Preview]
  B --> C{Diagram?}
  C -- Yes --> D[Mermaid]
  C -- No --> E[HTML]
\`\`\`

\`\`\`ts
const answer = 42;
\`\`\`
`,
} as const;

const messages = {
  "zh-CN": {
    title: "Markdown / Mermaid",
    subtitle: "Markdown 实时预览与 Mermaid 图表渲染",
    open: "打开 Markdown",
    download: "下载 .md",
    editor: "编辑",
    preview: "预览",
    placeholder: "在这里输入 Markdown...",
    diagramError: "Mermaid 渲染失败",
    fileError: "读取文件失败",
  },
  "en-US": {
    title: "Markdown / Mermaid",
    subtitle: "Live Markdown preview with Mermaid diagrams",
    open: "Open Markdown",
    download: "Download .md",
    editor: "Editor",
    preview: "Preview",
    placeholder: "Type Markdown here...",
    diagramError: "Mermaid render failed",
    fileError: "Failed to read the file",
  },
} as const;

function MarkdownApp({ api }: { api: PluginApi }) {
  const [locale, setLocale] = React.useState<PluginLocale>(api.locale);
  const [markdown, setMarkdown] = React.useState(() => SAMPLES[api.locale]);
  const [fileName, setFileName] = React.useState("untitled.md");
  const [error, setError] = React.useState("");
  const [theme, setTheme] = React.useState(api.theme);
  const previewRef = React.useRef<HTMLDivElement | null>(null);
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const copy = messages[locale];

  React.useEffect(() => api.onLocaleChange(setLocale), [api]);
  React.useEffect(() => api.onThemeChange(setTheme), [api]);

  React.useEffect(() => {
    const node = previewRef.current;
    if (!node) return;
    let cancelled = false;
    const render = async () => {
      const html = DOMPurify.sanitize(String(marked.parse(markdown)));
      node.innerHTML = html;
      const blocks = Array.from(node.querySelectorAll("pre > code.language-mermaid"));
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: theme.includes("light") ? "default" : "dark",
        fontFamily: "Inter, system-ui, sans-serif",
      });
      for (let index = 0; index < blocks.length; index += 1) {
        const code = blocks[index];
        const container = document.createElement("div");
        container.className = "btp-md-diagram";
        container.textContent = code.textContent || "";
        code.parentElement?.replaceWith(container);
      }
      const diagrams = Array.from(node.querySelectorAll<HTMLElement>(".btp-md-diagram"));
      for (let index = 0; index < diagrams.length; index += 1) {
        if (cancelled) return;
        const diagram = diagrams[index];
        const source = diagram.textContent || "";
        try {
          const { svg } = await mermaid.render(`btp-mermaid-${Date.now()}-${index}`, source);
          if (!cancelled) diagram.innerHTML = svg;
        } catch (reason) {
          if (!cancelled) {
            diagram.classList.add("btp-md-diagram-error");
            diagram.textContent = `${copy.diagramError}: ${
              reason instanceof Error ? reason.message : String(reason)
            }`;
          }
        }
      }
    };
    void render();
    return () => {
      cancelled = true;
    };
  }, [markdown, theme, copy.diagramError]);

  const openFile = (file: File) => {
    setError("");
    file.text()
      .then((text) => {
        setMarkdown(text);
        setFileName(file.name);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : copy.fileError));
  };

  const download = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName.endsWith(".md") || fileName.endsWith(".markdown") ? fileName : `${fileName}.md`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="btp-md">
      <div className="btp-md-head">
        <div>
          <h1 className="module-title">{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
        <div className="btp-md-actions">
          <input
            ref={fileRef}
            type="file"
            accept=".md,.markdown,text/markdown"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) openFile(file);
              event.target.value = "";
            }}
          />
          <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
            {copy.open}
          </button>
          <button type="button" className="btn btn-primary" onClick={download}>
            {copy.download}
          </button>
        </div>
      </div>
      {error && <div className="btp-md-error">{error}</div>}
      <div className="btp-md-grid">
        <section className="btp-md-pane">
          <span className="btp-md-pane-title">{copy.editor}</span>
          <textarea value={markdown} placeholder={copy.placeholder} onChange={(event) => setMarkdown(event.target.value)} />
        </section>
        <section className="btp-md-pane">
          <span className="btp-md-pane-title">{copy.preview}</span>
          <div ref={previewRef} className="btp-md-preview" />
        </section>
      </div>
    </div>
  );
}

const STYLE_ID = "btp-md-style";
function mountStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .btp-md { display:flex; flex-direction:column; gap:14px; padding:24px; min-height:100%; box-sizing:border-box; color:var(--text-primary); }
    .btp-md-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
    .btp-md-head h1 { margin:0; }
    .btp-md-head p { margin:6px 0 0; color:var(--text-muted); font-size:13px; }
    .btp-md-actions { display:flex; gap:8px; flex-wrap:wrap; }
    .btp-md-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; flex:1; min-height:520px; }
    .btp-md-pane { display:flex; flex-direction:column; gap:8px; border:1px solid var(--glass-border); border-radius:var(--radius-md); background:var(--glass-sheen), var(--glass-fill); padding:12px; min-width:0; }
    .btp-md-pane-title { color:var(--text-muted); font-size:12px; }
    .btp-md-pane textarea { flex:1; resize:none; min-height:460px; padding:12px 14px; border-radius:9px; border:1px solid var(--glass-border); background:rgba(8,10,18,.28); color:var(--text-primary); font:13px/1.7 var(--font-mono); outline:none; }
    .btp-md-preview { flex:1; overflow:auto; padding:6px 12px; line-height:1.7; font-size:14px; }
    .btp-md-preview h1, .btp-md-preview h2, .btp-md-preview h3 { margin:18px 0 8px; line-height:1.3; }
    .btp-md-preview h1 { font-size:24px; }
    .btp-md-preview h2 { font-size:19px; }
    .btp-md-preview p { margin:8px 0; }
    .btp-md-preview code { padding:2px 5px; border-radius:5px; background:rgba(255,255,255,.08); font-family:var(--font-mono); font-size:12px; }
    .btp-md-preview pre { padding:12px; border-radius:9px; background:rgba(8,10,18,.35); overflow:auto; }
    .btp-md-preview pre code { padding:0; background:none; }
    .btp-md-preview table { border-collapse:collapse; width:100%; margin:10px 0; }
    .btp-md-preview th, .btp-md-preview td { border:1px solid var(--glass-border); padding:6px 9px; text-align:left; }
    .btp-md-preview blockquote { margin:10px 0; padding-left:12px; border-left:3px solid rgba(var(--accent-rgb),.5); color:var(--text-muted); }
    .btp-md-preview img { max-width:100%; }
    .btp-md-diagram { margin:12px 0; padding:10px; border-radius:10px; background:rgba(255,255,255,.03); overflow:auto; }
    .btp-md-diagram svg { max-width:100%; height:auto; }
    .btp-md-diagram-error, .btp-md-error { color:#fca5a5; font-size:13px; white-space:pre-wrap; }
    @media (max-width: 1100px) { .btp-md-grid { grid-template-columns:1fr; } .btp-md-pane textarea { min-height:260px; } }
    html[data-theme="glass-light"] .btp-md-pane textarea { background:rgba(255,255,255,.6); }
    html[data-theme="glass-light"] .btp-md-preview code { background:rgba(15,23,42,.08); }
  `;
  document.head.appendChild(style);
}

function factory(api: PluginApi): PluginInstance {
  let root: Root | null = null;
  return {
    mount(container) {
      mountStyle();
      const node = document.createElement("div");
      node.className = "plugin-panel";
      container.appendChild(node);
      root = createRoot(node);
      root.render(<MarkdownApp api={api} />);
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

window.__BENNETT_REGISTER_PLUGIN__?.("bennett.markdown-preview", factory);
