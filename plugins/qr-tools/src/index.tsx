import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import qrcode from "qrcode-generator";
import jsQR from "jsqr";
import type { PluginApi, PluginInstance, PluginLocale } from "../../../plugin-api";

const messages = {
  "zh-CN": {
    title: "二维码工具",
    subtitle: "生成与识别二维码",
    tabGenerate: "生成",
    tabScan: "识别",
    content: "内容",
    placeholder: "输入网址或任意文本",
    level: "纠错级别",
    download: "下载 PNG",
    empty: "输入内容后生成二维码",
    scanHint: "选择或拖入包含二维码的图片",
    chooseImage: "选择图片",
    recognized: "识别结果",
    copy: "复制",
    copied: "已复制",
    notFound: "未识别到二维码",
    decodeFailed: "图片读取失败",
  },
  "en-US": {
    title: "QR Tools",
    subtitle: "Generate and recognize QR codes",
    tabGenerate: "Generate",
    tabScan: "Scan",
    content: "Content",
    placeholder: "Enter a URL or any text",
    level: "Error correction",
    download: "Download PNG",
    empty: "Enter content to generate a QR code",
    scanHint: "Choose or drop an image containing a QR code",
    chooseImage: "Choose image",
    recognized: "Recognized text",
    copy: "Copy",
    copied: "Copied",
    notFound: "No QR code found",
    decodeFailed: "Failed to read the image",
  },
} as const;

