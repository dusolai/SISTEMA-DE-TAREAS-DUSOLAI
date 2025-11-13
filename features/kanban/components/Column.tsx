
import React from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { Task } from '../../../types';
import TaskCard from './TaskCard';

interface ColumnProps {
    id: string;
    title: string;
    tasks: Task[];
}

const Column: React.FC<ColumnProps> = ({ id, title, tasks }) => {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div ref={setNodeRef} className="bg-gray-800/50 rounded-xl flex flex-col h-full max-h-[calc(100vh-200px)]">
            <h3 className="p-4 text-lg font-semibold text-white sticky top-0 bg-gray-800/50 rounded-t-xl z-10">
                {title} <span className="text-sm text-gray-400">{tasks.length}</span>
            </h3>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
};

export default Column;
