import React, { useState } from 'react';
import { useUIStore } from '../../../store/uiStore';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { X, Plus, Trash2, Edit2, Save, Check } from 'lucide-react';

const WorkspaceManager: React.FC = () => {
    const { isWorkspaceManagerOpen, closeWorkspaceManager, currentWorkspaceId, setWorkspace } = useUIStore();
    const { workspaces, createWorkspace, updateWorkspace, deleteWorkspace } = useWorkspaces();

    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    if (!isWorkspaceManagerOpen) return null;

    const handleCreate = () => {
        if (!newWorkspaceName.trim()) return;
        createWorkspace.mutate(newWorkspaceName);
        setNewWorkspaceName('');
    };

    const startEdit = (id: string, currentName: string) => {
        setEditingId(id);
        setEditName(currentName);
    };

    const saveEdit = (id: string) => {
        if (!editName.trim()) return;
        updateWorkspace.mutate({ id, name: editName });
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        if (confirm('¿Seguro? Se borrarán TODAS las tareas de este negocio.')) {
            deleteWorkspace.mutate(id);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-800 flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-gray-950">
                    <h3 className="text-lg font-bold text-white">Gestionar Espacios</h3>
                    <button onClick={closeWorkspaceManager} className="text-gray-500 hover:text-white p-1">
                        <X size={20} />
                    </button>
                </div>

                {/* Lista */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3 max-h-[60vh] custom-scrollbar">
                    {workspaces?.map(ws => (
                        <div key={ws.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            ws.id === currentWorkspaceId ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                        }`}>
                            
                            {/* Edición vs Vista */}
                            {editingId === ws.id ? (
                                <div className="flex-1 flex gap-2">
                                    <input 
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                        autoFocus
                                    />
                                    <button onClick={() => saveEdit(ws.id)} className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30">
                                        <Save size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div 
                                    className="flex-1 text-sm font-medium text-gray-200 cursor-pointer"
                                    onClick={() => { setWorkspace(ws.id); closeWorkspaceManager(); }}
                                >
                                    {ws.name}
                                    {ws.id === currentWorkspaceId && <span className="ml-2 text-[10px] text-indigo-400 font-bold uppercase tracking-wider">(Activo)</span>}
                                </div>
                            )}

                            {/* Botones Acciones */}
                            {editingId !== ws.id && (
                                <div className="flex items-center gap-1">
                                    <button onClick={() => startEdit(ws.id, ws.name)} className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-gray-700 rounded-lg transition-colors">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(ws.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {workspaces?.length === 0 && <p className="text-center text-gray-500 text-sm py-4">No hay espacios creados</p>}
                </div>

                {/* Footer: Crear Nuevo */}
                <div className="p-5 bg-gray-950 border-t border-gray-800">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Crear Nuevo Negocio</label>
                    <div className="flex gap-2">
                        <input 
                            value={newWorkspaceName}
                            onChange={(e) => setNewWorkspaceName(e.target.value)}
                            placeholder="Ej: Tienda Nueva..."
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        />
                        <button 
                            onClick={handleCreate}
                            disabled={!newWorkspaceName.trim()}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkspaceManager;
