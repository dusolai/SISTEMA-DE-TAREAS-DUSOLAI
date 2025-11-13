import { GoogleGenAI, Type } from '@google/genai';
import { AiExtractedData } from '../types';

// CORRECTED: Use import.meta.env for client-side Vite projects.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not defined. Please check your .env.local file.");
}

const ai = new GoogleGenAI({ apiKey });

const model = 'gemini-2.5-flash';

const prompt = `You are an expert task management assistant. Your goal is to extract structured information from Spanish audio recordings. You MUST return ONLY a valid JSON object with the specified structure.

Structure:
{
  "title": "string (3-8 words, actionable verb)",
  "project": "string (project name or 'Inbox')",
  "priority": "'high' | 'medium' | 'low'",
  "context": "string (additional details)",
  "due_date": "'YYYY-MM-DD' or null",
  "tags": "string[]",
  "needs_clarification": "boolean",
  "clarification_question": "string or null",
  "confidence_score": "float 0.0-1.0"
}

Extraction Rules:
1. **title**: Extract the main action. Be concise. Example: "Llamar a Juan sobre presupuesto" NOT "Necesito llamar a Juan".
2. **priority**:
   - HIGH: for "urgente", "asap", "crítico", "inmediatamente", "hoy".
   - LOW: for "algún día", "tal vez", "eventualmente".
   - DEFAULT: "medium".
3. **due_date**:
   - "mañana" -> calculate tomorrow's date.
   - "la próxima semana" -> calculate next Monday's date.
   - "en 3 días" -> calculate date in 3 days.
4. **project**: Infer from context or use "Inbox" if none is mentioned.
5. **needs_clarification**: Only true if the action is ambiguous or critical information is missing.
6. **confidence_score**: Your confidence in the extraction accuracy from 0.0 to 1.0.

Example based on a transcription of an audio:
Input transcription: "necesito llamar a Sarah sobre la campaña de marketing, es bastante urgente"
Example Output:
{
  "title": "Llamar a Sarah sobre campaña de marketing",
  "project": "Marketing",
  "priority": "high",
  "context": "Discutir campaña de marketing",
  "due_date": null,
  "tags": ["llamada", "marketing"],
  "needs_clarification": false,
  "clarification_question": null,
  "confidence_score": 0.95
}

Now, analyze the following audio recording and extract the task information:`;

export const extractTaskFromAudio = async (audioBase64: string, mimeType: string): Promise<AiExtractedData> => {
    try {
        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [
                    { text: prompt },
                    { inlineData: { data: audioBase64, mimeType } }
                ]
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        project: { type: Type.STRING },
                        priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                        context: { type: Type.STRING },
                        due_date: { type: Type.STRING, nullable: true },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        needs_clarification: { type: Type.BOOLEAN },
                        clarification_question: { type: Type.STRING, nullable: true },
                        confidence_score: { type: Type.NUMBER }
                    },
                    required: ['title', 'project', 'priority', 'context', 'needs_clarification', 'confidence_score']
                }
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error extracting task from audio:", error);
        throw new Error("Failed to process audio with Gemini.");
    }
};