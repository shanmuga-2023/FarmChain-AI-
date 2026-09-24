// ============================================
// FarmChain AI — Retailer Dashboard
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { createBarChart, createDoughnutChart } from '../../components/charts.js';
import { formatCurrency, formatNumber, getStatusBadge, showToast, getCropEmoji, createModal, closeModal, localizeCropName, localizeUnit, localizeCategory, localizeLocation } from '../../utils/helpers.js';
import { PaymentSplitter, Marketplace } from '../../blockchain/contracts.js';
import { generateProductQR, createQRDisplay } from '../../utils/qr.js';
import { i18n } from '../../i18n/index.js';

export function renderRetailerDashboard(container) {
  const user = store.get('currentUser') || { name: 'Retailer', id: 'retailer-001' };
  const allProducts = store.get('products') || [];
  const orders = (store.get('orders') || []).filter(o => o.buyerId === user.id);
  const revenue = PaymentSplitter.getTotalRevenue(user.id);

  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main">
        <div class="topbar">
          <div class="topbar-left">
            <div>
              <div class="topbar-title">${i18n.t('retailer.dashboard.greeting', { name: user.name })} 🛒</div>
              <div class="topbar-breadcrumb"><span>${i18n.t('roles.retailer')}</span> <span>›</span> <span>${i18n.t('retailer.dashboard.title')}</span></div>
            </div>
          </div>
          <div class="topbar-right" style="display: flex; align-items: center; gap: 10px;">
            ${i18n.renderLanguageSelector('retailer-dashboard-lang-select')}
            <button class="btn-icon notification-btn">🔔<span class="notification-dot"></span></button>
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>${i18n.t('common.logout')}</span></button>
          </div>
        </div>

        <div class="page-content">
          <div class="dashboard-stats stagger-children">
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-blue-dim); color: var(--accent-blue);">🛍️</div>
              <div class="stat-card-value">${formatNumber(orders.length)}</div>
              <div class="stat-card-label">${i18n.t('retailer.dashboard.statSourced')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-green-dim); color: var(--accent-green);">💰</div>
              <div class="stat-card-value">${formatCurrency(revenue)}</div>
              <div class="stat-card-label">${i18n.t('retailer.dashboard.statRevenue')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-amber-dim); color: var(--accent-amber);">📦</div>
              <div class="stat-card-value">${formatNumber(allProducts.length)}</div>
              <div class="stat-card-label">${i18n.t('retailer.dashboard.statAvailable')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-purple-dim); color: var(--accent-purple);">⛓️</div>
              <div class="stat-card-value">100%</div>
              <div class="stat-card-label">${i18n.t('retailer.dashboard.statVerified')}</div>
            </div>
          </div>

          <!-- Retailer Hero Moment: Packaging QR Stamping Station -->
          <div class="card ledger-card" style="margin-bottom: 24px; border-left: 4px solid var(--role-retailer);">
            <div class="card-header" style="border-bottom: 1px solid var(--border-rule);">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="stamp-seal" style="border-color: var(--role-retailer); color: var(--role-retailer); background: var(--role-retailer-bg);">
                    ${i18n.t('retailer.dashboard.authStationBadge')}
                  </span>
                  <span class="stamp-seal stamp-verified">
                    ${i18n.t('retailer.dashboard.qrImpressionBadge')} ✓
                  </span>
                </div>
                <div class="card-title" style="margin-top: 8px; font-size: 1.15rem;">
                  ${i18n.t('retailer.dashboard.stationTitle')}
                </div>
              </div>
              <div class="stamp-round" style="border-color: var(--role-retailer); color: var(--role-retailer);">
                STORE<br/>SEAL
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: center; padding: 6px 0;">
              <div>
                <p style="font-size: var(--text-sm); color: var(--loam-light); margin-bottom: 14px;">
                  ${i18n.t('retailer.dashboard.stationDesc')}
                </p>

                <div style="background: var(--parchment-card-alt); border: 1px solid var(--border-rule); border-radius: var(--radius-sm); padding: 14px 16px; margin-bottom: 14px;">
                  <div style="display: flex; justify-content: space-between; font-size: var(--text-xs); margin-bottom: 6px;">
                    <span style="color: var(--loam-faded);">${i18n.t('retailer.dashboard.activeBatch')}:</span>
                    <strong style="color: var(--loam); font-family: var(--font-mono);">#BATCH-PUN-9920</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: var(--text-xs); margin-bottom: 6px;">
                    <span style="color: var(--loam-faded);">${i18n.t('table.product')}:</span>
                    <span style="color: var(--loam);">${localizeCropName('Alphonso Mangoes')} (${localizeLocation('Ratnagiri')})</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: var(--text-xs); margin-bottom: 6px;">
                    <span style="color: var(--loam-faded);">${i18n.t('retailer.dashboard.unitsToStamp')}:</span>
                    <span style="color: var(--role-retailer); font-family: var(--font-mono); font-weight: 700;">100 ${i18n.t('retailer.dashboard.retailBoxes')}</span>
                  </div>
                </div>

                <button class="btn btn-primary" id="btn-retailer-stamp-qr" style="background: var(--role-retailer); border-color: var(--role-retailer);">
                  ${i18n.t('retailer.dashboard.pressStampBtn')}
                </button>
              </div>

              <!-- Stamping visual display -->
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--parchment-warm); border: 1.5px dashed var(--border-rule); border-radius: var(--radius-sm); padding: 20px; min-height: 200px; text-align: center;" id="retailer-stamp-target">
                <div id="stamp-impression-icon" style="font-size: 3rem; margin-bottom: 8px; transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);">
                  🏷️
                </div>
                <div id="stamp-impression-status" style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700; color: var(--loam);">
                  ${i18n.t('retailer.dashboard.readyForStamping')}
                </div>
                <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--loam-faded); margin-top: 4px;" id="stamp-impression-meta">
                  ${i18n.t('retailer.dashboard.pressButtonPrompt')}
                </div>
              </div>
            </div>
          </div>

          <div class="charts-grid">
            <div class="chart-card">
              <div class="chart-card-header">
                <div class="chart-card-title">📊 ${i18n.t('retailer.dashboard.salesChartTitle')}</div>
              </div>
              <div class="chart-wrapper">
                <canvas id="retailer-sales-chart"></canvas>
              </div>
            </div>
            <div class="chart-card">
              <div class="chart-card-header">
                <div class="chart-card-title">📦 ${i18n.t('farmer.dashboard.categoriesTitle')}</div>
              </div>
              <div class="chart-wrapper">
                <canvas id="retailer-category-chart"></canvas>
              </div>
            </div>
          </div>

          <!-- Storefront Products -->
          <div class="card" style="margin-top: 20px;">
            <div class="card-header">
              <div class="card-title">🏬 ${i18n.t('retailer.dashboard.storefrontTitle')}</div>
              <button class="btn btn-primary btn-sm" onclick="window.location.hash='/retailer/source'">${i18n.t('retailer.dashboard.sourceMore')} →</button>
            </div>
            <div class="data-grid" style="margin-top: 16px;">
              ${allProducts.slice(0, 6).map(p => `
                <div class="product-card">
                  <div class="product-card-image" style="height: 120px;">
                    ${p.emoji || getCropEmoji(p.name)}
                    ${p.isOrganic ? `<span class="product-card-badge badge-organic">🌿 ${i18n.t('farmer.products.organicBadge')}</span>` : ''}
                  </div>
                  <div class="product-card-body">
                    <div class="product-card-name">${localizeCropName(p.name)}</div>
                    <div class="product-card-origin">📍 ${localizeLocation(p.origin)}</div>
                    <div class="product-card-price">${formatCurrency(p.pricePerUnit)}<span class="product-card-unit">/${localizeUnit(p.unit)}</span></div>
                  </div>
                  <div class="product-card-footer">
                    <span class="badge badge-success">⛓️ ${i18n.t('camera.verifiedBadge')}</span>
                    <button class="btn-icon gen-qr-btn" data-product='${JSON.stringify(p)}' title="${i18n.t('farmer.products.traceQrTitle')}">📱</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  // Retailer Stamping Station Handler
  const stampToolBtn = container.querySelector('#btn-retailer-stamp-qr');
  stampToolBtn?.addEventListener('click', async () => {
    const icon = container.querySelector('#stamp-impression-icon');
    const status = container.querySelector('#stamp-impression-status');
    const meta = container.querySelector('#stamp-impression-meta');
    const target = container.querySelector('#retailer-stamp-target');

    if (icon) icon.style.transform = 'translateY(14px) scale(0.9)';
    stampToolBtn.textContent = i18n.t('retailer.dashboard.pressingInk');

    setTimeout(async () => {
      if (icon) icon.style.transform = 'translateY(0) scale(1)';
      stampToolBtn.textContent = `${i18n.t('retailer.dashboard.inkSealApplied')} ✓`;
      stampToolBtn.classList.add('is-success');

      // Generate actual QR code on canvas
      const canvas = await generateProductQR({
        productId: 'BATCH-PUN-9920',
        name: 'Ratnagiri Alphonso Mangoes',
        batchId: 'BATCH-PUN-9920',
        origin: 'Ratnagiri Orchards',
      });

      if (target) {
        target.innerHTML = `
          <div style="border: 2px solid var(--role-retailer); padding: 12px; background: #FAF6ED; border-radius: var(--radius-sm); box-shadow: var(--shadow-sm); animation: scaleIn 0.3s ease-out;">
            <div style="font-family: var(--font-mono); font-size: 0.65rem; color: var(--role-retailer); font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">
              ${i18n.t('retailer.dashboard.authenticatedSealLabel')}
            </div>
            <div style="display: flex; justify-content: center; margin: 8px 0;">
              ${createQRDisplay(canvas, 'Lot PUN-9920').outerHTML}
            </div>
            <div style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--loam-faded);">
              TxHash: 0x9b44...71cf · Shelf ID #B12
            </div>
          </div>
        `;
      }

      showToast(i18n.t('retailer.dashboard.stampToastSuccess'), 'success');

      setTimeout(() => {
        stampToolBtn.textContent = i18n.t('retailer.dashboard.pressStampBtn');
        stampToolBtn.classList.remove('is-success');
      }, 3500);
    }, 450);
  });

  // QR generation
  container.querySelectorAll('.gen-qr-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const product = JSON.parse(btn.dataset.product);
      const canvas = await generateProductQR(product);
      const qrDisplay = createQRDisplay(canvas, product.name);
      createModal(i18n.t('retailer.dashboard.shelfQrTitle'), `
        <div style="display: flex; justify-content: center;">${qrDisplay.outerHTML}</div>
        <p style="text-align: center; color: var(--text-muted); font-size: 0.85rem; margin-top: 12px;">
          ${i18n.t('retailer.dashboard.shelfQrDesc')}
        </p>
      `);
    });
  });

  // Charts
  setTimeout(() => {
    const days = [
      i18n.t('time.days.mon'),
      i18n.t('time.days.tue'),
      i18n.t('time.days.wed'),
      i18n.t('time.days.thu'),
      i18n.t('time.days.fri'),
      i18n.t('time.days.sat'),
      i18n.t('time.days.sun')
    ];
    const dailySales = days.map((_, i) => {
      return orders
        .filter(o => o.createdAt && new Date(o.createdAt).getDay() === (i + 1) % 7)
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    });
    const hasRealData = dailySales.some(v => v > 0);
    const totalVolume = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);

    createBarChart('retailer-sales-chart', {
      labels: days,
      datasets: [{
        label: `${i18n.t('retailer.dashboard.salesChartTitle')} (${formatCurrency(1).slice(0, 1)})`,
        data: hasRealData ? dailySales : [totalVolume * 0.1, totalVolume * 0.12, totalVolume * 0.07, totalVolume * 0.18, totalVolume * 0.15, totalVolume * 0.22, totalVolume * 0.16],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
      }],
    });

    const catCounts = {};
    orders.forEach(o => {
      const prod = allProducts.find(p => p.productId === o.productId);
      const cat = localizeCategory(prod?.category || 'Grains');
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });
    const hasCatData = Object.keys(catCounts).length > 0;
    createDoughnutChart('retailer-category-chart', {
      labels: hasCatData ? Object.keys(catCounts) : [localizeCategory('Grains'), localizeCategory('Vegetables'), localizeCategory('Fruits'), localizeCategory('Spices')],
      values: hasCatData ? Object.values(catCounts) : [35, 30, 25, 10],
    });
  }, 100);

  i18n.onChange(() => {
    if (window.location.hash.includes('/retailer/dashboard')) {
      renderRetailerDashboard(container);
    }
  });
}
