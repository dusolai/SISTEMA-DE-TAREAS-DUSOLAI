
import React from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import useTasks from '../hooks/useTasks';
import Column from './Column';
import { KANBAN_COLUMNS } from '../../../types';

const KanbanBoard: React.FC = () => {
    const { tasks, updateTaskMutation, reorderTasksMutation } = useTasks();

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        const activeTask = tasks?.find(t => t.id === active.id);
        if (!activeTask) return;

        const overId = over.id.toString();

        if (KANBAN_COLUMNS.some(c => c.id === overId) && activeTask.status !== overId) {
            // Task dropped on a different column
            updateTaskMutation.mutate({ id: active.id as string, updates: { status: overId as any } });
        } else {
            // Task dropped on another task (reordering)
            const overTask = tasks?.find(t => t.id === overId);
            if(overTask && activeTask.id !== overTask.id) {
                // Simplified reordering logic. For a full implementation, you'd calculate the new order.
                // This example just moves it to the target status.
                 if (activeTask.status !== overTask.status) {
                    updateTaskMutation.mutate({ id: active.id as string, updates: { status: overTask.status } });
                 }
            }
        }
    };
    
    if (!tasks) {
        return <div className="text-center p-10">Loading tasks...</div>
    }

    return (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
                <SortableContext items={KANBAN_COLUMNS.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                    {KANBAN_COLUMNS.map(column => (
                        <Column
                            key={column.id}
                            id={column.id}
                            title={column.title}
                            tasks={tasks?.filter(task => task.status === column.id) || []}
                        />
                    ))}
                </SortableContext>
            </div>
        </DndContext>
    );
};

export default KanbanBoard;
