// ============================================
// FarmChain AI — Intermediary Inventory Page
// Shows sourced products and stock levels
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { formatCurrency, formatNumber, getStatusBadge, showToast, getCropEmoji, localizeCropName, localizeUnit } from '../../utils/helpers.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { i18n } from '../../i18n/index.js';

export function renderIntermediaryInventory(container) {
  const user = store.get('currentUser') || { name: 'Trader', id: 'trader-001' };
  const orders = (store.get('orders') || []).filter(o => o.buyerId === user.id);
  const transfers = (store.get('transfers') || []).filter(t => t.to === user.id);

  // Build inventory from completed orders
  const inventoryMap = {};
  orders.forEach(order => {
    const key = order.productId || order.productName;
    if (!inventoryMap[key]) {
      inventoryMap[key] = {
        productName: order.productName,
        productId: order.productId,
        unit: order.unit || 'kg',
        totalQuantity: 0,
        totalInvested: 0,
        orders: [],
        sellerName: order.sellerName,
      };
    }
    inventoryMap[key].totalQuantity += order.quantity || 0;
    inventoryMap[key].totalInvested += order.totalAmount || 0;
    inventoryMap[key].orders.push(order);
  });

  const inventory = Object.values(inventoryMap);
  const totalStock = inventory.reduce((s, i) => s + i.totalQuantity, 0);
  const totalInvested = inventory.reduce((s, i) => s + i.totalInvested, 0);

  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main">
        <div class="topbar">
          <div class="topbar-left">
            <div>
              <div class="topbar-title">${i18n.t('intermediary.inventory.title')} 📦</div>
              <div class="topbar-breadcrumb"><span>${i18n.t('roles.intermediary')}</span> <span>›</span> <span>${i18n.t('intermediary.inventory.title')}</span></div>
            </div>
          </div>
          <div class="topbar-right" style="display: flex; align-items: center; gap: 10px;">
            ${i18n.renderLanguageSelector('intermediary-inventory-lang-select')}
            <button class="btn btn-primary btn-sm" onclick="window.location.hash='/intermediary/dashboard'">🏪 ${i18n.t('intermediary.inventory.sourceMore')}</button>
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>${i18n.t('common.logout')}</span></button>
          </div>
        </div>

        <div class="page-content">
          <!-- Inventory Stats -->
          <div class="dashboard-stats stagger-children">
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-amber-dim); color: var(--accent-amber);">📦</div>
              <div class="stat-card-value">${formatNumber(inventory.length)}</div>
              <div class="stat-card-label">${i18n.t('intermediary.inventory.productTypes')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-green-dim); color: var(--accent-green);">📊</div>
              <div class="stat-card-value">${formatNumber(totalStock)}</div>
              <div class="stat-card-label">${i18n.t('intermediary.inventory.totalStock')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-cyan-dim); color: var(--accent-cyan);">💰</div>
              <div class="stat-card-value">${formatCurrency(totalInvested)}</div>
              <div class="stat-card-label">${i18n.t('intermediary.dashboard.statTotalInvested')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-purple-dim); color: var(--accent-purple);">🔄</div>
              <div class="stat-card-value">${formatNumber(transfers.length)}</div>
              <div class="stat-card-label">${i18n.t('intermediary.dashboard.statOwnershipTransfers')}</div>
            </div>
          </div>

          <!-- Inventory Grid -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">${i18n.t('intermediary.inventory.currentStock')}</div>
            </div>
            ${inventory.length > 0 ? `
              <table class="data-table">
                <thead>
                  <tr>
                    <th>${i18n.t('table.product')}</th>
                    <th>${i18n.t('intermediary.inventory.sourcedFrom')}</th>
                    <th>${i18n.t('table.quantity')}</th>
                    <th>${i18n.t('intermediary.inventory.invested')}</th>
                    <th>${i18n.t('intermediary.inventory.avgPrice')}</th>
                    <th>${i18n.t('table.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${inventory.map(item => {
                    const avgPrice = item.totalQuantity > 0 ? item.totalInvested / item.totalQuantity : 0;
                    const stockLevel = item.totalQuantity > 200 ? 'badge-success' : item.totalQuantity > 50 ? 'badge-warning' : 'badge-danger';
                    const stockLabel = item.totalQuantity > 200 ? i18n.t('status.inStock') : item.totalQuantity > 50 ? i18n.t('status.lowStock') : i18n.t('status.critical');
                    return `
                      <tr>
                        <td>
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1.3rem;">${getCropEmoji(item.productName)}</span>
                            <span style="font-weight: 600;">${localizeCropName(item.productName)}</span>
                          </div>
                        </td>
                        <td style="font-size: 0.85rem;">${escapeHtml(item.sellerName || i18n.t('intermediary.inventory.multiple'))}</td>
                        <td style="font-weight: 600;">${formatNumber(item.totalQuantity)} ${localizeUnit(item.unit)}</td>
                        <td style="color: var(--accent-cyan);">${formatCurrency(item.totalInvested)}</td>
                        <td>${formatCurrency(avgPrice)}/${localizeUnit(item.unit)}</td>
                        <td><span class="badge ${stockLevel}">${stockLabel}</span></td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            ` : `
              <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <h3>${i18n.t('intermediary.inventory.noInventory')}</h3>
                <p>${i18n.t('intermediary.inventory.noInventoryDesc')}</p>
                <button class="btn btn-primary btn-sm" style="margin-top: 16px;" onclick="window.location.hash='/intermediary/dashboard'">🏪 ${i18n.t('intermediary.inventory.browseMarketplace')}</button>
              </div>
            `}
          </div>
        </div>
      </main>
    </div>
  `;

  i18n.onChange(() => {
    if (window.location.hash.includes('/intermediary/inventory')) {
      renderIntermediaryInventory(container);
    }
  });
}
