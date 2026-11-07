import type { PluginLocale } from "../../../plugin-api";

export const messages: Record<PluginLocale, Record<string, string>> = {
  "zh-CN": {
    title: "文本统计",
    subtitle: "粘贴文本，实时查看字符、单词、行数与阅读时长。",
    placeholder: "在此粘贴或输入文本...",
    characters: "字符",
    charactersNoSpace: "不含空格",
    words: "单词",
    lines: "行数",
    bytes: "字节",
    reading: "阅读时长",
    minute: "分钟",
    second: "秒",
  },
  "en-US": {
    title: "Text Stats",
    subtitle: "Paste text to see characters, words, lines and reading time.",
    placeholder: "Paste or type text here...",
    characters: "Characters",
    charactersNoSpace: "No spaces",
    words: "Words",
    lines: "Lines",
    bytes: "Bytes",
    reading: "Reading time",
    minute: "min",
    second: "sec",
  },
};
