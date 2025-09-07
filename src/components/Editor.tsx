"use client";

import React, { useEffect, useRef } from "react";
import { useApp } from "@/lib/context/AppContext";
import { Editor } from "@monaco-editor/react";

interface EditorProps {
  className?: string;
}

export default function SparkdownEditor({ className }: EditorProps) {
  const { state, updateFileContent, saveFile } = useApp();
  const { activeTab, files } = state;
  const editorRef = useRef<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeFile = activeTab
    ? files.find((f) => f.id === activeTab.fileId)
    : null;

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;

    // Set up auto-save
    editor.onDidChangeModelContent(() => {
      if (activeFile) {
        const content = editor.getValue();
        updateFileContent(activeFile.id, content);

        // Auto-save after 2 seconds of inactivity
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
          saveFile(activeFile.id);
        }, 2000);
      }
    });

    // Set up keyboard shortcuts
    editor.addCommand(0 | 49, () => {
      // Ctrl/Cmd + S
      if (activeFile) {
        saveFile(activeFile.id);
      }
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (activeFile && value !== undefined) {
      updateFileContent(activeFile.id, value);
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!activeFile) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-muted-foreground">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-semibold mb-2">No file open</h3>
          <p className="text-sm">
            Open a file from the explorer to start editing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-1">
        <Editor
          height="100%"
          language="markdown"
          value={activeFile.content}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: "on",
            tabSize: 2,
            insertSpaces: true,
            renderWhitespace: "selection",
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
          }}
        />
      </div>
    </div>
  );
}
