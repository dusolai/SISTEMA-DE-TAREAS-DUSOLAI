import React, { useState, useEffect } from 'react';
import { useWorkspaces } from '../hooks/useWorkspaces';
import useTasks from '../hooks/useTasks';
import useAuthStore from '../../../store/authStore';
import { Plus, Check, Loader2, ArrowLeft, Inbox } from 'lucide-react';

const MobileQuickAdd: React.FC = () => {
    const { session } = useAuthStore();
    const { workspaces, isLoading: isLoadingWS } = useWorkspaces();
    const { createTask } = useTasks();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [workspaceId, setWorkspaceId] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Set default workspace if available
    useEffect(() => {
        if (!workspaceId && workspaces && workspaces.length > 0) {
            setWorkspaceId(workspaces[0].id);
        }
    }, [workspaces, workspaceId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !workspaceId || !session?.user?.id) return;

        setIsSaving(true);
        const success = await createTask({
            title: title.trim(),
            description: description.trim() || null,
            status: 'inbox', // Siempre va al buzón
            priority,
            workspace_id: workspaceId,
            order: 0,
            progress: 0,
            project_id: null,
            assigned_to: null,
            created_by: session.user.id
        });
        setIsSaving(false);

        if (success) {
            setShowSuccess(true);
            setTitle('');
            setDescription('');
            setPriority('medium');
            setTimeout(() => setShowSuccess(false), 2000);
        } else {
            alert('Error al guardar la tarea');
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-[#020412] flex flex-col h-[100dvh]">
            {/* Header */}
            <header className="flex-shrink-0 px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800/50 bg-white/95 dark:bg-[#020412]/95 backdrop-blur-xl">
                <button
                    onClick={() => window.location.hash = ''}
                    className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Volver"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Inbox className="w-5 h-5 text-primary" /> Buzón Rápido
                    </h1>
                </div>
                <div className="w-10"></div> {/* Spacer for centering */}
            </header>

            {/* Form */}
            <main className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                {showSuccess && (
                    <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800/30 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">¡Guardado en el Buzón!</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">Listo para la revisión en el tablero.</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Workspace Selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Espacio de Trabajo</label>
                        <select
                            value={workspaceId}
                            onChange={(e) => setWorkspaceId(e.target.value)}
                            disabled={isLoadingWS}
                            className="w-full bg-gray-50 dark:bg-[#0f1325] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 text-sm rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none appearance-none font-medium"
                            required
                        >
                            {isLoadingWS ? (
                                <option value="">Cargando...</option>
                            ) : (
                                workspaces?.map(ws => (
                                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Title Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">¿Qué hay que hacer?</label>
                        <textarea
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Anota la idea o tarea aquí..."
                            className="w-full bg-gray-50 dark:bg-[#0f1325] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-base rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none resize-none"
                            rows={3}
                            required
                            autoFocus
                        />
                    </div>

                    {/* Meta: Priority */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Prioridad</label>
                        <div className="flex gap-3">
                            {(['low', 'medium', 'high'] as const).map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPriority(p)}
                                    className={`flex-1 py-3 text-sm font-semibold rounded-xl border transition-all ${priority === p
                                        ? p === 'high' ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20'
                                            : p === 'medium' ? 'bg-yellow-500 text-white border-yellow-500 shadow-lg shadow-yellow-500/20'
                                                : 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20'
                                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    {p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baja'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Optional Details */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Detalles adicionales (opcional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Añade contexto si es necesario..."
                            className="w-full bg-gray-50 dark:bg-[#0f1325] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none resize-none"
                            rows={4}
                        />
                    </div>
                </form>
            </main>

            {/* Footer Action */}
            <footer className="flex-shrink-0 p-6 border-t border-gray-100 dark:border-gray-800/50 bg-white/95 dark:bg-[#020412]/95 backdrop-blur-xl">
                <button
                    onClick={handleSubmit}
                    disabled={!title.trim() || !workspaceId || isSaving}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover active:scale-95 text-white py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-primary/30"
                >
                    {isSaving ? (
                        <><Loader2 className="w-6 h-6 animate-spin" /> Guardando...</>
                    ) : (
                        <><Plus className="w-6 h-6" /> Añadir al Buzón</>
                    )}
                </button>
            </footer>
        </div>
    );
};

export default MobileQuickAdd;
