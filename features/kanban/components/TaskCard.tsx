import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../../types';
import { GripVertical, AlertTriangle, ArrowDown, ArrowUp, Minus, AlignLeft } from 'lucide-react';
import { useUIStore } from '../../../store/uiStore';

interface TaskCardProps {
    task: Task;
}

const priorityConfig = {
    high: { color: 'bg-red-500/10 text-red-300 border-red-500/20', icon: <ArrowUp className="h-3 w-3" /> },
    medium: { color: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20', icon: <Minus className="h-3 w-3" /> },
    low: { color: 'bg-green-500/10 text-green-300 border-green-500/20', icon: <ArrowDown className="h-3 w-3" /> },
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
            {/* Cabecera: Título y Grip */}
            <div className="flex justify-between items-start gap-3">
                <h4 className="text-gray-100 font-medium text-sm leading-snug break-words flex-1">
                    {task.title}
                </h4>
                 <div {...listeners} className="cursor-grab p-1 text-gray-600 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2">
                    <GripVertical size={14} />
                </div>
            </div>
            
            {/* Preview de Descripción (Si existe) */}
            {task.description && (
                <div className="flex items-start gap-2 text-gray-400">
                    <AlignLeft size={12} className="mt-0.5 shrink-0 opacity-50" />
                    <p className="text-xs line-clamp-2 leading-relaxed opacity-80">
                        {task.description}
                    </p>
                </div>
            )}

            {/* Footer: Prioridad y Avisos */}
            <div className="flex items-center justify-between pt-1 border-t border-gray-700/30 mt-1">
                <div className={`flex items-center space-x-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${pConfig.color}`}>
                    {pConfig.icon}
                    <span>{priority}</span>
                </div>

                {needsClarification && (
                    <div className="flex items-center text-yellow-400 text-xs font-medium gap-1.5 px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 animate-pulse">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Revisar</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskCard;
