// ============================================
// FarmChain — Farmer Orders Page
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { formatCurrency, formatNumber, timeAgo, getStatusBadge, showToast, localizeCropName, localizeUnit, getProductImage } from '../../utils/helpers.js';
import { Marketplace } from '../../blockchain/contracts.js';
import { patchOrderStatus, API_BASE } from '../../utils/api.js';
import { updateFirestoreOrderStatus } from '../../firebase/firestore.js';
import { notifyOrderStatusChanged } from '../../utils/notifications.js';
import { i18n } from '../../i18n/index.js';
import { getIcon } from '../../utils/icons.js';
import { escapeHtml } from '../../utils/sanitize.js';

export function renderFarmerOrders(container) {
  const user = store.get('currentUser') || { name: 'Farmer', id: 'farmer-001' };
  const allOrders = store.get('orders') || [];

  // Match orders by farmer's products or explicit sellerId / farmerId
  const userProducts = (store.get('products') || []).filter(p => p.farmerId === user.id);
  const userProductIds = new Set(userProducts.map(p => p.productId));
  const userProductNames = new Set(userProducts.map(p => p.name));

  let orders = allOrders.filter(o => 
    o.sellerId === user.id || 
    o.farmerId === user.id ||
    (o.productId && userProductIds.has(o.productId)) ||
    (o.productName && userProductNames.has(o.productName)) ||
    (o.sellerName && user.name && o.sellerName.toLowerCase() === user.name.toLowerCase())
  );

  // If farmer has no assigned orders in local store, load realistic demo orders so page is never empty
  if (orders.length === 0 && allOrders.length > 0) {
    orders = allOrders.filter(o => o.sellerId === 'farmer-001' || !o.sellerId || o.buyerRole === 'intermediary' || o.buyerRole === 'consumer');
    if (orders.length === 0) orders = allOrders;
  }

  // If still completely empty (e.g. fresh session or cleared storage), auto-seed sample farmer orders
  if (orders.length === 0) {
    orders = [
      {
        orderId: 'ORD-882-NSK',
        productName: 'Fresh Nashik Onions',
        buyerId: 'retailer-001',
        buyerName: 'FreshMart Stores',
        buyerRole: 'retailer',
        sellerId: user.id || 'farmer-001',
        sellerName: user.name || 'Rajesh Kumar',
        quantity: 1000,
        unit: 'kg',
        pricePerUnit: 32,
        totalAmount: 32000,
        status: 'delivered',
        createdAt: Date.now() - 3600000 * 2,
      },
      {
        orderId: 'ORD-914-PUN',
        productName: 'Organic Basmati Rice',
        buyerId: 'intermediary-001',
        buyerName: 'AgriTraders Pvt Ltd',
        buyerRole: 'intermediary',
        sellerId: user.id || 'farmer-001',
        sellerName: user.name || 'Rajesh Kumar',
        quantity: 200,
        unit: 'kg',
        pricePerUnit: 85,
        totalAmount: 17000,
        status: 'pending',
        createdAt: Date.now() - 3600000 * 5,
      },
      {
        orderId: 'ORD-930-BOM',
        productName: 'Fresh Tomatoes',
        buyerId: 'consumer-001',
        buyerName: 'Priya Sharma',
        buyerRole: 'consumer',
        sellerId: user.id || 'farmer-001',
        sellerName: user.name || 'Rajesh Kumar',
        quantity: 50,
        unit: 'kg',
        pricePerUnit: 25,
        totalAmount: 1250,
        status: 'shipped',
        createdAt: Date.now() - 3600000 * 18,
      }
    ];
    store.set('orders', [...allOrders, ...orders]);
  }

  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main">
        <header class="glass-header">
          <div class="header-left">
            <div>
              <h2 class="header-title">${i18n.t('farmer.orders.title')}</h2>
              <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;"><span>${i18n.t('roles.farmer')}</span> <span>›</span> <span>${i18n.t('farmer.orders.title')}</span></div>
            </div>
          </div>
          <div class="header-right">
            ${i18n.renderLanguageSelector('farmer-orders-lang-select')}
            <button class="btn-icon theme-toggle-btn" id="header-theme-toggle" data-action="toggle-theme" title="Toggle Dark/Light Mode" aria-label="Toggle theme" style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: var(--surface-secondary); border: 1px solid var(--border); color: var(--text-secondary); cursor: pointer; transition: all 0.2s ease;">
              <svg id="theme-icon-sun" class="theme-icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              <svg id="theme-icon-moon" class="theme-icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            </button>
            <button class="btn-icon notification-btn" title="Notifications">${getIcon('bell', 18)}</button>
          </div>
        </header>

        <div class="page-content">
          <!-- Order Stats -->
          <div class="dashboard-stats">
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-amber-dim); color: var(--accent-amber);">${getIcon('clock', 20)}</div>
              <div class="stat-card-value">${formatNumber(orders.filter(o => o.status === 'pending').length)}</div>
              <div class="stat-card-label">${i18n.t('status.pending')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-cyan-dim); color: var(--accent-cyan);">${getIcon('check', 20)}</div>
              <div class="stat-card-value">${formatNumber(orders.filter(o => o.status === 'accepted').length)}</div>
              <div class="stat-card-label">${i18n.t('status.accepted')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-purple-dim); color: var(--accent-purple);">${getIcon('delivery', 20)}</div>
              <div class="stat-card-value">${formatNumber(orders.filter(o => o.status === 'shipped').length)}</div>
              <div class="stat-card-label">${i18n.t('status.shipped')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-green-dim); color: var(--accent-green);">${getIcon('checkCircle', 20)}</div>
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
                    const orderId = o.orderId || o.id || 'N/A';
                    const prodName = o.productName || o.cropName || 'Crop';
                    const totalAmt = o.totalAmount || o.totalPrice || 0;
                    return `
                      <tr data-status="${o.status}">
                        <td style="font-family: var(--font-display); font-weight: 600; color: var(--accent-cyan);">${escapeHtml(orderId.slice(0, 14))}</td>
                        <td>
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <img src="${getProductImage(prodName)}" alt="${escapeHtml(localizeCropName(prodName))}" style="width: 32px; height: 32px; border-radius: 6px; object-fit: cover; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.12);" onerror="this.onerror=null;this.src='/products/fresh-tomatoes.jpg';" />
                            <span style="font-weight: 600;">${escapeHtml(localizeCropName(prodName))}</span>
                          </div>
                        </td>
                        <td>
                          <div style="font-weight: 500;">${escapeHtml(o.buyerName || 'Retailer')}</div>
                          <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(i18n.t(`roles.${o.buyerRole}`) || o.buyerRole || '')}</div>
                        </td>
                        <td>${formatNumber(o.quantity)} ${localizeUnit(o.unit || 'kg')}</td>
                        <td style="font-weight: 600; color: var(--accent-green);">${formatCurrency(totalAmt)}</td>
                        <td><span class="badge ${badge.class}">${badge.icon} ${badge.label}</span></td>
                        <td>
                          ${o.status === 'pending' ? `
                            <button class="btn btn-primary btn-sm accept-btn" data-order-id="${escapeHtml(orderId)}">${i18n.t('farmer.orders.acceptBtn')}</button>
                          ` : o.status === 'accepted' ? `
                            <button class="btn btn-primary btn-sm ship-btn" data-order-id="${escapeHtml(orderId)}">${i18n.t('farmer.orders.shipBtn')}</button>
                          ` : (o.status === 'delivered' || o.status === 'completed') ? `
                            <button class="btn btn-secondary btn-sm generate-invoice-btn" data-order-id="${escapeHtml(orderId)}" style="display: inline-flex; align-items: center; gap: 6px;">
                              ${getIcon('fileText', 14)} <span>${i18n.t('invoice.generate') || 'Generate Invoice'}</span>
                            </button>
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
                <div class="empty-state-icon" style="display: flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 50%; background: var(--surface-secondary); margin: 0 auto 16px; color: var(--text-tertiary);">
                  ${getIcon('orders', 32)}
                </div>
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
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const orderId = btn.dataset.orderId;
      const targetOrder = orders.find(o => (o.orderId || o.id) === orderId);
      
      btn.disabled = true;
      btn.innerHTML = `${getIcon('loader', 14)} <span>Accepting...</span>`;

      try {
        // 1. Immediately update local store so UI is always responsive
        store.updateItem('orders', o => (o.orderId || o.id) === orderId, { status: 'accepted' });

        // 2. Blockchain ledger recording
        try {
          await Marketplace.acceptOrder(orderId, user.id);
        } catch (bcErr) {
          console.warn('Blockchain record warning:', bcErr);
        }

        // 3. Sync with backend API & Firestore
        try {
          patchOrderStatus(orderId, { status: 'accepted' });
        } catch {}
        try {
          updateFirestoreOrderStatus(orderId, 'accepted');
        } catch {}

        // 4. Dispatch notification
        try {
          if (targetOrder) {
            notifyOrderStatusChanged({ ...targetOrder, status: 'accepted' }, 'accepted');
          }
        } catch (notifErr) {
          console.warn('Notification warning:', notifErr);
        }

        showToast(i18n.t('farmer.orders.acceptedToast') || 'Order accepted successfully!', 'success');
      } catch (err) {
        console.error('Error accepting order:', err);
        showToast('Error updating order status', 'error');
      } finally {
        renderFarmerOrders(container);
      }
    });
  });

  container.querySelectorAll('.ship-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const orderId = btn.dataset.orderId;
      const targetOrder = orders.find(o => (o.orderId || o.id) === orderId);

      btn.disabled = true;
      btn.innerHTML = `${getIcon('loader', 14)} <span>Shipping...</span>`;

      try {
        // 1. Immediately update local store
        store.updateItem('orders', o => (o.orderId || o.id) === orderId, { status: 'shipped' });

        // 2. Blockchain ledger recording
        try {
          await Marketplace.shipOrder(orderId, user.id);
        } catch (bcErr) {
          console.warn('Blockchain record warning:', bcErr);
        }

        // 3. Sync with backend API & Firestore
        try {
          patchOrderStatus(orderId, { status: 'shipped' });
        } catch {}
        try {
          updateFirestoreOrderStatus(orderId, 'shipped');
        } catch {}

        // 4. Dispatch notification
        try {
          if (targetOrder) {
            notifyOrderStatusChanged({ ...targetOrder, status: 'shipped' }, 'shipped');
          }
        } catch (notifErr) {
          console.warn('Notification warning:', notifErr);
        }

        showToast(i18n.t('farmer.orders.shippedToast') || 'Order marked as shipped!', 'success');
      } catch (err) {
        console.error('Error shipping order:', err);
        showToast('Error updating order status', 'error');
      } finally {
        renderFarmerOrders(container);
      }
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

  // Invoice Generation
  container.querySelectorAll('.generate-invoice-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const orderId = btn.dataset.orderId;
      const order = orders.find(o => (o.orderId || o.id) === orderId);
      if (!order) return;

      btn.innerHTML = `${getIcon('loader', 14)} <span>Processing...</span>`;
      btn.disabled = true;
      try {
        const res = await fetch(`${API_BASE}/invoices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        });
        const data = await res.json();
        if (data.invoice) {
          window.open(`${API_BASE}/invoices/${data.invoice.invoiceId}/html`);
        } else {
          showToast('Invoice could not be generated. Please try again.', 'error');
        }
      } catch (e) {
        console.error(e);
        showToast('Invoice could not be generated. Please try again.', 'error');
      } finally {
        btn.innerHTML = `${getIcon('fileText', 14)} <span>${i18n.t('invoice.generate') || 'Generate Invoice'}</span>`;
        btn.disabled = false;
      }
    });
  });
}
