import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { Task, Workspace } from '../../../types';
import { useUIStore } from '../../../store/uiStore'; // Importamos el store
import { useEffect } from 'react';

// Hook para gestionar Workspaces (Negocios)
export const useWorkspaces = () => {
    return useQuery<Workspace[]>({
        queryKey: ['workspaces'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('workspaces')
                .select('*')
                .order('name', { ascending: true });
            if (error) throw new Error(error.message);
            return data || [];
        }
    });
};

const useTasks = () => {
    const queryClient = useQueryClient();
    const { currentWorkspaceId } = useUIStore(); // Leemos el workspace actual
    
    // La clave de la query ahora incluye el workspace ID para refrescar al cambiar
    const queryKey = ['tasks', currentWorkspaceId];

    // Fetch tasks (FILTRADAS POR WORKSPACE)
    const { data: tasks, isLoading } = useQuery<Task[]>({
        queryKey,
        queryFn: async () => {
            // Si no hay workspace seleccionado, no cargamos nada
            if (!currentWorkspaceId) return [];

            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('workspace_id', currentWorkspaceId) // <--- EL FILTRO CLAVE
                .order('order', { ascending: true });
            
            if (error) throw new Error(error.message);
            return data || [];
        },
        enabled: !!currentWorkspaceId, // Solo ejecuta si hay un ID seleccionado
    });

    // Real-time subscription
    useEffect(() => {
        if (!currentWorkspaceId) return;

        const channel = supabase
            .channel(`public:tasks:ws:${currentWorkspaceId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'tasks',
                filter: `workspace_id=eq.${currentWorkspaceId}` // Solo escuchamos cambios de este negocio
            }, () => {
                queryClient.invalidateQueries({ queryKey });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient, currentWorkspaceId]);
    
    // Create task (Asigna automáticamente el workspace actual)
    const createTaskMutation = useMutation({
        mutationFn: async (newTask: Partial<Task>) => {
            // Aseguramos que se guarde en el workspace activo
            const taskWithWorkspace = {
                ...newTask,
                workspace_id: currentWorkspaceId
            };
            const { data, error } = await supabase.from('tasks').insert([taskWithWorkspace]).select();
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
    
    // Reorder tasks (Sin cambios funcionales, solo mantenemos la estructura)
    const reorderTasksMutation = useMutation({
        mutationFn: async (variables: { taskId: string, newStatus: string, newOrder: number }) => {
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
