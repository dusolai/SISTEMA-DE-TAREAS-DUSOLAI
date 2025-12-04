import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task } from '../types';

interface UIState {
  // Modal Tareas
  isTaskModalOpen: boolean;
  selectedTask: Task | null;
  openTaskModal: (task: Task) => void;
  closeTaskModal: () => void;

  // Modal Workspaces (NUEVO)
  isWorkspaceManagerOpen: boolean;
  openWorkspaceManager: () => void;
  closeWorkspaceManager: () => void;

  // Tema
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Workspace Activo
  currentWorkspaceId: string | null;
  setWorkspace: (id: string | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Modal Tareas
      isTaskModalOpen: false,
      selectedTask: null,
      openTaskModal: (task) => set({ isTaskModalOpen: true, selectedTask: task }),
      closeTaskModal: () => set({ isTaskModalOpen: false, selectedTask: null }),

      // Modal Workspaces (NUEVO)
      isWorkspaceManagerOpen: false,
      openWorkspaceManager: () => set({ isWorkspaceManagerOpen: true }),
      closeWorkspaceManager: () => set({ isWorkspaceManagerOpen: false }),

      // Tema
      theme: 'dark',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      // Workspace
      currentWorkspaceId: null,
      setWorkspace: (id) => set({ currentWorkspaceId: id }),
    }),
    {
      name: 'dusolai-ui-storage',
      partialize: (state) => ({ theme: state.theme, currentWorkspaceId: state.currentWorkspaceId }), 
    }
  )
);
