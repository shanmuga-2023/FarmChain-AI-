// ============================================
// FarmChain AI — Consumer Marketplace
// Browse products, view pricing, place orders
// Fully Localized (en, hi, ta, te)
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { formatCurrency, getCropEmoji, showToast, createModal, closeModal, getStatusBadge, localizeCropName, localizeUnit, localizeCategory } from '../../utils/helpers.js';
import { FairPricePredictor } from '../../ai/price-predictor.js';
import { Marketplace } from '../../blockchain/contracts.js';
import { router } from '../../utils/router.js';
import { escapeHtml, validateOrderQuantity } from '../../utils/sanitize.js';
import { postOrder, updateProduct } from '../../utils/api.js';
import { addFirestoreOrder, updateFirestoreProduct } from '../../firebase/firestore.js';
import { notifyOrderPlaced } from '../../utils/notifications.js';
import { i18n } from '../../i18n/index.js';

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
              <div class="topbar-title">${i18n.t('consumer.marketplaceTitle') || 'Marketplace 🛍️'}</div>
              <div class="topbar-breadcrumb"><span>${i18n.t('consumer.role') || 'Consumer'}</span> <span>›</span> <span>${i18n.t('consumer.browseProducts') || 'Browse Products'}</span></div>
            </div>
          </div>
          <div class="topbar-right">
            <div class="topbar-search">
              <span class="topbar-search-icon">🔍</span>
              <input type="text" placeholder="${i18n.t('common.searchProducts') || 'Search products...'}" id="search-input" />
            </div>
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>${i18n.t('common.logout') || 'Logout'}</span></button>
          </div>
        </div>

        <div class="page-content">
          <!-- Filters -->
          <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
            <button class="tab active filter-tab" data-category="all">${i18n.t('common.all') || 'All'}</button>
            <button class="tab filter-tab" data-category="Grains">🌾 ${i18n.t('crops.grains') || 'Grains'}</button>
            <button class="tab filter-tab" data-category="Vegetables">🥬 ${i18n.t('crops.vegetables') || 'Vegetables'}</button>
            <button class="tab filter-tab" data-category="Fruits">🍎 ${i18n.t('crops.fruits') || 'Fruits'}</button>
            <button class="tab filter-tab" data-category="Spices">🌶️ ${i18n.t('crops.spices') || 'Spices'}</button>
            <button class="tab filter-tab" data-category="organic">🌿 ${i18n.t('common.organicOnly') || 'Organic Only'}</button>
          </div>

          <!-- Product Grid -->
          <div class="data-grid stagger-children" id="marketplace-grid">
            ${products.map(p => {
              const productCerts = certs.filter(c => c.productId === p.productId);
              const prediction = FairPricePredictor.predict(p.name.split(' ').pop(), p.quantity, p.pricePerUnit);
              const locCrop = localizeCropName(p.name);
              const locUnit = localizeUnit(p.unit);

              return `
                <div class="product-card marketplace-item" data-category="${p.category}" data-organic="${p.isOrganic}" data-name="${p.name.toLowerCase()}">
                  <div class="product-card-image">
                    ${p.emoji || getCropEmoji(p.name)}
                    ${p.isOrganic ? `<span class="product-card-badge badge-organic">🌿 ${i18n.t('common.organic') || 'Organic'}</span>` : ''}
                    ${productCerts.length > 0 ? `<span class="product-card-badge badge-verified" style="top: 40px;">✅ ${i18n.t('common.certified') || 'Certified'}</span>` : ''}
                  </div>
                  <div class="product-card-body">
                    <div class="product-card-name">${escapeHtml(locCrop)}</div>
                    <div class="product-card-origin">📍 ${escapeHtml(p.origin)} · ${i18n.t('common.byAuthor', { author: escapeHtml(p.farmerName) }) || `By ${escapeHtml(p.farmerName)}`}</div>
                    <div style="display: flex; align-items: baseline; gap: 8px;">
                      <div class="product-card-price">${formatCurrency(p.pricePerUnit)}</div>
                      <span class="product-card-unit">${i18n.t('common.perUnit', { unit: locUnit }) || `per ${locUnit}`}</span>
                    </div>
                    <div style="margin-top: 8px; display: flex; gap: 4px; flex-wrap: wrap;">
                      <span class="badge ${prediction.isFairlyPriced ? 'badge-success' : 'badge-warning'}">
                        🤖 ${prediction.isFairlyPriced ? (i18n.t('ai.fairPrice') || 'Fair Price') : (i18n.t('ai.aboveMarket') || 'Above Market')}
                      </span>
                      ${productCerts.map(c => `
                        <span class="badge badge-info">${c.certType === 'organic' ? '🌿' : '✅'} ${c.grade}</span>
                      `).join('')}
                    </div>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 8px; line-height: 1.4;">
                      ${p.description ? escapeHtml(p.description.slice(0, 100)) + '...' : ''}
                    </p>
                  </div>
                  <div class="product-card-footer">
                    <button class="btn btn-secondary btn-sm trace-btn" data-product-id="${p.productId}">🔍 ${i18n.t('consumer.traceBtn') || 'Trace'}</button>
                    <button class="btn btn-primary btn-sm buy-btn" data-product='${JSON.stringify(p)}'>🛒 ${i18n.t('consumer.buyBtn') || 'Buy'}</button>
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
      const locCrop = localizeCropName(product.name);
      const locUnit = localizeUnit(product.unit);

      createModal(i18n.t('consumer.purchaseModalTitle') || 'Purchase Product', `
        <div style="text-align: center; margin-bottom: 16px;">
          <span style="font-size: 3rem;">${product.emoji || getCropEmoji(product.name)}</span>
          <h3 style="margin-top: 8px;">${escapeHtml(locCrop)}</h3>
          <p style="color: var(--text-muted);">${i18n.t('consumer.purchaseFrom', { farmer: escapeHtml(product.farmerName), origin: escapeHtml(product.origin) }) || `From ${escapeHtml(product.farmerName)} · ${escapeHtml(product.origin)}`}</p>
        </div>
        <div class="form-group">
          <label class="form-label">${i18n.t('consumer.quantityLabel', { unit: locUnit, max: product.quantity }) || `Quantity (${locUnit}) — Max: ${product.quantity}`}</label>
          <input type="number" class="form-input" id="buy-quantity" value="${defaultQty}" min="1" max="${product.quantity}" />
        </div>
        <div class="price-breakdown" style="margin-top: 16px;" id="price-breakdown-container">
          <div class="price-row">
            <span class="price-row-label">${i18n.t('consumer.splitFarmer') || '🌾 Farmer receives (60%)'}</span>
            <span class="price-row-value price-farmer" style="color: var(--accent-green);">${formatCurrency(product.pricePerUnit * defaultQty * 0.6)}</span>
          </div>
          <div class="price-row">
            <span class="price-row-label">${i18n.t('consumer.splitIntermediary') || '🏪 Intermediary (20%)'}</span>
            <span class="price-row-value price-intermediary">${formatCurrency(product.pricePerUnit * defaultQty * 0.2)}</span>
          </div>
          <div class="price-row">
            <span class="price-row-label">${i18n.t('consumer.splitRetailer') || '🛒 Retailer (15%)'}</span>
            <span class="price-row-value price-retailer">${formatCurrency(product.pricePerUnit * defaultQty * 0.15)}</span>
          </div>
          <div class="price-row">
            <span class="price-row-label">${i18n.t('consumer.splitPlatform') || '⛓️ Platform fee (5%)'}</span>
            <span class="price-row-value price-platform">${formatCurrency(product.pricePerUnit * defaultQty * 0.05)}</span>
          </div>
          <div class="price-row total" id="buy-total-row">
            <span class="price-row-label">${i18n.t('common.total') || 'Total'}</span>
            <span class="price-row-value">${formatCurrency(product.pricePerUnit * defaultQty)}</span>
          </div>
        </div>
        <div class="ai-insight-card" style="background: var(--accent-green-dim); border-color: rgba(34,197,94,0.2); margin-top: 16px;">
          <div class="ai-insight-title">${i18n.t('consumer.aiTransparencyTitle') || '🤖 AI Transparency Score'}</div>
          <div class="ai-insight-desc">${i18n.t('consumer.aiTransparencyDesc') || 'This purchase is fully traceable on the blockchain. 60% of your payment goes directly to the farmer.'}</div>
        </div>
      `, `
        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('modal-overlay').remove()">${i18n.t('common.cancel') || 'Cancel'}</button>
        <button class="btn btn-primary btn-sm" id="confirm-buy-btn">💳 ${i18n.t('consumer.confirmPayBtn') || 'Pay & Record on Blockchain'}</button>
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

        // Use blockchain-returned orderId
        const order = {
          ...orderData,
          orderId: result.transaction.orderId,
          pricePerUnit: product.pricePerUnit,
          status: 'pending',
          createdAt: Date.now(),
        };

        store.addItem('orders', order);

        // Decrement product quantity
        const newQty = Math.max(0, product.quantity - qty);
        store.updateItem('products', p => p.productId === product.productId, {
          quantity: newQty,
        });

        // Sync product quantity to server & Firestore
        updateProduct(product.productId, { quantity: newQty }).catch(e => console.warn('API sync failed:', e));
        updateFirestoreProduct(product.productId, { quantity: newQty }).catch(e => console.warn('Firestore sync failed:', e));

        // Sync to server
        postOrder(order);

        // Sync to Firestore
        addFirestoreOrder(order);

        // Trigger real-time order notification
        notifyOrderPlaced(order);

        closeModal();
        showToast(i18n.t('consumer.orderSuccessToast') || 'Order placed! Payment recorded on blockchain ⛓️', 'success');
        renderConsumerMarketplace(container);
      });
    });
  });
}
