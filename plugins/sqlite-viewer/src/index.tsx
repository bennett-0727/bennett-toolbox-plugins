import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import type { PluginApi, PluginInstance, PluginLocale } from "../../../plugin-api";

const MAX_DB_BYTES = 200 * 1024 * 1024;
const MAX_DISPLAY_ROWS = 500;

const messages = {
  "zh-CN": {
    title: "SQLite 查看器",
    subtitle: "浏览表结构并执行 SQL 查询",
    open: "打开数据库",
    exportDb: "导出数据库",
    exportCsv: "导出 CSV",
    schema: "表与视图",
    noTables: "暂无表",
    query: "SQL 查询",
    run: "执行",
    running: "执行中...",
    empty: "打开一个 .db / .sqlite / .sqlite3 文件",
    loading: "正在加载 SQLite 引擎...",
    fileTooLarge: "数据库超过 200MB，暂不支持",
    loadFailed: "数据库加载失败",
    queryError: "查询失败",
    executed: "语句已执行",
    rows: "行",
    columns: "列",
    selectedTable: "已选择表",
    copy: "复制结果",
    copied: "已复制",
  },
  "en-US": {
    title: "SQLite Viewer",
    subtitle: "Browse schema and run SQL queries",
    open: "Open database",
    exportDb: "Export database",
    exportCsv: "Export CSV",
    schema: "Tables & views",
    noTables: "No tables",
    query: "SQL query",
    run: "Run",
    running: "Running...",
    empty: "Open a .db / .sqlite / .sqlite3 file",
    loading: "Loading SQLite engine...",
    fileTooLarge: "Database exceeds 200MB and is not supported",
    loadFailed: "Failed to load database",
    queryError: "Query failed",
    executed: "Statement executed",
    rows: "rows",
    columns: "columns",
    selectedTable: "Selected table",
    copy: "Copy result",
    copied: "Copied",
  },
} as const;

interface QueryResult {
  columns: string[];
  values: unknown[][];
}

