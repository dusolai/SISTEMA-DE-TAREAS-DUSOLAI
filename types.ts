export interface Workspace {
    id: string;
    name: string;
    created_at?: string;
}

// NUEVO: Estructura del evento de historial
export interface HistoryEvent {
    id: string;
    action: 'creation' | 'update' | 'status_change' | 'comment';
    details: string; // El mensaje del cambio
    timestamp: string;
    user_email?: string;
}

export interface WorkSession {
    id: string;
    started_at: string;
    ended_at: string | null;
    duration_seconds: number;
    comment?: string;
    user_email?: string;
}

export interface Task {
    // --- Campos Originales Tuyos ---
    id: string;
    created_at: string;
    title: string;
    status: 'inbox' | 'todo' | 'doing' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high';
    project_id: string | null;
    description: string | null;
    order: number; // Mantenemos 'order' (no order_index)
    progress: number;
    assigned_to: string | null;
    created_by: string;
    workspace_id?: string;
    audio_url?: string;
    transcription?: string;
    ai_extracted?: AiExtractedData;

    // --- NUEVOS CAMPOS PARA SEGUIMIENTO ---
    updated_at?: string;
    history?: HistoryEvent[];
    scheduled_at?: string | null;
    scheduled_slots?: string[]; // Array of ISO strings for multi-hour scheduling
    notion_url?: string | null;
    drive_url?: string | null;
    github_url?: string | null;
    subtasks?: Subtask[];

    // Deep work
    work_sessions?: WorkSession[];
    total_work_seconds?: number;
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

export const KANBAN_COLUMNS: Array<{ id: Task['status'], title: string }> = [
    { id: 'inbox', title: '📥 Buzón' },
    { id: 'todo', title: 'Por Hacer' },
    { id: 'doing', title: 'En Progreso' },
    { id: 'review', title: 'Revisión' },
    { id: 'done', title: 'Completado' }
];