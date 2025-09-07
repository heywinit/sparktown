"use client";

import Layout from "@/components/Layout";
import SparkdownEditor from "@/components/Editor";
import TabManager from "@/components/TabManager";
import FileExplorer from "@/components/FileExplorer";
import TopBar from "@/components/TopBar";
import CommandBar from "@/components/CommandBar";
import { AppProvider, useApp } from "@/lib/context/AppContext";
import React, { useEffect } from "react";

function AppContent() {
  const { state, toggleCommandBar, setCommandBarOpen } = useApp();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open command bar
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleCommandBar();
      }

      // Escape to close command bar
      if (e.key === "Escape" && state.isCommandBarOpen) {
        e.preventDefault();
        setCommandBarOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleCommandBar, setCommandBarOpen, state.isCommandBarOpen]);

  return (
    <Layout>
      <div className="flex flex-col h-screen w-full">
        <TopBar />
        <TabManager />
        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 border-r border-border bg-background">
            <FileExplorer className="h-full" />
          </div>
          <div className="flex-1">
            <SparkdownEditor className="h-full" />
          </div>
        </div>
      </div>

      {/* Command Bar */}
      <CommandBar
        isOpen={state.isCommandBarOpen}
        onClose={() => setCommandBarOpen(false)}
      />
    </Layout>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
