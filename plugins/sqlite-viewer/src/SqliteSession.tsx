import * as React from "react";
import type { PluginApi, PluginLocale } from "../../../plugin-api";
import SqlEditor, { type SqlEditorHandle } from "./SqlEditor";

export interface QueryHistoryEntry {
  id: string;
  sql: string;
  dbName: string;
  dbPath: string;
  at: string;
  rows: number;
  durationMs: number;
}

export interface QueryFavorite {
  id: string;
  sql: string;
  createdAt: string;
  dbName: string;
}

interface SqliteSessionProps {
  api: PluginApi;
  initialPath: string;
  initialName: string;
  history: QueryHistoryEntry[];
  favorites: QueryFavorite[];
  onRecordHistory: (entry: Omit<QueryHistoryEntry, "id" | "at">) => void;
  onClearHistory: () => void;
  onToggleFavorite: (sql: string, dbName: string) => void;
  onRemoveFavorite: (id: string) => void;
  onTxChange: (active: boolean) => void;
  onExportChange: (active: boolean) => void;
}

const PAGE_SIZES = [50, 100, 200, 500];
const DEFAULT_QUERY = "SELECT * FROM sqlite_master WHERE type IN ('table','view') ORDER BY name;";

export const messages = {
  "zh-CN": {
    title: "SQLite 查看器",
    subtitle: "直接打开本地数据库，支持大库分页与 SQL 查询",
    open: "打开数据库",
    tabNew: "新标签",
    recent: "最近",
    recentTitle: "最近数据库",
    noRecents: "暂无最近数据库",
    closeTab: "关闭标签",
    missingFile: "文件不存在",
    txActive: "有未提交事务，请先提交或回滚",
    loadingDatabase: "正在打开数据库...",
    structure: "结构",
    history: "历史",
    favorites: "收藏",
    historyEmpty: "暂无查询历史",
    favoritesEmpty: "暂无收藏",
    clearHistory: "清空历史",
    favorite: "收藏当前 SQL",
    unfavorite: "取消收藏",
    removeFavorite: "删除收藏",
    explain: "EXPLAIN",
    editAddRow: "新增行",
    editSave: "保存更改",
    editSaveDone: "已保存",
    editDeleted: "已删除",
    editCancel: "取消",
    editDelete: "删除行",
    editConfirmDelete: "确认删除该行？",
    editConflict: "行已被修改或删除",
    editUnsupported: "当前结果不可编辑（需单表且有主键或 rowid）",
    editReadOnly: "切换可写模式后可编辑",
    txBegin: "开始事务",
    txCommit: "提交",
    txRollback: "回滚",
    txActiveLabel: "事务进行中",
    txStarted: "事务已开始",
    txCommitted: "事务已提交",
    txRolledBack: "事务已回滚",
    editNeedWrite: "请先关闭只读模式",
    exportAll: "导出全部",
    exporting: "导出中",
    exportedTo: "已导出到",
    exportFailed: "导出失败",
    copyPath: "复制路径",
    copiedPath: "路径已复制",
    readOnly: "只读模式",
    schema: "表与视图",
    noTables: "暂无表",
    query: "SQL 查询",
    queryPlaceholder: "输入 SQL，选中后只执行选中内容",
    statementsExecuted: "已执行语句数",
    explainSingle: "EXPLAIN 仅支持单条语句",
    run: "执行",
    running: "执行中...",
    empty: "打开一个 .db / .sqlite / .sqlite3 文件",
    loadFailed: "数据库加载失败",
    queryError: "查询失败",
    queryEmpty: "请输入 SQL",
    executed: "语句已执行",
    rows: "行",
    columns: "列",
    page: "页",
    prev: "上一页",
    next: "下一页",
    first: "首页",
    last: "末页",
    pageSize: "每页",
    pageCsv: "导出当前页 CSV",
    copy: "复制当前页",
    copied: "已复制",
    blob: "二进制",
    pathUnavailable: "无法获取文件路径，请重新选择文件",
    schemaRefresh: "表结构已刷新",
    schemaSearch: "搜索表或视图",
    refresh: "刷新",
    noMatch: "没有匹配的对象",
    tableLabel: "表",
    viewLabel: "视图",
    indexes: "索引",
    foreignKeys: "外键",
    triggers: "触发器",
    ddl: "DDL",
    primaryKey: "主键",
    notNull: "非空",
    unique: "唯一",
    default: "默认",
    noIndexes: "无索引",
    noForeignKeys: "无外键",
    noTriggers: "无触发器",
    loadingSchema: "加载结构...",
    copyDdl: "复制 DDL",
    ddlCopied: "DDL 已复制",
    onUpdate: "更新",
    onDelete: "删除",
    expand: "展开",
    collapse: "收起",
    quickFilter: "快捷筛选",
    filterValue: "筛选值",
    apply: "应用",
    clear: "清除",
    opContains: "包含",
    opEquals: "等于",
    opNotEquals: "不等于",
    opGreater: "大于",
    opGreaterEqual: "大于等于",
    opLess: "小于",
    opLessEqual: "小于等于",
    opIsNull: "为空",
    opNotNull: "不为空",
  },
  "en-US": {
    title: "SQLite Viewer",
    subtitle: "Open local databases directly with large-table pagination and SQL",
    open: "Open database",
    tabNew: "New tab",
    recent: "Recent",
    recentTitle: "Recent databases",
    noRecents: "No recent databases",
    closeTab: "Close tab",
    missingFile: "File not found",
    txActive: "Commit or roll back the active transaction first",
    loadingDatabase: "Opening database...",
    structure: "Structure",
    history: "History",
    favorites: "Favorites",
    historyEmpty: "No query history",
    favoritesEmpty: "No favorites",
    clearHistory: "Clear history",
    favorite: "Favorite current SQL",
    unfavorite: "Remove favorite",
    removeFavorite: "Remove favorite",
    explain: "EXPLAIN",
    editAddRow: "Add row",
    editSave: "Save changes",
    editSaveDone: "Saved",
    editDeleted: "Deleted",
    editCancel: "Cancel",
    editDelete: "Delete row",
    editConfirmDelete: "Delete this row?",
    editConflict: "Row was changed or deleted",
    editUnsupported: "This result is read-only (single table with primary key or rowid required)",
    editReadOnly: "Enable write mode to edit",
    txBegin: "Begin",
    txCommit: "Commit",
    txRollback: "Rollback",
    txActiveLabel: "Transaction active",
    txStarted: "Transaction started",
    txCommitted: "Transaction committed",
    txRolledBack: "Transaction rolled back",
    editNeedWrite: "Turn off read-only mode first",
    exportAll: "Export all",
    exporting: "Exporting",
    exportedTo: "Exported to",
    exportFailed: "Export failed",
    copyPath: "Copy path",
    copiedPath: "Path copied",
    readOnly: "Read-only",
    schema: "Tables & views",
    noTables: "No tables",
    query: "SQL query",
    queryPlaceholder: "Type SQL; selection runs alone",
    statementsExecuted: "Statements executed",
    explainSingle: "EXPLAIN supports a single statement only",
    run: "Run",
    running: "Running...",
    empty: "Open a .db / .sqlite / .sqlite3 file",
    loadFailed: "Failed to load database",
    queryError: "Query failed",
    queryEmpty: "Enter SQL first",
    executed: "Statement executed",
    rows: "rows",
    columns: "columns",
    page: "Page",
    prev: "Prev",
    next: "Next",
    first: "First",
    last: "Last",
    pageSize: "Page size",
    pageCsv: "Export page CSV",
    copy: "Copy page",
    copied: "Copied",
    blob: "BLOB",
    pathUnavailable: "Unable to read the file path; choose the file again",
    schemaRefresh: "Schema refreshed",
    schemaSearch: "Search tables or views",
    refresh: "Refresh",
    noMatch: "No matching objects",
    tableLabel: "TABLE",
    viewLabel: "VIEW",
    indexes: "Indexes",
    foreignKeys: "Foreign keys",
    triggers: "Triggers",
    ddl: "DDL",
    primaryKey: "PK",
    notNull: "NOT NULL",
    unique: "UNIQUE",
    default: "DEFAULT",
    noIndexes: "No indexes",
    noForeignKeys: "No foreign keys",
    noTriggers: "No triggers",
    loadingSchema: "Loading schema...",
    copyDdl: "Copy DDL",
    ddlCopied: "DDL copied",
    onUpdate: "update",
    onDelete: "delete",
    expand: "Expand",
    collapse: "Collapse",
    quickFilter: "Quick filter",
    filterValue: "Filter value",
    apply: "Apply",
    clear: "Clear",
    opContains: "contains",
    opEquals: "equals",
    opNotEquals: "not equals",
    opGreater: "greater than",
    opGreaterEqual: "greater or equal",
    opLess: "less than",
    opLessEqual: "less or equal",
    opIsNull: "is null",
    opNotNull: "is not null",
  },
} as const;

