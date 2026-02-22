import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend
);

import { Task } from '../../../types';

interface Props {
    tasks: Task[];
}

const DashboardChart: React.FC<Props> = ({ tasks }) => {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                backgroundColor: '#0f1325',
                titleColor: '#fff',
                bodyColor: '#cbd5e1',
                borderColor: '#1e293b',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                    label: (context: any) => `Tareas: ${context.parsed.y}`
                }
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#64748b',
                    font: {
                        size: 10,
                    },
                },
            },
            y: {
                display: false,
                grid: {
                    display: false,
                },
                min: 0,
                ticks: {
                    stepSize: 1
                }
            },
        },
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false,
        },
    };

    const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    // Calcular tareas creadas por día de la semana actual
    const getCreationCounts = () => {
        const counts = [0, 0, 0, 0, 0, 0, 0];
        if (!tasks || !Array.isArray(tasks)) return counts;

        const now = new Date();
        const startOfWeek = new Date(now);
        const day = now.getDay(); // 0 (Sun) to 6 (Sat)
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        tasks.forEach(task => {
            if (!task.created_at) return;
            const createdDate = new Date(task.created_at);
            if (createdDate >= startOfWeek) {
                const dayIndex = (createdDate.getDay() + 6) % 7; // Convert 0-6 (Sun-Sat) to 0-6 (Mon-Sun)
                if (dayIndex >= 0 && dayIndex < 7) {
                    counts[dayIndex]++;
                }
            }
        });
        return counts;
    };

    const data = {
        labels,
        datasets: [
            {
                fill: true,
                label: 'Tareas Creadas',
                data: getCreationCounts(),
                borderColor: '#5848e8',
                backgroundColor: (context: any) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return null;
                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, 'rgba(88, 72, 232, 0.0)');
                    gradient.addColorStop(1, 'rgba(88, 72, 232, 0.4)');
                    return gradient;
                },
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#5848e8',
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#5848e8',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2,
                tension: 0.4,
            },
        ],
    };

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <Line options={options} data={data} />
        </div>
    );
};

export default DashboardChart;
