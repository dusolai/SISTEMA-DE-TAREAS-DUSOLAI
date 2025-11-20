import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../../store/uiStore';
import useTasks from '../hooks/useTasks';
import { Task } from '../../../types';
import { X, Save, AlertTriangle, AlignLeft, Calendar, Flag, CheckCircle2, Circle } from 'lucide-react';

const TaskModal: React.FC = () => {
    const { isTaskModalOpen, selectedTask, closeTaskModal } = useUIStore();
    const { updateTaskMutation } = useTasks();
    
    // Estados locales para edición completa
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Task['priority']>('medium');
    const [status, setStatus] = useState<Task['status']>('todo');

    // Cargar datos al abrir
    useEffect(() => {
        if (selectedTask) {
            setTitle(selectedTask.title);
            setDescription(selectedTask.description || '');
            setPriority(selectedTask.priority);
            setStatus(selectedTask.status);
        }
    }, [selectedTask]);

    if (!isTaskModalOpen || !selectedTask) return null;

    const handleSave = async () => {
        await updateTaskMutation.mutateAsync({
            id: selectedTask.id,
            updates: { 
                title, 
                description,
                priority,
                status,
                // Si guardamos cambios manuales, resolvemos la duda de la IA automáticamente
                ai_extracted: { ...selectedTask.ai_extracted, needs_clarification: false } as any
            }
        });
        closeTaskModal();
    };

    const needsClarification = selectedTask.ai_extracted?.needs_clarification;
    const clarificationQuestion = selectedTask.ai_extracted?.clarification_question;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-800 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-gray-900">
                    <div className="flex items-center gap-3">
                         <div className={`w-3 h-3 rounded-full ${
                            priority === 'high' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 
                            priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <h2 className="text-lg font-semibold text-white tracking-tight">Editar Tarea</h2>
                    </div>
                    <button onClick={closeTaskModal} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    
                    {/* ALERTA IA */}
                    {needsClarification && (
                        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 flex gap-4 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500" />
                            <div className="bg-yellow-500/10 p-2 rounded-lg h-fit shrink-0">
                                <AlertTriangle className="text-yellow-500 w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-yellow-500 font-bold text-sm uppercase tracking-wide mb-1 flex items-center gap-2">
                                    Duda de IA Requerida
                                </h3>
                                <p className="text-gray-300 text-sm leading-relaxed">
                                    {clarificationQuestion || "Falta información clave para completar esta tarea. Por favor edita la descripción."}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* TÍTULO */}
                    <div className="space-y-2">
                        <input 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-transparent text-2xl font-bold text-white placeholder-gray-600 focus:outline-none border-none p-0"
                            placeholder="Nombre de la tarea..."
                        />
                    </div>

                    {/* CONTROLES DE ESTADO Y PRIORIDAD */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Prioridad */}
                        <div className="space-y-3">
                            <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-2">
                                <Flag size={14} /> Prioridad
                            </label>
                            <div className="flex gap-2 bg-gray-800/50 p-1 rounded-lg border border-gray-800">
                                {(['low', 'medium', 'high'] as const).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPriority(p)}
                                        className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all capitalize ${
                                            priority === p 
                                            ? (p === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                                               p === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                                               'bg-green-500/20 text-green-400 border border-green-500/30')
                                            : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Estado */}
                        <div className="space-y-3">
                            <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-2">
                                <CheckCircle2 size={14} /> Estado
                            </label>
                             <select 
                                value={status}
                                onChange={(e) => setStatus(e.target.value as Task['status'])}
                                className="w-full bg-gray-800/50 border border-gray-800 text-gray-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                            >
                                <option value="todo">Por hacer</option>
                                <option value="doing">En Progreso</option>
                                <option value="review">En Revisión</option>
                                <option value="done">Completada</option>
                            </select>
                        </div>
                    </div>

                    {/* DESCRIPCIÓN */}
                    <div className="space-y-3">
                        <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-2">
                            <AlignLeft size={14} /> Descripción / Notas
                        </label>
                        <div className="relative">
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={8}
                                className="w-full bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 text-gray-300 leading-relaxed focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none resize-none transition-all"
                                placeholder="Añade notas, detalles o contexto..."
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-5 bg-gray-900 border-t border-gray-800 flex justify-end gap-3">
                    <button 
                        onClick={closeTaskModal}
                        className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Save size={16} />
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskModal;
