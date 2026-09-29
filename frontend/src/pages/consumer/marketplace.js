// ============================================
// FarmChain — Consumer Marketplace
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
import { postOrder, updateProduct, API_BASE } from '../../utils/api.js';
import { addFirestoreOrder, updateFirestoreProduct } from '../../firebase/firestore.js';
import { notifyOrderPlaced } from '../../utils/notifications.js';
import { i18n } from '../../i18n/index.js';
import { getIcon } from '../../utils/icons.js';

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
        <header class="glass-header">
          <div class="header-left">
            <div>
              <h2 class="header-title">${i18n.t('consumer.marketplaceTitle') || 'Marketplace'}</h2>
              <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;"><span>${i18n.t('consumer.role') || 'Consumer'}</span> <span>›</span> <span>${i18n.t('consumer.browseProducts') || 'Browse Products'}</span></div>
            </div>
          </div>
          <div class="header-right">
            <div class="saas-search-wrapper">
              <span class="saas-search-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></span>
              <input class="saas-search" type="text" placeholder="${i18n.t('common.searchProducts') || 'Search products...'}" id="search-input" />
            </div>
            
          </div>
        </header>

        <div class="page-content">
          <!-- Filters -->
          <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
            <button class="tab active filter-tab" data-category="all">${i18n.t('common.all') || 'All'}</button>
            <button class="tab filter-tab" data-category="Grains" style="display: inline-flex; align-items: center; gap: 6px;">${getIcon('wheat', 14)} <span>${i18n.t('crops.grains') || 'Grains'}</span></button>
            <button class="tab filter-tab" data-category="Vegetables" style="display: inline-flex; align-items: center; gap: 6px;">${getIcon('sprout', 14)} <span>${i18n.t('crops.vegetables') || 'Vegetables'}</span></button>
            <button class="tab filter-tab" data-category="Fruits" style="display: inline-flex; align-items: center; gap: 6px;">${getIcon('apple', 14)} <span>${i18n.t('crops.fruits') || 'Fruits'}</span></button>
            <button class="tab filter-tab" data-category="Spices" style="display: inline-flex; align-items: center; gap: 6px;">${getIcon('flame', 14)} <span>${i18n.t('crops.spices') || 'Spices'}</span></button>
            <button class="tab filter-tab" data-category="organic" style="display: inline-flex; align-items: center; gap: 6px;">${getIcon('leaf', 14)} <span>${i18n.t('common.organicOnly') || 'Organic Only'}</span></button>
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
                  <div class="product-card-image" style="display: flex; align-items: center; justify-content: center; background: rgba(14, 165, 233, 0.05); color: var(--primary);">
                    ${p.photoUrl ? `<img src="${p.photoUrl}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover;" />` : getIcon('sprout', 44)}
                    ${p.isOrganic ? `<span class="product-card-badge badge-organic" style="display: inline-flex; align-items: center; gap: 4px;">${getIcon('leaf', 12)} ${i18n.t('common.organic') || 'Organic'}</span>` : ''}
                    ${productCerts.length > 0 ? `<span class="product-card-badge badge-verified" style="top: 40px; display: inline-flex; align-items: center; gap: 4px;">${getIcon('checkCircle', 12)} ${i18n.t('common.certified') || 'Certified'}</span>` : ''}
                  </div>
                  <div class="product-card-body">
                    <div class="product-card-name">${escapeHtml(locCrop)}</div>
                    <div class="product-card-origin" style="display: flex; align-items: center; gap: 4px;">${getIcon('mapPin', 12)} ${escapeHtml(p.origin)} · ${i18n.t('common.byAuthor', { author: escapeHtml(p.farmerName) }) || `By ${escapeHtml(p.farmerName)}`}</div>
                    <div style="display: flex; align-items: baseline; gap: 8px;">
                      <div class="product-card-price">${formatCurrency(p.pricePerUnit)}</div>
                      <span class="product-card-unit">${i18n.t('common.perUnit', { unit: locUnit }) || `per ${locUnit}`}</span>
                    </div>
                    <div style="margin-top: 8px; display: flex; gap: 4px; flex-wrap: wrap;">
                      <span class="badge ${prediction.isFairlyPriced ? 'badge-success' : 'badge-warning'}" style="display: inline-flex; align-items: center; gap: 4px;">
                        ${getIcon(prediction.isFairlyPriced ? 'check' : 'alert', 12)}
                        <span>${prediction.isFairlyPriced ? (i18n.t('ai.fairPrice') || 'Fair Price') : (i18n.t('ai.aboveMarket') || 'Above Market')}</span>
                      </span>
                      ${productCerts.map(c => `
                        <span class="badge badge-info" style="display: inline-flex; align-items: center; gap: 4px;">${c.certType === 'organic' ? getIcon('leaf', 12) : getIcon('checkCircle', 12)} ${c.grade}</span>
                      `).join('')}
                    </div>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 8px; line-height: 1.4;">
                      ${p.description ? escapeHtml(p.description.slice(0, 100)) + '...' : ''}
                    </p>
                  </div>
                  <div class="product-card-footer">
                    <button class="btn btn-secondary btn-sm trace-btn" data-product-id="${p.productId}" style="display: inline-flex; align-items: center; gap: 6px;">${getIcon('trace', 14)} <span>${i18n.t('consumer.traceBtn') || 'Trace'}</span></button>
                    <button class="btn btn-primary btn-sm buy-btn" style="color: black !important; font-weight: bold; padding: 10px 18px; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 6px;" data-product='${JSON.stringify(p)}'>${getIcon('shoppingBag', 15)} <span>${i18n.t('consumer.buyBtn') || 'Buy'}</span></button>
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
          <div style="width: 56px; height: 56px; margin: 0 auto 12px; border-radius: 14px; background: rgba(14,165,233,0.12); display: flex; align-items: center; justify-content: center; color: var(--primary);">
            ${getIcon('sprout', 30)}
          </div>
          <h3 style="margin-top: 8px;">${escapeHtml(locCrop)}</h3>
          <p style="color: var(--text-muted);">${i18n.t('consumer.purchaseFrom', { farmer: escapeHtml(product.farmerName), origin: escapeHtml(product.origin) }) || `From ${escapeHtml(product.farmerName)} · ${escapeHtml(product.origin)}`}</p>
        </div>
        <div class="form-group">
          <label class="form-label">${i18n.t('consumer.quantityLabel', { unit: locUnit, max: product.quantity }) || `Quantity (${locUnit}) — Max: ${product.quantity}`}</label>
          <input type="number" class="form-input" id="buy-quantity" value="${defaultQty}" min="1" max="${product.quantity}" />
        </div>
        <div class="price-breakdown" style="margin-top: 16px;" id="price-breakdown-container">
          <div class="price-row">
            <span class="price-row-label" style="display: inline-flex; align-items: center; gap: 6px;">${getIcon('farmer', 14)} <span>${i18n.t('consumer.splitFarmer') || 'Farmer receives (60%)'}</span></span>
            <span class="price-row-value price-farmer" style="color: var(--accent-green);">${formatCurrency(product.pricePerUnit * defaultQty * 0.6)}</span>
          </div>
          <div class="price-row">
            <span class="price-row-label" style="display: inline-flex; align-items: center; gap: 6px;">${getIcon('intermediary', 14)} <span>${i18n.t('consumer.splitIntermediary') || 'Intermediary (20%)'}</span></span>
            <span class="price-row-value price-intermediary">${formatCurrency(product.pricePerUnit * defaultQty * 0.2)}</span>
          </div>
          <div class="price-row">
            <span class="price-row-label" style="display: inline-flex; align-items: center; gap: 6px;">${getIcon('retailer', 14)} <span>${i18n.t('consumer.splitRetailer') || 'Retailer (15%)'}</span></span>
            <span class="price-row-value price-retailer">${formatCurrency(product.pricePerUnit * defaultQty * 0.15)}</span>
          </div>
          <div class="price-row">
            <span class="price-row-label" style="display: inline-flex; align-items: center; gap: 6px;">${getIcon('blockchain', 14)} <span>${i18n.t('consumer.splitPlatform') || 'Platform fee (5%)'}</span></span>
            <span class="price-row-value price-platform">${formatCurrency(product.pricePerUnit * defaultQty * 0.05)}</span>
          </div>
          <div class="price-row total" id="buy-total-row">
            <span class="price-row-label">${i18n.t('common.total') || 'Total'}</span>
            <span class="price-row-value">${formatCurrency(product.pricePerUnit * defaultQty)}</span>
          </div>
        </div>

      `, `
        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('modal-overlay').remove()">${i18n.t('common.cancel') || 'Cancel'}</button>
        <button class="btn btn-primary btn-sm" id="confirm-buy-btn" style="display: inline-flex; align-items: center; gap: 6px;">${getIcon('creditCard', 15)} <span>${i18n.t('consumer.confirmPayBtn') || 'Pay & Record on Blockchain'}</span></button>
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

        showToast('Processing order...', 'info');
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
          pricePerUnit: product.pricePerUnit,
          status: 'pending',
          createdAt: Date.now(),
        };

        // Sync to server using REAL API endpoint
        let savedOrder;
        try {
          const res = await postOrder(orderData);
          savedOrder = res?.data || res || orderData;
        } catch(e) {
          console.warn('Backend order sync failed', e);
          savedOrder = orderData;
          savedOrder.orderId = `ORD-${Date.now()}`;
        }

        store.addItem('orders', savedOrder);

        // Decrement product quantity
        const newQty = Math.max(0, product.quantity - qty);
        store.updateItem('products', p => p.productId === product.productId, {
          quantity: newQty,
        });

        // Sync product quantity to server & Firestore
        updateProduct(product.productId, { quantity: newQty }).catch(e => console.warn('API sync failed:', e));
        updateFirestoreProduct(product.productId, { quantity: newQty }).catch(e => console.warn('Firestore sync failed:', e));

        // Sync to Firestore
        addFirestoreOrder(savedOrder).catch(e => console.warn('Firestore order sync failed:', e));

        // Trigger real-time order notification
        notifyOrderPlaced(savedOrder);

        closeModal();
        
        // Generate Invoice
        let invoiceData = null;
        try {
          const res = await fetch(`${API_BASE}/invoices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(savedOrder)
          });
          if (res.ok) {
            const data = await res.json();
            invoiceData = data.invoice;
          }
        } catch (e) {
          console.warn('Invoice generation failed:', e);
        }
        
        let invoiceActions = '';
        if (invoiceData) {
           invoiceActions = `
             <button class="btn btn-secondary btn-sm" onclick="window.open('${API_BASE}/invoices/${invoiceData.invoiceId}/html')" style="display: inline-flex; align-items: center; gap: 6px;">${getIcon('fileText', 14)} <span>${i18n.t('consumer.viewInvoiceBtn') || 'View Invoice'}</span></button>
             <button class="btn btn-primary btn-sm" onclick="window.open('${API_BASE}/invoices/${invoiceData.invoiceId}/html?print=true')" style="display: inline-flex; align-items: center; gap: 6px;">${getIcon('download', 14)} <span>${i18n.t('consumer.downloadInvoiceBtn') || 'Download Invoice'}</span></button>
           `;
        } else {
           invoiceActions = `
             <button class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">${getIcon('refresh', 14)} <span>${i18n.t('consumer.retryInvoiceBtn') || 'Retry Invoice'}</span></button>
           `;
        }

        createModal(i18n.t('consumer.orderSuccessTitle') || 'ORDER SUCCESSFUL', `
          <div style="text-align: center; margin-bottom: 24px;">
            <p style="font-size: 1.1rem; color: var(--success); font-weight: 500;">${invoiceData ? (i18n.t('consumer.invoiceGenerated') || 'Invoice generated successfully.') : (i18n.t('consumer.invoiceFailed') || 'Order completed, but invoice generation failed.')}</p>
          </div>
          <div style="background: var(--surface-secondary); padding: 16px; border-radius: var(--radius-sm); margin-bottom: 16px; font-size: 0.95rem;">
             <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid var(--border-rule); padding-bottom: 8px;">
               <span style="color: var(--text-secondary);">${i18n.t('consumer.orderId') || 'Order ID'}:</span>
               <strong>${order.orderId}</strong>
             </div>
             <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid var(--border-rule); padding-bottom: 8px;">
               <span style="color: var(--text-secondary);">${i18n.t('consumer.txHash') || 'Transaction Hash'}:</span>
               <strong style="word-break: break-all; font-family: var(--font-mono); font-size: 0.85rem; max-width: 60%; text-align: right;">${txHash}</strong>
             </div>
             <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid var(--border-rule); padding-bottom: 8px;">
               <span style="color: var(--text-secondary);">${i18n.t('consumer.paymentStatus') || 'Payment status'}:</span>
               <strong><span class="badge badge-success">Completed</span></strong>
             </div>
             <div style="display: flex; justify-content: space-between;">
               <span style="color: var(--text-secondary);">${i18n.t('common.total') || 'Total amount'}:</span>
               <strong style="font-size: 1.1rem;">${formatCurrency(order.totalAmount)}</strong>
             </div>
          </div>
        `, `
          ${invoiceActions}
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('modal-overlay').remove()">${i18n.t('common.close') || 'Close'}</button>
        `);

        renderConsumerMarketplace(container);


      });
    });
  });
}
