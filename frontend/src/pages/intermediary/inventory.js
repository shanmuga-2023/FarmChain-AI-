// ============================================
// FarmChain AI — Intermediary Inventory Page
// Shows sourced products and stock levels
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { formatCurrency, getStatusBadge, showToast, getCropEmoji } from '../../utils/helpers.js';
import { escapeHtml } from '../../utils/sanitize.js';

export function renderIntermediaryInventory(container) {
  const user = store.get('currentUser');
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
              <div class="topbar-title">Inventory Management 📦</div>
              <div class="topbar-breadcrumb"><span>Intermediary</span> <span>›</span> <span>Inventory</span></div>
            </div>
          </div>
          <div class="topbar-right">
            <button class="btn btn-primary btn-sm" onclick="window.location.hash='/intermediary/dashboard'">🏪 Source More</button>
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>Logout</span></button>
          </div>
        </div>

        <div class="page-content">
          <!-- Inventory Stats -->
          <div class="dashboard-stats stagger-children">
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-amber-dim); color: var(--accent-amber);">📦</div>
              <div class="stat-card-value">${inventory.length}</div>
              <div class="stat-card-label">Product Types</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-green-dim); color: var(--accent-green);">📊</div>
              <div class="stat-card-value">${totalStock}</div>
              <div class="stat-card-label">Total Stock (units)</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-cyan-dim); color: var(--accent-cyan);">💰</div>
              <div class="stat-card-value">${formatCurrency(totalInvested)}</div>
              <div class="stat-card-label">Total Invested</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-purple-dim); color: var(--accent-purple);">🔄</div>
              <div class="stat-card-value">${transfers.length}</div>
              <div class="stat-card-label">Ownership Transfers</div>
            </div>
          </div>

          <!-- Inventory Grid -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">Current Stock</div>
            </div>
            ${inventory.length > 0 ? `
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Sourced From</th>
                    <th>Quantity</th>
                    <th>Invested</th>
                    <th>Avg. Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${inventory.map(item => {
                    const avgPrice = item.totalQuantity > 0 ? item.totalInvested / item.totalQuantity : 0;
                    const stockLevel = item.totalQuantity > 200 ? 'badge-success' : item.totalQuantity > 50 ? 'badge-warning' : 'badge-danger';
                    const stockLabel = item.totalQuantity > 200 ? 'In Stock' : item.totalQuantity > 50 ? 'Low Stock' : 'Critical';
                    return `
                      <tr>
                        <td>
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1.3rem;">${getCropEmoji(item.productName)}</span>
                            <span style="font-weight: 600;">${escapeHtml(item.productName)}</span>
                          </div>
                        </td>
                        <td style="font-size: 0.85rem;">${escapeHtml(item.sellerName || 'Multiple')}</td>
                        <td style="font-weight: 600;">${item.totalQuantity} ${escapeHtml(item.unit)}</td>
                        <td style="color: var(--accent-cyan);">${formatCurrency(item.totalInvested)}</td>
                        <td>${formatCurrency(avgPrice)}/${escapeHtml(item.unit)}</td>
                        <td><span class="badge ${stockLevel}">${stockLabel}</span></td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            ` : `
              <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <h3>No inventory yet</h3>
                <p>Start sourcing products from the marketplace to build your inventory.</p>
                <button class="btn btn-primary btn-sm" style="margin-top: 16px;" onclick="window.location.hash='/intermediary/dashboard'">🏪 Browse Marketplace</button>
              </div>
            `}
          </div>
        </div>
      </main>
    </div>
  `;
}
