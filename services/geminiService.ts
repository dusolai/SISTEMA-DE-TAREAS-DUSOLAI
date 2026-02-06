import { GoogleGenAI } from '@google/genai';
import { AiExtractedData, Subtask } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not defined.");
}

const ai = new GoogleGenAI({ apiKey });
const model = 'gemini-2.5-flash';

// --- PROMPTS EXISTENTES ---
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

const updatePrompt = `You are updating an EXISTING task based on new audio instructions.
Current Task JSON:
`;

// --- NUEVO PROMPT PARA REPORTE EN JSON ---
const reportPrompt = `Eres un Analista de Proyectos Senior.
Analiza los datos del proyecto y genera un informe de situación estructurado.
Devuelve EXCLUSIVAMENTE un objeto JSON válido con este formato (sin markdown, sin bloques de código):

{
  "health_score": number, // 0 a 100, donde 100 es éxito total.
  "executive_summary": "string", // Resumen de 3-4 líneas.
  "key_risks": ["string", "string"], // Lista de 2-3 riesgos principales.
  "recommendations": ["string", "string", "string"], // 3 consejos estratégicos.
  "mood": "Optimista" | "Cauteloso" | "Crítico"
}

Datos del Proyecto:
`;

// 1. EXTRAER TAREA (AUDIO)
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

// 2. GENERAR SUBTAREAS (TEXTO)
export const generateSubtasksFromText = async (title: string, description: string, customInstructions?: string): Promise<Subtask[]> => {
    try {
        let instructions = "Generate a checklist of 3 to 6 actionable subtasks.";
        if (customInstructions) instructions = `Requirements: "${customInstructions}".`;

        const fullPrompt = `You are a productivity expert. ${instructions} Task: "${title}". Context: "${description}". Return ONLY JSON array of strings.`;

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

// 3. ACTUALIZAR TAREA
export const updateTaskWithAudio = async (currentTask: any, audioBase64: string, mimeType: string): Promise<any> => {
    try {
        const fullPrompt = `${updatePrompt} ${JSON.stringify(currentTask)} \n\n Analyze audio, merge info. Return full JSON.`;
        
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [{ text: fullPrompt }, { inlineData: { data: audioBase64, mimeType } }] },
            config: { responseMimeType: 'application/json' }
        });
        
        const updatedData = JSON.parse(response.text.trim());
        if (updatedData.subtasks_text && Array.isArray(updatedData.subtasks_text)) {
             updatedData.suggested_subtasks = updatedData.subtasks_text.map((text: string, index: number) => ({
                id: `upd-${Date.now()}-${index}`,
                text,
                completed: false
            }));
        }
        return updatedData;
    } catch (error) {
        console.error("Error updating task:", error);
        throw error;
    }
};

// 4. NUEVO: GENERAR DATOS PARA EL INFORME (DEVUELVE JSON)
export const generateProjectReportData = async (tasks: any[], workspaceName: string): Promise<any> => {
    try {
        const simplifiedTasks = tasks.map(t => ({
            title: t.title,
            status: t.status,
            priority: t.priority,
            progress: (t.progress || 0),
            days_open: Math.floor((new Date().getTime() - new Date(t.created_at).getTime()) / (1000 * 3600 * 24))
        }));

        const fullPrompt = `${reportPrompt} \n Nombre del Espacio: "${workspaceName}" \n Tareas: ${JSON.stringify(simplifiedTasks)}`;

        const response = await ai.models.generateContent({
            model,
            contents: { parts: [{ text: fullPrompt }] },
            config: { responseMimeType: 'application/json' }
        });

        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error generando informe:", error);
        throw error;
    }
};