import React, { useState } from 'react';
import { FileText, Download, Calendar, User, Clock, Loader2, X, MessageSquare } from 'lucide-react';
import { supabaseAdmin } from '../../../services/supabaseAdmin';
import { supabase } from '../../../services/supabase';
import { useUIStore } from '../../../store/uiStore';
import { Task, WorkSession } from '../../../types';

interface WorkReportExportProps {
    onClose: () => void;
}

const formatDuration = (totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
};

const WorkReportExport: React.FC<WorkReportExportProps> = ({ onClose }) => {
    const { theme } = useUIStore();
    const [selectedEmail, setSelectedEmail] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [users, setUsers] = useState<{ email: string }[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const isDark = theme === 'dark';

    // Load users on mount
    React.useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setIsLoadingUsers(true);
        try {
            if (supabaseAdmin) {
                const { data } = await supabaseAdmin.auth.admin.listUsers();
                setUsers((data?.users || []).map(u => ({ email: u.email || '' })).filter(u => u.email));
            }
        } catch (e) {
            console.error('Error loading users:', e);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const generateReport = async () => {
        if (!selectedEmail || !selectedDate) {
            alert('Selecciona un trabajador y una fecha.');
            return;
        }

        setIsGenerating(true);
        try {
            // Fetch ALL tasks (we need to filter by work_sessions)
            const { data: allTasks, error } = await supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const tasks: Task[] = allTasks || [];
            const targetDate = new Date(selectedDate);
            const dayStart = new Date(targetDate); dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(targetDate); dayEnd.setHours(23, 59, 59, 999);

            // Filter tasks that have work sessions from this user on this day
            const relevantTasks = tasks.filter(task => {
                const sessions = (task.work_sessions || []) as WorkSession[];
                return sessions.some(s =>
                    s.user_email === selectedEmail &&
                    new Date(s.started_at) >= dayStart &&
                    new Date(s.started_at) <= dayEnd
                );
            });

            // Build report data
            const reportSections = relevantTasks.map(task => {
                const sessions = ((task.work_sessions || []) as WorkSession[]).filter(s =>
                    s.user_email === selectedEmail &&
                    new Date(s.started_at) >= dayStart &&
                    new Date(s.started_at) <= dayEnd
                );
                const totalSec = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
                return { task, sessions, totalSec };
            });

            const grandTotal = reportSections.reduce((sum, r) => sum + r.totalSec, 0);

            // Generate HTML Report
            const html = buildReportHTML(selectedEmail, selectedDate, reportSections, grandTotal);

            // Download
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `informe_${selectedEmail.split('@')[0]}_${selectedDate}.html`;
            a.click();
            URL.revokeObjectURL(url);

        } catch (e) {
            console.error('Error generating report:', e);
            alert('Error al generar el informe.');
        } finally {
            setIsGenerating(false);
        }
    };

    const buildReportHTML = (
        email: string,
        date: string,
        sections: { task: Task; sessions: WorkSession[]; totalSec: number }[],
        grandTotal: number
    ): string => {
        const dateFormatted = new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

        const taskRows = sections.map(({ task, sessions, totalSec }) => `
            <div style="background:#f8fafc;border-radius:16px;padding:20px;margin-bottom:16px;border:1px solid #e2e8f0;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <h3 style="margin:0;font-size:16px;font-weight:800;color:#0f172a;">${task.title}</h3>
                    <span style="background:#6366f1;color:white;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;">${formatDuration(totalSec)}</span>
                </div>
                <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
                    <span style="font-size:11px;padding:3px 10px;border-radius:8px;background:${task.status === 'done' ? '#dcfce7' : task.status === 'doing' ? '#fef9c3' : '#f1f5f9'};color:${task.status === 'done' ? '#166534' : task.status === 'doing' ? '#854d0e' : '#475569'};font-weight:600;">
                        ${task.status === 'done' ? 'Completada' : task.status === 'doing' ? 'En Progreso' : task.status === 'review' ? 'Revisión' : 'Por Hacer'}
                    </span>
                    <span style="font-size:11px;padding:3px 10px;border-radius:8px;background:#f1f5f9;color:#475569;font-weight:600;">
                        Prioridad: ${task.priority === 'high' ? '🔴 Alta' : task.priority === 'medium' ? '🟡 Media' : '🟢 Baja'}
                    </span>
                </div>
                ${task.subtasks && task.subtasks.length > 0 ? `
                    <div style="margin-bottom:12px;">
                        <p style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">
                            Subtareas (${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length})
                        </p>
                        <div style="height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;">
                            <div style="height:100%;width:${Math.round((task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100)}%;background:linear-gradient(90deg,#6366f1,#8b5cf6);border-radius:99px;"></div>
                        </div>
                    </div>
                ` : ''}
                <div style="border-top:1px solid #e2e8f0;padding-top:12px;">
                    <p style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Sesiones de Trabajo</p>
                    ${sessions.map(s => `
                        <div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid #f1f5f9;">
                            <span style="font-size:12px;font-weight:800;color:#6366f1;min-width:60px;">${formatDuration(s.duration_seconds)}</span>
                            <span style="font-size:12px;color:#64748b;flex:1;">${s.comment || 'Sin comentario'}</span>
                            <span style="font-size:10px;color:#94a3b8;white-space:nowrap;">${new Date(s.started_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${s.ended_at ? new Date(s.ended_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '...'}</span>
                        </div>
                    `).join('')}
                </div>
                ${(task.notion_url || task.drive_url || task.github_url) ? `
                    <div style="margin-top:12px;display:flex;gap:8px;">
                        ${task.notion_url ? `<a href="${task.notion_url}" style="font-size:11px;padding:4px 10px;border-radius:8px;background:#e0e7ff;color:#4338ca;font-weight:600;text-decoration:none;">Notion</a>` : ''}
                        ${task.drive_url ? `<a href="${task.drive_url}" style="font-size:11px;padding:4px 10px;border-radius:8px;background:#dbeafe;color:#1d4ed8;font-weight:600;text-decoration:none;">Drive</a>` : ''}
                        ${task.github_url ? `<a href="${task.github_url}" style="font-size:11px;padding:4px 10px;border-radius:8px;background:#f0fdf4;color:#166534;font-weight:600;text-decoration:none;">GitHub</a>` : ''}
                    </div>
                ` : ''}
            </div>
        `).join('');

        return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Informe Diario - ${email.split('@')[0]} - ${date}</title>
<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:#ffffff;color:#0f172a;padding:40px;}</style>
</head>
<body>
<div style="max-width:800px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:40px;">
        <h1 style="font-size:28px;font-weight:900;margin-bottom:4px;">📊 Informe de Trabajo Diario</h1>
        <p style="font-size:14px;color:#64748b;font-weight:600;">${dateFormatted}</p>
    </div>
    <div style="display:flex;gap:16px;margin-bottom:32px;">
        <div style="flex:1;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px;padding:20px;color:white;">
            <p style="font-size:10px;text-transform:uppercase;letter-spacing:2px;opacity:0.8;font-weight:700;">Trabajador</p>
            <p style="font-size:20px;font-weight:900;margin-top:4px;">${email}</p>
        </div>
        <div style="flex:1;background:linear-gradient(135deg,#10b981,#059669);border-radius:16px;padding:20px;color:white;">
            <p style="font-size:10px;text-transform:uppercase;letter-spacing:2px;opacity:0.8;font-weight:700;">Tiempo Total</p>
            <p style="font-size:20px;font-weight:900;margin-top:4px;">${formatDuration(grandTotal)}</p>
        </div>
        <div style="flex:1;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:16px;padding:20px;color:white;">
            <p style="font-size:10px;text-transform:uppercase;letter-spacing:2px;opacity:0.8;font-weight:700;">Tareas Trabajadas</p>
            <p style="font-size:20px;font-weight:900;margin-top:4px;">${sections.length}</p>
        </div>
    </div>
    <h2 style="font-size:18px;font-weight:800;margin-bottom:16px;">Desglose por Tarea</h2>
    ${sections.length === 0 ? '<p style="text-align:center;color:#94a3b8;padding:40px;">No hay sesiones de trabajo registradas para esta fecha.</p>' : taskRows}
    <div style="margin-top:32px;padding-top:16px;border-top:2px solid #e2e8f0;text-align:center;">
        <p style="font-size:11px;color:#94a3b8;">Generado automáticamente por DUALINK Task Manager Pro</p>
    </div>
</div>
</body></html>`;
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className={`w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl ${isDark ? 'bg-[#0f1325]' : 'bg-white'}`}>
                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-slate-800 bg-[#0a0e1f]' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Exportar Informe Diario</h2>
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Deep Work Report</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* User Selector */}
                    <div>
                        <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <User size={14} className="inline mr-2" />Trabajador
                        </label>
                        {isLoadingUsers ? (
                            <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={14} className="animate-spin" /> Cargando usuarios...</div>
                        ) : (
                            <select
                                value={selectedEmail}
                                onChange={e => setSelectedEmail(e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium ${isDark ? 'bg-[#0a0e1f] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                            >
                                <option value="">Selecciona un usuario...</option>
                                {users.map(u => <option key={u.email} value={u.email}>{u.email}</option>)}
                            </select>
                        )}
                    </div>

                    {/* Date Selector */}
                    <div>
                        <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <Calendar size={14} className="inline mr-2" />Fecha del Informe
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium ${isDark ? 'bg-[#0a0e1f] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        />
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={generateReport}
                        disabled={isGenerating || !selectedEmail}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <><Loader2 size={16} className="animate-spin" /> Generando Informe...</>
                        ) : (
                            <><Download size={16} /> Descargar Informe HTML</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkReportExport;
