import { create } from 'zustand';
import { Task } from '../types';

interface UIState {
  isTaskModalOpen: boolean;
  selectedTask: Task | null;
  openTaskModal: (task: Task) => void;
  closeTaskModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isTaskModalOpen: false,
  selectedTask: null,
  openTaskModal: (task) => set({ isTaskModalOpen: true, selectedTask: task }),
  closeTaskModal: () => set({ isTaskModalOpen: false, selectedTask: null }),
}));
