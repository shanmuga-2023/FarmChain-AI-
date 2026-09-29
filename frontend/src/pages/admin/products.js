// ============================================
// FarmChain — Admin Product Management
// View, edit, and delete all products across roles
// Fully Localized (en, hi, ta, te)
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { formatCurrency, getCropEmoji, getProductImage, showToast, createModal, closeModal, getStatusBadge, timeAgo, localizeCropName, localizeUnit, localizeCategory } from '../../utils/helpers.js';
import { escapeHtml, validateProductInput } from '../../utils/sanitize.js';
import { updateProduct, deleteProduct } from '../../utils/api.js';
import { i18n } from '../../i18n/index.js';
import { getIcon } from '../../utils/icons.js';

export function renderAdminProducts(container) {
  const products = store.get('products') || [];
  const orders = store.get('orders') || [];

  const categoryCounts = {};
  products.forEach(p => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });
  const totalValue = products.reduce((s, p) => s + (p.pricePerUnit || 0) * (p.quantity || 0), 0);

  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main">
        <header class="glass-header">
          <div class="header-left">
            <div>
              <h2 class="header-title">${i18n.t('admin.productsTitle') || 'Product Management '}</h2>
              <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;"><span>${i18n.t('admin.role') || 'Admin'}</span> <span>›</span> <span>${i18n.t('admin.navProducts') || 'Products'}</span></div>
            </div>
          </div>
          <div class="header-right">
            <div class="saas-search-wrapper">
              <span class="saas-search-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></span>
              <input class="saas-search" type="text" placeholder="${i18n.t('common.searchProducts') || 'Search products...'}" id="admin-product-search" />
            </div>
            
          </div>
        </header>

        <div class="page-content">
          <!-- Stats -->
          <div class="dashboard-stats">
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-green-dim); color: var(--accent-green);"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div>
              <div class="stat-card-value">${products.length}</div>
              <div class="stat-card-label">${i18n.t('admin.statProducts') || 'Total Products'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-cyan-dim); color: var(--accent-cyan);"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
              <div class="stat-card-value">${formatCurrency(totalValue)}</div>
              <div class="stat-card-label">${i18n.t('admin.statInventoryValue') || 'Total Inventory Value'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-amber-dim); color: var(--accent-amber);"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
              <div class="stat-card-value">${Object.keys(categoryCounts).length}</div>
              <div class="stat-card-label">${i18n.t('admin.statCategories') || 'Categories'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-purple-dim); color: var(--accent-purple);">${getIcon('sprout', 22)}</div>
              <div class="stat-card-value">${products.filter(p => p.isOrganic).length}</div>
              <div class="stat-card-label">${i18n.t('admin.statOrganicProducts') || 'Organic Products'}</div>
            </div>
          </div>

          <!-- Category Filter Tabs -->
          <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
            <button class="tab active product-filter-tab" data-category="all">${i18n.t('common.all') || 'All'}</button>
            ${Object.keys(categoryCounts).map(cat => `
              <button class="tab product-filter-tab" data-category="${cat}">${getCropEmoji(cat)} ${localizeCategory(cat)} (${categoryCounts[cat]})</button>
            `).join('')}
          </div>

          <!-- Products Table -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">${i18n.t('admin.allPlatformProducts') || 'All Platform Products'}</div>
            </div>
            ${products.length > 0 ? `
              <table class="data-table">
                <thead>
                  <tr>
                    <th>${i18n.t('common.product') || 'Product'}</th>
                    <th>${i18n.t('farmer.role') || 'Farmer'}</th>
                    <th>${i18n.t('admin.categoryCol') || 'Category'}</th>
                    <th>${i18n.t('common.quantity') || 'Qty'}</th>
                    <th>${i18n.t('common.price') || 'Price'}</th>
                    <th>${i18n.t('common.status') || 'Status'}</th>
                    <th>${i18n.t('admin.addedCol') || 'Added'}</th>
                    <th>${i18n.t('common.actions') || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody id="admin-products-tbody">
                  ${products.map(p => {
                    const badge = getStatusBadge(p.status || 'available');
                    const locCrop = localizeCropName(p.name);
                    const locUnit = localizeUnit(p.unit);
                    const locCat = localizeCategory(p.category);
                    return `
                      <tr class="admin-product-row" data-category="${p.category}" data-name="${escapeHtml((p.name || '').toLowerCase())}">
                        <td>
                          <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 38px; height: 38px; border-radius: 8px; overflow: hidden; background: rgba(255,255,255,0.06); flex-shrink: 0; box-shadow: 0 1px 4px rgba(0,0,0,0.15);">
                              <img src="${p.photoUrl || getProductImage(p.name)}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null;this.src='/products/fresh-tomatoes.jpg';" />
                            </div>
                            <div>
                              <div style="font-weight: 600;">${escapeHtml(locCrop)}</div>
                              <div style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace;">${escapeHtml((p.productId || '').slice(0, 16))}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style="font-weight: 500;">${escapeHtml(p.farmerName || 'N/A')}</div>
                          <div style="font-size: 0.72rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                            ${getIcon('mapPin', 12)}
                            <span>${escapeHtml(p.origin || 'N/A')}</span>
                          </div>
                        </td>
                        <td><span class="badge badge-info">${escapeHtml(locCat || 'N/A')}</span></td>
                        <td style="font-weight: 600;">${p.quantity || 0} ${escapeHtml(locUnit)}</td>
                        <td style="color: var(--accent-green); font-weight: 600;">${formatCurrency(p.pricePerUnit || 0)}</td>
                        <td><span class="badge ${badge.class}">${badge.icon} ${badge.label}</span></td>
                        <td style="font-size: 0.8rem; color: var(--text-muted);">${p.createdAt ? timeAgo(p.createdAt) : 'N/A'}</td>
                        <td>
                          <div style="display: flex; gap: 6px;">
                            <button class="btn btn-secondary btn-sm admin-edit-btn" data-product-id="${p.productId}" style="font-size: 0.75rem; padding: 5px 10px; display: inline-flex; align-items: center; gap: 4px;">
                              ${getIcon('edit', 12)}
                              <span>${i18n.t('common.edit') || 'Edit'}</span>
                            </button>
                            <button class="btn btn-secondary btn-sm admin-delete-btn" data-product-id="${p.productId}" style="font-size: 0.75rem; padding: 5px 8px; color: var(--accent-red); border-color: rgba(239,68,68,0.3); display: inline-flex; align-items: center; justify-content: center;" title="${i18n.t('common.delete') || 'Delete'}">
                              ${getIcon('trash', 13)}
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            ` : `
              <div class="empty-state" style="padding: 48px 24px; text-align: center;">
                <div class="empty-state-icon" style="display: flex; justify-content: center; margin-bottom: 12px; color: var(--text-muted);">${getIcon('package', 44)}</div>
                <h3>${i18n.t('admin.noProductsOnPlatform') || 'No products on platform'}</h3>
                <p style="color: var(--text-muted);">${i18n.t('admin.noProductsDesc') || 'Products will appear here when farmers register them.'}</p>
              </div>
            `}
          </div>
        </div>
      </main>
    </div>
  `;

  // Search
  container.querySelector('#admin-product-search')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    container.querySelectorAll('.admin-product-row').forEach(row => {
      const name = row.dataset.name;
      row.style.display = name.includes(query) ? '' : 'none';
    });
  });

  // Category filter tabs
  container.querySelectorAll('.product-filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.product-filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.category;
      container.querySelectorAll('.admin-product-row').forEach(row => {
        row.style.display = cat === 'all' || row.dataset.category === cat ? '' : 'none';
      });
    });
  });

  // Edit buttons
  container.querySelectorAll('.admin-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const productId = btn.dataset.productId;
      const product = products.find(p => p.productId === productId);
      if (product) showAdminEditModal(container, product);
    });
  });

  // Delete buttons
  container.querySelectorAll('.admin-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const productId = btn.dataset.productId;
      const product = products.find(p => p.productId === productId);
      if (!product) return;

      if (!confirm(`Admin: Delete "${product.name}" by ${product.farmerName}? This cannot be undone.`)) return;

      btn.disabled = true;
      try {
        store.removeItem('products', p => p.productId === productId);
        store.removeItem('listings', l => l.productId === productId);
        deleteProduct(productId).catch(err => console.warn('Backend delete sync:', err));
        deleteFirestoreProduct(productId).catch(err => console.warn('Firestore delete sync:', err));
        showToast(i18n.t('admin.productDeletedToast', { name: product.name }) || `Product "${product.name}" deleted by admin`, 'success');
        renderAdminProducts(container);
      } catch (err) {
        showToast('Delete failed: ' + err.message, 'error');
        btn.disabled = false;
      }
    });
  });
}

