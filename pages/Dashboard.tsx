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
        <div className="font-sans transition-colors duration-200 antialiased h-[100dvh] overflow-hidden flex flex-col">
            {/* Mobile Layout Wrapper with Glass Effect */}
            <div className="max-w-md mx-auto w-full h-full relative flex flex-col shadow-2xl overflow-hidden border-x border-gray-100 dark:border-gray-800/50">

                {/* Header Section - Premium Glassmorphism */}
                <header className="flex-shrink-0 pt-12 pb-5 px-6 flex items-center justify-between sticky top-0 z-30 bg-white/95 dark:bg-[#020412]/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800/50">
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
                            <p className="text-lg font-bold leading-none">Dualink Tasks <span className="text-[8px] font-normal text-slate-400">v2.1-LIVE</span></p>
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
                    {/* Performance Section - High Contrast Cards */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Performance</h2>
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">LIVE STATS</span>
                        </div>
                        <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2 snap-x snap-mandatory">
                            {/* Efficiency Card */}
                            <div className="snap-center shrink-0 w-[160px] p-5 rounded-2xl bg-white dark:bg-[#0f1325] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:border-primary/30">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary/20">
                                        <TrendingUp className="text-primary w-5 h-5" />
                                    </div>
                                    <span className="text-[11px] font-black text-emerald-500 flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                                        +5% <ArrowUp size={10} className="ml-0.5" />
                                    </span>
                                </div>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">Efficiency</p>
                                <p className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">84%</p>
                            </div>

                            {/* Active Tasks Card */}
                            <div className="snap-center shrink-0 w-[160px] p-5 rounded-2xl bg-white dark:bg-[#0f1325] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:border-orange-500/30">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-500/20">
                                        <Users className="text-orange-500 w-5 h-5" />
                                    </div>
                                    <span className="text-[11px] font-black text-emerald-500 flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                                        NEW <ArrowUp size={10} className="ml-0.5" />
                                    </span>
                                </div>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">Active Tasks</p>
                                <p className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">{tasks?.length || 0}</p>
                            </div>
                        </div>
                    </section>

                    {/* Chart Section - Premium Box */}
                    <section className="bg-white dark:bg-[#0f1325] p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Activity Flow</h3>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Revenue Insights</p>
                            </div>
                            <button className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary transition-colors">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>
                        <div className="h-[180px] w-full relative">
                            <DashboardChart />
                        </div>
                    </section>

                    {/* Kanban Section */}
                    <section>
                        <h2 className="text-lg font-semibold mb-3 px-1">Pipeline</h2>
                        <div className="h-[500px] w-full">
                            {currentWorkspaceId ? <KanbanBoard /> : <div className="flex items-center justify-center p-8 text-gray-400 italic bg-gray-50 dark:bg-card-dark/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">Selecciona un espacio</div>}
                        </div>
                    </section>

                    {/* Urgent Tasks Section - High Visibility */}
                    {urgentTasks.length > 0 && (
                        <section className="pb-8">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Urgent Tasks</h2>
                                <button className="text-primary text-[10px] font-black uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-md">View All</button>
                            </div>
                            <div className="space-y-4">
                                {urgentTasks.map((task) => (
                                    <div key={task.id} className="group flex items-center p-4 rounded-2xl bg-white dark:bg-[#0f1325] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                                        <div className="flex-shrink-0 mr-4">
                                            <div className="w-12 h-12 rounded-2xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center text-red-500 shadow-inner">
                                                <AlertCircle size={22} strokeWidth={2.5} />
                                            </div>
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">{task.title}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                                                    {task.status || 'NEW'}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                                <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter bg-red-500/5 px-1.5 rounded">
                                                    URGENT
                                                </span>
                                            </div>
                                        </div>
                                        <button className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-primary hover:border-primary group transition-all flex-shrink-0 shadow-sm bg-slate-50 dark:bg-slate-900/50">
                                            <Check size={18} strokeWidth={3} className="text-slate-400 group-hover:text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                {/* Bottom Navigation (Floating style from code.html) */}
                <nav className="absolute bottom-0 w-full bg-background-light/95 dark:bg-card-dark/95 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 pb-8 pt-3 px-6 z-30">
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
                <div className={`fixed inset-x-0 bottom-0 max-w-md mx-auto bg-background-light dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 shadow-2xl transition-all duration-300 z-40 overflow-hidden ${isAudioDrawerOpen ? 'h-[400px]' : 'h-0'}`}>
                    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
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
