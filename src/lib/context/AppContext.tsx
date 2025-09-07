"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import {
  DatabaseService,
  Project,
  Folder,
  File,
  Tab,
  initializeDatabase,
} from "../database";

// State interfaces
interface AppState {
  // Projects
  projects: Project[];
  activeProject: Project | null;

  // File system
  folders: Folder[];
  files: File[];

  // Tabs
  tabs: Tab[];
  activeTab: Tab | null;

  // UI state
  isLoading: boolean;
  error: string | null;
  isCommandBarOpen: boolean;

  // File operations
  unsavedChanges: Set<string>; // Set of file IDs with unsaved changes
}

// Action types
type AppAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_PROJECTS"; payload: Project[] }
  | { type: "SET_ACTIVE_PROJECT"; payload: Project | null }
  | { type: "SET_FOLDERS"; payload: Folder[] }
  | { type: "SET_FILES"; payload: File[] }
  | { type: "SET_TABS"; payload: Tab[] }
  | { type: "SET_ACTIVE_TAB"; payload: Tab | null }
  | { type: "ADD_TAB"; payload: Tab }
  | { type: "REMOVE_TAB"; payload: string }
  | {
      type: "UPDATE_FILE_CONTENT";
      payload: { fileId: string; content: string };
    }
  | { type: "MARK_FILE_DIRTY"; payload: string }
  | { type: "MARK_FILE_SAVED"; payload: string }
  | { type: "TOGGLE_COMMAND_BAR" }
  | { type: "SET_COMMAND_BAR_OPEN"; payload: boolean }
  | { type: "REFRESH_DATA" };

