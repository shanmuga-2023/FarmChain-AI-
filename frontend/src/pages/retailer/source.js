// ============================================
// FarmChain AI — Retailer Source Products Page
// Browse and order available products with supplier info
// Fully Localized (en, hi, ta, te)
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { formatCurrency, getCropEmoji, showToast, createModal, closeModal, getStatusBadge, localizeCropName, localizeUnit, localizeCategory } from '../../utils/helpers.js';
import { escapeHtml, validateOrderQuantity } from '../../utils/sanitize.js';
import { Marketplace } from '../../blockchain/contracts.js';
import { FairPricePredictor } from '../../ai/price-predictor.js';
import { postOrder } from '../../utils/api.js';
import { addFirestoreOrder } from '../../firebase/firestore.js';
import { notifyOrderPlaced } from '../../utils/notifications.js';
import { i18n } from '../../i18n/index.js';

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
              <div class="topbar-title">${i18n.t('retailer.sourceTitle') || 'Source Products 🔍'}</div>
              <div class="topbar-breadcrumb"><span>${i18n.t('retailer.role') || 'Retailer'}</span> <span>›</span> <span>${i18n.t('retailer.navSource') || 'Source'}</span></div>
            </div>
          </div>
          <div class="topbar-right">
            <div class="topbar-search">
              <span class="topbar-search-icon">🔍</span>
              <input type="text" placeholder="${i18n.t('common.searchProducts') || 'Search products...'}" id="source-search" />
            </div>
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>${i18n.t('common.logout') || 'Logout'}</span></button>
          </div>
        </div>

        <div class="page-content">
          <!-- Category Filters -->
          <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
            <button class="tab active source-filter" data-category="all">${i18n.t('common.all') || 'All'}</button>
            <button class="tab source-filter" data-category="Grains">🌾 ${i18n.t('crops.grains') || 'Grains'}</button>
            <button class="tab source-filter" data-category="Vegetables">🥬 ${i18n.t('crops.vegetables') || 'Vegetables'}</button>
            <button class="tab source-filter" data-category="Fruits">🍎 ${i18n.t('crops.fruits') || 'Fruits'}</button>
            <button class="tab source-filter" data-category="Spices">🌶️ ${i18n.t('crops.spices') || 'Spices'}</button>
            <button class="tab source-filter" data-category="organic">🌿 ${i18n.t('common.organicOnly') || 'Organic Only'}</button>
          </div>

          <!-- Product Grid -->
          <div class="data-grid stagger-children" id="source-grid">
            ${allProducts.map(p => {
              const farmer = users[p.farmerId] || {};
              const prediction = FairPricePredictor.predict(p.name.split(' ').pop(), p.quantity, p.pricePerUnit);
              const locCrop = localizeCropName(p.name);
              const locUnit = localizeUnit(p.unit);
              return `
                <div class="product-card source-item" data-category="${escapeHtml(p.category)}" data-organic="${p.isOrganic}" data-name="${escapeHtml((p.name || '').toLowerCase())}">
                  <div class="product-card-image" style="height: 120px;">
                    ${p.emoji || getCropEmoji(p.name)}
                    ${p.isOrganic ? `<span class="product-card-badge badge-organic">🌿 ${i18n.t('common.organic') || 'Organic'}</span>` : ''}
                  </div>
                  <div class="product-card-body">
                    <div class="product-card-name">${escapeHtml(locCrop)}</div>
                    <div class="product-card-origin">📍 ${escapeHtml(p.origin)}</div>
                    <div style="display: flex; align-items: baseline; gap: 8px;">
                      <div class="product-card-price">${formatCurrency(p.pricePerUnit)}</div>
                      <span class="product-card-unit">${i18n.t('common.perUnit', { unit: locUnit }) || `per ${locUnit}`}</span>
                    </div>
                    <div style="margin-top: 6px; font-size: 0.8rem; color: var(--text-muted);">
                      ${p.quantity} ${locUnit} ${i18n.t('common.available') || 'available'}
                    </div>
                    <div style="margin-top: 8px; display: flex; gap: 4px; flex-wrap: wrap;">
                      <span class="badge ${prediction.isFairlyPriced ? 'badge-success' : 'badge-warning'}">
                        🤖 ${prediction.isFairlyPriced ? (i18n.t('ai.fairPrice') || 'Fair Price') : (i18n.t('ai.aboveMarket') || 'Above Market')}
                      </span>
                      ${farmer.rating ? `<span class="badge badge-info">★ ${farmer.rating}</span>` : ''}
                      ${farmer.verified ? `<span class="badge badge-success">✅ ${i18n.t('common.verified') || 'Verified'}</span>` : ''}
                      ${p.aiQualityScore ? `<span class="badge ${p.aiQualityScore >= 80 ? 'badge-success' : p.aiQualityScore >= 50 ? 'badge-warning' : 'badge-danger'}" title="AI Quality Score">🔬 ${p.aiQualityGrade || ''} (${p.aiQualityScore}%)</span>` : ''}
                      ${p.isLiveCapture ? `<span class="badge badge-success" style="font-size: 0.65rem;">📸 ${i18n.t('farmer.gpsChecked') || 'GPS ✓'}</span>` : ''}
                    </div>
                  </div>
                  <div class="product-card-footer">
                    <span class="product-card-meta">${i18n.t('common.byAuthor', { author: escapeHtml(p.farmerName) }) || `By ${escapeHtml(p.farmerName)}`}</span>
                    <button class="btn btn-primary btn-sm source-order-btn" data-product='${JSON.stringify(p)}'>📦 ${i18n.t('retailer.orderBtn') || 'Order'}</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          ${allProducts.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">🔍</div>
              <h3>${i18n.t('retailer.noProducts') || 'No products available'}</h3>
              <p>${i18n.t('retailer.noProductsDesc') || 'Check back later for new products from farmers.'}</p>
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
      const locCrop = localizeCropName(product.name);
      const locUnit = localizeUnit(product.unit);

      createModal(i18n.t('retailer.sourceProductModalTitle') || 'Source Product', `
        <div style="text-align: center; margin-bottom: 16px;">
          <span style="font-size: 3rem;">${product.emoji || getCropEmoji(product.name)}</span>
          <h3 style="margin-top: 8px;">${escapeHtml(locCrop)}</h3>
          <p style="color: var(--text-muted);">${i18n.t('retailer.modalFrom', { farmer: escapeHtml(product.farmerName), origin: escapeHtml(product.origin) }) || `From ${escapeHtml(product.farmerName)} · ${escapeHtml(product.origin)}`}</p>
        </div>
        <div class="form-group">
          <label class="form-label">${i18n.t('retailer.quantityLabel', { unit: locUnit, max: product.quantity }) || `Quantity (${locUnit}) — Max: ${product.quantity}`}</label>
          <input type="number" class="form-input" id="source-quantity" value="50" min="1" max="${product.quantity}" />
        </div>
        <div class="price-breakdown" style="margin-top: 12px;">
          <div class="price-row">
            <span class="price-row-label">${i18n.t('common.pricePerUnitLabel', { unit: locUnit }) || `Price per ${locUnit}`}</span>
            <span class="price-row-value">${formatCurrency(product.pricePerUnit)}</span>
          </div>
          <div class="price-row total" id="source-total-row">
            <span class="price-row-label">${i18n.t('common.totalAmount') || 'Total Amount'}</span>
            <span class="price-row-value">${formatCurrency(product.pricePerUnit * 50)}</span>
          </div>
        </div>
      `, `
        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('modal-overlay').remove()">${i18n.t('common.cancel') || 'Cancel'}</button>
        <button class="btn btn-primary btn-sm" id="confirm-source-btn">📦 ${i18n.t('retailer.placeB2BOrder') || 'Place B2B Order'}</button>
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
        showToast(i18n.t('retailer.orderPlacedSuccess') || 'B2B order placed on blockchain! ⛓️', 'success');
        renderRetailerSource(container);
      });
    });
  });
}
