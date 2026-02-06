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
import { LogOut, Sun, Moon, Briefcase, Settings, ChevronUp, ChevronDown, Mic, Plus, FileText, Loader2, Sparkles } from 'lucide-react';

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

    const safeText = (text: any): string => {
        if (text === null || text === undefined) return "";
        return String(text).replace(/[^\x20-\x7E\xA0-\xFF\u20AC]/g, "").trim(); 
    };

    const handleGeneratePDF = async () => {
        if (!tasks || tasks.length === 0) {
            alert("No hay tareas para analizar.");
            return;
        }
        
        setIsGeneratingReport(true);
        try {
            const wsName = workspaces?.find(w => w.id === currentWorkspaceId)?.name || 'Proyecto';
            
            // 1. OBTENER AUDITORÍA COMPLETA DE GEMINI
            const aiData = await generateProjectReportData(tasks, wsName);
            
            // 2. Datos para gráficos (estos siguen siendo calculados en local para precisión numérica)
            const total = tasks.length;
            const statusCounts = {
                todo: tasks.filter(t => t.status === 'todo').length,
                doing: tasks.filter(t => t.status === 'doing').length,
                done: tasks.filter(t => t.status === 'done').length,
                review: tasks.filter(t => t.status === 'review').length
            };

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            let y = 20;

            const checkPageBreak = (spaceNeeded: number) => {
                if (y + spaceNeeded > 280) {
                    doc.addPage();
                    y = 20;
                    return true;
                }
                return false;
            };

            // --- HEADER ---
            doc.setFontSize(22);
            doc.setTextColor(79, 70, 229);
            doc.text("AUDITORÍA DE PROYECTO CON IA", 20, y);
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Análisis Inteligente Dusolai | ${new Date().toLocaleDateString()}`, 20, y + 6);
            y += 20;

            doc.setDrawColor(200);
            doc.line(20, y, pageWidth - 20, y);
            y += 15;

            // --- SECCIÓN 1: SALUD ---
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text("1. Diagnóstico de Salud", 20, y);
            y += 10;

            doc.setFillColor(240, 240, 240);
            doc.roundedRect(20, y, 170, 10, 3, 3, 'F');
            
            const score = aiData.health_score || 50;
            if (score > 75) doc.setFillColor(34, 197, 94);
            else if (score > 40) doc.setFillColor(234, 179, 8);
            else doc.setFillColor(239, 68, 68);

            doc.roundedRect(20, y, (170 * score) / 100, 10, 3, 3, 'F');
            doc.setFontSize(10);
            doc.setTextColor(50);
            doc.text(`${score}/100 - ${safeText(aiData.mood || 'Normal')}`, 190, y + 6, { align: 'right' });
            y += 20;

            // --- SECCIÓN 2: CARGA DE TRABAJO ---
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text("2. Distribución Actual", 20, y);
            y += 10;
            // (Gráfico de barras igual que antes, es puramente estadístico)
            const wTodo = (statusCounts.todo / total) * 170;
            const wDoing = (statusCounts.doing / total) * 170;
            const wReview = (statusCounts.review / total) * 170;
            const wDone = (statusCounts.done / total) * 170;
            let xBar = 20;
            if (wTodo > 0) { doc.setFillColor(209, 213, 219); doc.rect(xBar, y, wTodo, 15, 'F'); xBar += wTodo; }
            if (wDoing > 0) { doc.setFillColor(99, 102, 241); doc.rect(xBar, y, wDoing, 15, 'F'); xBar += wDoing; }
            if (wReview > 0) { doc.setFillColor(245, 158, 11); doc.rect(xBar, y, wReview, 15, 'F'); xBar += wReview; }
            if (wDone > 0) { doc.setFillColor(34, 197, 94); doc.rect(xBar, y, wDone, 15, 'F'); }
            y += 20;
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(`Pendiente: ${statusCounts.todo} | En Curso: ${statusCounts.doing} | Revisión: ${statusCounts.review} | Hecho: ${statusCounts.done}`, 20, y);
            y += 15;

            // --- SECCIÓN 3: ANÁLISIS EJECUTIVO ---
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text("3. Opinión del Auditor (IA)", 20, y);
            y += 8;
            doc.setFontSize(11);
            doc.setTextColor(60);
            const splitSummary = doc.splitTextToSize(safeText(aiData.executive_summary), 170);
            doc.text(splitSummary, 20, y);
            y += (splitSummary.length * 5) + 10;

            // --- SECCIÓN 4: RIESGOS ---
            checkPageBreak(50);
            doc.setFontSize(14);
            doc.setTextColor(220, 38, 38);
            doc.text("🚨 Riesgos Críticos", 20, y);
            y += 8;
            doc.setFontSize(11);
            doc.setTextColor(60);
            (aiData.key_risks || []).forEach((risk: string) => {
                checkPageBreak(10);
                doc.text(`• ${safeText(risk)}`, 25, y);
                y += 6;
            });
            y += 10;

            // --- SECCIÓN 5: RECOMENDACIONES ---
            checkPageBreak(60);
            doc.setFillColor(245, 247, 255);
            doc.setDrawColor(200, 210, 255);
            if (y + 45 > 280) { doc.addPage(); y = 20; }
            doc.roundedRect(15, y, 180, 50, 3, 3, 'FD');
            
            doc.setFontSize(14);
            doc.setTextColor(79, 70, 229);
            doc.text("💡 Estrategia Sugerida", 25, y + 10);
            y += 20;
            doc.setFontSize(10);
            doc.setTextColor(50);
            (aiData.recommendations || []).forEach((rec: string) => {
                const splitRec = doc.splitTextToSize(`• ${safeText(rec)}`, 160);
                if (splitRec.length > 2) splitRec.length = 2; 
                doc.text(splitRec, 25, y);
                y += (splitRec.length * 5);
            });
            y += 15; // Salir del cuadro

            // ============================================================
            // --- NUEVA SECCIÓN: AUDITORÍA TAREA POR TAREA ---
            // ============================================================
            doc.addPage(); 
            y = 20;
            
            doc.setFontSize(16);
            doc.setTextColor(0);
            doc.text("📋 Auditoría Detallada de Tareas", 20, y);
            y += 15;

            // Usamos los datos devueltos por la IA, o hacemos fallback a las tareas locales si la IA no devolvió nada
            const tasksToPrint = (aiData.analyzed_tasks && aiData.analyzed_tasks.length > 0) 
                                ? aiData.analyzed_tasks 
                                : tasks.map(t => ({ original_title: t.title, ai_audit: "Análisis no disponible", smart_priority: t.priority }));

            tasksToPrint.forEach((task: any, index: number) => {
                checkPageBreak(40);

                // Caja de tarea
                doc.setDrawColor(230);
                doc.setFillColor(255, 255, 255);
                if (index % 2 === 0) doc.setFillColor(250, 250, 252); // Alternar color fondo
                doc.roundedRect(20, y - 5, 170, 30, 2, 2, 'FD');

                // Título
                doc.setFontSize(11);
                doc.setTextColor(0);
                doc.setFont("helvetica", "bold");
                doc.text(`${index + 1}. ${safeText(task.original_title)}`, 25, y + 5);
                
                // Prioridad Inteligente (Badge)
                doc.setFontSize(9);
                doc.setFont("helvetica", "normal");
                
                let pColor = [100, 100, 100]; // Gris
                const pText = safeText(task.smart_priority || 'Normal').toLowerCase();
                if (pText.includes('crítica') || pText.includes('alta')) pColor = [220, 38, 38]; // Rojo
                if (pText.includes('baja')) pColor = [34, 197, 94]; // Verde

                doc.setTextColor(pColor[0], pColor[1], pColor[2]);
                doc.text(`Prioridad IA: ${safeText(task.smart_priority)}`, 140, y + 5);

                // Auditoría IA (El valor clave)
                doc.setFontSize(10);
                doc.setTextColor(60);
                doc.setFont("helvetica", "italic"); // Cursiva para denotar que habla la IA
                
                const auditText = `IA: "${safeText(task.ai_audit || "Sin comentarios.")}"`;
                const splitAudit = doc.splitTextToSize(auditText, 160);
                
                doc.text(splitAudit, 25, y + 14);

                y += 35; // Espacio fijo por bloque
            });

            doc.save(`Auditoria_IA_${wsName.replace(/\s+/g, '_')}.pdf`);

        } catch (error) {
            console.error("Error PDF:", error);
            alert("Hubo un error al generar la auditoría.");
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
                                
                                {/* BOTÓN DE AUDITORÍA IA */}
                                <button 
                                    onClick={handleGeneratePDF} 
                                    disabled={isGeneratingReport || !currentWorkspaceId || !tasks || tasks.length === 0}
                                    className={`
                                        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all
                                        ${isGeneratingReport 
                                            ? 'bg-purple-50 text-purple-500 border-purple-100 cursor-wait' 
                                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-purple-500 hover:text-purple-500 shadow-sm'
                                        }
                                    `}
                                    title="Analizar y Auditar con IA"
                                >
                                    {isGeneratingReport ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span className="hidden sm:inline">Auditando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} className="text-purple-500" />
                                            <span className="hidden sm:inline">Auditoría IA</span>
                                        </>
                                    )}
                                </button>

                                <button onClick={openWorkspaceManager} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors">
                                    <Settings size={18} />
                                </button>

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
