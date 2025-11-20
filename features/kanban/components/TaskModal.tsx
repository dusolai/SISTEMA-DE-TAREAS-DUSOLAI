import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../../store/uiStore';
import useTasks from '../hooks/useTasks';
import { useAudioRecorder } from '../../audio/hooks/useAudioRecorder';
import { generateSubtasksFromText, updateTaskWithAudio } from '../../../services/geminiService';
import { Task, Subtask } from '../../../types';
import { X, Save, AlertTriangle, AlignLeft, CheckCircle2, CheckSquare, Square, Bot, Wand2, Mic, StopCircle, Loader2, RefreshCw, Send } from 'lucide-react';

// Función auxiliar para base64 (ya la tenías)
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
    
    // Hook de Audio PRINCIPAL (para actualizar toda la tarea)
    const mainAudio = useAudioRecorder();
    
    // Hook de Audio SECUNDARIO (para instrucciones del plan)
    const planAudio = useAudioRecorder();

    // Estados datos
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Task['priority']>('medium');
    const [status, setStatus] = useState<Task['status']>('todo');
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    
    // Estados UI
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [isProcessingUpdate, setIsProcessingUpdate] = useState(false);
    const [planPrompt, setPlanPrompt] = useState(''); // Texto del input para el plan
    const [showPlanInput, setShowPlanInput] = useState(false); // Mostrar/Ocultar input

    // Cargar datos iniciales
    useEffect(() => {
        if (selectedTask) {
            setTitle(selectedTask.title);
            setDescription(selectedTask.description || '');
            setPriority(selectedTask.priority);
            setStatus(selectedTask.status);
            setSubtasks(selectedTask.ai_extracted?.suggested_subtasks || []);
            setShowPlanInput((selectedTask.ai_extracted?.suggested_subtasks || []).length === 0);
        }
    }, [selectedTask]);

    // EFECTO 1: Audio Principal (Actualizar Tarea)
    useEffect(() => {
        const processAudioUpdate = async () => {
            if (mainAudio.audioBlob && isTaskModalOpen) {
                setIsProcessingUpdate(true);
                try {
                    const base64 = await blobToBase64(mainAudio.audioBlob);
                    const currentContext = { title, description, priority, status, subtasks };
                    const updatedData = await updateTaskWithAudio(currentContext, base64, mainAudio.mimeType);
                    
                    if (updatedData.title) setTitle(updatedData.title);
                    if (updatedData.description) setDescription(updatedData.description);
                    if (updatedData.priority) setPriority(updatedData.priority);
                    if (updatedData.suggested_subtasks) setSubtasks(updatedData.suggested_subtasks);
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsProcessingUpdate(false);
                    mainAudio.resetRecording();
                }
            }
        };
        if (mainAudio.audioBlob) processAudioUpdate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mainAudio.audioBlob]);

    // EFECTO 2: Audio del Plan (Transcribir a texto o enviar directo si tuviéramos esa función, aquí simulamos input)
    // Nota: Para simplificar, asumiremos que si grabas audio para el plan, quieres que la IA lo use como instrucción.
    // En una implementación ideal, transcribiríamos esto primero a texto en el input.
    // Por ahora, usaremos el audio blob directamente para generar el plan si el usuario usa voz.
    
    // Como generateSubtasksFromText es solo texto, vamos a hacer un pequeño truco:
    // Si el usuario usa audio para el plan, usamos updateTaskWithAudio pero enfocado en subtasks.
    useEffect(() => {
        const processPlanAudio = async () => {
            if (planAudio.audioBlob) {
                setIsGeneratingPlan(true);
                try {
                    const base64 = await blobToBase64(planAudio.audioBlob);
                    // Usamos la función de update general pero pidiéndole solo subtasks
                    const currentContext = { title, description, subtasks: [] }; // Contexto limpio para que genere nuevos
                    const updatedData = await updateTaskWithAudio(currentContext, base64, planAudio.mimeType);
                    if (updatedData.suggested_subtasks) setSubtasks(updatedData.suggested_subtasks);
                    setPlanPrompt(''); // Limpiar
                    setShowPlanInput(false);
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsGeneratingPlan(false);
                    planAudio.resetRecording();
                }
            }
        };
        if (planAudio.audioBlob) processPlanAudio();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planAudio.audioBlob]);


    if (!isTaskModalOpen || !selectedTask) return null;

    // Generar plan (Texto)
    const handleGeneratePlan = async () => {
        if (!title) return;
        setIsGeneratingPlan(true);
        try {
            // Pasamos el planPrompt como instrucción personalizada
            const newSteps = await generateSubtasksFromText(title, description, planPrompt);
            setSubtasks(newSteps);
            setShowPlanInput(false);
            setPlanPrompt('');
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingPlan(false);
        }
    };

    const handleToggleSubtask = (id: string) => {
        setSubtasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-800 flex flex-col overflow-hidden max-h-[95vh]">
                
                {/* Header con Micrófono Principal */}
                <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-gray-900 shrink-0">
                    <div className="flex items-center gap-4">
                        {isProcessingUpdate ? (
                             <div className="flex items-center gap-2 text-indigo-400 animate-pulse px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                                <Loader2 className="animate-spin" size={16} /> <span className="text-xs font-medium">Actualizando tarea...</span>
                             </div>
                        ) : mainAudio.isRecording ? (
                            <button onClick={mainAudio.stopRecording} className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/50 rounded-full animate-pulse hover:bg-red-500/30">
                                <StopCircle size={16} /> <span className="text-xs font-bold">Parar</span>
                            </button>
                        ) : (
                            <button onClick={mainAudio.startRecording} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-gray-300 border border-gray-700 rounded-full hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all group">
                                <Mic size={16} className="group-hover:scale-110 transition-transform" /> 
                                <span className="text-xs font-medium">Dictar cambios</span>
                            </button>
                        )}
                    </div>
                    <button onClick={closeTaskModal} className="text-gray-500 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-800">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    
                    {/* Título Grande */}
                    <input 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-transparent text-3xl font-bold text-white placeholder-gray-600 focus:outline-none leading-tight"
                        placeholder="Título de la tarea"
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* COLUMNA IZQUIERDA (Contenido) */}
                        <div className="lg:col-span-2 space-y-8">
                            
                            {/* --- SECCIÓN PLAN DE ACCIÓN INTELIGENTE --- */}
                            <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                                        <CheckCircle2 size={14} className="text-indigo-400"/> Plan de Acción
                                    </label>
                                    
                                    {/* Botón para mostrar el panel de generación si ya hay items */}
                                    {subtasks.length > 0 && !showPlanInput && (
                                        <button 
                                            onClick={() => setShowPlanInput(true)}
                                            className="text-xs flex items-center gap-1 text-gray-500 hover:text-indigo-400 transition-colors"
                                            title="Regenerar o modificar plan"
                                        >
                                            <RefreshCw size={12} /> Modificar
                                        </button>
                                    )}
                                </div>

                                {/* INPUT DE GENERACIÓN (Texto + Audio) */}
                                {(showPlanInput || subtasks.length === 0) && (
                                    <div className="mb-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    value={planPrompt}
                                                    onChange={(e) => setPlanPrompt(e.target.value)}
                                                    placeholder={subtasks.length === 0 ? "Ej: Desglósalo en 3 pasos sencillos..." : "Ej: Añade un paso para revisar presupuesto..."}
                                                    className="w-full bg-gray-900 border border-gray-600 text-sm rounded-lg pl-3 pr-10 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-500"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleGeneratePlan()}
                                                />
                                                <button 
                                                    onClick={handleGeneratePlan}
                                                    disabled={isGeneratingPlan}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-white disabled:opacity-50 p-1"
                                                >
                                                    {isGeneratingPlan ? <Loader2 className="animate-spin" size={16}/> : <Send size={16} />}
                                                </button>
                                            </div>
                                            
                                            {/* Botón Audio Plan */}
                                            <button
                                                onClick={planAudio.isRecording ? planAudio.stopRecording : planAudio.startRecording}
                                                className={`p-2.5 rounded-lg border transition-all ${
                                                    planAudio.isRecording 
                                                    ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' 
                                                    : 'bg-gray-800 border-gray-600 text-gray-400 hover:text-white hover:border-gray-500'
                                                }`}
                                                title="Dictar instrucciones para el plan"
                                            >
                                                {planAudio.isRecording ? <StopCircle size={18} /> : <Mic size={18} />}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1.5 ml-1">
                                            <Wand2 size={10} className="inline mr-1"/> 
                                            Usa texto o voz para decirle a la IA cómo crear o ajustar el plan.
                                        </p>
                                    </div>
                                )}

                                {/* LISTA DE CHECKS */}
                                {subtasks.length > 0 && (
                                    <div className="space-y-2">
                                         <div className="h-1 w-full bg-gray-700/50 rounded-full mb-3 overflow-hidden">
                                            <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                                        </div>
                                        {subtasks.map((subtask) => (
                                            <div 
                                                key={subtask.id}
                                                onClick={() => handleToggleSubtask(subtask.id)}
                                                className={`
                                                    group flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-all select-none
                                                    ${subtask.completed 
                                                        ? 'bg-gray-800/20 text-gray-500' 
                                                        : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-200'}
                                                `}
                                            >
                                                <div className={`mt-0.5 ${subtask.completed ? 'text-indigo-500' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                                    {subtask.completed ? <CheckSquare size={18} /> : <Square size={18} />}
                                                </div>
                                                <span className={`text-sm leading-snug ${subtask.completed ? 'line-through opacity-50' : ''}`}>
                                                    {subtask.text}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Descripción */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2 mb-2">
                                    <AlignLeft size={14} /> Notas
                                </label>
                                <textarea 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={6}
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-gray-300 text-sm leading-relaxed focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
                                    placeholder="Detalles adicionales..."
                                />
                            </div>
                        </div>

                        {/* COLUMNA DERECHA (Metadatos) */}
                        <div className="space-y-6">
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
                                                : 'border-transparent bg-gray-800/50 hover:bg-gray-700 text-gray-400'
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
                                    className="w-full bg-gray-800/50 border border-gray-700 text-gray-300 text-sm rounded-lg p-2.5 focus:ring-indigo-500 focus:bg-gray-800 outline-none"
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
                <div className="p-5 bg-gray-900 border-t border-gray-800 flex justify-end gap-3 shrink-0 z-10">
                    <button onClick={closeTaskModal} className="px-5 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">Cancelar</button>
                    <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                        <Save size={18} /> Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskModal;
