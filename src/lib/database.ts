import Dexie, { Table } from "dexie";

// Database schema interfaces
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Folder {
  id: string;
  projectId: string;
  parentId?: string; // For nested folders
  name: string;
  path: string; // Full path from project root
  createdAt: Date;
  updatedAt: Date;
}

export interface File {
  id: string;
  projectId: string;
  folderId?: string; // null for root level files
  name: string;
  path: string; // Full path from project root
  content: string;
  language: string; // 'sparkdown', 'markdown', etc.
  createdAt: Date;
  updatedAt: Date;
  lastModified: Date;
}

export interface Tab {
  id: string;
  fileId: string;
  isActive: boolean;
  isDirty: boolean; // Has unsaved changes
  cursorPosition?: number;
  scrollPosition?: number;
  createdAt: Date;
  lastAccessed: Date;
}

export interface Settings {
  id: string;
  key: string;
  value: any;
  updatedAt: Date;
}

// Database class
export class SparktownDB extends Dexie {
  projects!: Table<Project>;
  folders!: Table<Folder>;
  files!: Table<File>;
  tabs!: Table<Tab>;
  settings!: Table<Settings>;

  constructor() {
    super("SparktownDB");

    this.version(1).stores({
      projects: "id, name, createdAt, updatedAt, isActive",
      folders: "id, projectId, parentId, name, path, createdAt, updatedAt",
      files:
        "id, projectId, folderId, name, path, content, language, createdAt, updatedAt, lastModified",
      tabs: "id, fileId, isActive, isDirty, cursorPosition, scrollPosition, createdAt, lastAccessed",
      settings: "id, key, value, updatedAt",
    });

    // Hooks for automatic timestamps
    this.projects.hook("creating", function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.projects.hook(
      "updating",
      function (modifications, primKey, obj, trans) {
        (modifications as any).updatedAt = new Date();
      }
    );

    this.folders.hook("creating", function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.folders.hook(
      "updating",
      function (modifications, primKey, obj, trans) {
        (modifications as any).updatedAt = new Date();
      }
    );

    this.files.hook("creating", function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
      obj.lastModified = new Date();
    });

    this.files.hook("updating", function (modifications, primKey, obj, trans) {
      (modifications as any).updatedAt = new Date();
      (modifications as any).lastModified = new Date();
    });

    this.tabs.hook("creating", function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.lastAccessed = new Date();
    });

    this.tabs.hook("updating", function (modifications, primKey, obj, trans) {
      if ((modifications as any).isActive) {
        (modifications as any).lastAccessed = new Date();
      }
    });

    this.settings.hook("creating", function (primKey, obj, trans) {
      obj.updatedAt = new Date();
    });

    this.settings.hook(
      "updating",
      function (modifications, primKey, obj, trans) {
        (modifications as any).updatedAt = new Date();
      }
    );
  }
}

// Database instance
export const db = new SparktownDB();

// Utility functions for generating IDs
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Database service functions
export class DatabaseService {
  // Project operations
  static async createProject(
    name: string,
    description?: string
  ): Promise<Project> {
    const project: Project = {
      id: generateId(),
      name,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };

    await db.projects.add(project);
    return project;
  }

  static async getProjects(): Promise<Project[]> {
    return await db.projects.orderBy("updatedAt").reverse().toArray();
  }

  static async getActiveProject(): Promise<Project | undefined> {
    return await db.projects.where("isActive").equals(1).first();
  }

  static async setActiveProject(projectId: string): Promise<void> {
    await db.transaction("rw", db.projects, async () => {
      // Deactivate all projects
      await db.projects.toCollection().modify({ isActive: false });
      // Activate the selected project
      await db.projects.update(projectId, { isActive: true });
    });
  }

