import React from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
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
        // CAMBIO CLAVE: Quitamos 'max-h-[calc...]' y ponemos 'h-full' con 'overflow-hidden'
        <div ref={setNodeRef} className="w-[280px] bg-gray-50/50 dark:bg-card-dark/50 rounded-2xl flex flex-col h-full overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm shrink-0">
            {/* Header de la columna (Fijo) */}
            <h3 className="p-4 text-base font-bold text-gray-900 dark:text-white bg-white/80 dark:bg-card-dark/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 z-10 flex justify-between items-center shrink-0">
                {title}
                <span className="bg-primary/10 text-primary dark:bg-primary/20 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-tighter font-black">{tasks.length}</span>
            </h3>

            {/* Cuerpo de la columna (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                </SortableContext>

                {/* Espacio extra abajo para que sea fácil soltar tareas al final */}
                <div className="h-10"></div>
            </div>
        </div>
    );
};

export default Column;
