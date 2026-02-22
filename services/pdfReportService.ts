import { jsPDF } from 'jspdf';
import { Task } from '../types';

// ======================================================================
// PREMIUM PDF REPORT GENERATOR — "Nivel Dios" 🔥
// Uses jsPDF's drawing primitives to create charts, cards, and visuals.
// ======================================================================

// ── Color Palette ──
const COLORS = {
    primary: [88, 72, 232],        // #5848e8
    primaryLight: [118, 105, 240], // lighter purple
    dark: [15, 23, 42],            // slate-900
    white: [255, 255, 255],
    bg: [248, 250, 252],           // slate-50
    card: [255, 255, 255],
    text: [30, 41, 59],            // slate-800
    textLight: [100, 116, 139],    // slate-500
    textMuted: [148, 163, 184],    // slate-400
    success: [16, 185, 129],       // emerald-500
    warning: [245, 158, 11],       // amber-500
    danger: [239, 68, 68],         // red-500
    info: [59, 130, 246],          // blue-500
    border: [226, 232, 240],       // slate-200
    bgCard: [241, 245, 249],       // slate-100

    // Status colors
    todo: [148, 163, 184],
    doing: [59, 130, 246],
    review: [245, 158, 11],
    done: [16, 185, 129],

    // Priority colors
    high: [239, 68, 68],
    medium: [245, 158, 11],
    low: [16, 185, 129],
};

type RGB = number[];

// ── Helpers ──
const setColor = (doc: jsPDF, color: RGB) => doc.setTextColor(color[0], color[1], color[2]);
const setFill = (doc: jsPDF, color: RGB) => doc.setFillColor(color[0], color[1], color[2]);
const setDraw = (doc: jsPDF, color: RGB) => doc.setDrawColor(color[0], color[1], color[2]);

const cleanText = (text: any): string =>
    text ? String(text).replace(/[^\x20-\x7E\xA0-\xFF\u00C0-\u024F\u20AC\n\r¿¡áéíóúñÁÉÍÓÚÑ]/g, '').trim() : '';

const safeWrap = (doc: jsPDF, text: string, maxWidth: number): string[] => {
    const cleaned = cleanText(text);
    if (!cleaned) return [''];
    return doc.splitTextToSize(cleaned, maxWidth);
};

// ── Rounded rectangle helper ──
const roundedRect = (doc: jsPDF, x: number, y: number, w: number, h: number, r: number, style: 'F' | 'S' | 'FD' = 'F') => {
    doc.roundedRect(x, y, w, h, r, r, style);
};

// ── Draw a horizontal gradient bar ──
const gradientBar = (doc: jsPDF, x: number, y: number, w: number, h: number, colorStart: RGB, colorEnd: RGB, progress: number) => {
    // Background track
    setFill(doc, COLORS.bgCard);
    roundedRect(doc, x, y, w, h, h / 2, 'F');
    // Fill
    const fillWidth = Math.max(h, w * Math.min(progress, 1));
    setFill(doc, colorStart);
    roundedRect(doc, x, y, fillWidth, h, h / 2, 'F');
};

