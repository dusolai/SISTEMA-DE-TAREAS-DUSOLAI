import { GoogleGenAI } from '@google/genai';
import { AiExtractedData, Subtask } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not defined.");
}

const ai = new GoogleGenAI({ apiKey });
const model = 'gemini-2.5-flash';

// --- PROMPT 1: CREACIÓN DE TAREA (AUDIO) ---
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

// --- PROMPT 4: INFORME MAESTRO (NUEVO) ---
const reportPrompt = `Eres un Project Manager Senior experto en metodologías ágiles. 
Analiza el siguiente listado de tareas (JSON) de un espacio de trabajo.
Tu objetivo es generar un "Informe Maestro de Situación" en formato Markdown bien estructurado.

El informe debe incluir obligatoriamente las siguientes secciones:
1. 📊 **Resumen Ejecutivo**: Visión general del estado del proyecto (Salud del proyecto).
2. 🚨 **Riesgos y Bloqueos**: Identifica tareas de prioridad ALTA que estén en estado 'todo' o estancadas, o tareas con muchos días de antigüedad sin completarse.
3. 📈 **Análisis de Progreso**: Comparativa de trabajo completado vs pendiente.
4. 💡 **Recomendaciones Estratégicas**: 3 consejos accionables para mejorar la velocidad del equipo basándote en los datos.

IMPORTANTE: Sé directo, profesional y usa formato Markdown (negritas, listas, encabezados).
Datos del Proyecto:
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

// 2. GENERAR PLAN DESDE TEXTO (EXISTENTE)
export const generateSubtasksFromText = async (
    title: string, 
    description: string,
    customInstructions?: string
): Promise<Subtask[]> => {
    try {
        let instructions = "Generate a checklist of 3 to 6 actionable subtasks to complete it.";
        if (customInstructions) {
            instructions = `The user has specific requirements: "${customInstructions}". Generate the checklist following strictly these instructions.`;
        }

        const fullPrompt = `You are a productivity expert. Given a task title and description. ${instructions}
        Task Title: "${title}". 
        Context: "${description}". 
        Return ONLY a valid JSON array of strings. Example: ["Step 1", "Step 2"].`;

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

// 3. ACTUALIZAR TAREA CON AUDIO (EXISTENTE)
export const updateTaskWithAudio = async (currentTask: any, audioBase64: string, mimeType: string): Promise<any> => {
    try {
        const fullPrompt = `${updatePrompt} ${JSON.stringify(currentTask)} \n\n Analyze the audio and merge the new information. Update title, description, priority or status if mentioned. If user adds steps, append them to 'subtasks_text'. Return the full updated JSON structure.`;
        
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [{ text: fullPrompt }, { inlineData: { data: audioBase64, mimeType } }] },
            config: { responseMimeType: 'application/json' }
        });
        
        const updatedData = JSON.parse(response.text.trim());
        
        if (updatedData.subtasks_text && Array.isArray(updatedData.subtasks_text)) {
             const newSubtasks = updatedData.subtasks_text.map((text: string, index: number) => ({
                id: `upd-${Date.now()}-${index}`,
                text,
                completed: false
            }));
            updatedData.suggested_subtasks = newSubtasks;
        }
        
        return updatedData;
    } catch (error) {
        console.error("Error updating task:", error);
        throw error;
    }
};

// 4. NUEVO: GENERAR INFORME MAESTRO
export const generateProjectReport = async (tasks: any[], workspaceName: string): Promise<string> => {
    try {
        // Limpiamos los datos para enviar solo lo relevante y ahorrar tokens
        const simplifiedTasks = tasks.map(t => ({
            title: t.title,
            status: t.status, // todo, doing, review, done
            priority: t.priority,
            progress: (t.progress || 0) + '%',
            created_at: t.created_at,
            subtasks_stat: `${t.ai_extracted?.suggested_subtasks?.filter((s: any) => s.completed).length || 0}/${t.ai_extracted?.suggested_subtasks?.length || 0} subtasks`
        }));

        const fullPrompt = `${reportPrompt} \n Nombre del Espacio: "${workspaceName}" \n Tareas: ${JSON.stringify(simplifiedTasks)}`;

        const response = await ai.models.generateContent({
            model,
            contents: { parts: [{ text: fullPrompt }] },
            // IMPORTANTE: No usamos responseMimeType: 'application/json' aquí porque queremos texto Markdown libre
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error generando informe:", error);
        throw error;
    }
};
