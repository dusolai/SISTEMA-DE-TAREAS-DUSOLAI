
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { Task } from '../../../types';
import { useEffect } from 'react';

const useTasks = () => {
    const queryClient = useQueryClient();
    const queryKey = ['tasks'];

    // Fetch tasks
    const { data: tasks, isLoading } = useQuery<Task[]>({
        queryKey,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .order('order', { ascending: true });
            if (error) throw new Error(error.message);
            return data || [];
        },
    });

    // Real-time subscription
    useEffect(() => {
        const channel = supabase
            .channel('public:tasks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
                queryClient.invalidateQueries({ queryKey });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);
    
    // Create task
    const createTaskMutation = useMutation({
        mutationFn: async (newTask: Partial<Task>) => {
            const { data, error } = await supabase.from('tasks').insert([newTask]).select();
            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    // Update task
    const updateTaskMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: Partial<Task> }) => {
            const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select();
            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });
    
    // Reorder tasks (placeholder)
    const reorderTasksMutation = useMutation({
        mutationFn: async (variables: { taskId: string, newStatus: string, newOrder: number }) => {
            // This would call the `reorder_tasks` RPC function defined in the SQL schema
            const { error } = await supabase.rpc('reorder_tasks', {
                p_task_id: variables.taskId,
                p_new_status: variables.newStatus,
                p_new_order: variables.newOrder,
            });
            if (error) throw new Error(error.message);
            return null;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });


    return { tasks, isLoading, createTaskMutation, updateTaskMutation, reorderTasksMutation };
};

export default useTasks;
