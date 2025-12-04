export interface Workspace {
    id: string;
    name: string;
    created_at?: string;
}

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
  workspace_id?: string; // <--- NUEVO CAMPO
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
    suggested_subtasks: Subtask[];
}

export const KANBAN_COLUMNS: Array<{id: Task['status'], title: string}> = [
    { id: 'todo', title: 'Por Hacer' },
    { id: 'doing', title: 'En Progreso' },
    { id: 'review', title: 'Revisión' },
    { id: 'done', title: 'Completado' }
];
