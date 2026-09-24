// ============================================
// FarmChain AI — Admin Demand Forecast Page
// Fully Localized (en, hi, ta, te)
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { createLineChart, createBarChart } from '../../components/charts.js';
import { formatNumber, localizeCropName } from '../../utils/helpers.js';
import { DemandForecaster } from '../../ai/demand-forecaster.js';
import { i18n } from '../../i18n/index.js';

export function renderAdminForecast(container) {
  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

  const crops = ['Rice', 'Wheat', 'Tomato', 'Onion', 'Mango', 'Banana'];
  const defaultCrop = 'Rice';
  const defaultForecast = DemandForecaster.forecast(defaultCrop);

  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main">
        <div class="topbar">
          <div class="topbar-left">
            <div>
              <div class="topbar-title">${i18n.t('admin.forecastTitle') || 'Demand Forecasting 📈'}</div>
              <div class="topbar-breadcrumb"><span>${i18n.t('admin.role') || 'Admin'}</span> <span>›</span> <span>${i18n.t('admin.navForecast') || 'Forecast'}</span></div>
            </div>
          </div>
          <div class="topbar-right">
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>${i18n.t('common.logout') || 'Logout'}</span></button>
          </div>
        </div>

        <div class="page-content">
          <!-- Crop Selector -->
          <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
            ${crops.map(crop => `
              <button class="tab crop-tab ${crop === defaultCrop ? 'active' : ''}" data-crop="${crop}">${localizeCropName(crop)}</button>
            `).join('')}
          </div>

          <!-- Forecast Chart -->
          <div class="chart-card" style="margin-bottom: 20px;">
            <div class="chart-card-header">
              <div class="chart-card-title" id="forecast-title">📈 ${i18n.t('admin.cropDemandForecast', { crop: localizeCropName(defaultCrop) }) || `${localizeCropName(defaultCrop)} — Demand Forecast`}</div>
            </div>
            <div class="chart-wrapper" style="height: 320px;">
              <canvas id="forecast-chart"></canvas>
            </div>
          </div>

          <div class="charts-grid equal">
            <!-- Summary -->
            <div class="card" id="forecast-summary">
              <div class="card-header">
                <div class="card-title">${i18n.t('admin.aiAnalysis') || '🤖 AI Analysis'}</div>
              </div>
              ${renderForecastSummary(defaultForecast)}
            </div>

            <!-- Forecast Table -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">${i18n.t('admin.monthlyForecast') || '📊 Monthly Forecast'}</div>
              </div>
              <table class="data-table" id="forecast-table">
                <thead>
                  <tr>
                    <th>${i18n.t('admin.month') || 'Month'}</th>
                    <th>${i18n.t('admin.predicted') || 'Predicted'}</th>
                    <th>${i18n.t('admin.range') || 'Range'}</th>
                    <th>${i18n.t('admin.confidence') || 'Confidence'}</th>
                  </tr>
                </thead>
                <tbody>
                  ${defaultForecast.forecast.map(f => `
                    <tr>
                      <td style="font-weight: 600;">${f.month}</td>
                      <td style="color: var(--accent-green);">${formatNumber(f.predicted)}</td>
                      <td style="font-size: 0.8rem; color: var(--text-muted);">${formatNumber(f.lower)} - ${formatNumber(f.upper)}</td>
                      <td><span class="badge badge-success">${f.confidence}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  setTimeout(() => renderForecastChart(defaultForecast), 100);

  // Crop tab switching
  container.querySelectorAll('.crop-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.crop-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const crop = tab.dataset.crop;
      const forecast = DemandForecaster.forecast(crop);
      const locCrop = localizeCropName(crop);

      document.getElementById('forecast-title').textContent = `📈 ${i18n.t('admin.cropDemandForecast', { crop: locCrop }) || `${locCrop} — Demand Forecast`}`;
      renderForecastChart(forecast);

      document.getElementById('forecast-summary').innerHTML = `
        <div class="card-header"><div class="card-title">${i18n.t('admin.aiAnalysis') || '🤖 AI Analysis'}</div></div>
        ${renderForecastSummary(forecast)}
      `;

      document.querySelector('#forecast-table tbody').innerHTML = forecast.forecast.map(f => `
        <tr>
          <td style="font-weight: 600;">${f.month}</td>
          <td style="color: var(--accent-green);">${formatNumber(f.predicted)}</td>
          <td style="font-size: 0.8rem; color: var(--text-muted);">${formatNumber(f.lower)} - ${formatNumber(f.upper)}</td>
          <td><span class="badge badge-success">${f.confidence}</span></td>
        </tr>
      `).join('');
    });
  });
}

function renderForecastChart(forecast) {
  const allLabels = [...forecast.history.map(h => h.month), ...forecast.forecast.map(f => f.month)];
  const historyData = [...forecast.history.map(h => h.demand), ...forecast.forecast.map(() => null)];
  const forecastData = [...forecast.history.map(() => null), ...forecast.forecast.map(f => f.predicted)];
  const upperBound = [...forecast.history.map(() => null), ...forecast.forecast.map(f => f.upper)];
  const lowerBound = [...forecast.history.map(() => null), ...forecast.forecast.map(f => f.lower)];

  createLineChart('forecast-chart', {
    labels: allLabels,
    datasets: [
      {
        label: i18n.t('admin.historical') || 'Historical',
        data: historyData,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
      },
      {
        label: i18n.t('admin.forecast') || 'Forecast',
        data: forecastData,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        borderDash: [5, 5],
        fill: true,
      },
      {
        label: i18n.t('admin.upperBound') || 'Upper Bound',
        data: upperBound,
        borderColor: 'rgba(6, 182, 212, 0.3)',
        backgroundColor: 'transparent',
        borderDash: [3, 3],
        pointRadius: 0,
        fill: false,
      },
      {
        label: i18n.t('admin.lowerBound') || 'Lower Bound',
        data: lowerBound,
        borderColor: 'rgba(6, 182, 212, 0.3)',
        backgroundColor: 'transparent',
        borderDash: [3, 3],
        pointRadius: 0,
        fill: false,
      },
    ],
  });
}

function renderForecastSummary(forecast) {
  const s = forecast.summary;
  return `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div class="ai-insight-card" style="background: var(--accent-green-dim); border-color: rgba(34,197,94,0.2);">
        <div class="ai-insight-title">${i18n.t('admin.trend') || '📊 Trend'}</div>
        <div class="ai-insight-value" style="color: var(--accent-green); text-transform: capitalize;">${s.trend}</div>
        <div class="ai-insight-desc">${i18n.t('admin.monthlyChange', { rate: s.trendPercentage }) || `${s.trendPercentage}% monthly change rate`}</div>
      </div>
      <div class="ai-insight-card" style="background: var(--accent-cyan-dim); border-color: rgba(6,182,212,0.2);">
        <div class="ai-insight-title">${i18n.t('admin.peakDemand') || '📈 Peak Demand'}</div>
        <div class="ai-insight-value" style="color: var(--accent-cyan);">${s.peakMonth}</div>
        <div class="ai-insight-desc">${i18n.t('admin.unitsExpected', { count: formatNumber(s.peakDemand) }) || `${formatNumber(s.peakDemand)} units expected`}</div>
      </div>
      <div class="ai-insight-card" style="background: var(--accent-purple-dim); border-color: rgba(168,85,247,0.2);">
        <div class="ai-insight-title">${i18n.t('admin.recommendation') || '🤖 Recommendation'}</div>
        <div class="ai-insight-desc" style="font-size: 0.88rem;">${s.recommendation}</div>
      </div>
    </div>
  `;
}
