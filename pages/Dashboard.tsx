import React, { useEffect, useState } from 'react';
import KanbanBoard from '../features/kanban/components/KanbanBoard';
import AudioRecorder from '../features/audio/components/AudioRecorder';
import TaskModal from '../features/kanban/components/TaskModal';
import WorkspaceManager from '../features/kanban/components/WorkspaceManager';
import useAuthStore from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useWorkspaces } from '../features/kanban/hooks/useWorkspaces';
import useTasks from '../features/kanban/hooks/useTasks'; // <--- 1. IMPORTAR HOOK DE TAREAS
import { supabase } from '../services/supabase';
import { LogOut, Sun, Moon, Briefcase, Settings, ChevronUp, ChevronDown, Mic, Plus, Download } from 'lucide-react'; // <--- 2. IMPORTAR ICONO DOWNLOAD

const Dashboard: React.FC = () => {
    const session = useAuthStore((state) => state.session);
    const { toggleTheme, currentWorkspaceId, setWorkspace, openWorkspaceManager, openTaskModal } = useUIStore();

    const [isAudioDrawerOpen, setIsAudioDrawerOpen] = useState(false);
    const { workspaces, isLoading: isLoadingWS } = useWorkspaces();
    
    // 3. OBTENER LAS TAREAS DEL WORKSPACE ACTUAL
    const { tasks } = useTasks(); 

    useEffect(() => {
        if (!currentWorkspaceId && workspaces && workspaces.length > 0) {
            setWorkspace(workspaces[0].id);
        }
    }, [currentWorkspaceId, workspaces, setWorkspace]);

    // 4. FUNCIÓN PARA GENERAR Y DESCARGAR CSV
    const handleExportCSV = () => {
        if (!tasks || tasks.length === 0) {
            alert("No hay tareas para exportar en este tablero.");
            return;
        }

        // Definir las columnas del CSV
        const headers = [
            'ID', 
            'Título', 
            'Estado', 
            'Prioridad', 
            'Progreso', 
            'Descripción', 
            'Fecha Creación', 
            'Subtareas (Total)', 
            'Subtareas (Completadas)'
        ];

        // Procesar cada fila
        const rows = tasks.map(task => {
            const subtasks = task.ai_extracted?.suggested_subtasks || [];
            const completedSubtasks = subtasks.filter(s => s.completed).length;
            
            // Función auxiliar para escapar comillas dobles y evitar romper el CSV
            const escape = (text: string | null | undefined) => {
                if (!text) return '""';
                return `"${text.toString().replace(/"/g, '""')}"`; // Escapa comillas dobles estilo Excel
            };

            return [
                escape(task.id),
                escape(task.title),
                escape(task.status),
                escape(task.priority),
                `"${task.progress}%"`,
                escape(task.description),
                escape(new Date(task.created_at).toLocaleDateString()),
                subtasks.length,
                completedSubtasks
            ].join(',');
        });

        // Unir cabeceras y filas con saltos de línea
        const csvContent = [headers.join(','), ...rows].join('\n');
        
        // Crear el Blob y el link de descarga
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Nombre del archivo con fecha y nombre del workspace (si existe)
        const wsName = workspaces?.find(w => w.id === currentWorkspaceId)?.name || 'tablero';
        link.setAttribute('download', `tareas_${wsName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
            
            {/* Header */}
            <header className="flex-shrink-0 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors duration-300 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4 sm:gap-6">
                            <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-500 tracking-wider hidden sm:block">
                                DUSOLAI
                            </h1>
                            <div className="flex items-center gap-2">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Briefcase size={16} />
                                    </div>
                                    <select
                                        value={currentWorkspaceId || ''}
                                        onChange={(e) => setWorkspace(e.target.value)}
                                        className="pl-10 pr-8 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer appearance-none min-w-[160px] sm:min-w-[180px]"
                                        disabled={isLoadingWS}
                                    >
                                        {isLoadingWS ? (
                                            <option>Cargando...</option>
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
                                
                                {/* BOTÓN EXPORTAR CSV (NUEVO) */}
                                <button 
                                    onClick={handleExportCSV} 
                                    disabled={!currentWorkspaceId || !tasks || tasks.length === 0}
                                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                                    title="Exportar tareas a CSV"
                                >
                                    <Download size={18} />
                                </button>

                                {/* Botón Configuración */}
                                <button onClick={openWorkspaceManager} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors" title="Gestionar Negocios">
                                    <Settings size={18} />
                                </button>

                                {/* BOTÓN NUEVA TAREA */}
                                <button 
                                    onClick={() => openTaskModal()} 
                                    disabled={!currentWorkspaceId}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus size={18} />
                                    <span className="hidden sm:inline">Nueva</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-600 dark:text-gray-400 text-sm hidden md:block">
                                {session?.user?.email}
                            </span>
                            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <Sun className="h-5 w-5 hidden dark:block" />
                                <Moon className="h-5 w-5 dark:hidden" />
                            </button>
                            <button onClick={() => supabase.auth.signOut()} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/20 dark:hover:text-red-400 transition-all">
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-hidden p-4 md:p-6 bg-gray-50 dark:bg-gray-950/50 transition-colors duration-300 pb-[50px]">
                {currentWorkspaceId ? (
                    <div className="h-full w-full">
                        <KanbanBoard />
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 h-full items-center justify-center text-gray-500">
                        <p>No tienes ningún espacio de trabajo seleccionado.</p>
                        <button onClick={openWorkspaceManager} className="text-indigo-400 hover:underline">
                            Crear uno nuevo
                        </button>
                    </div>
                )}
            </main>
            
            <TaskModal />
            <WorkspaceManager />

            <footer className={`fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-5px_20px_rgba(0,0,0,0.3)] transition-all duration-300 ease-in-out transform ${isAudioDrawerOpen ? 'translate-y-0' : 'translate-y-[calc(100%-40px)]'}`} style={{ maxHeight: isAudioDrawerOpen ? '400px' : '40px' }}>
                <div onClick={() => setIsAudioDrawerOpen(!isAudioDrawerOpen)} className="h-[40px] flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <Mic size={16} className="text-indigo-500 mr-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mr-2">
                        {isAudioDrawerOpen ? 'Ocultar Grabadora' : 'Dictar Tarea'}
                    </span>
                    {isAudioDrawerOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
                </div>
                <div className={`overflow-hidden transition-opacity duration-300 ${isAudioDrawerOpen ? 'opacity-100 visible' : 'opacity-0 invisible h-0'}`}>
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800/50">
                        <AudioRecorder />
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Dashboard;
