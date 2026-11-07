import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import type { PluginApi, PluginInstance, PluginLocale } from "../../../plugin-api";
import { messages } from "./messages";

const STYLE_ID = "btp-text-stats-style";

function readingTime(text: string, locale: PluginLocale): string {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const seconds = Math.max(1, Math.round((words / 220) * 60));
  if (seconds < 60) return `${seconds} ${messages[locale].second}`;
  return `${Math.max(1, Math.round(seconds / 60))} ${messages[locale].minute}`;
}

function TextStatsApp({ api }: { api: PluginApi }) {
  const [locale, setLocale] = React.useState<PluginLocale>(api.locale);
  const [text, setText] = React.useState("");

  React.useEffect(() => api.onLocaleChange(setLocale), [api]);

  const copy = messages[locale];
  const bytes = new TextEncoder().encode(text).length;
  const chars = [...text].length;
  const charsNoSpace = [...text.replace(/\s/g, "")].length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text ? text.split(/\r?\n/).length : 0;
  const stats = [
    [copy.characters, chars],
    [copy.charactersNoSpace, charsNoSpace],
    [copy.words, words],
    [copy.lines, lines],
    [copy.bytes, bytes],
  ] as const;

  return (
    <div className="btp-text-stats">
      <div className="btp-text-stats-header">
        <h1 className="module-title">{copy.title}</h1>
        <p>{copy.subtitle}</p>
      </div>
      <textarea
        className="btp-text-stats-input"
        value={text}
        placeholder={copy.placeholder}
        onChange={(event) => setText(event.target.value)}
      />
      <div className="btp-text-stats-grid">
        {stats.map(([label, value]) => (
          <div className="btp-text-stats-card" key={label}>
            <span className="btp-text-stats-value">{value}</span>
            <span className="btp-text-stats-label">{label}</span>
          </div>
        ))}
        <div className="btp-text-stats-card">
          <span className="btp-text-stats-value">{readingTime(text, locale)}</span>
          <span className="btp-text-stats-label">{copy.reading}</span>
        </div>
      </div>
    </div>
  );
}

function mountStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .btp-text-stats { display:flex; flex-direction:column; gap:16px; padding:24px; min-height:100%; box-sizing:border-box; }
    .btp-text-stats-header h1 { margin:0; }
    .btp-text-stats-header p { margin:6px 0 0; color:var(--text-muted); font-size:13px; }
    .btp-text-stats-input { min-height:220px; resize:vertical; padding:14px 16px; border-radius:var(--radius-md); border:1px solid var(--glass-border); background:rgba(8,10,18,.24); color:var(--text-primary); font:14px/1.6 var(--font-mono); outline:none; }
    .btp-text-stats-input:focus { border-color:rgba(var(--accent-rgb),.6); box-shadow:0 0 0 3px rgba(var(--accent-rgb),.12); }
    .btp-text-stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:12px; }
    .btp-text-stats-card { display:flex; flex-direction:column; gap:6px; padding:14px 16px; border:1px solid var(--glass-border); border-radius:var(--radius-md); background:var(--glass-sheen), var(--glass-fill); backdrop-filter:blur(18px) saturate(160%); }
    .btp-text-stats-value { color:var(--text-primary); font-size:22px; font-weight:700; }
    .btp-text-stats-label { color:var(--text-muted); font-size:12px; }
    html[data-theme="glass-light"] .btp-text-stats-input { background:rgba(255,255,255,.5); }
  `;
  document.head.appendChild(style);
}

function factory(api: PluginApi): PluginInstance {
  let root: Root | null = null;
  return {
    mount(container) {
      mountStyle();
      const node = document.createElement("div");
      node.className = "plugin-panel btp-text-stats-panel";
      container.appendChild(node);
      root = createRoot(node);
      root.render(<TextStatsApp api={api} />);
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

window.__BENNETT_REGISTER_PLUGIN__?.("bennett.text-stats", factory);
