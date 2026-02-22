import React, { useState, useEffect } from 'react';
import { X, Calendar, GitCommit, FileText, Activity, Plus } from 'lucide-react';
import { useUIStore } from '../../../store/uiStore';
import useTasks from '../hooks/useTasks';
import { Task } from '../../../types';

const TaskModal: React.FC = () => {
    // RESTAURADO: Usamos taskModalData
    const { isTaskModalOpen, taskModalData, closeTaskModal } = useUIStore();
    const { createTask, updateTask } = useTasks();
    const currentWorkspaceId = useUIStore((state) => state.currentWorkspaceId);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<Task['status']>('todo');
    const [priority, setPriority] = useState<Task['priority']>('medium');
    const [notionUrl, setNotionUrl] = useState('');
    const [driveUrl, setDriveUrl] = useState('');
    const [githubUrl, setGithubUrl] = useState('');
    const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

    useEffect(() => {
        if (taskModalData) {
            setTitle(taskModalData.title || '');
            setDescription(taskModalData.description || '');
            setStatus(taskModalData.status || 'todo');
            setPriority(taskModalData.priority || 'medium');
            setNotionUrl(taskModalData.notion_url || '');
            setDriveUrl(taskModalData.drive_url || '');
            setGithubUrl(taskModalData.github_url || '');
            setActiveTab('details');
        } else {
            setTitle('');
            setDescription('');
            setStatus('todo');
            setPriority('medium');
            setNotionUrl('');
            setDriveUrl('');
            setGithubUrl('');
            setActiveTab('details');
        }
    }, [taskModalData, isTaskModalOpen]);

    if (!isTaskModalOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !currentWorkspaceId) return;

        const taskData = {
            title,
            description,
            status,
            priority,
            notion_url: notionUrl || null,
            drive_url: driveUrl || null,
            github_url: githubUrl || null
        };

        if (taskModalData) {
            await updateTask(taskModalData.id, taskData);
        } else {
            await createTask({
                ...taskData,
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
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        {taskModalData ? 'Editar Tarea' : 'Nueva Tarea'}
                    </h2>
                    <button onClick={closeTaskModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500"><X size={20} /></button>
                </div>

                {taskModalData && (
                    <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                        <button onClick={() => setActiveTab('details')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'details' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}><FileText size={16} className="inline mr-2" />Detalles</button>
                        <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'history' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}><Activity size={16} className="inline mr-2" />Historial</button>
                    </div>
                )}

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {activeTab === 'details' ? (
                        <form id="taskForm" onSubmit={handleSubmit} className="space-y-4">
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label><input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white" required /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label><select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"><option value="todo">Por Hacer</option><option value="doing">En Progreso</option><option value="review">Revisión</option><option value="done">Completado</option></select></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prioridad</label><select value={priority} onChange={e => setPriority(e.target.value as any)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option></select></div>
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white" /></div>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">Enlace Notion</label>
                                    <input
                                        type="url"
                                        value={notionUrl}
                                        onChange={e => setNotionUrl(e.target.value)}
                                        placeholder="https://notion.so/..."
                                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Google Drive</label>
                                    <input
                                        type="url"
                                        value={driveUrl}
                                        onChange={e => setDriveUrl(e.target.value)}
                                        placeholder="https://drive.google.com/..."
                                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-xs"
                                    />
                                </div>
                                <div className="col-span-2 lg:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">GitHub URL</label>
                                    <input
                                        type="url"
                                        value={githubUrl}
                                        onChange={e => setGithubUrl(e.target.value)}
                                        placeholder="https://github.com/..."
                                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-xs"
                                    />
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            {taskModalData?.history?.slice().reverse().map((h, i) => (
                                <div key={i} className="flex gap-3 text-sm"><div className="mt-1"><GitCommit size={14} /></div><div><p className="font-medium dark:text-gray-200">{h.details}</p><p className="text-xs text-gray-500">{formatDate(h.timestamp)}</p></div></div>
                            ))}
                            {(!taskModalData?.history?.length) && <p className="text-gray-500 text-center">Sin historial</p>}
                        </div>
                    )}
                </div>
                {activeTab === 'details' && <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3"><button onClick={closeTaskModal} className="px-4 py-2 text-gray-600 dark:text-gray-300">Cancelar</button><button type="submit" form="taskForm" className="px-6 py-2 bg-indigo-600 text-white rounded-lg">{taskModalData ? 'Guardar' : 'Crear'}</button></div>}
            </div>
        </div>
    );
};
export default TaskModal;