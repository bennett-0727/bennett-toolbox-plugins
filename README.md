# Bennett Toolbox Plugins

Bennett Toolbox 的插件仓库。插件以 ZIP 包发布，应用通过 `registry.json` 发现、下载并安装。

## 插件

- `bennett.text-stats`：文本统计（字符、单词、行数、字节、阅读时长）。

## 开发

```bash
npm install
npm run build
npm run package
npm run registry
npm run validate
```

插件源码位于 `plugins/<name>/`，入口为 `src/index.tsx`，构建产物位于 `dist/<id>/<version>/main.js`。

## 发布

推送 `plugin-v*` 标签后，GitHub Actions 会构建全部插件、生成 `registry.json` 并上传 ZIP 与 registry 到 Release。

## Manifest

参见 `plugin-api.d.ts` 与各插件的 `plugin.json`。插件包必须包含 `plugin.json` 与 `main.js`，入口为 IIFE，通过 `window.__BENNETT_REGISTER_PLUGIN__(id, factory)` 注册。
