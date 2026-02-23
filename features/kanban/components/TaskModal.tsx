import React, { useState, useEffect } from 'react';
import { X, GitCommit, FileText, Activity, Trash2, Plus, CheckSquare, Square, Sparkles, Loader2 } from 'lucide-react';
import { useUIStore } from '../../../store/uiStore';
import useTasks from '../hooks/useTasks';
import { Task, Subtask } from '../../../types';
import { generateSubtasksFromText } from '../../../services/geminiService';

const TaskModal: React.FC = () => {
    const { isTaskModalOpen, taskModalData, closeTaskModal } = useUIStore();
    const { createTask, updateTask, deleteTask } = useTasks();
    const currentWorkspaceId = useUIStore((state) => state.currentWorkspaceId);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<Task['status']>('todo');
    const [priority, setPriority] = useState<Task['priority']>('medium');
    const [notionUrl, setNotionUrl] = useState('');
    const [driveUrl, setDriveUrl] = useState('');
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [newSubtaskText, setNewSubtaskText] = useState('');
    const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'subtasks' | 'history'>('details');

    useEffect(() => {
        if (taskModalData) {
            setTitle(taskModalData.title || '');
            setDescription(taskModalData.description || '');
            setStatus(taskModalData.status || 'todo');
            setPriority(taskModalData.priority || 'medium');
            setNotionUrl(taskModalData.notion_url || '');
            setDriveUrl(taskModalData.drive_url || '');
            setSubtasks(taskModalData.subtasks || []);
            setActiveTab('details');
        } else {
            setTitle('');
            setDescription('');
            setStatus('todo');
            setPriority('medium');
            setNotionUrl('');
            setDriveUrl('');
            setSubtasks([]);
            setNewSubtaskText('');
            setActiveTab('details');
        }
    }, [taskModalData, isTaskModalOpen]);

    if (!isTaskModalOpen) return null;

    const completedSubtasks = subtasks.filter(s => s.completed).length;
    const progressPercent = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

    const handleAddSubtask = () => {
        if (!newSubtaskText.trim()) return;
        const newSubtask: Subtask = {
            id: crypto.randomUUID(),
            text: newSubtaskText.trim(),
            completed: false
        };
        setSubtasks([...subtasks, newSubtask]);
        setNewSubtaskText('');
    };

    const handleToggleSubtask = (id: string) => {
        setSubtasks(subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
    };

    const handleDeleteSubtask = (id: string) => {
        setSubtasks(subtasks.filter(s => s.id !== id));
    };

    const handleGenerateAISubtasks = async () => {
        if (!title.trim()) {
            alert('Añade un título a la tarea antes de generar subtareas con IA.');
            return;
        }
        setIsGeneratingSubtasks(true);
        try {
            const generated = await generateSubtasksFromText(title, description || '');
            if (generated.length > 0) {
                setSubtasks(prev => [...prev, ...generated]);
            }
        } catch (error) {
            console.error('Error generating AI subtasks:', error);
            alert('Error al generar subtareas. Inténtalo de nuevo.');
        } finally {
            setIsGeneratingSubtasks(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !currentWorkspaceId) return;

        const currentCompleted = subtasks.filter(s => s.completed).length;
        const currentProgress = subtasks.length > 0 ? Math.round((currentCompleted / subtasks.length) * 100) : 0;

        const taskData = {
            title,
            description,
            status,
            priority,
            notion_url: notionUrl || null,
            drive_url: driveUrl || null,
            subtasks,
            progress: currentProgress
        };

        if (taskModalData) {
            const success = await updateTask(taskModalData.id, taskData);
            if (success) {
                closeTaskModal();
            } else {
                alert('Error al guardar los cambios. Revisa la consola para más detalles.');
            }
        } else {
            const success = await createTask({
                ...taskData,
                workspace_id: currentWorkspaceId,
                order: 0, project_id: null, assigned_to: null, history: []
            } as any);

            if (success) {
                closeTaskModal();
            } else {
                alert('Error al crear la tarea. Revisa la consola para más detalles.');
            }
        }
    };

    const handleDelete = async () => {
        if (!taskModalData) return;
        const confirmed = confirm('¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer.');
        if (!confirmed) return;
        await deleteTask(taskModalData.id);
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
                        <button onClick={() => setActiveTab('subtasks')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'subtasks' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}><CheckSquare size={16} className="inline mr-2" />Subtareas {subtasks.length > 0 && `(${completedSubtasks}/${subtasks.length})`}</button>
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
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white" /></div>

                            {/* Subtasks section for new tasks */}
                            {!taskModalData && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subtareas</label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            value={newSubtaskText}
                                            onChange={e => setNewSubtaskText(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                                            placeholder="Añadir subtarea..."
                                            className="flex-1 px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                        />
                                        <button type="button" onClick={handleAddSubtask} className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"><Plus size={16} /></button>
                                    </div>
                                    {subtasks.map(st => (
                                        <div key={st.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 group">
                                            <button type="button" onClick={() => handleToggleSubtask(st.id)} className="text-gray-400 hover:text-indigo-500">
                                                {st.completed ? <CheckSquare size={18} className="text-indigo-500" /> : <Square size={18} />}
                                            </button>
                                            <span className={`flex-1 text-sm ${st.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{st.text}</span>
                                            <button type="button" onClick={() => handleDeleteSubtask(st.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">Enlace Notion</label>
                                    <input type="url" value={notionUrl} onChange={e => setNotionUrl(e.target.value)} placeholder="https://notion.so/..." className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Google Drive</label>
                                    <input type="url" value={driveUrl} onChange={e => setDriveUrl(e.target.value)} placeholder="https://drive.google.com/..." className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm" />
                                </div>
                            </div>
                        </form>
                    ) : activeTab === 'subtasks' ? (
                        <div className="space-y-4">
                            {/* Progress bar */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progreso</span>
                                    <span className="text-sm font-bold text-indigo-600">{progressPercent}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500 ease-out"
                                        style={{
                                            width: `${progressPercent}%`,
                                            background: progressPercent === 100
                                                ? 'linear-gradient(90deg, #10b981, #059669)'
                                                : progressPercent > 50
                                                    ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                                                    : 'linear-gradient(90deg, #f59e0b, #f97316)'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Add subtask input */}
                            <div className="flex gap-2">
                                <input
                                    value={newSubtaskText}
                                    onChange={e => setNewSubtaskText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                                    placeholder="Añadir subtarea..."
                                    className="flex-1 px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                />
                                <button onClick={handleAddSubtask} className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"><Plus size={16} /></button>
                            </div>

                            {/* AI Generate Button */}
                            <button
                                onClick={handleGenerateAISubtasks}
                                disabled={isGeneratingSubtasks}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                                {isGeneratingSubtasks ? (
                                    <><Loader2 size={16} className="animate-spin" /> Generando fases con IA...</>
                                ) : (
                                    <><Sparkles size={16} /> Generar Fases con IA</>
                                )}
                            </button>

                            {/* Subtask list */}
                            <div className="space-y-1">
                                {subtasks.map(st => (
                                    <div key={st.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 group transition-colors">
                                        <button onClick={() => handleToggleSubtask(st.id)} className="flex-shrink-0 text-gray-400 hover:text-indigo-500 transition-colors">
                                            {st.completed ? <CheckSquare size={20} className="text-indigo-500" /> : <Square size={20} />}
                                        </button>
                                        <span className={`flex-1 text-sm ${st.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{st.text}</span>
                                        <button onClick={() => handleDeleteSubtask(st.id)} className="flex-shrink-0 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={16} /></button>
                                    </div>
                                ))}
                                {subtasks.length === 0 && (
                                    <p className="text-gray-400 text-center py-8 text-sm">No hay subtareas. Añade una arriba.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {taskModalData?.history?.slice().reverse().map((h, i) => (
                                <div key={i} className="flex gap-3 text-sm"><div className="mt-1"><GitCommit size={14} /></div><div><p className="font-medium dark:text-gray-200">{h.details}</p><p className="text-xs text-gray-500">{formatDate(h.timestamp)}</p></div></div>
                            ))}
                            {(!taskModalData?.history?.length) && <p className="text-gray-500 text-center">Sin historial</p>}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
                    {taskModalData && (
                        <button onClick={handleDelete} className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
                            <Trash2 size={16} />Eliminar
                        </button>
                    )}
                    <div className="flex-1" />
                    <button onClick={closeTaskModal} className="px-4 py-2 text-gray-600 dark:text-gray-300">Cancelar</button>
                    <button type="submit" form="taskForm" onClick={activeTab !== 'details' ? (e) => { e.preventDefault(); handleSubmit(e); } : undefined} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">{taskModalData ? 'Guardar' : 'Crear'}</button>
                </div>
            </div>
        </div>
    );
};
export default TaskModal;