function QrApp({ api }: { api: PluginApi }) {
  const [locale, setLocale] = React.useState<PluginLocale>(api.locale);
  const [tab, setTab] = React.useState<"generate" | "scan">("generate");
  const [text, setText] = React.useState("https://github.com/bennett-0727/bennett-toolbox");
  const [level, setLevel] = React.useState<"L" | "M" | "Q" | "H">("M");
  const [scanText, setScanText] = React.useState("");
  const [scanError, setScanError] = React.useState("");
  const [preview, setPreview] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const copy = messages[locale];

  React.useEffect(() => api.onLocaleChange(setLocale), [api]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!text.trim()) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    const qr = qrcode(0, level);
    qr.addData(text);
    qr.make();
    const count = qr.getModuleCount();
    const size = 360;
    const cell = Math.floor(size / (count + 4));
    const offset = Math.floor((size - cell * count) / 2);
    canvas.width = size;
    canvas.height = size;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#111827";
    for (let row = 0; row < count; row += 1) {
      for (let column = 0; column < count; column += 1) {
        if (qr.isDark(row, column)) {
          ctx.fillRect(offset + column * cell, offset + row * cell, cell, cell);
        }
      }
    }
  }, [text, level]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas || !text.trim()) return;
    const link = document.createElement("a");
    link.download = "qr-code.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const decodeFile = (file: File) => {
    setScanError("");
    setScanText("");
    const url = URL.createObjectURL(file);
    setPreview(url);
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error(copy.decodeFailed);
        ctx.drawImage(image, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(data.data, canvas.width, canvas.height);
        if (result) setScanText(result.data);
        else setScanError(copy.notFound);
      } catch (error) {
        setScanError(error instanceof Error ? error.message : copy.decodeFailed);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    image.onerror = () => {
      setScanError(copy.decodeFailed);
      URL.revokeObjectURL(url);
    };
    image.src = url;
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(scanText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <div className="btp-qr">
      <div className="btp-qr-head">
        <h1 className="module-title">{copy.title}</h1>
        <p>{copy.subtitle}</p>
      </div>
      <div className="btp-qr-tabs">
        <button type="button" className={tab === "generate" ? "active" : ""} onClick={() => setTab("generate")}>
          {copy.tabGenerate}
        </button>
        <button type="button" className={tab === "scan" ? "active" : ""} onClick={() => setTab("scan")}>
          {copy.tabScan}
        </button>
      </div>

      {tab === "generate" ? (
        <div className="btp-qr-body">
          <div className="btp-qr-controls">
            <label className="btp-qr-field">
              <span>{copy.content}</span>
              <textarea value={text} placeholder={copy.placeholder} onChange={(event) => setText(event.target.value)} />
            </label>
            <label className="btp-qr-field btp-qr-level">
              <span>{copy.level}</span>
              <select value={level} onChange={(event) => setLevel(event.target.value as typeof level)}>
                <option value="L">L</option>
                <option value="M">M</option>
                <option value="Q">Q</option>
                <option value="H">H</option>
              </select>
            </label>
            <button type="button" className="btn btn-primary" onClick={download} disabled={!text.trim()}>
              {copy.download}
            </button>
          </div>
          <div className="btp-qr-preview">
            {text.trim() ? <canvas ref={canvasRef} /> : <span className="btp-qr-empty">{copy.empty}</span>}
          </div>
        </div>
      ) : (
        <div className="btp-qr-body">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) decodeFile(file);
              event.target.value = "";
            }}
          />
          <div
            className="btp-qr-drop"
            onClick={() => fileRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const file = event.dataTransfer.files?.[0];
              if (file) decodeFile(file);
            }}
          >
            {preview ? <img src={preview} alt="" /> : <span>{copy.scanHint}</span>}
            <button type="button" className="btn btn-secondary">{copy.chooseImage}</button>
          </div>
          {scanError && <div className="btp-qr-error">{scanError}</div>}
          {scanText && (
            <div className="btp-qr-result">
              <span>{copy.recognized}</span>
              <textarea readOnly value={scanText} />
              <button type="button" className="btn btn-secondary" onClick={() => void copyResult()}>
                {copied ? copy.copied : copy.copy}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const STYLE_ID = "btp-qr-style";
function mountStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .btp-qr { display:flex; flex-direction:column; gap:16px; padding:24px; min-height:100%; box-sizing:border-box; color:var(--text-primary); }
    .btp-qr-head h1 { margin:0; }
    .btp-qr-head p { margin:6px 0 0; color:var(--text-muted); font-size:13px; }
    .btp-qr-tabs { display:flex; gap:8px; }
    .btp-qr-tabs button { border:1px solid var(--glass-border); background:rgba(255,255,255,.04); color:var(--text-secondary); padding:7px 14px; border-radius:999px; cursor:pointer; font-size:13px; }
    .btp-qr-tabs button.active { background:rgba(var(--accent-rgb),.18); border-color:rgba(var(--accent-rgb),.5); color:var(--text-primary); }
    .btp-qr-body { display:flex; gap:18px; padding:18px; border:1px solid var(--glass-border); border-radius:var(--radius-md); background:var(--glass-sheen), var(--glass-fill); flex-wrap:wrap; }
    .btp-qr-controls { flex:1; min-width:260px; display:flex; flex-direction:column; gap:12px; }
    .btp-qr-field { display:flex; flex-direction:column; gap:6px; }
    .btp-qr-field > span { color:var(--text-muted); font-size:12px; }
    .btp-qr-field textarea { min-height:130px; resize:vertical; padding:10px 12px; border-radius:9px; border:1px solid var(--glass-border); background:rgba(8,10,18,.28); color:var(--text-primary); font:13px/1.6 var(--font-mono); outline:none; }
    .btp-qr-field select { padding:8px 10px; border-radius:9px; border:1px solid var(--glass-border); background:rgba(8,10,18,.28); color:var(--text-primary); }
    .btp-qr-level { max-width:120px; }
    .btp-qr-preview { width:360px; height:360px; border-radius:12px; background:rgba(255,255,255,.05); display:flex; align-items:center; justify-content:center; padding:10px; }
    .btp-qr-preview canvas { width:100%; height:100%; border-radius:8px; image-rendering:pixelated; }
    .btp-qr-empty { color:var(--text-muted); font-size:13px; text-align:center; padding:20px; }
    .btp-qr-drop { flex:1; min-height:260px; border:1px dashed var(--glass-border); border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; cursor:pointer; color:var(--text-muted); font-size:13px; padding:18px; }
    .btp-qr-drop img { max-width:100%; max-height:260px; border-radius:8px; }
    .btp-qr-error { color:#fca5a5; font-size:13px; width:100%; }
    .btp-qr-result { width:100%; display:flex; flex-direction:column; gap:8px; }
    .btp-qr-result > span { color:var(--text-muted); font-size:12px; }
    .btp-qr-result textarea { min-height:90px; padding:10px 12px; border-radius:9px; border:1px solid var(--glass-border); background:rgba(8,10,18,.28); color:var(--text-primary); font:13px/1.6 var(--font-mono); }
    .btp-qr-result .btn { align-self:flex-start; }
    html[data-theme="glass-light"] .btp-qr-field textarea, html[data-theme="glass-light"] .btp-qr-field select, html[data-theme="glass-light"] .btp-qr-result textarea { background:rgba(255,255,255,.6); }
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
      root.render(<QrApp api={api} />);
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

window.__BENNETT_REGISTER_PLUGIN__?.("bennett.qr-tools", factory);
