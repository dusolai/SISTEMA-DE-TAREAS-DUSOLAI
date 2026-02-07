import { create } from 'zustand';
import { Task } from '../types';

interface UIState {
    theme: 'light' | 'dark';
    isWorkspaceManagerOpen: boolean;
    isTaskModalOpen: boolean;
    currentWorkspaceId: string | null;
    selectedTask: Task | null; // Usamos este nombre consistentemente

    toggleTheme: () => void;
    openWorkspaceManager: () => void;
    closeWorkspaceManager: () => void;
    
    openTaskModal: (task?: Task) => void;
    closeTaskModal: () => void;
    
    setWorkspace: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
    theme: 'light',
    isWorkspaceManagerOpen: false,
    isTaskModalOpen: false,
    currentWorkspaceId: null,
    selectedTask: null,

    toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        return { theme: newTheme };
    }),

    openWorkspaceManager: () => set({ isWorkspaceManagerOpen: true }),
    closeWorkspaceManager: () => set({ isWorkspaceManagerOpen: false }),

    openTaskModal: (task) => set({ 
        isTaskModalOpen: true, 
        selectedTask: task || null // Guardamos la tarea aquí
    }),
    
    closeTaskModal: () => set({ 
        isTaskModalOpen: false, 
        selectedTask: null 
    }),

    setWorkspace: (id) => set({ currentWorkspaceId: id }),
}));