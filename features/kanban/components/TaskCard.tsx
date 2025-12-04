import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../../types';
import { AlertTriangle, ArrowDown, ArrowUp, Minus, MoveRight } from 'lucide-react';
import { useUIStore } from '../../../store/uiStore';
import useTasks from '../hooks/useTasks';

interface TaskCardProps {
    task: Task;
}

const priorityConfig = {
    high: { color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: <ArrowUp className="h-3 w-3" /> },
    medium: { color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', icon: <Minus className="h-3 w-3" /> },
    low: { color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: <ArrowDown className="h-3 w-3" /> },
};

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
    // Mantenemos useSortable para no romper KanbanBoard, pero anulamos el arrastre visualmente
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
    const { openTaskModal } = useUIStore();
    const { updateTaskMutation } = useTasks();

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

    // Manejador para el cambio de columna
    const handleMove = (e: React.ChangeEvent<HTMLSelectElement>) => {
        e.stopPropagation(); // Evitar abrir el modal
        updateTaskMutation.mutate({
            id: task.id,
            updates: { status: e.target.value as any }
        });
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            // Eliminamos "listeners" del div principal para desactivar Drag & Drop
            className={`
                group relative bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-700/50 
                hover:border-gray-600 hover:shadow-lg transition-all flex flex-col gap-3
                ${needsClarification ? 'ring-1 ring-yellow-500/50 border-yellow-500/30 bg-yellow-500/5' : ''}
            `}
        >
            {/* Header: Título y Selector de Movimiento */}
            <div className="flex justify-between items-start gap-2">
                <h4 
                    onClick={() => openTaskModal(task)}
                    className="text-gray-100 font-medium text-sm leading-snug break-words flex-1 cursor-pointer hover:text-indigo-400 transition-colors"
                >
                    {task.title}
                </h4>
                
                {/* SELECTOR DE ESTADO (Reemplazo del Drag & Drop) */}
                <div className="relative shrink-0" title="Mover tarea">
                    <select 
                        value={task.status}
                        onChange={handleMove}
                        onClick={(e) => e.stopPropagation()}
                        className="appearance-none bg-gray-900 text-[10px] font-medium text-gray-400 border border-gray-700 rounded px-2 py-1 pr-6 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer hover:bg-gray-800 transition-colors"
                    >
                        <option value="todo">Por Hacer</option>
                        <option value="doing">En Progreso</option>
                        <option value="review">Revisión</option>
                        <option value="done">Hecho</option>
                    </select>
                    <MoveRight className="absolute right-1.5 top-1.5 text-gray-600 pointer-events-none" size={10} />
                </div>
            </div>
            
            {/* Barra de Progreso */}
            {progress > 0 && (
                <div className="w-full bg-gray-700/50 h-1.5 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                        style={{ width: `${progress}%` }} 
                    />
                </div>
            )}

            {/* Footer de Tarjeta */}
            <div className="flex items-center justify-between pt-1 mt-1" onClick={() => openTaskModal(task)}>
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