interface SchemaObject {
  name: string;
  type: "table" | "view";
}

interface SchemaColumn {
  name: string;
  type: string;
  notnull: boolean;
  pk: boolean;
  defaultValue: string | null;
}

interface SchemaIndex {
  name: string;
  unique: boolean;
  columns: string[];
  sql: string;
}

interface SchemaForeignKey {
  from: string;
  table: string;
  to: string;
  onUpdate: string;
  onDelete: string;
}

interface SchemaTrigger {
  name: string;
  sql: string;
}

interface SchemaDetails {
  columns: SchemaColumn[];
  indexes: SchemaIndex[];
  foreignKeys: SchemaForeignKey[];
  triggers: SchemaTrigger[];
  ddl: string;
}

interface PageState {
  sql: string;
  total: number;
}

interface BrowseInfo {
  table: string;
  pkColumns: string[];
  usesRowid: boolean;
  editable: boolean;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Uint8Array) return `<BLOB ${value.byteLength} B>`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
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

function csvValue(value: unknown): string {
  const text = formatCell(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function quoteName(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function splitSqlStatements(sql: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let index = 0;
  while (index < sql.length) {
    const char = sql[index];
    if (char === "'" || char === '"' || char === "`") {
      const quote = char;
      index += 1;
      while (index < sql.length) {
        if (sql[index] === quote) {
          if (sql[index + 1] === quote) {
            index += 2;
            continue;
          }
          index += 1;
          break;
        }
        index += 1;
      }
      continue;
    }
    if (char === "[") {
      index += 1;
      while (index < sql.length && sql[index] !== "]") index += 1;
      index += 1;
      continue;
    }
    if (char === "-" && sql[index + 1] === "-") {
      index += 2;
      while (index < sql.length && sql[index] !== "\n") index += 1;
      continue;
    }
    if (char === "/" && sql[index + 1] === "*") {
      index += 2;
      while (index < sql.length && !(sql[index] === "*" && sql[index + 1] === "/")) index += 1;
      index += 2;
      continue;
    }
    if (char === ";") {
      const part = sql.slice(start, index).trim();
      if (part) parts.push(part);
      start = index + 1;
    }
    index += 1;
  }
  const tail = sql.slice(start).trim();
  if (tail) parts.push(tail);
  return parts;
}

function isReadStatement(sql: string): boolean {
  return /^(SELECT|WITH|VALUES)\b/i.test(sql);
}

export default function SqliteSession({
  api,
  initialPath,
  initialName,
  history,
  favorites,
  onRecordHistory,
  onClearHistory,
  onToggleFavorite,
  onRemoveFavorite,
  onTxChange,
  onExportChange,
}: SqliteSessionProps) {
  const [locale, setLocale] = React.useState<PluginLocale>(api.locale);
  const [fileName, setFileName] = React.useState("");
  const [dbPath, setDbPath] = React.useState("");
  const [readOnly, setReadOnly] = React.useState(true);
  const [objects, setObjects] = React.useState<SchemaObject[]>([]);
  const [details, setDetails] = React.useState<Record<string, SchemaDetails>>({});
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [schemaSearch, setSchemaSearch] = React.useState("");
  const [sidebarTab, setSidebarTab] = React.useState<"schema" | "history" | "favorites">("schema");
  const [ddlCopied, setDdlCopied] = React.useState("");
  const [selected, setSelected] = React.useState("");
  const [activeTable, setActiveTable] = React.useState("");
  const [filterColumns, setFilterColumns] = React.useState<string[]>([]);
  const [filterColumn, setFilterColumn] = React.useState("");
  const [filterOp, setFilterOp] = React.useState("contains");
  const [filterValue, setFilterValue] = React.useState("");
  const [query, setQuery] = React.useState("SELECT 1;");
  const [columns, setColumns] = React.useState<string[]>([]);
  const [rows, setRows] = React.useState<unknown[][]>([]);
  const [totalRows, setTotalRows] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);
  const [paginated, setPaginated] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState("");
  const [error, setError] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [pathCopied, setPathCopied] = React.useState(false);
  const [dirty, setDirty] = React.useState<Record<string, string>>({});
  const [newRow, setNewRow] = React.useState<Record<string, string> | null>(null);
  const [txActive, setTxActive] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [completionSchema, setCompletionSchema] = React.useState<Record<string, string[]>>({});
  const dbRef = React.useRef<any>(null);
  const pagedRef = React.useRef<PageState | null>(null);
  const browseRef = React.useRef<BrowseInfo | null>(null);
  const rowIdentitiesRef = React.useRef<unknown[][]>([]);
  const txActiveRef = React.useRef(false);
  const editorRef = React.useRef<SqlEditorHandle | null>(null);
  const copy = messages[locale];

  React.useEffect(() => api.onLocaleChange(setLocale), [api]);
  React.useEffect(
    () => () => {
      try {
        if (txActiveRef.current) dbRef.current?.exec("ROLLBACK");
        dbRef.current?.close();
      } catch {}
    },
    [],
  );

  const refreshCompletions = (database: any) => {
    try {
      const rows = database
        .prepare("SELECT name FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY name LIMIT 200;")
        .all();
      const map: Record<string, string[]> = {};
      for (const row of rows) {
        const name = String(row.name);
        try {
          map[name] = database
            .prepare(`PRAGMA table_info(${quoteName(name)})`)
            .all()
            .map((column: { name: unknown }) => String(column.name));
        } catch {
          map[name] = [];
        }
      }
      setCompletionSchema(map);
    } catch {
      setCompletionSchema({});
    }
  };

  const refreshSchema = (database: any) => {
    try {
      const result = database
        .prepare("SELECT name, type FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY name;")
        .all();
      const next = result.map((row: { name: unknown; type: unknown }) => ({
        name: String(row.name),
        type: (row.type === "view" ? "view" : "table") as SchemaObject["type"],
      }));
      setObjects(next);
      setSelected((current) => (next.some((object) => object.name === current) ? current : ""));
      setDetails({});
      setExpanded({});
      setSchemaSearch("");
      refreshCompletions(database);
    } catch {
      setObjects([]);
      setCompletionSchema({});
    }
  };

  const quoteIdentifier = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const loadSchemaDetails = (name: string) => {
    const database = dbRef.current;
    if (!database) return;
    try {
      const columnRows = database.prepare(`PRAGMA table_info(${quoteIdentifier(name)})`).all();
      const indexRows = database.prepare(`PRAGMA index_list(${quoteIdentifier(name)})`).all();
      const foreignRows = database.prepare(`PRAGMA foreign_key_list(${quoteIdentifier(name)})`).all();
      const triggerRows = database
        .prepare("SELECT name, sql FROM sqlite_master WHERE type = 'trigger' AND tbl_name = ? ORDER BY name")
        .all(name);
      const ddlRow = database
        .prepare("SELECT sql FROM sqlite_master WHERE type IN ('table','view') AND name = ?")
        .get(name);
      const next: SchemaDetails = {
        columns: columnRows.map((row: Record<string, unknown>) => ({
          name: String(row.name),
          type: String(row.type || ""),
          notnull: Boolean(row.notnull),
          pk: Boolean(row.pk),
          defaultValue: row.dflt_value === null || row.dflt_value === undefined ? null : String(row.dflt_value),
        })),
        indexes: indexRows.map((row: Record<string, unknown>) => {
          const indexName = String(row.name);
          const indexColumns = database
            .prepare(`PRAGMA index_info(${quoteIdentifier(indexName)})`)
            .all()
            .map((column: Record<string, unknown>) => String(column.name));
          const sqlRow = database
            .prepare("SELECT sql FROM sqlite_master WHERE type = 'index' AND name = ?")
            .get(indexName);
          return {
            name: indexName,
            unique: Boolean(row.unique),
            columns: indexColumns,
            sql: sqlRow?.sql ? String(sqlRow.sql) : "",
          };
        }),
        foreignKeys: foreignRows.map((row: Record<string, unknown>) => ({
          from: String(row.from),
          table: String(row.table),
          to: String(row.to || ""),
          onUpdate: String(row.on_update || ""),
          onDelete: String(row.on_delete || ""),
        })),
        triggers: triggerRows.map((row: Record<string, unknown>) => ({
          name: String(row.name),
          sql: String(row.sql || ""),
        })),
        ddl: ddlRow?.sql ? String(ddlRow.sql) : "",
      };
      setDetails((current) => ({ ...current, [name]: next }));
    } catch (reason) {
      setDetails((current) => ({
        ...current,
        [name]: { columns: [], indexes: [], foreignKeys: [], triggers: [], ddl: "" },
      }));
      setError(`${copy.queryError}: ${reason instanceof Error ? reason.message : String(reason)}`);
    }
  };

  const toggleObject = (name: string) => {
    setExpanded((current) => {
      const open = !current[name];
      if (open && !details[name]) void loadSchemaDetails(name);
      return { ...current, [name]: open };
    });
  };

  const loadFilterColumns = (name: string) => {
    const database = dbRef.current;
    if (!database) return;
    try {
      const columnRows = database.prepare(`PRAGMA table_info(${quoteIdentifier(name)})`).all();
      const names = columnRows.map((row: Record<string, unknown>) => String(row.name));
      setFilterColumns(names);
      setFilterColumn(names[0] || "");
    } catch {
      setFilterColumns([]);
      setFilterColumn("");
    }
  };

  const setTransaction = (active: boolean) => {
    txActiveRef.current = active;
    setTxActive(active);
    onTxChange(active);
  };

  const prepareBrowse = (table: string, type: SchemaObject["type"]) => {
    const database = dbRef.current;
    browseRef.current = null;
    rowIdentitiesRef.current = [];
    if (!database || type === "view") return null;
    try {
      const columns = database.prepare(`PRAGMA table_info(${quoteIdentifier(table)})`).all();
      const pkColumns = columns
        .filter((row: Record<string, unknown>) => Number(row.pk) > 0)
        .sort((left: Record<string, unknown>, right: Record<string, unknown>) => Number(left.pk) - Number(right.pk))
        .map((row: Record<string, unknown>) => String(row.name));
      let usesRowid = false;
      let editable = true;
      if (pkColumns.length === 0) {
        try {
          database.prepare(`SELECT rowid FROM ${quoteIdentifier(table)} LIMIT 0`);
          usesRowid = true;
        } catch {
          editable = false;
        }
      }
      browseRef.current = { table, pkColumns, usesRowid, editable };
      return browseRef.current;
    } catch {
      browseRef.current = { table, pkColumns: [], usesRowid: false, editable: false };
      return browseRef.current;
    }
  };

  const browseSelect = (table: string, where = "") => {
    const info = browseRef.current;
    const prefix = info?.usesRowid && info.editable ? 'rowid AS "__bt_rowid", ' : "";
    return `SELECT ${prefix}* FROM ${quoteIdentifier(table)}${where ? ` WHERE ${where}` : ""}`;
  };

  const executeStatement = async (
    database: any,
    rawStatement: string,
    targetPage = 0,
    recount = true,
    size = pageSize,
  ) => {
    if (!database) return null;
    const statement = rawStatement.trim().replace(/;+\s*$/, "").trim();
    if (!statement) {
      setError(copy.queryEmpty);
      return null;
    }
    setBusy(true);
    setError("");
    setStatus("");
    await new Promise((resolve) => setTimeout(resolve, 0));
    const started = performance.now();
    try {
      if (isReadStatement(statement)) {
        let total = pagedRef.current?.sql === statement ? pagedRef.current.total : 0;
        if (recount || pagedRef.current?.sql !== statement) {
          const countStatement = database.prepare(`SELECT COUNT(*) AS total FROM (${statement})`);
          countStatement.setReadBigInts?.(true);
          const counted = countStatement.get();
          total = Number(counted?.total ?? 0);
        }
        const pageStatement = database.prepare(`SELECT * FROM (${statement}) LIMIT ? OFFSET ?`);
        pageStatement.setReadBigInts?.(true);
        const pageRows = pageStatement.all(size, targetPage * size);
        const nextColumns = pageStatement.columns().map((column: { name: string }) => column.name);
        const visibleColumns = nextColumns.filter((column: string) => column !== "__bt_rowid");
        const info = browseRef.current;
        rowIdentitiesRef.current =
          info?.editable
            ? pageRows.map((row: Record<string, unknown>) =>
                info.usesRowid ? [row.__bt_rowid] : info.pkColumns.map((column) => row[column]),
              )
            : [];
        setColumns(visibleColumns);
        setRows(pageRows.map((row: Record<string, unknown>) => visibleColumns.map((column: string) => row[column])));
        setTotalRows(total);
        setPage(targetPage);
        setPaginated(true);
        pagedRef.current = { sql: statement, total };
        const elapsed = ((performance.now() - started) / 1000).toFixed(2);
        setStatus(`${total} ${copy.rows} · ${visibleColumns.length} ${copy.columns} · ${elapsed}s`);
        return { rows: total, elapsedMs: performance.now() - started };
      } else if (/^(PRAGMA|EXPLAIN)\b/i.test(statement)) {
        const result = database.prepare(statement);
        result.setReadBigInts?.(true);
        const data = result.all();
        const nextColumns = result.columns().map((column: { name: string }) => column.name);
        setColumns(nextColumns);
        setRows(data.map((row: Record<string, unknown>) => nextColumns.map((column: string) => row[column])));
        setTotalRows(data.length);
        setPage(0);
        setPaginated(false);
        pagedRef.current = null;
        setStatus(`${data.length} ${copy.rows} · ${((performance.now() - started) / 1000).toFixed(2)}s`);
        return { rows: data.length, elapsedMs: performance.now() - started };
      } else {
        database.exec(statement);
        setColumns([]);
        setRows([]);
        setTotalRows(0);
        setPage(0);
        setPaginated(false);
        pagedRef.current = null;
        refreshSchema(database);
        setStatus(`${copy.executed} · ${copy.schemaRefresh}`);
        return { rows: 0, elapsedMs: performance.now() - started };
      }
    } catch (reason) {
      setColumns([]);
      setRows([]);
      setTotalRows(0);
      setPaginated(false);
      pagedRef.current = null;
      setError(`${copy.queryError}: ${reason instanceof Error ? reason.message : String(reason)}`);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const runExplicit = async (raw: string, explain = false) => {
    const statement = raw.trim().replace(/;+\s*$/, "").trim();
    if (!statement) {
      setError(copy.queryEmpty);
      return;
    }
    browseRef.current = null;
    rowIdentitiesRef.current = [];
    setDirty({});
    setNewRow(null);
    const result = await executeStatement(
      dbRef.current,
      explain ? `EXPLAIN QUERY PLAN ${statement}` : statement,
      0,
      true,
    );
    if (result) {
      onRecordHistory({
        sql: statement,
        dbName: fileName,
        dbPath,
        rows: result.rows,
        durationMs: result.elapsedMs,
      });
    }
  };

  const runStatements = async (raw: string, explain = false) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setError(copy.queryEmpty);
      return;
    }
    const parts = splitSqlStatements(trimmed);
    if (explain) {
      if (parts.length > 1) {
        setError(copy.explainSingle);
        return;
      }
      await runExplicit(trimmed, true);
      return;
    }
    if (parts.length <= 1) {
      await runExplicit(trimmed, false);
      return;
    }
    browseRef.current = null;
    rowIdentitiesRef.current = [];
    setDirty({});
    setNewRow(null);
    let executed = 0;
    let rows = 0;
    let elapsedMs = 0;
    for (const part of parts) {
      const result = await executeStatement(dbRef.current, part, 0, true);
      if (!result) break;
      executed += 1;
      rows = result.rows;
      elapsedMs += result.elapsedMs;
    }
    if (executed > 0) {
      onRecordHistory({ sql: trimmed, dbName: fileName, dbPath, rows, durationMs: elapsedMs });
      setStatus(`${copy.executed} · ${copy.statementsExecuted} ${executed}`);
    }
  };

  const currentSql = () => editorRef.current?.getExecutableSql() ?? query;
  const setQueryValue = (value: string) => {
    setQuery(value);
    editorRef.current?.setValue(value);
  };

  const openDatabase = async (path: string, name: string, readonly: boolean) => {
    setBusy(true);
    setError("");
    try {
      const { DatabaseSync } = (window as unknown as { require: (name: string) => any }).require("node:sqlite");
      const database = new DatabaseSync(path, { readOnly: readonly });
      try {
        database.exec("PRAGMA busy_timeout = 5000");
      } catch {}
      try {
        dbRef.current?.close();
      } catch {}
      dbRef.current = database;
      setFileName(name);
      setDbPath(path);
      setReadOnly(readonly);
      setActiveTable("");
      setFilterColumns([]);
      setFilterColumn("");
      setFilterValue("");
      setFilterOp("contains");
      browseRef.current = null;
      rowIdentitiesRef.current = [];
      setDirty({});
      setNewRow(null);
      txActiveRef.current = false;
      setTxActive(false);
      onTxChange(false);
      refreshSchema(database);
      setQueryValue(DEFAULT_QUERY);
      await executeStatement(database, DEFAULT_QUERY, 0, true);
    } catch (reason) {
      setError(`${copy.loadFailed}: ${reason instanceof Error ? reason.message : String(reason)}`);
    } finally {
      setBusy(false);
    }
  };

  React.useEffect(() => {
    if (initialPath) void openDatabase(initialPath, initialName, true);
  }, [initialPath, initialName]);

  const reopen = async (readonly: boolean) => {
    if (!dbPath) return;
    await openDatabase(dbPath, fileName, readonly);
  };

  const goPage = (target: number) => {
    const state = pagedRef.current;
    if (!state || !dbRef.current) return;
    const totalPages = Math.max(1, Math.ceil(state.total / pageSize));
    const next = Math.max(0, Math.min(totalPages - 1, target));
    if (next === page) return;
    setDirty({});
    setNewRow(null);
    void executeStatement(dbRef.current, state.sql, next, false);
  };

  const changePageSize = (nextSize: number) => {
    setPageSize(nextSize);
    setDirty({});
    setNewRow(null);
    const state = pagedRef.current;
    if (state && dbRef.current) {
      void executeStatement(dbRef.current, state.sql, 0, false, nextSize);
    }
  };

  const selectTable = (name: string) => {
    setSelected(name);
    setActiveTable(name);
    setFilterValue("");
    setFilterOp("contains");
    loadFilterColumns(name);
    const object = objects.find((item) => item.name === name);
    prepareBrowse(name, object?.type || "table");
    setDirty({});
    setNewRow(null);
    const statement = browseSelect(name);
    setQueryValue(statement);
    void executeStatement(dbRef.current, statement);
  };

  const quoteLiteral = (value: string) => `'${value.replace(/'/g, "''")}'`;

  const applyFilter = () => {
    if (!dbRef.current || !activeTable || !filterColumn) return;
    if (!browseRef.current) {
      const object = objects.find((item) => item.name === activeTable);
      prepareBrowse(activeTable, object?.type || "table");
    }
    const needsValue = filterOp !== "isnull" && filterOp !== "notnull";
    if (needsValue && !filterValue.trim()) return;
    const column = quoteIdentifier(filterColumn);
    let condition = "";
    if (filterOp === "isnull") condition = `${column} IS NULL`;
    else if (filterOp === "notnull") condition = `${column} IS NOT NULL`;
    else if (filterOp === "contains") condition = `${column} LIKE ${quoteLiteral(`%${filterValue}%`)}`;
    else {
      const operators: Record<string, string> = {
        eq: "=",
        neq: "!=",
        gt: ">",
        gte: ">=",
        lt: "<",
        lte: "<=",
      };
      const trimmed = filterValue.trim();
      const numeric = /^-?\d+(?:\.\d+)?$/.test(trimmed);
      condition = `${column} ${operators[filterOp] || "="} ${numeric ? trimmed : quoteLiteral(trimmed)}`;
    }
    const statement = browseSelect(activeTable, condition);
    setQueryValue(statement);
    setDirty({});
    setNewRow(null);
    void executeStatement(dbRef.current, statement);
  };

  const clearFilter = () => {
    if (!dbRef.current || !activeTable) return;
    setFilterValue("");
    setDirty({});
    setNewRow(null);
    const statement = browseSelect(activeTable);
    setQueryValue(statement);
    void executeStatement(dbRef.current, statement);
  };

  const copyDdl = async (name: string, ddl: string) => {
    if (!ddl) return;
    try {
      await navigator.clipboard.writeText(ddl);
      setDdlCopied(name);
      setTimeout(() => setDdlCopied(""), 1200);
    } catch {}
  };

  const refreshAfterWrite = async (recount: boolean) => {
    const database = dbRef.current;
    const sql = pagedRef.current?.sql;
    if (!database || !sql) return;
    const result = await executeStatement(database, sql, page, recount);
    if (result) {
      const maxPage = Math.max(0, Math.ceil(result.rows / pageSize) - 1);
      if (page > maxPage) {
        await executeStatement(database, sql, maxPage, false);
      }
    }
  };

  const saveEdits = async () => {
    const database = dbRef.current;
    const info = browseRef.current;
    if (!database || !info?.editable || readOnly) return;
    const inserting = Boolean(newRow);
    setBusy(true);
    setError("");
    try {
      for (const [key, value] of Object.entries(dirty)) {
        const separator = key.indexOf("\u0000");
        const rowIndex = Number(key.slice(0, separator));
        const column = key.slice(separator + 1);
        const identity = rowIdentitiesRef.current[rowIndex];
        if (!identity) throw new Error(copy.editConflict);
        const where = info.usesRowid
          ? "rowid IS ?"
          : info.pkColumns.map((name) => `${quoteIdentifier(name)} IS ?`).join(" AND ");
        const statement = database.prepare(
          `UPDATE ${quoteIdentifier(info.table)} SET ${quoteIdentifier(column)} = ? WHERE ${where}`,
        );
        const result = statement.run(value, ...identity);
        if (Number(result.changes) === 0) throw new Error(copy.editConflict);
      }
      if (newRow) {
        const entries = Object.entries(newRow).filter(([, value]) => value !== "");
        if (entries.length === 0) {
          database.exec(`INSERT INTO ${quoteIdentifier(info.table)} DEFAULT VALUES`);
        } else {
          const statement = database.prepare(
            `INSERT INTO ${quoteIdentifier(info.table)} (${entries.map(([column]) => quoteIdentifier(column)).join(", ")}) VALUES (${entries.map(() => "?").join(", ")})`,
          );
          statement.run(...entries.map(([, value]) => value));
        }
      }
      setDirty({});
      setNewRow(null);
      await refreshAfterWrite(inserting);
      setStatus(copy.editSaveDone || copy.editSave);
    } catch (reason) {
      setError(`${copy.queryError}: ${reason instanceof Error ? reason.message : String(reason)}`);
    } finally {
      setBusy(false);
    }
  };

  const deleteRow = async (rowIndex: number) => {
    const database = dbRef.current;
    const info = browseRef.current;
    if (!database || !info?.editable || readOnly) return;
    if (!window.confirm(copy.editConfirmDelete)) return;
    const identity = rowIdentitiesRef.current[rowIndex];
    if (!identity) return;
    setBusy(true);
    setError("");
    try {
      const where = info.usesRowid
        ? "rowid IS ?"
        : info.pkColumns.map((name) => `${quoteIdentifier(name)} IS ?`).join(" AND ");
      const result = database
        .prepare(`DELETE FROM ${quoteIdentifier(info.table)} WHERE ${where}`)
        .run(...identity);
      if (Number(result.changes) === 0) throw new Error(copy.editConflict);
      setDirty({});
      setNewRow(null);
      await refreshAfterWrite(true);
      setStatus(copy.editDeleted || copy.editDelete);
    } catch (reason) {
      setError(`${copy.queryError}: ${reason instanceof Error ? reason.message : String(reason)}`);
    } finally {
      setBusy(false);
    }
  };

  const beginTransaction = () => {
    const database = dbRef.current;
    if (!database || readOnly || txActive) return;
    try {
      database.exec("BEGIN");
      setTransaction(true);
      setStatus(copy.txStarted);
    } catch (reason) {
      setError(`${copy.queryError}: ${reason instanceof Error ? reason.message : String(reason)}`);
    }
  };

  const finishTransaction = async (action: "commit" | "rollback") => {
    const database = dbRef.current;
    if (!database || !txActive) return;
    try {
      database.exec(action === "commit" ? "COMMIT" : "ROLLBACK");
      setTransaction(false);
      setDirty({});
      setNewRow(null);
      await refreshAfterWrite(true);
      setStatus(action === "commit" ? copy.txCommitted : copy.txRolledBack);
    } catch (reason) {
      setError(`${copy.queryError}: ${reason instanceof Error ? reason.message : String(reason)}`);
    }
  };

  const pageText = () => {
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    const start = totalRows === 0 ? 0 : page * pageSize + 1;
    const end = Math.min(totalRows, page * pageSize + rows.length);
    return `${start}-${end} / ${totalRows} · ${copy.page} ${page + 1} / ${totalPages}`;
  };

  const exportCsv = () => {
    if (columns.length === 0) return;
    const escape = (value: unknown) => {
      const text = formatCell(value);
      return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const csv = [columns, ...rows].map((row) => row.map(escape).join(",")).join("\n");
    download(new Blob([csv], { type: "text/csv;charset=utf-8" }), "sqlite-page.csv");
  };

  const exportAll = async () => {
    const database = dbRef.current;
    if (!database || busy || exporting) return;
    const nodeFs = (window as unknown as { require: (name: string) => any }).require("node:fs");
    const nodeOs = (window as unknown as { require: (name: string) => any }).require("node:os");
    const nodePath = (window as unknown as { require: (name: string) => any }).require("node:path");
    const downloads = nodePath.join(nodeOs.homedir(), "Downloads");
    const targetDir = nodeFs.existsSync(downloads) ? downloads : nodeOs.homedir();
    const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
    const base = (fileName.replace(/\.[^.]+$/, "") || "sqlite").replace(/[^\w.-]+/g, "_") + `-${stamp}`;
    let target = "";
    let handle: any = null;
    setBusy(true);
    setExporting(true);
    onExportChange(true);
    setError("");
    try {
      for (let suffix = 1; suffix < 1000; suffix += 1) {
        target = nodePath.join(targetDir, `${base}${suffix === 1 ? "" : `-${suffix}`}.csv`);
        try {
          handle = await nodeFs.promises.open(target, "wx");
          break;
        } catch (reason) {
          if (reason?.code !== "EEXIST") throw reason;
        }
      }
      if (!handle) throw new Error(copy.exportFailed);

      const sql = pagedRef.current?.sql;
      let exportColumns = columns;
      let iterator: Iterable<Record<string, unknown>> | null = null;
      if (sql && isReadStatement(sql)) {
        const statement = database.prepare(sql);
        statement.setReadBigInts?.(true);
        exportColumns = statement.columns().map((column: { name: string }) => column.name).filter((name: string) => name !== "__bt_rowid");
        iterator = statement.iterate();
      }
      await handle.write("\ufeff" + exportColumns.map(csvValue).join(",") + "\n");
      let count = 0;
      let lines: string[] = [];
      const flush = async () => {
        if (lines.length === 0) return;
        await handle.write(lines.join("\n") + "\n");
        lines = [];
        if (count % 5000 === 0) {
          setStatus(`${copy.exporting} ${count} ${copy.rows}`);
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      };
      if (iterator) {
        for (const row of iterator) {
          lines.push(exportColumns.map((column) => csvValue(row[column])).join(","));
          count += 1;
          if (lines.length >= 500) await flush();
        }
      } else {
        for (const row of rows) {
          lines.push(row.map(csvValue).join(","));
          count += 1;
          if (lines.length >= 500) await flush();
        }
      }
      await flush();
      await handle.close();
      handle = null;
      setStatus(`${copy.exportedTo} ${target} · ${count} ${copy.rows}`);
    } catch (reason) {
      try {
        await handle?.close();
      } catch {}
      try {
        if (target) nodeFs.unlinkSync(target);
      } catch {}
      setError(`${copy.exportFailed}: ${reason instanceof Error ? reason.message : String(reason)}`);
    } finally {
      setExporting(false);
      setBusy(false);
      onExportChange(false);
    }
  };

  const download = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copyPage = async () => {
    if (columns.length === 0) return;
    const text = [columns.join("\t"), ...rows.map((row) => row.map(formatCell).join("\t"))].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  const copyPath = async () => {
    try {
      await navigator.clipboard.writeText(dbPath);
      setPathCopied(true);
      setTimeout(() => setPathCopied(false), 1200);
    } catch {}
  };

  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const visibleObjects = objects.filter((object) =>
    object.name.toLowerCase().includes(schemaSearch.trim().toLowerCase()),
  );
  const favoriteActive = favorites.some((item) => item.sql === query.trim());
  const browse = browseRef.current;
  const canEdit = Boolean(browse?.editable) && !readOnly;
  const identityColumns = new Set(browse && !browse.usesRowid ? browse.pkColumns : []);
  const dirtyCount = Object.keys(dirty).length + (newRow ? 1 : 0);

  return (
    <div className="btp-sqlite">
      {!dbPath ? (
        <div className="btp-sqlite-empty">
          <span>{error || copy.empty}</span>
        </div>
      ) : (
        <div className="btp-sqlite-body">
          <aside className="btp-sqlite-schema">
            <div className="btp-sqlite-sidebar-tabs">
              {([
                ["schema", copy.structure],
                ["history", copy.history],
                ["favorites", copy.favorites],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={sidebarTab === value ? "active" : ""}
                  onClick={() => setSidebarTab(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            {sidebarTab === "schema" && (
              <>
            <div className="btp-sqlite-schema-head">
              <span className="btp-sqlite-section-title">{copy.schema}</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const database = dbRef.current;
                  if (database) refreshSchema(database);
                }}
              >
                {copy.refresh}
              </button>
            </div>
            <input
              className="btp-sqlite-schema-search"
              value={schemaSearch}
              placeholder={copy.schemaSearch}
              onChange={(event) => setSchemaSearch(event.target.value)}
            />
            {visibleObjects.length === 0 ? (
              <span className="btp-sqlite-muted">{schemaSearch ? copy.noMatch : copy.noTables}</span>
            ) : (
              visibleObjects.map((object) => {
                const isOpen = Boolean(expanded[object.name]);
                const detail = details[object.name];
                return (
                  <div className="btp-sqlite-object" key={object.name}>
                    <div className="btp-sqlite-object-row">
                      <button
                        type="button"
                        className="btp-sqlite-object-toggle"
                        aria-expanded={isOpen}
                        title={isOpen ? copy.collapse : copy.expand}
                        onClick={() => toggleObject(object.name)}
                      >
                        {isOpen ? "▾" : "▸"}
                      </button>
                      <button
                        type="button"
                        className={`btp-sqlite-object-name ${selected === object.name ? "active" : ""}`}
                        title={object.name}
                        onClick={() => selectTable(object.name)}
                      >
                        {object.name}
                      </button>
                      <span className="btp-sqlite-object-type">
                        {object.type === "view" ? copy.viewLabel : copy.tableLabel}
                      </span>
                    </div>
                    {isOpen &&
                      (detail ? (
                        <div className="btp-sqlite-object-details">
                          <section>
                            <h4>{copy.columns} ({detail.columns.length})</h4>
                            {detail.columns.map((column) => (
                              <div className="btp-sqlite-column" key={column.name}>
                                <span className="btp-sqlite-column-name">{column.name}</span>
                                <span className="btp-sqlite-column-type">{column.type || "—"}</span>
                                <span className="btp-sqlite-column-flags">
                                  {column.pk && <em>{copy.primaryKey}</em>}
                                  {column.notnull && <em>{copy.notNull}</em>}
                                  {column.defaultValue !== null && <em>{copy.default} {column.defaultValue}</em>}
                                </span>
                              </div>
                            ))}
                          </section>
                          <section>
                            <h4>{copy.indexes} ({detail.indexes.length})</h4>
                            {detail.indexes.length === 0 ? (
                              <span className="btp-sqlite-muted">{copy.noIndexes}</span>
                            ) : (
                              detail.indexes.map((index) => (
                                <div className="btp-sqlite-index" key={index.name} title={index.sql}>
                                  <span>{index.name}</span>
                                  {index.unique && <em>{copy.unique}</em>}
                                  <span className="btp-sqlite-index-columns">{index.columns.join(", ")}</span>
                                </div>
                              ))
                            )}
                          </section>
                          <section>
                            <h4>{copy.foreignKeys} ({detail.foreignKeys.length})</h4>
                            {detail.foreignKeys.length === 0 ? (
                              <span className="btp-sqlite-muted">{copy.noForeignKeys}</span>
                            ) : (
                              detail.foreignKeys.map((foreign, index) => (
                                <div className="btp-sqlite-foreign" key={`${foreign.from}-${index}`}>
                                  <span>{foreign.from} → {foreign.table}{foreign.to ? `.${foreign.to}` : ""}</span>
                                  <span className="btp-sqlite-foreign-actions">
                                    {copy.onUpdate}: {foreign.onUpdate} · {copy.onDelete}: {foreign.onDelete}
                                  </span>
                                </div>
                              ))
                            )}
                          </section>
                          <section>
                            <h4>{copy.triggers} ({detail.triggers.length})</h4>
                            {detail.triggers.length === 0 ? (
                              <span className="btp-sqlite-muted">{copy.noTriggers}</span>
                            ) : (
                              detail.triggers.map((trigger) => (
                                <div className="btp-sqlite-trigger" key={trigger.name} title={trigger.sql}>
                                  {trigger.name}
                                </div>
                              ))
                            )}
                          </section>
                          <section>
                            <div className="btp-sqlite-ddl-head">
                              <h4>{copy.ddl}</h4>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => void copyDdl(object.name, detail.ddl)}
                                disabled={!detail.ddl}
                              >
                                {ddlCopied === object.name ? copy.ddlCopied : copy.copyDdl}
                              </button>
                            </div>
                            <pre className="btp-sqlite-ddl">{detail.ddl || "—"}</pre>
                          </section>
                        </div>
                      ) : (
                        <div className="btp-sqlite-schema-loading">{copy.loadingSchema}</div>
                      ))}
                  </div>
                );
              })
            )}
              </>
            )}
            {sidebarTab === "history" && (
              <div className="btp-sqlite-sidebar-list">
                <div className="btp-sqlite-sidebar-list-head">
                  <span>{copy.history}</span>
                  {history.length > 0 && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={onClearHistory}>
                      {copy.clearHistory}
                    </button>
                  )}
                </div>
                {history.length === 0 ? (
                  <span className="btp-sqlite-muted">{copy.historyEmpty}</span>
                ) : (
                  history.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      className="btp-sqlite-history-item"
                      title={entry.sql}
                      onClick={() => setQueryValue(entry.sql)}
                    >
                      <code>{entry.sql.replace(/\s+/g, " ").slice(0, 140)}</code>
                      <span className="btp-sqlite-history-meta">
                        {entry.dbName} · {formatTime(entry.at, locale)} · {entry.rows} {copy.rows} · {Math.round(entry.durationMs)}ms
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
            {sidebarTab === "favorites" && (
              <div className="btp-sqlite-sidebar-list">
                <div className="btp-sqlite-sidebar-list-head">
                  <span>{copy.favorites}</span>
                </div>
                {favorites.length === 0 ? (
                  <span className="btp-sqlite-muted">{copy.favoritesEmpty}</span>
                ) : (
                  favorites.map((item) => (
                    <div className="btp-sqlite-favorite-item" key={item.id}>
                      <button
                        type="button"
                        className="btp-sqlite-favorite-main"
                        title={item.sql}
                        onClick={() => setQueryValue(item.sql)}
                      >
                        <code>{item.sql.replace(/\s+/g, " ").slice(0, 140)}</code>
                        <span className="btp-sqlite-history-meta">
                          {item.dbName} · {formatTime(item.createdAt, locale)}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="btp-sqlite-favorite-remove"
                        title={copy.removeFavorite}
                        onClick={() => onRemoveFavorite(item.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
            <div className="btp-sqlite-file">
              <span>{fileName}</span>
              <span className="btp-sqlite-path">{dbPath}</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => void copyPath()}>
                {pathCopied ? copy.copiedPath : copy.copyPath}
              </button>
            </div>
          </aside>
          <section className="btp-sqlite-main">
            <div className="btp-sqlite-query">
              <span>{copy.query}</span>
              <SqlEditor
                ref={editorRef}
                value={query}
                schema={completionSchema}
                placeholder={copy.queryPlaceholder}
                onChange={setQuery}
                onRun={(statement) => void runStatements(statement)}
              />
            </div>
            <div className="btp-sqlite-toolbar">
              <label className="btp-sqlite-mode">
                <input
                  type="checkbox"
                  checked={readOnly}
                  onChange={(event) => {
                    if (txActive) {
                      setError(copy.txActive);
                      return;
                    }
                    const next = event.target.checked;
                    setReadOnly(next);
                    void reopen(next);
                  }}
                  disabled={!dbPath || busy || txActive}
                />
                <span>{copy.readOnly}</span>
              </label>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void runStatements(currentSql())}
                disabled={busy}
              >
                {busy ? copy.running : copy.run}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void runStatements(currentSql(), true)}
                disabled={busy || !query.trim()}
              >
                {copy.explain}
              </button>
              <button
                type="button"
                className="btn btn-secondary btp-sqlite-favorite"
                title={favoriteActive ? copy.unfavorite : copy.favorite}
                aria-label={favoriteActive ? copy.unfavorite : copy.favorite}
                onClick={() => onToggleFavorite(query, fileName)}
                disabled={!query.trim()}
              >
                {favoriteActive ? "★" : "☆"}
              </button>
              {!readOnly && (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setNewRow({})}
                    disabled={!canEdit || busy}
                  >
                    {copy.editAddRow}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => void saveEdits()}
                    disabled={!canEdit || busy || dirtyCount === 0}
                  >
                    {copy.editSave}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setDirty({});
                      setNewRow(null);
                    }}
                    disabled={dirtyCount === 0}
                  >
                    {copy.editCancel}
                  </button>
                  <span className="btp-sqlite-tx-group">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={beginTransaction}
                      disabled={txActive || busy}
                    >
                      {copy.txBegin}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => void finishTransaction("commit")}
                      disabled={!txActive || busy}
                    >
                      {copy.txCommit}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => void finishTransaction("rollback")}
                      disabled={!txActive || busy}
                    >
                      {copy.txRollback}
                    </button>
                  </span>
                  {txActive && <span className="btp-sqlite-tx-badge">{copy.txActiveLabel}</span>}
                  {activeTable && browse && !browse.editable && (
                    <span className="btp-sqlite-edit-hint">{copy.editUnsupported}</span>
                  )}
                </>
              )}
              {activeTable && browse?.editable && readOnly && (
                <span className="btp-sqlite-edit-hint">{copy.editReadOnly}</span>
              )}
              <button type="button" className="btn btn-secondary" onClick={exportCsv} disabled={columns.length === 0}>
                {copy.pageCsv}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void exportAll()}
                disabled={busy || exporting || columns.length === 0}
              >
                {exporting ? copy.exporting : copy.exportAll}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => void copyPage()} disabled={columns.length === 0}>
                {copied ? copy.copied : copy.copy}
              </button>
              <span className="btp-sqlite-status">{status}</span>
            </div>
            {activeTable && filterColumns.length > 0 && (
              <div className="btp-sqlite-filter">
                <span>{copy.quickFilter}</span>
                <select value={filterColumn} onChange={(event) => setFilterColumn(event.target.value)}>
                  {filterColumns.map((column) => (
                    <option key={column} value={column}>{column}</option>
                  ))}
                </select>
                <select value={filterOp} onChange={(event) => setFilterOp(event.target.value)}>
                  {[
                    ["contains", copy.opContains],
                    ["eq", copy.opEquals],
                    ["neq", copy.opNotEquals],
                    ["gt", copy.opGreater],
                    ["gte", copy.opGreaterEqual],
                    ["lt", copy.opLess],
                    ["lte", copy.opLessEqual],
                    ["isnull", copy.opIsNull],
                    ["notnull", copy.opNotNull],
                  ].map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <input
                  value={filterValue}
                  placeholder={copy.filterValue}
                  disabled={filterOp === "isnull" || filterOp === "notnull"}
                  onChange={(event) => setFilterValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") applyFilter();
                  }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={applyFilter}
                  disabled={busy || !filterColumn || (filterOp !== "isnull" && filterOp !== "notnull" && !filterValue.trim())}
                >
                  {copy.apply}
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilter} disabled={busy}>
                  {copy.clear}
                </button>
              </div>
            )}
            {error && <div className="btp-sqlite-error">{error}</div>}
            {columns.length > 0 && (
              <>
                <div className="btp-sqlite-results">
                  <table>
                    <thead>
                      <tr>
                        {columns.map((column) => <th key={column}>{column}</th>)}
                        {canEdit && <th className="btp-sqlite-row-actions" />}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((value, columnIndex) => {
                            const column = columns[columnIndex];
                            const key = `${rowIndex}\u0000${column}`;
                            const valueEditable = canEdit && !identityColumns.has(column) && !(value instanceof Uint8Array);
                            return (
                              <td key={columnIndex} title={formatCell(value)}>
                                {valueEditable ? (
                                  <input
                                    className="btp-sqlite-cell-input"
                                    value={dirty[key] ?? formatCell(value)}
                                    disabled={busy}
                                    onChange={(event) =>
                                      setDirty((current) => ({ ...current, [key]: event.target.value }))
                                    }
                                    onFocus={(event) => event.currentTarget.select()}
                                  />
                                ) : (
                                  formatCell(value)
                                )}
                              </td>
                            );
                          })}
                          {canEdit && (
                            <td className="btp-sqlite-row-actions">
                              <button
                                type="button"
                                className="btp-sqlite-row-delete"
                                title={copy.editDelete}
                                onClick={() => void deleteRow(rowIndex)}
                              >
                                ×
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                      {canEdit && newRow && (
                        <tr className="btp-sqlite-new-row">
                          {columns.map((column) => (
                            <td key={column}>
                              <input
                                className="btp-sqlite-cell-input"
                                value={newRow[column] ?? ""}
                                placeholder={column}
                                onChange={(event) =>
                                  setNewRow((current) => ({ ...(current || {}), [column]: event.target.value }))
                                }
                              />
                            </td>
                          ))}
                          <td className="btp-sqlite-row-actions">…</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {paginated && (
                  <div className="btp-sqlite-pager">
                    <label className="btp-sqlite-page-size">
                      <span>{copy.pageSize}</span>
                      <select value={pageSize} onChange={(event) => changePageSize(Number(event.target.value))} disabled={busy}>
                        {PAGE_SIZES.map((size) => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </label>
                    <span className="btp-sqlite-pager-info">{pageText()}</span>
                    <div className="btp-sqlite-pager-buttons">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => goPage(0)} disabled={busy || page === 0}>
                        {copy.first}
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => goPage(page - 1)} disabled={busy || page === 0}>
                        {copy.prev}
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => goPage(page + 1)} disabled={busy || page >= totalPages - 1}>
                        {copy.next}
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => goPage(totalPages - 1)} disabled={busy || page >= totalPages - 1}>
                        {copy.last}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

const STYLE_ID = "btp-sqlite-style";
export function mountStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .btp-sqlite-panel { display:flex; flex:1; min-height:0; }
    .btp-sqlite { display:flex; flex:1; flex-direction:column; gap:14px; padding:24px; min-height:0; height:100%; box-sizing:border-box; color:var(--text-primary); overflow:hidden; }
    .btp-sqlite-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
    .btp-sqlite-head h1 { margin:0; }
    .btp-sqlite-head p { margin:6px 0 0; color:var(--text-muted); font-size:13px; }
    .btp-sqlite-actions { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
    .btp-sqlite-mode { display:flex; align-items:center; gap:6px; color:var(--text-muted); font-size:12px; }
    .btp-sqlite-mode input { accent-color:rgb(var(--accent-rgb)); }
    .btp-sqlite-empty { flex:1; min-height:420px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; color:var(--text-muted); font-size:13px; border:1px dashed var(--glass-border); border-radius:var(--radius-md); }
    .btp-sqlite-body { display:grid; grid-template-columns:300px minmax(0,1fr); gap:14px; flex:1; min-height:0; overflow:hidden; }
    .btp-sqlite-schema { display:flex; min-height:0; flex-direction:column; gap:6px; padding:12px; border:1px solid var(--glass-border); border-radius:var(--radius-md); background:var(--glass-sheen), var(--glass-fill); overflow:auto; }
    .btp-sqlite-section-title, .btp-sqlite-query > span { color:var(--text-muted); font-size:12px; }
    .btp-sqlite-schema-head { display:flex; align-items:center; justify-content:space-between; gap:6px; }
    .btp-sqlite-sidebar-tabs { display:flex; gap:4px; padding-bottom:6px; border-bottom:1px solid rgba(255,255,255,.06); }
    .btp-sqlite-sidebar-tabs button { flex:1; padding:5px 6px; border:1px solid transparent; border-radius:6px; background:transparent; color:var(--text-muted); font-size:11px; cursor:pointer; }
    .btp-sqlite-sidebar-tabs button:hover { color:var(--text-primary); background:rgba(255,255,255,.05); }
    .btp-sqlite-sidebar-tabs button.active { color:var(--text-primary); background:rgba(var(--accent-rgb),.16); border-color:rgba(var(--accent-rgb),.35); }
    .btp-sqlite-sidebar-list { display:flex; min-height:0; flex-direction:column; gap:6px; overflow:auto; }
    .btp-sqlite-sidebar-list-head { display:flex; align-items:center; justify-content:space-between; gap:6px; color:var(--text-muted); font-size:11px; }
    .btp-sqlite-sidebar-list-head .btn { padding:3px 7px; font-size:10px; }
    .btp-sqlite-history-item { display:flex; flex-direction:column; gap:3px; text-align:left; padding:7px 8px; border:1px solid transparent; border-radius:7px; background:rgba(255,255,255,.025); color:var(--text-secondary); cursor:pointer; }
    .btp-sqlite-history-item:hover { border-color:rgba(var(--accent-rgb),.3); background:rgba(255,255,255,.05); }
    .btp-sqlite-history-item code, .btp-sqlite-favorite-main code { display:block; max-height:34px; overflow:hidden; color:var(--text-secondary); font:10px/1.5 var(--font-mono); overflow-wrap:anywhere; }
    .btp-sqlite-history-meta { color:var(--text-muted); font-size:9px; overflow-wrap:anywhere; }
    .btp-sqlite-favorite-item { display:flex; align-items:stretch; gap:3px; }
    .btp-sqlite-favorite-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; text-align:left; padding:7px 8px; border:1px solid transparent; border-radius:7px; background:rgba(255,255,255,.025); color:var(--text-secondary); cursor:pointer; }
    .btp-sqlite-favorite-main:hover { border-color:rgba(var(--accent-rgb),.3); background:rgba(255,255,255,.05); }
    .btp-sqlite-favorite-remove { border:none; background:transparent; color:var(--text-muted); cursor:pointer; padding:0 5px; border-radius:6px; }
    .btp-sqlite-favorite-remove:hover { color:#fca5a5; background:rgba(255,80,80,.1); }
    .btp-sqlite-favorite { min-width:34px; font-size:15px; }
    .btp-sqlite-tx-group { display:flex; gap:4px; }
    .btp-sqlite-tx-badge { padding:2px 7px; border-radius:999px; background:rgba(251,191,36,.16); color:#fbbf24; font-size:10px; }
    .btp-sqlite-edit-hint { color:var(--text-muted); font-size:11px; }
    .btp-sqlite-cell-input { width:100%; min-width:70px; box-sizing:border-box; padding:2px 4px; border:1px solid transparent; border-radius:4px; background:transparent; color:var(--text-primary); font:12px var(--font-mono); outline:none; }
    .btp-sqlite-cell-input:hover { border-color:rgba(255,255,255,.2); }
    .btp-sqlite-cell-input:focus { border-color:rgba(var(--accent-rgb),.6); background:rgba(8,10,18,.35); }
    .btp-sqlite-results th.btp-sqlite-row-actions, .btp-sqlite-results td.btp-sqlite-row-actions { width:30px; padding:2px 4px; text-align:center; }
    .btp-sqlite-row-delete { border:none; background:transparent; color:var(--text-muted); cursor:pointer; border-radius:4px; padding:2px 5px; }
    .btp-sqlite-row-delete:hover { color:#fca5a5; background:rgba(255,80,80,.12); }
    .btp-sqlite-new-row td { background:rgba(var(--accent-rgb),.06); }
    html[data-theme="glass-light"] .btp-sqlite-cell-input:focus { background:rgba(255,255,255,.75); }
    .btp-sqlite-schema-head .btn { padding:3px 8px; font-size:11px; }
    .btp-sqlite-schema-search { padding:7px 9px; border-radius:7px; border:1px solid var(--glass-border); background:rgba(8,10,18,.28); color:var(--text-primary); font-size:12px; outline:none; }
    .btp-sqlite-object { border-bottom:1px solid rgba(255,255,255,.05); padding-bottom:5px; }
    .btp-sqlite-object-row { display:flex; align-items:center; gap:3px; min-width:0; }
    .btp-sqlite-object-toggle { width:16px; flex:0 0 16px; border:none; background:none; color:var(--text-muted); cursor:pointer; font-size:11px; padding:4px 0; }
    .btp-sqlite-object-name { flex:1; min-width:0; text-align:left; padding:5px 6px; border-radius:6px; border:1px solid transparent; background:transparent; color:var(--text-secondary); font:12px var(--font-mono); cursor:pointer; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .btp-sqlite-object-name:hover { background:rgba(255,255,255,.05); color:var(--text-primary); }
    .btp-sqlite-object-name.active { background:rgba(var(--accent-rgb),.16); border-color:rgba(var(--accent-rgb),.35); color:var(--text-primary); }
    .btp-sqlite-object-type { flex:0 0 auto; color:var(--text-muted); font-size:9px; letter-spacing:.04em; }
    .btp-sqlite-object-details { margin:2px 0 8px 20px; display:flex; flex-direction:column; gap:8px; }
    .btp-sqlite-object-details section { display:flex; flex-direction:column; gap:3px; }
    .btp-sqlite-object-details h4 { margin:0; color:var(--text-muted); font-size:10px; font-weight:600; letter-spacing:.04em; text-transform:uppercase; }
    .btp-sqlite-column, .btp-sqlite-index, .btp-sqlite-foreign, .btp-sqlite-trigger { display:flex; align-items:baseline; gap:5px; flex-wrap:wrap; color:var(--text-secondary); font:11px var(--font-mono); overflow-wrap:anywhere; }
    .btp-sqlite-column-name { color:var(--text-primary); }
    .btp-sqlite-column-type { color:var(--text-muted); font-size:10px; }
    .btp-sqlite-column-flags em, .btp-sqlite-index em { font-style:normal; font-size:9px; padding:0 4px; border-radius:4px; background:rgba(var(--accent-rgb),.16); color:var(--text-secondary); }
    .btp-sqlite-index-columns, .btp-sqlite-foreign-actions { color:var(--text-muted); font-size:10px; }
    .btp-sqlite-ddl-head { display:flex; align-items:center; justify-content:space-between; gap:6px; }
    .btp-sqlite-ddl-head .btn { padding:2px 6px; font-size:10px; }
    .btp-sqlite-ddl { margin:0; max-height:150px; overflow:auto; padding:7px; border-radius:6px; background:rgba(8,10,18,.28); color:var(--text-secondary); font:10px/1.5 var(--font-mono); white-space:pre-wrap; overflow-wrap:anywhere; }
    .btp-sqlite-schema-loading { margin:2px 0 6px 20px; color:var(--text-muted); font-size:10px; }
    .btp-sqlite-muted { color:var(--text-muted); font-size:12px; }
    .btp-sqlite-file { margin-top:auto; padding-top:10px; display:flex; flex-direction:column; gap:4px; color:var(--text-muted); font-size:11px; overflow-wrap:anywhere; }
    .btp-sqlite-path { opacity:.65; font-family:var(--font-mono); }
    .btp-sqlite-file .btn { align-self:flex-start; margin-top:4px; }
    .btp-sqlite-main { display:flex; min-height:0; flex-direction:column; gap:10px; padding:14px; border:1px solid var(--glass-border); border-radius:var(--radius-md); background:var(--glass-sheen), var(--glass-fill); min-width:0; overflow:hidden; }
    .btp-sqlite-query { display:flex; flex-direction:column; gap:6px; }
    .btp-sqlite-editor { min-height:110px; max-height:220px; overflow:auto; border:1px solid var(--glass-border); border-radius:9px; background:rgba(8,10,18,.28); }
    .btp-sqlite-editor .cm-editor { min-height:108px; background:transparent; }
    .btp-sqlite-editor .cm-scroller { min-height:108px; }
    .btp-sqlite-editor .cm-placeholder { color:var(--text-muted); }
    .btp-sqlite-editor .cm-tooltip { border-radius:8px; box-shadow:0 12px 30px rgba(0,0,0,.35); }
    .btp-sqlite-toolbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .btp-sqlite-page-size { display:flex; align-items:center; gap:6px; color:var(--text-muted); font-size:12px; }
    .btp-sqlite-page-size select { padding:5px 7px; border-radius:7px; border:1px solid var(--glass-border); background:rgba(8,10,18,.28); color:var(--text-primary); }
    .btp-sqlite-filter { display:flex; align-items:center; gap:6px; flex-wrap:wrap; color:var(--text-muted); font-size:12px; }
    .btp-sqlite-filter select, .btp-sqlite-filter input { padding:5px 7px; border-radius:7px; border:1px solid var(--glass-border); background:rgba(8,10,18,.28); color:var(--text-primary); font-size:12px; }
    .btp-sqlite-filter input { min-width:140px; flex:1; }
    .btp-sqlite-filter .btn { padding:4px 9px; font-size:11px; }
    .btp-sqlite-status { color:var(--text-muted); font-size:12px; overflow-wrap:anywhere; }
    .btp-sqlite-error { color:#fca5a5; font-size:13px; white-space:pre-wrap; }
    .btp-sqlite-results { flex:1; min-height:0; overflow:auto; border:1px solid var(--glass-border); border-radius:9px; }
    .btp-sqlite-results table { border-collapse:collapse; width:100%; font:12px var(--font-mono); }
    .btp-sqlite-results th { position:sticky; top:0; background:rgba(15,18,30,.95); color:var(--text-primary); text-align:left; padding:8px 10px; border-bottom:1px solid var(--glass-border); }
    .btp-sqlite-results td { padding:7px 10px; border-bottom:1px solid rgba(255,255,255,.05); max-width:360px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .btp-sqlite-results tr:hover td { background:rgba(255,255,255,.04); }
    .btp-sqlite-pager { display:flex; flex:0 0 auto; align-items:center; gap:8px; flex-wrap:wrap; color:var(--text-muted); font-size:12px; }
    .btp-sqlite-pager-info { color:var(--text-muted); font-size:12px; }
    .btp-sqlite-pager-buttons { display:flex; gap:6px; flex-wrap:wrap; }
    @media (max-width: 1100px) { .btp-sqlite-body { grid-template-columns:1fr; overflow:auto; } .btp-sqlite-schema { max-height:200px; } }
    html[data-theme="glass-light"] .btp-sqlite-editor, html[data-theme="glass-light"] .btp-sqlite-page-size select, html[data-theme="glass-light"] .btp-sqlite-schema-search, html[data-theme="glass-light"] .btp-sqlite-filter select, html[data-theme="glass-light"] .btp-sqlite-filter input { background:rgba(255,255,255,.6); }
    html[data-theme="glass-light"] .btp-sqlite-editor .cm-tooltip { background:rgba(248,250,252,.98); color:#0f172a; }
    html[data-theme="glass-light"] .btp-sqlite-results th { background:rgba(248,250,252,.96); }
  `;
  document.head.appendChild(style);
}
