import React, { useEffect, useState } from 'react';
import KanbanBoard from '../features/kanban/components/KanbanBoard';
import AudioRecorder from '../features/audio/components/AudioRecorder';
import TaskModal from '../features/kanban/components/TaskModal';
import WorkspaceManager from '../features/kanban/components/WorkspaceManager';
import useAuthStore from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useWorkspaces } from '../features/kanban/hooks/useWorkspaces';
import useTasks from '../features/kanban/hooks/useTasks'; // Asegúrate de que useTasks tenga fetchTasks
import { generateProjectReportData } from '../services/geminiService';
import { supabase } from '../services/supabase';
import { jsPDF } from 'jspdf';
import { LogOut, Sun, Moon, Briefcase, Settings, ChevronUp, ChevronDown, Mic, Plus, Loader2, Sparkles } from 'lucide-react';

const Dashboard: React.FC = () => {
    const session = useAuthStore((state) => state.session);
    // IMPORTANTE: Traemos 'theme' del store para sincronizar el modo oscuro
    const { theme, toggleTheme, currentWorkspaceId, setWorkspace, openWorkspaceManager, openTaskModal } = useUIStore();
    
    const [isAudioDrawerOpen, setIsAudioDrawerOpen] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    
    const { workspaces, isLoading: isLoadingWS } = useWorkspaces();
    // IMPORTANTE: fetchTasks es vital para que no salga la pantalla blanca
    const { tasks, fetchTasks } = useTasks();

    // 1. SINCRONIZAR TEMA (Arregla que se vea blanco cuando debe ser negro)
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    // 2. SELECCIONAR WORKSPACE POR DEFECTO
    useEffect(() => {
        if (!currentWorkspaceId && workspaces && workspaces.length > 0) {
            setWorkspace(workspaces[0].id);
        }
    }, [currentWorkspaceId, workspaces, setWorkspace]);

    // 3. CARGAR TAREAS (Arregla la pantalla vacía de datos)
    useEffect(() => {
        if (currentWorkspaceId) {
            fetchTasks(currentWorkspaceId);
        }
    }, [currentWorkspaceId, fetchTasks]);

    // Función auxiliar para limpiar textos del PDF
    const cleanText = (text: any): string => {
        if (!text) return "";
        return String(text).replace(/[^\x20-\x7E\xA0-\xFF\u20AC\n\r]/g, "").trim(); 
    };

    const handleGeneratePDF = async () => {
        if (!tasks || tasks.length === 0) {
            alert("No hay tareas para analizar.");
            return;
        }
        
        setIsGeneratingReport(true);
        try {
            const wsName = workspaces?.find(w => w.id === currentWorkspaceId)?.name || 'Proyecto';
            const aiData = await generateProjectReportData(tasks, wsName);
            
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            let y = 20;

            const checkPageBreak = (spaceNeeded: number) => {
                if (y + spaceNeeded > pageHeight - 20) {
                    doc.addPage();
                    y = 20;
                    return true;
                }
                return false;
            };

            // HEADER PDF
            doc.setFontSize(20);
            doc.setTextColor(50, 50, 50);
            doc.setFont("helvetica", "bold");
            doc.text("INFORME DE SITUACION - DUSOLAI", 20, y);
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100);
            doc.text(`Fecha: ${new Date().toLocaleDateString()} | Proyecto: ${cleanText(wsName)}`, 20, y + 6);
            y += 20;
            doc.setDrawColor(200);
            doc.line(20, y, pageWidth - 20, y);
            y += 15;

            // 1. RESUMEN EJECUTIVO
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text("1. RESUMEN EJECUTIVO", 20, y);
            y += 10;
            doc.setFontSize(10);
            doc.setTextColor(60);
            const summaryLines = doc.splitTextToSize(cleanText(aiData.executive_summary), 170);
            doc.text(summaryLines, 20, y);
            y += (summaryLines.length * 5) + 15;

            // 2. AUDITORÍA
            checkPageBreak(50);
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text("2. AUDITORIA DETALLADA", 20, y);
            y += 15;

            const tasksToPrint = (aiData.analyzed_tasks && aiData.analyzed_tasks.length > 0) 
                                ? aiData.analyzed_tasks 
                                : tasks.map(t => ({ original_title: t.title, ai_audit: "Sin analisis disponible", smart_priority: t.priority }));

            tasksToPrint.forEach((task: any, index: number) => {
                const originalTask = tasks.find(t => t.title === task.original_title);
                const createdDate = originalTask ? new Date(originalTask.created_at).toLocaleDateString() : "-";
                
                doc.setFontSize(11);
                doc.setFont("helvetica", "bold");
                const titleLines = doc.splitTextToSize(`${index + 1}. ${cleanText(task.original_title)}`, 160);
                
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                const auditLines = doc.splitTextToSize(`Analisis: ${cleanText(task.ai_audit)}`, 160);
                
                const boxHeight = (titleLines.length * 5) + (auditLines.length * 5) + 25;
                checkPageBreak(boxHeight);

                doc.setDrawColor(200);
                doc.setFillColor(250, 250, 250);
                doc.rect(20, y, 170, boxHeight, 'FD');

                let cy = y + 6;
                doc.setTextColor(0);
                doc.setFont("helvetica", "bold");
                doc.text(titleLines, 25, cy);
                cy += (titleLines.length * 5) + 4;

                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.setTextColor(100);
                doc.text(`Creado: ${createdDate} | Prioridad Sugerida: ${cleanText(task.smart_priority)}`, 25, cy);
                cy += 6;

                doc.setFontSize(10);
                doc.setTextColor(50);
                doc.text(auditLines, 25, cy);

                y += boxHeight + 5;
            });

            doc.save(`Informe_Dusolai_${wsName.replace(/\s+/g, '_')}.pdf`);

        } catch (error) {
            console.error("Error PDF:", error);
            alert("Error al generar PDF.");
        } finally {
            setIsGeneratingReport(false);
        }
    };

    return (
        // CORRECCIÓN CRÍTICA: Quitamos '/50' para volver a colores SÓLIDOS y arreglar el contraste
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
            
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
                                <button 
                                    onClick={handleGeneratePDF} 
                                    disabled={isGeneratingReport || !currentWorkspaceId || !tasks || tasks.length === 0}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-indigo-500"
                                >
                                    {isGeneratingReport ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    <span className="hidden sm:inline">Informe PDF</span>
                                </button>
                                <button onClick={openWorkspaceManager} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-indigo-500"><Settings size={18} /></button>
                                <button onClick={() => openTaskModal()} disabled={!currentWorkspaceId} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-md"><Plus size={18} /><span className="hidden sm:inline">Nueva</span></button>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-600 dark:text-gray-400 text-sm hidden md:block">{session?.user?.email}</span>
                            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <Sun className="h-5 w-5 hidden dark:block" />
                                <Moon className="h-5 w-5 dark:hidden" />
                            </button>
                            <button onClick={() => supabase.auth.signOut()} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-red-500"><LogOut className="h-5 w-5" /></button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-hidden p-4 md:p-6 bg-gray-50 dark:bg-gray-950 transition-colors duration-300 pb-[50px]">
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
