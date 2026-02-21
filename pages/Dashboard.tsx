import React, { useEffect, useState } from 'react';
import KanbanBoard from '../features/kanban/components/KanbanBoard';
import AudioRecorder from '../features/audio/components/AudioRecorder';
import TaskModal from '../features/kanban/components/TaskModal';
import WorkspaceManager from '../features/kanban/components/WorkspaceManager';
import DashboardChart from '../features/dashboard/components/DashboardChart';
import useAuthStore from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useWorkspaces } from '../features/kanban/hooks/useWorkspaces';
import useTasks from '../features/kanban/hooks/useTasks';
import { generateProjectReportData } from '../services/geminiService';
import { supabase } from '../services/supabase';
import { jsPDF } from 'jspdf';
import {
    LogOut, Sun, Moon, Settings, Plus, Loader2, Sparkles, Bell, Mic, Home, PieChart,
    FolderOpen, User as UserIcon, Check, MoreHorizontal, ArrowUp, ArrowDown,
    DollarSign, Users, TrendingUp, AlertCircle, PhoneIncoming, ChevronUp, ChevronDown
} from 'lucide-react';

const Dashboard: React.FC = () => {
    const session = useAuthStore((state) => state.session);
    const { theme, toggleTheme, currentWorkspaceId, setWorkspace, openWorkspaceManager, openTaskModal } = useUIStore();
    const [isAudioDrawerOpen, setIsAudioDrawerOpen] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    const { workspaces, isLoading: isLoadingWS } = useWorkspaces();
    const { tasks, fetchTasks } = useTasks();

    // Sincronización del tema
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

            doc.setFontSize(20); doc.setTextColor(50); doc.text("INFORME DUALINK", 20, y); y += 20;
            doc.setFontSize(10); doc.setTextColor(60);
            const summary = doc.splitTextToSize(cleanText(aiData.executive_summary), 170);
            doc.text(summary, 20, y); y += (summary.length * 5) + 20;

            const tasksToPrint = aiData.analyzed_tasks || tasks.map(t => ({ original_title: t.title, ai_audit: "Sin datos", smart_priority: t.priority }));
            tasksToPrint.forEach((task: any, i: number) => {
                checkPageBreak(30);
                doc.setFontSize(11); doc.setTextColor(0);
                doc.text(`${i + 1}. ${cleanText(task.original_title)}`, 20, y); y += 6;
                doc.setFontSize(9); doc.setTextColor(100);
                doc.text(`IA: ${cleanText(task.ai_audit)}`, 25, y); y += 10;
            });
            doc.save(`Informe_${wsName}.pdf`);
        } catch (e) { alert("Error PDF"); } finally { setIsGeneratingReport(false); }
    };

    const urgentTasks = tasks?.filter(t => t.priority === 'high').slice(0, 2) || [];

    return (
        <div className="bg-background-light dark:bg-background-dark font-sans text-gray-900 dark:text-white transition-colors duration-200 antialiased h-screen overflow-hidden flex flex-col">
            {/* Mobile Layout Wrapper */}
            <div className="max-w-md mx-auto w-full h-full relative flex flex-col bg-white dark:bg-background-dark shadow-2xl overflow-hidden">

                {/* Header Section */}
                <header className="flex-shrink-0 pt-10 pb-4 px-6 flex items-center justify-between sticky top-0 z-20 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div
                            onClick={() => setIsAudioDrawerOpen(!isAudioDrawerOpen)}
                            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 cursor-pointer hover:scale-105 transition-transform"
                        >
                            <Mic className="text-white w-5 h-5" />
                        </div>
                        <div>
                            <select
                                value={currentWorkspaceId || ''}
                                onChange={(e) => setWorkspace(e.target.value)}
                                className="text-[10px] uppercase tracking-wider bg-transparent border-none p-0 font-medium text-text-secondary-light dark:text-text-secondary-dark outline-none cursor-pointer"
                            >
                                {isLoadingWS ? <option>Cargando...</option> : workspaces?.map(ws => <option key={ws.id} value={ws.id} className="bg-white dark:bg-gray-950">{ws.name}</option>)}
                            </select>
                            <p className="text-lg font-bold leading-none">Dualink Tasks</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            {theme === 'dark' ? <Sun size={20} className="text-gray-300" /> : <Moon size={20} className="text-gray-600" />}
                        </button>
                        <button onClick={handleGeneratePDF} disabled={isGeneratingReport} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            {isGeneratingReport ? <Loader2 className="animate-spin text-primary" size={20} /> : <Sparkles className="text-primary" size={20} />}
                        </button>
                        <button onClick={() => supabase.auth.signOut()} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <LogOut size={20} className="text-red-500" />
                        </button>
                    </div>
                </header>

                {/* Main Scrollable Content */}
                <main className="flex-1 overflow-y-auto px-5 pt-6 space-y-6 pb-32 no-scrollbar">
                    {/* Performance Section */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold">Performance</h2>
                            <span className="text-xs font-medium text-primary cursor-pointer">Live Stats</span>
                        </div>
                        <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2 snap-x snap-mandatory">
                            <div className="snap-center shrink-0 w-[165px] p-4 rounded-xl bg-white dark:bg-card-dark border border-gray-100 dark:border-gray-800 shadow-sm">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="p-1.5 rounded-lg bg-primary/10 dark:bg-primary/20">
                                        <TrendingUp className="text-primary w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-accent-success flex items-center">
                                        +5% <ArrowUp size={12} className="ml-1" />
                                    </span>
                                </div>
                                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1">Efficiency</p>
                                <p className="text-2xl font-bold tracking-tight">84%</p>
                            </div>
                            <div className="snap-center shrink-0 w-[165px] p-4 rounded-xl bg-white dark:bg-card-dark border border-gray-100 dark:border-gray-800 shadow-sm">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-500/20">
                                        <Users className="text-orange-500 w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-accent-success flex items-center">
                                        +2 <ArrowUp size={12} className="ml-1" />
                                    </span>
                                </div>
                                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1">Active Tasks</p>
                                <p className="text-2xl font-bold tracking-tight">{tasks?.length || 0}</p>
                            </div>
                        </div>
                    </section>

                    {/* Chart Section */}
                    <section className="bg-white dark:bg-card-dark p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-semibold">Activity Flow</h3>
                            <button className="p-1 rounded bg-gray-50 dark:bg-gray-800 text-gray-400">
                                <MoreHorizontal size={16} />
                            </button>
                        </div>
                        <div className="h-[160px] w-full relative">
                            <DashboardChart />
                        </div>
                    </section>

                    {/* Kanban Section */}
                    <section>
                        <h2 className="text-lg font-semibold mb-4">Pipeline</h2>
                        <div className="bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl p-2 min-h-[300px]">
                            {currentWorkspaceId ? <KanbanBoard /> : <div className="flex items-center justify-center p-8 text-gray-500 italic">Selecciona un espacio</div>}
                        </div>
                    </section>

                    {/* Urgent Tasks Section */}
                    {urgentTasks.length > 0 && (
                        <section className="pb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold">Urgent Tasks</h2>
                                <button className="text-primary text-xs font-semibold hover:underline">Priority Focus</button>
                            </div>
                            <div className="space-y-3">
                                {urgentTasks.map((task) => (
                                    <div key={task.id} className="flex items-center p-3 rounded-xl bg-white dark:bg-card-dark border border-gray-100 dark:border-gray-800 shadow-sm">
                                        <div className="flex-shrink-0 mr-3">
                                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center text-red-500">
                                                <AlertCircle size={18} />
                                            </div>
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className="text-sm font-medium">{task.title}</h4>
                                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate max-w-[180px]">
                                                {task.status} • {task.priority}
                                            </p>
                                        </div>
                                        <button className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-primary hover:border-primary group transition-colors">
                                            <Check size={16} className="text-gray-400 group-hover:text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                {/* Bottom Navigation (Floating style from code.html) */}
                <nav className="absolute bottom-0 w-full bg-white/95 dark:bg-card-dark/95 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 pb-8 pt-3 px-6 z-30">
                    <ul className="flex justify-between items-center">
                        <li>
                            <button className="flex flex-col items-center gap-1 text-primary">
                                <Home size={22} />
                                <span className="text-[10px] font-medium">Home</span>
                            </button>
                        </li>
                        <li>
                            <button className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-primary transition-colors">
                                <PieChart size={22} />
                                <span className="text-[10px] font-medium">Stats</span>
                            </button>
                        </li>
                        <li>
                            <div className="relative -top-6">
                                <button
                                    onClick={() => openTaskModal()}
                                    disabled={!currentWorkspaceId}
                                    className="w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/40 flex items-center justify-center hover:bg-primary-hover transition-all hover:scale-110 active:scale-95 text-white disabled:bg-gray-400"
                                >
                                    <Plus size={30} />
                                </button>
                            </div>
                        </li>
                        <li>
                            <button
                                onClick={openWorkspaceManager}
                                className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-primary transition-colors"
                            >
                                <FolderOpen size={22} />
                                <span className="text-[10px] font-medium">Spaces</span>
                            </button>
                        </li>
                        <li>
                            <button className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-primary transition-colors">
                                <UserIcon size={22} />
                                <span className="text-[10px] font-medium">Profile</span>
                            </button>
                        </li>
                    </ul>
                </nav>

                {/* Audio Recorder Drawer Overlay */}
                <div className={`fixed inset-x-0 bottom-0 max-w-md mx-auto bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 shadow-2xl transition-all duration-300 z-40 overflow-hidden ${isAudioDrawerOpen ? 'h-[400px]' : 'h-0'}`}>
                    <div className="flex flex-col h-full bg-white dark:bg-background-dark">
                        <div
                            onClick={() => setIsAudioDrawerOpen(false)}
                            className="h-10 flex items-center justify-center cursor-pointer border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <AudioRecorder />
                        </div>
                    </div>
                </div>

                <TaskModal />
                <WorkspaceManager />
            </div>
        </div>
    );
};

export default Dashboard;
