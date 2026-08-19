// ============================================
// FarmChain AI — Farmer Products Management
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { formatCurrency, getCropEmoji, showToast, createModal, closeModal, getStatusBadge } from '../../utils/helpers.js';
import { ProductRegistry, Marketplace } from '../../blockchain/contracts.js';
import { FairPricePredictor } from '../../ai/price-predictor.js';
import { generateProductQR, createQRDisplay } from '../../utils/qr.js';
import { router } from '../../utils/router.js';
import { validateProductInput } from '../../utils/sanitize.js';
import { postProduct } from '../../utils/api.js';
import { addFirestoreProduct } from '../../firebase/firestore.js';
import { startVoiceRecognition, isSpeechSupported } from '../../utils/voice.js';

export function renderFarmerProducts(container) {
  const user = store.get('currentUser');
  const products = (store.get('products') || []).filter(p => p.farmerId === user.id);

  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

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
            <button class="btn btn-primary btn-sm" id="add-product-btn">➕ Add Product</button>
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>Logout</span></button>
          </div>
        </div>

        <div class="page-content">
          <div class="data-grid stagger-children" id="products-grid">
            ${products.map(p => renderProductCard(p)).join('')}
          </div>

          ${products.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">📦</div>
              <h3>No products listed yet</h3>
              <p>Start by adding your first product to the blockchain marketplace.</p>
              <button class="btn btn-primary btn-sm" style="margin-top: 16px;" id="add-first-product-btn">➕ Add Product</button>
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
}

function renderProductCard(product) {
  const prediction = FairPricePredictor.predict(
    product.name.split(' ').pop(),
    product.quantity,
    product.pricePerUnit
  );
  const statusBadge = getStatusBadge(product.status || 'available');

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
        <div style="margin-top: 10px;">
          <span class="badge ${prediction.isFairlyPriced ? 'badge-success' : 'badge-warning'}">
            AI: ${prediction.isFairlyPriced ? '✓ Fair Price' : '⚠ Review Price'}
          </span>
          <span class="badge ${statusBadge.class}" style="margin-left: 4px;">${statusBadge.label}</span>
        </div>
      </div>
      <div class="product-card-footer">
        <div class="product-card-meta">⛓️ On Blockchain</div>
        <button class="btn-icon qr-btn" data-product-id="${product.productId}" title="Generate QR">📱</button>
      </div>
    </div>
  `;
}

function showAddProductModal(container) {
  const crops = FairPricePredictor.getAvailableCrops();
  const user = store.get('currentUser');

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
    <button class="btn btn-primary btn-sm" id="submit-product-btn">📦 Register on Blockchain</button>
  `);

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

  // Submit handler
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

    try {
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
      });

      const productData = {
        ...result,
        emoji: getCropEmoji(name),
        status: 'available',
      };

      // Add to store
      store.addItem('products', productData);

      // Sync to server API
      postProduct(productData);

      // Sync to Firestore
      addFirestoreProduct(productData);

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
      showToast('Product registered on blockchain! ⛓️', 'success');
      renderFarmerProducts(container);
    } catch (err) {
      showToast('Failed to register product: ' + err.message, 'error');
    }
  });
}