function SqliteApp({ api }: { api: PluginApi }) {
  const [locale, setLocale] = React.useState<PluginLocale>(api.locale);
  const [sql, setSql] = React.useState<SqlJsStatic | null>(null);
  const [db, setDb] = React.useState<Database | null>(null);
  const [fileName, setFileName] = React.useState("");
  const [tables, setTables] = React.useState<string[]>([]);
  const [selected, setSelected] = React.useState("");
  const [query, setQuery] = React.useState("SELECT 1;");
  const [result, setResult] = React.useState<QueryResult | null>(null);
  const [status, setStatus] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const copy = messages[locale];

  React.useEffect(() => api.onLocaleChange(setLocale), [api]);

  const loadEngine = async () => {
    if (sql) return sql;
    setStatus(copy.loading);
    const nodeFs = (window as unknown as { require: (name: string) => any }).require("fs");
    const nodeUrl = (window as unknown as { require: (name: string) => any }).require("url");
    const wasm = nodeFs.readFileSync(nodeUrl.fileURLToPath(api.assets.url("sql-wasm.wasm")));
    const next = await initSqlJs({ wasmBinary: wasm });
    setSql(next);
    return next;
  };

  const refreshSchema = (database: Database) => {
    const rows = database.exec(
      "SELECT name FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY name;",
    );
    const names = rows.length ? rows[0].values.map((row) => String(row[0])) : [];
    setTables(names);
    if (!names.includes(selected)) setSelected(names[0] || "");
  };

  const openDatabase = async (file: File) => {
    setError("");
    setResult(null);
    setBusy(true);
    try {
      if (file.size > MAX_DB_BYTES) throw new Error(copy.fileTooLarge);
      const engine = await loadEngine();
      const database = new engine.Database(new Uint8Array(await file.arrayBuffer()));
      db?.close();
      setDb(database);
      setFileName(file.name);
      setQuery("SELECT * FROM sqlite_master WHERE type IN ('table','view') ORDER BY name;");
      refreshSchema(database);
      runQuery(database, "SELECT * FROM sqlite_master WHERE type IN ('table','view') ORDER BY name;");
    } catch (reason) {
      setError(`${copy.loadFailed}: ${reason instanceof Error ? reason.message : String(reason)}`);
    } finally {
      setBusy(false);
      setStatus("");
    }
  };

  const runQuery = (database = db, statement = query) => {
    if (!database) return;
    setError("");
    setStatus("");
    try {
      const started = performance.now();
      const execution = database.exec(statement);
      const elapsed = performance.now() - started;
      if (execution.length === 0) {
        setResult(null);
        setStatus(`${copy.executed} · ${elapsed.toFixed(1)}ms`);
        return;
      }
      const first = execution[0];
      setResult({
        columns: first.columns,
        values: first.values.slice(0, MAX_DISPLAY_ROWS),
      });
      setStatus(
        `${first.values.length} ${copy.rows} · ${first.columns.length} ${copy.columns} · ${elapsed.toFixed(1)}ms`,
      );
      refreshSchema(database);
    } catch (reason) {
      setResult(null);
      setError(`${copy.queryError}: ${reason instanceof Error ? reason.message : String(reason)}`);
    }
  };

  const selectTable = (name: string) => {
    setSelected(name);
    const statement = `SELECT * FROM "${name.replace(/"/g, '""')}" LIMIT 200;`;
    setQuery(statement);
    runQuery(db, statement);
  };

  const exportCsv = () => {
    if (!result) return;
    const escape = (value: unknown) => {
      const text = value === null || value === undefined ? "" : String(value);
      return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const csv = [result.columns, ...result.values].map((row) => row.map(escape).join(",")).join("\n");
    download(new Blob([csv], { type: "text/csv;charset=utf-8" }), "query-result.csv");
  };

  const exportDatabase = () => {
    if (!db) return;
    download(new Blob([db.export()], { type: "application/x-sqlite3" }), fileName || "database.sqlite");
  };

  const download = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copyResult = async () => {
    if (!result) return;
    const text = [result.columns.join("\t"), ...result.values.map((row) => row.join("\t"))].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <div className="btp-sqlite">
      <div className="btp-sqlite-head">
        <div>
          <h1 className="module-title">{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
        <div className="btp-sqlite-actions">
          <input
            ref={fileRef}
            type="file"
            accept=".db,.sqlite,.sqlite3,application/x-sqlite3"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void openDatabase(file);
              event.target.value = "";
            }}
          />
          <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
            {copy.open}
          </button>
          <button type="button" className="btn btn-secondary" onClick={exportDatabase} disabled={!db}>
            {copy.exportDb}
          </button>
        </div>
      </div>

      {!db ? (
        <div className="btp-sqlite-empty">
          <span>{status || copy.empty}</span>
          <button type="button" className="btn btn-primary" onClick={() => fileRef.current?.click()}>
            {copy.open}
          </button>
        </div>
      ) : (
        <div className="btp-sqlite-body">
          <aside className="btp-sqlite-schema">
            <span className="btp-sqlite-section-title">{copy.schema}</span>
            {tables.length === 0 ? (
              <span className="btp-sqlite-muted">{copy.noTables}</span>
            ) : (
              tables.map((table) => (
                <button
                  key={table}
                  type="button"
                  className={selected === table ? "active" : ""}
                  onClick={() => selectTable(table)}
                >
                  {table}
                </button>
              ))
            )}
            <span className="btp-sqlite-file">{fileName}</span>
          </aside>
          <section className="btp-sqlite-main">
            <label className="btp-sqlite-query">
              <span>{copy.query}</span>
              <textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault();
                    runQuery();
                  }
                }}
              />
            </label>
            <div className="btp-sqlite-toolbar">
              <button type="button" className="btn btn-primary" onClick={() => runQuery()} disabled={busy}>
                {busy ? copy.running : copy.run}
              </button>
              <button type="button" className="btn btn-secondary" onClick={exportCsv} disabled={!result}>
                {copy.exportCsv}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => void copyResult()} disabled={!result}>
                {copied ? copy.copied : copy.copy}
              </button>
              <span className="btp-sqlite-status">{status}</span>
            </div>
            {error && <div className="btp-sqlite-error">{error}</div>}
            {result && (
              <div className="btp-sqlite-results">
                <table>
                  <thead>
                    <tr>{result.columns.map((column) => <th key={column}>{column}</th>)}</tr>
                  </thead>
                  <tbody>
                    {result.values.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((value, columnIndex) => (
                          <td key={columnIndex}>{value === null ? "NULL" : String(value)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

const STYLE_ID = "btp-sqlite-style";
function mountStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .btp-sqlite { display:flex; flex-direction:column; gap:14px; padding:24px; min-height:100%; box-sizing:border-box; color:var(--text-primary); }
    .btp-sqlite-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
    .btp-sqlite-head h1 { margin:0; }
    .btp-sqlite-head p { margin:6px 0 0; color:var(--text-muted); font-size:13px; }
    .btp-sqlite-actions { display:flex; gap:8px; flex-wrap:wrap; }
    .btp-sqlite-empty { flex:1; min-height:420px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; color:var(--text-muted); font-size:13px; border:1px dashed var(--glass-border); border-radius:var(--radius-md); }
    .btp-sqlite-body { display:grid; grid-template-columns:220px minmax(0,1fr); gap:14px; flex:1; min-height:520px; }
    .btp-sqlite-schema { display:flex; flex-direction:column; gap:6px; padding:12px; border:1px solid var(--glass-border); border-radius:var(--radius-md); background:var(--glass-sheen), var(--glass-fill); overflow:auto; }
    .btp-sqlite-section-title, .btp-sqlite-query > span { color:var(--text-muted); font-size:12px; }
    .btp-sqlite-schema button { text-align:left; padding:6px 9px; border-radius:7px; border:1px solid transparent; background:transparent; color:var(--text-secondary); font:12px var(--font-mono); cursor:pointer; overflow:hidden; text-overflow:ellipsis; }
    .btp-sqlite-schema button:hover { background:rgba(255,255,255,.05); color:var(--text-primary); }
    .btp-sqlite-schema button.active { background:rgba(var(--accent-rgb),.16); border-color:rgba(var(--accent-rgb),.35); color:var(--text-primary); }
    .btp-sqlite-muted { color:var(--text-muted); font-size:12px; }
    .btp-sqlite-file { margin-top:auto; padding-top:10px; color:var(--text-muted); font-size:11px; overflow-wrap:anywhere; }
    .btp-sqlite-main { display:flex; flex-direction:column; gap:10px; padding:14px; border:1px solid var(--glass-border); border-radius:var(--radius-md); background:var(--glass-sheen), var(--glass-fill); min-width:0; }
    .btp-sqlite-query { display:flex; flex-direction:column; gap:6px; }
    .btp-sqlite-query textarea { min-height:120px; resize:vertical; padding:11px 13px; border-radius:9px; border:1px solid var(--glass-border); background:rgba(8,10,18,.28); color:var(--text-primary); font:13px/1.6 var(--font-mono); outline:none; }
    .btp-sqlite-toolbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .btp-sqlite-status { color:var(--text-muted); font-size:12px; }
    .btp-sqlite-error { color:#fca5a5; font-size:13px; white-space:pre-wrap; }
    .btp-sqlite-results { flex:1; min-height:0; overflow:auto; border:1px solid var(--glass-border); border-radius:9px; }
    .btp-sqlite-results table { border-collapse:collapse; width:100%; font:12px var(--font-mono); }
    .btp-sqlite-results th { position:sticky; top:0; background:rgba(15,18,30,.95); color:var(--text-primary); text-align:left; padding:8px 10px; border-bottom:1px solid var(--glass-border); }
    .btp-sqlite-results td { padding:7px 10px; border-bottom:1px solid rgba(255,255,255,.05); max-width:340px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .btp-sqlite-results tr:hover td { background:rgba(255,255,255,.04); }
    @media (max-width: 1100px) { .btp-sqlite-body { grid-template-columns:1fr; } .btp-sqlite-schema { max-height:180px; } }
    html[data-theme="glass-light"] .btp-sqlite-query textarea { background:rgba(255,255,255,.6); }
    html[data-theme="glass-light"] .btp-sqlite-results th { background:rgba(248,250,252,.96); }
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
