// ============================================
// FarmChain AI — Retailer Source Products Page
// Browse and order available products with supplier info
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { formatCurrency, getCropEmoji, showToast, createModal, closeModal, getStatusBadge } from '../../utils/helpers.js';
import { escapeHtml, validateOrderQuantity } from '../../utils/sanitize.js';
import { Marketplace } from '../../blockchain/contracts.js';
import { FairPricePredictor } from '../../ai/price-predictor.js';
import { postOrder } from '../../utils/api.js';
import { addFirestoreOrder } from '../../firebase/firestore.js';
import { notifyOrderPlaced } from '../../utils/notifications.js';

export function renderRetailerSource(container) {
  const user = store.get('currentUser');
  const allProducts = store.get('products') || [];
  const users = store.get('users') || {};

  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main">
        <div class="topbar">
          <div class="topbar-left">
            <div>
              <div class="topbar-title">Source Products 🔍</div>
              <div class="topbar-breadcrumb"><span>Retailer</span> <span>›</span> <span>Source</span></div>
            </div>
          </div>
          <div class="topbar-right">
            <div class="topbar-search">
              <span class="topbar-search-icon">🔍</span>
              <input type="text" placeholder="Search products..." id="source-search" />
            </div>
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>Logout</span></button>
          </div>
        </div>

        <div class="page-content">
          <!-- Category Filters -->
          <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
            <button class="tab active source-filter" data-category="all">All</button>
            <button class="tab source-filter" data-category="Grains">🌾 Grains</button>
            <button class="tab source-filter" data-category="Vegetables">🥬 Vegetables</button>
            <button class="tab source-filter" data-category="Fruits">🍎 Fruits</button>
            <button class="tab source-filter" data-category="Spices">🌶️ Spices</button>
            <button class="tab source-filter" data-category="organic">🌿 Organic Only</button>
          </div>

          <!-- Product Grid -->
          <div class="data-grid stagger-children" id="source-grid">
            ${allProducts.map(p => {
              const farmer = users[p.farmerId] || {};
              const prediction = FairPricePredictor.predict(p.name.split(' ').pop(), p.quantity, p.pricePerUnit);
              return `
                <div class="product-card source-item" data-category="${escapeHtml(p.category)}" data-organic="${p.isOrganic}" data-name="${escapeHtml((p.name || '').toLowerCase())}">
                  <div class="product-card-image" style="height: 120px;">
                    ${p.emoji || getCropEmoji(p.name)}
                    ${p.isOrganic ? '<span class="product-card-badge badge-organic">🌿 Organic</span>' : ''}
                  </div>
                  <div class="product-card-body">
                    <div class="product-card-name">${escapeHtml(p.name)}</div>
                    <div class="product-card-origin">📍 ${escapeHtml(p.origin)}</div>
                    <div style="display: flex; align-items: baseline; gap: 8px;">
                      <div class="product-card-price">${formatCurrency(p.pricePerUnit)}</div>
                      <span class="product-card-unit">per ${escapeHtml(p.unit)}</span>
                    </div>
                    <div style="margin-top: 6px; font-size: 0.8rem; color: var(--text-muted);">
                      ${p.quantity} ${escapeHtml(p.unit)} available
                    </div>
                    <div style="margin-top: 8px; display: flex; gap: 4px; flex-wrap: wrap;">
                      <span class="badge ${prediction.isFairlyPriced ? 'badge-success' : 'badge-warning'}">
                        🤖 ${prediction.isFairlyPriced ? 'Fair Price' : 'Above Market'}
                      </span>
                      ${farmer.rating ? `<span class="badge badge-info">★ ${farmer.rating}</span>` : ''}
                      ${farmer.verified ? '<span class="badge badge-success">✅ Verified</span>' : ''}
                    </div>
                  </div>
                  <div class="product-card-footer">
                    <span class="product-card-meta">By ${escapeHtml(p.farmerName)}</span>
                    <button class="btn btn-primary btn-sm source-order-btn" data-product='${JSON.stringify(p)}'>📦 Order</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          ${allProducts.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">🔍</div>
              <h3>No products available</h3>
              <p>Check back later for new products from farmers.</p>
            </div>
          ` : ''}
        </div>
      </main>
    </div>
  `;

  // Search
  container.querySelector('#source-search')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    container.querySelectorAll('.source-item').forEach(item => {
      item.style.display = item.dataset.name.includes(query) ? '' : 'none';
    });
  });

  // Category filters
  container.querySelectorAll('.source-filter').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.source-filter').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const category = tab.dataset.category;
      container.querySelectorAll('.source-item').forEach(item => {
        if (category === 'all') item.style.display = '';
        else if (category === 'organic') item.style.display = item.dataset.organic === 'true' ? '' : 'none';
        else item.style.display = item.dataset.category === category ? '' : 'none';
      });
    });
  });

  // Order buttons
  container.querySelectorAll('.source-order-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const product = JSON.parse(btn.dataset.product);
      createModal('Source Product', `
        <div style="text-align: center; margin-bottom: 16px;">
          <span style="font-size: 3rem;">${product.emoji || getCropEmoji(product.name)}</span>
          <h3 style="margin-top: 8px;">${escapeHtml(product.name)}</h3>
          <p style="color: var(--text-muted);">From ${escapeHtml(product.farmerName)} · ${escapeHtml(product.origin)}</p>
        </div>
        <div class="form-group">
          <label class="form-label">Quantity (${escapeHtml(product.unit)}) — Max: ${product.quantity}</label>
          <input type="number" class="form-input" id="source-quantity" value="50" min="1" max="${product.quantity}" />
        </div>
        <div class="price-breakdown" style="margin-top: 12px;">
          <div class="price-row">
            <span class="price-row-label">Price per ${escapeHtml(product.unit)}</span>
            <span class="price-row-value">${formatCurrency(product.pricePerUnit)}</span>
          </div>
          <div class="price-row total" id="source-total-row">
            <span class="price-row-label">Total Amount</span>
            <span class="price-row-value">${formatCurrency(product.pricePerUnit * 50)}</span>
          </div>
        </div>
      `, `
        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary btn-sm" id="confirm-source-btn">📦 Place B2B Order</button>
      `);

      // Update total on quantity change
      document.getElementById('source-quantity')?.addEventListener('input', (e) => {
        const qty = parseInt(e.target.value) || 0;
        const totalRow = document.querySelector('#source-total-row .price-row-value');
        if (totalRow) totalRow.textContent = formatCurrency(product.pricePerUnit * qty);
      });

      document.getElementById('confirm-source-btn')?.addEventListener('click', async () => {
        const quantity = parseInt(document.getElementById('source-quantity')?.value) || 0;
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
          buyerRole: 'retailer',
          sellerId: product.farmerId,
          sellerName: product.farmerName,
          quantity,
          unit: product.unit,
          totalAmount: quantity * product.pricePerUnit,
        };

        const result = await Marketplace.placeOrder(orderData);

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
        showToast('B2B order placed on blockchain! ⛓️', 'success');
        renderRetailerSource(container);
      });
    });
  });
}
