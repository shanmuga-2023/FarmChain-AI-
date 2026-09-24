// ============================================
// FarmChain AI — Farmer Orders Page
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { formatCurrency, formatNumber, timeAgo, getStatusBadge, showToast, localizeCropName, localizeUnit } from '../../utils/helpers.js';
import { Marketplace } from '../../blockchain/contracts.js';
import { patchOrderStatus } from '../../utils/api.js';
import { updateFirestoreOrderStatus } from '../../firebase/firestore.js';
import { notifyOrderStatusChanged } from '../../utils/notifications.js';
import { i18n } from '../../i18n/index.js';

export function renderFarmerOrders(container) {
  const user = store.get('currentUser') || { name: 'Farmer', id: 'farmer-001' };
  const orders = (store.get('orders') || []).filter(o => o.sellerId === user.id);

  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main">
        <div class="topbar">
          <div class="topbar-left">
            <div>
              <div class="topbar-title">${i18n.t('farmer.orders.title')} 📋</div>
              <div class="topbar-breadcrumb"><span>${i18n.t('roles.farmer')}</span> <span>›</span> <span>${i18n.t('farmer.orders.title')}</span></div>
            </div>
          </div>
          <div class="topbar-right" style="display: flex; align-items: center; gap: 10px;">
            ${i18n.renderLanguageSelector('farmer-orders-lang-select')}
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>${i18n.t('common.logout')}</span></button>
          </div>
        </div>

        <div class="page-content">
          <!-- Order Stats -->
          <div class="dashboard-stats stagger-children">
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-amber-dim); color: var(--accent-amber);">⏳</div>
              <div class="stat-card-value">${formatNumber(orders.filter(o => o.status === 'pending').length)}</div>
              <div class="stat-card-label">${i18n.t('status.pending')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-cyan-dim); color: var(--accent-cyan);">✅</div>
              <div class="stat-card-value">${formatNumber(orders.filter(o => o.status === 'accepted').length)}</div>
              <div class="stat-card-label">${i18n.t('status.accepted')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-purple-dim); color: var(--accent-purple);">🚚</div>
              <div class="stat-card-value">${formatNumber(orders.filter(o => o.status === 'shipped').length)}</div>
              <div class="stat-card-label">${i18n.t('status.shipped')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-green-dim); color: var(--accent-green);">✓</div>
              <div class="stat-card-value">${formatNumber(orders.filter(o => o.status === 'delivered').length)}</div>
              <div class="stat-card-label">${i18n.t('status.delivered')}</div>
            </div>
          </div>

          <!-- Orders Table -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">${i18n.t('farmer.orders.allOrders')}</div>
              <div class="tabs">
                <button class="tab active" data-filter="all">${i18n.t('common.all')}</button>
                <button class="tab" data-filter="pending">${i18n.t('status.pending')}</button>
                <button class="tab" data-filter="shipped">${i18n.t('status.shipped')}</button>
              </div>
            </div>
            ${orders.length > 0 ? `
              <table class="data-table">
                <thead>
                  <tr>
                    <th>${i18n.t('table.orderId')}</th>
                    <th>${i18n.t('table.product')}</th>
                    <th>${i18n.t('table.buyer')}</th>
                    <th>${i18n.t('table.quantity')}</th>
                    <th>${i18n.t('table.amount')}</th>
                    <th>${i18n.t('table.status')}</th>
                    <th>${i18n.t('table.action')}</th>
                  </tr>
                </thead>
                <tbody id="orders-tbody">
                  ${orders.map(o => {
                    const badge = getStatusBadge(o.status);
                    return `
                      <tr data-status="${o.status}">
                        <td style="font-family: var(--font-display); font-weight: 600; color: var(--accent-cyan);">${o.orderId?.slice(0, 12) || 'N/A'}</td>
                        <td>${localizeCropName(o.productName) || 'N/A'}</td>
                        <td>
                          <div style="font-weight: 500;">${o.buyerName || 'N/A'}</div>
                          <div style="font-size: 0.75rem; color: var(--text-muted);">${i18n.t(`roles.${o.buyerRole}`) || o.buyerRole || ''}</div>
                        </td>
                        <td>${formatNumber(o.quantity)} ${localizeUnit(o.unit)}</td>
                        <td style="font-weight: 600; color: var(--accent-green);">${formatCurrency(o.totalAmount)}</td>
                        <td><span class="badge ${badge.class}">${badge.icon} ${badge.label}</span></td>
                        <td>
                          ${o.status === 'pending' ? `
                            <button class="btn btn-primary btn-sm accept-btn" data-order-id="${o.orderId}">${i18n.t('farmer.orders.acceptBtn')}</button>
                          ` : o.status === 'accepted' ? `
                            <button class="btn btn-primary btn-sm ship-btn" data-order-id="${o.orderId}">${i18n.t('farmer.orders.shipBtn')}</button>
                          ` : `
                            <span style="color: var(--text-muted); font-size: 0.8rem;">—</span>
                          `}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            ` : `
              <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>${i18n.t('farmer.orders.noOrders')}</h3>
                <p>${i18n.t('farmer.orders.noOrdersDesc')}</p>
              </div>
            `}
          </div>
        </div>
      </main>
    </div>
  `;

  // Accept/Ship handlers
  container.querySelectorAll('.accept-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const orderId = btn.dataset.orderId;
      const targetOrder = orders.find(o => o.orderId === orderId);
      await Marketplace.acceptOrder(orderId, user.id);
      store.updateItem('orders', o => o.orderId === orderId, { status: 'accepted' });
      patchOrderStatus(orderId, { status: 'accepted' });
      updateFirestoreOrderStatus(orderId, 'accepted');
      if (targetOrder) notifyOrderStatusChanged(targetOrder, 'accepted');
      showToast(`${i18n.t('farmer.orders.acceptedToast')} ✅`, 'success');
      renderFarmerOrders(container);
    });
  });

  container.querySelectorAll('.ship-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const orderId = btn.dataset.orderId;
      const targetOrder = orders.find(o => o.orderId === orderId);
      await Marketplace.shipOrder(orderId, user.id);
      store.updateItem('orders', o => o.orderId === orderId, { status: 'shipped' });
      patchOrderStatus(orderId, { status: 'shipped' });
      updateFirestoreOrderStatus(orderId, 'shipped');
      if (targetOrder) notifyOrderStatusChanged(targetOrder, 'shipped');
      showToast(`${i18n.t('farmer.orders.shippedToast')} 🚚`, 'success');
      renderFarmerOrders(container);
    });
  });

  // Tab filtering
  container.querySelectorAll('.tab[data-filter]').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.tab[data-filter]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.dataset.filter;
      container.querySelectorAll('#orders-tbody tr').forEach(row => {
        row.style.display = filter === 'all' || row.dataset.status === filter ? '' : 'none';
      });
    });
  });

  // Dynamic re-render on language switch
  i18n.onChange(() => {
    if (window.location.hash.includes('/farmer/orders')) {
      renderFarmerOrders(container);
    }
  });
}
