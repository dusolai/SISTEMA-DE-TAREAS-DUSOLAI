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

const ActiveTimerItem: React.FC<{
    task: any;
    session: any;
    isDark: boolean;
    onStop: (taskId: string) => void;
    onClick: () => void;
}> = ({ task, session, isDark, onStop, onClick }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const calcElapsed = () => Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);
        setElapsed(calcElapsed());
        const intervalId = setInterval(() => setElapsed(calcElapsed()), 1000);
        return () => clearInterval(intervalId);
    }, [session.id, session.started_at]);

    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-4 rounded-xl p-2 transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer`}
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
                    {task.title}
                </p>
            </div>

            <div className="flex flex-col gap-1 ml-2 border-l pl-3 border-green-500/20">
                <button
                    onClick={(e) => { e.stopPropagation(); onStop(task.id); }}
                    className={`p-2 rounded-lg transition-colors group ${isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-50'}`}
                    title="Detener Sesión"
                >
                    <Square size={16} className={`${isDark ? 'text-red-400 group-hover:text-red-300' : 'text-red-500 group-hover:text-red-600'}`} fill="currentColor" />
                </button>
            </div>
        </div>
    );
};

const FloatingTimer: React.FC = () => {
    const { tasks, stopWorkSession } = useTasks();
    const { openTaskModal, isTaskModalOpen, theme } = useUIStore();
    const isDark = theme === 'dark';

    // Find ALL tasks that have an active session
    const activeTimers: { task: any, session: any }[] = [];

    for (const task of tasks) {
        const session = task.work_sessions?.find((s: any) => s.ended_at === null);
        if (session) {
            activeTimers.push({ task, session });
        }
    }

    // Don't show if modal is open to avoid double timers, or if no active sessions
    if (activeTimers.length === 0 || isTaskModalOpen) return null;

    const handleStop = async (taskId: string) => {
        const comment = prompt('Sesión Deep Work finalizada. ¿Qué lograste avanzar en esta sesión?');
        if (comment !== null) {
            await stopWorkSession(taskId, comment);
        }
    };

    return (
        <div className={`fixed bottom-6 right-6 z-40 p-2 rounded-2xl shadow-2xl border-2 border-green-500/50 flex flex-col gap-2 transition-all 
        ${isDark ? 'bg-[#0f1325] shadow-green-900/20' : 'bg-white shadow-green-500/20'}`}
        >
            {activeTimers.map(({ task, session }) => (
                <ActiveTimerItem
                    key={session.id}
                    task={task}
                    session={session}
                    isDark={isDark}
                    onStop={handleStop}
                    onClick={() => openTaskModal(task)}
                />
            ))}
        </div>
    );
};

export default FloatingTimer;
