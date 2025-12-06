import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../../types';
import { AlertTriangle, ArrowDown, ArrowUp, Minus, MoveRight, FolderInput, Check } from 'lucide-react';
import { useUIStore } from '../../../store/uiStore';
import useTasks from '../hooks/useTasks';
import { useWorkspaces } from '../hooks/useWorkspaces'; // <--- IMPORTANTE: Hook para leer los espacios

interface TaskCardProps {
    task: Task;
}

const priorityConfig = {
    high: { color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: <ArrowUp className="h-3 w-3" /> },
    medium: { color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', icon: <Minus className="h-3 w-3" /> },
    low: { color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: <ArrowDown className="h-3 w-3" /> },
};

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
    // Mantenemos useSortable para no romper KanbanBoard, aunque no arrastremos visualmente
    const { attributes, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
    const { openTaskModal } = useUIStore();
    const { updateTaskMutation } = useTasks();
    const { workspaces } = useWorkspaces(); // <--- Obtenemos la lista de workspaces

    // Estado para el menú de mover
    const [isMoveMenuOpen, setIsMoveMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : (isMoveMenuOpen ? 40 : 'auto'), // Elevamos Z-Index si el menú está abierto
        opacity: isDragging ? 0.5 : 1,
    };

    const aiData = task.ai_extracted as any;
    const needsClarification = aiData?.needs_clarification;
    const progress = task.progress || 0;
    const priority = (task.priority as keyof typeof priorityConfig) || 'medium';
    const pConfig = priorityConfig[priority];

    // Cerrar el menú si hacemos clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMoveMenuOpen(false);
            }
        };
        if (isMoveMenuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMoveMenuOpen]);

    // Manejador para el cambio de columna (Estado)
    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        e.stopPropagation();
        updateTaskMutation.mutate({
            id: task.id,
            updates: { status: e.target.value as any }
        });
    };

    // Manejador para mover de Workspace
    const handleMoveWorkspace = (targetWorkspaceId: string) => {
        if (confirm(`¿Mover esta tarea a otro espacio? Desaparecerá de este tablero.`)) {
            updateTaskMutation.mutate({
                id: task.id,
                updates: { workspace_id: targetWorkspaceId }
            });
            setIsMoveMenuOpen(false);
        }
    };

    // Filtramos los workspaces para no mostrar el actual (no tiene sentido moverla a donde ya está)
    // Asumimos que si task.workspace_id no existe, es compatible con ver todos
    const availableWorkspaces = workspaces?.filter(ws => ws.id !== task.workspace_id) || [];

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            // Importante: No pasamos 'listeners' al div principal para que el click no active drag
            className={`
                group relative bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-700/50 
                hover:border-gray-600 hover:shadow-lg transition-all flex flex-col gap-3
                ${needsClarification ? 'ring-1 ring-yellow-500/50 border-yellow-500/30 bg-yellow-500/5' : ''}
            `}
        >
            {/* Header: Título y Acciones */}
            <div className="flex justify-between items-start gap-2">
                <h4 
                    onClick={() => openTaskModal(task)}
                    className="text-gray-100 font-medium text-sm leading-snug break-words flex-1 cursor-pointer hover:text-indigo-400 transition-colors"
                >
                    {task.title}
                </h4>
                
                <div className="flex items-center gap-1 shrink-0">
                    {/* BOTÓN: MOVER DE WORKSPACE (NUEVO) */}
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsMoveMenuOpen(!isMoveMenuOpen); }}
                            className={`p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-indigo-400 transition-colors ${isMoveMenuOpen ? 'text-indigo-400 bg-gray-700' : ''}`}
                            title="Mover a otro negocio"
                        >
                            <FolderInput size={14} />
                        </button>

                        {/* Menú Desplegable */}
                        {isMoveMenuOpen && (
                            <div className="absolute right-0 top-6 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col py-1 animate-in fade-in zoom-in-95 duration-100">
                                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-800 mb-1">
                                    Mover a...
                                </div>
                                {availableWorkspaces.length > 0 ? (
                                    availableWorkspaces.map(ws => (
                                        <button
                                            key={ws.id}
                                            onClick={(e) => { e.stopPropagation(); handleMoveWorkspace(ws.id); }}
                                            className="px-3 py-2 text-left text-xs text-gray-300 hover:bg-indigo-600 hover:text-white transition-colors flex items-center justify-between group/item"
                                        >
                                            <span className="truncate">{ws.name}</span>
                                            {/* Icono sutil al hacer hover */}
                                            <MoveRight size={12} className="opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-3 py-2 text-xs text-gray-500 italic">No hay otros espacios</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* SELECTOR DE ESTADO */}
                    <div className="relative" title="Cambiar estado">
                        <select 
                            value={task.status}
                            onChange={handleStatusChange}
                            onClick={(e) => e.stopPropagation()}
                            className="appearance-none bg-gray-900 text-[10px] font-medium text-gray-400 border border-gray-700 rounded px-2 py-1 pr-5 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer hover:bg-gray-800 transition-colors max-w-[85px]"
                        >
                            <option value="todo">Por Hacer</option>
                            <option value="doing">Progreso</option>
                            <option value="review">Revisión</option>
                            <option value="done">Hecho</option>
                        </select>
                        {/* Indicador pequeño */}
                        <div className="absolute right-1 top-1.5 pointer-events-none">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                                task.status === 'done' ? 'bg-green-500' : 
                                task.status === 'doing' ? 'bg-indigo-500' : 
                                task.status === 'review' ? 'bg-yellow-500' : 'bg-gray-500'
                            }`} />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Barra de Progreso */}
            {progress > 0 && (
                <div className="w-full bg-gray-700/50 h-1 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                        style={{ width: `${progress}%` }} 
                    />
                </div>
            )}

            {/* Footer de Tarjeta */}
            <div className="flex items-center justify-between pt-1 mt-auto" onClick={() => openTaskModal(task)}>
                <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${pConfig.color}`}>
                    {pConfig.icon}
                    <span>{priority}</span>
                </div>

                <div className="flex items-center gap-2">
                    {progress > 0 && (
                        <span className="text-[10px] font-medium text-gray-500">{progress}%</span>
                    )}
                    {needsClarification && (
                        <div className="text-yellow-400 animate-pulse" title="La IA necesita detalles">
                            <AlertTriangle size={14} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskCard;
