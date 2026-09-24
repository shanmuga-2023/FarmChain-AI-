// ============================================
// FarmChain AI — Farmer Products Management
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
        <div class="topbar">
          <div class="topbar-left">
            <div>
              <div class="topbar-title">${i18n.t('farmer.products.title')} 📦</div>
              <div class="topbar-breadcrumb"><span>${i18n.t('roles.farmer')}</span> <span>›</span> <span>${i18n.t('farmer.products.title')}</span></div>
            </div>
          </div>
          <div class="topbar-right" style="display: flex; align-items: center; gap: 10px;">
            ${i18n.renderLanguageSelector('farmer-products-lang-select')}
            <button class="btn btn-secondary btn-sm" id="farm-live-camera-btn" style="font-weight: 800; padding: 8px 14px; border-radius: 10px; display: flex; align-items: center; gap: 6px; background: #ECFDF5; border: 2px solid #16A34A; color: #15803D; cursor: pointer; box-shadow: 0 2px 8px rgba(22, 163, 74, 0.15);">
              <span>📸</span>
              <span>${i18n.t('farmer.dashboard.actionLiveCamera')}</span>
            </button>
            <button class="btn btn-primary btn-sm" id="add-product-btn" ${!eligibility.eligible ? 'disabled' : ''} style="font-weight: 700; padding: 8px 16px; border-radius: 10px; background: linear-gradient(135deg, #22c55e, #16a34a); border-color: #16a34a;">
              ${i18n.t('farmer.dashboard.actionAddProduce')}
            </button>
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>${i18n.t('common.logout')}</span></button>
          </div>
        </div>

        <div class="page-content">
          <!-- Farmer Trust Score Badge -->
          ${QualityGuard.renderReputationBadge(user.id)}

          <!-- Live Farm Camera Verification Banner -->
          <div class="live-farm-verification-banner" style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(16, 185, 129, 0.05)); border: 2px solid #86EFAC; border-radius: 16px; padding: 14px 18px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="width: 46px; height: 46px; border-radius: 12px; background: #DCFCE7; border: 1.5px solid #86EFAC; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; flex-shrink: 0;">
                📸
              </div>
              <div>
                <div style="font-size: 0.95rem; font-weight: 800; color: #166534; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <span>${i18n.t('farmer.products.cameraBannerTitle')}</span>
                  <span class="badge" style="background: #DCFCE7; color: #166534; border: 1px solid #86EFAC; font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 20px;">${i18n.t('farmer.products.cameraBannerBadge')}</span>
                </div>
                <div style="font-size: 0.78rem; color: #4B382A; margin-top: 3px; font-weight: 500;">
                  ${i18n.t('farmer.products.cameraBannerDesc')}
                </div>
              </div>
            </div>
            <button class="btn btn-primary btn-sm" id="banner-live-camera-btn" style="font-weight: 800; padding: 10px 18px; border-radius: 10px; background: #16A34A; border: 2px solid #15803D; color: #fff; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);">
              <span>📸</span>
              <span>${i18n.t('farmer.products.openCameraBtn')}</span>
            </button>
          </div>

          <!-- Producer Benefit Banner (Clean, Zero Blockchain Jargon) -->
          <div class="producer-benefit-banner" style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.09), rgba(16, 185, 129, 0.05)); border: 1px solid rgba(34, 197, 94, 0.25); border-radius: var(--radius-md); padding: 14px 18px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 1.6rem;">🌾</span>
              <div>
                <div style="font-size: 0.88rem; font-weight: 800; color: #4ade80;">
                  ${i18n.t('farmer.products.producerBenefitTitle')}
                </div>
                <div style="font-size: 0.76rem; color: var(--text-muted, #94a3b8);">
                  ${i18n.t('farmer.products.producerBenefitSub')}
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge" style="background: rgba(34, 197, 94, 0.2); color: #86efac; border: 1px solid rgba(34, 197, 94, 0.4); font-size: 0.75rem; font-weight: 700;">✓ ${i18n.t('farmer.products.payoutGuaranteed')}</span>
              <span class="badge" style="background: rgba(59, 130, 246, 0.2); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.4); font-size: 0.75rem; font-weight: 700;">${i18n.t('farmer.products.qualityTestedBadge')}</span>
            </div>
          </div>

          <!-- Products Grid -->
          <div class="data-grid stagger-children" id="products-grid">
            ${products.map(p => renderProductCard(p)).join('')}
          </div>

          ${products.length === 0 ? `
            <div class="empty-state" style="padding: 48px 20px; text-align: center; border: 1px dashed rgba(255,255,255,0.15); border-radius: 16px; background: rgba(255,255,255,0.02);">
              <div class="empty-state-icon" style="font-size: 3rem; margin-bottom: 12px;">📦</div>
              <h3 style="font-size: 1.2rem; font-weight: 800; color: #fff; margin-bottom: 6px;">${i18n.t('farmer.products.noProducts')}</h3>
              <p style="font-size: 0.88rem; color: #94a3b8; max-width: 420px; margin: 0 auto 16px;">${i18n.t('farmer.products.startAdding')}</p>
              <button class="btn btn-primary btn-sm" id="add-first-product-btn" ${!eligibility.eligible ? 'disabled' : ''} style="font-weight: 700; padding: 10px 20px; border-radius: 10px; background: linear-gradient(135deg, #22c55e, #16a34a); border-color: #16a34a;">
                ${i18n.t('farmer.dashboard.actionAddProduce')}
              </button>
            </div>
          ` : ''}
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
        btn.textContent = '🗑️';
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
  i18n.onChange(() => {
    if (window.location.hash.includes('/farmer/products')) {
      renderFarmerProducts(container);
    }
  });
}

