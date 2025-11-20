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
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Modal
      isTaskModalOpen: false,
      selectedTask: null,
      openTaskModal: (task) => set({ isTaskModalOpen: true, selectedTask: task }),
      closeTaskModal: () => set({ isTaskModalOpen: false, selectedTask: null }),

      // Tema (Por defecto oscuro)
      theme: 'dark',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'dusolai-ui-storage', // Nombre único para localStorage
      partialize: (state) => ({ theme: state.theme }), // Solo guardamos el tema, no el estado del modal
    }
  )
);
