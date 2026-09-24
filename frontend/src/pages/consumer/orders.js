// ============================================
// FarmChain AI — Consumer Order History
// Shows all orders placed by the current consumer
// Fully Localized (en, hi, ta, te)
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { formatCurrency, timeAgo, getStatusBadge, showToast, localizeCropName, localizeUnit } from '../../utils/helpers.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { i18n } from '../../i18n/index.js';

export function renderConsumerOrders(container) {
  const user = store.get('currentUser');
  const orders = (store.get('orders') || []).filter(o => o.buyerId === user.id);

  const totalSpent = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main">
        <div class="topbar">
          <div class="topbar-left">
            <div>
              <div class="topbar-title">${i18n.t('consumer.myOrdersTitle') || 'My Orders 📋'}</div>
              <div class="topbar-breadcrumb"><span>${i18n.t('consumer.role') || 'Consumer'}</span> <span>›</span> <span>${i18n.t('consumer.orders') || 'Orders'}</span></div>
            </div>
          </div>
          <div class="topbar-right">
            <button class="btn btn-primary btn-sm" onclick="window.location.hash='/consumer/marketplace'">${i18n.t('consumer.browseMoreBtn') || '🛍️ Browse More'}</button>
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>${i18n.t('common.logout') || 'Logout'}</span></button>
          </div>
        </div>

        <div class="page-content">
          <!-- Order Stats -->
          <div class="dashboard-stats stagger-children">
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-purple-dim); color: var(--accent-purple);">🛍️</div>
              <div class="stat-card-value">${orders.length}</div>
              <div class="stat-card-label">${i18n.t('consumer.totalOrders') || 'Total Orders'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-amber-dim); color: var(--accent-amber);">⏳</div>
              <div class="stat-card-value">${pendingOrders}</div>
              <div class="stat-card-label">${i18n.t('status.pending') || 'Pending'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-green-dim); color: var(--accent-green);">✅</div>
              <div class="stat-card-value">${deliveredOrders}</div>
              <div class="stat-card-label">${i18n.t('status.delivered') || 'Delivered'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-cyan-dim); color: var(--accent-cyan);">💸</div>
              <div class="stat-card-value">${formatCurrency(totalSpent)}</div>
              <div class="stat-card-label">${i18n.t('consumer.totalSpent') || 'Total Spent'}</div>
            </div>
          </div>

          <!-- Orders Table -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">${i18n.t('consumer.orderHistory') || 'Order History'}</div>
              <div class="tabs">
                <button class="tab active" data-filter="all">${i18n.t('common.all') || 'All'}</button>
                <button class="tab" data-filter="pending">${i18n.t('status.pending') || 'Pending'}</button>
                <button class="tab" data-filter="shipped">${i18n.t('status.shipped') || 'Shipped'}</button>
                <button class="tab" data-filter="delivered">${i18n.t('status.delivered') || 'Delivered'}</button>
              </div>
            </div>
            ${orders.length > 0 ? `
              <table class="data-table">
                <thead>
                  <tr>
                    <th>${i18n.t('common.orderId') || 'Order ID'}</th>
                    <th>${i18n.t('common.product') || 'Product'}</th>
                    <th>${i18n.t('common.seller') || 'Seller'}</th>
                    <th>${i18n.t('common.quantity') || 'Quantity'}</th>
                    <th>${i18n.t('common.amount') || 'Amount'}</th>
                    <th>${i18n.t('common.status') || 'Status'}</th>
                    <th>${i18n.t('common.date') || 'Date'}</th>
                  </tr>
                </thead>
                <tbody id="consumer-orders-tbody">
                  ${orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).map(o => {
                    const badge = getStatusBadge(o.status);
                    const locCrop = localizeCropName(o.productName);
                    const locUnit = localizeUnit(o.unit);
                    return `
                      <tr data-status="${o.status}">
                        <td style="font-family: var(--font-display); font-weight: 600; color: var(--accent-cyan);">${escapeHtml((o.orderId || 'N/A').slice(0, 12))}</td>
                        <td>${escapeHtml(locCrop)}</td>
                        <td>
                          <div style="font-weight: 500;">${escapeHtml(o.sellerName || 'N/A')}</div>
                          <div style="font-size: 0.75rem; color: var(--text-muted);">${i18n.t('farmer.role') || 'Farmer'}</div>
                        </td>
                        <td>${o.quantity || 0} ${escapeHtml(locUnit)}</td>
                        <td style="font-weight: 600; color: var(--accent-green);">${formatCurrency(o.totalAmount || 0)}</td>
                        <td><span class="badge ${badge.class}">${badge.icon} ${badge.label}</span></td>
                        <td style="font-size: 0.8rem; color: var(--text-muted);">${o.createdAt ? timeAgo(o.createdAt) : 'N/A'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            ` : `
              <div class="empty-state">
                <div class="empty-state-icon">🛍️</div>
                <h3>${i18n.t('consumer.noOrdersYet') || 'No orders yet'}</h3>
                <p>${i18n.t('consumer.noOrdersDesc') || 'Browse the marketplace and place your first order!'}</p>
                <button class="btn btn-primary btn-sm" style="margin-top: 16px;" onclick="window.location.hash='/consumer/marketplace'">${i18n.t('consumer.browseProductsBtn') || '🛒 Browse Products'}</button>
              </div>
            `}
          </div>

          <!-- Price Transparency Info -->
          ${orders.length > 0 ? `
            <div class="card" style="margin-top: 20px;">
              <div class="card-header">
                <div class="card-title">${i18n.t('consumer.moneySplitTitle') || '💰 Where Your Money Goes'}</div>
              </div>
              <div class="price-breakdown">
                <div class="price-row">
                  <span class="price-row-label">${i18n.t('consumer.splitFarmer') || '🌾 Farmer receives (60%)'}</span>
                  <span class="price-row-value" style="color: var(--accent-green);">${formatCurrency(totalSpent * 0.6)}</span>
                </div>
                <div class="price-row">
                  <span class="price-row-label">${i18n.t('consumer.splitIntermediary') || '🏪 Intermediary (20%)'}</span>
                  <span class="price-row-value">${formatCurrency(totalSpent * 0.2)}</span>
                </div>
                <div class="price-row">
                  <span class="price-row-label">${i18n.t('consumer.splitRetailer') || '🛒 Retailer (15%)'}</span>
                  <span class="price-row-value">${formatCurrency(totalSpent * 0.15)}</span>
                </div>
                <div class="price-row">
                  <span class="price-row-label">${i18n.t('consumer.splitPlatform') || '⛓️ Platform fee (5%)'}</span>
                  <span class="price-row-value">${formatCurrency(totalSpent * 0.05)}</span>
                </div>
                <div class="price-row total">
                  <span class="price-row-label">${i18n.t('consumer.totalSpent') || 'Total Spent'}</span>
                  <span class="price-row-value">${formatCurrency(totalSpent)}</span>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      </main>
    </div>
  `;

  // Tab filtering
  container.querySelectorAll('.tab[data-filter]').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.tab[data-filter]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.dataset.filter;
      container.querySelectorAll('#consumer-orders-tbody tr').forEach(row => {
        row.style.display = filter === 'all' || row.dataset.status === filter ? '' : 'none';
      });
    });
  });
}
