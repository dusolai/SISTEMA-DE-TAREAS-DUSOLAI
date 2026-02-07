import React, { useEffect, useState } from 'react';
import KanbanBoard from '../features/kanban/components/KanbanBoard';
import AudioRecorder from '../features/audio/components/AudioRecorder';
import TaskModal from '../features/kanban/components/TaskModal';
import WorkspaceManager from '../features/kanban/components/WorkspaceManager';
import useAuthStore from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useWorkspaces } from '../features/kanban/hooks/useWorkspaces';
import useTasks from '../features/kanban/hooks/useTasks';
import { generateProjectReportData } from '../services/geminiService';
import { supabase } from '../services/supabase';
import { jsPDF } from 'jspdf';
import { LogOut, Sun, Moon, Briefcase, Settings, ChevronUp, ChevronDown, Mic, Plus, Loader2, Sparkles } from 'lucide-react';

const Dashboard: React.FC = () => {
    const session = useAuthStore((state) => state.session);
    const { theme, toggleTheme, currentWorkspaceId, setWorkspace, openWorkspaceManager, openTaskModal } = useUIStore();
    const [isAudioDrawerOpen, setIsAudioDrawerOpen] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    
    const { workspaces, isLoading: isLoadingWS } = useWorkspaces();
    const { tasks, fetchTasks } = useTasks();

    // Sincronización del tema para evitar parpadeos
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') root.classList.add('dark');
        else root.classList.remove('dark');
    }, [theme]);

    useEffect(() => {
        if (!currentWorkspaceId && workspaces && workspaces.length > 0) {
            setWorkspace(workspaces[0].id);
        }
    }, [currentWorkspaceId, workspaces, setWorkspace]);

    // ESTO CARGA LOS DATOS (Evita pantalla blanca)
    useEffect(() => {
        if (currentWorkspaceId) {
            fetchTasks(currentWorkspaceId);
        }
    }, [currentWorkspaceId, fetchTasks]);

    const cleanText = (text: any) => text ? String(text).replace(/[^\x20-\x7E\xA0-\xFF\u20AC\n\r]/g, "").trim() : "";

    const handleGeneratePDF = async () => {
        if (!tasks || tasks.length === 0) { alert("No hay tareas."); return; }
        setIsGeneratingReport(true);
        try {
            const wsName = workspaces?.find(w => w.id === currentWorkspaceId)?.name || 'Proyecto';
            const aiData = await generateProjectReportData(tasks, wsName);
            const doc = new jsPDF();
            let y = 20;
            const checkPageBreak = (space: number) => { if (y + space > 280) { doc.addPage(); y = 20; } };

            doc.setFontSize(20); doc.setTextColor(50); doc.text("INFORME DUSOLAI", 20, y); y += 20;
            doc.setFontSize(10); doc.setTextColor(60);
            const summary = doc.splitTextToSize(cleanText(aiData.executive_summary), 170);
            doc.text(summary, 20, y); y += (summary.length * 5) + 20;

            const tasksToPrint = aiData.analyzed_tasks || tasks.map(t => ({ original_title: t.title, ai_audit: "Sin datos", smart_priority: t.priority }));
            tasksToPrint.forEach((task: any, i: number) => {
                checkPageBreak(30);
                doc.setFontSize(11); doc.setTextColor(0);
                doc.text(`${i+1}. ${cleanText(task.original_title)}`, 20, y); y += 6;
                doc.setFontSize(9); doc.setTextColor(100);
                doc.text(`IA: ${cleanText(task.ai_audit)}`, 25, y); y += 10;
            });
            doc.save(`Informe_${wsName}.pdf`);
        } catch (e) { alert("Error PDF"); } finally { setIsGeneratingReport(false); }
    };

    return (
        // RESTAURADO: Fondo sólido para corregir el contraste (bg-gray-950)
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
            <header className="flex-shrink-0 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors duration-300 z-20">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-500 hidden sm:block">DUSOLAI</h1>
                        <div className="flex items-center gap-2">
                            <select value={currentWorkspaceId || ''} onChange={(e) => setWorkspace(e.target.value)} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 dark:text-white border-none outline-none">
                                {isLoadingWS ? <option>Cargando...</option> : workspaces?.map(ws => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
                            </select>
                            <button onClick={handleGeneratePDF} disabled={isGeneratingReport} className="p-2 rounded-lg bg-white dark:bg-gray-800 text-indigo-500 border border-gray-200 dark:border-gray-700">{isGeneratingReport ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18}/>}</button>
                            <button onClick={openWorkspaceManager} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500"><Settings size={18} /></button>
                            <button onClick={() => openTaskModal()} disabled={!currentWorkspaceId} className="p-2 rounded-lg bg-indigo-600 text-white"><Plus size={18} /></button>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100"><Sun className="hidden dark:block" size={20}/><Moon className="dark:hidden" size={20}/></button>
                        <button onClick={() => supabase.auth.signOut()} className="p-2 rounded-full text-gray-500 hover:text-red-500"><LogOut size={20}/></button>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-hidden p-4 bg-gray-50 dark:bg-gray-950 pb-[50px]">
                {currentWorkspaceId ? <KanbanBoard /> : <div className="h-full flex items-center justify-center text-gray-500">Selecciona un espacio</div>}
            </main>
            
            <TaskModal />
            <WorkspaceManager />

            <footer className={`fixed bottom-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg transition-all ${isAudioDrawerOpen ? 'h-[400px]' : 'h-[40px]'}`}>
                <div onClick={() => setIsAudioDrawerOpen(!isAudioDrawerOpen)} className="h-[40px] flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <Mic size={16} className="text-indigo-500 mr-2"/>
                    <span className="text-xs font-bold text-gray-500 mr-2">{isAudioDrawerOpen ? 'Ocultar' : 'Dictar'}</span>
                    {isAudioDrawerOpen ? <ChevronDown size={16} className="text-gray-400"/> : <ChevronUp size={16} className="text-gray-400"/>}
                </div>
                {isAudioDrawerOpen && <div className="p-4 h-full"><AudioRecorder /></div>}
            </footer>
        </div>
    );
};

export default Dashboard;