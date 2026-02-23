import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, CalendarDays, Layers } from 'lucide-react';
import useTasks from '../features/kanban/hooks/useTasks';
import { useWorkspaces } from '../features/kanban/hooks/useWorkspaces';
import { useUIStore } from '../store/uiStore';
import { Task } from '../types';
import { supabase } from '../services/supabase';

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7am to 10pm
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Workspace color palette
const WS_COLORS = [
    { bg: 'bg-violet-500', text: 'text-violet-700 dark:text-violet-300', pill: 'bg-violet-100 dark:bg-violet-900/40' },
    { bg: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300', pill: 'bg-blue-100 dark:bg-blue-900/40' },
    { bg: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', pill: 'bg-emerald-100 dark:bg-emerald-900/40' },
    { bg: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', pill: 'bg-amber-100 dark:bg-amber-900/40' },
    { bg: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-300', pill: 'bg-rose-100 dark:bg-rose-900/40' },
    { bg: 'bg-cyan-500', text: 'text-cyan-700 dark:text-cyan-300', pill: 'bg-cyan-100 dark:bg-cyan-900/40' },
    { bg: 'bg-pink-500', text: 'text-pink-700 dark:text-pink-300', pill: 'bg-pink-100 dark:bg-pink-900/40' },
    { bg: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-300', pill: 'bg-orange-100 dark:bg-orange-900/40' },
    { bg: 'bg-teal-500', text: 'text-teal-700 dark:text-teal-300', pill: 'bg-teal-100 dark:bg-teal-900/40' },
    { bg: 'bg-indigo-500', text: 'text-indigo-700 dark:text-indigo-300', pill: 'bg-indigo-100 dark:bg-indigo-900/40' },
];

const PRIORITY_COLORS: Record<string, string> = {
    high: 'bg-red-500',
    medium: 'bg-amber-400',
    low: 'bg-emerald-500',
};

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
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

// Get all schedule slots from a task (with backward compatibility)
function getTaskSlots(task: Task): string[] {
    if (task.scheduled_slots && task.scheduled_slots.length > 0) return task.scheduled_slots;
    if (task.scheduled_at) return [task.scheduled_at];
    return [];
}

const WeeklyCalendarView: React.FC = () => {
    const { addScheduleSlot, removeScheduleSlot } = useTasks();
    const { workspaces } = useWorkspaces();
    const { theme, currentWorkspaceId } = useUIStore();
    const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch ALL tasks from ALL workspaces
    useEffect(() => {
        const fetchAll = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('tasks')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (error) throw error;
                setAllTasks(data || []);
            } catch (e) {
                console.error('Error fetching all tasks for calendar:', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAll();
    }, []);

    // Map workspace id to name + color
    const wsMap = useMemo(() => {
        const map: Record<string, { name: string; colorIdx: number }> = {};
        (workspaces || []).forEach((ws, idx) => {
            map[ws.id] = { name: ws.name, colorIdx: idx % WS_COLORS.length };
        });
        return map;
    }, [workspaces]);

    const weekDays = useMemo(() =>
        Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
        [weekStart]
    );

    // Build map: "dayIdx-hour" => { task, slotIso }[]
    const scheduledMap = useMemo(() => {
        const map: Record<string, { task: Task; slotIso: string }[]> = {};
        allTasks.forEach(t => {
            const slots = getTaskSlots(t);
            slots.forEach(slot => {
                const d = new Date(slot);
                const dayIdx = weekDays.findIndex(wd =>
                    wd.toDateString() === new Date(d.toDateString()).toDateString()
                );
                if (dayIdx === -1) return;
                const hour = d.getHours();
                const key = `${dayIdx}-${hour}`;
                if (!map[key]) map[key] = [];
                map[key].push({ task: t, slotIso: slot });
            });
        });
        return map;
    }, [allTasks, weekDays]);

    const unscheduledTasks = useMemo(() =>
        allTasks.filter(t => getTaskSlots(t).length === 0 && (!currentWorkspaceId || t.workspace_id === currentWorkspaceId)),
        [allTasks, currentWorkspaceId]
    );

    const handleSlotClick = async (dayIdx: number, hour: number) => {
        if (!selectedTask) return;
        const d = new Date(weekDays[dayIdx]);
        d.setHours(hour, 0, 0, 0);
        const iso = d.toISOString();

        await addScheduleSlot(selectedTask.id, iso);

        // Update local state
        setAllTasks(prev => prev.map(t =>
            t.id === selectedTask.id
                ? { ...t, scheduled_slots: [...(getTaskSlots(t)), iso] }
                : t
        ));

        // Don't deselect — allow placing in multiple slots
    };

    const handleUnschedule = async (task: Task, slotIso: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await removeScheduleSlot(task.id, slotIso);

        // Update local state
        setAllTasks(prev => prev.map(t =>
            t.id === task.id
                ? { ...t, scheduled_slots: getTaskSlots(t).filter(s => s !== slotIso) }
                : t
        ));
    };

    const prevWeek = () => setWeekStart(prev => addDays(prev, -7));
    const nextWeek = () => setWeekStart(prev => addDays(prev, 7));

    const getWsInfo = (wsId?: string) => {
        if (!wsId || !wsMap[wsId]) return { name: '?', color: WS_COLORS[0] };
        const info = wsMap[wsId];
        return { name: info.name, color: WS_COLORS[info.colorIdx] };
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <button onClick={prevWeek} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <ChevronLeft size={18} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-0.5">
                            <Layers size={12} className="text-primary" />
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                                Todos los Workspaces
                            </p>
                        </div>
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
                    <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                        <p className="text-xs font-bold text-primary truncate">
                            📌 Haz click en los slots donde quieras planificar:
                        </p>
                        <span className="text-xs font-black text-primary truncate">{selectedTask.title}</span>
                    </div>
                    <button onClick={() => setSelectedTask(null)} className="flex-shrink-0 px-2 py-1 rounded-lg bg-primary text-white text-[10px] font-bold hover:bg-primary/80 transition-colors">
                        Listo
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

                {/* Loading */}
                {isLoading && (
                    <div className="flex items-center justify-center py-8 text-slate-400">
                        <span className="text-sm font-bold">Cargando tareas...</span>
                    </div>
                )}

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
                            const slotEntries = scheduledMap[key] || [];
                            const isHighlighted = selectedTask !== null;
                            return (
                                <div
                                    key={dayIdx}
                                    onClick={() => handleSlotClick(dayIdx, hour)}
                                    className={`flex-1 min-w-0 border-l border-t border-slate-100 dark:border-slate-800/50 p-0.5 transition-colors relative
                                        ${isHighlighted ? 'cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20' : ''}
                                    `}
                                >
                                    {slotEntries.map(({ task, slotIso }) => {
                                        const ws = getWsInfo(task.workspace_id);
                                        return (
                                            <div
                                                key={`${task.id}-${slotIso}`}
                                                className={`group w-full rounded-md px-1 py-0.5 mb-0.5 cursor-pointer shadow-sm
                                                    ${PRIORITY_COLORS[task.priority] || 'bg-slate-400'}
                                                `}
                                                onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }}
                                            >
                                                <div className="flex items-start justify-between gap-1">
                                                    <span className="text-[9px] font-bold text-white leading-tight flex-1 line-clamp-2">
                                                        {task.title}
                                                    </span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleUnschedule(task, slotIso, e); }}
                                                        className="flex-shrink-0 text-white/90 hover:text-white p-1.5 -mt-1 -mr-1 bg-black/10 hover:bg-black/20 rounded-bl-lg rounded-tr-md transition-colors"
                                                        title="Quitar de este horario"
                                                    >
                                                        <X size={14} strokeWidth={4} />
                                                    </button>
                                                </div>
                                                {/* Workspace label */}
                                                <span className="text-[7px] font-black text-white/80 uppercase tracking-wider leading-none">
                                                    {ws.name}
                                                </span>
                                            </div>
                                        );
                                    })}
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
                            {unscheduledTasks.map(task => {
                                const ws = getWsInfo(task.workspace_id);
                                return (
                                    <button
                                        key={task.id}
                                        onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                                        className={`flex-shrink-0 flex flex-col items-start gap-0.5 px-3 py-1.5 rounded-xl border-2 transition-all text-xs font-bold shadow-sm
                                            ${selectedTask?.id === task.id
                                                ? 'border-primary bg-primary text-white shadow-primary/30 scale-[1.05]'
                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'}
                                        `}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLORS[task.priority]}`} />
                                            <span className="max-w-[100px] truncate">{task.title}</span>
                                        </div>
                                        {/* Workspace badge */}
                                        <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md leading-none
                                            ${selectedTask?.id === task.id
                                                ? 'bg-white/20 text-white/90'
                                                : `${ws.color.pill} ${ws.color.text}`
                                            }
                                        `}>
                                            {ws.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WeeklyCalendarView;
