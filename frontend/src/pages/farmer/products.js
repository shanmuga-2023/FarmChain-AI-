// ============================================
// FarmChain — Farmer Products Management
// Dual-Mode (Voice + Manual) Guided Wizard Integration
// Multilingual Regional Support (Tamil, Hindi, Telugu, English)
// Zero Blockchain Terminology Exposed to Farmers
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { formatCurrency, formatNumber, formatDate, formatDateTime, getCropEmoji, showToast, createModal, closeModal, getStatusBadge, localizeCropName, localizeUnit, localizeLocation, localizeCategory } from '../../utils/helpers.js';
import { FairPricePredictor } from '../../ai/price-predictor.js';
import { generateProductQR, createQRDisplay } from '../../utils/qr.js';
import { validateProductInput } from '../../utils/sanitize.js';
import { updateProduct, deleteProduct } from '../../utils/api.js';
import { updateFirestoreProduct, deleteFirestoreProduct } from '../../firebase/firestore.js';
import { QualityGuard } from '../../ai/quality-guard.js';
import { i18n } from '../../i18n/index.js';
import { FarmerProductWizard } from './product-wizard.js';
import { LiveCamera } from '../../components/live-camera.js';
import { getIcon } from '../../utils/icons.js';

export function renderFarmerProducts(container) {
  const user = store.get('currentUser') || { name: 'Farmer', id: 'farmer-001' };
  const products = (store.get('products') || []).filter(p => p.farmerId === user.id);

  // Seed demo reputations if needed
  QualityGuard.seedDemoReputations();

  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

  // Check farmer eligibility
  const eligibility = QualityGuard.checkFarmerEligibility(user.id);

  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main">
        
        <!-- Header -->
        <header class="glass-header">
          <div class="header-left">
            <div>
              <h2 class="header-title">${i18n.t('farmer.products.title') || 'My Products'}</h2>
              <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">Manage and monitor your listed agricultural products.</div>
            </div>
          </div>
          <div class="header-right">
            ${i18n.renderLanguageSelector('farmer-products-lang-select', 'padding: 8px 12px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface); color: var(--text-primary); cursor: pointer; font-size: 0.85rem;')}
            <button class="btn-icon" style="background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 8px 12px;" title="Notifications">${getIcon('bell', 18)}</button>
            <div class="avatar-circle" style="width: 40px; height: 40px; background: rgba(14, 165, 233, 0.12); color: var(--primary); display: flex; align-items: center; justify-content: center;">${getIcon('farmer', 20)}</div>
          </div>
        </header>

        <div class="page-content">
          
          <!-- Farmer Trust Score Badge -->
          <div style="margin-bottom: 24px;">
            ${QualityGuard.renderReputationBadge(user.id)}
          </div>

          <!-- Action Bar -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 16px;">
            <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700;">My Products</h3>
            <div style="display: flex; gap: 12px;">
              <button class="saas-btn" id="farm-live-camera-btn" style="width: auto; padding: 0 20px; background: var(--surface); border: 1px solid var(--success); color: var(--success); display: inline-flex; align-items: center; gap: 8px;">
                ${getIcon('camera', 16)} ${i18n.t('farmer.dashboard.actionLiveCamera') || 'Open Live Camera'}
              </button>
              <button class="saas-btn" id="add-product-btn" ${!eligibility.eligible ? 'disabled' : ''} style="width: auto; padding: 0 24px; background: linear-gradient(135deg, #0EA5E9, #6366F1); display: inline-flex; align-items: center; gap: 8px;">
                ${getIcon('plus', 16)} ${i18n.t('farmer.dashboard.actionAddProduce') || 'Add New Produce'}
              </button>
            </div>
          </div>

          <!-- Products Grid -->
          <div class="product-grid-layout" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px;" id="products-grid">
            ${products.map(p => renderProductCard(p)).join('')}
          </div>

          ${products.length === 0 ? `
            <div class="saas-card" style="padding: 64px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: 32px;">
              <div style="width: 64px; height: 64px; border-radius: 20px; background: rgba(14, 165, 233, 0.1); color: var(--primary); display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                ${getIcon('package', 32)}
              </div>
              <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">No products yet</h3>
              <p style="font-size: 0.95rem; color: var(--text-secondary); max-width: 400px; margin: 0 auto 24px;">Add your first product to start listing your agricultural produce on the marketplace.</p>
              <button class="saas-btn" id="add-first-product-btn" ${!eligibility.eligible ? 'disabled' : ''} style="width: auto; padding: 0 32px; display: inline-flex; align-items: center; gap: 8px;">
                ${getIcon('plus', 16)} ${i18n.t('farmer.dashboard.actionAddProduce') || 'Add New Produce'}
              </button>
            </div>
          ` : ''}
        </div>
      </main>
    </div>
        </div>
      </main>
    </div>
  `;

  // Add Product Button Trigger -> Opens Dual-Mode Guided Wizard!
  const addBtn = container.querySelector('#add-product-btn');
  const addFirstBtn = container.querySelector('#add-first-product-btn');

  const openWizard = (initialData = {}) => {
    if (!eligibility.eligible) {
      showToast(eligibility.reason, 'error');
      return;
    }
    const wizard = new FarmerProductWizard(container, () => renderFarmerProducts(container), initialData);
    wizard.open();
  };

  addBtn?.addEventListener('click', () => openWizard());
  addFirstBtn?.addEventListener('click', () => openWizard());

  // Live Farm Camera Handler
  const handleLiveFarmCamera = async () => {
    try {
      const result = await LiveCamera.open({
        mode: 'verified',
        farmerLocation: user.location,
      });

      if (result && result.imageDataUrl) {
        showFarmVerificationModal(container, result, user, openWizard);
      }
    } catch (err) {
      if (err && err.message !== 'Camera closed by user') {
        console.warn('LiveCamera error:', err);
        showToast(err.message || i18n.t('errors.cameraError'), 'error');
      }
    }
  };

  container.querySelector('#farm-live-camera-btn')?.addEventListener('click', handleLiveFarmCamera);
  container.querySelector('#banner-live-camera-btn')?.addEventListener('click', handleLiveFarmCamera);

  // QR code buttons
  container.querySelectorAll('.qr-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const productId = btn.dataset.productId;
      const product = products.find(p => p.productId === productId);
      if (product) {
        const canvas = await generateProductQR(product);
        const qrDisplay = createQRDisplay(canvas, product.name);
        createModal(i18n.t('farmer.products.qrModalTitle'), `
          <div style="display: flex; justify-content: center;">${qrDisplay.outerHTML}</div>
          <p style="text-align: center; color: var(--text-muted); font-size: 0.85rem; margin-top: 12px;">
            ${i18n.t('farmer.products.qrModalDesc')}
          </p>
        `);
      }
    });
  });

  // Edit product buttons
  container.querySelectorAll('.edit-product-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const productId = btn.dataset.productId;
      const product = products.find(p => p.productId === productId);
      if (product) {
        showEditProductModal(container, product);
      }
    });
  });

  // Delete product buttons
  container.querySelectorAll('.delete-product-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const productId = btn.dataset.productId;
      const product = products.find(p => p.productId === productId);
      if (!product) return;

      if (!confirm(i18n.t('farmer.products.confirmDelete', { name: product.name }))) return;

      btn.disabled = true;
      btn.textContent = '⏳';

      try {
        store.removeItem('products', p => p.productId === productId);
        store.removeItem('listings', l => l.productId === productId);

        deleteProduct(productId).catch(() => {});
        deleteFirestoreProduct(productId).catch(() => {});

        showToast(i18n.t('farmer.products.deletedSuccess', { name: product.name }), 'success');
        renderFarmerProducts(container);
      } catch (err) {
        showToast(err.message || i18n.t('errors.deleteFailed'), 'error');
        btn.disabled = false;
        btn.innerHTML = getIcon('trash', 14);
      }
    });
  });

  // Product live proof click handlers
  container.querySelectorAll('.product-live-proof-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const productId = tag.dataset.productId;
      const product = products.find(p => p.productId === productId);
      if (product) showProductProofModal(product);
    });
  });

  // Dynamic re-render on language switch
  
}

function renderProductCard(product) {
  const prediction = FairPricePredictor.predict(
    product.name.split(' ').pop(),
    product.quantity,
    product.pricePerUnit
  );
  const statusBadge = getStatusBadge(product.status || 'available');
  const aiScore = product.aiQualityScore || 0;
  const aiGrade = product.aiQualityGrade || '';
  const unit = localizeUnit(product.unit || 'kg');

  return `
    <div class="saas-card" style="display: flex; flex-direction: column; overflow: hidden;">
      
      <!-- Image Section -->
      <div style="height: 160px; position: relative; background: linear-gradient(180deg, rgba(14,165,233,0.1) 0%, rgba(14,165,233,0.02) 100%); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: center; overflow: hidden; ${product.photoUrl ? 'cursor: pointer;' : ''}" ${product.photoUrl ? `onclick="window._showProductProof && window._showProductProof('${product.productId}')"` : ''}>
        ${product.photoUrl ? `
          <img src="${product.photoUrl}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;" />
        ` : `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: var(--text-tertiary);">
            ${getIcon('sprout', 44)}
            <span style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${localizeCropName(product.name)}</span>
          </div>
        `}
        
        <div style="position: absolute; top: 12px; right: 12px; display: flex; flex-direction: column; gap: 6px; align-items: flex-end;">
          ${product.isOrganic ? `<span class="fc-badge fc-badge-success" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 600; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">${getIcon('leaf', 12)} Organic</span>` : ''}
          ${product.isLiveCapture ? `<span class="fc-badge fc-badge-info" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 600; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">${getIcon('camera', 12)} Verified</span>` : ''}
        </div>
      </div>

      <!-- Info Section -->
      <div style="padding: 20px; flex: 1; display: flex; flex-direction: column;">
        <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; letter-spacing: -0.3px;">${localizeCropName(product.name)}</div>
        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px; display: flex; align-items: center; gap: 4px;">
          ${getIcon('mapPin', 14)}
          ${localizeLocation(product.origin)}
        </div>
        
        <div style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 12px;">
          <span style="font-size: 1.5rem; font-weight: 800; color: var(--primary); letter-spacing: -0.5px;">${formatCurrency(product.pricePerUnit)}</span>
          <span style="font-size: 0.85rem; color: var(--text-secondary);">per ${unit}</span>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;">
          <span style="background: var(--surface-secondary); border: 1px solid var(--border); color: var(--text-primary); padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600;">
            ${formatNumber(product.quantity)} ${unit}
          </span>
          <span style="background: ${prediction.isFairlyPriced ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)'}; color: ${prediction.isFairlyPriced ? 'var(--success)' : 'var(--warning)'}; border: 1px solid ${prediction.isFairlyPriced ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
            ${prediction.isFairlyPriced ? `${getIcon('check', 12)} Fair Price` : `${getIcon('alert', 12)} Review Price`}
          </span>
          ${aiGrade ? `
            <span style="background: rgba(139,92,246,0.1); color: #8B5CF6; border: 1px solid rgba(139,92,246,0.2); padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
              ${getIcon('award', 12)} Grade ${aiGrade}
            </span>
          ` : ''}
        </div>

        <div style="margin-top: auto; display: grid; grid-template-columns: 1fr auto auto; gap: 8px;">
          <button class="saas-btn edit-product-btn" data-product-id="${product.productId}" style="height: 36px; font-size: 0.85rem; padding: 0 12px; background: var(--surface-secondary); color: var(--text-primary); border: 1px solid var(--border); display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
            ${getIcon('edit', 14)}
            <span>Edit</span>
          </button>
          <button class="saas-btn qr-btn" data-product-id="${product.productId}" title="QR Code" style="height: 36px; width: 36px; padding: 0; display: inline-flex; align-items: center; justify-content: center; background: var(--surface-secondary); color: var(--text-primary); border: 1px solid var(--border);">${getIcon('qr', 15)}</button>
          <button class="saas-btn delete-product-btn" data-product-id="${product.productId}" title="Delete" style="height: 36px; width: 36px; padding: 0; display: inline-flex; align-items: center; justify-content: center; background: transparent; color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.3);">${getIcon('trash', 15)}</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Edit Product Modal
 */
function showEditProductModal(container, product) {
  createModal(i18n.t('farmer.products.editModalTitle'), `
    <div class="form-group" style="margin-bottom: 12px;">
      <label class="form-label">${i18n.t('farmer.products.cropNameLabel')}</label>
      <input type="text" class="form-input" id="edit-product-name" value="${product.name}" />
    </div>
    <div class="form-row" style="margin-bottom: 12px;">
      <div class="form-group">
        <label class="form-label">${i18n.t('farmer.products.categoryLabel')}</label>
        <select class="form-select" id="edit-product-category">
          ${['Grains', 'Vegetables', 'Fruits', 'Spices', 'Cash Crops'].map(c => `
            <option value="${c}" ${product.category === c ? 'selected' : ''}>${localizeCategory(c)}</option>
          `).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">${i18n.t('farmer.products.organicLabel')}</label>
        <select class="form-select" id="edit-product-organic">
          <option value="false" ${!product.isOrganic ? 'selected' : ''}>${i18n.t('common.no')}</option>
          <option value="true" ${product.isOrganic ? 'selected' : ''}>${i18n.t('farmer.products.organicYes')}</option>
        </select>
      </div>
    </div>
    <div class="form-row" style="margin-bottom: 12px;">
      <div class="form-group">
        <label class="form-label">${i18n.t('farmer.products.quantityLabel')}</label>
        <input type="number" class="form-input" id="edit-product-quantity" value="${product.quantity}" />
      </div>
      <div class="form-group">
        <label class="form-label">${i18n.t('farmer.products.unitLabel')}</label>
        <select class="form-select" id="edit-product-unit">
          ${['kg', 'quintal', 'ton', 'dozen'].map(u => `
            <option value="${u}" ${product.unit === u ? 'selected' : ''}>${localizeUnit(u)}</option>
          `).join('')}
        </select>
      </div>
    </div>
    <div class="form-row" style="margin-bottom: 12px;">
      <div class="form-group">
        <label class="form-label">${i18n.t('farmer.products.priceLabel')}</label>
        <input type="number" class="form-input" id="edit-product-price" value="${product.pricePerUnit}" />
      </div>
      <div class="form-group">
        <label class="form-label">${i18n.t('farmer.products.harvestDateLabel')}</label>
        <input type="date" class="form-input" id="edit-product-harvest" value="${product.harvestDate || ''}" />
      </div>
    </div>
    <div class="form-group" style="margin-bottom: 12px;">
      <label class="form-label">${i18n.t('farmer.products.statusLabel')}</label>
      <select class="form-select" id="edit-product-status">
        <option value="available" ${product.status === 'available' ? 'selected' : ''}>${i18n.t('status.available')}</option>
        <option value="sold" ${product.status === 'sold' ? 'selected' : ''}>${i18n.t('status.soldOut')}</option>
        <option value="reserved" ${product.status === 'reserved' ? 'selected' : ''}>${i18n.t('status.reserved')}</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">${i18n.t('farmer.products.notesLabel')}</label>
      <textarea class="form-textarea" id="edit-product-desc">${product.description || ''}</textarea>
    </div>
  `, `
    <button class="btn btn-secondary btn-sm" onclick="document.getElementById('modal-overlay').remove()">${i18n.t('common.cancel')}</button>
    <button class="btn btn-primary btn-sm" id="save-edit-product-btn" style="display: inline-flex; align-items: center; gap: 6px;">${getIcon('edit', 14)} <span>${i18n.t('common.saveChanges')}</span></button>
  `);

  document.getElementById('save-edit-product-btn')?.addEventListener('click', async () => {
    const name = document.getElementById('edit-product-name')?.value;
    const category = document.getElementById('edit-product-category')?.value;
    const quantity = parseInt(document.getElementById('edit-product-quantity')?.value, 10);
    const unit = document.getElementById('edit-product-unit')?.value;
    const price = parseInt(document.getElementById('edit-product-price')?.value, 10);
    const harvest = document.getElementById('edit-product-harvest')?.value;
    const isOrganic = document.getElementById('edit-product-organic')?.value === 'true';
    const description = document.getElementById('edit-product-desc')?.value;
    const status = document.getElementById('edit-product-status')?.value;

    const validation = validateProductInput({ name, quantity, price });
    if (!validation.valid) {
      showToast(validation.errors[0], 'error');
      return;
    }

    const saveBtn = document.getElementById('save-edit-product-btn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = `<span class="spinner" style="width: 14px; height: 14px;"></span> ${i18n.t('common.saving')}`;
    }

    try {
      const updates = {
        name: name.trim(),
        category,
        quantity,
        unit,
        pricePerUnit: price,
        harvestDate: harvest,
        isOrganic,
        description: description?.trim() || '',
        status,
        emoji: getCropEmoji(name),
        updatedAt: Date.now(),
      };

      store.updateItem('products', p => p.productId === product.productId, updates);
      updateProduct(product.productId, updates).catch(() => {});
      updateFirestoreProduct(product.productId, updates).catch(() => {});

      closeModal();
      showToast(i18n.t('farmer.products.updatedSuccess', { name }), 'success');
      renderFarmerProducts(container);
    } catch (err) {
      showToast(err.message || i18n.t('errors.updateFailed'), 'error');
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 6px;">${getIcon('edit', 14)} <span>${i18n.t('common.saveChanges')}</span></span>`;
      }
    }
  });
}

