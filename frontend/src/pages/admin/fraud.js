// ============================================
// FarmChain AI — Admin Fraud Alerts Page
// + Sybil QR Attack Simulation
// Fully Localized (en, hi, ta, te)
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { FraudDetector } from '../../ai/fraud-detector.js';
import { GeoVelocityChecker } from '../../ai/geo-velocity.js';
import { formatNumber, timeAgo, showToast, localizeCropName } from '../../utils/helpers.js';
import { i18n } from '../../i18n/index.js';

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
              <div class="topbar-title">${i18n.t('admin.fraudTitle') || 'Fraud Detection 🚨'}</div>
              <div class="topbar-breadcrumb"><span>${i18n.t('admin.role') || 'Admin'}</span> <span>›</span> <span>${i18n.t('admin.fraudAlerts') || 'Fraud Alerts'}</span></div>
            </div>
          </div>
          <div class="topbar-right">
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>${i18n.t('common.logout') || 'Logout'}</span></button>
          </div>
        </div>

        <div class="page-content">
          <div class="dashboard-stats stagger-children">
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-red-dim); color: var(--accent-red);">🚨</div>
              <div class="stat-card-value">${alerts.filter(a => a.riskLevel === 'critical').length}</div>
              <div class="stat-card-label">${i18n.t('admin.criticalAlerts') || 'Critical Alerts'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-amber-dim); color: var(--accent-amber);">⚠️</div>
              <div class="stat-card-value">${alerts.filter(a => a.riskLevel === 'high').length}</div>
              <div class="stat-card-label">${i18n.t('admin.highRisk') || 'High Risk'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-cyan-dim); color: var(--accent-cyan);">ℹ️</div>
              <div class="stat-card-value">${alerts.filter(a => a.riskLevel === 'medium').length}</div>
              <div class="stat-card-label">${i18n.t('admin.mediumRisk') || 'Medium Risk'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-green-dim); color: var(--accent-green);">✅</div>
              <div class="stat-card-value">${alerts.filter(a => a.riskLevel === 'low').length}</div>
              <div class="stat-card-label">${i18n.t('admin.lowRisk') || 'Low Risk'}</div>
            </div>
          </div>

          <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <div class="card-title">${i18n.t('admin.aiAnomaliesTitle') || '🤖 AI-Detected Anomalies'}</div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="btn btn-primary btn-sm" id="trigger-sybil-demo" style="background: var(--accent-amber); border-color: var(--accent-amber); display: flex; align-items: center; gap: 6px; font-size: 0.75rem;">
                  ${i18n.t('admin.simulateSybilBtn') || '🧪 Simulate Sybil QR Attack (Cloned Labels)'}
                </button>
                <button class="btn btn-primary btn-sm" id="trigger-live-fraud-demo" style="background: var(--accent-red); border-color: var(--accent-red); display: flex; align-items: center; gap: 6px; font-size: 0.75rem;">
                  ${i18n.t('admin.triggerLiveFraudBtn') || '🧪 Trigger Live Fraud Spike (+140% Markup)'}
                </button>
              </div>
            </div>

            <!-- Sybil Attack Result Panel (hidden initially) -->
            <div id="sybil-attack-panel" style="display: none;"></div>

            <div id="fraud-alerts-container" style="display: flex; flex-direction: column; gap: 16px; margin-top: 12px;">
              ${alerts.map(alert => `
                <div class="ai-insight-card" style="background: ${alert.riskLevel === 'critical' ? 'var(--accent-red-dim)' : alert.riskLevel === 'high' ? 'var(--accent-amber-dim)' : 'var(--accent-cyan-dim)'}; border-color: ${alert.riskLevel === 'critical' ? 'rgba(239,68,68,0.3)' : alert.riskLevel === 'high' ? 'rgba(245,158,11,0.3)' : 'rgba(6,182,212,0.3)'};">
                  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <div>
                      <div class="ai-insight-title">
                        ${alert.riskLevel === 'critical' ? '🚨' : '⚠️'} ${localizeCropName(alert.transaction.productName)}
                      </div>
                      <div style="font-size: 0.8rem; color: var(--text-muted);">
                        ${i18n.t('common.quantity') || 'Qty'}: ${formatNumber(alert.transaction.quantity)} ${alert.transaction.unit || 'kg'} · ${i18n.t('common.origin') || 'Origin'}: ${alert.transaction.origin || 'Nashik'}
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

  // Sybil QR Attack Simulation
  container.querySelector('#trigger-sybil-demo')?.addEventListener('click', () => {
    const products = store.get('products') || [];
    const targetProduct = products[0];
    const batchId = targetProduct?.productId || `SYBIL-DEMO-${Date.now()}`;
    const batchName = targetProduct?.name ? localizeCropName(targetProduct.name) : 'Organic Rice Batch';

    const attackResult = GeoVelocityChecker.simulateSybilAttack(batchId);

    const sybilPanel = container.querySelector('#sybil-attack-panel');
    if (sybilPanel) {
      sybilPanel.style.display = 'block';
      sybilPanel.innerHTML = `
        <div class="animate-fade-in" style="margin: 16px 0; padding: 16px; background: rgba(239, 68, 68, 0.06); border: 2px solid var(--accent-red); border-radius: var(--radius-lg); box-shadow: 0 0 30px rgba(239, 68, 68, 0.15);">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
            <div>
              <div style="font-weight: 800; font-size: 1rem; color: var(--accent-red); display: flex; align-items: center; gap: 8px;">
                ${i18n.t('admin.sybilDetectedTitle') || '🚨 SYBIL QR ATTACK DETECTED'}
                <span class="badge badge-danger" style="animation: pulse-glow 1.5s infinite;">${i18n.t('admin.live') || 'LIVE'}</span>
              </div>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                ${i18n.t('admin.batchLabel') || 'Batch'}: ${batchName} (${batchId.slice(0, 20)}...)
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-family: var(--font-display); font-size: 2rem; font-weight: 900; color: var(--accent-red);">
                ${attackResult.maxVelocity.toLocaleString()} km/h
              </div>
              <div style="font-size: 0.7rem; color: var(--text-muted);">${i18n.t('admin.maxVelocity') || 'Max Velocity'}</div>
            </div>
          </div>

          <!-- City Scan Map Visualization -->
          <div style="padding: 12px; background: rgba(0,0,0,0.3); border-radius: var(--radius-md); margin-bottom: 12px;">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 10px; text-transform: uppercase;">
              ${i18n.t('admin.simultaneousLocations') || '📍 Simultaneous Scan Locations (All within 2 minutes)'}
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${attackResult.attackCities.map((city, i) => `
                <div style="flex: 1; min-width: 100px; padding: 8px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: var(--radius-sm); text-align: center; animation: fade-in 0.3s ease ${i * 0.15}s both;">
                  <div style="font-size: 1.2rem;">📍</div>
                  <div style="font-weight: 700; font-size: 0.82rem; color: var(--accent-red);">${city.city}</div>
                  <div style="font-size: 0.7rem; color: var(--text-muted);">${city.timeFormatted}</div>
                  <div style="font-size: 0.65rem; color: var(--text-muted);">${city.lat.toFixed(2)}°N, ${city.lon.toFixed(2)}°E</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Escrow Freeze Notice -->
          <div style="padding: 10px 14px; background: rgba(239, 68, 68, 0.12); border: 1px solid var(--accent-red); border-radius: var(--radius-sm); display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.5rem;">🔒</span>
            <div>
              <div style="font-weight: 700; font-size: 0.85rem; color: var(--accent-red);">${i18n.t('admin.escrowFrozenTitle') || 'SMART CONTRACT ACTION: Escrow Funds FROZEN'}</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary);">
                ${i18n.t('admin.escrowFrozenNotice', { count: attackResult.attackCities.length, id: batchId.slice(0, 16) }) || `MarketplaceEscrow.sol has automatically frozen all escrow funds for batch ${batchId.slice(0, 16)}... pending manual review.`}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    showToast(i18n.t('admin.sybilSimulatedToast') || `🚨 Sybil Attack Simulated: ${attackResult.attackCities.length} cloned scans detected across India. Escrow FROZEN.`, 'error');
  });

  // Live Fraud Demo Button
  container.querySelector('#trigger-live-fraud-demo')?.addEventListener('click', () => {
    const anomalousTx = {
      productName: i18n.t('admin.predatoryBatchName') || '🚨 Predatory Aggregator Rice Batch',
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
                ${i18n.t('admin.liveAnomalyDetected') || '🚨 LIVE ANOMALY DETECTED:'} ${newAlert.transaction.productName}
              </div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">
                ${i18n.t('common.quantity') || 'Qty'}: ${formatNumber(newAlert.transaction.quantity)} ${newAlert.transaction.unit} ${i18n.t('admin.flaggedJustNow') || '· Flagged just now'}
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-family: var(--font-display); font-size: 2rem; font-weight: 900; color: var(--accent-red);">${newAlert.riskScore}%</div>
              <span class="badge badge-danger">${i18n.t('admin.criticalSpike') || 'CRITICAL SPIKE'}</span>
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
      showToast(i18n.t('admin.liveAnomalyToast') || '🚨 Live Anomaly Flagged! +142% Price Markup & Rapid Transfers Detected', 'error');
    }
  });
}
