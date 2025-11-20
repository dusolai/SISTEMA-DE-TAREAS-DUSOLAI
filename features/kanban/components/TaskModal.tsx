import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../../store/uiStore';
import useTasks from '../hooks/useTasks';
import { Task, Subtask } from '../../../types';
import { X, Save, AlertTriangle, AlignLeft, Flag, CheckCircle2, CheckSquare, Square, Bot } from 'lucide-react';

const TaskModal: React.FC = () => {
    const { isTaskModalOpen, selectedTask, closeTaskModal } = useUIStore();
    const { updateTaskMutation } = useTasks();
    
    // Estados locales
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Task['priority']>('medium');
    const [status, setStatus] = useState<Task['status']>('todo');
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);

    // Cargar datos
    useEffect(() => {
        if (selectedTask) {
            setTitle(selectedTask.title);
            setDescription(selectedTask.description || '');
            setPriority(selectedTask.priority);
            setStatus(selectedTask.status);
            // Cargamos las subtareas guardadas O las nuevas sugeridas por la IA
            setSubtasks(selectedTask.ai_extracted?.suggested_subtasks || []);
        }
    }, [selectedTask]);

    if (!isTaskModalOpen || !selectedTask) return null;

    // Calcular progreso
    const completedCount = subtasks.filter(s => s.completed).length;
    const totalCount = subtasks.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const handleToggleSubtask = (id: string) => {
        setSubtasks(prev => prev.map(t => 
            t.id === id ? { ...t, completed: !t.completed } : t
        ));
    };

    const handleSave = async () => {
        await updateTaskMutation.mutateAsync({
            id: selectedTask.id,
            updates: { 
                title, 
                description,
                priority,
                status,
                progress: progressPercent, // Guardamos el % real
                ai_extracted: { 
                    ...selectedTask.ai_extracted, 
                    needs_clarification: false, // Marcamos como resuelta la alerta visual
                    suggested_subtasks: subtasks // Guardamos el estado de los checks
                } as any
            }
        });
        closeTaskModal();
    };

    const aiContext = selectedTask.ai_extracted?.context;
    const clarificationQuestion = selectedTask.ai_extracted?.clarification_question;
    const needsClarification = selectedTask.ai_extracted?.needs_clarification;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-800 flex flex-col overflow-hidden max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-gray-900 shrink-0">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-white">Editar Tarea</h2>
                        {progressPercent > 0 && (
                             <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                                {progressPercent}% Completado
                            </span>
                        )}
                    </div>
                    <button onClick={closeTaskModal} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    
                    {/* SECCIÓN: Notas de IA (Siempre visibles) */}
                    {(aiContext || clarificationQuestion) && (
                        <div className="bg-indigo-900/10 border border-indigo-500/10 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                                <Bot size={14} /> Análisis de Inteligencia Artificial
                            </div>
                            
                            {/* Alerta de duda (si activa) */}
                            {needsClarification && (
                                <div className="mb-3 bg-yellow-500/10 border-l-2 border-yellow-500 p-3 rounded-r text-yellow-200 text-sm">
                                    <div className="flex gap-2 font-bold mb-1 items-center"><AlertTriangle size={14}/> Atención Requerida</div>
                                    "{clarificationQuestion}"
                                </div>
                            )}
                            
                            {/* Contexto original */}
                            {aiContext && (
                                <p className="text-indigo-200/70 text-sm leading-relaxed italic">
                                    Contexto detectado: "{aiContext}"
                                </p>
                            )}
                        </div>
                    )}

                    {/* Título */}
                    <input 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-transparent text-2xl font-bold text-white placeholder-gray-600 focus:outline-none"
                        placeholder="Nombre de la tarea..."
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* COLUMNA IZQUIERDA: Detalles */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* PLAN DE ACCIÓN (SUBTAREAS) */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-3">
                                    <CheckCircle2 size={14} /> Plan de Acción (IA)
                                </label>
                                
                                {/* Barra de progreso visual */}
                                <div className="h-2 w-full bg-gray-800 rounded-full mb-4 overflow-hidden">
                                    <div 
                                        className="h-full bg-indigo-500 transition-all duration-500 ease-out" 
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    {subtasks.map((subtask) => (
                                        <div 
                                            key={subtask.id}
                                            onClick={() => handleToggleSubtask(subtask.id)}
                                            className={`
                                                group flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
                                                ${subtask.completed 
                                                    ? 'bg-gray-800/30 border-gray-800 opacity-60' 
                                                    : 'bg-gray-800/60 border-gray-700 hover:border-indigo-500/50'}
                                            `}
                                        >
                                            <div className={`mt-0.5 ${subtask.completed ? 'text-indigo-500' : 'text-gray-500 group-hover:text-indigo-400'}`}>
                                                {subtask.completed ? <CheckSquare size={18} /> : <Square size={18} />}
                                            </div>
                                            <span className={`text-sm ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                                                {subtask.text}
                                            </span>
                                        </div>
                                    ))}
                                    {subtasks.length === 0 && (
                                        <p className="text-gray-500 text-sm italic">No hay pasos sugeridos. La IA generará pasos en la próxima grabación.</p>
                                    )}
                                </div>
                            </div>

                            {/* Descripción */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-2">
                                    <AlignLeft size={14} /> Notas Adicionales
                                </label>
                                <textarea 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={5}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-gray-300 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
                                />
                            </div>
                        </div>

                        {/* COLUMNA DERECHA: Metadatos */}
                        <div className="space-y-6 lg:border-l lg:border-gray-800 lg:pl-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Prioridad</label>
                                <div className="flex flex-col gap-2">
                                    {(['low', 'medium', 'high'] as const).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setPriority(p)}
                                            className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-left capitalize flex items-center justify-between ${
                                                priority === p 
                                                ? (p === 'high' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 
                                                   p === 'medium' ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400' : 
                                                   'bg-green-500/10 border-green-500/50 text-green-400')
                                                : 'border-transparent hover:bg-gray-800 text-gray-400'
                                            }`}
                                        >
                                            {p}
                                            {priority === p && <div className={`w-2 h-2 rounded-full ${
                                                p === 'high' ? 'bg-red-500' : p === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                            }`} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Estado</label>
                                <select 
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as Task['status'])}
                                    className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg p-2.5 focus:ring-indigo-500"
                                >
                                    <option value="todo">Por hacer</option>
                                    <option value="doing">En Progreso</option>
                                    <option value="review">En Revisión</option>
                                    <option value="done">Completada</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 bg-gray-900 border-t border-gray-800 flex justify-end gap-3 shrink-0">
                    <button onClick={closeTaskModal} className="px-5 py-2 text-gray-400 hover:text-white transition-colors">Cancelar</button>
                    <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/20">
                        <Save size={18} /> Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskModal;
