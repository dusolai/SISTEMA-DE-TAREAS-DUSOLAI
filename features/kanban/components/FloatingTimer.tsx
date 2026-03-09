import React, { useState, useEffect, useRef } from 'react';
import { Timer, Square, Maximize2 } from 'lucide-react';
import useTasks from '../hooks/useTasks';
import { useUIStore } from '../../../store/uiStore';

const formatDuration = (totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
};

const FloatingTimer: React.FC = () => {
    const { tasks, stopWorkSession } = useTasks();
    const { openTaskModal, isTaskModalOpen, theme } = useUIStore();
    const isDark = theme === 'dark';

    // Find the task that has an active session
    let activeTask = null;
    let activeSession = null;

    for (const task of tasks) {
        const session = task.work_sessions?.find(s => s.ended_at === null);
        if (session) {
            activeTask = task;
            activeSession = session;
            break;
        }
    }

    const [elapsed, setElapsed] = useState(0);
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

    // Don't show if modal is open to avoid double timers, or if no active session
    if (!activeTask || !activeSession || isTaskModalOpen) return null;

    const handleStop = async () => {
        const comment = prompt('Sesión Deep Work finalizada. ¿Qué lograste avanzar en esta sesión?');
        if (comment !== null) { // User didn't cancel the prompt
            await stopWorkSession(activeTask.id, comment);
        }
    };

    const handleOpenTask = () => {
        openTaskModal(activeTask);
    };

    return (
        <div className={`fixed bottom-6 right-6 z-40 p-3 rounded-2xl shadow-2xl border-2 border-green-500/50 flex items-center gap-4 transition-all hover:scale-105 active:scale-95 cursor-pointer
            ${isDark ? 'bg-[#0f1325] shadow-green-900/20' : 'bg-white shadow-green-500/20'}`}
            onClick={handleOpenTask}
        >
            <div className={`p-2 rounded-xl flex items-center justify-center animate-pulse ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                <Timer size={20} />
            </div>

            <div className="flex flex-col min-w-[120px]">
                <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest leading-none mb-1">Deep Work Activo</p>
                <div className="flex items-end gap-2">
                    <p className={`text-xl font-black font-mono tabular-nums leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatDuration(elapsed)}
                    </p>
                </div>
                <p className={`text-xs truncate max-w-[150px] mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {activeTask.title}
                </p>
            </div>

            <div className="flex flex-col gap-1 ml-2 border-l pl-3 border-green-500/20">
                <button
                    onClick={(e) => { e.stopPropagation(); handleStop(); }}
                    className={`p-2 rounded-lg transition-colors group ${isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-50'}`}
                    title="Detener Sesión"
                >
                    <Square size={16} className={`${isDark ? 'text-red-400 group-hover:text-red-300' : 'text-red-500 group-hover:text-red-600'}`} fill="currentColor" />
                </button>
            </div>
        </div>
    );
};

export default FloatingTimer;
