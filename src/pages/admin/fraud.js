// ============================================
// FarmChain AI — Admin Fraud Alerts Page
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { FraudDetector } from '../../ai/fraud-detector.js';
import { formatNumber, timeAgo } from '../../utils/helpers.js';

export function renderAdminFraud(container) {
  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

  const alerts = FraudDetector.generateDemoAlerts();

  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main">
        <div class="topbar">
          <div class="topbar-left">
            <div>
              <div class="topbar-title">Fraud Detection 🚨</div>
              <div class="topbar-breadcrumb"><span>Admin</span> <span>›</span> <span>Fraud Alerts</span></div>
            </div>
          <div class="topbar-right">
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>Logout</span></button>
          </div>
        </div>

        <div class="page-content">
          <div class="dashboard-stats stagger-children">
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-red-dim); color: var(--accent-red);">🚨</div>
              <div class="stat-card-value">${alerts.filter(a => a.riskLevel === 'critical').length}</div>
              <div class="stat-card-label">Critical Alerts</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-amber-dim); color: var(--accent-amber);">⚠️</div>
              <div class="stat-card-value">${alerts.filter(a => a.riskLevel === 'high').length}</div>
              <div class="stat-card-label">High Risk</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-cyan-dim); color: var(--accent-cyan);">ℹ️</div>
              <div class="stat-card-value">${alerts.filter(a => a.riskLevel === 'medium').length}</div>
              <div class="stat-card-label">Medium Risk</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-green-dim); color: var(--accent-green);">✅</div>
              <div class="stat-card-value">${alerts.filter(a => a.riskLevel === 'low').length}</div>
              <div class="stat-card-label">Low Risk</div>
            </div>
          </div>

          <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <div class="card-title">🤖 AI-Detected Anomalies</div>
              <button class="btn btn-primary btn-sm" id="trigger-live-fraud-demo" style="background: var(--accent-red); border-color: var(--accent-red); display: flex; align-items: center; gap: 6px;">
                🧪 Trigger Live Fraud Spike (+140% Markup)
              </button>
            </div>
            <div id="fraud-alerts-container" style="display: flex; flex-direction: column; gap: 16px; margin-top: 12px;">
              ${alerts.map(alert => `
                <div class="ai-insight-card" style="background: ${alert.riskLevel === 'critical' ? 'var(--accent-red-dim)' : alert.riskLevel === 'high' ? 'var(--accent-amber-dim)' : 'var(--accent-cyan-dim)'}; border-color: ${alert.riskLevel === 'critical' ? 'rgba(239,68,68,0.3)' : alert.riskLevel === 'high' ? 'rgba(245,158,11,0.3)' : 'rgba(6,182,212,0.3)'};">
                  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <div>
                      <div class="ai-insight-title">
                        ${alert.riskLevel === 'critical' ? '🚨' : '⚠️'} ${alert.transaction.productName}
                      </div>
                      <div style="font-size: 0.8rem; color: var(--text-muted);">
                        Qty: ${formatNumber(alert.transaction.quantity)} ${alert.transaction.unit || 'kg'} · Origin: ${alert.transaction.origin || 'Nashik'}
                      </div>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; color: ${alert.riskLevel === 'critical' ? 'var(--accent-red)' : 'var(--accent-amber)'};">${alert.riskScore}%</div>
                      <span class="badge ${alert.riskLevel === 'critical' ? 'badge-danger' : alert.riskLevel === 'high' ? 'badge-warning' : 'badge-info'}">${alert.riskLevel.toUpperCase()}</span>
                    </div>
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 6px;">
                    ${alert.flags.map(flag => `
                      <div style="display: flex; align-items: center; gap: 8px; font-size: 0.82rem;">
                        <span class="badge ${flag.severity === 'high' ? 'badge-danger' : flag.severity === 'medium' ? 'badge-warning' : 'badge-info'}">${flag.severity}</span>
                        <span style="color: var(--text-secondary);">${flag.message}</span>
                      </div>
                    `).join('')}
                  </div>
                  <div style="margin-top: 10px; font-size: 0.82rem; font-weight: 500;">
                    ${alert.recommendation}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  // Live Fraud Demo Button
  container.querySelector('#trigger-live-fraud-demo')?.addEventListener('click', () => {
    const anomalousTx = {
      productName: '🚨 Predatory Aggregator Rice Batch',
      quantity: 15000,
      unit: 'kg',
      priceDeviation: 142,
      accountAge: 1,
      transferCount: 6,
      origin: 'Unverified Spot Aggregator',
    };

    const analysis = FraudDetector.analyzeTransaction(anomalousTx);
    const newAlert = {
      ...analysis,
      transaction: anomalousTx,
      alertId: `ALT-${Date.now()}`,
      timestamp: Date.now(),
    };

    const containerEl = container.querySelector('#fraud-alerts-container');
    if (containerEl) {
      const alertHtml = `
        <div class="ai-insight-card animate-fade-in" style="background: var(--accent-red-dim); border-color: var(--accent-red); border-width: 2px; box-shadow: 0 0 20px rgba(239,68,68,0.25);">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
            <div>
              <div class="ai-insight-title" style="color: var(--accent-red);">
                🚨 LIVE ANOMALY DETECTED: ${newAlert.transaction.productName}
              </div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">
                Qty: ${formatNumber(newAlert.transaction.quantity)} ${newAlert.transaction.unit} · Flagged just now
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-family: var(--font-display); font-size: 2rem; font-weight: 900; color: var(--accent-red);">${newAlert.riskScore}%</div>
              <span class="badge badge-danger">CRITICAL SPIKE</span>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${newAlert.flags.map(flag => `
              <div style="display: flex; align-items: center; gap: 8px; font-size: 0.82rem;">
                <span class="badge badge-danger">${flag.severity}</span>
                <span style="color: var(--text-secondary);">${flag.message}</span>
              </div>
            `).join('')}
          </div>
          <div style="margin-top: 10px; font-size: 0.85rem; font-weight: 700; color: var(--accent-red);">
            🛑 ${newAlert.recommendation}
          </div>
        </div>
      `;
      containerEl.insertAdjacentHTML('afterbegin', alertHtml);
      import('../../utils/helpers.js').then(({ showToast }) => {
        showToast('🚨 Live Anomaly Flagged! +142% Price Markup & Rapid Transfers Detected', 'error');
      });
    }
  });
}