// ── Draw a donut/ring chart ──
const drawDonutChart = (doc: jsPDF, cx: number, cy: number, radius: number, segments: { value: number; color: RGB; label: string }[], innerLabel: string) => {
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    if (total === 0) {
        setFill(doc, COLORS.bgCard);
        doc.circle(cx, cy, radius, 'F');
        setColor(doc, COLORS.textMuted);
        doc.setFontSize(8);
        doc.text('Sin datos', cx, cy, { align: 'center' });
        return;
    }

    let startAngle = -Math.PI / 2; // Start from top
    const outerR = radius;
    const innerR = radius * 0.6;

    segments.forEach(seg => {
        if (seg.value === 0) return;
        const sliceAngle = (seg.value / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        // Draw arc segment as filled polygon
        setFill(doc, seg.color);
        const points: number[][] = [];
        const steps = Math.max(20, Math.ceil(sliceAngle / 0.05));
        for (let i = 0; i <= steps; i++) {
            const angle = startAngle + (sliceAngle * i) / steps;
            points.push([cx + outerR * Math.cos(angle), cy + outerR * Math.sin(angle)]);
        }
        for (let i = steps; i >= 0; i--) {
            const angle = startAngle + (sliceAngle * i) / steps;
            points.push([cx + innerR * Math.cos(angle), cy + innerR * Math.sin(angle)]);
        }

        // Draw as polygon using lines
        if (points.length > 2) {
            doc.setLineWidth(0);
            setDraw(doc, seg.color);

            // Use triangle fan approach
            for (let i = 1; i < points.length - 1; i++) {
                const triangle = doc.triangle(
                    points[0][0], points[0][1],
                    points[i][0], points[i][1],
                    points[i + 1][0], points[i + 1][1],
                    'F'
                );
            }
        }

        startAngle = endAngle;
    });

    // Inner circle (white center)
    setFill(doc, COLORS.white);
    doc.circle(cx, cy, innerR, 'F');

    // Center label
    setColor(doc, COLORS.dark);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(innerLabel, cx, cy + 2, { align: 'center' });
};

// ── Draw horizontal bar chart ──
const drawBarChart = (doc: jsPDF, x: number, y: number, w: number, data: { label: string; value: number; color: RGB }[]) => {
    const barHeight = 8;
    const gap = 12;
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const labelWidth = 30;
    const barAreaWidth = w - labelWidth - 15;

    data.forEach((item, i) => {
        const barY = y + i * (barHeight + gap);

        // Label
        setColor(doc, COLORS.textLight);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(item.label, x, barY + barHeight / 2 + 1);

        // Background bar
        setFill(doc, COLORS.bgCard);
        roundedRect(doc, x + labelWidth, barY, barAreaWidth, barHeight, 3, 'F');

        // Value bar
        const barW = Math.max(6, (item.value / maxVal) * barAreaWidth);
        setFill(doc, item.color);
        roundedRect(doc, x + labelWidth, barY, barW, barHeight, 3, 'F');

        // Value text
        setColor(doc, COLORS.dark);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(String(item.value), x + labelWidth + barW + 4, barY + barHeight / 2 + 1);
    });

    return data.length * (barHeight + gap);
};

// ── Section header ──
const sectionHeader = (doc: jsPDF, y: number, icon: string, title: string): number => {
    setFill(doc, COLORS.primary);
    roundedRect(doc, 20, y, 4, 14, 2, 'F');

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.dark);
    doc.text(`${icon}  ${title}`, 28, y + 10);

    return y + 22;
};

// ── Page break checker ──
const checkPage = (doc: jsPDF, y: number, needed: number): number => {
    if (y + needed > 275) {
        doc.addPage();
        return 20;
    }
    return y;
};

