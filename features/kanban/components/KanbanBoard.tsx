import React from 'react';
import { DndContext, closestCenter, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import useTasks from '../hooks/useTasks';
import Column from './Column';
import TaskCard from './TaskCard'; // Asegúrate de importar TaskCard para el Overlay si lo usas
import { KANBAN_COLUMNS, Task } from '../../../types';

const KanbanBoard: React.FC = () => {
    // CORRECCIÓN: Usamos 'updateTask' directamente, no 'updateTaskMutation'
    const { tasks, updateTask } = useTasks();
    const [activeTask, setActiveTask] = React.useState<Task | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Evita clicks accidentales
            },
        })
    );

    const handleDragStart = (event: any) => {
        const task = tasks.find(t => t.id === event.active.id);
        if (task) setActiveTask(task);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const taskId = active.id as string;
        const overId = over.id.toString();

        const currentTask = tasks.find(t => t.id === taskId);
        if (!currentTask) return;

        // Caso 1: Soltar sobre una columna (cambio de estado)
        if (KANBAN_COLUMNS.some(col => col.id === overId)) {
            if (currentTask.status !== overId) {
                // Actualizamos el estado usando la función nueva
                await updateTask(taskId, { status: overId as any });
            }
        }
        // Caso 2: Soltar sobre otra tarea (reordenar o cambiar columna)
        else {
            const overTask = tasks.find(t => t.id === overId);
            if (overTask && currentTask.status !== overTask.status) {
                // Si cambiamos de columna arrastrando sobre una tarea
                await updateTask(taskId, { status: overTask.status });
            }
            // Aquí podrías añadir lógica de reordenamiento (order) si lo necesitas
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-full gap-4 overflow-x-auto pb-4 items-start snap-x snap-mandatory no-scrollbar">
                <SortableContext items={KANBAN_COLUMNS.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                    {KANBAN_COLUMNS.map((column) => (
                        <div key={column.id} className="snap-center shrink-0">
                            <Column
                                id={column.id}
                                title={column.title}
                                tasks={tasks.filter(t => t.status === column.id)}
                            />
                        </div>
                    ))}
                </SortableContext>
            </div>

            {/* Overlay para ver la tarjeta mientras se arrastra */}
            <DragOverlay>
                {activeTask ? (
                    <div className="opacity-80 rotate-2 scale-105">
                        <TaskCard task={activeTask} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default KanbanBoard;
