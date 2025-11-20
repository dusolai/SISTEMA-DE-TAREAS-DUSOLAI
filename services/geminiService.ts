import { GoogleGenAI, Type } from '@google/genai';
import { AiExtractedData } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not defined.");
}

const ai = new GoogleGenAI({ apiKey });
const model = 'gemini-2.5-flash';

// Prompt mejorado para solicitar subtareas
const prompt = `You are an expert task management assistant. Your goal is to extract structured information from Spanish audio recordings AND break down the task into actionable subtasks.

Structure:
{
  "title": "string (3-8 words, actionable verb)",
  "project": "string (project name or 'Inbox')",
  "priority": "'high' | 'medium' | 'low'",
  "context": "string (detailed description)",
  "due_date": "'YYYY-MM-DD' or null",
  "tags": "string[]",
  "needs_clarification": "boolean",
  "clarification_question": "string or null",
  "confidence_score": "float 0.0-1.0",
  "subtasks_text": "string[] (3-6 actionable steps to complete the task)"
}

Extraction Rules:
1. **title**: Concise main action.
2. **subtasks_text**: Break the task down into logical steps. Example: If task is "Create website", steps: ["Buy domain", "Design mockup", "Code HTML", "Deploy"].
3. **priority**: Infer urgency.
4. **needs_clarification**: True only if critical info is missing.

Analyze the following audio recording:`;

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
                        confidence_score: { type: Type.NUMBER },
                        subtasks_text: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['title', 'project', 'priority', 'context', 'needs_clarification', 'confidence_score', 'subtasks_text']
                }
            }
        });
        
        const jsonText = response.text.trim();
        const rawData = JSON.parse(jsonText);

        // Transformamos los textos simples en objetos Subtask
        const suggested_subtasks = (rawData.subtasks_text || []).map((text: string, index: number) => ({
            id: `st-${Date.now()}-${index}`,
            text,
            completed: false
        }));

        return {
            ...rawData,
            suggested_subtasks
        };

    } catch (error) {
        console.error("Error extracting task from audio:", error);
        throw new Error("Failed to process audio with Gemini.");
    }
};
