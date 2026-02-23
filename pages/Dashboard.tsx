import React, { useEffect, useState } from 'react';
import KanbanBoard from '../features/kanban/components/KanbanBoard';
import AudioRecorder from '../features/audio/components/AudioRecorder';
import TaskModal from '../features/kanban/components/TaskModal';
import WorkspaceManager from '../features/kanban/components/WorkspaceManager';
import DashboardChart from '../features/dashboard/components/DashboardChart';
import WeeklyCalendarView from './WeeklyCalendarView';
import useAuthStore from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useWorkspaces } from '../features/kanban/hooks/useWorkspaces';
import useTasks from '../features/kanban/hooks/useTasks';
import { generateProjectReportData } from '../services/geminiService';
import { generatePremiumHTMLReport } from '../services/htmlReportService';
import { supabase } from '../services/supabase';
import {
    LogOut, Sun, Moon, Plus, Loader2, Sparkles, Mic, Home, CalendarDays,
    FolderOpen, User as UserIcon, Check, MoreHorizontal, ArrowUp,
    Users, TrendingUp, AlertCircle, ChevronDown, ChevronUp,
    Download, LayoutDashboard, Clock
} from 'lucide-react';

// JS-based media query hook (reliable regardless of Tailwind version)
function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        setIsDesktop(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return isDesktop;
}