/**
 * Show rich modal displaying live farm camera capture with exact location and date/timestamp
 */
function showFarmVerificationModal(container, result, user, openWizard) {
  const proof = result.proofData;
  const loc = proof.location || {};
  const formattedDateTime = formatDateTime(proof.timestamp);

  createModal(i18n.t('farmer.products.verificationModalTitle'), `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <!-- Photo with burnt watermark preview -->
      <div style="position: relative; border-radius: 14px; overflow: hidden; background: #000; border: 2px solid #16a34a; max-height: 280px; display: flex; align-items: center; justify-content: center;">
        <img src="${result.imageDataUrl}" alt="Live Farm Capture" style="width: 100%; max-height: 280px; object-fit: cover;" />
        <span style="position: absolute; top: 10px; right: 10px; background: rgba(22, 163, 74, 0.9); color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;">
          ${getIcon('checkCircle', 12)} ${i18n.t('camera.exactVerified')}
        </span>
      </div>

      <!-- Exact Location & Date/Timestamp Info Grid -->
      <div style="background: var(--parchment-card-alt, #f8fafc); border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; align-items: flex-start; gap: 10px;">
          <span style="color: var(--accent-green);">${getIcon('mapPin', 20)}</span>
          <div>
            <div style="font-size: 0.72rem; color: #64748b; font-weight: 800; text-transform: uppercase;">${i18n.t('farmer.products.exactFarmLocation')}</div>
            <div style="font-size: 0.92rem; font-weight: 800; color: #1e293b;">
              ${loc.address || `${loc.lat.toFixed(4)}°N, ${loc.lng.toFixed(4)}°E`}
            </div>
            <div style="font-size: 0.76rem; color: #475569; margin-top: 2px;">
              ${i18n.t('farmer.products.coordsLabel')}: ${loc.lat.toFixed(4)}°N, ${loc.lng.toFixed(4)}°E · ${i18n.t('farmer.products.accuracyLabel')}: ±${loc.accuracy || 15}m
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: flex-start; gap: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1;">
          <span style="color: var(--accent-blue);">${getIcon('clock', 20)}</span>
          <div>
            <div style="font-size: 0.72rem; color: #64748b; font-weight: 800; text-transform: uppercase;">${i18n.t('farmer.products.timestampHeader')}</div>
            <div style="font-size: 0.92rem; font-weight: 800; color: #1e293b;">
              ${formattedDateTime}
            </div>
            <div style="font-size: 0.74rem; color: #166534; font-weight: 700; margin-top: 2px; display: inline-flex; align-items: center; gap: 4px;">
              ${getIcon('check', 12)} ${i18n.t('farmer.products.stampedNotice')}
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: flex-start; gap: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1;">
          <span style="color: var(--accent-purple);">${getIcon('shieldCheck', 20)}</span>
          <div>
            <div style="font-size: 0.72rem; color: #64748b; font-weight: 800; text-transform: uppercase;">${i18n.t('camera.proofHash')}</div>
            <div style="font-size: 0.76rem; font-family: monospace; color: #64748b; word-break: break-all;">
              ${proof.proofHash}
            </div>
          </div>
        </div>
      </div>
    </div>
  `, `
    <button class="btn btn-secondary btn-sm" id="save-farm-proof-btn" style="display: inline-flex; align-items: center; gap: 6px;">${getIcon('sprout', 14)} <span>${i18n.t('farmer.products.saveProofBtn')}</span></button>
    <button class="btn btn-primary btn-sm" id="list-with-camera-btn" style="background: #16a34a; border-color: #15803d; font-weight: 800;">
      ${i18n.t('farmer.products.listCropBtn')}
    </button>
  `);

  // Handle List This Crop Now
  document.getElementById('list-with-camera-btn')?.addEventListener('click', () => {
    closeModal();
    openWizard({
      photoData: result.imageDataUrl,
      captureProof: result.proofData,
      origin: result.proofData.location?.address,
      harvestDate: new Date(result.proofData.timestamp).toISOString().split('T')[0],
      step: 1, // Start at details with photo pre-attached
    });
  });

  // Handle Save Farm Proof
  document.getElementById('save-farm-proof-btn')?.addEventListener('click', () => {
    store.addItem('farmVerifications', {
      id: `VERIF-${Date.now()}`,
      farmerId: user.id,
      photoUrl: result.imageDataUrl,
      proofData: result.proofData,
      createdAt: Date.now(),
    });
    closeModal();
    showToast(i18n.t('farmer.products.proofSavedToast'), 'success');
  });
}

