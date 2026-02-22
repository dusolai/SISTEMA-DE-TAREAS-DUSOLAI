import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Clock, GripVertical, CheckCircle2 } from 'lucide-react';
import { Task } from '../../../types';
import { useUIStore } from '../../../store/uiStore';

interface Props {
    task: Task;
}

const TaskCard: React.FC<Props> = ({ task }) => {
    const { openTaskModal } = useUIStore();

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: { task }
    });

    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

    const priorityColors = {
        low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
        medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
        high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            // ESTO ABRE EL MODAL CORRECTAMENTE
            onClick={() => openTaskModal(task)}
            className={`
                group relative bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 
                hover:shadow-md transition-all duration-200 cursor-pointer 
                ${isDragging ? 'opacity-50 rotate-2 scale-105 z-50' : 'opacity-100'}
            `}
        >
            <button
                {...listeners}
                {...attributes}
                className="absolute top-3 right-3 text-gray-400 hover:text-indigo-500 cursor-grab active:cursor-grabbing p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
            >
                <GripVertical size={16} />
            </button>

            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 pr-6 line-clamp-2">
                {task.title}
            </h3>

            {task.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                    {task.description}
                </p>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-700/50">
                <span className={`text-[10px] px-2 py-1 rounded-full font-medium border ${priorityColors[task.priority]}`}>
                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                </span>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        {task.notion_url && (
                            <a
                                href={task.notion_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-indigo-500"
                                title="Abrir en Notion"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-notion">
                                    <path d="M3 3h18v18H3z" />
                                    <path d="M7 7v10" />
                                    <path d="M7 7l5 5 5-5" />
                                    <path d="M17 7v10" />
                                </svg>
                            </a>
                        )}
                        {task.drive_url && (
                            <a
                                href={task.drive_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-emerald-500"
                                title="Abrir en Google Drive"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-drive">
                                    <path d="M22 10L15 22L2 22L9 10L22 10Z" />
                                    <path d="M20 7L13 2H5L12 14L20 7Z" />
                                    <path d="M2 22L9 10L2 2L2 22Z" />
                                </svg>
                            </a>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                        <Clock size={12} />
                        <span className="text-xs">
                            {new Date(task.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskCard;