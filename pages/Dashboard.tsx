import React, { useEffect } from 'react';
import KanbanBoard from '../features/kanban/components/KanbanBoard';
import AudioRecorder from '../features/audio/components/AudioRecorder';
import TaskModal from '../features/kanban/components/TaskModal';
import useAuthStore from '../store/authStore';
import { useUIStore } from '../store/uiStore'; 
import { useWorkspaces } from '../features/kanban/hooks/useTasks'; // Importamos el hook nuevo
import { supabase } from '../services/supabase';
import { LogOut, Sun, Moon, Briefcase } from 'lucide-react';

const Dashboard: React.FC = () => {
    const session = useAuthStore((state) => state.session);
    const { toggleTheme, currentWorkspaceId, setWorkspace } = useUIStore();
    
    // Cargamos los workspaces desde Supabase
    const { data: workspaces, isLoading: isLoadingWS } = useWorkspaces();

    // Efecto: Si no hay workspace seleccionado y ya cargaron, seleccionamos el primero por defecto
    useEffect(() => {
        if (!currentWorkspaceId && workspaces && workspaces.length > 0) {
            setWorkspace(workspaces[0].id);
        }
    }, [currentWorkspaceId, workspaces, setWorkspace]);

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            {/* Header */}
            <header className="flex-shrink-0 bg-white dark:bg-gray-900 shadow-md border-b border-gray-200 dark:border-gray-800 transition-colors duration-300 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        
                        {/* Logo + Selector de Workspace */}
                        <div className="flex items-center gap-6">
                            <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-500 tracking-wider hidden sm:block">
                                DUSOLAI
                            </h1>
                            
                            {/* SELECTOR DE NEGOCIO / WORKSPACE */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Briefcase size={16} />
                                </div>
                                <select 
                                    value={currentWorkspaceId || ''}
                                    onChange={(e) => setWorkspace(e.target.value)}
                                    className="pl-10 pr-8 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer appearance-none min-w-[180px]"
                                    disabled={isLoadingWS}
                                >
                                    {isLoadingWS ? (
                                        <option>Cargando empresas...</option>
                                    ) : workspaces?.length === 0 ? (
                                        <option>Sin empresas</option>
                                    ) : (
                                        workspaces?.map(ws => (
                                            <option key={ws.id} value={ws.id}>
                                                {ws.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>

                        {/* Botones de Usuario */}
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-600 dark:text-gray-400 text-sm hidden md:block">
                                {session?.user?.email}
                            </span>
                            <button 
                                onClick={toggleTheme} 
                                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <Sun className="h-5 w-5 hidden dark:block" />
                                <Moon className="h-5 w-5 dark:hidden" />
                            </button>
                            <button
                                onClick={() => supabase.auth.signOut()}
                                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/20 dark:hover:text-red-400 transition-all"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-950/50 transition-colors duration-300">
                {currentWorkspaceId ? (
                    <KanbanBoard />
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-500">
                        Selecciona un espacio de trabajo para comenzar
                    </div>
                )}
            </main>
            
            <TaskModal />

            {/* Footer con Grabadora */}
            <footer className="flex-shrink-0 p-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-5px_20px_rgba(0,0,0,0.3)] z-10 transition-colors duration-300">
                <AudioRecorder />
            </footer>
        </div>
    );
};

export default Dashboard;
