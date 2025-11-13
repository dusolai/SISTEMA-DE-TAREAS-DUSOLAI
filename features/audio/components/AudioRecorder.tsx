
import React, { useEffect, useState } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import useTasks from '../../kanban/hooks/useTasks';
import { extractTaskFromAudio } from '../../../services/geminiService';
import useAuthStore from '../../../store/authStore';
import { Mic, StopCircle, Send, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiExtractedData } from '../../../types';

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                // remove the prefix 'data:*/*;base64,'
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
    const [isLoading, setIsLoading] = useState(false);
    
    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleCreateTask = async () => {
        if (!audioBlob || !session?.user) return;
        setIsLoading(true);

        try {
            const audioBase64 = await blobToBase64(audioBlob);
            const extractedData: AiExtractedData = await extractTaskFromAudio(audioBase64, mimeType);
            
            await createTaskMutation.mutateAsync({
                title: extractedData.title,
                status: 'todo',
                priority: extractedData.priority,
                description: extractedData.context,
                ai_extracted: extractedData,
                created_by: session.user.id,
                progress: 0,
                order: 0,
            });

            resetRecording();
        } catch (error) {
            console.error("Failed to create task", error);
            alert("Error: Could not create task from audio.");
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if(audioBlob) {
            handleCreateTask();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioBlob]);

    return (
        <div className="flex items-center justify-center">
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
                            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-5 shadow-lg transform transition-transform duration-200 hover:scale-105"
                            aria-label="Stop recording"
                        >
                            <StopCircle className="w-8 h-8" />
                        </button>
                    </motion.div>
                ) : isLoading ? (
                    <motion.div
                        key="loading"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex items-center space-x-3 text-gray-400"
                    >
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Processing...</span>
                    </motion.div>
                ) : (
                    <motion.button
                        key="idle"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        onClick={startRecording}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-5 shadow-lg transform transition-transform duration-200 hover:scale-105"
                        aria-label="Start recording"
                    >
                        <Mic className="w-8 h-8" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AudioRecorder;
