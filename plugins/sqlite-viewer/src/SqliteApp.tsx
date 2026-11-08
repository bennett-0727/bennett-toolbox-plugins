import * as React from "react";
import type { PluginApi, PluginLocale } from "../../../plugin-api";
import SqliteSession, {
  messages,
  mountStyle,
  type QueryFavorite,
  type QueryHistoryEntry,
} from "./SqliteSession";

interface Tab {
  id: string;
  path: string;
  name: string;
}

interface RecentDatabase {
  path: string;
  name: string;
  lastOpened: string;
}

const HISTORY_KEY = "history.v1";
const FAVORITES_KEY = "favorites.v1";
const RECENTS_KEY = "recents.v1";

function makeId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function readList<T>(api: PluginApi, key: string): T[] {
  try {
    const value = JSON.parse(api.storage.get(key) || "[]");
    return Array.isArray(value) ? (value as T[]) : [];
  } catch {
    return [];
  }
}

function formatTime(value: string, locale: PluginLocale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function mountAppStyle() {
  if (document.getElementById("btp-sqlite-app-style")) return;
  const style = document.createElement("style");
  style.id = "btp-sqlite-app-style";
  style.textContent = `
    .btp-sqlite-app { display:flex; flex:1; min-height:0; flex-direction:column; color:var(--text-primary); }
    .btp-sqlite-app-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; padding:18px 24px 10px; }
    .btp-sqlite-app-head h1 { margin:0; }
    .btp-sqlite-app-head p { margin:5px 0 0; color:var(--text-muted); font-size:13px; }
    .btp-sqlite-app-actions { display:flex; align-items:center; gap:8px; position:relative; }
    .btp-sqlite-tabbar { display:flex; align-items:center; gap:4px; padding:0 24px; overflow-x:auto; flex:0 0 auto; border-bottom:1px solid var(--glass-border); }
    .btp-sqlite-tab { display:flex; align-items:center; gap:4px; max-width:240px; padding:6px 6px 6px 10px; border:1px solid transparent; border-bottom:none; border-radius:8px 8px 0 0; color:var(--text-muted); font-size:12px; cursor:pointer; white-space:nowrap; }
    .btp-sqlite-tab:hover { background:rgba(255,255,255,.04); color:var(--text-secondary); }
    .btp-sqlite-tab.active { background:rgba(var(--accent-rgb),.13); border-color:rgba(var(--accent-rgb),.28); color:var(--text-primary); }
    .btp-sqlite-tab-name { overflow:hidden; text-overflow:ellipsis; max-width:180px; }
    .btp-sqlite-tab-close { border:none; background:none; color:var(--text-muted); cursor:pointer; padding:1px 4px; border-radius:4px; font-size:14px; line-height:1; }
    .btp-sqlite-tab-close:hover { background:rgba(255,255,255,.1); color:var(--text-primary); }
    .btp-sqlite-tab-add { border:1px solid var(--glass-border); background:transparent; color:var(--text-muted); border-radius:6px; cursor:pointer; padding:3px 8px; font-size:14px; margin-left:4px; }
    .btp-sqlite-tab-add:hover { color:var(--text-primary); background:rgba(255,255,255,.05); }
    .btp-sqlite-tab-content { display:flex; flex:1; min-height:0; }
    .btp-sqlite-session { display:flex; flex:1; min-height:0; }
    .btp-sqlite-session.hidden { display:none; }
    .btp-sqlite-welcome { flex:1; min-height:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; padding:32px; color:var(--text-muted); font-size:13px; }
    .btp-sqlite-recent { display:flex; flex-direction:column; gap:6px; width:min(540px,100%); margin-top:6px; }
    .btp-sqlite-recent-title { color:var(--text-muted); font-size:12px; margin-bottom:2px; }
    .btp-sqlite-recent-item { display:flex; flex-direction:column; gap:2px; text-align:left; padding:9px 12px; border:1px solid var(--glass-border); border-radius:8px; background:rgba(255,255,255,.03); color:var(--text-secondary); cursor:pointer; }
    .btp-sqlite-recent-item:hover { border-color:rgba(var(--accent-rgb),.35); color:var(--text-primary); }
    .btp-sqlite-recent-name { font-size:13px; }
    .btp-sqlite-recent-path { color:var(--text-muted); font:10px var(--font-mono); overflow-wrap:anywhere; }
    .btp-sqlite-recent-menu { position:absolute; top:40px; right:0; z-index:20; width:min(360px,80vw); max-height:320px; overflow:auto; padding:8px; border:1px solid var(--glass-border); border-radius:10px; background:rgba(18,20,32,.96); box-shadow:0 16px 40px rgba(0,0,0,.35); }
    .btp-sqlite-app-error { margin:0 24px 8px; color:#fca5a5; font-size:12px; }
    html[data-theme="glass-light"] .btp-sqlite-recent-menu { background:rgba(248,250,252,.98); }
    html[data-theme="glass-light"] .btp-sqlite-tab:hover { background:rgba(15,23,42,.05); }
  `;
  document.head.appendChild(style);
}

export default function SqliteApp({ api }: { api: PluginApi }) {
  const [locale, setLocale] = React.useState<PluginLocale>(api.locale);
  const [tabs, setTabs] = React.useState<Tab[]>([]);
  const [activeId, setActiveId] = React.useState("");
  const [history, setHistory] = React.useState<QueryHistoryEntry[]>(() => readList(api, HISTORY_KEY));
  const [favorites, setFavorites] = React.useState<QueryFavorite[]>(() => readList(api, FAVORITES_KEY));
  const [recents, setRecents] = React.useState<RecentDatabase[]>(() => readList(api, RECENTS_KEY));
  const [recentOpen, setRecentOpen] = React.useState(false);
  const [error, setError] = React.useState("");
  const [txTabs, setTxTabs] = React.useState<Record<string, boolean>>({});
  const [exportTabs, setExportTabs] = React.useState<Record<string, boolean>>({});
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const copy = messages[locale];

  React.useEffect(() => api.onLocaleChange(setLocale), [api]);
  React.useEffect(() => mountStyle(), []);
  React.useEffect(() => mountAppStyle(), []);
  React.useEffect(() => {
    api.storage.set(HISTORY_KEY, JSON.stringify(history));
  }, [api, history]);
  React.useEffect(() => {
    api.storage.set(FAVORITES_KEY, JSON.stringify(favorites));
  }, [api, favorites]);
  React.useEffect(() => {
    api.storage.set(RECENTS_KEY, JSON.stringify(recents));
  }, [api, recents]);

  const recordRecent = (path: string, name: string) => {
    setRecents((current) => [
      { path, name, lastOpened: new Date().toISOString() },
      ...current.filter((item) => item.path !== path),
    ].slice(0, 12));
  };

  const openPath = (path: string, name: string) => {
    setError("");
    const existing = tabs.find((tab) => tab.path === path);
    if (existing) {
      setActiveId(existing.id);
      return;
    }
    const id = makeId();
    setTabs((current) => [...current, { id, path, name }]);
    setActiveId(id);
    recordRecent(path, name);
    setRecentOpen(false);
  };

  const openFile = (file: File) => {
    const electron = (window as unknown as { require: (name: string) => any }).require("electron");
    const path = electron.webUtils?.getPathForFile?.(file) ?? "";
    if (!path) {
      setError(copy.pathUnavailable);
      return;
    }
    openPath(path, file.name);
  };

  const openRecent = (item: RecentDatabase) => {
    const fs = (window as unknown as { require: (name: string) => any }).require("fs");
    if (!fs.existsSync(item.path)) {
      setRecents((current) => current.filter((entry) => entry.path !== item.path));
      setError(`${copy.missingFile}: ${item.path}`);
      return;
    }
    openPath(item.path, item.name);
  };

  const closeTab = (id: string) => {
    if (txTabs[id]) {
      setError(copy.txActive);
      return;
    }
    if (exportTabs[id]) {
      setError(copy.exporting);
      return;
    }
    setTabs((current) => {
      const index = current.findIndex((tab) => tab.id === id);
      const next = current.filter((tab) => tab.id !== id);
      if (activeId === id) {
        setActiveId(next[Math.min(index, next.length - 1)]?.id || "");
      }
      return next;
    });
    setTxTabs((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setExportTabs((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const recordHistory = (entry: Omit<QueryHistoryEntry, "id" | "at">) => {
    setHistory((current) => {
      const first = current[0];
      if (first && first.sql === entry.sql && first.dbPath === entry.dbPath) return current;
      return [{ ...entry, id: makeId(), at: new Date().toISOString() }, ...current].slice(0, 200);
    });
  };

  const toggleFavorite = (sql: string, dbName: string) => {
    const value = sql.trim();
    if (!value) return;
    setFavorites((current) => {
      const existing = current.find((item) => item.sql === value);
      if (existing) return current.filter((item) => item.id !== existing.id);
      return [{ id: makeId(), sql: value, createdAt: new Date().toISOString(), dbName }, ...current].slice(0, 100);
    });
  };

  const removeFavorite = (id: string) => {
    setFavorites((current) => current.filter((item) => item.id !== id));
  };

  const recentList = (
    <div className="btp-sqlite-recent">
      <span className="btp-sqlite-recent-title">{copy.recentTitle}</span>
      {recents.length === 0 ? (
        <span className="btp-sqlite-recent-path">{copy.noRecents}</span>
      ) : (
        recents.map((item) => (
          <button
            key={item.path}
            type="button"
            className="btp-sqlite-recent-item"
            onClick={() => openRecent(item)}
          >
            <span className="btp-sqlite-recent-name">{item.name}</span>
            <span className="btp-sqlite-recent-path">{item.path} · {formatTime(item.lastOpened, locale)}</span>
          </button>
        ))
      )}
    </div>
  );

  return (
    <div className="btp-sqlite-app">
      <div className="btp-sqlite-app-head">
        <div>
          <h1 className="module-title">{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
        <div className="btp-sqlite-app-actions">
          <input
            ref={fileRef}
            type="file"
            accept=".db,.sqlite,.sqlite3,application/x-sqlite3"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) openFile(file);
              event.target.value = "";
            }}
          />
          <button type="button" className="btn btn-secondary" onClick={() => setRecentOpen((value) => !value)}>
            {copy.recent}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => fileRef.current?.click()}>
            {copy.open}
          </button>
          {recentOpen && <div className="btp-sqlite-recent-menu">{recentList}</div>}
        </div>
      </div>
      {error && <div className="btp-sqlite-app-error">{error}</div>}
      {tabs.length > 0 && (
        <div className="btp-sqlite-tabbar">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`btp-sqlite-tab ${tab.id === activeId ? "active" : ""}`}
              onClick={() => setActiveId(tab.id)}
              title={tab.path}
            >
              <span className="btp-sqlite-tab-name">{tab.name}</span>
              <button
                type="button"
                className="btp-sqlite-tab-close"
                title={txTabs[tab.id] ? copy.txActive : exportTabs[tab.id] ? copy.exporting : copy.closeTab}
                onClick={(event) => {
                  event.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" className="btp-sqlite-tab-add" title={copy.tabNew} onClick={() => fileRef.current?.click()}>
            +
          </button>
        </div>
      )}
      <div className="btp-sqlite-tab-content">
        {tabs.length === 0 ? (
          <div className="btp-sqlite-welcome">
            <span>{copy.empty}</span>
            <button type="button" className="btn btn-primary" onClick={() => fileRef.current?.click()}>
              {copy.open}
            </button>
            {recentList}
          </div>
        ) : (
          tabs.map((tab) => (
            <div key={tab.id} className={`btp-sqlite-session ${tab.id === activeId ? "" : "hidden"}`}>
              <SqliteSession
                api={api}
                initialPath={tab.path}
                initialName={tab.name}
                history={history}
                favorites={favorites}
                onRecordHistory={recordHistory}
                onClearHistory={() => setHistory([])}
                onToggleFavorite={toggleFavorite}
                onRemoveFavorite={removeFavorite}
                onTxChange={(active) => setTxTabs((current) => ({ ...current, [tab.id]: active }))}
                onExportChange={(active) => setExportTabs((current) => ({ ...current, [tab.id]: active }))}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