function showAdminEditModal(container, product) {
  createModal(i18n.t('admin.editProductModalTitle') || 'Admin: Edit Product', `
    <div style="background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.2); border-radius: var(--radius-md); padding: 10px 14px; margin-bottom: 16px;">
      <div style="font-size: 0.8rem; color: var(--accent-red); font-weight: 600; display: flex; align-items: center; gap: 6px;">${getIcon('alert', 14, '', 'color: var(--accent-red);')} ${i18n.t('admin.editModeNotice') || 'Admin Edit Mode'}</div>
      <div style="font-size: 0.75rem; color: var(--text-muted);">${i18n.t('admin.editingItem', { name: escapeHtml(product.name), farmer: escapeHtml(product.farmerName) }) || `Editing: ${escapeHtml(product.name)} by ${escapeHtml(product.farmerName)}`}</div>
    </div>
    <div class="form-group">
      <label class="form-label">${i18n.t('farmer.wizardCropName') || 'Product Name'}</label>
      <input type="text" class="form-input" id="admin-edit-name" value="${escapeHtml(product.name)}" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">${i18n.t('admin.categoryCol') || 'Category'}</label>
        <select class="form-select" id="admin-edit-category">
          ${['Grains', 'Vegetables', 'Fruits', 'Spices', 'Cash Crops'].map(c => `
            <option value="${c}" ${product.category === c ? 'selected' : ''}>${localizeCategory(c)}</option>
          `).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">${i18n.t('common.status') || 'Status'}</label>
        <select class="form-select" id="admin-edit-status">
          <option value="available" ${product.status === 'available' ? 'selected' : ''}>${i18n.t('status.available') || 'Available'}</option>
          <option value="sold" ${product.status === 'sold' ? 'selected' : ''}>${i18n.t('status.soldOut') || 'Sold Out'}</option>
          <option value="reserved" ${product.status === 'reserved' ? 'selected' : ''}>${i18n.t('status.reserved') || 'Reserved'}</option>
          <option value="suspended" ${product.status === 'suspended' ? 'selected' : ''}>${i18n.t('status.suspended') || 'Suspended'}</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">${i18n.t('common.quantity') || 'Quantity'}</label>
        <input type="number" class="form-input" id="admin-edit-quantity" value="${product.quantity}" />
      </div>
      <div class="form-group">
        <label class="form-label">${i18n.t('common.pricePerUnit') || 'Price per Unit (₹)'}</label>
        <input type="number" class="form-input" id="admin-edit-price" value="${product.pricePerUnit}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">${i18n.t('farmer.wizardDescription') || 'Description'}</label>
      <textarea class="form-textarea" id="admin-edit-desc">${escapeHtml(product.description || '')}</textarea>
    </div>
  `, `
    <button class="btn btn-secondary btn-sm" onclick="document.getElementById('modal-overlay').remove()">${i18n.t('common.cancel') || 'Cancel'}</button>
    <button class="btn btn-primary btn-sm" id="admin-save-edit-btn" style="display: inline-flex; align-items: center; gap: 6px;">${getIcon('check', 14)} ${i18n.t('admin.saveChangesBtn') || 'Save Changes (Admin)'}</button>
  `);

  document.getElementById('admin-save-edit-btn')?.addEventListener('click', async () => {
    const name = document.getElementById('admin-edit-name')?.value;
    const category = document.getElementById('admin-edit-category')?.value;
    const quantity = parseInt(document.getElementById('admin-edit-quantity')?.value);
    const price = parseInt(document.getElementById('admin-edit-price')?.value);
    const status = document.getElementById('admin-edit-status')?.value;
    const description = document.getElementById('admin-edit-desc')?.value;

    const validation = validateProductInput({ name, quantity, price });
    if (!validation.valid) {
      showToast(validation.errors[0], 'error');
      return;
    }

    const saveBtn = document.getElementById('admin-save-edit-btn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = `<span class="spinner" style="width: 14px; height: 14px;"></span> ${i18n.t('admin.saving') || 'Saving...'}`;
    }

    try {
      const updates = {
        name: name.trim(),
        category,
        quantity,
        pricePerUnit: price,
        status,
        description: description?.trim() || '',
        emoji: getCropEmoji(name),
        updatedAt: Date.now(),
      };

      store.updateItem('products', p => p.productId === product.productId, updates);
      updateProduct(product.productId, updates).catch(err => console.warn('Backend update sync:', err));
      updateFirestoreProduct(product.productId, updates).catch(err => console.warn('Firestore update sync:', err));

      closeModal();
      showToast(i18n.t('admin.productUpdatedToast', { name }) || `"${name}" updated by admin`, 'success');
      renderAdminProducts(container);
    } catch (err) {
      showToast('Update failed: ' + err.message, 'error');
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `${getIcon('check', 14)} ${i18n.t('admin.saveChangesBtn') || 'Save Changes (Admin)'}`;
      }
    }
  });
}
