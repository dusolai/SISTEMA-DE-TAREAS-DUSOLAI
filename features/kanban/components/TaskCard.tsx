import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../../types';
import { GripVertical, AlertTriangle, ArrowDown, ArrowUp, Minus, CheckCircle2 } from 'lucide-react';
import { useUIStore } from '../../../store/uiStore';

interface TaskCardProps {
    task: Task;
}

const priorityConfig = {
    high: { color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: <ArrowUp className="h-3 w-3" /> },
    medium: { color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', icon: <Minus className="h-3 w-3" /> },
    low: { color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: <ArrowDown className="h-3 w-3" /> },
};

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
    const { openTaskModal } = useUIStore();

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    const aiData = task.ai_extracted as any;
    const needsClarification = aiData?.needs_clarification;
    const progress = task.progress || 0;

    const priority = (task.priority as keyof typeof priorityConfig) || 'medium';
    const pConfig = priorityConfig[priority];

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            onClick={() => openTaskModal(task)}
            className={`
                group relative bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-700/50 
                hover:border-gray-600 hover:shadow-lg hover:shadow-black/20 transition-all touch-none cursor-pointer flex flex-col gap-3
                ${needsClarification ? 'ring-1 ring-yellow-500/50 border-yellow-500/30 bg-yellow-500/5' : ''}
            `}
        >
            <div className="flex justify-between items-start gap-3">
                <h4 className="text-gray-100 font-medium text-sm leading-snug break-words flex-1">
                    {task.title}
                </h4>
                 <div {...listeners} className="cursor-grab p-1 text-gray-600 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2">
                    <GripVertical size={14} />
                </div>
            </div>
            
            {/* Barra de Progreso (Si hay subtareas iniciadas) */}
            {progress > 0 && (
                <div className="w-full bg-gray-700/50 h-1.5 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                        style={{ width: `${progress}%` }} 
                    />
                </div>
            )}

            <div className="flex items-center justify-between pt-1 mt-1">
                <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${pConfig.color}`}>
                    {pConfig.icon}
                    <span>{priority}</span>
                </div>

                <div className="flex items-center gap-2">
                    {progress > 0 && (
                        <span className="text-[10px] font-medium text-gray-500">{progress}%</span>
                    )}
                    {needsClarification && (
                        <div className="text-yellow-400 animate-pulse">
                            <AlertTriangle size={14} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskCard;
