// ============================================
// FarmChain AI — Admin Dashboard
// Platform analytics, fraud alerts, blockchain
// Fully Localized (en, hi, ta, te)
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { createLineChart, createBarChart, createDoughnutChart } from '../../components/charts.js';
import { formatCurrency, formatNumber, formatDateTime, truncateHash, timeAgo, localizeCropName } from '../../utils/helpers.js';
import { blockchain } from '../../blockchain/core.js';
import { FraudDetector } from '../../ai/fraud-detector.js';
import { DemandForecaster } from '../../ai/demand-forecaster.js';
import { PaymentSplitter } from '../../blockchain/contracts.js';
import { getFirestoreUsers } from '../../firebase/firestore.js';
import { fetchUsers } from '../../utils/api.js';
import { i18n } from '../../i18n/index.js';

export function renderAdminDashboard(container) {
  const user = store.get('currentUser');
  const users = store.get('users') || {};
  const products = store.get('products') || [];
  const orders = store.get('orders') || [];
  const payments = PaymentSplitter.getAllPayments();
  const allTx = blockchain.getAllTransactions();
  const blockCount = blockchain.getBlockCount();

  const totalRevenue = payments.reduce((s, p) => s + (p.totalAmount || 0), 0);
  const userCount = Object.keys(users).length;

  const fraudAlerts = FraudDetector.generateDemoAlerts();
  const marketInsights = DemandForecaster.getMarketInsights();

  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main">
        <div class="topbar">
          <div class="topbar-left">
            <div>
              <div class="topbar-title">${i18n.t('admin.dashboardTitle') || 'Platform Admin 🔧'}</div>
              <div class="topbar-breadcrumb"><span>${i18n.t('admin.role') || 'Admin'}</span> <span>›</span> <span>${i18n.t('admin.navAnalytics') || 'Analytics'}</span></div>
            </div>
          </div>
          <div class="topbar-right">
            <button class="btn btn-secondary btn-sm" id="reset-btn" title="Reset all data">${i18n.t('admin.resetDemoBtn') || '🗑️ Reset Demo'}</button>
            <button class="btn-icon notification-btn">🔔<span class="notification-dot"></span></button>
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>${i18n.t('common.logout') || 'Logout'}</span></button>
          </div>
        </div>

        <div class="page-content">
          <!-- Platform Stats -->
          <div class="dashboard-stats stagger-children">
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-green-dim); color: var(--accent-green);">⛓️</div>
              <div class="stat-card-value">${blockCount}</div>
              <div class="stat-card-label">${i18n.t('admin.statBlocks') || 'Blockchain Blocks'}</div>
              <div class="stat-card-change positive">${i18n.t('admin.chainIntact') || 'Chain intact ✓'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-cyan-dim); color: var(--accent-cyan);">💰</div>
              <div class="stat-card-value">${formatCurrency(totalRevenue)}</div>
              <div class="stat-card-label">${i18n.t('admin.statVolume') || 'Total Platform Volume'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-amber-dim); color: var(--accent-amber);">👥</div>
              <div class="stat-card-value">${userCount}</div>
              <div class="stat-card-label">${i18n.t('admin.statUsers') || 'Registered Users'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-red-dim); color: var(--accent-red);">🚨</div>
              <div class="stat-card-value">${fraudAlerts.filter(a => a.riskScore >= 40).length}</div>
              <div class="stat-card-label">${i18n.t('admin.statFraud') || 'Fraud Alerts'}</div>
              <div class="stat-card-change negative">${i18n.t('admin.requiresReview') || 'Requires review'}</div>
            </div>
          </div>

          <!-- Charts -->
          <div class="charts-grid">
            <div class="chart-card">
              <div class="chart-card-header">
                <div class="chart-card-title">${i18n.t('admin.txTimeline') || '📊 Transaction Timeline'}</div>
              </div>
              <div class="chart-wrapper">
                <canvas id="admin-tx-chart"></canvas>
              </div>
            </div>
            <div class="chart-card">
              <div class="chart-card-header">
                <div class="chart-card-title">${i18n.t('admin.userDistribution') || '👥 User Distribution'}</div>
              </div>
              <div class="chart-wrapper">
                <canvas id="admin-users-chart"></canvas>
              </div>
            </div>
          </div>

          <div class="charts-grid equal">
            <!-- Fraud Alerts -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">${i18n.t('admin.fraudAlertsCard') || '🚨 AI Fraud Detection Alerts'}</div>
                <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/admin/fraud'">${i18n.t('common.viewAll') || 'View All →'}</button>
              </div>
              <div class="tx-feed">
                ${fraudAlerts.slice(0, 5).map(alert => `
                  <div class="tx-item" style="border-left: 3px solid ${alert.riskLevel === 'critical' ? 'var(--accent-red)' : alert.riskLevel === 'high' ? 'var(--accent-amber)' : 'var(--accent-cyan)'};">
                    <div class="tx-icon" style="background: ${alert.riskLevel === 'critical' ? 'var(--accent-red-dim)' : 'var(--accent-amber-dim)'}; color: ${alert.riskLevel === 'critical' ? 'var(--accent-red)' : 'var(--accent-amber)'};">
                      ${alert.riskLevel === 'critical' ? '🚨' : '⚠️'}
                    </div>
                    <div class="tx-info">
                      <div class="tx-title">${localizeCropName(alert.transaction.productName)}</div>
                      <div class="tx-meta">${alert.flags[0]?.message || 'Anomaly detected'}</div>
                    </div>
                    <div style="text-align: right;">
                      <span class="badge ${alert.riskLevel === 'critical' ? 'badge-danger' : alert.riskLevel === 'high' ? 'badge-warning' : 'badge-info'}">
                        ${i18n.t('admin.riskScoreLabel', { score: alert.riskScore }) || `Risk: ${alert.riskScore}%`}
                      </span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Demand Forecast -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">${i18n.t('admin.demandForecastCard') || '📈 AI Demand Forecast'}</div>
                <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/admin/forecast'">${i18n.t('common.details') || 'Details →'}</button>
              </div>
              <div class="tx-feed">
                ${marketInsights.map(insight => `
                  <div class="tx-item">
                    <div class="tx-icon" style="background: var(--accent-green-dim); color: var(--accent-green);">
                      ${insight.trend === 'increasing' ? '📈' : insight.trend === 'decreasing' ? '📉' : '📊'}
                    </div>
                    <div class="tx-info">
                      <div class="tx-title">${localizeCropName(insight.crop)}</div>
                      <div class="tx-meta">${i18n.t('admin.currentForecast', { current: formatNumber(insight.currentDemand), forecast: formatNumber(insight.forecastDemand) }) || `Current: ${formatNumber(insight.currentDemand)} · Forecast: ${formatNumber(insight.forecastDemand)}`}</div>
                    </div>
                    <span class="badge ${insight.trend === 'increasing' ? 'badge-success' : insight.trend === 'decreasing' ? 'badge-danger' : 'badge-info'}">
                      ${insight.trend === 'increasing' ? '↑' : insight.trend === 'decreasing' ? '↓' : '→'} ${insight.trendPercentage}%
                    </span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Blockchain Explorer Preview -->
          <div class="card" style="margin-top: 20px;">
            <div class="card-header">
              <div class="card-title">${i18n.t('admin.recentBlocksCard') || '⛓️ Recent Blockchain Blocks'}</div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="badge badge-success">${i18n.t('admin.chainValid') || 'Chain Valid ✓'}</span>
                <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/admin/explorer'">${i18n.t('admin.fullExplorerBtn') || 'Full Explorer →'}</button>
              </div>
            </div>
            <div class="explorer-chain">
              ${blockchain.chain.slice(-5).reverse().map((block, i) => `
                <div class="block">
                  <div class="block-header">
                    <span class="block-index">${block.index === 0 ? (i18n.t('admin.genesisBlock') || '🏁 Genesis Block') : (i18n.t('trace.blockNumber', { index: block.index }) || `Block #${block.index}`)}</span>
                    <span class="block-time">${formatDateTime(block.timestamp)}</span>
                  </div>
                  <div style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 4px;">
                    ${block.data?.type?.replace(/_/g, ' ') || 'Genesis'} ${block.data?.productName ? '— ' + localizeCropName(block.data.productName) : ''}
                  </div>
                  <div class="block-hash">
                    <span class="block-hash-label">Hash: </span>${truncateHash(block.hash, 16)}
                  </div>
                  <div class="block-hash" style="margin-top: 4px;">
                    <span class="block-hash-label">Prev: </span>${truncateHash(block.previousHash, 16)}
                  </div>
                </div>
                ${i < 4 ? '<div class="chain-connector"><div class="chain-connector-line"></div></div>' : ''}
              `).join('')}
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  // Reset button
  container.querySelector('#reset-btn')?.addEventListener('click', () => {
    if (confirm(i18n.t('admin.resetConfirm') || 'Reset all demo data? This will clear the blockchain and all stored data.')) {
      store.reset();
      blockchain.reset();
      localStorage.clear();
      window.location.hash = '/';
      window.location.reload();
    }
  });

  setTimeout(() => {
    const now = Date.now();
    const dayLabels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
    const txPerDay = dayLabels.map((_, i) => {
      const dayStart = now - (7 - i) * 86400000;
      const dayEnd = dayStart + 86400000;
      return allTx.filter(tx => tx.blockTimestamp >= dayStart && tx.blockTimestamp < dayEnd).length;
    });
    const volumePerDay = dayLabels.map((_, i) => {
      const dayStart = now - (7 - i) * 86400000;
      const dayEnd = dayStart + 86400000;
      return Math.round(
        payments.filter(p => p.processedAt >= dayStart && p.processedAt < dayEnd)
          .reduce((s, p) => s + (p.totalAmount || 0), 0) / 1000
      );
    });

    const hasTxData = txPerDay.some(v => v > 0);
    createLineChart('admin-tx-chart', {
      labels: dayLabels,
      datasets: [
        {
          label: i18n.t('admin.transactions') || 'Transactions',
          data: hasTxData ? txPerDay : [allTx.length, 0, 0, 0, 0, 0, 0],
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
        },
        {
          label: i18n.t('admin.volumeK') || 'Volume (₹K)',
          data: hasTxData ? volumePerDay : [Math.round(totalRevenue / 1000), 0, 0, 0, 0, 0, 0],
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
        },
      ],
    });

    const userList = Object.values(users);
    const dynamicRoleCounts = {
      [i18n.t('roles.farmers') || 'Farmers']: userList.filter(u => u.role === 'farmer').length,
      [i18n.t('roles.intermediaries') || 'Intermediaries']: userList.filter(u => u.role === 'intermediary').length,
      [i18n.t('roles.retailers') || 'Retailers']: userList.filter(u => u.role === 'retailer').length,
      [i18n.t('roles.consumers') || 'Consumers']: userList.filter(u => u.role === 'consumer').length,
      [i18n.t('roles.admins') || 'Admins']: userList.filter(u => u.role === 'admin').length,
    };
    createDoughnutChart('admin-users-chart', {
      labels: Object.keys(dynamicRoleCounts),
      values: Object.values(dynamicRoleCounts),
      colors: [
        'rgba(34, 197, 94, 0.85)',
        'rgba(245, 158, 11, 0.85)',
        'rgba(59, 130, 246, 0.85)',
        'rgba(168, 85, 247, 0.85)',
        'rgba(239, 68, 68, 0.85)',
      ],
    });
  }, 100);
}
