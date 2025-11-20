import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../../types';
import { GripVertical, AlertTriangle, ArrowDown, ArrowUp, Minus } from 'lucide-react';

interface TaskCardProps {
    task: Task;
}

const priorityConfig = {
    high: { color: 'bg-red-500/20 text-red-200 border-red-500/30', icon: <ArrowUp className="h-3 w-3" /> },
    medium: { color: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30', icon: <Minus className="h-3 w-3" /> },
    low: { color: 'bg-green-500/20 text-green-200 border-green-500/30', icon: <ArrowDown className="h-3 w-3" /> },
};

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    // Verificamos si hay datos extraídos por IA
    const aiData = task.ai_extracted as any; // Casting simple para acceder al JSONB
    const needsClarification = aiData?.needs_clarification;

    const priority = (task.priority as keyof typeof priorityConfig) || 'medium';
    const pConfig = priorityConfig[priority];

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={`
                group relative bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-700/50 
                hover:border-gray-600 hover:shadow-md transition-all touch-none
                ${needsClarification ? 'ring-2 ring-yellow-500/50 border-yellow-500/20' : ''}
            `}
        >
            <div className="flex justify-between items-start gap-3">
                <p className="text-gray-100 font-medium text-sm leading-snug break-words flex-1">
                    {task.title}
                </p>
                 <div {...listeners} className="cursor-grab p-1 text-gray-600 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical size={14} />
                </div>
            </div>
            
            <div className="mt-3 flex items-center justify-between">
                <div className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${pConfig.color}`}>
                    {pConfig.icon}
                    <span>{priority}</span>
                </div>

                {/* Indicador de IA: Needs Clarification */}
                {needsClarification && (
                    <div className="flex items-center text-yellow-400 text-xs font-medium gap-1 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Duda</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskCard;
