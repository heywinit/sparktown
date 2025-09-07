"use client";

import * as React from "react";
import {
  ChevronRight,
  File,
  Folder,
  FileText,
  FolderPlus,
  FilePlus,
  Plus,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarRail,
  SidebarGroupAction,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state, openFile, createFile, createFolder } = useApp();
  const { projects, activeProject, folders, files } = state;
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(
    new Set()
  );
  const [showNewFileInput, setShowNewFileInput] = React.useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = React.useState(false);
  const [newFileName, setNewFileName] = React.useState("");
  const [newFolderName, setNewFolderName] = React.useState("");

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

  if (!activeProject) {
    return (
      <Sidebar {...props}>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>No Active Project</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="text-center text-muted-foreground p-4">
                <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No active project</p>
                <p className="text-xs">Create a project to get started</p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    );
  }

  return (
    <Sidebar {...props}>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between">
            <SidebarGroupLabel>{activeProject.name}</SidebarGroupLabel>
            <div className="flex gap-1">
              <SidebarGroupAction asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowNewFileInput(true)}
                  title="New file"
                >
                  <FilePlus className="h-3 w-3" />
                </Button>
              </SidebarGroupAction>
              <SidebarGroupAction asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowNewFolderInput(true)}
                  title="New folder"
                >
                  <FolderPlus className="h-3 w-3" />
                </Button>
              </SidebarGroupAction>
            </div>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Root level files */}
              {getFilesInFolder(undefined).map((file) => (
                <FileTreeItem key={file.id} file={file} level={0} />
              ))}

              {/* Root level folders */}
              {getFoldersInFolder(undefined).map((folder) => (
                <FolderTreeItem
                  key={folder.id}
                  folder={folder}
                  level={0}
                  expandedFolders={expandedFolders}
                  onToggleFolder={toggleFolder}
                  getFilesInFolder={getFilesInFolder}
                  getFoldersInFolder={getFoldersInFolder}
                />
              ))}

              {/* New file input */}
              {showNewFileInput && (
                <SidebarMenuItem>
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
                </SidebarMenuItem>
              )}

              {/* New folder input */}
              {showNewFolderInput && (
                <SidebarMenuItem>
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
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

interface FileTreeItemProps {
  file: any;
  level: number;
}

function FileTreeItem({ file, level }: FileTreeItemProps) {
  const { openFile } = useApp();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => openFile(file.id)}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <FileText className="h-4 w-4 text-muted-foreground" />
        {file.name}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

interface FolderTreeItemProps {
  folder: any;
  level: number;
  expandedFolders: Set<string>;
  onToggleFolder: (folderId: string) => void;
  getFilesInFolder: (folderId?: string) => any[];
  getFoldersInFolder: (parentId?: string) => any[];
}

function FolderTreeItem({
  folder,
  level,
  expandedFolders,
  onToggleFolder,
  getFilesInFolder,
  getFoldersInFolder,
}: FolderTreeItemProps) {
  const isExpanded = expandedFolders.has(folder.id);
  const childFolders = getFoldersInFolder(folder.id);
  const childFiles = getFilesInFolder(folder.id);

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        open={isExpanded}
        onOpenChange={() => onToggleFolder(folder.id)}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton style={{ paddingLeft: `${level * 16 + 8}px` }}>
            <ChevronRight className="transition-transform" />
            <Folder className="h-4 w-4 text-blue-500" />
            {folder.name}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {childFolders.map((childFolder) => (
              <FolderTreeItem
                key={childFolder.id}
                folder={childFolder}
                level={level + 1}
                expandedFolders={expandedFolders}
                onToggleFolder={onToggleFolder}
                getFilesInFolder={getFilesInFolder}
                getFoldersInFolder={getFoldersInFolder}
              />
            ))}
            {childFiles.map((file) => (
              <FileTreeItem key={file.id} file={file} level={level + 1} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
