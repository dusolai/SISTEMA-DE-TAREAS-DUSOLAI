import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { Workspace } from '../../../types';
import { useUIStore } from '../../../store/uiStore';

export const useWorkspaces = () => {
    const queryClient = useQueryClient();
    const { currentWorkspaceId, setWorkspace } = useUIStore();

    // 1. LEER (READ)
    const { data: workspaces, isLoading } = useQuery<Workspace[]>({
        queryKey: ['workspaces'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('workspaces')
                .select('*')
                .order('created_at', { ascending: true });
            if (error) throw new Error(error.message);
            return data || [];
        }
    });

    // 2. CREAR (CREATE)
    const createWorkspace = useMutation({
        mutationFn: async (name: string) => {
            const { data, error } = await supabase.from('workspaces').insert([{ name }]).select().single();
            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: (newWs) => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
            // Opcional: Seleccionar el nuevo automáticamente
            setWorkspace(newWs.id);
        }
    });

    // 3. EDITAR (UPDATE)
    const updateWorkspace = useMutation({
        mutationFn: async ({ id, name }: { id: string, name: string }) => {
            const { error } = await supabase.from('workspaces').update({ name }).eq('id', id);
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        }
    });

    // 4. BORRAR (DELETE)
    const deleteWorkspace = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('workspaces').delete().eq('id', id);
            if (error) throw new Error(error.message);
        },
        onSuccess: (_, deletedId) => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
            // Si borramos el que estábamos usando, deseleccionarlo
            if (currentWorkspaceId === deletedId) {
                setWorkspace(null);
            }
        }
    });

    return { workspaces, isLoading, createWorkspace, updateWorkspace, deleteWorkspace };
};
