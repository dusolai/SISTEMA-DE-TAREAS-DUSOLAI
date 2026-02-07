import { create } from 'zustand';
import { supabase } from '../../../services/supabase';
import { Task, HistoryEvent } from '../../../types';
import useAuthStore from '../../../store/authStore';

interface TasksState {
    tasks: Task[];
    isLoading: boolean;
    fetchTasks: (workspaceId: string) => Promise<void>;
    createTask: (task: Omit<Task, 'id' | 'created_at' | 'history' | 'updated_at'>) => Promise<void>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
}

// Helper para generar el mensaje del commit
const generateCommitMessage = (updates: Partial<Task>, oldTask?: Task): string => {
    const changes: string[] = [];
    
    if (updates.status && oldTask && updates.status !== oldTask.status) {
        const statusMap: Record<string, string> = { todo: 'Pendiente', doing: 'En Curso', review: 'Revisión', done: 'Hecho' };
        changes.push(`Estado: ${statusMap[oldTask.status]} -> ${statusMap[updates.status]}`);
    }
    if (updates.priority && oldTask && updates.priority !== oldTask.priority) {
        changes.push(`Prioridad: ${oldTask.priority} -> ${updates.priority}`);
    }
    if (updates.title && oldTask && updates.title !== oldTask.title) {
        changes.push(`Título modificado`);
    }
    if (updates.description && oldTask && updates.description !== oldTask.description) {
        changes.push(`Descripción actualizada`);
    }
    
    if (changes.length === 0) return "Actualización general";
    return changes.join(" | ");
};

const useTasks = create<TasksState>((set, get) => ({
    tasks: [],
    isLoading: false,

    fetchTasks: async (workspaceId) => {
        set({ isLoading: true });
        // CORREGIDO: Usamos 'order' que es tu campo real
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('workspace_id', workspaceId)
            .order('order', { ascending: true });

        if (error) console.error('Error fetching tasks:', error);
        else set({ tasks: data || [] });
        set({ isLoading: false });
    },

    createTask: async (newTaskData) => {
        const user = useAuthStore.getState().session?.user;
        if (!user) return;

        // 1. Crear evento inicial (Creation Commit)
        const initialHistory: HistoryEvent[] = [{
            id: crypto.randomUUID(),
            action: 'creation',
            details: 'Tarea creada en el sistema',
            timestamp: new Date().toISOString(),
            user_email: user.email
        }];

        const taskToInsert = {
            ...newTaskData,
            user_id: user.id, // Asegura compatibilidad si tu tabla usa user_id
            created_by: user.id, // Tu campo personalizado
            history: initialHistory, 
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            progress: 0 // Valor por defecto
        };

        const { data, error } = await supabase
            .from('tasks')
            .insert([taskToInsert])
            .select()
            .single();

        if (error) {
            console.error('Error creating task:', error);
            return;
        }

        set((state) => ({ tasks: [...state.tasks, data] }));
    },

    updateTask: async (id, updates) => {
        const currentTasks = get().tasks;
        const oldTask = currentTasks.find(t => t.id === id);
        const user = useAuthStore.getState().session?.user;
        
        if (!oldTask) return;

        // 2. Generar Commit de Cambio solo si hay cambios relevantes
        let updatedHistory = oldTask.history || [];
        
        // Si es una actualización de orden (drag & drop), a veces no queremos llenar el historial,
        // pero aquí lo dejaremos genérico. Puedes filtrar si updates.order existe.
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

        const finalUpdates = {
            ...updates,
            history: updatedHistory,
            updated_at: new Date().toISOString()
        };

        // Optimistic Update
        set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...finalUpdates } : t)),
        }));

        const { error } = await supabase
            .from('tasks')
            .update(finalUpdates)
            .eq('id', id);

        if (error) {
            console.error('Error updating task:', error);
            set({ tasks: currentTasks }); // Revertir si falla
        }
    },

    deleteTask: async (id) => {
        set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== id),
        }));
        await supabase.from('tasks').delete().eq('id', id);
    },
}));

export default useTasks;