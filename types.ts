export interface Task {
  id: string;
  created_at: string;
  title: string;
  status: 'todo' | 'doing' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  project_id: string | null;
  description: string | null;
  order: number;
  progress: number; // 0 a 100
  assigned_to: string | null;
  created_by: string;
  audio_url?: string;
  transcription?: string;
  ai_extracted?: AiExtractedData;
}

export interface Subtask {
    id: string;
    text: string;
    completed: boolean;
}

export interface AiExtractedData {
    title: string;
    project: string;
    priority: 'low' | 'medium' | 'high';
    context: string;
    due_date: string | null;
    tags: string[];
    needs_clarification: boolean;
    clarification_question: string | null;
    confidence_score: number;
    // Nuevo campo para los pasos sugeridos
    suggested_subtasks: Subtask[];
}

export const KANBAN_COLUMNS: Array<{id: Task['status'], title: string}> = [
    { id: 'todo', title: 'Todo' },
    { id: 'doing', title: 'In Progress' },
    { id: 'review', title: 'Review' },
    { id: 'done', title: 'Done' }
];
