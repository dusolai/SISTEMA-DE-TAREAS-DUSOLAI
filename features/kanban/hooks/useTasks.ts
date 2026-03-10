import { create } from 'zustand';
import { supabase } from '../../../services/supabase';
import { Task, HistoryEvent } from '../../../types';
import useAuthStore from '../../../store/authStore';

interface TasksState {
    tasks: Task[];
    isLoading: boolean;
    fetchTasks: (workspaceId: string) => Promise<void>;
    fetchAllTasks: () => Promise<Task[]>;
    createTask: (task: Omit<Task, 'id' | 'created_at' | 'history' | 'updated_at'>) => Promise<boolean>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<boolean>;
    deleteTask: (id: string) => Promise<void>;
    scheduleTask: (id: string, scheduledAt: string | null) => Promise<void>;
    addScheduleSlot: (id: string, isoString: string) => Promise<void>;
    removeScheduleSlot: (id: string, isoString: string) => Promise<void>;
    startWorkSession: (taskId: string) => Promise<boolean>;
    stopWorkSession: (taskId: string, comment: string) => Promise<boolean>;
    globalActiveTasks: Task[];
    fetchGlobalActiveTasks: () => Promise<void>;
}

const generateCommitMessage = (updates: Partial<Task>, oldTask?: Task): string => {
    const changes: string[] = [];
    if (updates.status && oldTask && updates.status !== oldTask.status) changes.push(`Estado: ${oldTask.status} -> ${updates.status}`);
    if (updates.priority && oldTask && updates.priority !== oldTask.priority) changes.push(`Prioridad: ${oldTask.priority} -> ${updates.priority}`);
    if (updates.title) changes.push(`Título editado`);
    return changes.length ? changes.join(" | ") : "Actualización";
};

