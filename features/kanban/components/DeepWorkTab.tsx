import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Clock, MessageSquare, ExternalLink, User, Timer } from 'lucide-react';
import { Task, WorkSession } from '../../../types';
import { useUIStore } from '../../../store/uiStore';
import useAuthStore from '../../../store/authStore';

interface DeepWorkTabProps {
    task: Task;
    onStartSession: (taskId: string) => Promise<void>;
    onStopSession: (taskId: string, comment: string) => Promise<void>;
}

const formatDuration = (totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
};

const formatTime = (iso: string): string => {
    return new Date(iso).toLocaleString('es-ES', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
};

const DeepWorkTab: React.FC<DeepWorkTabProps> = ({ task, onStartSession, onStopSession }) => {
    const { theme } = useUIStore();
    const userEmail = useAuthStore.getState().session?.user?.email || '';

    const sessions: WorkSession[] = task.work_sessions || [];
    const activeSession = sessions.find(s => s.ended_at === null);
    const completedSessions = sessions.filter(s => s.ended_at !== null).sort(
        (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );

    const [elapsed, setElapsed] = useState(0);
    const [comment, setComment] = useState('');
    const [isStopping, setIsStopping] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Live timer
    useEffect(() => {
        if (activeSession) {
            const calcElapsed = () => Math.floor((Date.now() - new Date(activeSession.started_at).getTime()) / 1000);
            setElapsed(calcElapsed());
            intervalRef.current = setInterval(() => setElapsed(calcElapsed()), 1000);
        } else {
            setElapsed(0);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [activeSession?.id]);

    const handleStart = async () => {
        await onStartSession(task.id);
    };

    const handleStop = async () => {
        if (!comment.trim()) {
            alert('Escribe un breve comentario sobre lo que has trabajado.');
            return;
        }
        setIsStopping(true);
        await onStopSession(task.id, comment.trim());
        setComment('');
        setIsStopping(false);
    };

    const totalSeconds = task.total_work_seconds || 0;
    const isDark = theme === 'dark';

    return (
        <div className="space-y-6">
            {/* Total Time Summary */}
            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#0a0e1f] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-xl ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                        <Timer size={20} />
                    </div>
                    <div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Tiempo Total Invertido</p>
                        <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {totalSeconds > 0 ? formatDuration(totalSeconds) : '0m 00s'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-4 text-xs font-medium text-slate-500">
                    <span>{completedSessions.length} sesiones completadas</span>
                    {completedSessions.length > 0 && (
                        <span>Media: {formatDuration(Math.round(totalSeconds / completedSessions.length))}/sesión</span>
                    )}
                </div>
            </div>

            {/* Timer / Active Session */}
            <div className={`p-5 rounded-2xl border-2 transition-all duration-500 ${activeSession
                    ? 'border-green-500/50 bg-green-500/5 shadow-lg shadow-green-500/10'
                    : isDark ? 'border-slate-800 bg-[#0a0e1f]' : 'border-slate-200 bg-white'
                }`}>
                {activeSession ? (
                    <>
                        {/* Running Timer */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </div>
                                <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Sesión Activa</span>
                            </div>
                            <span className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                Inicio: {formatTime(activeSession.started_at)}
                            </span>
                        </div>

                        <div className={`text-5xl font-black text-center py-6 font-mono tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {formatDuration(elapsed)}
                        </div>

                        {/* Comment + Stop */}
                        <div className="space-y-3 mt-4">
                            <textarea
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                placeholder="¿En qué has trabajado esta sesión?"
                                rows={2}
                                className={`w-full px-4 py-3 rounded-xl border text-sm resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none ${isDark ? 'bg-[#0f1325] border-slate-700 text-white placeholder-slate-600' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                                    }`}
                            />
                            <button
                                onClick={handleStop}
                                disabled={isStopping}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors disabled:opacity-50"
                            >
                                <Square size={16} fill="white" />
                                {isStopping ? 'Guardando...' : 'Detener Sesión'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Start Button */}
                        <div className="text-center py-4">
                            <p className={`text-sm font-medium mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Inicia una sesión de trabajo profundo para registrar el tiempo
                            </p>
                            <button
                                onClick={handleStart}
                                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-base shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
                            >
                                <Play size={22} fill="white" />
                                Iniciar Deep Work
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Quick Links */}
            {(task.notion_url || task.drive_url || task.github_url) && (
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0a0e1f] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Enlaces del Proyecto</p>
                    <div className="grid grid-cols-3 gap-2">
                        {task.notion_url && (
                            <a href={task.notion_url} target="_blank" rel="noopener noreferrer"
                                className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-white hover:bg-slate-100 text-slate-700 shadow-sm'}`}>
                                <ExternalLink size={14} /> Notion
                            </a>
                        )}
                        {task.drive_url && (
                            <a href={task.drive_url} target="_blank" rel="noopener noreferrer"
                                className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-white hover:bg-slate-100 text-slate-700 shadow-sm'}`}>
                                <ExternalLink size={14} /> Drive
                            </a>
                        )}
                        {task.github_url && (
                            <a href={task.github_url} target="_blank" rel="noopener noreferrer"
                                className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-white hover:bg-slate-100 text-slate-700 shadow-sm'}`}>
                                <ExternalLink size={14} /> GitHub
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* Session History */}
            <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Historial de Sesiones ({completedSessions.length})
                </p>
                {completedSessions.length === 0 ? (
                    <p className={`text-sm text-center py-8 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                        Aún no hay sesiones de trabajo registradas.
                    </p>
                ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {completedSessions.map(session => (
                            <div key={session.id} className={`p-3.5 rounded-xl border transition-colors ${isDark ? 'bg-[#0a0e1f] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Clock size={12} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
                                            <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                {formatDuration(session.duration_seconds)}
                                            </span>
                                        </div>
                                        {session.comment && (
                                            <div className="flex items-start gap-2 mt-1">
                                                <MessageSquare size={11} className="text-slate-400 mt-0.5 shrink-0" />
                                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{session.comment}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`text-[10px] font-medium ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                            {formatTime(session.started_at)}
                                        </p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <User size={10} className="text-slate-500" />
                                            <p className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                                {session.user_email?.split('@')[0]}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeepWorkTab;