/**
 * Render individual product card with clean farmer-friendly terminology
 */
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
    <div class="product-card" style="border-radius: 16px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1); background: var(--parchment-card, #1e293b); box-shadow: 0 4px 16px rgba(0,0,0,0.15);">
      <div class="product-card-image" style="height: 160px; position: relative; background: rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; overflow: hidden; ${product.photoUrl ? 'cursor: pointer;' : ''}" ${product.photoUrl ? `onclick="window._showProductProof && window._showProductProof('${product.productId}')"` : ''}>
        ${product.photoUrl ? `
          <img src="${product.photoUrl}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;" />
        ` : `
          <span style="font-size: 4rem;">${product.emoji || getCropEmoji(product.name)}</span>
        `}
        ${product.isOrganic ? `<span class="product-card-badge badge-organic" style="position: absolute; top: 10px; right: 10px;">🌿 ${i18n.t('farmer.products.organicBadge')}</span>` : ''}
        ${product.isLiveCapture ? `<span class="product-card-badge badge-success" style="position: absolute; top: 10px; left: 10px; font-size: 0.7rem; font-weight: 800; background: rgba(22, 163, 74, 0.9); color: #fff;">📸 ${i18n.t('farmer.products.liveVerified')}</span>` : ''}
      </div>

      <div class="product-card-body" style="padding: 16px;">
        <div class="product-card-name" style="font-size: 1.15rem; font-weight: 800; margin-bottom: 4px;">${localizeCropName(product.name)}</div>
        <div class="product-card-origin" style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">📍 ${localizeLocation(product.origin)}</div>
        <div class="product-card-price" style="font-size: 1.25rem; font-weight: 800; color: #4ade80;">${formatCurrency(product.pricePerUnit)}</div>
        <div class="product-card-unit" style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 10px;">${i18n.t('farmer.products.perUnit', { unit })} · ${formatNumber(product.quantity)} ${unit} ${i18n.t('farmer.products.available')}</div>

        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          <span class="badge ${prediction.isFairlyPriced ? 'badge-success' : 'badge-warning'}" style="font-size: 0.72rem;">
            ${prediction.isFairlyPriced ? `✓ ${i18n.t('farmer.products.fairPrice')}` : `⚠ ${i18n.t('farmer.products.reviewPrice')}`}
          </span>
          <span class="badge ${statusBadge.class}" style="font-size: 0.72rem;">${statusBadge.label}</span>
          ${aiGrade ? `
            <span class="badge badge-purple" style="font-size: 0.72rem;">
              🏆 ${i18n.t('farmer.products.grade')} ${aiGrade} ${aiScore ? `(${aiScore}%)` : ''}
            </span>
          ` : ''}
        </div>

        ${(product.isLiveCapture || product.captureProof) ? `
          <div class="product-live-proof-tag" data-product-id="${product.productId}" style="margin-top: 10px; padding: 7px 10px; background: #ECFDF5; border: 1.5px solid #86EFAC; border-radius: 8px; font-size: 0.72rem; color: #166534; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 6px;" title="${i18n.t('farmer.products.proofTooltip')}">
            <span style="display: flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              <span>📸</span>
              <span>${i18n.t('farmer.products.liveVerified')}: ${localizeLocation(product.captureProof?.location?.address || product.origin)}</span>
            </span>
            <span style="font-size: 0.68rem; color: #047857; white-space: nowrap; font-weight: 800;">
              📅 ${formatDate(product.captureProof?.timestamp || product.harvestDate || Date.now())}
            </span>
          </div>
        ` : ''}
      </div>

      <!-- Footer (Clean, Zero Blockchain Jargon) -->
      <div class="product-card-footer" style="padding: 12px 16px; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.15);">
        <div style="font-size: 0.75rem; color: #86efac; font-weight: 600; display: flex; align-items: center; gap: 4px;">
          <span>✓</span> <span>${i18n.t('farmer.products.marketplaceActive')}</span>
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button class="btn-icon edit-product-btn" data-product-id="${product.productId}" title="${i18n.t('farmer.products.editTitle')}" style="font-size: 0.85rem; padding: 4px 8px; border-radius: 8px;">✏️</button>
          <button class="btn-icon delete-product-btn" data-product-id="${product.productId}" title="${i18n.t('farmer.products.deleteTitle')}" style="font-size: 0.85rem; padding: 4px 8px; border-radius: 8px; color: var(--accent-red);">🗑️</button>
          <button class="btn-icon qr-btn" data-product-id="${product.productId}" title="${i18n.t('farmer.products.traceQrTitle')}" style="font-size: 0.85rem; padding: 4px 8px; border-radius: 8px;">📱</button>
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
    <button class="btn btn-primary btn-sm" id="save-edit-product-btn">💾 ${i18n.t('common.saveChanges')}</button>
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
        saveBtn.innerHTML = `💾 ${i18n.t('common.saveChanges')}`;
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

  createModal(`📸 ${i18n.t('farmer.products.verificationModalTitle')}`, `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <!-- Photo with burnt watermark preview -->
      <div style="position: relative; border-radius: 14px; overflow: hidden; background: #000; border: 2px solid #16a34a; max-height: 280px; display: flex; align-items: center; justify-content: center;">
        <img src="${result.imageDataUrl}" alt="Live Farm Capture" style="width: 100%; max-height: 280px; object-fit: cover;" />
        <span style="position: absolute; top: 10px; right: 10px; background: rgba(22, 163, 74, 0.9); color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 800;">
          ✓ ${i18n.t('camera.exactVerified')}
        </span>
      </div>

      <!-- Exact Location & Date/Timestamp Info Grid -->
      <div style="background: var(--parchment-card-alt, #f8fafc); border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; align-items: flex-start; gap: 10px;">
          <span style="font-size: 1.25rem;">📍</span>
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
          <span style="font-size: 1.25rem;">📅</span>
          <div>
            <div style="font-size: 0.72rem; color: #64748b; font-weight: 800; text-transform: uppercase;">${i18n.t('farmer.products.timestampHeader')}</div>
            <div style="font-size: 0.92rem; font-weight: 800; color: #1e293b;">
              ${formattedDateTime}
            </div>
            <div style="font-size: 0.74rem; color: #166534; font-weight: 700; margin-top: 2px;">
              ✓ ${i18n.t('farmer.products.stampedNotice')}
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: flex-start; gap: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1;">
          <span style="font-size: 1.25rem;">🛡️</span>
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
    <button class="btn btn-secondary btn-sm" id="save-farm-proof-btn">🌾 ${i18n.t('farmer.products.saveProofBtn')}</button>
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

  createModal(`📸 ${localizeCropName(product.name)} — ${i18n.t('farmer.products.sensorProofTitle')}`, `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="position: relative; border-radius: 14px; overflow: hidden; background: #000; border: 2px solid #16a34a; max-height: 280px; display: flex; align-items: center; justify-content: center;">
        <img src="${product.photoUrl || ''}" alt="${product.name}" style="width: 100%; max-height: 280px; object-fit: cover;" />
        <span style="position: absolute; top: 10px; right: 10px; background: rgba(22, 163, 74, 0.9); color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 800;">
          ✓ ${i18n.t('farmer.products.liveHardwareStamped')}
        </span>
      </div>

      <div style="background: var(--parchment-card-alt, #f8fafc); border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px;">
        <div>
          <div style="font-size: 0.72rem; color: #64748b; font-weight: 800; text-transform: uppercase;">${i18n.t('farmer.products.exactFarmLocation')}</div>
          <div style="font-size: 0.92rem; font-weight: 800; color: #1e293b;">
            📍 ${localizeLocation(loc.address || product.origin || 'Registered Farm')}
          </div>
          ${loc.lat ? `
            <div style="font-size: 0.76rem; color: #475569; margin-top: 2px;">
              ${i18n.t('farmer.products.coordsLabel')}: ${loc.lat.toFixed(4)}°N, ${loc.lng.toFixed(4)}°E (±${loc.accuracy || 15}m)
            </div>
          ` : ''}
        </div>

        <div style="padding-top: 10px; border-top: 1px dashed #cbd5e1;">
          <div style="font-size: 0.72rem; color: #64748b; font-weight: 800; text-transform: uppercase;">${i18n.t('farmer.products.timestampHeader')}</div>
          <div style="font-size: 0.92rem; font-weight: 800; color: #1e293b;">
            📅 ${formattedDateTime}
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
