import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { Task } from '../../../types';
import { useUIStore } from '../../../store/uiStore';
import { useEffect } from 'react';

const useTasks = () => {
    const queryClient = useQueryClient();
    const { currentWorkspaceId } = useUIStore(); 
    
    const queryKey = ['tasks', currentWorkspaceId];

    // Fetch tasks
    const { data: tasks, isLoading } = useQuery<Task[]>({ 
        queryKey,
        queryFn: async () => {
            if (!currentWorkspaceId) return [];
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('workspace_id', currentWorkspaceId)
                .order('order', { ascending: true });
            
            if (error) throw new Error(error.message);
            return data || [];
        },
        enabled: !!currentWorkspaceId,
    });

    // Real-time subscription
    useEffect(() => {
        if (!currentWorkspaceId) return;
        const channel = supabase
            .channel(`public:tasks:ws:${currentWorkspaceId}`)
            .on('postgres_changes', { 
                event: '*', schema: 'public', table: 'tasks', filter: `workspace_id=eq.${currentWorkspaceId}` 
            }, () => queryClient.invalidateQueries({ queryKey }))
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [queryClient, currentWorkspaceId]);
    
    // Create task
    const createTaskMutation = useMutation({
        mutationFn: async (newTask: Partial<Task>) => {
            const taskWithWorkspace = { ...newTask, workspace_id: currentWorkspaceId };
            const { data, error } = await supabase.from('tasks').insert([taskWithWorkspace]).select();
            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    // Update task
    const updateTaskMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: Partial<Task> }) => {
            const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select();
            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });
    
    // DELETE TASK (NUEVO)
    const deleteTaskMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('tasks').delete().eq('id', id);
            if (error) throw new Error(error.message);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });
    
    // Reorder
    const reorderTasksMutation = useMutation({
        mutationFn: async (variables: { taskId: string, newStatus: string, newOrder: number }) => {
            const { error } = await supabase.rpc('reorder_tasks', {
                p_task_id: variables.taskId, p_new_status: variables.newStatus, p_new_order: variables.newOrder,
            });
            if (error) throw new Error(error.message);
            return null;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    return { tasks, isLoading, createTaskMutation, updateTaskMutation, reorderTasksMutation, deleteTaskMutation };
};

export default useTasks;
