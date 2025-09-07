"use client";

import React from "react";
import { useApp } from "@/lib/context/AppContext";
import { X, FileText, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TabManager() {
  const { state, closeTab, setActiveTab, saveFile } = useApp();
  const { tabs, activeTab, unsavedChanges } = state;

  const handleTabClick = async (tabId: string) => {
    await setActiveTab(tabId);
  };

  const handleCloseTab = async (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    await closeTab(tabId);
  };

  const handleSaveTab = async (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    await saveFile(fileId);
  };

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="flex border-b border-border bg-background">
      <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {tabs.map((tab) => {
          const file = state.files.find((f) => f.id === tab.fileId);
          const isDirty = unsavedChanges.has(tab.fileId);
          const isActive = activeTab?.id === tab.id;

          return (
            <div
              key={tab.id}
              className={`
                flex items-center gap-2 px-3 py-2 border-r border-border cursor-pointer
                transition-colors duration-200 min-w-0 max-w-48
                ${
                  isActive
                    ? "bg-background border-b-2 border-primary"
                    : "bg-muted/50 hover:bg-muted"
                }
              `}
              onClick={() => handleTabClick(tab.id)}
            >
              <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />

              <span className="truncate text-sm font-medium">
                {file?.name || "Unknown File"}
              </span>

              {isDirty && (
                <div className="h-2 w-2 rounded-full bg-orange-500 flex-shrink-0" />
              )}

              <div className="flex items-center gap-1 flex-shrink-0">
                {isDirty && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-primary/10"
                    onClick={(e) => handleSaveTab(e, tab.fileId)}
                    title="Save file"
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => handleCloseTab(e, tab.id)}
                  title="Close tab"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
