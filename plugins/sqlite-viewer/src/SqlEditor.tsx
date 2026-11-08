import * as React from "react";
import { Compartment, EditorState, Prec } from "@codemirror/state";
import { EditorView, keymap, placeholder as cmPlaceholder } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { sql, SQLite } from "@codemirror/lang-sql";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";

export interface SqlEditorHandle {
  getExecutableSql(): string;
  setValue(value: string): void;
  focus(): void;
}

interface SqlEditorProps {
  value: string;
  schema: Record<string, string[]>;
  placeholder: string;
  onChange: (value: string) => void;
  onRun: (sql: string) => void;
}

const highlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "#a78bfa", fontWeight: "600" },
  { tag: tags.string, color: "#86efac" },
  { tag: tags.number, color: "#fbbf24" },
  { tag: tags.bool, color: "#fbbf24" },
  { tag: tags.null, color: "#fbbf24" },
  { tag: tags.comment, color: "var(--text-muted)", fontStyle: "italic" },
  { tag: tags.operator, color: "#f472b6" },
  { tag: tags.typeName, color: "#67e8f9" },
  { tag: tags.propertyName, color: "#93c5fd" },
  { tag: tags.variableName, color: "var(--text-primary)" },
  { tag: tags.punctuation, color: "var(--text-secondary)" },
]);

const editorTheme = EditorView.theme(
  {
    "&": {
      color: "var(--text-primary)",
      backgroundColor: "transparent",
      fontSize: "13px",
    },
    ".cm-content": {
      caretColor: "var(--text-primary)",
      fontFamily: "var(--font-mono)",
      padding: "8px 0",
    },
    ".cm-scroller": {
      fontFamily: "var(--font-mono)",
      lineHeight: "1.6",
      overflow: "auto",
    },
    ".cm-gutters": {
      backgroundColor: "transparent",
      color: "var(--text-muted)",
      border: "none",
    },
    ".cm-activeLine": {
      backgroundColor: "rgba(var(--accent-rgb), .08)",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "rgba(var(--accent-rgb), .08)",
    },
    ".cm-selectionBackground, ::selection": {
      backgroundColor: "rgba(var(--accent-rgb), .28) !important",
    },
    "&.cm-focused": {
      outline: "none",
    },
    ".cm-tooltip": {
      backgroundColor: "rgba(18, 20, 32, .98)",
      border: "1px solid var(--glass-border)",
      color: "var(--text-primary)",
    },
    ".cm-tooltip-autocomplete ul li[aria-selected]": {
      backgroundColor: "rgba(var(--accent-rgb), .25)",
      color: "#fff",
    },
  },
  { dark: true },
);

function executableSql(view: EditorView): string {
  const selection = view.state.selection.main;
  const selected = view.state.sliceDoc(selection.from, selection.to).trim();
  return selected || view.state.doc.toString();
}

const SqlEditor = React.forwardRef<SqlEditorHandle, SqlEditorProps>(function SqlEditor(
  { value, schema, placeholder, onChange, onRun },
  ref,
) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const viewRef = React.useRef<EditorView | null>(null);
  const languageRef = React.useRef(new Compartment());
  const onChangeRef = React.useRef(onChange);
  const onRunRef = React.useRef(onRun);

  onChangeRef.current = onChange;
  onRunRef.current = onRun;

  React.useImperativeHandle(
    ref,
    () => ({
      getExecutableSql() {
        return viewRef.current ? executableSql(viewRef.current) : value;
      },
      setValue(next: string) {
        const view = viewRef.current;
        if (!view || view.state.doc.toString() === next) return;
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: next },
        });
      },
      focus() {
        viewRef.current?.focus();
      },
    }),
    [value],
  );

  React.useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;
    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        Prec.high(
          keymap.of([
            {
              key: "Mod-Enter",
              run: (view) => {
                onRunRef.current(executableSql(view));
                return true;
              },
            },
          ]),
        ),
        editorTheme,
        syntaxHighlighting(highlightStyle),
        cmPlaceholder(placeholder),
        languageRef.current.of(sql({ dialect: SQLite, schema, upperCaseKeywords: true })),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChangeRef.current(update.state.doc.toString());
        }),
      ],
    });
    const view = new EditorView({ state, parent });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Editor is created once; value/schema updates are applied by effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    viewRef.current?.dispatch({
      effects: languageRef.current.reconfigure(
        sql({ dialect: SQLite, schema, upperCaseKeywords: true }),
      ),
    });
  }, [schema]);

  return <div ref={containerRef} className="btp-sqlite-editor" />;
});

export default SqlEditor;
