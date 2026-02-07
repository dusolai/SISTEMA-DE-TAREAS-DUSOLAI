import { create } from 'zustand';
import { supabase } from '../../../services/supabase';
import { Task, HistoryEvent } from '../../../types';
import useAuthStore from '../../../store/authStore';

interface TasksState {
    tasks: Task[];
    isLoading: boolean;
    // IMPORTANTE: Esta función es la que faltaba y causaba el error
    fetchTasks: (workspaceId: string) => Promise<void>;
    createTask: (task: Omit<Task, 'id' | 'created_at' | 'history' | 'updated_at'>) => Promise<void>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
}

const generateCommitMessage = (updates: Partial<Task>, oldTask?: Task): string => {
    const changes: string[] = [];
    if (updates.status && oldTask && updates.status !== oldTask.status) changes.push(`Estado: ${oldTask.status} -> ${updates.status}`);
    if (updates.priority && oldTask && updates.priority !== oldTask.priority) changes.push(`Prioridad: ${oldTask.priority} -> ${updates.priority}`);
    if (updates.title) changes.push(`Título editado`);
    if (updates.description) changes.push(`Descripción editada`);
    return changes.length ? changes.join(" | ") : "Actualización general";
};

const useTasks = create<TasksState>((set, get) => ({
    tasks: [],
    isLoading: false,

    fetchTasks: async (workspaceId) => {
        set({ isLoading: true });
        // Asegúrate de que tu columna en Supabase sea 'order' o 'order_index'
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('workspace_id', workspaceId)
            .order('order', { ascending: true }); // Si falla, cambia 'order' por 'order_index'

        if (error) console.error('Error fetching tasks:', error);
        else set({ tasks: data || [] });
        set({ isLoading: false });
    },

    createTask: async (newTaskData) => {
        const user = useAuthStore.getState().session?.user;
        if (!user) return;

        const initialHistory: HistoryEvent[] = [{
            id: crypto.randomUUID(),
            action: 'creation',
            details: 'Tarea creada',
            timestamp: new Date().toISOString(),
            user_email: user.email
        }];

        const taskToInsert = {
            ...newTaskData,
            user_id: user.id,
            created_by: user.id,
            history: initialHistory,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            progress: 0
        };

        const { data, error } = await supabase.from('tasks').insert([taskToInsert]).select().single();
        if (error) console.error('Error creating task:', error);
        else set((state) => ({ tasks: [...state.tasks, data] }));
    },

    updateTask: async (id, updates) => {
        const currentTasks = get().tasks;
        const oldTask = currentTasks.find(t => t.id === id);
        const user = useAuthStore.getState().session?.user;
        
        if (!oldTask) return;

        // Evitar llenar historial con cambios de orden (drag & drop)
        let updatedHistory = oldTask.history || [];
        if (!updates.order && !updates.progress) {
             const newEvent: HistoryEvent = {
                id: crypto.randomUUID(),
                action: updates.status ? 'status_change' : 'update',
                details: generateCommitMessage(updates, oldTask),
                timestamp: new Date().toISOString(),
                user_email: user?.email
            };
            updatedHistory = [...updatedHistory, newEvent];
        }

        const finalUpdates = { ...updates, history: updatedHistory, updated_at: new Date().toISOString() };

        set((state) => ({ tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...finalUpdates } : t)) }));

        const { error } = await supabase.from('tasks').update(finalUpdates).eq('id', id);
        if (error) {
            console.error('Error updating task:', error);
            set({ tasks: currentTasks }); // Rollback
        }
    },

    deleteTask: async (id) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
        await supabase.from('tasks').delete().eq('id', id);
    },
}));

export default useTasks;