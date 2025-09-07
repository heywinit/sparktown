"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/context/AppContext";
import {
  Folder,
  FolderOpen,
  File,
  Plus,
  MoreHorizontal,
  FileText,
  FolderPlus,
  FilePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface FileExplorerProps {
  className?: string;
}

export default function FileExplorer({ className }: FileExplorerProps) {
  const { state, openFile, createFile, createFolder } = useApp();
  const { projects, activeProject, folders, files } = state;
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    try {
      await createFile(newFileName.trim());
      setNewFileName("");
      setShowNewFileInput(false);
    } catch (error) {
      console.error("Failed to create file:", error);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await createFolder(newFolderName.trim());
      setNewFolderName("");
      setShowNewFolderInput(false);
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  };

  const getFilesInFolder = (folderId?: string) => {
    return files.filter((file) => file.folderId === folderId);
  };

  const getFoldersInFolder = (parentId?: string) => {
    return folders.filter((folder) => folder.parentId === parentId);
  };

  const renderFolder = (folder: any, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const childFolders = getFoldersInFolder(folder.id);
    const childFiles = getFilesInFolder(folder.id);

    return (
      <div key={folder.id} className="select-none">
        <div
          className="flex items-center gap-2 py-1 px-2 hover:bg-muted/50 cursor-pointer rounded-sm"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => toggleFolder(folder.id)}
        >
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-blue-500" />
          ) : (
            <Folder className="h-4 w-4 text-blue-500" />
          )}
          <span className="text-sm truncate">{folder.name}</span>
        </div>

        {isExpanded && (
          <div>
            {childFolders.map((childFolder) =>
              renderFolder(childFolder, level + 1)
            )}
            {childFiles.map((file) => renderFile(file, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderFile = (file: any, level: number = 0) => {
    return (
      <div
        key={file.id}
        className="flex items-center gap-2 py-1 px-2 hover:bg-muted/50 cursor-pointer rounded-sm"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => openFile(file.id)}
      >
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm truncate">{file.name}</span>
      </div>
    );
  };

  if (!activeProject) {
    return (
      <Card className={`p-4 ${className} rounded-none border-none`}>
        <div className="text-center text-muted-foreground">
          <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No active project</p>
          <p className="text-xs">Create a project to get started</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className} rounded-none border-none`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">{activeProject.name}</h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setShowNewFileInput(true)}
            title="New file"
          >
            <FilePlus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setShowNewFolderInput(true)}
            title="New folder"
          >
            <FolderPlus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        {/* Root level files */}
        {getFilesInFolder(undefined).map((file) => renderFile(file, 0))}

        {/* Root level folders */}
        {getFoldersInFolder(undefined).map((folder) => renderFolder(folder, 0))}

        {/* New file input */}
        {showNewFileInput && (
          <form onSubmit={handleCreateFile} className="px-2">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="File name..."
              className="w-full px-2 py-1 text-sm border rounded bg-background"
              autoFocus
              onBlur={() => {
                setShowNewFileInput(false);
                setNewFileName("");
              }}
            />
          </form>
        )}

        {/* New folder input */}
        {showNewFolderInput && (
          <form onSubmit={handleCreateFolder} className="px-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              className="w-full px-2 py-1 text-sm border rounded bg-background"
              autoFocus
              onBlur={() => {
                setShowNewFolderInput(false);
                setNewFolderName("");
              }}
            />
          </form>
        )}
      </div>
    </Card>
  );
}
