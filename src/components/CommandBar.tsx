"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useApp } from "@/lib/context/AppContext";
import {
  FileTextIcon,
  FolderIcon,
  SaveIcon,
  SearchIcon,
  PlusIcon,
  SettingsIcon,
  CommandIcon,
  ArrowRightIcon,
  FileIcon,
  FolderOpenIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Command {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
  keywords: string[];
  category: string;
}

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandBar({ isOpen, onClose }: CommandBarProps) {
  const { state, createFile, createFolder, saveFile, openFile } = useApp();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Generate commands based on current state
  const commands = useMemo(() => {
    const baseCommands: Command[] = [
      {
        id: "new-file",
        title: "New File",
        description: "Create a new file",
        icon: FileTextIcon,
        action: async () => {
          const fileName = prompt("Enter file name:");
          if (fileName) {
            await createFile(fileName);
            onClose();
          }
        },
        keywords: ["new", "file", "create"],
        category: "File",
      },
      {
        id: "new-folder",
        title: "New Folder",
        description: "Create a new folder",
        icon: FolderIcon,
        action: async () => {
          const folderName = prompt("Enter folder name:");
          if (folderName) {
            await createFolder(folderName);
            onClose();
          }
        },
        keywords: ["new", "folder", "create", "directory"],
        category: "File",
      },
      {
        id: "save-file",
        title: "Save File",
        description: "Save the current file",
        icon: SaveIcon,
        action: async () => {
          if (state.activeTab) {
            await saveFile(state.activeTab.fileId);
            onClose();
          }
        },
        keywords: ["save", "file", "write"],
        category: "File",
      },
      {
        id: "find-files",
        title: "Find Files",
        description: "Search for files in the project",
        icon: SearchIcon,
        action: () => {
          // TODO: Implement file search
          console.log("Find files");
          onClose();
        },
        keywords: ["find", "search", "files", "locate"],
        category: "Search",
      },
    ];

    // Add file-specific commands
    const fileCommands: Command[] = state.files.map((file) => ({
      id: `open-${file.id}`,
      title: `Open ${file.name}`,
      description: `Open ${file.name} in editor`,
      icon: FileIcon,
      action: async () => {
        await openFile(file.id);
        onClose();
      },
      keywords: ["open", "file", file.name.toLowerCase()],
      category: "Files",
    }));

    // Add folder-specific commands
    const folderCommands: Command[] = state.folders.map((folder) => ({
      id: `open-folder-${folder.id}`,
      title: `Open ${folder.name}`,
      description: `Open ${folder.name} folder`,
      icon: FolderOpenIcon,
      action: () => {
        // TODO: Implement folder opening
        console.log("Open folder", folder.name);
        onClose();
      },
      keywords: ["open", "folder", folder.name.toLowerCase()],
      category: "Folders",
    }));

    return [...baseCommands, ...fileCommands, ...folderCommands];
  }, [
    state.files,
    state.folders,
    state.activeTab,
    createFile,
    createFolder,
    saveFile,
    openFile,
    onClose,
  ]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;

    const searchTerms = query.toLowerCase().split(" ");
    return commands.filter((command) => {
      const searchableText = [
        command.title,
        command.description,
        ...command.keywords,
        command.category,
      ]
        .join(" ")
        .toLowerCase();

      return searchTerms.every((term) => searchableText.includes(term));
    });
  }, [commands, query]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: { [key: string]: Command[] } = {};
    filteredCommands.forEach((command) => {
      if (!groups[command.category]) {
        groups[command.category] = [];
      }
      groups[command.category].push(command);
    });
    return groups;
  }, [filteredCommands]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            Math.min(prev + 1, filteredCommands.length - 1)
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Command Bar */}
      <div className="relative w-full max-w-2xl mx-4">
        <div className="bg-background border border-border rounded-lg shadow-lg">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <SearchIcon size={20} className="text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">↑↓</kbd>
              <span>navigate</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs ml-2">
                ↵
              </kbd>
              <span>select</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs ml-2">
                esc
              </kbd>
              <span>close</span>
            </div>
          </div>

          {/* Commands List */}
          <div ref={listRef} className="max-h-96 overflow-y-auto p-2">
            {Object.keys(groupedCommands).length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <div className="text-center">
                  <SearchIcon size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No commands found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              </div>
            ) : (
              Object.entries(groupedCommands).map(
                ([category, categoryCommands]) => (
                  <div key={category} className="mb-4">
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {category}
                    </div>
                    {categoryCommands.map((command, index) => {
                      const globalIndex = filteredCommands.indexOf(command);
                      const isSelected = globalIndex === selectedIndex;

                      return (
                        <button
                          key={command.id}
                          onClick={command.action}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                            isSelected
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <command.icon
                            size={16}
                            className={
                              isSelected
                                ? "text-accent-foreground"
                                : "text-muted-foreground"
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {command.title}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {command.description}
                            </div>
                          </div>
                          {isSelected && (
                            <ArrowRightIcon
                              size={16}
                              className="text-muted-foreground"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )
              )
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <CommandIcon size={12} />
                <span>Command Bar</span>
              </div>
              <span>
                {filteredCommands.length} command
                {filteredCommands.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Press <kbd className="px-1 py-0.5 bg-muted rounded">⌘K</kbd> to
              open
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
