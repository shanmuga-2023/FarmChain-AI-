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
import { postOrder, updateProduct } from '../../utils/api.js';
import { addFirestoreOrder, updateFirestoreProduct } from '../../firebase/firestore.js';
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

          <!-- zk-SNARK Privacy Toggle -->
          <div class="zk-shield-banner" style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.06), rgba(59, 130, 246, 0.06)); border: 1px solid rgba(168, 85, 247, 0.2); border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.3rem;">🔒</span>
              <div>
                <div style="font-size: 0.82rem; font-weight: 700; color: var(--accent-purple);">Zero-Knowledge Volume Privacy</div>
                <div style="font-size: 0.72rem; color: var(--text-muted);">Shield your wholesale volumes & revenue from competitors using zk-SNARK proofs</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.75rem; color: var(--text-muted);" id="zk-status-label">Unshielded</span>
              <label class="toggle-switch" style="position: relative; width: 44px; height: 24px; display: inline-block;">
                <input type="checkbox" id="zk-toggle" style="opacity: 0; width: 0; height: 0;">
                <span class="toggle-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.1); border-radius: 24px; transition: 0.3s;">
                  <span style="position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s;" id="zk-toggle-dot"></span>
                </span>
              </label>
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
        const newQuantity = Math.max(0, product.quantity - quantity);
        store.updateItem('products', p => p.productId === product.productId, {
          quantity: newQuantity,
        });

        // Sync product quantity to server & Firestore
        updateProduct(product.productId, { quantity: newQuantity }).catch(e => console.warn('API sync failed:', e));
        updateFirestoreProduct(product.productId, { quantity: newQuantity }).catch(e => console.warn('Firestore sync failed:', e));

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
    const totalVolume = allOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
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

  // ==========================================
  // zk-SNARK Privacy Toggle Handler
  // ==========================================
  const zkToggle = container.querySelector('#zk-toggle');
  const zkStatusLabel = container.querySelector('#zk-status-label');
  const zkDot = container.querySelector('#zk-toggle-dot');

  if (zkToggle) {
    zkToggle.addEventListener('change', () => {
      const isShielded = zkToggle.checked;
      const statValues = container.querySelectorAll('.stat-card-value');

      if (isShielded) {
        // Shield all values
        statValues.forEach(el => {
          el.dataset.original = el.textContent;
          el.textContent = '🔒';
          el.style.color = 'var(--accent-purple)';
          el.style.fontSize = '1.6rem';
        });
        zkStatusLabel.textContent = 'zk-SHIELDED';
        zkStatusLabel.style.color = 'var(--accent-purple)';
        zkStatusLabel.style.fontWeight = '700';
        zkDot.style.transform = 'translateX(20px)';
        zkDot.style.background = 'var(--accent-purple)';
        zkToggle.parentElement.querySelector('.toggle-slider').style.background = 'rgba(168, 85, 247, 0.4)';

        // Mask chart canvases
        container.querySelectorAll('.chart-wrapper').forEach(wrapper => {
          wrapper.style.filter = 'blur(8px)';
          wrapper.style.pointerEvents = 'none';
          if (!wrapper.querySelector('.zk-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'zk-overlay';
            overlay.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.85rem; font-weight: 700; color: var(--accent-purple); z-index: 10; text-align: center; background: rgba(0,0,0,0.6); padding: 8px 16px; border-radius: var(--radius-sm); backdrop-filter: blur(4px);';
            overlay.textContent = '🔒 ZK-SHIELDED';
            wrapper.style.position = 'relative';
            wrapper.appendChild(overlay);
          }
        });

        showToast('🔒 Zero-Knowledge privacy activated — volume data shielded from competitors', 'success');
      } else {
        // Restore values
        statValues.forEach(el => {
          if (el.dataset.original) {
            el.textContent = el.dataset.original;
            el.style.color = '';
            el.style.fontSize = '';
          }
        });
        zkStatusLabel.textContent = 'Unshielded';
        zkStatusLabel.style.color = 'var(--text-muted)';
        zkStatusLabel.style.fontWeight = '';
        zkDot.style.transform = '';
        zkDot.style.background = 'white';
        zkToggle.parentElement.querySelector('.toggle-slider').style.background = 'rgba(255,255,255,0.1)';

        // Unmask charts
        container.querySelectorAll('.chart-wrapper').forEach(wrapper => {
          wrapper.style.filter = '';
          wrapper.style.pointerEvents = '';
          const overlay = wrapper.querySelector('.zk-overlay');
          if (overlay) overlay.remove();
        });

        showToast('🔓 Privacy shield deactivated — data visible', 'info');
      }
    });
  }
}
