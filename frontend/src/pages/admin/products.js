// ============================================
// FarmChain AI — Admin Product Management
// View, edit, and delete all products across roles
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { formatCurrency, getCropEmoji, showToast, createModal, closeModal, getStatusBadge, timeAgo } from '../../utils/helpers.js';
import { escapeHtml, validateProductInput } from '../../utils/sanitize.js';
import { updateProduct, deleteProduct } from '../../utils/api.js';
import { updateFirestoreProduct, deleteFirestoreProduct } from '../../firebase/firestore.js';

export function renderAdminProducts(container) {
  const products = store.get('products') || [];
  const orders = store.get('orders') || [];

  // Category counts
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
        <div class="topbar">
          <div class="topbar-left">
            <div>
              <div class="topbar-title">Product Management 📦</div>
              <div class="topbar-breadcrumb"><span>Admin</span> <span>›</span> <span>Products</span></div>
            </div>
          </div>
          <div class="topbar-right">
            <div class="topbar-search">
              <span class="topbar-search-icon">🔍</span>
              <input type="text" placeholder="Search products..." id="admin-product-search" />
            </div>
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>Logout</span></button>
          </div>
        </div>

        <div class="page-content">
          <!-- Stats -->
          <div class="dashboard-stats stagger-children">
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-green-dim); color: var(--accent-green);">📦</div>
              <div class="stat-card-value">${products.length}</div>
              <div class="stat-card-label">Total Products</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-cyan-dim); color: var(--accent-cyan);">💰</div>
              <div class="stat-card-value">${formatCurrency(totalValue)}</div>
              <div class="stat-card-label">Total Inventory Value</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-amber-dim); color: var(--accent-amber);">📊</div>
              <div class="stat-card-value">${Object.keys(categoryCounts).length}</div>
              <div class="stat-card-label">Categories</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-purple-dim); color: var(--accent-purple);">🌿</div>
              <div class="stat-card-value">${products.filter(p => p.isOrganic).length}</div>
              <div class="stat-card-label">Organic Products</div>
            </div>
          </div>

          <!-- Category Filter Tabs -->
          <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
            <button class="tab active product-filter-tab" data-category="all">All</button>
            ${Object.keys(categoryCounts).map(cat => `
              <button class="tab product-filter-tab" data-category="${cat}">${getCropEmoji(cat)} ${cat} (${categoryCounts[cat]})</button>
            `).join('')}
          </div>

          <!-- Products Table -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">All Platform Products</div>
            </div>
            ${products.length > 0 ? `
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Farmer</th>
                    <th>Category</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="admin-products-tbody">
                  ${products.map(p => {
                    const badge = getStatusBadge(p.status || 'available');
                    return `
                      <tr class="admin-product-row" data-category="${p.category}" data-name="${escapeHtml((p.name || '').toLowerCase())}">
                        <td>
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1.3rem;">${p.emoji || getCropEmoji(p.name)}</span>
                            <div>
                              <div style="font-weight: 600;">${escapeHtml(p.name)}</div>
                              <div style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace;">${escapeHtml((p.productId || '').slice(0, 16))}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style="font-weight: 500;">${escapeHtml(p.farmerName || 'N/A')}</div>
                          <div style="font-size: 0.72rem; color: var(--text-muted);">📍 ${escapeHtml(p.origin || 'N/A')}</div>
                        </td>
                        <td><span class="badge badge-info">${escapeHtml(p.category || 'N/A')}</span></td>
                        <td style="font-weight: 600;">${p.quantity || 0} ${escapeHtml(p.unit || 'kg')}</td>
                        <td style="color: var(--accent-green); font-weight: 600;">${formatCurrency(p.pricePerUnit || 0)}</td>
                        <td><span class="badge ${badge.class}">${badge.icon} ${badge.label}</span></td>
                        <td style="font-size: 0.8rem; color: var(--text-muted);">${p.createdAt ? timeAgo(p.createdAt) : 'N/A'}</td>
                        <td>
                          <div style="display: flex; gap: 4px;">
                            <button class="btn btn-secondary btn-sm admin-edit-btn" data-product-id="${p.productId}" style="font-size: 0.7rem; padding: 4px 8px;">✏️ Edit</button>
                            <button class="btn btn-secondary btn-sm admin-delete-btn" data-product-id="${p.productId}" style="font-size: 0.7rem; padding: 4px 8px; color: var(--accent-red); border-color: rgba(239,68,68,0.3);">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            ` : `
              <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <h3>No products on platform</h3>
                <p>Products will appear here when farmers register them.</p>
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
        showToast(`Product "${product.name}" deleted by admin 🗑️`, 'success');
        renderAdminProducts(container);
      } catch (err) {
        showToast('Delete failed: ' + err.message, 'error');
        btn.disabled = false;
      }
    });
  });
}

function showAdminEditModal(container, product) {
  createModal('Admin: Edit Product', `
    <div style="background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.2); border-radius: var(--radius-md); padding: 10px 14px; margin-bottom: 16px;">
      <div style="font-size: 0.8rem; color: var(--accent-red); font-weight: 600;">⚠️ Admin Edit Mode</div>
      <div style="font-size: 0.75rem; color: var(--text-muted);">Editing: ${escapeHtml(product.name)} by ${escapeHtml(product.farmerName)}</div>
    </div>
    <div class="form-group">
      <label class="form-label">Product Name</label>
      <input type="text" class="form-input" id="admin-edit-name" value="${escapeHtml(product.name)}" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-select" id="admin-edit-category">
          ${['Grains', 'Vegetables', 'Fruits', 'Spices', 'Cash Crops'].map(c => `
            <option value="${c}" ${product.category === c ? 'selected' : ''}>${c}</option>
          `).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-select" id="admin-edit-status">
          <option value="available" ${product.status === 'available' ? 'selected' : ''}>Available</option>
          <option value="sold" ${product.status === 'sold' ? 'selected' : ''}>Sold Out</option>
          <option value="reserved" ${product.status === 'reserved' ? 'selected' : ''}>Reserved</option>
          <option value="suspended" ${product.status === 'suspended' ? 'selected' : ''}>Suspended</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Quantity</label>
        <input type="number" class="form-input" id="admin-edit-quantity" value="${product.quantity}" />
      </div>
      <div class="form-group">
        <label class="form-label">Price per Unit (₹)</label>
        <input type="number" class="form-input" id="admin-edit-price" value="${product.pricePerUnit}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea class="form-textarea" id="admin-edit-desc">${escapeHtml(product.description || '')}</textarea>
    </div>
  `, `
    <button class="btn btn-secondary btn-sm" onclick="document.getElementById('modal-overlay').remove()">Cancel</button>
    <button class="btn btn-primary btn-sm" id="admin-save-edit-btn">💾 Save Changes (Admin)</button>
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
      saveBtn.innerHTML = '<span class="spinner" style="width: 14px; height: 14px;"></span> Saving...';
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
      showToast(`"${name}" updated by admin ✏️`, 'success');
      renderAdminProducts(container);
    } catch (err) {
      showToast('Update failed: ' + err.message, 'error');
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '💾 Save Changes (Admin)';
      }
    }
  });
}
