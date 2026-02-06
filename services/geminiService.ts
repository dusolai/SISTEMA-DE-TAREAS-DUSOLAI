import { GoogleGenAI } from '@google/genai';
import { AiExtractedData, Subtask } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not defined.");
}

const ai = new GoogleGenAI({ apiKey });
const model = 'gemini-2.5-flash';

// --- PROMPTS DE AUDIO Y TEXTO (SIN CAMBIOS) ---
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

const subtasksPrompt = `You are a productivity expert. Given a task title and description, generate a checklist of 3 to 6 actionable subtasks to complete it.
Return ONLY a JSON array of strings. Example: ["Step 1", "Step 2"].
Task Title: `;

const updatePrompt = `You are updating an EXISTING task based on new audio instructions.
Current Task JSON:
`;

// --- NUEVO PROMPT: AUDITORÍA DETALLADA ---
const reportPrompt = `Eres un Auditor de Proyectos Senior.
Tu trabajo no es solo resumir, sino ANALIZAR CADA TAREA individualmente.

Genera un objeto JSON con este formato EXACTO:
{
  "health_score": number, // 0-100
  "executive_summary": "string", // Resumen global del proyecto
  "key_risks": ["string", "string"], 
  "recommendations": ["string", "string", "string"],
  "mood": "Optimista" | "Cauteloso" | "Crítico",
  "analyzed_tasks": [
    {
      "original_title": "string", // Título exacto de la tarea para identificarla
      "ai_audit": "string", // TU OPINIÓN PROFESIONAL: ¿Está bien definida? ¿Es un cuello de botella? ¿Es urgente? (Máx 20 palabras)
      "smart_priority": "string" // Re-evalúa la prioridad real según tu criterio: "Crítica", "Normal", "Baja"
    }
  ]
}

Analiza estas tareas:
`;

// --- FUNCIONES ---

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

// --- FUNCIÓN DEL REPORTE MAESTRO ---
export const generateProjectReportData = async (tasks: any[], workspaceName: string): Promise<any> => {
    try {
        // Enviamos datos clave para que la IA pueda juzgar (antigüedad, subtareas completadas, etc.)
        const simplifiedTasks = tasks.map(t => ({
            title: t.title,
            description: t.description ? t.description.substring(0, 100) : "Sin descripción", // Recortar para ahorrar tokens
            status: t.status,
            priority: t.priority,
            days_open: Math.floor((new Date().getTime() - new Date(t.created_at).getTime()) / (1000 * 3600 * 24)),
            subtasks_completed: `${t.ai_extracted?.suggested_subtasks?.filter((s: any) => s.completed).length || 0}/${t.ai_extracted?.suggested_subtasks?.length || 0}`
        }));

        const fullPrompt = `${reportPrompt} \n Nombre del Proyecto: "${workspaceName}" \n Tareas para auditar: ${JSON.stringify(simplifiedTasks)}`;

        const response = await ai.models.generateContent({
            model,
            contents: { parts: [{ text: fullPrompt }] },
            config: { responseMimeType: 'application/json' }
        });

        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error generando informe:", error);
        return {
            health_score: 50,
            executive_summary: "Error al contactar con la IA. Generando reporte básico.",
            key_risks: ["No disponible"],
            recommendations: ["Revisar conexión"],
            mood: "Neutro",
            analyzed_tasks: [] // Fallback vacío
        };
    }
};
