
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../../types';
import { GripVertical, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';

interface TaskCardProps {
    task: Task;
}

const priorityClasses = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
};

const priorityIcons = {
    high: <ArrowUp className="h-4 w-4 text-red-200" />,
    medium: <GripVertical className="h-4 w-4 text-yellow-200" />,
    low: <ArrowDown className="h-4 w-4 text-green-200" />,
};

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700 touch-none"
        >
            <div className="flex justify-between items-start">
                <p className="text-gray-100 font-medium break-words pr-2">{task.title}</p>
                 <div {...listeners} className="cursor-grab p-1 text-gray-500 hover:text-white">
                    <GripVertical size={16} />
                </div>
            </div>
             <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className={`flex items-center space-x-1 capitalize text-xs font-semibold px-2 py-1 rounded-full ${priorityClasses[task.priority]} text-white/90`}>
                        {priorityIcons[task.priority]}
                        <span>{task.priority}</span>
                    </div>
                </div>
                {task.ai_extracted?.needs_clarification && (
                    <div title="AI needs clarification">
                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskCard;