const Dashboard: React.FC = () => {
    const session = useAuthStore((state) => state.session);
    const { theme, toggleTheme, currentWorkspaceId, setWorkspace, openWorkspaceManager, openTaskModal, isAnalysisSidebarOpen, toggleAnalysisSidebar } = useUIStore();
    const [isAudioDrawerOpen, setIsAudioDrawerOpen] = useState(false);
    const [showAllUrgent, setShowAllUrgent] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [activeView, setActiveView] = useState<'home' | 'calendar'>('home');
    const [desktopTab, setDesktopTab] = useState<'kanban' | 'calendar'>('kanban');
    const [isChartCollapsed, setIsChartCollapsed] = useState(false);
    const [isUrgentExpanded, setIsUrgentExpanded] = useState(false);
    const isDesktop = useIsDesktop();

    const { workspaces, isLoading: isLoadingWS } = useWorkspaces();
    const { tasks, fetchTasks } = useTasks();

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

    const handleGeneratePDF = async () => {
        if (!tasks || tasks.length === 0) { alert("No hay tareas para generar el informe."); return; }
        setIsGeneratingReport(true);
        try {
            const wsName = workspaces?.find(w => w.id === currentWorkspaceId)?.name || 'Proyecto';
            const aiData = await generateProjectReportData(tasks, wsName);
            generatePremiumHTMLReport(tasks, aiData, wsName);
        } catch (e) {
            console.error('Error generating PDF:', e);
            alert("Error al generar el informe. Inténtalo de nuevo.");
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const urgentTasks = showAllUrgent ? (tasks?.filter(t => t.priority === 'high') || []) : (tasks?.filter(t => t.priority === 'high').slice(0, 5) || []);
    const doneTasks = tasks?.filter(t => t.status === 'done').length || 0;
    const totalTasks = tasks?.length || 0;
    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    // ===================== DESKTOP LAYOUT =====================
    if (isDesktop) {
        return (
            <div className="font-sans antialiased h-[100dvh] overflow-hidden flex" style={{ background: theme === 'dark' ? '#020412' : '#f8fafc' }}>
                {/* Sidebar */}
                <aside style={{ width: 260, flexShrink: 0, borderRight: '1px solid', borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0', background: theme === 'dark' ? '#0a0e1f' : '#ffffff', display: 'flex', flexDirection: 'column' }}>
                    {/* Logo */}
                    <div style={{ padding: '24px', borderBottom: '1px solid', borderBottomColor: theme === 'dark' ? '#1e293b' : '#e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#5848e8', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(88,72,232,0.3)' }}>
                                <Mic style={{ color: 'white', width: 20, height: 20 }} />
                            </div>
                            <div>
                                <h1 style={{ fontSize: 18, fontWeight: 900, color: theme === 'dark' ? 'white' : '#0f172a', margin: 0 }}>DUALINK</h1>
                                <p style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, margin: 0 }}>Task Manager Pro</p>
                            </div>
                        </div>
                    </div>

                    {/* Workspace Selector */}
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid', borderBottomColor: theme === 'dark' ? '#1e293b' : '#e2e8f0' }}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2, display: 'block', marginBottom: 6 }}>Workspace</label>
                        <select
                            value={currentWorkspaceId || ''}
                            onChange={(e) => setWorkspace(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', background: theme === 'dark' ? '#1e293b' : '#f1f5f9', border: '1px solid', borderColor: theme === 'dark' ? '#334155' : '#e2e8f0', borderRadius: 12, fontSize: 13, fontWeight: 700, color: theme === 'dark' ? 'white' : '#0f172a', outline: 'none', cursor: 'pointer' }}
                        >
                            {isLoadingWS ? <option>Cargando...</option> : workspaces?.map(ws => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
                        </select>
                    </div>

                    {/* Nav Items */}
                    <nav style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <button
                            onClick={() => setDesktopTab('kanban')}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: desktopTab === 'kanban' ? '#5848e8' : 'transparent', color: desktopTab === 'kanban' ? 'white' : '#94a3b8', boxShadow: desktopTab === 'kanban' ? '0 4px 12px rgba(88,72,232,0.3)' : 'none' }}
                        >
                            <LayoutDashboard size={18} /> Kanban Board
                        </button>
                        <button
                            onClick={() => setDesktopTab('calendar')}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: desktopTab === 'calendar' ? '#5848e8' : 'transparent', color: desktopTab === 'calendar' ? 'white' : '#94a3b8', boxShadow: desktopTab === 'calendar' ? '0 4px 12px rgba(88,72,232,0.3)' : 'none' }}
                        >
                            <CalendarDays size={18} /> Calendario
                        </button>
                        <button
                            onClick={openWorkspaceManager}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', background: 'transparent', color: '#94a3b8' }}
                        >
                            <FolderOpen size={18} /> Workspaces
                        </button>
                    </nav>

                    {/* Bottom Actions */}
                    <div style={{ padding: 16, borderTop: '1px solid', borderTopColor: theme === 'dark' ? '#1e293b' : '#e2e8f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button
                            onClick={() => openTaskModal()}
                            disabled={!currentWorkspaceId}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, background: '#5848e8', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(88,72,232,0.2)' }}
                        >
                            <Plus size={18} /> Nueva Tarea
                        </button>

                        {/* Download APK Button — links to the apk file in the repo's public folder */}
                        <a
                            href="/dualink.apk"
                            download
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, background: '#10b981', color: 'white', fontWeight: 700, fontSize: 14, textDecoration: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.2)', boxSizing: 'border-box' }}
                        >
                            <Download size={18} /> Descargar APK
                        </a>

                        <div style={{ display: 'flex', gap: 4, paddingTop: 8 }}>
                            <button onClick={toggleTheme} style={{ flex: 1, padding: 10, borderRadius: 12, border: 'none', cursor: 'pointer', background: theme === 'dark' ? '#1e293b' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {theme === 'dark' ? <Sun size={18} style={{ color: '#fbbf24' }} /> : <Moon size={18} style={{ color: '#64748b' }} />}
                            </button>
                            <button onClick={handleGeneratePDF} disabled={isGeneratingReport} style={{ flex: 1, padding: 10, borderRadius: 12, border: 'none', cursor: 'pointer', background: theme === 'dark' ? '#1e293b' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {isGeneratingReport ? <Loader2 style={{ color: '#5848e8', animation: 'spin 1s linear infinite' }} size={18} /> : <Sparkles style={{ color: '#5848e8' }} size={18} />}
                            </button>
                            <button onClick={() => setIsAudioDrawerOpen(!isAudioDrawerOpen)} style={{ flex: 1, padding: 10, borderRadius: 12, border: 'none', cursor: 'pointer', background: theme === 'dark' ? '#1e293b' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Mic size={18} style={{ color: '#5848e8' }} />
                            </button>
                            <button onClick={() => supabase.auth.signOut()} style={{ flex: 1, padding: 10, borderRadius: 12, border: 'none', cursor: 'pointer', background: theme === 'dark' ? '#1e293b' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <LogOut size={18} style={{ color: '#ef4444' }} />
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Top Bar */}
                    <header style={{ flexShrink: 0, height: 64, background: theme === 'dark' ? '#0a0e1f' : '#ffffff', borderBottom: '1px solid', borderBottomColor: theme === 'dark' ? '#1e293b' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 900, color: theme === 'dark' ? 'white' : '#0f172a', margin: 0 }}>
                                {desktopTab === 'kanban' ? '📋 Kanban Board' : '📅 Calendario Semanal'}
                            </h2>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#5848e8', background: 'rgba(88,72,232,0.1)', padding: '4px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 2 }}>
                                {totalTasks} tareas
                            </span>
                            <button
                                onClick={toggleAnalysisSidebar}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 12, border: 'none', cursor: 'pointer', background: theme === 'dark' ? '#1e293b' : '#f1f5f9', color: isAnalysisSidebarOpen ? '#5848e8' : '#94a3b8', fontSize: 11, fontWeight: 700, transition: 'all 0.2s' }}
                                title={isAnalysisSidebarOpen ? "Ocultar Análisis" : "Mostrar Análisis"}
                            >
                                <TrendingUp size={14} /> {isAnalysisSidebarOpen ? "Ocultar Análisis" : "Ver Análisis"}
                            </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: 12, fontWeight: 900 }}>
                                {completionRate}% completado
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8' }}>
                                <UserIcon size={14} />
                                <span style={{ fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session?.user?.email}</span>
                            </div>
                        </div>
                    </header>

                    {/* Content */}
                    <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
                        {desktopTab === 'kanban' ? (
                            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                                {/* Kanban - main area */}
                                <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
                                    <div style={{ minHeight: 600, height: '100%' }}>
                                        {currentWorkspaceId ? <KanbanBoard /> : (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontStyle: 'italic', background: theme === 'dark' ? '#0f1325' : '#ffffff', borderRadius: 16, border: '2px dashed', borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0' }}>
                                                Selecciona un workspace para ver las tareas
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Sidebar - Stats & Urgent */}
                                {isAnalysisSidebarOpen && (
                                    <aside style={{ width: 320, flexShrink: 0, borderLeft: '1px solid', borderLeftColor: theme === 'dark' ? '#1e293b' : '#e2e8f0', background: theme === 'dark' ? '#0a0e1f' : '#ffffff', overflowY: 'auto', padding: 20 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                            {/* Stats Cards */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                <div style={{ padding: 16, borderRadius: 16, background: theme === 'dark' ? '#0f1325' : '#f8fafc', border: '1px solid', borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0' }}>
                                                    <div style={{ padding: 8, borderRadius: 12, background: 'rgba(88,72,232,0.1)', width: 'fit-content', marginBottom: 8 }}><TrendingUp style={{ color: '#5848e8', width: 16, height: 16 }} /></div>
                                                    <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2, margin: 0 }}>Eficiencia</p>
                                                    <p style={{ fontSize: 28, fontWeight: 900, color: theme === 'dark' ? 'white' : '#0f172a', margin: 0 }}>{completionRate}%</p>
                                                </div>
                                                <div style={{ padding: 16, borderRadius: 16, background: theme === 'dark' ? '#0f1325' : '#f8fafc', border: '1px solid', borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0' }}>
                                                    <div style={{ padding: 8, borderRadius: 12, background: 'rgba(249,115,22,0.1)', width: 'fit-content', marginBottom: 8 }}><Users style={{ color: '#f97316', width: 16, height: 16 }} /></div>
                                                    <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2, margin: 0 }}>Activas</p>
                                                    <p style={{ fontSize: 28, fontWeight: 900, color: theme === 'dark' ? 'white' : '#0f172a', margin: 0 }}>{totalTasks}</p>
                                                </div>
                                            </div>

                                            {/* Chart */}
                                            <div style={{ padding: 16, borderRadius: 16, background: theme === 'dark' ? '#0f1325' : '#f8fafc', border: '1px solid', borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0' }}>
                                                <h3 style={{ fontSize: 14, fontWeight: 700, color: theme === 'dark' ? 'white' : '#0f172a', margin: '0 0 12px 0' }}>Activity Flow</h3>
                                                <div style={{ height: 140, width: '100%' }}><DashboardChart tasks={tasks} /></div>
                                            </div>

                                            {/* Urgent Tasks */}
                                            {urgentTasks.length > 0 && (
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                                        <h3 style={{ fontSize: 14, fontWeight: 700, color: theme === 'dark' ? 'white' : '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <AlertCircle size={14} style={{ color: '#ef4444' }} /> Urgentes
                                                        </h3>
                                                        {(tasks?.filter(t => t.priority === 'high').length || 0) > 5 && (
                                                            <button
                                                                onClick={() => setShowAllUrgent(!showAllUrgent)}
                                                                style={{ fontSize: 11, fontWeight: 700, color: '#5848e8', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                            >
                                                                {showAllUrgent ? 'Ver menos' : 'Ver todo'}
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                        {urgentTasks.map(task => (
                                                            <div key={task.id}
                                                                onClick={() => openTaskModal(task)}
                                                                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, background: theme === 'dark' ? 'rgba(239,68,68,0.05)' : 'rgba(239,68,68,0.05)', border: '1px solid', borderColor: theme === 'dark' ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.15)', cursor: 'pointer' }}>
                                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                    <AlertCircle size={14} style={{ color: '#ef4444' }} />
                                                                </div>
                                                                <span style={{ fontSize: 12, fontWeight: 700, color: theme === 'dark' ? '#e2e8f0' : '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </aside>
                                )}
                            </div>
                        ) : (
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <WeeklyCalendarView />
                            </div>
                        )}
                    </div>
                </div>

                {/* Audio Recorder Drawer - Desktop */}
                {isAudioDrawerOpen && (
                    <div style={{ position: 'fixed', bottom: 16, right: 16, width: 384, height: 400, background: theme === 'dark' ? '#0f1325' : '#ffffff', borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.2)', border: '1px solid', borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0', zIndex: 50, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div onClick={() => setIsAudioDrawerOpen(false)} style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderBottom: '1px solid', borderBottomColor: theme === 'dark' ? '#1e293b' : '#e2e8f0' }}>
                            <ChevronDown style={{ width: 20, height: 20, color: '#94a3b8' }} />
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}><AudioRecorder /></div>
                    </div>
                )}

                <TaskModal />
                <WorkspaceManager />
            </div>
        );
    }

    // ===================== MOBILE LAYOUT =====================
    return (
        <div className="font-sans transition-colors duration-200 antialiased h-[100dvh] overflow-hidden flex flex-col">
            <div className="max-w-md mx-auto w-full h-full relative flex flex-col shadow-2xl overflow-hidden border-x border-gray-100 dark:border-gray-800/50">
                {/* Header */}
                <header className="flex-shrink-0 pt-12 pb-5 px-6 flex items-center justify-between sticky top-0 z-30 bg-white/95 dark:bg-[#020412]/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800/50">
                    <div className="flex items-center gap-3">
                        <div onClick={() => setIsAudioDrawerOpen(!isAudioDrawerOpen)} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 cursor-pointer hover:scale-105 transition-transform">
                            <Mic className="text-white w-5 h-5" />
                        </div>
                        <div>
                            <select value={currentWorkspaceId || ''} onChange={(e) => setWorkspace(e.target.value)} className="text-[10px] uppercase tracking-wider bg-transparent border-none p-0 font-medium text-text-secondary-light dark:text-text-secondary-dark outline-none cursor-pointer">
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

                {/* Content */}
                {activeView === 'calendar' ? (
                    <div className="flex-1 overflow-hidden flex flex-col"><WeeklyCalendarView /></div>
                ) : (
                    <main className="flex-1 overflow-y-auto px-5 pt-6 space-y-6 pb-32 no-scrollbar">
                        {/* Stats Cards */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Performance</h2>
                                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">LIVE STATS</span>
                            </div>
                            <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2 snap-x snap-mandatory">
                                <div className="snap-center shrink-0 w-[160px] p-5 rounded-2xl bg-white dark:bg-[#0f1325] border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary/20"><TrendingUp className="text-primary w-5 h-5" /></div>
                                        <span className="text-[11px] font-black text-emerald-500 flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded-md">+5% <ArrowUp size={10} className="ml-0.5" /></span>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">Efficiency</p>
                                    <p className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">{completionRate}%</p>
                                </div>
                                <div className="snap-center shrink-0 w-[160px] p-5 rounded-2xl bg-white dark:bg-[#0f1325] border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-500/20"><Users className="text-orange-500 w-5 h-5" /></div>
                                        <span className="text-[11px] font-black text-emerald-500 flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded-md">NEW <ArrowUp size={10} className="ml-0.5" /></span>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">Active Tasks</p>
                                    <p className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">{totalTasks}</p>
                                </div>
                            </div>
                        </section>

                        {/* Chart — Collapsible */}
                        <section className="bg-white dark:bg-[#0f1325] rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden transition-all duration-300">
                            <button
                                onClick={() => setIsChartCollapsed(!isChartCollapsed)}
                                className="w-full flex justify-between items-center p-6 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                            >
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white text-left">Activity Flow</h3>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold text-left">Task Insights</p>
                                </div>
                                <div className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 transition-transform duration-300 ${isChartCollapsed ? '' : 'rotate-180'}`}>
                                    <ChevronUp size={20} />
                                </div>
                            </button>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isChartCollapsed ? 'max-h-0 opacity-0' : 'max-h-[250px] opacity-100'}`}>
                                <div className="px-6 pb-6">
                                    <div className="h-[180px] w-full relative"><DashboardChart tasks={tasks} /></div>
                                </div>
                            </div>
                        </section>

                        {/* Kanban */}
                        <section>
                            <h2 className="text-lg font-semibold mb-3 px-1">Pipeline</h2>
                            <div className="h-[500px] w-full">
                                {currentWorkspaceId ? <KanbanBoard /> : <div className="flex items-center justify-center p-8 text-gray-400 italic bg-gray-50 dark:bg-card-dark/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">Selecciona un espacio</div>}
                            </div>
                        </section>

                        {/* Urgent Tasks — Expandable Premium */}
                        {(tasks?.filter(t => t.priority === 'high').length || 0) > 0 && (
                            <section className="pb-8">
                                <button
                                    onClick={() => setIsUrgentExpanded(!isUrgentExpanded)}
                                    className="w-full flex items-center justify-between mb-4 cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-red-500/10">
                                            <AlertCircle size={18} className="text-red-500" />
                                        </div>
                                        <div className="text-left">
                                            <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">Urgentes</h2>
                                            <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">
                                                {tasks?.filter(t => t.priority === 'high').length} tareas críticas
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 transition-transform duration-300 ${isUrgentExpanded ? 'rotate-180' : ''}`}>
                                        <ChevronDown size={18} />
                                    </div>
                                </button>

                                {/* Preview — always visible (first 2 tasks, compact) */}
                                {!isUrgentExpanded && (
                                    <div className="space-y-2">
                                        {(tasks?.filter(t => t.priority === 'high').slice(0, 2) || []).map((task) => (
                                            <div key={task.id}
                                                onClick={() => openTaskModal(task)}
                                                className="flex items-center gap-3 p-3 rounded-2xl bg-red-50/50 dark:bg-red-500/5 border border-red-100 dark:border-red-900/30 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                                    <AlertCircle size={14} className="text-red-500" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{task.title}</span>
                                            </div>
                                        ))}
                                        {(tasks?.filter(t => t.priority === 'high').length || 0) > 2 && (
                                            <p className="text-center text-xs text-slate-400 font-medium pt-1">
                                                +{(tasks?.filter(t => t.priority === 'high').length || 0) - 2} más — toca para expandir
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Expanded — full detail cards */}
                                {isUrgentExpanded && (
                                    <div className="space-y-3">
                                        {(tasks?.filter(t => t.priority === 'high') || []).map((task) => {
                                            const subtasks = task.subtasks || task.ai_extracted?.suggested_subtasks || [];
                                            const completedSubs = subtasks.filter((s: any) => s.completed).length;
                                            const subProgress = subtasks.length > 0 ? Math.round((completedSubs / subtasks.length) * 100) : 0;
                                            const statusLabel = task.status === 'todo' ? 'Por hacer' : task.status === 'doing' ? 'En progreso' : task.status === 'review' ? 'Revisión' : 'Hecho';
                                            const statusColor = task.status === 'done' ? '#10b981' : task.status === 'doing' ? '#3b82f6' : task.status === 'review' ? '#f59e0b' : '#94a3b8';

                                            return (
                                                <div key={task.id}
                                                    onClick={() => openTaskModal(task)}
                                                    className="p-4 rounded-2xl bg-white dark:bg-[#0f1325] border border-red-100 dark:border-red-900/30 shadow-sm hover:shadow-lg transition-all cursor-pointer active:scale-[0.98] space-y-3"
                                                >
                                                    {/* Header */}
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{task.title}</h4>
                                                            {task.description && (
                                                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                                                            )}
                                                        </div>
                                                        <span
                                                            className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg flex-shrink-0"
                                                            style={{ background: `${statusColor}15`, color: statusColor }}
                                                        >
                                                            {statusLabel}
                                                        </span>
                                                    </div>

                                                    {/* Subtask progress bar */}
                                                    {subtasks.length > 0 && (
                                                        <div>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fases</span>
                                                                <span className="text-[10px] font-bold" style={{ color: subProgress === 100 ? '#10b981' : '#5848e8' }}>{completedSubs}/{subtasks.length}</span>
                                                            </div>
                                                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                                <div
                                                                    className="h-full rounded-full transition-all duration-500"
                                                                    style={{
                                                                        width: `${subProgress}%`,
                                                                        background: subProgress === 100 ? '#10b981' : 'linear-gradient(90deg, #5848e8, #8b5cf6)'
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Footer meta */}
                                                    <div className="flex items-center gap-3 pt-1">
                                                        <div className="flex items-center gap-1 text-slate-400">
                                                            <Clock size={10} />
                                                            <span className="text-[10px] font-medium">
                                                                {new Date(task.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                            </span>
                                                        </div>
                                                        <span className="text-[9px] font-black text-red-500 uppercase tracking-wider bg-red-500/5 px-1.5 py-0.5 rounded">URGENTE</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                        )}
                    </main>
                )}

                {/* Bottom Nav - Mobile */}
                <nav className="absolute bottom-0 w-full bg-background-light/95 dark:bg-card-dark/95 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 pb-8 pt-3 px-6 z-30">
                    <ul className="flex justify-between items-center">
                        <li>
                            <button className={`flex flex-col items-center gap-1 transition-colors ${activeView === 'home' ? 'text-primary' : 'text-gray-400 dark:text-gray-500 hover:text-primary'}`} onClick={() => setActiveView('home')}>
                                <Home size={22} /><span className="text-[10px] font-medium">Home</span>
                            </button>
                        </li>
                        <li>
                            <button className={`flex flex-col items-center gap-1 transition-colors ${activeView === 'calendar' ? 'text-primary' : 'text-gray-400 dark:text-gray-500 hover:text-primary'}`} onClick={() => setActiveView(activeView === 'calendar' ? 'home' : 'calendar')}>
                                <CalendarDays size={22} /><span className="text-[10px] font-medium">Calendario</span>
                            </button>
                        </li>
                        <li>
                            <div className="relative -top-6">
                                <button onClick={() => openTaskModal()} disabled={!currentWorkspaceId} className="w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/40 flex items-center justify-center hover:bg-primary-hover transition-all hover:scale-110 active:scale-95 text-white disabled:bg-gray-400">
                                    <Plus size={30} />
                                </button>
                            </div>
                        </li>
                        <li>
                            <button onClick={openWorkspaceManager} className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-primary transition-colors">
                                <FolderOpen size={22} /><span className="text-[10px] font-medium">Spaces</span>
                            </button>
                        </li>
                        <li>
                            <button className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-primary transition-colors">
                                <UserIcon size={22} /><span className="text-[10px] font-medium">Profile</span>
                            </button>
                        </li>
                    </ul>
                </nav>

                {/* Audio Drawer - Mobile */}
                <div className={`fixed inset-x-0 bottom-0 max-w-md mx-auto bg-background-light dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 shadow-2xl transition-all duration-300 z-40 overflow-hidden ${isAudioDrawerOpen ? 'h-[400px]' : 'h-0'}`}>
                    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
                        <div onClick={() => setIsAudioDrawerOpen(false)} className="h-10 flex items-center justify-center cursor-pointer border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar"><AudioRecorder /></div>
                    </div>
                </div>

                <TaskModal />
                <WorkspaceManager />
            </div>
        </div>
    );
};

export default Dashboard;
