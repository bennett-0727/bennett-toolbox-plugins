# Bennett Toolbox Plugins

Bennett Toolbox 的官方插件仓库。插件以 ZIP 包发布，应用通过 `registry.json` 发现、下载并安装。

## 官方插件

- `bennett.json-formatter`：JSON 格式化
- `bennett.translate-naming`：变量命名
- `bennett.image-converter`：图片转换
- `bennett.image-compressor`：图片压缩
- `bennett.watermark-removal`：图片去水印
- `bennett.pdf-to-images`：PDF 转图片
- `bennett.video-to-gif`：视频转 GIF
- `bennett.file-search`：文件搜索
- `bennett.document-converter`：文档转 Markdown
- `bennett.screenshot-float`：截图悬浮
- `bennett.color-picker`：屏幕取色
- `bennett.text-stats`：文本统计示例

### 可选开发者工具（`recommended: false`）

- `bennett.timestamp-tools`：时间戳、Cron 表达式与时区转换
- `bennett.sqlite-viewer`：浏览并查询本地 SQLite 数据库
- `bennett.markdown-preview`：Markdown 实时预览与 Mermaid 图表渲染
- `bennett.qr-tools`：二维码生成与识别

可选插件会出现在工作台“可安装”列表，但不会随“安装全部推荐工具”自动安装。

## 开发

```bash
npm install
npm run build
npm run package
npm run registry
npm run validate
```

插件源码位于 `plugins/<name>/`，共享 i18n、Electron helpers 与挂载逻辑位于 `shared/`。构建产物位于 `dist/<id>/<version>/`。

## 发布

推送 `plugin-v*` 标签后，GitHub Actions 会构建全部插件、生成 `registry.json` 并上传 ZIP 与 registry 到 Release。

## Manifest

参见各插件的 `plugin.json`。插件包必须包含 `plugin.json` 与 `main.js`，入口为 IIFE，通过 `window.__BENNETT_REGISTER_PLUGIN__(id, factory)` 注册；`recommended` 与 `order` 用于首次安装与侧栏排序。
