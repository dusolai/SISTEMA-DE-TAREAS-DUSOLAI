import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../../store/uiStore';
import useTasks from '../hooks/useTasks';
import { useAudioRecorder } from '../../audio/hooks/useAudioRecorder'; // Reutilizamos el hook
import { generateSubtasksFromText, updateTaskWithAudio } from '../../../services/geminiService'; // Nuevos servicios
import { Task, Subtask } from '../../../types';
import { X, Save, AlertTriangle, AlignLeft, Flag, CheckCircle2, CheckSquare, Square, Bot, Wand2, Mic, StopCircle, Loader2 } from 'lucide-react';

// Función auxiliar para convertir blob a base64
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
    });
};

const TaskModal: React.FC = () => {
    const { isTaskModalOpen, selectedTask, closeTaskModal } = useUIStore();
    const { updateTaskMutation } = useTasks();
    
    // Hook de Audio INDEPENDIENTE para el modal
    const { 
        isRecording, 
        audioBlob, 
        startRecording, 
        stopRecording, 
        resetRecording, 
        mimeType 
    } = useAudioRecorder();
    
    // Estados locales
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Task['priority']>('medium');
    const [status, setStatus] = useState<Task['status']>('todo');
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    
    // Estados de carga UI
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [isProcessingUpdate, setIsProcessingUpdate] = useState(false);

    // Cargar datos al abrir
    useEffect(() => {
        if (selectedTask) {
            setTitle(selectedTask.title);
            setDescription(selectedTask.description || '');
            setPriority(selectedTask.priority);
            setStatus(selectedTask.status);
            setSubtasks(selectedTask.ai_extracted?.suggested_subtasks || []);
        }
    }, [selectedTask]);

    // EFECTO: Escuchar cuando termina la grabación para procesar la actualización
    useEffect(() => {
        const processAudioUpdate = async () => {
            if (audioBlob && isTaskModalOpen && selectedTask) {
                setIsProcessingUpdate(true);
                try {
                    const base64 = await blobToBase64(audioBlob);
                    // Preparamos el objeto actual para darle contexto a la IA
                    const currentContext = { title, description, priority, status, subtasks };
                    
                    const updatedData = await updateTaskWithAudio(currentContext, base64, mimeType);
                    
                    // Actualizamos el formulario con lo que devolvió la IA
                    if (updatedData.title) setTitle(updatedData.title);
                    if (updatedData.description) setDescription(updatedData.description);
                    if (updatedData.priority) setPriority(updatedData.priority);
                    if (updatedData.suggested_subtasks) setSubtasks(updatedData.suggested_subtasks);
                    
                } catch (e) {
                    console.error("Error updating task with audio", e);
                    alert("Error al procesar el audio de actualización.");
                } finally {
                    setIsProcessingUpdate(false);
                    resetRecording();
                }
            }
        };

        if (audioBlob) processAudioUpdate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioBlob]);


    if (!isTaskModalOpen || !selectedTask) return null;

    // --- LÓGICA DE SUBTAREAS ---
    const handleGeneratePlan = async () => {
        setIsGeneratingPlan(true);
        try {
            const newSteps = await generateSubtasksFromText(title, description);
            setSubtasks(newSteps);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingPlan(false);
        }
    };

    const handleToggleSubtask = (id: string) => {
        setSubtasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    // --- GUARDAR ---
    const progressPercent = subtasks.length > 0 
        ? Math.round((subtasks.filter(s => s.completed).length / subtasks.length) * 100) 
        : 0;

    const handleSave = async () => {
        await updateTaskMutation.mutateAsync({
            id: selectedTask.id,
            updates: { 
                title, description, priority, status, progress: progressPercent,
                ai_extracted: { 
                    ...selectedTask.ai_extracted, 
                    needs_clarification: false, 
                    suggested_subtasks: subtasks 
                } as any
            }
        });
        closeTaskModal();
    };

    const needsClarification = selectedTask.ai_extracted?.needs_clarification;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-800 flex flex-col overflow-hidden max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-gray-900 shrink-0">
                    <div className="flex items-center gap-3">
                        {/* Botón de Grabar en la cabecera */}
                        {isProcessingUpdate ? (
                             <div className="flex items-center gap-2 text-indigo-400 animate-pulse">
                                <Loader2 className="animate-spin" size={18} /> Actualizando...
                             </div>
                        ) : isRecording ? (
                            <button onClick={stopRecording} className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/50 rounded-full animate-pulse hover:bg-red-500/30">
                                <StopCircle size={16} /> Detener
                            </button>
                        ) : (
                            <button onClick={startRecording} className="flex items-center gap-2 px-3 py-1 bg-gray-800 text-gray-300 border border-gray-700 rounded-full hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all" title="Actualizar tarea por voz">
                                <Mic size={16} /> <span className="text-xs font-medium">Añadir nota de voz</span>
                            </button>
                        )}
                    </div>
                    <button onClick={closeTaskModal} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    
                    {/* Título */}
                    <input 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-transparent text-2xl font-bold text-white placeholder-gray-600 focus:outline-none"
                        placeholder="Nombre de la tarea..."
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* COLUMNA IZQUIERDA */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* SECCIÓN PLAN DE ACCIÓN */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                        <CheckCircle2 size={14} /> Plan de Acción
                                    </label>
                                    {/* Botón Mágico para generar plan si está vacío */}
                                    {subtasks.length === 0 && !isGeneratingPlan && (
                                        <button 
                                            onClick={handleGeneratePlan}
                                            className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                                        >
                                            <Wand2 size={12} /> Generar Plan con IA
                                        </button>
                                    )}
                                </div>
                                
                                {/* Loading State */}
                                {isGeneratingPlan && (
                                    <div className="flex items-center justify-center py-4 text-gray-500 gap-2">
                                        <Loader2 className="animate-spin" size={16}/> Creando estrategia...
                                    </div>
                                )}

                                {/* Lista de Subtareas */}
                                {subtasks.length > 0 && (
                                    <div className="space-y-2">
                                         <div className="h-1.5 w-full bg-gray-800 rounded-full mb-3 overflow-hidden">
                                            <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                                        </div>
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
                                    </div>
                                )}
                                
                                {/* Estado vacío */}
                                {subtasks.length === 0 && !isGeneratingPlan && (
                                    <div className="text-center p-6 border border-dashed border-gray-800 rounded-xl bg-gray-900/50">
                                        <p className="text-gray-500 text-sm">No hay pasos definidos.</p>
                                        <button onClick={handleGeneratePlan} className="mt-2 text-indigo-500 text-sm font-medium hover:underline">
                                            ¿Quieres que la IA desglose esta tarea?
                                        </button>
                                    </div>
                                )}
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

                        {/* COLUMNA DERECHA (Metadatos) */}
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
