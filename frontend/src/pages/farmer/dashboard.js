// ============================================
// FarmChain AI — Farmer Dashboard
// Overview with stats, charts, recent activity
// Fully Localized & Zero Blockchain Jargon
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { createLineChart, createDoughnutChart } from '../../components/charts.js';
import { formatCurrency, formatNumber, timeAgo, getStatusBadge, showToast, localizeCropName, localizeCategory, localizeUnit } from '../../utils/helpers.js';
import { PaymentSplitter } from '../../blockchain/contracts.js';
import { FairPricePredictor } from '../../ai/price-predictor.js';
import { blockchain } from '../../blockchain/core.js';
import { router } from '../../utils/router.js';
import { fetchMandiRates } from '../../utils/api.js';
import { i18n } from '../../i18n/index.js';

export function renderFarmerDashboard(container) {
  const user = store.get('currentUser') || { name: 'Farmer', id: 'farmer-001' };
  const products = (store.get('products') || []).filter(p => p.farmerId === user.id);
  const orders = (store.get('orders') || []).filter(o => o.sellerId === user.id);
  const revenue = PaymentSplitter.getTotalRevenue(user.id);
  const certs = (store.get('certificates') || []).filter(c => products.some(p => p.productId === c.productId));
  const txs = blockchain.getTransactionsByEntity(user.id);

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'accepted').length;
  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  const totalQuantity = products.reduce((s, p) => s + (p.quantity || 0), 0);

  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

  const defaultUnit = localizeUnit(products[0]?.unit || 'kg');

  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main">
        <div class="topbar">
          <div class="topbar-left">
            <div>
              <div class="topbar-title">${i18n.t('farmer.dashboard.greeting', { name: user.name.split(' ')[0] })}! 🌾</div>
              <div class="topbar-breadcrumb">
                <span>${i18n.t('roles.farmer')}</span> <span>›</span> <span>${i18n.t('farmer.dashboard.title')}</span>
              </div>
            </div>
          </div>
          <div class="topbar-right" style="display: flex; align-items: center; gap: 10px;">
            ${i18n.renderLanguageSelector('farmer-dashboard-lang-select')}
            <div class="topbar-search">
              <span class="topbar-search-icon">🔍</span>
              <input type="text" placeholder="${i18n.t('farmer.dashboard.searchPlaceholder')}" id="farmer-search-input" />
            </div>
            <button class="btn-icon notification-btn" id="notification-btn">🔔${pendingOrders > 0 ? '<span class="notification-dot"></span>' : ''}</button>
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>${i18n.t('common.logout')}</span></button>
          </div>
        </div>

        <div class="page-content">
          <!-- Stats -->
          <div class="dashboard-stats stagger-children">
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-green-dim); color: var(--accent-green);">📦</div>
              <div class="stat-card-value">${formatNumber(products.length)}</div>
              <div class="stat-card-label">${i18n.t('farmer.dashboard.statHarvests')}</div>
              <div class="stat-card-change positive">↑ ${formatNumber(totalQuantity)} ${defaultUnit} ${i18n.t('farmer.dashboard.totalUnit')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-cyan-dim); color: var(--accent-cyan);">💰</div>
              <div class="stat-card-value">${formatCurrency(revenue)}</div>
              <div class="stat-card-label">${i18n.t('farmer.dashboard.statRevenue')}</div>
              <div class="stat-card-change positive">↑ ${i18n.t('farmer.dashboard.statGuaranteedPayout')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-amber-dim); color: var(--accent-amber);">📋</div>
              <div class="stat-card-value">${formatNumber(orders.length)}</div>
              <div class="stat-card-label">${i18n.t('farmer.dashboard.statOrders')}</div>
              <div class="stat-card-change ${pendingOrders > 0 ? 'negative' : 'positive'}">${formatNumber(pendingOrders)} ${i18n.t('status.pending')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-purple-dim); color: var(--accent-purple);">✅</div>
              <div class="stat-card-value">${formatNumber(certs.length || products.length)}</div>
              <div class="stat-card-label">${i18n.t('farmer.dashboard.statVerifiedBatches')}</div>
              <div class="stat-card-change positive">${i18n.t('farmer.dashboard.statVerifiedBadge')}</div>
            </div>
          </div>

          <!-- Charts Row -->
          <div class="charts-grid">
            <div class="chart-card">
              <div class="chart-card-header">
                <div class="chart-card-title">📈 ${i18n.t('farmer.dashboard.priceTrendsTitle')}</div>
                <div class="tabs">
                  <button class="tab active" data-crop="Rice">${i18n.t('crops.rice')}</button>
                  <button class="tab" data-crop="Onion">${i18n.t('crops.onion')}</button>
                  <button class="tab" data-crop="Tomato">${i18n.t('crops.tomato')}</button>
                </div>
              </div>
              <div class="chart-wrapper">
                <canvas id="farmer-price-chart"></canvas>
              </div>
            </div>

            <div class="chart-card">
              <div class="chart-card-header">
                <div class="chart-card-title">🥧 ${i18n.t('farmer.dashboard.categoriesTitle')}</div>
              </div>
              <div class="chart-wrapper">
                <canvas id="farmer-category-chart"></canvas>
              </div>
            </div>
          </div>

          <!-- Farmer Hero Moment: Fair Price Suggestion with Transparent Reasoning (No Blockchain Jargon) -->
          <div class="card ledger-card" style="margin-bottom: 24px; border-left: 4px solid var(--role-farmer);">
            <div class="card-header" style="border-bottom: 1px solid var(--border-rule);">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="stamp-seal" style="border-color: var(--role-farmer); color: var(--role-farmer); background: var(--role-farmer-bg);">
                    ${i18n.t('farmer.dashboard.aiPriceEngine')}
                  </span>
                  <span class="stamp-seal stamp-verified">
                    ${i18n.t('farmer.dashboard.mspFloorProtected')}
                  </span>
                </div>
                <div class="card-title" style="margin-top: 8px; font-size: 1.15rem;">
                  ${i18n.t('farmer.dashboard.fairPriceTitle')}
                </div>
              </div>
              <div class="stamp-round" title="${i18n.t('farmer.dashboard.aiPriceRoundTitle')}">
                AI<br/>PRICE
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: center; padding: 6px 0;">
              <div>
                <p style="font-size: var(--text-sm); color: var(--loam-light); margin-bottom: 14px;">
                  ${i18n.t('farmer.dashboard.fairPriceSub')}
                </p>

                <div class="pricing-equation" style="background: var(--parchment-card-alt); border: 1px solid var(--border-rule); border-radius: var(--radius-sm); padding: 14px 16px;">
                  <div class="equation-row">
                    <span class="equation-label">${i18n.t('landing.pricing.mspFloor')}</span>
                    <span class="equation-val">${formatCurrency(23.00)} / ${localizeUnit('kg')}</span>
                  </div>
                  <div class="equation-row">
                    <span class="equation-label">${i18n.t('farmer.dashboard.eqFreshnessBonus')}</span>
                    <span class="equation-val plus">+${formatCurrency(1.15)} / ${localizeUnit('kg')}</span>
                  </div>
                  <div class="equation-row">
                    <span class="equation-label">${i18n.t('farmer.dashboard.eqMandiDemand')}</span>
                    <span class="equation-val plus">+${formatCurrency(2.76)} / ${localizeUnit('kg')}</span>
                  </div>
                  <div class="equation-row">
                    <span class="equation-label">${i18n.t('farmer.dashboard.eqMoistureFactor')}</span>
                    <span class="equation-val plus">+${formatCurrency(1.61)} / ${localizeUnit('kg')}</span>
                  </div>
                  <div class="equation-total-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border-rule);">
                    <span class="equation-total-label" style="font-size: var(--text-sm); font-weight: 700;">${i18n.t('farmer.dashboard.eqRecommendedPrice')}</span>
                    <span class="equation-total-price" style="color: var(--role-farmer); font-size: 1.45rem;">${formatCurrency(28.52)} <span style="font-size: 0.8rem; font-family: var(--font-mono); color: var(--loam-faded);">/ ${localizeUnit('kg')}</span></span>
                  </div>
                </div>
              </div>

              <div style="background: var(--parchment-warm); padding: 18px; border-radius: var(--radius-sm); border: 1px solid var(--border-rule);">
                <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--loam-faded); text-transform: uppercase; margin-bottom: 6px;">
                  ${i18n.t('farmer.dashboard.guaranteeHeader')}
                </div>
                <div style="font-size: 0.88rem; font-weight: 600; color: var(--loam); margin-bottom: 8px;">
                  ${i18n.t('farmer.dashboard.guaranteeBadge')}
                </div>
                <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--loam-light); line-height: 1.6; margin-bottom: 14px;">
                  • ${i18n.t('farmer.dashboard.guarantee1')}<br/>
                  • ${i18n.t('farmer.dashboard.guarantee2')}<br/>
                  • ${i18n.t('farmer.dashboard.guarantee3')}<br/>
                  • ${i18n.t('farmer.dashboard.guarantee4')}: <strong style="color: var(--role-farmer);">${i18n.t('farmer.dashboard.guaranteeStatus')} ✓</strong>
                </div>
                <button class="btn btn-primary btn-sm" id="farmer-stamp-btn" style="background: var(--role-farmer); border-color: var(--role-farmer);">
                  ${i18n.t('farmer.dashboard.lockGuaranteeBtn')}
                </button>
              </div>
            </div>
          </div>

          <!-- AI Insights + Recent Activity -->
          <div class="charts-grid equal">
            <div class="card">
              <div class="card-header">
                <div class="card-title">${i18n.t('farmer.dashboard.valuationsTitle')}</div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 12px;" id="ai-insights-container">
                ${products.slice(0, 3).map(p => {
                  const prediction = FairPricePredictor.predict(p.name.split(' ').pop(), p.quantity, p.pricePerUnit);
                  return `
                    <div class="ai-insight-card" style="background: ${prediction.isFairlyPriced ? 'var(--accent-green-dim)' : 'var(--accent-amber-dim)'}; border-color: ${prediction.isFairlyPriced ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'};">
                      <div class="ai-insight-title">
                        <span>${p.emoji || '🌱'}</span> ${localizeCropName(p.name)}
                      </div>
                      <div class="ai-insight-value" style="color: ${prediction.isFairlyPriced ? 'var(--accent-green)' : 'var(--accent-amber)'};">
                        ${formatCurrency(prediction.predictedFairPrice)}<span style="font-size: 0.7rem; color: var(--text-muted);">/${localizeUnit(p.unit)}</span>
                      </div>
                      <div class="ai-insight-desc">${prediction.recommendation}</div>
                    </div>
                  `;
                }).join('') || `<div class="empty-state"><p>${i18n.t('farmer.dashboard.noValuations')}</p></div>`}
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <div class="card-title">📋 ${i18n.t('farmer.dashboard.recentActivityTitle')}</div>
              </div>
              <div class="tx-feed">
                ${txs.slice(-5).reverse().map(tx => {
                  const statusBadge = getStatusBadge(tx.status || 'completed');
                  const friendlyKey = {
                    'PRODUCT_REGISTERED': 'notifications.produceListed',
                    'LISTING_CREATED': 'farmer.dashboard.listingActive',
                    'ORDER_PLACED': 'notifications.newOrder',
                    'PAYMENT_PROCESSED': 'farmer.dashboard.paymentReceived',
                    'CERTIFICATE_ISSUED': 'farmer.dashboard.qualityVerified',
                    'TRANSFER_INITIATED': 'farmer.dashboard.logisticsDispatched',
                  }[tx.type] || 'notifications.genericUpdate';
                  
                  const icons = { 'PRODUCT_REGISTERED': '📦', 'LISTING_CREATED': '📋', 'ORDER_PLACED': '🛍️', 'PAYMENT_PROCESSED': '💰', 'CERTIFICATE_ISSUED': '✅', 'TRANSFER_INITIATED': '🔄' };
                  return `
                    <div class="tx-item">
                      <div class="tx-icon" style="background: var(--accent-green-dim); color: var(--accent-green);">${icons[tx.type] || '📝'}</div>
                      <div class="tx-info">
                        <div class="tx-title">${i18n.t(friendlyKey)}</div>
                        <div class="tx-meta">${timeAgo(tx.blockTimestamp || tx.createdAt || Date.now())}</div>
                      </div>
                      <span class="badge ${statusBadge.class}">${statusBadge.label}</span>
                    </div>
                  `;
                }).join('') || `<div class="empty-state"><p>${i18n.t('farmer.dashboard.noActivity')}</p></div>`}
              </div>
            </div>
          </div>

          <!-- Quick Actions (Zero Blockchain buttons!) -->
          <div class="card" style="margin-top: 20px;">
            <div class="card-header">
              <div class="card-title">⚡ ${i18n.t('farmer.dashboard.quickActionsTitle')}</div>
            </div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <button class="btn btn-primary btn-sm" id="dashboard-add-product-btn">➕ ${i18n.t('farmer.dashboard.actionAddProduce')}</button>
              <button class="btn btn-secondary btn-sm" id="dashboard-live-camera-btn" style="font-weight: 800; padding: 8px 16px; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px; background: #ECFDF5; border: 2px solid #16A34A; color: #15803D; cursor: pointer;">📸 ${i18n.t('farmer.dashboard.actionLiveCamera')}</button>
              <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/farmer/orders'">📋 ${i18n.t('farmer.dashboard.actionOrders')}</button>
              <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/farmer/products'">🌾 ${i18n.t('farmer.dashboard.actionBatches')}</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  // Quick Action Add Product Button
  container.querySelector('#dashboard-add-product-btn')?.addEventListener('click', async () => {
    const { FarmerProductWizard } = await import('./product-wizard.js');
    new FarmerProductWizard(container, () => renderFarmerDashboard(container)).open();
  });

  // Quick Action Live Farm Camera
  container.querySelector('#dashboard-live-camera-btn')?.addEventListener('click', async () => {
    const { LiveCamera } = await import('../../components/live-camera.js');
    const { FarmerProductWizard } = await import('./product-wizard.js');
    try {
      const result = await LiveCamera.open({ mode: 'verified', farmerLocation: user.location });
      if (result && result.imageDataUrl) {
        new FarmerProductWizard(container, () => renderFarmerDashboard(container), {
          photoData: result.imageDataUrl,
          captureProof: result.proofData,
          origin: result.proofData.location?.address,
          harvestDate: new Date(result.proofData.timestamp).toISOString().split('T')[0],
          step: 1,
        }).open();
      }
    } catch (err) {
      if (err && err.message !== 'Camera closed by user') {
        showToast(err.message || i18n.t('errors.cameraError'), 'error');
      }
    }
  });

  // Farmer stamp button handler
  const farmerStampBtn = container.querySelector('#farmer-stamp-btn');
  farmerStampBtn?.addEventListener('click', () => {
    farmerStampBtn.textContent = `${i18n.t('farmer.dashboard.priceProtectedBadge')} ✓`;
    farmerStampBtn.classList.add('is-success');
    showToast(i18n.t('farmer.dashboard.toastPriceLocked', { price: formatCurrency(28.52), unit: localizeUnit('kg') }), 'success');
    setTimeout(() => {
      farmerStampBtn.textContent = i18n.t('farmer.dashboard.lockGuaranteeBtn');
      farmerStampBtn.classList.remove('is-success');
    }, 4000);
  });

  // Helper to render price chart
  const renderPriceChartForCrop = (cropName) => {
    const priceCtx = container.querySelector('#farmer-price-chart');
    if (!priceCtx) return;
    const trend = FairPricePredictor.getPriceTrend(cropName, 6);
    const msp = cropName === 'Rice' ? 2300 : cropName === 'Onion' ? 1200 : 800;
    const unitLabel = `${formatCurrency(1).slice(0, 1)}/${localizeUnit('quintal')}`;

    createLineChart(
      'farmer-price-chart',
      {
        labels: trend.map(t => t.month),
        datasets: [
          {
            label: `${localizeCropName(cropName)} ${i18n.t('farmer.dashboard.marketPriceLabel')} (${unitLabel})`,
            data: trend.map(t => t.price),
            borderColor: '#4A7C59',
            backgroundColor: 'rgba(74, 124, 89, 0.15)',
            fill: true,
          },
          {
            label: `${localizeCropName(cropName)} ${i18n.t('farmer.dashboard.mspFloorLabel')} (${unitLabel})`,
            data: trend.map(() => msp),
            borderColor: '#B8963E',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            fill: false,
          },
        ]
      }
    );
  };

  renderPriceChartForCrop('Rice');

  // Tab switching for price trends
  container.querySelectorAll('.tab[data-crop]').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.tab[data-crop]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderPriceChartForCrop(tab.dataset.crop);
    });
  });

  // Category Doughnut Chart
  const catCanvas = container.querySelector('#farmer-category-chart');
  if (catCanvas) {
    const catCounts = {};
    products.forEach(p => {
      const locCat = localizeCategory(p.category || 'Grains');
      catCounts[locCat] = (catCounts[locCat] || 0) + 1;
    });
    if (Object.keys(catCounts).length === 0) {
      catCounts[localizeCategory('Grains')] = 1;
      catCounts[localizeCategory('Vegetables')] = 1;
    }
    createDoughnutChart(
      'farmer-category-chart',
      {
        labels: Object.keys(catCounts),
        values: Object.values(catCounts),
        colors: ['#4A7C59', '#386145', '#B8963E', '#8B5E3C', '#6B5B7B']
      }
    );
  }

  // Search input handler
  container.querySelector('#farmer-search-input')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      container.querySelectorAll('.ai-insight-card, .tx-item').forEach(el => el.style.display = '');
      return;
    }
    container.querySelectorAll('.ai-insight-card').forEach(el => {
      el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
    container.querySelectorAll('.tx-item').forEach(el => {
      el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}
