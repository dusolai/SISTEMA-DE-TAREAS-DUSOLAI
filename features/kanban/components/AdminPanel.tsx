import React, { useState, useEffect } from 'react';
import { supabaseAdmin } from '../../../services/supabaseAdmin';
import { X, Lock, User, RefreshCw, KeyRound, AlertTriangle } from 'lucide-react';
import { useUIStore } from '../../../store/uiStore';

interface AdminPanelProps {
    onClose: () => void;
}

interface UserData {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string | null;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
    const { theme } = useUIStore();
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        console.log("AdminPanel: mount triggered");
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);

        if (!supabaseAdmin) {
            setError("No se ha configurado la clave maestra (VITE_SUPABASE_SERVICE_ROLE_KEY). Añádela en Cloudflare y .env.local");
            setIsLoading(false);
            return;
        }

        try {
            const { data, error: apiError } = await supabaseAdmin.auth.admin.listUsers();

            if (apiError) throw apiError;

            setUsers(data.users || []);
        } catch (err: any) {
            console.error("Error fetching users:", err);
            setError(err.message || "Error al cargar la lista de usuarios.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = async (userId: string, email: string) => {
        if (!newPassword || newPassword.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        if (!confirm(`¿Estás seguro de que quieres forzar una nueva contraseña para ${email}?`)) {
            return;
        }

        setIsSaving(true);
        try {
            const { error: updateError } = await supabaseAdmin!.auth.admin.updateUserById(userId, {
                password: newPassword
            });

            if (updateError) throw updateError;

            alert(`Contraseña actualizada correctamente para ${email}`);
            setEditingUserId(null);
            setNewPassword('');
        } catch (err: any) {
            console.error("Error updating password:", err);
            alert(`Error al cambiar contraseña: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm sm:p-6 transition-opacity">
            <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 ${theme === 'dark' ? 'bg-[#0f1325]' : 'bg-white'}`}>

                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0a0e1f]">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500">
                            <Lock size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Panel de Administración</h2>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Control Total de Usuarios</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        <X size={20} className="stroke-2" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
                    {error ? (
                        <div className="bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 p-5 rounded-r-xl flex items-start gap-4">
                            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-bold text-red-800 dark:text-red-400">Error de Configuración</h3>
                                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                            </div>
                        </div>
                    ) : isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <RefreshCw className="w-10 h-10 text-primary animate-spin mb-4" />
                            <p className="text-sm font-bold text-slate-500">Cargando usuarios...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0a0e1f]">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Usuarios</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{users.length}</p>
                                </div>
                            </div>

                            {/* User List */}
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-[#0f1325]">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-[#0a0e1f] border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                        <tr>
                                            <th className="px-5 py-3">Usuario (Email)</th>
                                            <th className="px-5 py-3 hidden sm:table-cell">Registrado el</th>
                                            <th className="px-5 py-3 text-right">Acciones de Seguridad</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {users.map((user) => (
                                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
                                                            {user.email?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="font-medium text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-[250px]">
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 hidden sm:table-cell text-slate-500 text-xs">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    {editingUserId === user.id ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <input
                                                                type="text" // Mostrar texto para que la veas al escribirla
                                                                placeholder="Nueva contraseña..."
                                                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0a0e1f] text-sm w-40 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                                                value={newPassword}
                                                                onChange={(e) => setNewPassword(e.target.value)}
                                                                onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordChange(user.id, user.email || ''); }}
                                                                autoFocus
                                                            />
                                                            <button
                                                                onClick={() => handlePasswordChange(user.id, user.email || '')}
                                                                disabled={isSaving}
                                                                className="px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 disabled:opacity-50 transition-colors"
                                                            >
                                                                {isSaving ? 'Guardando...' : 'Guardar'}
                                                            </button>
                                                            <button
                                                                onClick={() => { setEditingUserId(null); setNewPassword(''); }}
                                                                className="px-2 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setEditingUserId(user.id)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                                                        >
                                                            <KeyRound size={14} /> Cambiar Password
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
