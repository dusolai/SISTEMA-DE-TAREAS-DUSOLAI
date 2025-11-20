import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../../store/uiStore';
import useTasks from '../hooks/useTasks';
import { X, Save, AlertTriangle, Trash2 } from 'lucide-react';

const TaskModal: React.FC = () => {
    const { isTaskModalOpen, selectedTask, closeTaskModal } = useUIStore();
    const { updateTaskMutation } = useTasks();
    
    // Estado local para el formulario
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // Cargar datos cuando se abre el modal
    useEffect(() => {
        if (selectedTask) {
            setTitle(selectedTask.title);
            setDescription(selectedTask.description || '');
        }
    }, [selectedTask]);

    if (!isTaskModalOpen || !selectedTask) return null;

    const handleSave = async () => {
        await updateTaskMutation.mutateAsync({
            id: selectedTask.id,
            updates: { 
                title, 
                description,
                // Si editamos la tarea, asumimos que la duda se resolvió:
                ai_extracted: { ...selectedTask.ai_extracted, needs_clarification: false } as any
            }
        });
        closeTaskModal();
    };

    const needsClarification = selectedTask.ai_extracted?.needs_clarification;
    const clarificationQuestion = selectedTask.ai_extracted?.clarification_question;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-800 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900">
                    <h2 className="text-lg font-semibold text-white">Editar Tarea</h2>
                    <button onClick={closeTaskModal} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
                    
                    {/* SECCIÓN DE INTELIGENCIA ARTIFICIAL */}
                    {needsClarification && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-4">
                            <div className="bg-yellow-500/20 p-2 rounded-lg h-fit">
                                <AlertTriangle className="text-yellow-500 w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-yellow-500 font-bold text-sm uppercase tracking-wide mb-1">
                                    La IA tiene una duda
                                </h3>
                                <p className="text-yellow-100 text-sm leading-relaxed">
                                    {clarificationQuestion || "¿Podrías darme más detalles sobre esta tarea?"}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Formulario */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Título</label>
                            <input 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Descripción / Contexto</label>
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                                placeholder="Añade los detalles que faltan..."
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-gray-900 border-t border-gray-800 flex justify-end gap-3">
                    <button 
                        onClick={closeTaskModal}
                        className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
                    >
                        <Save size={18} />
                        {needsClarification ? 'Resolver Duda' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskModal;
