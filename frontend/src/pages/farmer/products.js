// ============================================
// FarmChain AI — Farmer Products Management
// AI Visual Quality Oracle + Live Camera + GPS
// 3-Class Scoring: Poor×0 + Average×50 + Good×100
// Anti-Fraud QualityGuard Integration
// Full CRUD: Create, Read, Update, Delete
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { formatCurrency, getCropEmoji, showToast, createModal, closeModal, getStatusBadge } from '../../utils/helpers.js';
import { ProductRegistry, Marketplace } from '../../blockchain/contracts.js';
import { FairPricePredictor } from '../../ai/price-predictor.js';
import { generateProductQR, createQRDisplay } from '../../utils/qr.js';
import { router } from '../../utils/router.js';
import { validateProductInput } from '../../utils/sanitize.js';
import { postProduct, updateProduct, deleteProduct } from '../../utils/api.js';
import { addFirestoreProduct, updateFirestoreProduct, deleteFirestoreProduct } from '../../firebase/firestore.js';
import { startVoiceRecognition, isSpeechSupported } from '../../utils/voice.js';
import { VisualOracle } from '../../ai/visual-oracle.js';
import { GaslessProvider } from '../../web3/gasless.js';
import { LiveCamera } from '../../components/live-camera.js';
import { QualityGuard } from '../../ai/quality-guard.js';

