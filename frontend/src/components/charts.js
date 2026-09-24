// ============================================
// FarmChain AI — Chart Components
// Chart.js wrappers for dashboard analytics
// ============================================

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// Apply dark theme defaults with full Indic font fallbacks
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(148, 163, 184, 0.08)';
Chart.defaults.font.family = "'Noto Sans Devanagari', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Inter', sans-serif";

const chartInstances = new Map();

function destroyChart(id) {
  if (chartInstances.has(id)) {
    chartInstances.get(id).destroy();
    chartInstances.delete(id);
  }
}

export function createLineChart(canvasId, data, options = {}) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: data.datasets.map((ds, i) => ({
        ...ds,
        borderColor: ds.borderColor || ['#22c55e', '#06b6d4', '#a855f7', '#f59e0b'][i % 4],
        backgroundColor: ds.backgroundColor || ['rgba(34,197,94,0.1)', 'rgba(6,182,212,0.1)', 'rgba(168,85,247,0.1)', 'rgba(245,158,11,0.1)'][i % 4],
        borderWidth: ds.borderWidth || 2,
        pointRadius: ds.pointRadius || 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: ds.fill !== undefined ? ds.fill : true,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          display: data.datasets.length > 1,
          labels: { usePointStyle: true, padding: 16 },
        },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          borderColor: 'rgba(148, 163, 184, 0.15)',
          borderWidth: 1,
          padding: 12,
          titleFont: { weight: '600' },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { padding: 8 },
        },
        y: {
          grid: { color: 'rgba(148, 163, 184, 0.06)' },
          ticks: { padding: 8 },
          beginAtZero: options.beginAtZero || false,
        },
      },
      ...options,
    },
  });

  chartInstances.set(canvasId, chart);
  return chart;
}

export function createBarChart(canvasId, data, options = {}) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: data.datasets.map((ds, i) => ({
        ...ds,
        backgroundColor: ds.backgroundColor || [
          'rgba(34, 197, 94, 0.7)',
          'rgba(6, 182, 212, 0.7)',
          'rgba(168, 85, 247, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderRadius: 6,
        borderSkipped: false,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: data.datasets.length > 1,
          labels: { usePointStyle: true, padding: 16 },
        },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          borderColor: 'rgba(148, 163, 184, 0.15)',
          borderWidth: 1,
          padding: 12,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { padding: 8 },
        },
        y: {
          grid: { color: 'rgba(148, 163, 184, 0.06)' },
          ticks: { padding: 8 },
          beginAtZero: true,
        },
      },
      ...options,
    },
  });

  chartInstances.set(canvasId, chart);
  return chart;
}

export function createDoughnutChart(canvasId, data, options = {}) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const chart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: data.labels,
      datasets: [{
        data: data.values,
        backgroundColor: data.colors || [
          'rgba(34, 197, 94, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 16,
            font: { size: 12 },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          borderColor: 'rgba(148, 163, 184, 0.15)',
          borderWidth: 1,
          padding: 12,
        },
      },
      ...options,
    },
  });

  chartInstances.set(canvasId, chart);
  return chart;
}

export function destroyAllCharts() {
  for (const [id, chart] of chartInstances) {
    chart.destroy();
  }
  chartInstances.clear();
}