const useTasks = create<TasksState>((set, get) => ({
    tasks: [],
    globalActiveTasks: [],
    isLoading: false,

    fetchTasks: async (workspaceId) => {
        set({ isLoading: true });
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('order', { ascending: true });

            if (error) throw error;
            set({ tasks: data || [] });
        } catch (error) {
            console.error('Error fetching tasks:', error);
            set({ tasks: [] });
        } finally {
            set({ isLoading: false });
        }
    },

    createTask: async (newTaskData) => {
        const user = useAuthStore.getState().session?.user;
        if (!user) {
            console.error('No user session found during task creation');
            return false;
        }

        console.log('Attempting to create task with data:', newTaskData);

        const initialHistory: HistoryEvent[] = [{
            id: crypto.randomUUID(),
            action: 'creation',
            details: 'Tarea creada',
            timestamp: new Date().toISOString(),
            user_email: user.email
        }];

        const taskToInsert = {
            ...newTaskData,
            created_by: user.id,
            history: initialHistory,
            updated_at: new Date().toISOString(),
            progress: 0
        };

        try {
            const { data, error } = await supabase.from('tasks').insert([taskToInsert]).select().single();
            if (error) {
                console.error('Supabase error during createTask:', {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                });
                alert(`Error Supabase (${error.code}): ${error.message}\n${error.details || ''}`);
                return false;
            }
            console.log('Task created successfully:', data);
            set((state) => ({ tasks: [...state.tasks, data] }));
            return true;
        } catch (e) {
            console.error('Unexpected error in createTask:', e);
            return false;
        }
    },

    updateTask: async (id, updates) => {
        const currentTasks = get().tasks;
        const oldTask = currentTasks.find(t => t.id === id);
        const user = useAuthStore.getState().session?.user;
        if (!oldTask) {
            console.error('Task not found for update:', id);
            return false;
        }

        console.log(`Attempting to update task ${id} with updates:`, updates);

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

        try {
            const { error } = await supabase.from('tasks').update(finalUpdates).eq('id', id);
            if (error) {
                console.error('Supabase error during updateTask:', {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                });
                alert(`Error Supabase (${error.code}): ${error.message}\n${error.details || ''}`);
                return false;
            }

            set((state) => ({
                tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...finalUpdates } : t)),
                globalActiveTasks: state.globalActiveTasks.map((t) => (t.id === id ? { ...t, ...finalUpdates } : t))
            }));
            console.log('Task updated successfully');
            return true;
        } catch (e) {
            console.error('Unexpected error in updateTask:', e);
            return false;
        }
    },

    deleteTask: async (id) => {
        set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== id),
            globalActiveTasks: state.globalActiveTasks.filter((t) => t.id !== id)
        }));
        await supabase.from('tasks').delete().eq('id', id);
    },

    scheduleTask: async (id, scheduledAt) => {
        set((state) => ({
            tasks: state.tasks.map((t) =>
                t.id === id ? { ...t, scheduled_at: scheduledAt } : t
            ),
        }));
        await supabase.from('tasks').update({ scheduled_at: scheduledAt }).eq('id', id);
    },

    fetchAllTasks: async () => {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching all tasks:', error);
            return [];
        }
    },

    fetchGlobalActiveTasks: async () => {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .not('work_sessions', 'is', null);

            if (error) throw error;

            const active = (data || []).filter(t =>
                t.work_sessions?.some(s => s.ended_at === null)
            );
            set({ globalActiveTasks: active });
        } catch (error) {
            console.error('Error fetching global active tasks:', error);
        }
    },

    addScheduleSlot: async (id, isoString) => {
        const task = get().tasks.find(t => t.id === id);
        const currentSlots = task?.scheduled_slots || (task?.scheduled_at ? [task.scheduled_at] : []);
        // Don't duplicate
        if (currentSlots.includes(isoString)) return;
        const newSlots = [...currentSlots, isoString];
        set((state) => ({
            tasks: state.tasks.map((t) =>
                t.id === id ? { ...t, scheduled_slots: newSlots, scheduled_at: newSlots[0] || null } : t
            ),
        }));
        await supabase.from('tasks').update({ scheduled_slots: newSlots, scheduled_at: newSlots[0] || null }).eq('id', id);
    },

    removeScheduleSlot: async (id, isoString) => {
        const task = get().tasks.find(t => t.id === id);
        const currentSlots = task?.scheduled_slots || (task?.scheduled_at ? [task.scheduled_at] : []);
        const newSlots = currentSlots.filter(s => s !== isoString);
        set((state) => ({
            tasks: state.tasks.map((t) =>
                t.id === id ? { ...t, scheduled_slots: newSlots, scheduled_at: newSlots[0] || null } : t
            ),
        }));
        await supabase.from('tasks').update({ scheduled_slots: newSlots, scheduled_at: newSlots[0] || null }).eq('id', id);
    },

    startWorkSession: async (taskId) => {
        const task = get().tasks.find(t => t.id === taskId);
        const user = useAuthStore.getState().session?.user;
        if (!task || !user) return false;

        const newSession = {
            id: crypto.randomUUID(),
            started_at: new Date().toISOString(),
            ended_at: null,
            duration_seconds: 0,
            user_email: user.email
        };

        const updatedSessions = [...(task.work_sessions || []), newSession];
        const updatedTask = { ...task, work_sessions: updatedSessions };

        set((state) => ({
            tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t),
            globalActiveTasks: [...state.globalActiveTasks.filter(t => t.id !== taskId), updatedTask]
        }));

        const { error } = await supabase.from('tasks').update({ work_sessions: updatedSessions }).eq('id', taskId);
        if (error) {
            console.error('Error starting work session:', error);
            return false;
        }
        return true;
    },

    stopWorkSession: async (taskId, comment) => {
        let task = get().tasks.find(t => t.id === taskId);
        if (!task) {
            task = get().globalActiveTasks.find(t => t.id === taskId);
        }
        if (!task) return false;

        const sessions = task.work_sessions || [];
        const activeSessionIndex = sessions.findIndex(s => s.ended_at === null);

        if (activeSessionIndex === -1) return false;

        const activeSession = sessions[activeSessionIndex];
        const endedAt = new Date().toISOString();
        const durationSeconds = Math.floor((new Date(endedAt).getTime() - new Date(activeSession.started_at).getTime()) / 1000);

        const updatedSession = {
            ...activeSession,
            ended_at: endedAt,
            duration_seconds: durationSeconds,
            comment
        };

        const updatedSessions = [...sessions];
        updatedSessions[activeSessionIndex] = updatedSession;

        const totalWorkSeconds = (task.total_work_seconds || 0) + durationSeconds;

        const updatedTask = { ...task, work_sessions: updatedSessions, total_work_seconds: totalWorkSeconds };

        set((state) => ({
            tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t),
            globalActiveTasks: state.globalActiveTasks.filter(t => t.id !== taskId)
        }));

        const { error } = await supabase.from('tasks').update({
            work_sessions: updatedSessions,
            total_work_seconds: totalWorkSeconds
        }).eq('id', taskId);

        if (error) {
            console.error('Error stopping work session:', error);
            return false;
        }
        return true;
    },
}));

export default useTasks;