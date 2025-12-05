import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task } from '../types';

interface UIState {
  // Estado del Modal
  isTaskModalOpen: boolean;
  selectedTask: Task | null;
  openTaskModal: (task?: Task) => void; // <--- Ahora acepta vacío (undefined)
  closeTaskModal: () => void;

  // Estado del Tema
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Estado del Workspace
  currentWorkspaceId: string | null;
  setWorkspace: (id: string | null) => void;
  
  // Estado del Gestor de Workspaces
  isWorkspaceManagerOpen: boolean;
  openWorkspaceManager: () => void;
  closeWorkspaceManager: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Modal Tareas
      isTaskModalOpen: false,
      selectedTask: null,
      // Si no pasamos tarea, ponemos selectedTask a null (Modo Creación)
      openTaskModal: (task) => set({ isTaskModalOpen: true, selectedTask: task || null }),
      closeTaskModal: () => set({ isTaskModalOpen: false, selectedTask: null }),

      // Gestor de Workspaces
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
