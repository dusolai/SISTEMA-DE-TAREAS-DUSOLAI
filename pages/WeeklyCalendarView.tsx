import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, CalendarDays } from 'lucide-react';
import useTasks from '../features/kanban/hooks/useTasks';
import { useUIStore } from '../store/uiStore';
import { Task } from '../types';

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7am to 10pm
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun, 1=Mon ...
    const diff = (day === 0 ? -6 : 1 - day); // adjust to Monday
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function formatMonthRange(start: Date, end: Date): string {
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('es-ES', opts)} – ${end.toLocaleDateString('es-ES', { ...opts, year: 'numeric' })}`;
}

const PRIORITY_COLORS: Record<string, string> = {
    high: 'bg-red-500',
    medium: 'bg-amber-400',
    low: 'bg-emerald-500',
};

const WeeklyCalendarView: React.FC = () => {
    const { tasks, scheduleTask } = useTasks();
    const { currentWorkspaceId } = useUIStore();
    const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const weekDays = useMemo(() =>
        Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
        [weekStart]
    );

    const workspaceTasks = useMemo(() =>
        tasks.filter(t => !currentWorkspaceId || t.workspace_id === currentWorkspaceId),
        [tasks, currentWorkspaceId]
    );

    const scheduledTasks = useMemo(() => {
        const map: Record<string, Task[]> = {};
        workspaceTasks.forEach(t => {
            if (!t.scheduled_at) return;
            const d = new Date(t.scheduled_at);
            // Only show if task is in this week
            const dayIdx = weekDays.findIndex(wd =>
                wd.toDateString() === new Date(d.toDateString()).toDateString()
            );
            if (dayIdx === -1) return;
            const hour = d.getHours();
            const key = `${dayIdx}-${hour}`;
            map[key] = map[key] ? [...map[key], t] : [t];
        });
        return map;
    }, [workspaceTasks, weekDays]);

    const unscheduledTasks = useMemo(() =>
        workspaceTasks.filter(t => !t.scheduled_at),
        [workspaceTasks]
    );

    const handleSlotClick = (dayIdx: number, hour: number) => {
        if (!selectedTask) return;
        const d = new Date(weekDays[dayIdx]);
        d.setHours(hour, 0, 0, 0);
        scheduleTask(selectedTask.id, d.toISOString());
        setSelectedTask(null);
    };

    const handleUnschedule = (task: Task, e: React.MouseEvent) => {
        e.stopPropagation();
        scheduleTask(task.id, null);
    };

    const prevWeek = () => setWeekStart(prev => addDays(prev, -7));
    const nextWeek = () => setWeekStart(prev => addDays(prev, 7));

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <button onClick={prevWeek} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <ChevronLeft size={18} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <div className="text-center">
                        <p className="text-xs font-bold text-primary uppercase tracking-widest">Semana</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {formatMonthRange(weekStart, addDays(weekStart, 6))}
                        </p>
                    </div>
                    <button onClick={nextWeek} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <ChevronRight size={18} className="text-slate-600 dark:text-slate-300" />
                    </button>
                </div>
            </div>

            {/* Selected task indicator */}
            {selectedTask && (
                <div className="flex-shrink-0 mx-4 mt-2 p-2.5 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between">
                    <p className="text-xs font-bold text-primary truncate flex-1 mr-2">
                        📌 Selecciona un slot para: <span className="font-black">{selectedTask.title}</span>
                    </p>
                    <button onClick={() => setSelectedTask(null)} className="flex-shrink-0 text-primary hover:text-red-500 transition-colors">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto custom-scrollbar relative">
                {/* Day headers - sticky */}
                <div className="sticky top-0 z-20 bg-white dark:bg-[#020412] flex">
                    <div className="w-12 flex-shrink-0" />
                    {weekDays.map((day, i) => {
                        const isToday = day.toDateString() === new Date().toDateString();
                        return (
                            <div key={i} className="flex-1 min-w-0 text-center py-2 border-l border-slate-100 dark:border-slate-800/50">
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? 'text-primary' : 'text-slate-400'}`}>
                                    {DAYS[i]}
                                </p>
                                <p className={`text-sm font-black ${isToday ? 'text-primary bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center mx-auto' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {day.getDate()}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Hour rows */}
                {HOURS.map(hour => (
                    <div key={hour} className="flex min-h-[56px]">
                        {/* Hour label */}
                        <div className="w-12 flex-shrink-0 flex items-start justify-end pr-2 pt-1">
                            <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                                {hour < 10 ? `0${hour}` : hour}h
                            </span>
                        </div>
                        {/* Day cells */}
                        {weekDays.map((_, dayIdx) => {
                            const key = `${dayIdx}-${hour}`;
                            const slotTasks = scheduledTasks[key] || [];
                            const isHighlighted = selectedTask !== null;
                            return (
                                <div
                                    key={dayIdx}
                                    onClick={() => handleSlotClick(dayIdx, hour)}
                                    className={`flex-1 min-w-0 border-l border-t border-slate-100 dark:border-slate-800/50 p-0.5 transition-colors relative
                                        ${isHighlighted ? 'cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20' : ''}
                                    `}
                                >
                                    {slotTasks.map(task => (
                                        <div
                                            key={task.id}
                                            className={`group w-full rounded-md px-1 py-0.5 mb-0.5 flex items-center justify-between gap-0.5 cursor-pointer shadow-sm
                                                ${PRIORITY_COLORS[task.priority] || 'bg-slate-400'}
                                            `}
                                            onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }}
                                        >
                                            <span className="text-[9px] font-bold text-white truncate leading-tight">
                                                {task.title}
                                            </span>
                                            <button
                                                onClick={(e) => handleUnschedule(task, e)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-white/80 hover:text-white"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Unscheduled Tasks Panel */}
            <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0f1325]">
                <div className="px-4 pt-3 pb-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Sin planificar ({unscheduledTasks.length})
                    </p>
                    {unscheduledTasks.length === 0 ? (
                        <div className="flex items-center justify-center py-3 text-slate-400">
                            <CalendarDays size={14} className="mr-1.5" />
                            <span className="text-xs font-bold">¡Todas las tareas están planificadas!</span>
                        </div>
                    ) : (
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
                            {unscheduledTasks.map(task => (
                                <button
                                    key={task.id}
                                    onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 transition-all text-xs font-bold shadow-sm
                                        ${selectedTask?.id === task.id
                                            ? 'border-primary bg-primary text-white shadow-primary/30 scale-[1.05]'
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'}
                                    `}
                                >
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLORS[task.priority]}`} />
                                    <span className="max-w-[100px] truncate">{task.title}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WeeklyCalendarView;