// ══════════════════════════════════════════════════════
// MAIN EXPORT: Generate Premium PDF
// ══════════════════════════════════════════════════════
export const generatePremiumPDF = (
    tasks: Task[],
    aiData: any,
    workspaceName: string
): void => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth(); // 210
    const contentWidth = pageWidth - 40; // 170

    // ── Task statistics ──
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

    // ════════════════════════════════════════════════════
    // PAGE 1: COVER / HEADER
    // ════════════════════════════════════════════════════

    // Full-width header bar
    setFill(doc, COLORS.primary);
    doc.rect(0, 0, 210, 55, 'F');

    // Decorative accent line
    setFill(doc, COLORS.primaryLight);
    doc.rect(0, 55, 210, 2, 'F');

    // Title
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.white);
    doc.text('INFORME EJECUTIVO', 20, 28);

    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Proyecto: ${cleanText(workspaceName)}`, 20, 40);

    // Date
    doc.setFontSize(9);
    const dateStr = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(dateStr.charAt(0).toUpperCase() + dateStr.slice(1), 20, 49);

    // Brand
    doc.setFontSize(9);
    doc.text('DUALINK TASK MANAGER', pageWidth - 20, 49, { align: 'right' });

    let y = 68;

    // ════════════════════════════════════════════════════
    // KPI CARDS ROW
    // ════════════════════════════════════════════════════
    const cardW = 40;
    const cardH = 32;
    const cardsStartX = 20;
    const cardGap = 3.3;

    const kpis = [
        { label: 'TAREAS', value: String(total), color: COLORS.primary },
        { label: 'COMPLETAS', value: `${byStatus.done}`, color: COLORS.success },
        { label: 'SALUD', value: `${healthScore}%`, color: healthScore >= 70 ? COLORS.success : healthScore >= 40 ? COLORS.warning : COLORS.danger },
        { label: 'ESTADO', value: mood, color: mood === 'Optimista' ? COLORS.success : mood === 'Crítico' ? COLORS.danger : COLORS.warning },
    ];

    kpis.forEach((kpi, i) => {
        const cx = cardsStartX + i * (cardW + cardGap);

        // Card background
        setFill(doc, COLORS.card);
        setDraw(doc, COLORS.border);
        doc.setLineWidth(0.3);
        roundedRect(doc, cx, y, cardW, cardH, 4, 'FD');

        // Color accent line at top
        setFill(doc, kpi.color as RGB);
        roundedRect(doc, cx + 4, y + 2, cardW - 8, 2, 1, 'F');

        // Value
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        setColor(doc, kpi.color as RGB);
        doc.text(kpi.value, cx + cardW / 2, y + 17, { align: 'center' });

        // Label
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        setColor(doc, COLORS.textMuted);
        doc.text(kpi.label, cx + cardW / 2, y + 26, { align: 'center' });
    });

    y += cardH + 12;

    // ════════════════════════════════════════════════════
    // EXECUTIVE SUMMARY
    // ════════════════════════════════════════════════════
    y = sectionHeader(doc, y, '📋', 'Resumen Ejecutivo');

    // Summary card
    setFill(doc, COLORS.bgCard);
    setDraw(doc, COLORS.border);
    doc.setLineWidth(0.2);
    const summaryLines = safeWrap(doc, aiData.executive_summary || 'Sin resumen disponible.', contentWidth - 16);
    const summaryH = Math.max(24, summaryLines.length * 5 + 12);
    roundedRect(doc, 20, y, contentWidth, summaryH, 4, 'FD');

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    setColor(doc, COLORS.text);
    doc.text(summaryLines, 28, y + 8);

    y += summaryH + 10;

    // ════════════════════════════════════════════════════
    // CHARTS SECTION (side by side)
    // ════════════════════════════════════════════════════
    y = checkPage(doc, y, 80);
    y = sectionHeader(doc, y, '📊', 'Distribución de Tareas');

    // Left card: Status distribution (donut)
    const chartCardW = (contentWidth - 6) / 2;
    const chartCardH = 65;

    setFill(doc, COLORS.card);
    setDraw(doc, COLORS.border);
    doc.setLineWidth(0.2);
    roundedRect(doc, 20, y, chartCardW, chartCardH, 4, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.textLight);
    doc.text('POR ESTADO', 20 + chartCardW / 2, y + 8, { align: 'center' });

    // Donut chart
    const donutSegments = [
        { value: byStatus.todo, color: COLORS.todo, label: 'Por hacer' },
        { value: byStatus.doing, color: COLORS.doing, label: 'En progreso' },
        { value: byStatus.review, color: COLORS.review, label: 'En revisión' },
        { value: byStatus.done, color: COLORS.done, label: 'Completadas' },
    ];
    drawDonutChart(doc, 20 + chartCardW / 2, y + 30, 14, donutSegments, `${completionRate}%`);

    // Legend
    let legendY = y + 50;
    donutSegments.forEach(seg => {
        if (seg.value > 0) {
            setFill(doc, seg.color);
            roundedRect(doc, 27, legendY - 2, 5, 3, 1, 'F');
            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            setColor(doc, COLORS.textLight);
            doc.text(`${seg.label}: ${seg.value}`, 34, legendY);
            legendY += 4.5;
        }
    });

    // Right card: Priority bar chart
    const rightCardX = 20 + chartCardW + 6;
    setFill(doc, COLORS.card);
    setDraw(doc, COLORS.border);
    doc.setLineWidth(0.2);
    roundedRect(doc, rightCardX, y, chartCardW, chartCardH, 4, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.textLight);
    doc.text('POR PRIORIDAD', rightCardX + chartCardW / 2, y + 8, { align: 'center' });

    drawBarChart(doc, rightCardX + 6, y + 16, chartCardW - 12, [
        { label: 'Alta', value: byPriority.high, color: COLORS.danger },
        { label: 'Media', value: byPriority.medium, color: COLORS.warning },
        { label: 'Baja', value: byPriority.low, color: COLORS.success },
    ]);

    // Completion progress bar below charts
    y += chartCardH + 8;

    setFill(doc, COLORS.card);
    setDraw(doc, COLORS.border);
    doc.setLineWidth(0.2);
    roundedRect(doc, 20, y, contentWidth, 18, 4, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.textLight);
    doc.text('PROGRESO GENERAL', 28, y + 7);
    doc.text(`${completionRate}%`, 20 + contentWidth - 8, y + 7, { align: 'right' });

    gradientBar(doc, 28, y + 10, contentWidth - 16, 4, COLORS.primary, COLORS.success, completionRate / 100);

    y += 28;

    // ════════════════════════════════════════════════════
    // RISKS & RECOMMENDATIONS (side by side)
    // ════════════════════════════════════════════════════
    y = checkPage(doc, y, 60);
    y = sectionHeader(doc, y, '⚠️', 'Riesgos y Recomendaciones');

    const risks = aiData.key_risks || [];
    const recs = aiData.recommendations || [];
    const halfW = (contentWidth - 6) / 2;

    // Risks card
    setFill(doc, [254, 242, 242]); // red-50
    setDraw(doc, [252, 165, 165]); // red-300
    doc.setLineWidth(0.3);
    const riskTextAll = risks.map((r: string) => safeWrap(doc, r, halfW - 16));
    const riskLinesCount = riskTextAll.reduce((sum: number, lines: string[]) => sum + lines.length, 0);
    const risksH = Math.max(30, riskLinesCount * 5 + risks.length * 4 + 16);
    roundedRect(doc, 20, y, halfW, risksH, 4, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.danger);
    doc.text('🔴  RIESGOS CLAVE', 28, y + 8);

    let ry = y + 16;
    risks.forEach((risk: string) => {
        const lines = safeWrap(doc, `• ${risk}`, halfW - 16);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        setColor(doc, COLORS.text);
        doc.text(lines, 28, ry);
        ry += lines.length * 5 + 3;
    });

    // Recommendations card
    const recX = 20 + halfW + 6;
    setFill(doc, [236, 253, 245]); // emerald-50
    setDraw(doc, [110, 231, 183]); // emerald-300
    doc.setLineWidth(0.3);
    const recTextAll = recs.map((r: string) => safeWrap(doc, r, halfW - 16));
    const recLinesCount = recTextAll.reduce((sum: number, lines: string[]) => sum + lines.length, 0);
    const recsH = Math.max(30, recLinesCount * 5 + recs.length * 4 + 16);
    roundedRect(doc, recX, y, halfW, Math.max(risksH, recsH), 4, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.success);
    doc.text('💡  RECOMENDACIONES', recX + 8, y + 8);

    let recy = y + 16;
    recs.forEach((rec: string) => {
        const lines = safeWrap(doc, `• ${rec}`, halfW - 16);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        setColor(doc, COLORS.text);
        doc.text(lines, recX + 8, recy);
        recy += lines.length * 5 + 3;
    });

    y += Math.max(risksH, recsH) + 12;

    // ════════════════════════════════════════════════════
    // PAGE 2+: TASK DETAIL TABLE
    // ════════════════════════════════════════════════════
    y = checkPage(doc, y, 40);
    y = sectionHeader(doc, y, '📝', 'Auditoría Detallada de Tareas');

    // Table header
    const cols = { num: 20, title: 28, status: 95, priority: 120, audit: 140 };
    const colWidths = { title: 65, status: 23, priority: 18, audit: 50 };

    setFill(doc, COLORS.primary);
    roundedRect(doc, 20, y, contentWidth, 8, 2, 'F');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.white);
    doc.text('#', cols.num + 2, y + 5.5);
    doc.text('TAREA', cols.title + 2, y + 5.5);
    doc.text('ESTADO', cols.status + 2, y + 5.5);
    doc.text('PRIORIDAD', cols.priority + 2, y + 5.5);
    doc.text('ANÁLISIS IA', cols.audit + 2, y + 5.5);

    y += 10;

    const tasksToPrint = aiData.analyzed_tasks || tasks.map(t => ({
        original_title: t.title,
        ai_audit: 'Sin análisis',
        smart_priority: t.priority === 'high' ? 'Crítica' : t.priority === 'medium' ? 'Normal' : 'Baja'
    }));

    tasksToPrint.forEach((task: any, i: number) => {
        // Get original task data for status
        const original = tasks.find(t => t.title === task.original_title) || tasks[i];
        const status = original?.status || 'todo';
        const priority = task.smart_priority || 'Normal';

        // Calculate row height based on wrapped text
        const titleLines = safeWrap(doc, task.original_title, colWidths.title);
        const auditLines = safeWrap(doc, task.ai_audit, colWidths.audit);
        const maxLines = Math.max(titleLines.length, auditLines.length);
        const rowH = Math.max(10, maxLines * 4.5 + 4);

        y = checkPage(doc, y, rowH + 4);

        // Alternating row background
        if (i % 2 === 0) {
            setFill(doc, COLORS.bgCard);
            roundedRect(doc, 20, y - 1, contentWidth, rowH + 2, 2, 'F');
        }

        // Row number
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        setColor(doc, COLORS.textMuted);
        doc.text(String(i + 1), cols.num + 2, y + 4);

        // Title (wrapped)
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        setColor(doc, COLORS.dark);
        doc.text(titleLines, cols.title + 2, y + 4);

        // Status badge
        const statusConfig: Record<string, { color: RGB; label: string }> = {
            todo: { color: COLORS.todo, label: 'Por hacer' },
            doing: { color: COLORS.doing, label: 'Haciendo' },
            review: { color: COLORS.review, label: 'Revisión' },
            done: { color: COLORS.done, label: 'Hecho' },
        };
        const sc = statusConfig[status] || statusConfig.todo;
        setFill(doc, sc.color);
        roundedRect(doc, cols.status + 2, y + 1, 20, 5, 2, 'F');
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'bold');
        setColor(doc, COLORS.white);
        doc.text(sc.label, cols.status + 12, y + 4.5, { align: 'center' });

        // Priority badge
        const prioConfig: Record<string, { color: RGB; label: string }> = {
            'Crítica': { color: COLORS.danger, label: 'ALTA' },
            'Normal': { color: COLORS.warning, label: 'MEDIA' },
            'Baja': { color: COLORS.success, label: 'BAJA' },
            'high': { color: COLORS.danger, label: 'ALTA' },
            'medium': { color: COLORS.warning, label: 'MEDIA' },
            'low': { color: COLORS.success, label: 'BAJA' },
        };
        const pc = prioConfig[priority] || prioConfig['Normal'];
        setFill(doc, [...pc.color.map(c => Math.min(255, c + 180))] as unknown as RGB);
        roundedRect(doc, cols.priority + 1, y + 1, 16, 5, 2, 'F');
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'bold');
        setColor(doc, pc.color);
        doc.text(pc.label, cols.priority + 9, y + 4.5, { align: 'center' });

        // AI Audit text (wrapped)
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'italic');
        setColor(doc, COLORS.textLight);
        doc.text(auditLines, cols.audit + 2, y + 4);

        // Divider line
        setDraw(doc, COLORS.border);
        doc.setLineWidth(0.1);
        doc.line(20, y + rowH + 1, 20 + contentWidth, y + rowH + 1);

        y += rowH + 3;
    });

    // ════════════════════════════════════════════════════
    // FOOTER ON EVERY PAGE
    // ════════════════════════════════════════════════════
    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page++) {
        doc.setPage(page);
        const pageH = doc.internal.pageSize.getHeight();

        // Footer line
        setDraw(doc, COLORS.border);
        doc.setLineWidth(0.3);
        doc.line(20, pageH - 12, pageWidth - 20, pageH - 12);

        // Footer text
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        setColor(doc, COLORS.textMuted);
        doc.text('Dualink Task Manager — Informe generado por IA', 20, pageH - 7);
        doc.text(`Página ${page} de ${totalPages}`, pageWidth - 20, pageH - 7, { align: 'right' });
    }

    // Save
    const fileName = `Informe_${cleanText(workspaceName).replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
};
