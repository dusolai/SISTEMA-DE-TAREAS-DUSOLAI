import React, { useEffect, useState } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import useTasks from '../../kanban/hooks/useTasks';
import { extractTaskFromAudio } from '../../../services/geminiService';
import useAuthStore from '../../../store/authStore';
import { Mic, StopCircle, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiExtractedData } from '../../../types';

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error("Failed to read blob as base64 string."));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const AudioRecorder: React.FC = () => {
    const { isRecording, duration, audioBlob, mimeType, startRecording, stopRecording, resetRecording } = useAudioRecorder();
    const { createTaskMutation } = useTasks();
    const { session } = useAuthStore();
    
    // Nuevo estado para gestionar el feedback visual
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    
    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleCreateTask = async () => {
        if (!audioBlob || !session?.user) return;
        setStatus('processing');

        try {
            const audioBase64 = await blobToBase64(audioBlob);
            const extractedData: AiExtractedData = await extractTaskFromAudio(audioBase64, mimeType);
            
            await createTaskMutation.mutateAsync({
                title: extractedData.title,
                status: 'todo',
                priority: extractedData.priority,
                description: extractedData.context,
                // Guardamos toda la data de IA en la columna JSONB 'ai_extracted'
                ai_extracted: extractedData,
                created_by: session.user.id,
                progress: 0,
                order: 0,
            });

            setStatus('success');
            setTimeout(() => {
                setStatus('idle');
                resetRecording();
            }, 2000);
        } catch (error) {
            console.error("Failed to create task", error);
            setStatus('error');
            setTimeout(() => {
                setStatus('idle');
                resetRecording(); // Reseteamos para permitir intentar de nuevo
            }, 3000);
        }
    };
    
    useEffect(() => {
        if(audioBlob) {
            handleCreateTask();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioBlob]);

    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <AnimatePresence mode="wait">
                {isRecording ? (
                     <motion.div
                        key="recording"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex items-center space-x-4"
                    >
                        <span className="text-red-400 font-mono text-lg w-16 text-center">{formatDuration(duration)}</span>
                        <button
                            onClick={stopRecording}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-500 border-2 border-red-500 rounded-full p-6 shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all duration-200"
                            aria-label="Stop recording"
                        >
                            <StopCircle className="w-8 h-8" />
                        </button>
                    </motion.div>
                ) : status === 'processing' ? (
                    <motion.div
                        key="loading"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex flex-col items-center space-y-2 text-indigo-400"
                    >
                        <div className="p-6 bg-indigo-500/10 rounded-full border-2 border-indigo-500/50">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                        <span className="text-sm font-medium animate-pulse">Analizando audio...</span>
                    </motion.div>
                ) : status === 'success' ? (
                    <motion.div
                        key="success"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex flex-col items-center space-y-2 text-green-400"
                    >
                        <div className="p-6 bg-green-500/10 rounded-full border-2 border-green-500/50">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <span className="text-sm font-medium">¡Tarea creada!</span>
                    </motion.div>
                ) : status === 'error' ? (
                    <motion.div
                        key="error"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex flex-col items-center space-y-2 text-red-400"
                    >
                         <div className="p-6 bg-red-500/10 rounded-full border-2 border-red-500/50">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <span className="text-sm font-medium">Error al procesar</span>
                    </motion.div>
                ) : (
                    <motion.button
                        key="idle"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        onClick={startRecording}
                        className="group relative bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-6 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-indigo-500/25"
                        aria-label="Start recording"
                    >
                        <div className="absolute inset-0 rounded-full border border-white/20" />
                        <Mic className="w-8 h-8" />
                    </motion.button>
                )}
            </AnimatePresence>
            
            {/* Instrucción sutil si está inactivo */}
            {status === 'idle' && !isRecording && (
                <p className="text-gray-500 text-sm">Toca para hablar</p>
            )}
        </div>
    );
};

export default AudioRecorder;
