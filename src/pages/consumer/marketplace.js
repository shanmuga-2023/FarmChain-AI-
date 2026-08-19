// ============================================
// FarmChain AI — Consumer Marketplace
// Browse products, view pricing, place orders
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { formatCurrency, getCropEmoji, showToast, createModal, closeModal, getStatusBadge } from '../../utils/helpers.js';
import { FairPricePredictor } from '../../ai/price-predictor.js';
import { Marketplace } from '../../blockchain/contracts.js';
import { router } from '../../utils/router.js';
import { escapeHtml, validateOrderQuantity } from '../../utils/sanitize.js';
import { postOrder } from '../../utils/api.js';
import { addFirestoreOrder } from '../../firebase/firestore.js';
import { notifyOrderPlaced } from '../../utils/notifications.js';

export function renderConsumerMarketplace(container) {
  const user = store.get('currentUser');
  const products = store.get('products') || [];
  const certs = store.get('certificates') || [];

  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main">
        <div class="topbar">
          <div class="topbar-left">
            <div>
              <div class="topbar-title">Marketplace 🛍️</div>
              <div class="topbar-breadcrumb"><span>Consumer</span> <span>›</span> <span>Browse Products</span></div>
            </div>
          </div>
          <div class="topbar-right">
            <div class="topbar-search">
              <span class="topbar-search-icon">🔍</span>
              <input type="text" placeholder="Search products..." id="search-input" />
            </div>
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>Logout</span></button>
          </div>
        </div>

        <div class="page-content">
          <!-- Filters -->
          <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
            <button class="tab active filter-tab" data-category="all">All</button>
            <button class="tab filter-tab" data-category="Grains">🌾 Grains</button>
            <button class="tab filter-tab" data-category="Vegetables">🥬 Vegetables</button>
            <button class="tab filter-tab" data-category="Fruits">🍎 Fruits</button>
            <button class="tab filter-tab" data-category="Spices">🌶️ Spices</button>
            <button class="tab filter-tab" data-category="organic">🌿 Organic Only</button>
          </div>

          <!-- Product Grid -->
          <div class="data-grid stagger-children" id="marketplace-grid">
            ${products.map(p => {
              const productCerts = certs.filter(c => c.productId === p.productId);
              const prediction = FairPricePredictor.predict(p.name.split(' ').pop(), p.quantity, p.pricePerUnit);

              return `
                <div class="product-card marketplace-item" data-category="${p.category}" data-organic="${p.isOrganic}" data-name="${p.name.toLowerCase()}">
                  <div class="product-card-image">
                    ${p.emoji || getCropEmoji(p.name)}
                    ${p.isOrganic ? '<span class="product-card-badge badge-organic">🌿 Organic</span>' : ''}
                    ${productCerts.length > 0 ? '<span class="product-card-badge badge-verified" style="top: 40px;">✅ Certified</span>' : ''}
                  </div>
                  <div class="product-card-body">
                    <div class="product-card-name">${p.name}</div>
                    <div class="product-card-origin">📍 ${p.origin} · By ${p.farmerName}</div>
                    <div style="display: flex; align-items: baseline; gap: 8px;">
                      <div class="product-card-price">${formatCurrency(p.pricePerUnit)}</div>
                      <span class="product-card-unit">per ${p.unit}</span>
                    </div>
                    <div style="margin-top: 8px; display: flex; gap: 4px; flex-wrap: wrap;">
                      <span class="badge ${prediction.isFairlyPriced ? 'badge-success' : 'badge-warning'}">
                        🤖 ${prediction.isFairlyPriced ? 'Fair Price' : 'Above Market'}
                      </span>
                      ${productCerts.map(c => `
                        <span class="badge badge-info">${c.certType === 'organic' ? '🌿' : '✅'} ${c.grade}</span>
                      `).join('')}
                    </div>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 8px; line-height: 1.4;">
                      ${p.description ? p.description.slice(0, 100) + '...' : ''}
                    </p>
                  </div>
                  <div class="product-card-footer">
                    <button class="btn btn-secondary btn-sm trace-btn" data-product-id="${p.productId}">🔍 Trace</button>
                    <button class="btn btn-primary btn-sm buy-btn" data-product='${JSON.stringify(p)}'>🛒 Buy</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </main>
    </div>
  `;

  // Search
  container.querySelector('#search-input')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    container.querySelectorAll('.marketplace-item').forEach(item => {
      const name = item.dataset.name;
      item.style.display = name.includes(query) ? '' : 'none';
    });
  });

  // Category filters
  container.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const category = tab.dataset.category;

      container.querySelectorAll('.marketplace-item').forEach(item => {
        if (category === 'all') {
          item.style.display = '';
        } else if (category === 'organic') {
          item.style.display = item.dataset.organic === 'true' ? '' : 'none';
        } else {
          item.style.display = item.dataset.category === category ? '' : 'none';
        }
      });
    });
  });

  // Trace buttons
  container.querySelectorAll('.trace-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      router.navigate(`/consumer/trace?id=${btn.dataset.productId}`);
    });
  });

  // Buy buttons
  container.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const product = JSON.parse(btn.dataset.product);
      const defaultQty = Math.min(5, product.quantity);

      createModal('Purchase Product', `
        <div style="text-align: center; margin-bottom: 16px;">
          <span style="font-size: 3rem;">${product.emoji || getCropEmoji(product.name)}</span>
          <h3 style="margin-top: 8px;">${escapeHtml(product.name)}</h3>
          <p style="color: var(--text-muted);">From ${escapeHtml(product.farmerName)} · ${escapeHtml(product.origin)}</p>
        </div>
        <div class="form-group">
          <label class="form-label">Quantity (${escapeHtml(product.unit)}) — Max: ${product.quantity}</label>
          <input type="number" class="form-input" id="buy-quantity" value="${defaultQty}" min="1" max="${product.quantity}" />
        </div>
        <div class="price-breakdown" style="margin-top: 16px;" id="price-breakdown-container">
          <div class="price-row">
            <span class="price-row-label">🌾 Farmer receives (60%)</span>
            <span class="price-row-value price-farmer" style="color: var(--accent-green);">${formatCurrency(product.pricePerUnit * defaultQty * 0.6)}</span>
          </div>
          <div class="price-row">
            <span class="price-row-label">🏪 Intermediary (20%)</span>
            <span class="price-row-value price-intermediary">${formatCurrency(product.pricePerUnit * defaultQty * 0.2)}</span>
          </div>
          <div class="price-row">
            <span class="price-row-label">🛒 Retailer (15%)</span>
            <span class="price-row-value price-retailer">${formatCurrency(product.pricePerUnit * defaultQty * 0.15)}</span>
          </div>
          <div class="price-row">
            <span class="price-row-label">⛓️ Platform fee (5%)</span>
            <span class="price-row-value price-platform">${formatCurrency(product.pricePerUnit * defaultQty * 0.05)}</span>
          </div>
          <div class="price-row total" id="buy-total-row">
            <span class="price-row-label">Total</span>
            <span class="price-row-value">${formatCurrency(product.pricePerUnit * defaultQty)}</span>
          </div>
        </div>
        <div class="ai-insight-card" style="background: var(--accent-green-dim); border-color: rgba(34,197,94,0.2); margin-top: 16px;">
          <div class="ai-insight-title">🤖 AI Transparency Score</div>
          <div class="ai-insight-desc">This purchase is fully traceable on the blockchain. 60% of your payment goes directly to the farmer.</div>
        </div>
      `, `
        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary btn-sm" id="confirm-buy-btn">💳 Pay & Record on Blockchain</button>
      `);

      // Dynamic price breakdown update on quantity change
      document.getElementById('buy-quantity')?.addEventListener('input', (e) => {
        const qty = parseInt(e.target.value) || 0;
        const total = product.pricePerUnit * qty;
        const el = (sel) => document.querySelector(sel);
        const farmer = el('.price-farmer');
        const inter = el('.price-intermediary');
        const retail = el('.price-retailer');
        const plat = el('.price-platform');
        const tot = el('#buy-total-row .price-row-value');
        if (farmer) farmer.textContent = formatCurrency(total * 0.6);
        if (inter) inter.textContent = formatCurrency(total * 0.2);
        if (retail) retail.textContent = formatCurrency(total * 0.15);
        if (plat) plat.textContent = formatCurrency(total * 0.05);
        if (tot) tot.textContent = formatCurrency(total);
      });

      document.getElementById('confirm-buy-btn')?.addEventListener('click', async () => {
        const qty = parseInt(document.getElementById('buy-quantity')?.value) || 0;
        const validation = validateOrderQuantity(qty, product.quantity);
        if (!validation.valid) {
          showToast(validation.errors[0], 'error');
          return;
        }

        const orderData = {
          productId: product.productId,
          productName: product.name,
          buyerId: user.id,
          buyerName: user.name,
          buyerRole: 'consumer',
          sellerId: product.farmerId,
          sellerName: product.farmerName,
          quantity: qty,
          unit: product.unit,
          totalAmount: qty * product.pricePerUnit,
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
          quantity: product.quantity - qty,
        });

        // Sync to server
        postOrder(order);

        // Sync to Firestore
        addFirestoreOrder(order);

        // Trigger real-time order notification
        notifyOrderPlaced(order);

        closeModal();
        showToast('Order placed! Payment recorded on blockchain ⛓️', 'success');
      });
    });
  });
}
