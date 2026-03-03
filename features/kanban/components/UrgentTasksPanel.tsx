import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, MoreVertical, LayoutList } from 'lucide-react';
import { Task } from '../../../types';
import { useUIStore } from '../../../store/uiStore';
import useTasks from '../hooks/useTasks';

interface UrgentTasksPanelProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}

const UrgentTasksPanel: React.FC<UrgentTasksPanelProps> = ({ tasks, onTaskClick }) => {
    const { theme } = useUIStore();
    const { updateTask } = useTasks();
    const [showAll, setShowAll] = useState(false);
    const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

    if (tasks.length === 0) return null;

    const displayTasks = showAll ? tasks : tasks.slice(0, 5);

    const handleQuickComplete = async (e: React.MouseEvent, taskId: string) => {
        e.stopPropagation(); // Prevents opening the modal
        await updateTask(taskId, { status: 'done' });
    };

    return (
        <div className="flex flex-col gap-3 mt-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </div>
                    <h3 className={`text-sm font-black m-0 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        Tareas Urgentes
                    </h3>
                    <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {tasks.length}
                    </span>
                </div>
                {tasks.length > 5 && (
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="text-[11px] font-bold text-primary hover:text-primary-hover bg-primary/5 hover:bg-primary/10 px-3 py-1 rounded-full transition-colors"
                    >
                        {showAll ? 'Ver menos' : 'Ver todas'}
                    </button>
                )}
            </div>

            {/* Task List */}
            <div className="flex flex-col gap-2.5">
                {displayTasks.map(task => {
                    const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
                    const totalSubtasks = task.subtasks?.length || 0;
                    const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
                    const hasSubtasks = totalSubtasks > 0;

                    const isHovered = hoveredTaskId === task.id;

                    return (
                        <div
                            key={task.id}
                            onMouseEnter={() => setHoveredTaskId(task.id)}
                            onMouseLeave={() => setHoveredTaskId(null)}
                            onClick={() => onTaskClick(task)}
                            className={`
                                relative group overflow-hidden cursor-pointer rounded-2xl p-3.5 
                                transition-all duration-300 ease-out border
                                ${theme === 'dark'
                                    ? 'bg-[#0f1325]/80 hover:bg-[#151a30] border-red-500/20 hover:border-red-500/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                                    : 'bg-red-50/50 hover:bg-red-50 border-red-100 hover:border-red-200 hover:shadow-lg hover:shadow-red-500/10'}
                                ${isHovered ? 'transform -translate-y-0.5' : ''}
                            `}
                        >
                            {/* Animated Background Gradient on Hover */}
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${theme === 'dark' ? 'from-red-500/5' : 'from-red-500/5'} to-transparent pointer-events-none`} />

                            <div className="relative z-10 flex items-start justify-between gap-3">
                                {/* Left: Icon & Title */}
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className={`
                                        w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300
                                        ${theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-500'}
                                        ${isHovered ? 'scale-110' : ''}
                                    `}>
                                        <AlertCircle size={16} strokeWidth={isHovered ? 2.5 : 2} className={isHovered ? 'animate-pulse' : ''} />
                                    </div>
                                    <div className="flex flex-col gap-1.5 min-w-0 mt-0.5">
                                        <span className={`text-xs md:text-sm font-bold truncate ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                            {task.title}
                                        </span>

                                        {/* Subtasks Progress Indicator */}
                                        {hasSubtasks && (
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                                                    <LayoutList size={10} />
                                                    {completedSubtasks}/{totalSubtasks}
                                                </div>
                                                <div className="h-1.5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-red-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Quick Actions (Visible on Hover/Focus based) */}
                                <div className={`
                                    flex items-center gap-1 transition-all duration-300 transform
                                    ${isHovered || window.innerWidth < 768 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}
                                `}>
                                    <button
                                        onClick={(e) => handleQuickComplete(e, task.id)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-green-500 hover:bg-green-500/10 transition-colors"
                                        title="Marcar como completada"
                                    >
                                        <CheckCircle2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UrgentTasksPanel;