// Initial state
const initialState: AppState = {
  projects: [],
  activeProject: null,
  folders: [],
  files: [],
  tabs: [],
  activeTab: null,
  isLoading: true,
  error: null,
  isCommandBarOpen: false,
  unsavedChanges: new Set(),
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };

    case "SET_PROJECTS":
      return { ...state, projects: action.payload };

    case "SET_ACTIVE_PROJECT":
      return { ...state, activeProject: action.payload };

    case "SET_FOLDERS":
      return { ...state, folders: action.payload };

    case "SET_FILES":
      return { ...state, files: action.payload };

    case "SET_TABS":
      return { ...state, tabs: action.payload };

    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };

    case "ADD_TAB":
      return {
        ...state,
        tabs: [...state.tabs, action.payload],
        activeTab: action.payload,
      };

    case "REMOVE_TAB":
      const newTabs = state.tabs.filter((tab) => tab.id !== action.payload);
      const newActiveTab =
        state.activeTab?.id === action.payload
          ? newTabs.length > 0
            ? newTabs[0]
            : null
          : state.activeTab;

      return {
        ...state,
        tabs: newTabs,
        activeTab: newActiveTab,
        unsavedChanges: new Set(
          [...state.unsavedChanges].filter((id) => id !== action.payload)
        ),
      };

    case "UPDATE_FILE_CONTENT":
      return {
        ...state,
        files: state.files.map((file) =>
          file.id === action.payload.fileId
            ? {
                ...file,
                content: action.payload.content,
                lastModified: new Date(),
              }
            : file
        ),
      };

    case "MARK_FILE_DIRTY":
      return {
        ...state,
        unsavedChanges: new Set([...state.unsavedChanges, action.payload]),
      };

    case "MARK_FILE_SAVED":
      const newUnsavedChanges = new Set(state.unsavedChanges);
      newUnsavedChanges.delete(action.payload);
      return {
        ...state,
        unsavedChanges: newUnsavedChanges,
      };

    case "TOGGLE_COMMAND_BAR":
      return {
        ...state,
        isCommandBarOpen: !state.isCommandBarOpen,
      };

    case "SET_COMMAND_BAR_OPEN":
      return {
        ...state,
        isCommandBarOpen: action.payload,
      };

    case "REFRESH_DATA":
      return { ...state };

    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;

  // Project operations
  createProject: (name: string, description?: string) => Promise<Project>;
  setActiveProject: (projectId: string) => Promise<void>;

  // Folder operations
  createFolder: (name: string, parentId?: string) => Promise<Folder>;

  // File operations
  createFile: (
    name: string,
    content?: string,
    folderId?: string
  ) => Promise<File>;
  updateFileContent: (fileId: string, content: string) => Promise<void>;
  saveFile: (fileId: string) => Promise<void>;

  // Tab operations
  openFile: (fileId: string) => Promise<void>;
  closeTab: (tabId: string) => Promise<void>;
  setActiveTab: (tabId: string) => Promise<void>;

  // Command bar operations
  toggleCommandBar: () => void;
  setCommandBarOpen: (isOpen: boolean) => void;

  // Utility
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize database and load data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        await initializeDatabase();
        await refreshData();
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload:
            error instanceof Error ? error.message : "Failed to initialize app",
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    initializeApp();
  }, []);

  // Refresh all data
  const refreshData = async () => {
    try {
      const [projects, activeProject, tabs, activeTab] = await Promise.all([
        DatabaseService.getProjects(),
        DatabaseService.getActiveProject(),
        DatabaseService.getTabs(),
        DatabaseService.getActiveTab(),
      ]);

      dispatch({ type: "SET_PROJECTS", payload: projects });
      dispatch({ type: "SET_ACTIVE_PROJECT", payload: activeProject || null });
      dispatch({ type: "SET_TABS", payload: tabs });
      dispatch({ type: "SET_ACTIVE_TAB", payload: activeTab || null });

      // Load folders and files for active project
      if (activeProject) {
        const [folders, files] = await Promise.all([
          DatabaseService.getFolders(activeProject.id),
          DatabaseService.getFiles(activeProject.id),
        ]);
        dispatch({ type: "SET_FOLDERS", payload: folders });
        dispatch({ type: "SET_FILES", payload: files });
      }
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to refresh data",
      });
    }
  };

  // Project operations
  const createProject = async (
    name: string,
    description?: string
  ): Promise<Project> => {
    try {
      const project = await DatabaseService.createProject(name, description);
      await refreshData();
      return project;
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to create project",
      });
      throw error;
    }
  };

  const setActiveProject = async (projectId: string): Promise<void> => {
    try {
      await DatabaseService.setActiveProject(projectId);
      await refreshData();
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "Failed to set active project",
      });
      throw error;
    }
  };

  // Folder operations
  const createFolder = async (
    name: string,
    parentId?: string
  ): Promise<Folder> => {
    if (!state.activeProject) throw new Error("No active project");

    try {
      const folder = await DatabaseService.createFolder(
        state.activeProject.id,
        name,
        parentId
      );
      await refreshData();
      return folder;
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to create folder",
      });
      throw error;
    }
  };

  // File operations
  const createFile = async (
    name: string,
    content: string = "",
    folderId?: string
  ): Promise<File> => {
    if (!state.activeProject) throw new Error("No active project");

    try {
      const file = await DatabaseService.createFile(
        state.activeProject.id,
        name,
        content,
        folderId
      );
      await refreshData();
      return file;
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to create file",
      });
      throw error;
    }
  };

  const updateFileContent = async (
    fileId: string,
    content: string
  ): Promise<void> => {
    try {
      dispatch({ type: "UPDATE_FILE_CONTENT", payload: { fileId, content } });
      dispatch({ type: "MARK_FILE_DIRTY", payload: fileId });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "Failed to update file content",
      });
      throw error;
    }
  };

  const saveFile = async (fileId: string): Promise<void> => {
    try {
      const file = state.files.find((f) => f.id === fileId);
      if (!file) throw new Error("File not found");

      await DatabaseService.updateFileContent(fileId, file.content);
      dispatch({ type: "MARK_FILE_SAVED", payload: fileId });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to save file",
      });
      throw error;
    }
  };

  // Tab operations
  const openFile = async (fileId: string): Promise<void> => {
    try {
      // Check if file is already open in a tab
      const existingTab = state.tabs.find((tab) => tab.fileId === fileId);
      if (existingTab) {
        await setActiveTab(existingTab.id);
        return;
      }

      // Create new tab
      const tab = await DatabaseService.createTab(fileId);
      dispatch({ type: "ADD_TAB", payload: tab });
      await DatabaseService.setActiveTab(tab.id);
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to open file",
      });
      throw error;
    }
  };

  const closeTab = async (tabId: string): Promise<void> => {
    try {
      await DatabaseService.closeTab(tabId);
      dispatch({ type: "REMOVE_TAB", payload: tabId });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to close tab",
      });
      throw error;
    }
  };

  const setActiveTab = async (tabId: string): Promise<void> => {
    try {
      await DatabaseService.setActiveTab(tabId);
      const tab = await DatabaseService.getActiveTab();
      dispatch({ type: "SET_ACTIVE_TAB", payload: tab || null });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to set active tab",
      });
      throw error;
    }
  };

  // Command bar operations
  const toggleCommandBar = () => {
    dispatch({ type: "TOGGLE_COMMAND_BAR" });
  };

  const setCommandBarOpen = (isOpen: boolean) => {
    dispatch({ type: "SET_COMMAND_BAR_OPEN", payload: isOpen });
  };

  const contextValue: AppContextType = {
    state,
    dispatch,
    createProject,
    setActiveProject,
    createFolder,
    createFile,
    updateFileContent,
    saveFile,
    openFile,
    closeTab,
    setActiveTab,
    toggleCommandBar,
    setCommandBarOpen,
    refreshData,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
