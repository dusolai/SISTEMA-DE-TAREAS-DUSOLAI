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
    const { toggleTheme, currentWorkspaceId, setWorkspace, openWorkspaceManager, openTaskModal } = useUIStore();
    const [isAudioDrawerOpen, setIsAudioDrawerOpen] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    
    const { workspaces, isLoading: isLoadingWS } = useWorkspaces();
    const { tasks } = useTasks();

    useEffect(() => {
        if (!currentWorkspaceId && workspaces && workspaces.length > 0) {
            setWorkspace(workspaces[0].id);
        }
    }, [currentWorkspaceId, workspaces, setWorkspace]);

    // Limpiador seguro de texto para PDF
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
            
            const total = tasks.length;
            const statusCounts = {
                todo: tasks.filter(t => t.status === 'todo').length,
                doing: tasks.filter(t => t.status === 'doing').length,
                done: tasks.filter(t => t.status === 'done').length,
                review: tasks.filter(t => t.status === 'review').length
            };

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

            // HEADER
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

            // 1. SALUD
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text("1. SALUD DEL PROYECTO", 20, y);
            y += 10;
            doc.setFillColor(230, 230, 230);
            doc.rect(20, y, 170, 8, 'F');
            const score = aiData.health_score || 50;
            if (score > 75) doc.setFillColor(34, 197, 94);
            else if (score > 40) doc.setFillColor(234, 179, 8);
            else doc.setFillColor(239, 68, 68);
            doc.rect(20, y, (170 * score) / 100, 8, 'F');
            
            doc.setFontSize(10);
            doc.setTextColor(50);
            doc.text(`Puntuacion: ${score}/100`, 190, y + 6, { align: 'right' });
            y += 20;

            // 2. ESTADISTICAS
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text("2. ESTADISTICAS", 20, y);
            y += 10;
            doc.setFontSize(10);
            doc.setTextColor(80);
            doc.text(`Pendientes: ${statusCounts.todo}`, 20, y);
            doc.text(`En Curso: ${statusCounts.doing}`, 70, y);
            doc.text(`Revision: ${statusCounts.review}`, 120, y);
            doc.text(`Completadas: ${statusCounts.done}`, 170, y);
            y += 15;

            // 3. RESUMEN
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text("3. RESUMEN EJECUTIVO", 20, y);
            y += 8;
            doc.setFontSize(10);
            doc.setTextColor(60);
            const summaryLines = doc.splitTextToSize(cleanText(aiData.executive_summary), 170);
            doc.text(summaryLines, 20, y);
            y += (summaryLines.length * 5) + 10;

            // 4. RIESGOS
            checkPageBreak(40);
            doc.setFontSize(14);
            doc.setTextColor(200, 0, 0);
            doc.text("4. RIESGOS DETECTADOS", 20, y);
            y += 8;
            doc.setFontSize(10);
            doc.setTextColor(60);
            (aiData.key_risks || []).forEach((risk: string) => {
                const lines = doc.splitTextToSize(`- ${cleanText(risk)}`, 170);
                checkPageBreak(lines.length * 5);
                doc.text(lines, 20, y);
                y += (lines.length * 5) + 2;
            });
            y += 10;

            // 5. RECOMENDACIONES
            checkPageBreak(50);
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 200);
            doc.text("5. RECOMENDACIONES", 20, y);
            y += 8;
            (aiData.recommendations || []).forEach((rec: string) => {
                const lines = doc.splitTextToSize(`- ${cleanText(rec)}`, 170);
                checkPageBreak(lines.length * 5);
                doc.text(lines, 20, y);
                y += (lines.length * 5) + 2;
            });
            y += 15;

            // 6. AUDITORIA
            doc.addPage();
            y = 20;
            doc.setFontSize(16);
            doc.setTextColor(0);
            doc.text("6. AUDITORIA DETALLADA", 20, y);
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
                doc.text(`Creado: ${createdDate} | Prioridad IA: ${cleanText(task.smart_priority)}`, 25, cy);
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
                                        {isLoadingWS ? <option>Cargando...</option> : workspaces?.map(ws => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
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
                            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100"><Sun className="h-5 w-5 hidden dark:block" /><Moon className="h-5 w-5 dark:hidden" /></button>
                            <button onClick={() => supabase.auth.signOut()} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-red-500"><LogOut className="h-5 w-5" /></button>
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-1 overflow-hidden p-4 md:p-6 bg-gray-50 dark:bg-gray-950/50 transition-colors duration-300 pb-[50px]">
                {currentWorkspaceId ? <div className="h-full w-full"><KanbanBoard /></div> : <div className="flex items-center justify-center h-full text-gray-500">Selecciona un espacio de trabajo</div>}
            </main>
            <TaskModal />
            <WorkspaceManager />
            <footer className={`fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg transition-all duration-300 ease-in-out transform ${isAudioDrawerOpen ? 'translate-y-0' : 'translate-y-[calc(100%-40px)]'}`} style={{ maxHeight: isAudioDrawerOpen ? '400px' : '40px' }}>
                <div onClick={() => setIsAudioDrawerOpen(!isAudioDrawerOpen)} className="h-[40px] flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <Mic size={16} className="text-indigo-500 mr-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mr-2">{isAudioDrawerOpen ? 'Ocultar Grabadora' : 'Dictar Tarea'}</span>
                    {isAudioDrawerOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
                </div>
                <div className={`overflow-hidden transition-opacity duration-300 ${isAudioDrawerOpen ? 'opacity-100 visible' : 'opacity-0 invisible h-0'}`}>
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800/50"><AudioRecorder /></div>
                </div>
            </footer>
        </div>
    );
};

export default Dashboard;
