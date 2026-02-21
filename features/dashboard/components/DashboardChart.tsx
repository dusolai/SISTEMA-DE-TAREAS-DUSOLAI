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

const DashboardChart: React.FC = () => {
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
            },
        },
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false,
        },
    };

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const data = {
        labels,
        datasets: [
            {
                fill: true,
                label: 'Revenue',
                data: [1200, 1900, 1700, 2400, 2100, 2800, 3200],
                borderColor: '#5848e8',
                backgroundColor: (context: any) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 160);
                    gradient.addColorStop(0, 'rgba(88, 72, 232, 0.5)');
                    gradient.addColorStop(1, 'rgba(88, 72, 232, 0.0)');
                    return gradient;
                },
                borderWidth: 2,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#5848e8',
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.4,
            },
        ],
    };

    return <Line options={options} data={data} />;
};

export default DashboardChart;
