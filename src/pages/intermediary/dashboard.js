// ============================================
// FarmChain AI — Intermediary Dashboard
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { createLineChart, createBarChart } from '../../components/charts.js';
import { formatCurrency, formatNumber, timeAgo, getStatusBadge, showToast, getCropEmoji, createModal, closeModal } from '../../utils/helpers.js';
import { Marketplace, PaymentSplitter, OwnershipTransfer } from '../../blockchain/contracts.js';
import { blockchain } from '../../blockchain/core.js';
import { validateOrderQuantity } from '../../utils/sanitize.js';
import { postOrder } from '../../utils/api.js';
import { addFirestoreOrder } from '../../firebase/firestore.js';
import { notifyOrderPlaced } from '../../utils/notifications.js';

export function renderIntermediaryDashboard(container) {
  const user = store.get('currentUser');
  const allProducts = store.get('products') || [];
  const orders = (store.get('orders') || []).filter(o => o.buyerId === user.id || o.sellerId === user.id);
  const revenue = PaymentSplitter.getTotalRevenue(user.id);
  const transfers = (store.get('transfers') || []).filter(t => t.from === user.id || t.to === user.id);

  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

  const purchased = orders.filter(o => o.buyerId === user.id);
  const totalInvested = purchased.reduce((s, o) => s + (o.totalAmount || 0), 0);

  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main">
        <div class="topbar">
          <div class="topbar-left">
            <div>
              <div class="topbar-title">Welcome, ${user.name} 🏪</div>
              <div class="topbar-breadcrumb"><span>Intermediary</span> <span>›</span> <span>Dashboard</span></div>
            </div>
          </div>
          <div class="topbar-right">
            <button class="btn-icon notification-btn">🔔<span class="notification-dot"></span></button>
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>Logout</span></button>
          </div>
        </div>

        <div class="page-content">
          <div class="dashboard-stats stagger-children">
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-amber-dim); color: var(--accent-amber);">📦</div>
              <div class="stat-card-value">${purchased.length}</div>
              <div class="stat-card-label">Products Sourced</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-green-dim); color: var(--accent-green);">💰</div>
              <div class="stat-card-value">${formatCurrency(revenue)}</div>
              <div class="stat-card-label">Revenue (20% Share)</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-cyan-dim); color: var(--accent-cyan);">💸</div>
              <div class="stat-card-value">${formatCurrency(totalInvested)}</div>
              <div class="stat-card-label">Total Invested</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-purple-dim); color: var(--accent-purple);">🔄</div>
              <div class="stat-card-value">${transfers.length}</div>
              <div class="stat-card-label">Ownership Transfers</div>
            </div>
          </div>

          <div class="charts-grid">
            <div class="chart-card">
              <div class="chart-card-header">
                <div class="chart-card-title">📊 Transaction Volume</div>
              </div>
              <div class="chart-wrapper">
                <canvas id="intermediary-volume-chart"></canvas>
              </div>
            </div>
            <div class="chart-card">
              <div class="chart-card-header">
                <div class="chart-card-title">💰 Margin Transparency</div>
              </div>
              <div class="chart-wrapper">
                <canvas id="intermediary-margin-chart"></canvas>
              </div>
            </div>
          </div>

          <!-- Available Products to Source -->
          <div class="card" style="margin-top: 20px;">
            <div class="card-header">
              <div class="card-title">🏪 Available Products to Source</div>
              <button class="btn btn-primary btn-sm" onclick="window.location.hash='/intermediary/marketplace'">Browse All →</button>
            </div>
            <div class="data-grid" style="margin-top: 16px;">
              ${allProducts.filter(p => p.farmerId !== user.id).slice(0, 4).map(p => `
                <div class="product-card">
                  <div class="product-card-image" style="height: 120px;">${p.emoji || getCropEmoji(p.name)}</div>
                  <div class="product-card-body">
                    <div class="product-card-name">${p.name}</div>
                    <div class="product-card-origin">📍 ${p.origin}</div>
                    <div class="product-card-price">${formatCurrency(p.pricePerUnit)}<span class="product-card-unit">/${p.unit}</span></div>
                    <div style="margin-top: 8px;">
                      <span class="badge badge-success">${p.quantity} ${p.unit} available</span>
                    </div>
                  </div>
                  <div class="product-card-footer">
                    <span class="product-card-meta">By ${p.farmerName}</span>
                    <button class="btn btn-primary btn-sm order-btn" data-product='${JSON.stringify(p)}'>Order</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Recent Orders -->
          <div class="card" style="margin-top: 20px;">
            <div class="card-header">
              <div class="card-title">📋 Recent Orders</div>
            </div>
            <div class="tx-feed">
              ${orders.slice(-5).reverse().map(o => {
                const badge = getStatusBadge(o.status);
                return `
                  <div class="tx-item">
                    <div class="tx-icon" style="background: var(--accent-amber-dim); color: var(--accent-amber);">📦</div>
                    <div class="tx-info">
                      <div class="tx-title">${o.productName} — ${o.quantity} ${o.unit}</div>
                      <div class="tx-meta">${o.buyerId === user.id ? 'Bought from ' + o.sellerName : 'Sold to ' + o.buyerName}</div>
                    </div>
                    <div>
                      <span class="badge ${badge.class}">${badge.label}</span>
                      <div class="tx-amount ${o.buyerId === user.id ? 'debit' : 'credit'}" style="text-align: right; margin-top: 4px;">
                        ${o.buyerId === user.id ? '-' : '+'}${formatCurrency(o.totalAmount)}
                      </div>
                    </div>
                  </div>
                `;
              }).join('') || '<div class="empty-state"><p>No orders yet</p></div>'}
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  // Order buttons
  container.querySelectorAll('.order-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const product = JSON.parse(btn.dataset.product);
      createModal('Place Order', `
        <div style="text-align: center; margin-bottom: 16px;">
          <span style="font-size: 3rem;">${product.emoji || getCropEmoji(product.name)}</span>
          <h3 style="margin-top: 8px;">${product.name}</h3>
          <p style="color: var(--text-muted);">From ${product.farmerName} · ${product.origin}</p>
        </div>
        <div class="form-group">
          <label class="form-label">Quantity (${product.unit})</label>
          <input type="number" class="form-input" id="order-quantity" value="100" max="${product.quantity}" />
        </div>
        <div class="price-breakdown" style="margin-top: 12px;">
          <div class="price-row">
            <span class="price-row-label">Price per ${product.unit}</span>
            <span class="price-row-value">${formatCurrency(product.pricePerUnit)}</span>
          </div>
          <div class="price-row total" id="order-total-row">
            <span class="price-row-label">Total Amount</span>
            <span class="price-row-value">${formatCurrency(product.pricePerUnit * 100)}</span>
          </div>
        </div>
      `, `
        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary btn-sm" id="confirm-order-btn">🛍️ Place Order</button>
      `);

      // Update total on quantity change
      document.getElementById('order-quantity')?.addEventListener('input', (e) => {
        const qty = parseInt(e.target.value) || 0;
        const totalRow = document.querySelector('#order-total-row .price-row-value');
        if (totalRow) totalRow.textContent = formatCurrency(product.pricePerUnit * qty);
      });

      document.getElementById('confirm-order-btn')?.addEventListener('click', async () => {
        const quantity = parseInt(document.getElementById('order-quantity')?.value) || 0;
        const validation = validateOrderQuantity(quantity, product.quantity);
        if (!validation.valid) {
          showToast(validation.errors[0], 'error');
          return;
        }

        const orderData = {
          productId: product.productId,
          productName: product.name,
          buyerId: user.id,
          buyerName: user.name,
          buyerRole: 'intermediary',
          sellerId: product.farmerId,
          sellerName: product.farmerName,
          quantity,
          unit: product.unit,
          totalAmount: quantity * product.pricePerUnit,
        };

        const result = await Marketplace.placeOrder(orderData);

        // Use blockchain-returned orderId (fixes ID mismatch)
        const order = {
          ...orderData,
          orderId: result.transaction.orderId,
          pricePerUnit: product.pricePerUnit,
          status: 'pending',
          createdAt: Date.now(),
        };

        store.addItem('orders', order);

        // Decrement product quantity
        store.updateItem('products', p => p.productId === product.productId, {
          quantity: product.quantity - quantity,
        });

        // Sync to server
        postOrder(order);

        // Sync to Firestore
        addFirestoreOrder(order);

        // Trigger real-time notification
        notifyOrderPlaced(order);

        closeModal();
        showToast('Order placed successfully! ⛓️', 'success');
        renderIntermediaryDashboard(container);
      });
    });
  });

  // Charts — use real data from orders
  setTimeout(() => {
    const allOrders = (store.get('orders') || []).filter(o => o.buyerId === user.id);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const monthlyVolume = months.map((_, i) => {
      return allOrders
        .filter(o => o.createdAt && new Date(o.createdAt).getMonth() === i)
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    });
    // Ensure at least some data for demo
    const hasData = monthlyVolume.some(v => v > 0);
    createBarChart('intermediary-volume-chart', {
      labels: months,
      datasets: [{
        label: 'Transaction Volume (₹)',
        data: hasData ? monthlyVolume : [totalVolume * 0.12, totalVolume * 0.18, totalVolume * 0.08, totalVolume * 0.25, totalVolume * 0.2, totalVolume * 0.17],
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
      }],
    });

    createBarChart('intermediary-margin-chart', {
      labels: ['Farmer (60%)', 'Intermediary (20%)', 'Retailer (15%)', 'Platform (5%)'],
      datasets: [{
        label: 'Revenue Share',
        data: [totalVolume * 0.6, totalVolume * 0.2, totalVolume * 0.15, totalVolume * 0.05],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
      }],
    });
  }, 100);
}
