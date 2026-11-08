import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { CronExpressionParser } from "cron-parser";
import { DateTime } from "luxon";
import type { PluginApi, PluginInstance, PluginLocale } from "../../../plugin-api";

const ZONES = [
  "UTC",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
];

const messages = {
  "zh-CN": {
    title: "时间与 Cron",
    subtitle: "时间戳、Cron 表达式与时区转换",
    tabTimestamp: "时间戳",
    tabCron: "Cron",
    tabTimezone: "时区",
    now: "当前时间",
    timestampInput: "时间戳 / ISO 时间",
    parse: "解析",
    local: "本地时间",
    utc: "UTC",
    iso: "ISO 8601",
    seconds: "秒",
    milliseconds: "毫秒",
    invalid: "无法解析该时间",
    cronExpression: "Cron 表达式",
    cronZone: "时区",
    count: "数量",
    nextRuns: "接下来运行时间",
    cronHint: "支持 5/6 字段，例如 */5 * * * *、0 9 * * 1-5",
    cronError: "Cron 表达式无效",
    sourceZone: "源时区",
    targetZone: "目标时区",
    dateTime: "日期时间",
    convert: "转换",
    targetTime: "目标时间",
    copy: "复制",
    copied: "已复制",
  },
  "en-US": {
    title: "Time & Cron",
    subtitle: "Timestamp, cron and timezone conversion",
    tabTimestamp: "Timestamp",
    tabCron: "Cron",
    tabTimezone: "Timezone",
    now: "Now",
    timestampInput: "Timestamp / ISO time",
    parse: "Parse",
    local: "Local",
    utc: "UTC",
    iso: "ISO 8601",
    seconds: "Seconds",
    milliseconds: "Milliseconds",
    invalid: "Unable to parse this time",
    cronExpression: "Cron expression",
    cronZone: "Timezone",
    count: "Count",
    nextRuns: "Next runs",
    cronHint: "5/6 fields supported, e.g. */5 * * * * or 0 9 * * 1-5",
    cronError: "Invalid cron expression",
    sourceZone: "Source timezone",
    targetZone: "Target timezone",
    dateTime: "Date and time",
    convert: "Convert",
    targetTime: "Target time",
    copy: "Copy",
    copied: "Copied",
  },
} as const;

function zoneOptions() {
  return ZONES.map((zone) => <option key={zone} value={zone}>{zone}</option>);
}

