"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeOffIcon, SplitIcon } from "lucide-react";
import Editor from "@monaco-editor/react";
import { Streamdown } from "streamdown";

interface EditorProps {
  content: string;
  onContentChange: (value: string | undefined) => void;
}

export default function SparkdownEditor({
  content,
  onContentChange,
}: EditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [isSideBySide, setIsSideBySide] = useState(false);

  const togglePreview = () => {
    setShowPreview(!showPreview);
    if (isSideBySide) setIsSideBySide(false);
  };

  const toggleSideBySide = () => {
    setIsSideBySide(!isSideBySide);
    if (!showPreview) setShowPreview(true);
  };

  const renderPreview = () => {
    return (
      <div className="p-4 overflow-auto h-full">
        <Streamdown>{content}</Streamdown>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-background/50 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-semibold">sparkdown</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={showPreview ? "default" : "outline"}
            size="sm"
            onClick={togglePreview}
            className="flex items-center space-x-1"
          >
            {showPreview ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
            <span>Preview</span>
          </Button>
          {showPreview && (
            <Button
              variant={isSideBySide ? "default" : "outline"}
              size="sm"
              onClick={toggleSideBySide}
              className="flex items-center space-x-1"
            >
              <SplitIcon className="h-4 w-4" />
              <span>Side by Side</span>
            </Button>
          )}
        </div>
      </div>

      {/* Editor and Preview Area */}
      <div className="flex-1 flex">
        {!showPreview ? (
          // Editor only
          <div className="w-full h-full">
            <Editor
              height="100%"
              defaultLanguage="markdown"
              value={content}
              onChange={onContentChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                wordWrap: "on",
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
              }}
            />
          </div>
        ) : isSideBySide ? (
          // Side by side layout
          <div className="flex w-full h-full">
            <div className="w-1/2 border-r">
              <Editor
                height="100%"
                defaultLanguage="markdown"
                value={content}
                onChange={onContentChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  wordWrap: "on",
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  padding: { top: 16, bottom: 16 },
                }}
              />
            </div>
            <div className="w-1/2 bg-background">{renderPreview()}</div>
          </div>
        ) : (
          // Preview only
          <div className="w-full h-full bg-background">{renderPreview()}</div>
        )}
      </div>
    </div>
  );
}
