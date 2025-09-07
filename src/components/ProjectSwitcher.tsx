"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/context/AppContext";
import { Folder, Plus, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ProjectSwitcherProps {
  className?: string;
}

export default function ProjectSwitcher({ className }: ProjectSwitcherProps) {
  const { state, createProject, setActiveProject } = useApp();
  const { projects, activeProject } = state;
  const [showMenu, setShowMenu] = useState(false);
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      await createProject(newProjectName.trim());
      setNewProjectName("");
      setShowNewProjectInput(false);
      setShowMenu(false);
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const handleProjectSelect = async (projectId: string) => {
    try {
      await setActiveProject(projectId);
      setShowMenu(false);
    } catch (error) {
      console.error("Failed to switch project:", error);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        <Folder className="h-5 w-5 text-primary" />
        <div className="flex items-center gap-1">
          <span className="font-semibold text-sm">
            {activeProject?.name || "No Project"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setShowMenu(!showMenu)}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Project menu */}
      {showMenu && (
        <Card className="absolute top-8 left-0 z-50 p-2 min-w-64">
          <div className="space-y-1">
            {/* Current project info */}
            {activeProject && (
              <div className="px-2 py-1 text-xs text-muted-foreground border-b border-border mb-2">
                {activeProject.description || "No description"}
              </div>
            )}

            {/* Project list */}
            <div className="max-h-48 overflow-y-auto">
              {projects.map((project) => (
                <Button
                  key={project.id}
                  variant={
                    project.id === activeProject?.id ? "secondary" : "ghost"
                  }
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleProjectSelect(project.id)}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  {project.name}
                </Button>
              ))}
            </div>

            <div className="border-t border-border my-1" />

            {/* New project input */}
            {showNewProjectInput ? (
              <form onSubmit={handleCreateProject} className="px-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name..."
                  className="w-full px-2 py-1 text-sm border rounded bg-background"
                  autoFocus
                  onBlur={() => {
                    setShowNewProjectInput(false);
                    setNewProjectName("");
                  }}
                />
              </form>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => setShowNewProjectInput(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            )}

            <div className="border-t border-border my-1" />

            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setShowMenu(false);
                // TODO: Implement project settings
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Project Settings
            </Button>
          </div>
        </Card>
      )}

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
