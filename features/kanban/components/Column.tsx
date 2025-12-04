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
        <div ref={setNodeRef} className="bg-gray-800/50 rounded-xl flex flex-col h-full overflow-hidden border border-gray-700/30">
            {/* Header de la columna (Fijo) */}
            <h3 className="p-4 text-lg font-semibold text-white bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 z-10 flex justify-between items-center shrink-0">
                {title} 
                <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">{tasks.length}</span>
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
