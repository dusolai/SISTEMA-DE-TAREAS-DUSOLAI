import { create } from 'zustand';
import { Task } from '../types';

interface UIState {
    theme: 'light' | 'dark';
    isWorkspaceManagerOpen: boolean;
    isTaskModalOpen: boolean;
    currentWorkspaceId: string | null;
    taskModalData: Task | null; // <--- RESTAURADO: Nombre original

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
    taskModalData: null,

    toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        return { theme: newTheme };
    }),

    openWorkspaceManager: () => set({ isWorkspaceManagerOpen: true }),
    closeWorkspaceManager: () => set({ isWorkspaceManagerOpen: false }),

    openTaskModal: (task) => set({ 
        isTaskModalOpen: true, 
        taskModalData: task || null 
    }),
    
    closeTaskModal: () => set({ 
        isTaskModalOpen: false, 
        taskModalData: null 
    }),

    setWorkspace: (id) => set({ currentWorkspaceId: id }),
}));