export function renderFarmerProducts(container) {
  const user = store.get('currentUser');
  const products = (store.get('products') || []).filter(p => p.farmerId === user.id);

  // Seed demo reputations if needed
  QualityGuard.seedDemoReputations();

  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

  // Get farmer eligibility
  const eligibility = QualityGuard.checkFarmerEligibility(user.id);

  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main">
        <div class="topbar">
          <div class="topbar-left">
            <div>
              <div class="topbar-title">My Products 📦</div>
              <div class="topbar-breadcrumb"><span>Farmer</span> <span>›</span> <span>Products</span></div>
            </div>
          </div>
          <div class="topbar-right">
            <button class="btn btn-primary btn-sm" id="add-product-btn" ${!eligibility.eligible ? 'disabled' : ''}>➕ Add Product</button>
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>Logout</span></button>
          </div>
        </div>

        <div class="page-content">
          <!-- Farmer Trust Score Banner -->
          ${QualityGuard.renderReputationBadge(user.id)}

          <!-- Gasless Transaction Banner -->
          <div class="gasless-banner" style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(59, 130, 246, 0.08)); border: 1px solid rgba(168, 85, 247, 0.2); border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.3rem;">⛽</span>
              <div>
                <div style="font-size: 0.82rem; font-weight: 700; color: var(--accent-purple);">ERC-4337 Account Abstraction Active</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Gas fees sponsored by FarmChain Paymaster · No MetaMask needed</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge badge-purple" style="font-size: 0.7rem;">₹0.00 Gas Fees</span>
              <span class="badge badge-success" style="font-size: 0.7rem;" id="gas-saved-badge">₹${GaslessProvider.getGasSavings().totalSavedInr} Saved</span>
            </div>
          </div>

          <div class="data-grid stagger-children" id="products-grid">
            ${products.map(p => renderProductCard(p)).join('')}
          </div>

          ${products.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">📦</div>
              <h3>No products listed yet</h3>
              <p>Start by adding your first product to the blockchain marketplace.</p>
              <button class="btn btn-primary btn-sm" style="margin-top: 16px;" id="add-first-product-btn" ${!eligibility.eligible ? 'disabled' : ''}>➕ Add Product</button>
            </div>
          ` : ''}
        </div>
      </main>
    </div>
  `;

  // Add product button
  const addBtn = container.querySelector('#add-product-btn') || container.querySelector('#add-first-product-btn');
  addBtn?.addEventListener('click', () => showAddProductModal(container));

  // QR code buttons
  container.querySelectorAll('.qr-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const productId = btn.dataset.productId;
      const product = products.find(p => p.productId === productId);
      if (product) {
        const canvas = await generateProductQR(product);
        const qrDisplay = createQRDisplay(canvas, product.name);
        createModal('Product QR Code', `
          <div style="display: flex; justify-content: center;">${qrDisplay.outerHTML}</div>
          <p style="text-align: center; color: var(--text-muted); font-size: 0.85rem; margin-top: 12px;">
            Consumers can scan this QR to trace this product on the blockchain.
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

      if (!confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) return;

      btn.disabled = true;
      btn.textContent = '⏳';

      try {
        // Remove from store
        store.removeItem('products', p => p.productId === productId);
        // Remove from listings
        store.removeItem('listings', l => l.productId === productId);

        // Sync to backend API
        deleteProduct(productId).catch(err => console.warn('Backend delete sync:', err));
        // Sync to Firestore
        deleteFirestoreProduct(productId).catch(err => console.warn('Firestore delete sync:', err));

        showToast(`"${product.name}" deleted successfully 🗑️`, 'success');
        renderFarmerProducts(container);
      } catch (err) {
        showToast('Failed to delete product: ' + err.message, 'error');
        btn.disabled = false;
        btn.textContent = '🗑️';
      }
    });
  });
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

  return `
    <div class="product-card">
      <div class="product-card-image">
        ${product.emoji || getCropEmoji(product.name)}
        ${product.isOrganic ? '<span class="product-card-badge badge-organic">🌿 Organic</span>' : ''}
      </div>
      <div class="product-card-body">
        <div class="product-card-name">${product.name}</div>
        <div class="product-card-origin">📍 ${product.origin}</div>
        <div class="product-card-price">${formatCurrency(product.pricePerUnit)}</div>
        <div class="product-card-unit">per ${product.unit} · ${product.quantity} ${product.unit} available</div>
        <div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 4px;">
          <span class="badge ${prediction.isFairlyPriced ? 'badge-success' : 'badge-warning'}">
            AI: ${prediction.isFairlyPriced ? '✓ Fair Price' : '⚠ Review Price'}
          </span>
          <span class="badge ${statusBadge.class}" style="margin-left: 4px;">${statusBadge.label}</span>
          ${aiScore > 0 ? `
            <span class="badge ${aiScore >= 90 ? 'badge-success' : aiScore >= 65 ? 'badge-info' : 'badge-warning'}" title="AI Visual Oracle Quality Score">
              🔬 ${aiGrade} (${aiScore}%)
            </span>
          ` : ''}
          ${aiScore >= 95 ? '<span class="badge badge-purple" style="font-size: 0.65rem;">🏆 Quality Bonus +5%</span>' : ''}
          ${product.isLiveCapture ? '<span class="badge badge-success" style="font-size: 0.65rem;">📸 Live Verified</span>' : ''}
          ${product.captureProof?.gpsVerified ? '<span class="badge badge-success" style="font-size: 0.65rem;">📍 GPS ✓</span>' : ''}
        </div>
      </div>
      <div class="product-card-footer">
        <div class="product-card-meta">⛓️ On Blockchain ${product.imageIpfsHash ? '· 📸 IPFS' : ''}</div>
        <div style="display: flex; gap: 4px; align-items: center;">
          <button class="btn-icon edit-product-btn" data-product-id="${product.productId}" title="Edit Product" style="font-size: 0.85rem; padding: 4px 6px;">✏️</button>
          <button class="btn-icon delete-product-btn" data-product-id="${product.productId}" title="Delete Product" style="font-size: 0.85rem; padding: 4px 6px; color: var(--accent-red);">🗑️</button>
          <button class="btn-icon qr-btn" data-product-id="${product.productId}" title="Generate QR">📱</button>
        </div>
      </div>
    </div>
  `;
}

function showEditProductModal(container, product) {
  const user = store.get('currentUser');

  createModal('Edit Product', `
    <div class="form-group">
      <label class="form-label">Product Name</label>
      <input type="text" class="form-input" id="edit-product-name" value="${product.name}" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-select" id="edit-product-category">
          ${['Grains', 'Vegetables', 'Fruits', 'Spices', 'Cash Crops'].map(c => `
            <option value="${c}" ${product.category === c ? 'selected' : ''}>${c}</option>
          `).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Organic?</label>
        <select class="form-select" id="edit-product-organic">
          <option value="false" ${!product.isOrganic ? 'selected' : ''}>No</option>
          <option value="true" ${product.isOrganic ? 'selected' : ''}>Yes — Certified Organic</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Quantity</label>
        <input type="number" class="form-input" id="edit-product-quantity" value="${product.quantity}" />
      </div>
      <div class="form-group">
        <label class="form-label">Unit</label>
        <select class="form-select" id="edit-product-unit">
          ${['kg', 'quintal', 'ton', 'dozen'].map(u => `
            <option value="${u}" ${product.unit === u ? 'selected' : ''}>${u}</option>
          `).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Price per Unit (₹)</label>
        <input type="number" class="form-input" id="edit-product-price" value="${product.pricePerUnit}" />
      </div>
      <div class="form-group">
        <label class="form-label">Harvest Date</label>
        <input type="date" class="form-input" id="edit-product-harvest" value="${product.harvestDate || ''}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Status</label>
      <select class="form-select" id="edit-product-status">
        <option value="available" ${product.status === 'available' ? 'selected' : ''}>Available</option>
        <option value="sold" ${product.status === 'sold' ? 'selected' : ''}>Sold Out</option>
        <option value="reserved" ${product.status === 'reserved' ? 'selected' : ''}>Reserved</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea class="form-textarea" id="edit-product-desc">${product.description || ''}</textarea>
    </div>
  `, `
    <button class="btn btn-secondary btn-sm" onclick="document.getElementById('modal-overlay').remove()">Cancel</button>
    <button class="btn btn-primary btn-sm" id="save-edit-product-btn">💾 Save Changes</button>
  `);

  document.getElementById('save-edit-product-btn')?.addEventListener('click', async () => {
    const name = document.getElementById('edit-product-name')?.value;
    const category = document.getElementById('edit-product-category')?.value;
    const quantity = parseInt(document.getElementById('edit-product-quantity')?.value);
    const unit = document.getElementById('edit-product-unit')?.value;
    const price = parseInt(document.getElementById('edit-product-price')?.value);
    const harvest = document.getElementById('edit-product-harvest')?.value;
    const isOrganic = document.getElementById('edit-product-organic')?.value === 'true';
    const description = document.getElementById('edit-product-desc')?.value;
    const status = document.getElementById('edit-product-status')?.value;

    // Validate
    const validation = validateProductInput({ name, quantity, price });
    if (!validation.valid) {
      showToast(validation.errors[0], 'error');
      return;
    }

    const saveBtn = document.getElementById('save-edit-product-btn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner" style="width: 14px; height: 14px;"></span> Saving...';
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

      // Update in store
      store.updateItem('products', p => p.productId === product.productId, updates);

      // Sync to backend API
      updateProduct(product.productId, updates).catch(err => console.warn('Backend update sync:', err));

      // Sync to Firestore
      updateFirestoreProduct(product.productId, updates).catch(err => console.warn('Firestore update sync:', err));

      closeModal();
      showToast(`"${name}" updated successfully ✏️`, 'success');
      renderFarmerProducts(container);
    } catch (err) {
      showToast('Failed to update product: ' + err.message, 'error');
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '💾 Save Changes';
      }
    }
  });
}

function showAddProductModal(container) {
  const crops = FairPricePredictor.getAvailableCrops();
  const user = store.get('currentUser');

  // Check farmer eligibility
  const eligibility = QualityGuard.checkFarmerEligibility(user.id);
  if (!eligibility.eligible) {
    showToast(eligibility.reason, 'error');
    return;
  }

  createModal('Add New Product', `
    <!-- Voice Registration Assistant -->
    <div style="background: rgba(34, 197, 94, 0.08); border: 1px dashed var(--accent-green, #22c55e); border-radius: var(--radius-md); padding: 12px; margin-bottom: 16px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: 700; font-size: 0.85rem; color: var(--accent-green);">🎙️ Voice Fill (बोलकर भरें / குரல் பதிவு)</span>
        <select id="voice-lang-select" class="form-select" style="width: auto; padding: 2px 8px; font-size: 0.75rem;">
          <option value="hi-IN">🇮🇳 हिंदी (Hindi)</option>
          <option value="ta-IN">🇮🇳 தமிழ் (Tamil)</option>
          <option value="en-IN">🇬🇧 English</option>
        </select>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <button type="button" id="start-voice-btn" class="btn btn-primary btn-sm" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;">
          <span id="voice-icon">🎙️</span> <span id="voice-btn-text">Start Speaking</span>
        </button>
      </div>
      <div id="voice-status-text" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 6px;">
        Try speaking: <em>"500 kg Basmati Rice at 48 rupees"</em> / <em>"चावल 500 किलो 48 रुपये"</em>
      </div>
    </div>

    <!-- AI Visual Quality Oracle — Live Camera + File Upload -->
    <div style="background: rgba(168, 85, 247, 0.06); border: 1px dashed rgba(168, 85, 247, 0.3); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
      <div style="font-weight: 700; font-size: 0.85rem; color: var(--accent-purple); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
        🔬 AI Visual Quality Oracle (MobileNet V2)
      </div>
      <p style="font-size: 0.73rem; color: var(--text-muted); margin-bottom: 12px;">
        Quality Score = P(Poor)×0 + P(Average)×50 + P(Good)×100 · Threshold: ≥40%
      </p>

      <!-- Two capture options -->
      <div style="display: flex; gap: 8px; align-items: stretch; margin-bottom: 10px;">
        <button type="button" id="open-live-camera-btn" class="btn btn-primary btn-sm" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; background: linear-gradient(135deg, #22c55e, #16a34a); border-color: #16a34a;">
          📸 Live Camera (Verified)
        </button>
        <label for="crop-image-input" class="btn btn-secondary btn-sm" style="cursor: pointer; flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;">
          📁 Upload Photo
        </label>
        <input type="file" id="crop-image-input" accept="image/*" style="display: none;" />
      </div>

      <div style="display: flex; gap: 4px; margin-bottom: 10px;">
        <span style="font-size: 0.68rem; color: rgba(34,197,94,0.8); background: rgba(34,197,94,0.08); padding: 2px 8px; border-radius: 20px;">📸 Live = GPS + Date stamped</span>
        <span style="font-size: 0.68rem; color: rgba(245,158,11,0.8); background: rgba(245,158,11,0.08); padding: 2px 8px; border-radius: 20px;">📁 Upload = Unverified</span>
      </div>

      <!-- Run AI Analysis Button -->
      <button type="button" id="run-ai-analysis-btn" class="btn btn-primary btn-sm" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; background: var(--accent-purple); border-color: var(--accent-purple);" disabled>
        🔬 Run AI Analysis
      </button>

      <!-- Image Preview -->
      <div id="crop-image-preview" style="display: none; margin-top: 10px; text-align: center; position: relative;">
        <img id="crop-preview-img" style="max-width: 100%; max-height: 200px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);" />
        <!-- Live capture proof display -->
        <div id="capture-proof-display" style="display: none; margin-top: 6px;"></div>
      </div>

      <!-- AI Verdict Card -->
      <div id="ai-verdict-card" style="display: none; margin-top: 12px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: var(--radius-md); border: 1px solid rgba(34, 197, 94, 0.2);"></div>
    </div>

    <div class="form-group">
      <label class="form-label">Product Name</label>
      <input type="text" class="form-input" id="product-name" placeholder="e.g., Organic Basmati Rice" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-select" id="product-category">
          <option value="Grains">Grains</option>
          <option value="Vegetables">Vegetables</option>
          <option value="Fruits">Fruits</option>
          <option value="Spices">Spices</option>
          <option value="Cash Crops">Cash Crops</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Organic?</label>
        <select class="form-select" id="product-organic">
          <option value="false">No</option>
          <option value="true">Yes — Certified Organic</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Quantity</label>
        <input type="number" class="form-input" id="product-quantity" placeholder="500" />
      </div>
      <div class="form-group">
        <label class="form-label">Unit</label>
        <select class="form-select" id="product-unit">
          <option value="kg">Kilograms (kg)</option>
          <option value="quintal">Quintals</option>
          <option value="ton">Tonnes</option>
          <option value="dozen">Dozens</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Price per Unit (₹)</label>
        <input type="number" class="form-input" id="product-price" placeholder="50" />
      </div>
      <div class="form-group">
        <label class="form-label">Harvest Date</label>
        <input type="date" class="form-input" id="product-harvest" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea class="form-textarea" id="product-desc" placeholder="Describe your product quality, growing methods..."></textarea>
    </div>
    <div id="ai-price-suggestion" style="display: none;" class="ai-insight-card" style="background: var(--accent-green-dim); border-color: rgba(34,197,94,0.2);"></div>
  `, `
    <button class="btn btn-secondary btn-sm" onclick="document.getElementById('modal-overlay').remove()">Cancel</button>
    <button class="btn btn-primary btn-sm" id="submit-product-btn">📦 Register on Blockchain (Gasless ⛽)</button>
  `);

  // ==========================================
  // AI Visual Oracle + Live Camera handlers
  // ==========================================
  let aiVerdict = null;
  let captureProofData = null;

  const imageInput = document.getElementById('crop-image-input');
  const analyzeBtn = document.getElementById('run-ai-analysis-btn');
  const previewContainer = document.getElementById('crop-image-preview');
  const previewImg = document.getElementById('crop-preview-img');
  const verdictCard = document.getElementById('ai-verdict-card');
  const proofDisplay = document.getElementById('capture-proof-display');
  const liveCameraBtn = document.getElementById('open-live-camera-btn');

  // Live Camera handler
  liveCameraBtn?.addEventListener('click', async () => {
    try {
      const result = await LiveCamera.open({
        mode: 'verified',
        farmerLocation: user.location ? { lat: user.lat, lng: user.lng } : null,
      });

      // Set preview image
      previewImg.src = result.imageDataUrl;
      previewContainer.style.display = 'block';
      captureProofData = result.proofData;

      // Show proof data
      proofDisplay.style.display = 'block';
      proofDisplay.innerHTML = LiveCamera.formatProofDisplay(result.proofData);

      // Enable analysis
      analyzeBtn.disabled = false;
      analyzeBtn.style.opacity = '1';

      // Update camera button
      liveCameraBtn.innerHTML = '✅ Photo Captured (GPS Verified)';
      liveCameraBtn.style.background = 'var(--accent-green, #22c55e)';

      showToast('📸 Live photo captured with GPS + timestamp!', 'success');
    } catch (err) {
      if (err.message !== 'Camera closed by user') {
        showToast('Camera error: ' + err.message, 'warning');
      }
    }
  });

  // File upload handler (unverified)
  imageInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      previewImg.src = ev.target.result;
      previewContainer.style.display = 'block';
      captureProofData = null; // No proof for file uploads
      proofDisplay.style.display = 'block';
      proofDisplay.innerHTML = `
        <div style="font-size: 0.72rem; color: #f59e0b; display: flex; align-items: center; gap: 4px;">
          ⚠️ File Upload — No GPS/timestamp verification. Consider using Live Camera for verified capture.
        </div>
      `;
      analyzeBtn.disabled = false;
      analyzeBtn.style.opacity = '1';
    };
    reader.readAsDataURL(file);
  });

  // Run AI Analysis
  analyzeBtn?.addEventListener('click', async () => {
    if (!previewImg.src) {
      showToast('Please capture or upload a crop image first', 'warning');
      return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span class="spinner" style="width: 14px; height: 14px;"></span> Analyzing with MobileNet V2...';
    verdictCard.style.display = 'block';
    verdictCard.innerHTML = `
      <div style="text-align: center; padding: 16px;">
        <div class="spinner" style="margin: 0 auto 8px;"></div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">Loading TensorFlow.js MobileNet V2 model...</div>
        <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">Edge AI — runs entirely in your browser</div>
      </div>
    `;

    try {
      // Wait for image to be fully loaded
      await new Promise((resolve) => {
        if (previewImg.complete) resolve();
        else previewImg.onload = resolve;
      });

      aiVerdict = await VisualOracle.analyzeImage(previewImg, captureProofData);
      renderAiVerdict(verdictCard, aiVerdict);

      analyzeBtn.innerHTML = '✅ Analysis Complete';
      analyzeBtn.style.background = 'var(--accent-green)';
      analyzeBtn.style.borderColor = 'var(--accent-green)';

      showToast(`AI Quality Score: ${aiVerdict.healthScore}% (${aiVerdict.qualityGrade})`,
        aiVerdict.healthScore >= 80 ? 'success' : aiVerdict.healthScore >= 50 ? 'warning' : 'error');
    } catch (err) {
      console.error('Visual Oracle error:', err);
      // Fallback to demo verdict using product name
      const productName = document.getElementById('product-name')?.value || 'Crop Batch';
      aiVerdict = VisualOracle.generateDemoVerdict(productName);
      if (captureProofData) {
        aiVerdict.captureProof = captureProofData;
        aiVerdict.isLiveCapture = true;
      }
      renderAiVerdict(verdictCard, aiVerdict);

      analyzeBtn.innerHTML = '🔬 AI Score Generated';
      analyzeBtn.disabled = false;
      showToast('Used AI demo analysis (TF.js may require HTTPS)', 'info');
    }
  });

  // Voice input handler
  const voiceBtn = document.getElementById('start-voice-btn');
  const voiceIcon = document.getElementById('voice-icon');
  const voiceText = document.getElementById('voice-btn-text');
  const voiceStatus = document.getElementById('voice-status-text');
  const voiceLang = document.getElementById('voice-lang-select');

  function triggerAiPrice(name) {
    if (!name || name.length < 2) return;
    const prediction = FairPricePredictor.predict(name.split(' ').pop(), 100);
    const container = document.getElementById('ai-price-suggestion');
    if (container) {
      container.style.display = 'block';
      container.style.background = 'var(--accent-green-dim)';
      container.style.borderColor = 'rgba(34,197,94,0.2)';
      container.innerHTML = `
        <div class="ai-insight-title">🤖 AI Suggested Fair Price</div>
        <div class="ai-insight-value" style="color: var(--accent-green);">${formatCurrency(prediction.predictedFairPrice)}/unit</div>
        <div class="ai-insight-desc">MSP: ${formatCurrency(prediction.msp)} · Benchmark: ${formatCurrency(prediction.mandiBenchmark || prediction.msp)} · Confidence: ${prediction.confidence}</div>
      `;
    }
  }

  voiceBtn?.addEventListener('click', () => {
    const lang = voiceLang?.value || 'hi-IN';
    if (voiceStatus) voiceStatus.textContent = '🎙️ Listening... Speak your crop, quantity and price!';
    if (voiceBtn) {
      voiceBtn.style.background = 'var(--accent-amber, #f59e0b)';
      voiceText.textContent = 'Listening...';
    }

    startVoiceRecognition({
      language: lang,
      onResult: (res) => {
        if (voiceStatus) voiceStatus.innerHTML = `✅ Heard: "<em>${res.transcript}</em>"`;
        if (voiceBtn) {
          voiceBtn.style.background = 'var(--accent-green, #22c55e)';
          voiceText.textContent = '🎙️ Speak Again';
        }

        // Auto-fill form fields
        if (res.name) {
          const nameInput = document.getElementById('product-name');
          if (nameInput) nameInput.value = res.name;
          triggerAiPrice(res.name);
        }
        if (res.category) {
          const catSelect = document.getElementById('product-category');
          if (catSelect) catSelect.value = res.category;
        }
        if (res.quantity) {
          const qtyInput = document.getElementById('product-quantity');
          if (qtyInput) qtyInput.value = res.quantity;
        }
        if (res.price) {
          const priceInput = document.getElementById('product-price');
          if (priceInput) priceInput.value = res.price;
        }
        if (res.unit) {
          const unitSelect = document.getElementById('product-unit');
          if (unitSelect) unitSelect.value = res.unit;
        }
        if (res.isOrganic) {
          const organicSelect = document.getElementById('product-organic');
          if (organicSelect) organicSelect.value = 'true';
        }

        showToast('Form auto-filled from speech! 🎙️', 'success');
      },
      onError: (err) => {
        if (voiceStatus) voiceStatus.textContent = `⚠️ Error: ${err}. Please type manually.`;
        if (voiceBtn) {
          voiceBtn.style.background = '';
          voiceText.textContent = '🎙️ Try Again';
        }
      },
      onEnd: () => {
        if (voiceBtn && voiceText.textContent === 'Listening...') {
          voiceBtn.style.background = '';
          voiceText.textContent = '🎙️ Start Speaking';
        }
      }
    });
  });

  // AI price suggestion on name input
  document.getElementById('product-name')?.addEventListener('input', (e) => {
    triggerAiPrice(e.target.value);
  });

  // Submit handler — now with AI quality data + gasless transaction + QualityGuard
  document.getElementById('submit-product-btn')?.addEventListener('click', async () => {
    const name = document.getElementById('product-name')?.value;
    const category = document.getElementById('product-category')?.value;
    const quantity = parseInt(document.getElementById('product-quantity')?.value);
    const unit = document.getElementById('product-unit')?.value;
    const price = parseInt(document.getElementById('product-price')?.value);
    const harvest = document.getElementById('product-harvest')?.value;
    const isOrganic = document.getElementById('product-organic')?.value === 'true';
    const description = document.getElementById('product-desc')?.value;

    // Robust input validation
    const validation = validateProductInput({ name, quantity, price });
    if (!validation.valid) {
      showToast(validation.errors[0], 'error');
      return;
    }

    // If no AI analysis was done, auto-generate demo verdict
    if (!aiVerdict) {
      aiVerdict = VisualOracle.generateDemoVerdict(name || 'Crop Batch');
      if (captureProofData) {
        aiVerdict.captureProof = captureProofData;
        aiVerdict.isLiveCapture = true;
      }
    }

    // Quality gate — block if AI score is too low
    if (aiVerdict.healthScore < VisualOracle.getQualityGateThreshold()) {
      showToast(`🚫 Quality Gate Failed: AI score ${aiVerdict.healthScore}% is below minimum ${VisualOracle.getQualityGateThreshold()}%. Cannot register on blockchain.`, 'error');

      // Record the quality failure in QualityGuard
      QualityGuard.recordQualityResult(user.id, 'attempted', aiVerdict.healthScore, 'registration');

      return;
    }

    // Record successful quality check
    QualityGuard.recordQualityResult(user.id, 'pending', aiVerdict.healthScore, 'registration');

    // Show gasless transaction pipeline
    const submitBtn = document.getElementById('submit-product-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner" style="width: 14px; height: 14px;"></span> Creating UserOp...';
    }

    try {
      // Simulate gasless transaction pipeline
      const gaslessResult = await GaslessProvider.sendGaslessTransaction({ type: 'registerProduct' });

      // Update button with pipeline progress
      if (submitBtn) {
        submitBtn.innerHTML = '⛓️ Mining Block...';
      }

      const result = await ProductRegistry.registerProduct({
        name: name.trim(),
        category,
        farmerId: user.id,
        farmerName: user.name,
        quantity,
        unit,
        pricePerUnit: price,
        origin: user.location,
        harvestDate: harvest,
        isOrganic,
        description: description?.trim() || '',
        // AI Visual Quality Oracle data — bound to on-chain record
        aiQualityScore: aiVerdict.healthScore,
        aiQualityGrade: aiVerdict.qualityGrade,
        imageIpfsHash: aiVerdict.imageIpfsHash || '',
      });

      const productData = {
        ...result,
        emoji: getCropEmoji(name),
        status: 'available',
        aiQualityScore: aiVerdict.healthScore,
        aiQualityGrade: aiVerdict.qualityGrade,
        imageIpfsHash: aiVerdict.imageIpfsHash || '',
        classBreakdown: aiVerdict.classBreakdown || null,
        isLiveCapture: aiVerdict.isLiveCapture || false,
        captureProof: aiVerdict.captureProof || null,
      };

      // Add to store
      store.addItem('products', productData);

      // Sync to server API
      postProduct(productData).catch(err => console.warn('Backend sync:', err));

      // Sync to Firestore
      addFirestoreProduct(productData).catch(err => console.warn('Firestore sync:', err));

      // Create listing
      await Marketplace.createListing({
        productId: result.productId,
        sellerId: user.id,
        sellerName: user.name,
        sellerRole: 'farmer',
        productName: name.trim(),
        quantity,
        unit,
        pricePerUnit: price,
      });

      closeModal();

      // Show comprehensive success message
      const qualityMsg = aiVerdict.healthScore >= 95 ? ' 🏆 Quality Bonus: +5% farmer share!' : '';
      const liveMsg = aiVerdict.isLiveCapture ? ' · 📸 GPS Verified' : '';
      showToast(`Product registered on blockchain! ⛓️ AI Score: ${aiVerdict.healthScore}% · Gas: ₹0 (Sponsored)${qualityMsg}${liveMsg}`, 'success');

      // Update gas saved badge
      const gasBadge = container.querySelector('#gas-saved-badge');
      if (gasBadge) {
        gasBadge.textContent = `₹${GaslessProvider.getGasSavings().totalSavedInr} Saved`;
      }

      renderFarmerProducts(container);
    } catch (err) {
      showToast('Failed to register product: ' + err.message, 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '📦 Register on Blockchain (Gasless ⛽)';
      }
    }
  });
}

/**
 * Render the AI Quality Verdict card with 3-class breakdown
 */
function renderAiVerdict(verdictCard, verdict) {
  const scoreColor = verdict.healthScore >= 90 ? 'var(--accent-green)' :
    verdict.healthScore >= 65 ? 'var(--accent-cyan)' :
    verdict.healthScore >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)';

  const gradeEmoji = verdict.qualityGrade === 'A+' ? '🏆' :
    verdict.qualityGrade === 'A' ? '✅' :
    verdict.qualityGrade === 'B' ? 'ℹ️' : '⚠️';

  const cb = verdict.classBreakdown || { poor: 0.1, average: 0.2, good: 0.7 };
  const formula = verdict.formulaDisplay || {};

  verdictCard.style.borderColor = scoreColor;
  verdictCard.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <div style="font-weight: 700; font-size: 0.85rem; color: var(--accent-purple);">🔬 AI Quality Verdict (MobileNet V2)</div>
      <span class="badge ${verdict.healthScore >= 80 ? 'badge-success' : verdict.healthScore >= 50 ? 'badge-warning' : 'badge-danger'}">
        ${gradeEmoji} Grade ${verdict.qualityGrade}
      </span>
    </div>

    <!-- Score Gauge -->
    <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
      <div class="quality-gauge" style="position: relative; width: 70px; height: 70px;">
        <svg viewBox="0 0 36 36" style="width: 70px; height: 70px; transform: rotate(-90deg);">
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3" />
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none" stroke="${scoreColor}" stroke-width="3"
            stroke-dasharray="${verdict.healthScore}, 100"
            style="transition: stroke-dasharray 1s ease;" />
        </svg>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; color: ${scoreColor};">
          ${verdict.healthScore}%
        </div>
      </div>
      <div style="flex: 1;">
        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">
          Detected: <strong>${verdict.matchedLabel}</strong>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">
          Category: ${verdict.matchedCategory} · Confidence: ${verdict.confidence}%
        </div>
        ${verdict.healthScore >= 95 ? `
          <div style="font-size: 0.75rem; color: var(--accent-green); font-weight: 600; margin-top: 4px;">
            🏆 Qualifies for High-Quality Bonus (+5% farmer share)
          </div>
        ` : ''}
      </div>
    </div>

    <!-- 3-Class Probability Breakdown -->
    <div style="background: rgba(0,0,0,0.2); border-radius: 10px; padding: 10px 12px; margin-bottom: 10px;">
      <div style="font-size: 0.75rem; font-weight: 700; color: var(--accent-purple); margin-bottom: 8px;">📊 3-Class Probability Breakdown</div>

      <!-- Poor -->
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
        <span style="font-size: 0.72rem; color: #ef4444; width: 65px; font-weight: 600;">🔴 Poor</span>
        <div style="flex: 1; height: 14px; background: rgba(255,255,255,0.06); border-radius: 7px; overflow: hidden; position: relative;">
          <div style="width: ${cb.poor * 100}%; height: 100%; background: linear-gradient(90deg, #ef4444, #dc2626); border-radius: 7px; transition: width 0.8s ease;"></div>
        </div>
        <span style="font-size: 0.75rem; color: #ef4444; font-weight: 700; width: 45px; text-align: right;">${(cb.poor * 100).toFixed(0)}%</span>
      </div>

      <!-- Average -->
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
        <span style="font-size: 0.72rem; color: #f59e0b; width: 65px; font-weight: 600;">🟡 Average</span>
        <div style="flex: 1; height: 14px; background: rgba(255,255,255,0.06); border-radius: 7px; overflow: hidden; position: relative;">
          <div style="width: ${cb.average * 100}%; height: 100%; background: linear-gradient(90deg, #f59e0b, #d97706); border-radius: 7px; transition: width 0.8s ease;"></div>
        </div>
        <span style="font-size: 0.75rem; color: #f59e0b; font-weight: 700; width: 45px; text-align: right;">${(cb.average * 100).toFixed(0)}%</span>
      </div>

      <!-- Good -->
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 0.72rem; color: #22c55e; width: 65px; font-weight: 600;">🟢 Good</span>
        <div style="flex: 1; height: 14px; background: rgba(255,255,255,0.06); border-radius: 7px; overflow: hidden; position: relative;">
          <div style="width: ${cb.good * 100}%; height: 100%; background: linear-gradient(90deg, #22c55e, #16a34a); border-radius: 7px; transition: width 0.8s ease;"></div>
        </div>
        <span style="font-size: 0.75rem; color: #22c55e; font-weight: 700; width: 45px; text-align: right;">${(cb.good * 100).toFixed(0)}%</span>
      </div>
    </div>

    <!-- Formula Display -->
    <div style="background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.15); border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; font-family: 'JetBrains Mono', 'Fira Code', monospace;">
      <div style="font-size: 0.7rem; color: var(--accent-purple); font-weight: 600; margin-bottom: 4px;">${formula.formula || 'Quality Score = P(Poor)×0 + P(Average)×50 + P(Good)×100'}</div>
      <div style="font-size: 0.72rem; color: var(--text-secondary);">${formula.calculation || ''}</div>
      <div style="font-size: 0.72rem; color: var(--text-secondary);">${formula.breakdown || ''}</div>
      <div style="font-size: 0.82rem; font-weight: 800; color: ${scoreColor}; margin-top: 4px;">${formula.result || `= ${verdict.healthScore}%`}</div>
      <div style="font-size: 0.75rem; font-weight: 700; color: ${verdict.healthScore >= 40 ? '#22c55e' : '#ef4444'}; margin-top: 4px;">
        ${formula.threshold || `${verdict.healthScore} ${verdict.healthScore >= 40 ? '≥' : '<'} 40 → ${verdict.healthScore >= 40 ? 'PRODUCT ALLOWED ✅' : 'PRODUCT BLOCKED 🚫'}`}
      </div>
    </div>

    <!-- IPFS Hash -->
    <div style="font-size: 0.72rem; color: var(--text-muted); padding: 6px 8px; background: rgba(0,0,0,0.2); border-radius: var(--radius-sm); font-family: monospace; word-break: break-all;">
      📎 IPFS Hash: ${verdict.imageIpfsHash || 'Pending...'}
    </div>

    ${verdict.captureProof ? `
      <div style="margin-top: 8px; padding: 8px 10px; background: rgba(34,197,94,0.06); border: 1px solid rgba(34,197,94,0.15); border-radius: 8px;">
        <div style="font-size: 0.72rem; font-weight: 600; color: #22c55e; margin-bottom: 4px;">📸 Live Camera Capture Proof</div>
        <div style="font-size: 0.7rem; color: rgba(255,255,255,0.6);">
          📍 ${verdict.captureProof.location?.lat?.toFixed(4) || '?'}°N, ${verdict.captureProof.location?.lng?.toFixed(4) || '?'}°E
          ${verdict.captureProof.location?.address ? `(${verdict.captureProof.location.address})` : ''}
        </div>
        <div style="font-size: 0.7rem; color: rgba(255,255,255,0.5);">
          📅 ${new Date(verdict.captureProof.timestamp).toLocaleString('en-IN')}
        </div>
        <div style="font-size: 0.68rem; color: rgba(168,85,247,0.7); font-family: monospace;">
          🔗 Proof: ${verdict.captureProof.proofHash || 'N/A'}
        </div>
      </div>
    ` : ''}

    ${verdict.diseaseFlags.length > 0 ? `
      <div style="margin-top: 8px;">
        ${verdict.diseaseFlags.map(f => `
          <div style="font-size: 0.75rem; color: var(--accent-amber); display: flex; align-items: center; gap: 4px; margin-top: 2px;">
            <span class="badge badge-warning" style="font-size: 0.65rem;">${f.severity}</span> ${f.message}
          </div>
        `).join('')}
      </div>
    ` : ''}

    ${verdict.healthScore < 40 ? `
      <div style="margin-top: 8px; padding: 6px; background: rgba(239,68,68,0.1); border-radius: var(--radius-sm); font-size: 0.75rem; color: var(--accent-red); font-weight: 600;">
        🚫 Quality Gate: Score below ${VisualOracle.getQualityGateThreshold()}% — cannot register on blockchain
      </div>
    ` : ''}
  `;
}
