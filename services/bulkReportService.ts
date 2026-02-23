import JSZip from 'jszip';
import { supabase } from './supabase';
import { generateProjectReportData } from './geminiService';
import { generatePremiumHTMLString } from './htmlReportService';
import { Task } from '../types';

interface Workspace {
    id: string;
    name: string;
}

/**
 * Generates AI reports for ALL workspaces and bundles them into a single ZIP download.
 * @param workspaces - Array of workspace objects
 * @param onProgress - Callback for progress updates (0-100)
 */
export const generateBulkReportsZip = async (
    workspaces: Workspace[],
    onProgress?: (percent: number, currentName: string) => void
): Promise<void> => {
    const zip = new JSZip();
    const total = workspaces.length;
    let completed = 0;

    for (const ws of workspaces) {
        try {
            // Update progress
            onProgress?.(Math.round((completed / total) * 100), ws.name);

            // Fetch tasks for this workspace
            const { data: tasks, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('workspace_id', ws.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error(`Error fetching tasks for ${ws.name}:`, error);
                completed++;
                continue;
            }

            const taskList: Task[] = tasks || [];

            if (taskList.length === 0) {
                completed++;
                continue; // Skip workspaces with no tasks
            }

            // Generate AI analysis
            const aiData = await generateProjectReportData(taskList, ws.name);

            // Generate HTML string
            const htmlContent = generatePremiumHTMLString(taskList, aiData, ws.name);

            // Sanitize workspace name for filename
            const safeName = ws.name
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
                .replace(/[^a-zA-Z0-9_\- ]/g, '')
                .replace(/\s+/g, '_')
                .substring(0, 50);

            zip.file(`Informe_${safeName}.html`, htmlContent);
        } catch (err) {
            console.error(`Error generating report for ${ws.name}:`, err);
        }

        completed++;
    }

    onProgress?.(100, 'Empaquetando ZIP...');

    // Generate and download ZIP
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `Informes_IA_${date}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