function formatInZone(date: Date, zone: string, locale: PluginLocale): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function parseDateTime(raw: string): Date | null {
  const value = raw.trim();
  if (!value) return null;
  if (/^-?\d+$/.test(value)) {
    const number = Number(value);
    const ms = value.replace("-", "").length >= 13 ? number : number * 1000;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function TimeApp({ api }: { api: PluginApi }) {
  const [locale, setLocale] = React.useState<PluginLocale>(api.locale);
  const [tab, setTab] = React.useState<"timestamp" | "cron" | "timezone">("timestamp");
  const [now, setNow] = React.useState(() => new Date());
  const [timestamp, setTimestamp] = React.useState(() => String(Math.floor(Date.now() / 1000)));
  const [cronExpr, setCronExpr] = React.useState("*/5 * * * *");
  const [cronZone, setCronZone] = React.useState("Asia/Shanghai");
  const [cronCount, setCronCount] = React.useState(8);
  const [sourceZone, setSourceZone] = React.useState("Asia/Shanghai");
  const [targetZone, setTargetZone] = React.useState("UTC");
  const [dateInput, setDateInput] = React.useState(() =>
    DateTime.now().setZone("Asia/Shanghai").toFormat("yyyy-LL-dd'T'HH:mm"),
  );
  const [copied, setCopied] = React.useState("");

  const copy = messages[locale];

  React.useEffect(() => api.onLocaleChange(setLocale), [api]);
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    setDateInput(DateTime.now().setZone(sourceZone).toFormat("yyyy-LL-dd'T'HH:mm"));
  }, [sourceZone]);

  const parsed = React.useMemo(() => parseDateTime(timestamp), [timestamp]);
  const cronRows = React.useMemo(() => {
    try {
      const interval = CronExpressionParser.parse(cronExpr, {
        tz: cronZone,
        currentDate: new Date(),
      });
      return { rows: Array.from({ length: cronCount }, () => interval.next().toDate()), error: "" };
    } catch (error) {
      return { rows: [], error: error instanceof Error ? error.message : String(error) };
    }
  }, [cronExpr, cronZone, cronCount]);
  const converted = React.useMemo(() => {
    const parsedDate = DateTime.fromISO(dateInput, { zone: sourceZone });
    return parsedDate.isValid ? parsedDate.setZone(targetZone) : null;
  }, [dateInput, sourceZone, targetZone]);

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      setTimeout(() => setCopied(""), 1200);
    } catch {}
  };

  const card = (label: string, value: string) => (
    <div className="btp-time-card">
      <span className="btp-time-card-label">{label}</span>
      <span className="btp-time-card-value">{value}</span>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => void copyText(value)}>
        {copied === value ? copy.copied : copy.copy}
      </button>
    </div>
  );

  return (
    <div className="btp-time">
      <div className="btp-time-head">
        <h1 className="module-title">{copy.title}</h1>
        <p>{copy.subtitle}</p>
      </div>

      <div className="btp-time-tabs">
        {([
          ["timestamp", copy.tabTimestamp],
          ["cron", copy.tabCron],
          ["timezone", copy.tabTimezone],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={tab === value ? "active" : ""}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "timestamp" && (
        <div className="btp-time-body">
          <div className="btp-time-row">
            <label className="btp-time-field">
              <span>{copy.timestampInput}</span>
              <input value={timestamp} onChange={(event) => setTimestamp(event.target.value)} />
            </label>
            <button type="button" className="btn btn-secondary" onClick={() => setTimestamp(String(Math.floor(Date.now() / 1000)))}>
              {copy.now}
            </button>
          </div>
          {parsed ? (
            <div className="btp-time-cards">
              {card(copy.local, formatInZone(parsed, Intl.DateTimeFormat().resolvedOptions().timeZone, locale))}
              {card(copy.utc, formatInZone(parsed, "UTC", "en-US"))}
              {card(copy.iso, parsed.toISOString())}
              {card(copy.seconds, String(Math.floor(parsed.getTime() / 1000)))}
              {card(copy.milliseconds, String(parsed.getTime()))}
            </div>
          ) : (
            <div className="btp-time-error">{copy.invalid}</div>
          )}
          <div className="btp-time-now">
            <span>{copy.now}</span>
            <strong>{formatInZone(now, Intl.DateTimeFormat().resolvedOptions().timeZone, locale)}</strong>
          </div>
        </div>
      )}

      {tab === "cron" && (
        <div className="btp-time-body">
          <label className="btp-time-field">
            <span>{copy.cronExpression}</span>
            <input value={cronExpr} onChange={(event) => setCronExpr(event.target.value)} />
          </label>
          <p className="btp-time-hint">{copy.cronHint}</p>
          <div className="btp-time-row">
            <label className="btp-time-field">
              <span>{copy.cronZone}</span>
              <select value={cronZone} onChange={(event) => setCronZone(event.target.value)}>
                {zoneOptions()}
              </select>
            </label>
            <label className="btp-time-field btp-time-count">
              <span>{copy.count}</span>
              <input
                type="number"
                min={1}
                max={20}
                value={cronCount}
                onChange={(event) => setCronCount(Math.max(1, Math.min(20, Number(event.target.value) || 1)))}
              />
            </label>
          </div>
          {cronRows.error ? (
            <div className="btp-time-error">{copy.cronError}: {cronRows.error}</div>
          ) : (
            <div className="btp-time-list">
              <span className="btp-time-list-title">{copy.nextRuns}</span>
              {cronRows.rows.map((date, index) => (
                <code key={`${date.toISOString()}-${index}`}>{formatInZone(date, cronZone, locale)}</code>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "timezone" && (
        <div className="btp-time-body">
          <div className="btp-time-row">
            <label className="btp-time-field">
              <span>{copy.sourceZone}</span>
              <select value={sourceZone} onChange={(event) => setSourceZone(event.target.value)}>
                {zoneOptions()}
              </select>
            </label>
            <label className="btp-time-field">
              <span>{copy.targetZone}</span>
              <select value={targetZone} onChange={(event) => setTargetZone(event.target.value)}>
                {zoneOptions()}
              </select>
            </label>
          </div>
          <label className="btp-time-field">
            <span>{copy.dateTime}</span>
            <input type="datetime-local" value={dateInput} onChange={(event) => setDateInput(event.target.value)} />
          </label>
          <div className="btp-time-cards">
            {converted
              ? card(copy.targetTime, `${converted.toFormat("yyyy-LL-dd HH:mm:ss")} · ${converted.offsetNameShort || converted.zoneName || targetZone}`)
              : <div className="btp-time-error">{copy.invalid}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

const STYLE_ID = "btp-time-style";
function mountStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .btp-time { display:flex; flex-direction:column; gap:16px; padding:24px; min-height:100%; box-sizing:border-box; color:var(--text-primary); }
    .btp-time-head h1 { margin:0; }
    .btp-time-head p { margin:6px 0 0; color:var(--text-muted); font-size:13px; }
    .btp-time-tabs { display:flex; gap:8px; flex-wrap:wrap; }
    .btp-time-tabs button { border:1px solid var(--glass-border); background:rgba(255,255,255,.04); color:var(--text-secondary); padding:7px 14px; border-radius:999px; cursor:pointer; font-size:13px; }
    .btp-time-tabs button.active { background:rgba(var(--accent-rgb),.18); border-color:rgba(var(--accent-rgb),.5); color:var(--text-primary); }
    .btp-time-body { display:flex; flex-direction:column; gap:14px; padding:18px; border:1px solid var(--glass-border); border-radius:var(--radius-md); background:var(--glass-sheen), var(--glass-fill); }
    .btp-time-row { display:flex; gap:12px; align-items:flex-end; flex-wrap:wrap; }
    .btp-time-field { display:flex; flex-direction:column; gap:6px; flex:1; min-width:180px; }
    .btp-time-field > span { color:var(--text-muted); font-size:12px; }
    .btp-time-field input, .btp-time-field select { padding:9px 11px; border-radius:9px; border:1px solid var(--glass-border); background:rgba(8,10,18,.28); color:var(--text-primary); font:13px var(--font-mono); outline:none; }
    .btp-time-count { flex:0 0 110px; min-width:110px; }
    .btp-time-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:10px; }
    .btp-time-card { display:flex; flex-direction:column; gap:6px; padding:12px 14px; border:1px solid var(--glass-border); border-radius:10px; background:rgba(255,255,255,.03); }
    .btp-time-card-label { color:var(--text-muted); font-size:12px; }
    .btp-time-card-value { font:13px var(--font-mono); overflow-wrap:anywhere; }
    .btp-time-card button { align-self:flex-start; margin-top:2px; }
    .btp-time-hint { margin:0; color:var(--text-muted); font-size:12px; }
    .btp-time-error { color:#fca5a5; font-size:13px; }
    .btp-time-list { display:flex; flex-direction:column; gap:6px; }
    .btp-time-list-title { color:var(--text-muted); font-size:12px; }
    .btp-time-list code { padding:7px 10px; border-radius:8px; background:rgba(8,10,18,.28); font:12px var(--font-mono); }
    .btp-time-now { display:flex; gap:10px; align-items:baseline; color:var(--text-muted); font-size:12px; }
    .btp-time-now strong { color:var(--text-primary); font:13px var(--font-mono); }
    html[data-theme="glass-light"] .btp-time-field input, html[data-theme="glass-light"] .btp-time-field select { background:rgba(255,255,255,.6); }
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
      root.render(<TimeApp api={api} />);
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

window.__BENNETT_REGISTER_PLUGIN__?.("bennett.timestamp-tools", factory);
