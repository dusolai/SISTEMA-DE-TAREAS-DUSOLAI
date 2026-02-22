import { Task } from '../types';

// ======================================================================
// PREMIUM HTML REPORT GENERATOR — "Nivel Zeus" ⚡
// Generates a beautiful HTML document optimized for printing.
// ======================================================================

const cleanText = (text: any): string =>
    text ? String(text).replace(/[^\x20-\x7E\xA0-\xFF\u00C0-\u024F\u20AC\n\r¿¡áéíóúñÁÉÍÓÚÑ]/g, '').trim() : '';

export const generatePremiumHTMLReport = (
    tasks: Task[],
    aiData: any,
    workspaceName: string
): void => {
    const byStatus = {
        todo: tasks.filter(t => t.status === 'todo').length,
        doing: tasks.filter(t => t.status === 'doing').length,
        review: tasks.filter(t => t.status === 'review').length,
        done: tasks.filter(t => t.status === 'done').length,
    };
    const byPriority = {
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length,
    };
    const total = tasks.length;
    const completionRate = total > 0 ? Math.round((byStatus.done / total) * 100) : 0;
    const healthScore = aiData.health_score ?? completionRate;
    const mood = aiData.mood || 'Neutro';
    const dateStr = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Informe Dualink - ${workspaceName}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #5848e8;
            --primary-light: #7669f0;
            --dark: #0f172a;
            --white: #ffffff;
            --bg: #f8fafc;
            --card: #ffffff;
            --text: #1e293b;
            --text-light: #64748b;
            --text-muted: #94a3b8;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --info: #3b82f6;
            --border: #e2e8f0;
            --bg-card: #f1f5f9;
        }

        * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
        body {
            font-family: 'Inter', sans-serif;
            background: var(--white);
            color: var(--text);
            margin: 0;
            padding: 0;
            line-height: 1.5;
        }

        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: 10mm auto;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            position: relative;
        }

        @media print {
            body { background: none; }
            .page { margin: 0; box-shadow: none; width: 100%; border: none; }
            .no-print { display: none; }
            .page-break { page-break-before: always; }
        }

        /* Header */
        header {
            background: var(--primary);
            color: white;
            padding: 40px;
            margin: -20mm -20mm 30px -20mm;
            border-bottom: 8px solid var(--primary-light);
        }
        header h1 { margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -1px; }
        header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 14px; }
        header .meta { display: flex; justify-content: space-between; margin-top: 20px; font-size: 12px; font-weight: 500; }

        /* KPI Cards */
        .kpi-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
        .kpi-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
            border-top: 4px solid var(--primary);
        }
        .kpi-card.success { border-top-color: var(--success); }
        .kpi-card.warning { border-top-color: var(--warning); }
        .kpi-card.danger { border-top-color: var(--danger); }
        .kpi-label { color: var(--text-muted); font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 5px; }
        .kpi-value { font-size: 24px; font-weight: 700; color: var(--dark); }

        /* Sections */
        section { margin-bottom: 40px; }
        .section-title {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 18px;
            font-weight: 700;
            color: var(--dark);
            margin-bottom: 20px;
            padding-left: 10px;
            border-left: 5px solid var(--primary);
        }

        .card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 20px;
        }

        /* Summary */
        .summary-box { font-size: 14px; color: var(--text); line-height: 1.6; }

        /* Charts area */
        .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
        .chart-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 20px;
        }
        .chart-title { font-size: 12px; font-weight: 700; color: var(--text-light); margin-bottom: 15px; text-align: center; }

        /* Progress Bar */
        .progress-container { margin-top: 40px; }
        .progress-bar-bg { background: var(--border); height: 12px; border-radius: 6px; overflow: hidden; margin-top: 10px; }
        .progress-bar-fill { background: linear-gradient(90deg, var(--primary), var(--success)); height: 100%; border-radius: 6px; }

        /* Risks & Recs */
        .risks-recs { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .risk-box { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 12px; }
        .rec-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 12px; }
        .box-title { font-size: 13px; font-weight: 700; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
        .risk-box .box-title { color: var(--danger); }
        .rec-box .box-title { color: var(--success); }
        ul { margin: 0; padding-left: 20px; font-size: 13px; color: var(--text); }
        li { margin-bottom: 8px; }

        /* Table */
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
        th { text-align: left; background: var(--primary); color: white; padding: 12px 10px; font-weight: 600; }
        th:first-child { border-radius: 8px 0 0 0; }
        th:last-child { border-radius: 0 8px 0 0; }
        td { padding: 12px 10px; border-bottom: 1px solid var(--border); vertical-align: top; }
        tr:nth-child(even) { background: var(--bg-card); }

        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: white;
        }
        .badge.todo { background: var(--text-muted); }
        .badge.doing { background: var(--info); }
        .badge.review { background: var(--warning); }
        .badge.done { background: var(--success); }

        .badge-prio {
            padding: 4px 8px;
            border-radius: 50px;
            font-size: 9px;
            font-weight: 800;
        }
        .badge-prio.high { background: #fee2e2; color: #ef4444; }
        .badge-prio.medium { background: #fef3c7; color: #f59e0b; }
        .badge-prio.low { background: #d1fae5; color: #10b981; }

        .audit-text { font-style: italic; color: var(--text-light); font-size: 11px; }

        footer {
            position: absolute;
            bottom: 20mm;
            left: 20mm;
            right: 20mm;
            border-top: 1px solid var(--border);
            padding-top: 10px;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: var(--text-muted);
        }

        .print-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--primary);
            color: white;
            border: none;
            padding: 15px 25px;
            border-radius: 50px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(88,72,232,0.4);
            z-index: 9999;
        }
    </style>
</head>
<body>
    <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimir Informe</button>

    <div class="page">
        <header>
            <h1>INFORME EJECUTIVO</h1>
            <p>Proyecto: <strong>${cleanText(workspaceName)}</strong></p>
            <div class="meta">
                <span>📅 ${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}</span>
                <span>DUALINK TASK MANAGER</span>
            </div>
        </header>

        <div class="kpi-container">
            <div class="kpi-card">
                <div class="kpi-label">Tareas Totales</div>
                <div class="kpi-value">${total}</div>
            </div>
            <div class="kpi-card ${healthScore >= 70 ? 'success' : healthScore >= 40 ? 'warning' : 'danger'}">
                <div class="kpi-label">Salud del Proyecto</div>
                <div class="kpi-value">${healthScore}%</div>
            </div>
            <div class="kpi-card success">
                <div class="kpi-label">Completadas</div>
                <div class="kpi-value">${byStatus.done}</div>
            </div>
            <div class="kpi-card ${mood === 'Optimista' ? 'success' : mood === 'Crítico' ? 'danger' : 'warning'}">
                <div class="kpi-label">Estado de Ánimo</div>
                <div class="kpi-value" style="font-size: 18px; padding-top: 5px;">${mood}</div>
            </div>
        </div>

        <section>
            <div class="section-title">📋 Resumen Ejecutivo</div>
            <div class="card summary-box">
                ${cleanText(aiData.executive_summary || 'Sin resumen disponible.')}
            </div>
        </section>

        <section>
            <div class="section-title">📊 Distribución y Progreso</div>
            <div class="charts-row">
                <div class="chart-card">
                    <div class="chart-title">POR ESTADO</div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${Object.entries(byStatus).map(([status, count]) => `
                            <div style="display: flex; justify-content: space-between; font-size: 11px;">
                                <span style="text-transform: capitalize;">${status === 'todo' ? 'Por hacer' : status === 'doing' ? 'Haciendo' : status === 'review' ? 'Revisión' : 'Hecho'}</span>
                                <strong>${count}</strong>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="chart-card">
                    <div class="chart-title">POR PRIORIDAD</div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${Object.entries(byPriority).map(([prio, count]) => `
                            <div style="display: flex; justify-content: space-between; font-size: 11px;">
                                <span style="text-transform: capitalize;">${prio === 'high' ? 'Alta' : prio === 'medium' ? 'Media' : 'Baja'}</span>
                                <strong>${count}</strong>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="progress-container">
                <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700;">
                    <span>PROGRESO GENERAL</span>
                    <span>${completionRate}%</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${completionRate}%"></div>
                </div>
            </div>
        </section>

        <section>
            <div class="section-title">⚠️ Riesgos y Recomendaciones</div>
            <div class="risks-recs">
                <div class="risk-box">
                    <div class="box-title">🔴 RIESGOS CLAVE</div>
                    <ul>
                        ${(aiData.key_risks || []).map((r: string) => `<li>${cleanText(r)}</li>`).join('')}
                    </ul>
                </div>
                <div class="rec-box">
                    <div class="box-title">💡 RECOMENDACIONES</div>
                    <ul>
                        ${(aiData.recommendations || []).map((r: string) => `<li>${cleanText(r)}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </section>

        <footer>
            <span>Dualink Task Manager — Informe generado por IA</span>
            <span>Página 1</span>
        </footer>
    </div>

    <div class="page page-break">
        <div class="section-title">📝 Auditoría Detallada de Tareas</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 40px;">#</th>
                    <th>Tarea / Objetivo</th>
                    <th style="width: 100px;">Estado</th>
                    <th style="width: 90px;">Prioridad</th>
                    <th>Análisis de la IA</th>
                </tr>
            </thead>
            <tbody>
                ${(aiData.analyzed_tasks || []).map((task: any, i: number) => {
        const original = tasks.find(t => t.title === task.original_title) || tasks[i];
        const status = original?.status || 'todo';
        const priority = task.smart_priority || 'Normal';
        return `
                    <tr>
                        <td style="color: var(--text-muted); font-weight: 700;">${i + 1}</td>
                        <td><strong>${cleanText(task.original_title)}</strong></td>
                        <td><span class="badge ${status}">${status === 'todo' ? 'Por hacer' : status === 'doing' ? 'Haciendo' : status === 'review' ? 'Revisión' : 'Hecho'}</span></td>
                        <td><span class="badge-prio ${priority.toLowerCase() === 'crítica' || priority === 'high' ? 'high' : priority.toLowerCase() === 'normal' || priority === 'medium' ? 'medium' : 'low'}">${priority.toUpperCase()}</span></td>
                        <td class="audit-text">${cleanText(task.ai_audit)}</td>
                    </tr>
                    `;
    }).join('')}
            </tbody>
        </table>

        <footer>
            <span>Dualink Task Manager — Informe generado por IA</span>
            <span>Página 2</span>
        </footer>
    </div>
</body>
</html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    } else {
        alert("El navegador bloqueó la apertura del informe. Por favor, permite ventanas emergentes.");
    }
};
