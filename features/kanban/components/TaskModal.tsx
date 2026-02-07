import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, GitCommit, FileText, Activity, Plus } from 'lucide-react';
import { useUIStore } from '../../../store/uiStore';
import useTasks from '../hooks/useTasks';
import { Task } from '../../../types';

const TaskModal: React.FC = () => {
    // Usamos 'selectedTask' para leer los datos
    const { isTaskModalOpen, selectedTask, closeTaskModal } = useUIStore();
    const { createTask, updateTask } = useTasks();
    const currentWorkspaceId = useUIStore((state) => state.currentWorkspaceId);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<Task['status']>('todo');
    const [priority, setPriority] = useState<Task['priority']>('medium');
    const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

    useEffect(() => {
        if (selectedTask) {
            setTitle(selectedTask.title || '');
            setDescription(selectedTask.description || '');
            setStatus(selectedTask.status || 'todo');
            setPriority(selectedTask.priority || 'medium');
            setActiveTab('details');
        } else {
            setTitle('');
            setDescription('');
            setStatus('todo');
            setPriority('medium');
            setActiveTab('details');
        }
    }, [selectedTask, isTaskModalOpen]);

    if (!isTaskModalOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !currentWorkspaceId) return;

        if (selectedTask) {
            await updateTask(selectedTask.id, { title, description, status, priority });
        } else {
            await createTask({
                title, description, status, priority,
                workspace_id: currentWorkspaceId,
                order: 0, progress: 0, project_id: null, assigned_to: null, history: []
            } as any);
        }
        closeTaskModal();
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{selectedTask ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
                    <button onClick={closeTaskModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500"><X size={20} /></button>
                </div>

                {selectedTask && (
                    <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                        <button onClick={() => setActiveTab('details')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'details' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'}`}><FileText size={16} /> Detalles</button>
                        <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'history' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'}`}><Activity size={16} /> Historial</button>
                    </div>
                )}

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {activeTab === 'details' ? (
                        <form id="taskForm" onSubmit={handleSubmit} className="space-y-4">
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none" required /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label><select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none"><option value="todo">Por Hacer</option><option value="doing">En Progreso</option><option value="review">Revisión</option><option value="done">Completado</option></select></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridad</label><select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none"><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option></select></div>
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" /></div>
                            {selectedTask && (<div className="text-xs text-gray-400 mt-2 flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800"><Calendar size={14} /> <span>Creado el: {formatDate(selectedTask.created_at)}</span></div>)}
                        </form>
                    ) : (
                        <div className="space-y-6 relative pl-2 pt-2">
                            <div className="absolute left-[19px] top-2 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-700 z-0"></div>
                            {(!selectedTask?.history || selectedTask.history.length === 0) ? <p className="text-gray-500 text-center italic">Sin historial.</p> : [...selectedTask.history].reverse().map((event, index) => (
                                <div key={event.id || index} className="relative z-10 flex gap-4"><div className={`mt-1 w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white dark:bg-gray-900 ${event.action === 'creation' ? 'border-green-500 text-green-500' : 'border-blue-500 text-blue-500'}`}>{event.action === 'creation' ? <Plus size={14} /> : <GitCommit size={14} />}</div><div className="flex-1"><div className="flex justify-between items-baseline"><p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{event.details}</p><time className="text-xs text-gray-400">{formatDate(event.timestamp)}</time></div><p className="text-xs text-gray-500 uppercase">{event.action}</p></div></div>
                            ))}
                        </div>
                    )}
                </div>
                {activeTab === 'details' && <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50"><button onClick={closeTaskModal} className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Cancelar</button><button type="submit" form="taskForm" className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">{selectedTask ? 'Guardar' : 'Crear'}</button></div>}
            </div>
        </div>
    );
};
export default TaskModal;