/**
 * Show proof modal for any product card
 */
function showProductProofModal(product) {
  const proof = product.captureProof;
  const loc = proof?.location || {};
  const formattedDateTime = formatDateTime(proof?.timestamp || product.harvestDate || Date.now());

  createModal(`${localizeCropName(product.name)} — ${i18n.t('farmer.products.sensorProofTitle')}`, `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="position: relative; border-radius: 14px; overflow: hidden; background: #000; border: 2px solid #16a34a; max-height: 280px; display: flex; align-items: center; justify-content: center;">
        <img src="${product.photoUrl || ''}" alt="${product.name}" style="width: 100%; max-height: 280px; object-fit: cover;" />
        <span style="position: absolute; top: 10px; right: 10px; background: rgba(22, 163, 74, 0.9); color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;">
          ${getIcon('check', 12)} ${i18n.t('farmer.products.liveHardwareStamped')}
        </span>
      </div>

      <div style="background: var(--parchment-card-alt, #f8fafc); border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px;">
        <div>
          <div style="font-size: 0.72rem; color: #64748b; font-weight: 800; text-transform: uppercase;">${i18n.t('farmer.products.exactFarmLocation')}</div>
          <div style="font-size: 0.92rem; font-weight: 800; color: #1e293b; display: flex; align-items: center; gap: 6px; margin-top: 2px;">
            ${getIcon('mapPin', 14, '', 'color: #16a34a;')}
            <span>${localizeLocation(loc.address || product.origin || 'Registered Farm')}</span>
          </div>
          ${loc.lat ? `
            <div style="font-size: 0.76rem; color: #475569; margin-top: 2px;">
              ${i18n.t('farmer.products.coordsLabel')}: ${loc.lat.toFixed(4)}°N, ${loc.lng.toFixed(4)}°E (±${loc.accuracy || 15}m)
            </div>
          ` : ''}
        </div>

        <div style="padding-top: 10px; border-top: 1px dashed #cbd5e1;">
          <div style="font-size: 0.72rem; color: #64748b; font-weight: 800; text-transform: uppercase;">${i18n.t('farmer.products.timestampHeader')}</div>
          <div style="font-size: 0.92rem; font-weight: 800; color: #1e293b; display: flex; align-items: center; gap: 6px; margin-top: 2px;">
            ${getIcon('clock', 14, '', 'color: #16a34a;')}
            <span>${formattedDateTime}</span>
          </div>
        </div>

        ${proof?.proofHash ? `
          <div style="padding-top: 10px; border-top: 1px dashed #cbd5e1;">
            <div style="font-size: 0.72rem; color: #64748b; font-weight: 800; text-transform: uppercase;">${i18n.t('camera.proofHash')}</div>
            <div style="font-size: 0.76rem; font-family: monospace; color: #64748b; word-break: break-all;">
              ${proof.proofHash}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `, `
    <button class="btn btn-primary btn-sm" onclick="document.getElementById('modal-overlay').remove()">${i18n.t('common.close')}</button>
  `);
}

// Global hook for card thumbnail click
window._showProductProof = (productId) => {
  const products = store.get('products') || [];
  const prod = products.find(p => p.productId === productId);
  if (prod) showProductProofModal(prod);
};
