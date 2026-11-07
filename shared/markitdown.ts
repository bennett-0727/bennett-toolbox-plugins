export interface MarkitdownStatus {
  installed: boolean;
  available: boolean;
  version: string;
  path: string | null;
  assetName: string;
  platform: string;
  arch: string;
}

function ipcRenderer() {
  return window.require("electron").ipcRenderer;
}

export async function getMarkitdownStatus(): Promise<MarkitdownStatus> {
  const result = await ipcRenderer().invoke("components:markitdown-status");
  if (!result?.ok || !result.status) throw new Error(result?.error || "读取组件状态失败");
  return result.status;
}

export async function downloadMarkitdown(): Promise<MarkitdownStatus> {
  const result = await ipcRenderer().invoke("components:markitdown-download");
  if (!result?.ok || !result.status) throw new Error(result?.error || "下载组件失败");
  return result.status;
}

export function onMarkitdownProgress(callback: (percent: number) => void): () => void {
  const listener = (_event: unknown, payload: { percent: number }) => callback(payload.percent);
  ipcRenderer().on("components:markitdown-progress", listener);
  return () => ipcRenderer().removeListener("components:markitdown-progress", listener);
}
