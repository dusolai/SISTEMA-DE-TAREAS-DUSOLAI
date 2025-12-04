import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task } from '../types';

interface UIState {
  // Estado del Modal
  isTaskModalOpen: boolean;
  selectedTask: Task | null;
  openTaskModal: (task: Task) => void;
  closeTaskModal: () => void;

  // Estado del Tema
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Estado del Workspace (NUEVO)
  currentWorkspaceId: string | null;
  setWorkspace: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Modal
      isTaskModalOpen: false,
      selectedTask: null,
      openTaskModal: (task) => set({ isTaskModalOpen: true, selectedTask: task }),
      closeTaskModal: () => set({ isTaskModalOpen: false, selectedTask: null }),

      // Tema
      theme: 'dark',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      // Workspace (Por defecto null, obligaremos a seleccionar uno o cargaremos el primero)
      currentWorkspaceId: null,
      setWorkspace: (id) => set({ currentWorkspaceId: id }),
    }),
    {
      name: 'dusolai-ui-storage',
      // Guardamos el tema Y el workspace seleccionado para que no se pierda al recargar
      partialize: (state) => ({ theme: state.theme, currentWorkspaceId: state.currentWorkspaceId }), 
    }
  )
);
