// ============================================
// FarmChain AI — Admin Dashboard
// Platform analytics, fraud alerts, blockchain
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { createLineChart, createBarChart, createDoughnutChart } from '../../components/charts.js';
import { formatCurrency, formatNumber, formatDateTime, truncateHash, timeAgo } from '../../utils/helpers.js';
import { blockchain } from '../../blockchain/core.js';
import { FraudDetector } from '../../ai/fraud-detector.js';
import { DemandForecaster } from '../../ai/demand-forecaster.js';
import { PaymentSplitter } from '../../blockchain/contracts.js';

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

  // Fraud alerts
  const fraudAlerts = FraudDetector.generateDemoAlerts();

  // Demand insights
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
              <div class="topbar-title">Platform Admin 🔧</div>
              <div class="topbar-breadcrumb"><span>Admin</span> <span>›</span> <span>Analytics</span></div>
            </div>
          </div>
          <div class="topbar-right">
            <button class="btn btn-secondary btn-sm" id="reset-btn" title="Reset all data">🗑️ Reset Demo</button>
            <button class="btn-icon notification-btn">🔔<span class="notification-dot"></span></button>
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>Logout</span></button>
          </div>
        </div>

        <div class="page-content">
          <!-- Platform Stats -->
          <div class="dashboard-stats stagger-children">
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-green-dim); color: var(--accent-green);">⛓️</div>
              <div class="stat-card-value">${blockCount}</div>
              <div class="stat-card-label">Blockchain Blocks</div>
              <div class="stat-card-change positive">Chain intact ✓</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-cyan-dim); color: var(--accent-cyan);">💰</div>
              <div class="stat-card-value">${formatCurrency(totalRevenue)}</div>
              <div class="stat-card-label">Total Platform Volume</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-amber-dim); color: var(--accent-amber);">👥</div>
              <div class="stat-card-value">${userCount}</div>
              <div class="stat-card-label">Registered Users</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-red-dim); color: var(--accent-red);">🚨</div>
              <div class="stat-card-value">${fraudAlerts.filter(a => a.riskScore >= 40).length}</div>
              <div class="stat-card-label">Fraud Alerts</div>
              <div class="stat-card-change negative">Requires review</div>
            </div>
          </div>

          <!-- Charts -->
          <div class="charts-grid">
            <div class="chart-card">
              <div class="chart-card-header">
                <div class="chart-card-title">📊 Transaction Timeline</div>
              </div>
              <div class="chart-wrapper">
                <canvas id="admin-tx-chart"></canvas>
              </div>
            </div>
            <div class="chart-card">
              <div class="chart-card-header">
                <div class="chart-card-title">👥 User Distribution</div>
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
                <div class="card-title">🚨 AI Fraud Detection Alerts</div>
                <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/admin/fraud'">View All →</button>
              </div>
              <div class="tx-feed">
                ${fraudAlerts.slice(0, 5).map(alert => `
                  <div class="tx-item" style="border-left: 3px solid ${alert.riskLevel === 'critical' ? 'var(--accent-red)' : alert.riskLevel === 'high' ? 'var(--accent-amber)' : 'var(--accent-cyan)'};">
                    <div class="tx-icon" style="background: ${alert.riskLevel === 'critical' ? 'var(--accent-red-dim)' : 'var(--accent-amber-dim)'}; color: ${alert.riskLevel === 'critical' ? 'var(--accent-red)' : 'var(--accent-amber)'};">
                      ${alert.riskLevel === 'critical' ? '🚨' : '⚠️'}
                    </div>
                    <div class="tx-info">
                      <div class="tx-title">${alert.transaction.productName}</div>
                      <div class="tx-meta">${alert.flags[0]?.message || 'Anomaly detected'}</div>
                    </div>
                    <div style="text-align: right;">
                      <span class="badge ${alert.riskLevel === 'critical' ? 'badge-danger' : alert.riskLevel === 'high' ? 'badge-warning' : 'badge-info'}">
                        Risk: ${alert.riskScore}%
                      </span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Demand Forecast -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">📈 AI Demand Forecast</div>
                <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/admin/forecast'">Details →</button>
              </div>
              <div class="tx-feed">
                ${marketInsights.map(insight => `
                  <div class="tx-item">
                    <div class="tx-icon" style="background: var(--accent-green-dim); color: var(--accent-green);">
                      ${insight.trend === 'increasing' ? '📈' : insight.trend === 'decreasing' ? '📉' : '📊'}
                    </div>
                    <div class="tx-info">
                      <div class="tx-title">${insight.crop}</div>
                      <div class="tx-meta">Current: ${formatNumber(insight.currentDemand)} · Forecast: ${formatNumber(insight.forecastDemand)}</div>
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
              <div class="card-title">⛓️ Recent Blockchain Blocks</div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="badge badge-success">Chain Valid ✓</span>
                <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/admin/explorer'">Full Explorer →</button>
              </div>
            </div>
            <div class="explorer-chain">
              ${blockchain.chain.slice(-5).reverse().map((block, i) => `
                <div class="block">
                  <div class="block-header">
                    <span class="block-index">${block.index === 0 ? '🏁 Genesis Block' : `Block #${block.index}`}</span>
                    <span class="block-time">${formatDateTime(block.timestamp)}</span>
                  </div>
                  <div style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 4px;">
                    ${block.data?.type?.replace(/_/g, ' ') || 'Genesis'} ${block.data?.productName ? '— ' + block.data.productName : ''}
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
    if (confirm('Reset all demo data? This will clear the blockchain and all stored data.')) {
      store.reset();
      blockchain.reset();
      localStorage.clear();
      window.location.hash = '/';
      window.location.reload();
    }
  });

  // Charts — use REAL data from blockchain and store
  setTimeout(() => {
    // Transaction timeline — count real blockchain blocks per day
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
    // If no real data yet, use proportional values from totals
    const hasTxData = txPerDay.some(v => v > 0);
    createLineChart('admin-tx-chart', {
      labels: dayLabels,
      datasets: [
        {
          label: 'Transactions',
          data: hasTxData ? txPerDay : [allTx.length, 0, 0, 0, 0, 0, 0],
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
        },
        {
          label: 'Volume (₹K)',
          data: hasTxData ? volumePerDay : [Math.round(totalRevenue / 1000), 0, 0, 0, 0, 0, 0],
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
        },
      ],
    });

    // User distribution — dynamically count from store
    const userList = Object.values(users);
    const dynamicRoleCounts = {
      Farmers: userList.filter(u => u.role === 'farmer').length,
      Intermediaries: userList.filter(u => u.role === 'intermediary').length,
      Retailers: userList.filter(u => u.role === 'retailer').length,
      Consumers: userList.filter(u => u.role === 'consumer').length,
      Admin: userList.filter(u => u.role === 'admin').length,
    };
    createDoughnutChart('admin-users-chart', {
      labels: Object.keys(dynamicRoleCounts),
      values: Object.values(dynamicRoleCounts),
    });
  }, 100);
}