  // Folder operations
  static async createFolder(
    projectId: string,
    name: string,
    parentId?: string
  ): Promise<Folder> {
    const parentPath = parentId
      ? (await db.folders.get(parentId))?.path || ""
      : "";
    const path = parentPath ? `${parentPath}/${name}` : name;

    const folder: Folder = {
      id: generateId(),
      projectId,
      parentId,
      name,
      path,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.folders.add(folder);
    return folder;
  }

  static async getFolders(projectId: string): Promise<Folder[]> {
    return await db.folders.where("projectId").equals(projectId).toArray();
  }

  // File operations
  static async createFile(
    projectId: string,
    name: string,
    content: string = "",
    folderId?: string,
    language: string = "sparkdown"
  ): Promise<File> {
    const folderPath = folderId
      ? (await db.folders.get(folderId))?.path || ""
      : "";
    const path = folderPath ? `${folderPath}/${name}` : name;

    const file: File = {
      id: generateId(),
      projectId,
      folderId,
      name,
      path,
      content,
      language,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastModified: new Date(),
    };

    await db.files.add(file);
    return file;
  }

  static async getFiles(projectId: string, folderId?: string): Promise<File[]> {
    if (folderId) {
      return await db.files
        .where(["projectId", "folderId"])
        .equals([projectId, folderId])
        .toArray();
    }
    return await db.files
      .where("projectId")
      .equals(projectId)
      .and((file) => file.folderId === undefined)
      .toArray();
  }

  static async updateFileContent(
    fileId: string,
    content: string
  ): Promise<void> {
    await db.files.update(fileId, { content, lastModified: new Date() });
  }

  static async getFile(fileId: string): Promise<File | undefined> {
    return await db.files.get(fileId);
  }

  // Tab operations
  static async createTab(fileId: string): Promise<Tab> {
    // Close any existing tab for this file
    await db.tabs.where("fileId").equals(fileId).delete();

    const tab: Tab = {
      id: generateId(),
      fileId,
      isActive: false,
      isDirty: false,
      createdAt: new Date(),
      lastAccessed: new Date(),
    };

    await db.tabs.add(tab);
    return tab;
  }

  static async getTabs(): Promise<Tab[]> {
    return await db.tabs.orderBy("lastAccessed").reverse().toArray();
  }

  static async getActiveTab(): Promise<Tab | undefined> {
    return await db.tabs.where("isActive").equals(1).first();
  }

  static async setActiveTab(tabId: string): Promise<void> {
    await db.transaction("rw", db.tabs, async () => {
      // Deactivate all tabs
      await db.tabs.toCollection().modify({ isActive: false });
      // Activate the selected tab
      await db.tabs.update(tabId, { isActive: true, lastAccessed: new Date() });
    });
  }

  static async closeTab(tabId: string): Promise<void> {
    await db.tabs.delete(tabId);
  }

  static async markTabDirty(tabId: string, isDirty: boolean): Promise<void> {
    await db.tabs.update(tabId, { isDirty });
  }

  // Settings operations
  static async setSetting(key: string, value: any): Promise<void> {
    await db.settings.put({
      id: key,
      key,
      value,
      updatedAt: new Date(),
    });
  }

  static async getSetting(key: string): Promise<any> {
    const setting = await db.settings.get(key);
    return setting?.value;
  }
}

// Initialize database with default project if none exists
export const initializeDatabase = async (): Promise<void> => {
  const projects = await db.projects.count();
  if (projects === 0) {
    const project = await DatabaseService.createProject(
      "My First Project",
      "Welcome to Sparktown!"
    );

    // Create a welcome file
    await DatabaseService.createFile(
      project.id,
      "welcome.sparkdown",
      `# Welcome to Sparktown! 🎉

This is a minimal collaborative sparkdown editor with **streaming** support.

## Features
- **Offline-first**: Works completely offline in your browser
- **Multiple projects**: Organize your work into projects
- **File management**: Create folders and files with a clean interface
- **Tab system**: Edit multiple files simultaneously
- **Auto-save**: Your work is automatically saved as you type
- **Monaco Editor**: Rich text editing with syntax highlighting
- **Streaming markdown** support with Streamdown

## Getting Started

1. **Create a new file**: Click the "+" button in the file explorer
2. **Create folders**: Organize your files with the folder button
3. **Open files**: Click on any file to open it in a new tab
4. **Save files**: Files auto-save, or use Ctrl/Cmd + S

### Code Example
\`\`\`javascript
function hello() {
  console.log("Hello, Sparktown!");
}
\`\`\`

### Math Support
Inline math: $E = mc^2$

Block math:
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

Start typing to see the magic happen! 🚀`,
      undefined,
      "sparkdown"
    );
  }
};
