import { GoogleGenAI, Type } from '@google/genai';
import { AiExtractedData, Subtask } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not defined.");
}

const ai = new GoogleGenAI({ apiKey });
const model = 'gemini-2.5-flash';

// --- PROMPT 1: CREACIÓN (YA LO TENÍAS) ---
const createPrompt = `You are an expert task management assistant. Extract structured info from Spanish audio.
Structure:
{
  "title": "string",
  "project": "string",
  "priority": "'high' | 'medium' | 'low'",
  "context": "string",
  "due_date": "string | null",
  "tags": "string[]",
  "needs_clarification": "boolean",
  "clarification_question": "string | null",
  "confidence_score": "number",
  "subtasks_text": "string[] (3-6 actionable steps)"
}
Input audio:`;

// --- PROMPT 2: GENERAR SOLO SUBTAREAS (TEXTO) ---
const subtasksPrompt = `You are a productivity expert. Given a task title and description, generate a checklist of 3 to 6 actionable subtasks to complete it.
Return ONLY a JSON array of strings. Example: ["Step 1", "Step 2"].
Task Title: `;

// --- PROMPT 3: ACTUALIZAR TAREA CON AUDIO ---
const updatePrompt = `You are updating an EXISTING task based on new audio instructions.
Current Task JSON:
`;

// 1. CREAR TAREA (EXISTENTE)
export const extractTaskFromAudio = async (audioBase64: string, mimeType: string): Promise<AiExtractedData> => {
    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [{ text: createPrompt }, { inlineData: { data: audioBase64, mimeType } }] },
            config: { responseMimeType: 'application/json' }
        });
        
        const rawData = JSON.parse(response.text.trim());
        const suggested_subtasks = (rawData.subtasks_text || []).map((text: string, index: number) => ({
            id: `st-${Date.now()}-${index}`,
            text,
            completed: false
        }));
        return { ...rawData, suggested_subtasks };
    } catch (error) {
        console.error("Error Gemini:", error);
        throw error;
    }
};

// 2. NUEVO: GENERAR PLAN DESDE TEXTO
export const generateSubtasksFromText = async (title: string, description: string): Promise<Subtask[]> => {
    try {
        const fullPrompt = `${subtasksPrompt} "${title}". \nContext: "${description}". \nJSON Response:`;
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [{ text: fullPrompt }] },
            config: { responseMimeType: 'application/json' }
        });

        const steps: string[] = JSON.parse(response.text.trim());
        return steps.map((text, index) => ({
            id: `gen-${Date.now()}-${index}`,
            text,
            completed: false
        }));
    } catch (error) {
        console.error("Error generating subtasks:", error);
        return [];
    }
};

// 3. NUEVO: ACTUALIZAR TAREA CON AUDIO
export const updateTaskWithAudio = async (currentTask: any, audioBase64: string, mimeType: string): Promise<any> => {
    try {
        const fullPrompt = `${updatePrompt} ${JSON.stringify(currentTask)} \n\n Analyze the audio and merge the new information. Update title, description, priority or status if mentioned. If user adds steps, append them to 'subtasks_text'. Return the full updated JSON structure.`;
        
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [{ text: fullPrompt }, { inlineData: { data: audioBase64, mimeType } }] },
            config: { responseMimeType: 'application/json' }
        });
        
        const updatedData = JSON.parse(response.text.trim());
        
        // Re-mapear subtareas si vienen como texto plano
        if (updatedData.subtasks_text && Array.isArray(updatedData.subtasks_text)) {
             const newSubtasks = updatedData.subtasks_text.map((text: string, index: number) => ({
                id: `upd-${Date.now()}-${index}`,
                text,
                completed: false
            }));
            // Combinamos con cuidado o reemplazamos según prefieras. Aquí reemplazamos para simplificar la sincronización.
            updatedData.suggested_subtasks = newSubtasks;
        }
        
        return updatedData;
    } catch (error) {
        console.error("Error updating task:", error);
        throw error;
    }
};
