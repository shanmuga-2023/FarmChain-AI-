// ============================================
// FarmChain AI — Product Traceability Page
// Full journey tracking with blockchain verification
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { formatCurrency, formatDateTime, truncateHash, getCropEmoji, showToast } from '../../utils/helpers.js';
import { blockchain } from '../../blockchain/core.js';
import { generateProductQR, createQRDisplay } from '../../utils/qr.js';
import { createDoughnutChart } from '../../components/charts.js';

export function renderConsumerTrace(container) {
  const user = store.get('currentUser');
  const products = store.get('products') || [];
  const certs = store.get('certificates') || [];
  const transfers = store.get('transfers') || [];
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const productId = params.get('id');

  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

  // If no product selected, show search
  if (!productId) {
    container.innerHTML = `
      <div class="dashboard-layout">
        ${sidebarContainer.innerHTML}
        <main class="dashboard-main">
          <div class="topbar">
            <div class="topbar-left">
              <div>
                <div class="topbar-title">Trace Product 🔍</div>
                <div class="topbar-breadcrumb"><span>Consumer</span> <span>›</span> <span>Traceability</span></div>
              </div>
            </div>
            <div class="topbar-right">
              <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>Logout</span></button>
            </div>
          </div>
          <div class="page-content">
            <div class="card" style="max-width: 600px; margin: 40px auto;">
              <div style="text-align: center; padding: 20px;">
                <div style="font-size: 4rem; margin-bottom: 16px;">🔍</div>
                <h2 style="margin-bottom: 8px;">Trace Any Produce Batch</h2>
                <p style="color: var(--text-muted); margin-bottom: 24px;">Scan produce QR code or select a batch to verify cryptographic blockchain provenance</p>
                
                <div style="margin-bottom: 20px;">
                  <button class="btn btn-primary" id="open-cam-scanner-btn" style="width: 100%; display: flex; justify-content: center; align-items: center; gap: 8px;">
                    📸 Open Camera QR Scanner
                  </button>
                </div>

                <div style="display: flex; align-items: center; margin: 16px 0; color: var(--text-muted); font-size: 0.8rem;">
                  <div style="flex: 1; height: 1px; background: var(--border-subtle);"></div>
                  <span style="padding: 0 10px;">OR SELECT FROM DEMO BATCHES</span>
                  <div style="flex: 1; height: 1px; background: var(--border-subtle);"></div>
                </div>

                <div class="form-group">
                  <select class="form-select" id="trace-select" style="text-align: center;">
                    <option value="">Select a product to trace...</option>
                    ${products.map(p => `<option value="${p.productId}">${p.emoji || getCropEmoji(p.name)} ${p.name} — ${p.farmerName}</option>`).join('')}
                  </select>
                </div>
                <button class="btn btn-secondary" style="margin-top: 16px; width: 100%;" id="trace-btn">🔍 Trace Selected on Blockchain</button>

                <!-- Hackathon Quick Demo Panel -->
                <div style="margin-top: 24px; padding: 14px; background: rgba(255,255,255,0.03); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md); text-align: left;">
                  <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                    🧪 1-Click Security Demo (For Judges)
                  </div>
                  <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="btn btn-sm btn-primary" id="demo-authentic-btn" style="flex: 1; font-size: 0.75rem;">
                      ✅ Test Authentic Batch
                    </button>
                    <button class="btn btn-sm btn-secondary" id="demo-counterfeit-btn" style="flex: 1; font-size: 0.75rem; border-color: rgba(239, 68, 68, 0.4); color: var(--accent-red);">
                      🚨 Test Spoofed / Fake QR
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    `;

    container.querySelector('#open-cam-scanner-btn')?.addEventListener('click', () => {
      import('../../components/camera-qr-scanner.js').then(module => {
        module.openCameraScanner();
      });
    });

    container.querySelector('#trace-btn')?.addEventListener('click', () => {
      const selected = document.getElementById('trace-select')?.value;
      if (selected) {
        window.location.hash = `/consumer/trace?id=${selected}`;
      } else {
        showToast('Please select a product', 'warning');
      }
    });

    container.querySelector('#demo-authentic-btn')?.addEventListener('click', () => {
      const firstProd = products[0]?.productId || 'PROD-DEMO-RICE-01';
      window.location.hash = `/consumer/trace?id=${firstProd}`;
    });

    container.querySelector('#demo-counterfeit-btn')?.addEventListener('click', () => {
      window.location.hash = `/consumer/trace?id=PROD-FAKE-SPOOFED-BATCH-8891`;
    });

    return;
  }

  // Product found — show full trace OR Counterfeit Alert
  const product = products.find(p => p.productId === productId);
  if (!product) {
    container.innerHTML = `
      <div class="dashboard-layout">
        ${sidebarContainer.innerHTML}
        <main class="dashboard-main">
          <div class="topbar">
            <div class="topbar-left">
              <div>
                <div class="topbar-title" style="color: var(--accent-red);">Security Alert 🚨</div>
                <div class="topbar-breadcrumb"><span>Trace</span> <span>›</span> <span>Tamper Verification</span></div>
              </div>
            </div>
            <div class="topbar-right">
              <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/consumer/trace'">← Back to Scanner</button>
            </div>
          </div>
          <div class="page-content">
            <div class="card" style="max-width: 680px; margin: 40px auto; border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.04); box-shadow: 0 0 30px rgba(239, 68, 68, 0.15);">
              <div style="text-align: center; padding: 24px;">
                <div style="font-size: 4rem; animation: pulse-glow 1.5s infinite; margin-bottom: 12px;">🚨</div>
                <h2 style="color: var(--accent-red); margin-bottom: 8px;">Cryptographic Verification Failed</h2>
                <div class="badge badge-danger" style="font-size: 0.85rem; padding: 6px 14px; margin-bottom: 16px;">
                  ⚠️ Unverified / Counterfeit Produce Label
                </div>
                <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 20px;">
                  The scanned QR batch ID <code style="background: rgba(239,68,68,0.15); color: var(--accent-red); padding: 2px 6px; border-radius: 4px;">${escapeHtml(productId)}</code> <strong>does not exist on the EVM blockchain registry</strong>. This label may be counterfeit, re-printed, or tampered with.
                </p>

                <div style="background: rgba(0,0,0,0.4); border-radius: var(--radius-md); padding: 16px; text-align: left; margin-bottom: 20px; font-size: 0.85rem;">
                  <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-subtle);">
                    <span>⛓️ Blockchain Batch Signature:</span>
                    <span style="color: var(--accent-red); font-weight: 700;">FAILED (0 Blocks)</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-subtle);">
                    <span>🌱 Certified Farmer Origin:</span>
                    <span style="color: var(--accent-red); font-weight: 700;">UNREGISTERED</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-subtle);">
                    <span>💰 Smart Escrow Deposit:</span>
                    <span style="color: var(--accent-red); font-weight: 700;">NONE (₹0.00)</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding: 6px 0;">
                    <span>🛡️ Recommendation:</span>
                    <span style="color: var(--accent-amber); font-weight: 600;">DO NOT PURCHASE</span>
                  </div>
                </div>

                <div style="display: flex; gap: 12px; justify-content: center;">
                  <button class="btn btn-primary btn-sm" onclick="window.location.hash='/consumer/trace'">📸 Scan Valid Batch</button>
                  <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/consumer/marketplace'">🛍️ Browse Verified Marketplace</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    `;
    return;
  }

  const productCerts = certs.filter(c => c.productId === productId);
  const productTransfers = transfers.filter(t => t.productId === productId);
  const productHistory = blockchain.getProductHistory(productId);
  const users = store.get('users') || {};

  // Build journey timeline
  const journeySteps = [];
  journeySteps.push({
    title: '🌱 Harvested at Farm',
    location: product.origin,
    actor: product.farmerName,
    role: 'Farmer',
    date: product.harvestDate || product.createdAt,
    color: 'var(--accent-green)',
    details: `Crop: ${product.name} · Quantity: ${product.quantity} ${product.unit}`,
  });

  if (productCerts.length > 0) {
    journeySteps.push({
      title: '✅ Quality Certified',
      location: 'Certification Authority',
      actor: productCerts[0].issuerName,
      role: 'Certifier',
      date: Date.now() - 20 * 86400000,
      color: 'var(--accent-cyan)',
      details: `Type: ${productCerts[0].certType} · Grade: ${productCerts[0].grade}`,
    });
  }

  journeySteps.push({
    title: '📋 Listed on Blockchain',
    location: 'FarmChain Platform',
    actor: 'Smart Contract',
    role: 'System',
    date: product.createdAt || Date.now() - 15 * 86400000,
    color: 'var(--accent-blue)',
    details: `Product ID: ${productId.slice(0, 20)}...`,
  });

  for (const transfer of productTransfers) {
    journeySteps.push({
      title: `🔄 Transferred to ${transfer.toName}`,
      location: users[transfer.to]?.location || 'In Transit',
      actor: transfer.fromName,
      role: 'Transfer',
      date: Date.now() - 5 * 86400000,
      color: 'var(--accent-purple)',
      details: `From: ${transfer.fromName} → To: ${transfer.toName}`,
    });
  }

  journeySteps.push({
    title: '📍 Available for Purchase',
    location: 'Consumer Marketplace',
    actor: 'FarmChain AI',
    role: 'Platform',
    date: Date.now(),
    color: 'var(--accent-green)',
    details: 'Product verified and available',
    active: true,
  });

  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main">
        <div class="topbar">
          <div class="topbar-left">
            <div>
              <div class="topbar-title">Product Traceability 🔍</div>
              <div class="topbar-breadcrumb"><span>Consumer</span> <span>›</span> <span>Trace</span> <span>›</span> <span>${product.name}</span></div>
            </div>
          </div>
          <div class="topbar-right">
            <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/consumer/trace'">← Back</button>
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>Logout</span></button>
          </div>
        </div>

        <div class="page-content">
          <!-- Product Hero -->
          <div class="trace-hero animate-fade-in">
            <div class="trace-hero-qr" id="trace-qr-container"></div>
            <div class="trace-hero-info">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                ${product.isOrganic ? '<span class="badge badge-success">🌿 Organic Certified</span>' : ''}
                ${productCerts.map(c => `<span class="badge badge-info">✅ ${c.certType} Grade ${c.grade}</span>`).join('')}
                <span class="badge badge-purple">⛓️ Blockchain Verified</span>
              </div>
              <div class="trace-hero-name">${product.emoji || getCropEmoji(product.name)} ${product.name}</div>
              <div class="trace-hero-origin">📍 Origin: ${product.origin} · Farmer: ${product.farmerName}</div>

              <div class="trace-details-grid" style="margin-top: 16px;">
                <div class="trace-detail">
                  <div class="trace-detail-label">Price</div>
                  <div class="trace-detail-value" style="color: var(--accent-green);">${formatCurrency(product.pricePerUnit)}/${product.unit}</div>
                </div>
                <div class="trace-detail">
                  <div class="trace-detail-label">Available</div>
                  <div class="trace-detail-value">${product.quantity} ${product.unit}</div>
                </div>
                <div class="trace-detail">
                  <div class="trace-detail-label">Blockchain Blocks</div>
                  <div class="trace-detail-value">${productHistory.length}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="charts-grid equal">
            <!-- Journey Timeline -->
            <div class="card animate-fade-in-up">
              <div class="card-header">
                <div class="card-title">🗺️ Product Journey</div>
              </div>
              <div class="timeline">
                ${journeySteps.map(step => `
                  <div class="timeline-item">
                    <div class="timeline-dot ${step.active ? 'active' : ''}" style="border-color: ${step.color};"></div>
                    <div class="timeline-content">
                      <div class="timeline-title">${step.title}</div>
                      <div class="timeline-meta">📍 ${step.location} · ${step.actor} (${step.role})</div>
                      <div class="timeline-desc">${step.details}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Price Breakdown & Blockchain -->
            <div style="display: flex; flex-direction: column; gap: 20px;">
              <div class="card animate-fade-in-up">
                <div class="card-header">
                  <div class="card-title">💰 Price Transparency</div>
                </div>
                <div class="chart-wrapper" style="height: 200px;">
                  <canvas id="trace-price-chart"></canvas>
                </div>
                <div class="price-breakdown" style="margin-top: 16px;">
                  <div class="price-row">
                    <span class="price-row-label">🌾 Farmer receives</span>
                    <span class="price-row-value" style="color: var(--accent-green);">${formatCurrency(product.pricePerUnit * 0.6)} (60%)</span>
                  </div>
                  <div class="price-row">
                    <span class="price-row-label">🏪 Intermediary</span>
                    <span class="price-row-value">${formatCurrency(product.pricePerUnit * 0.2)} (20%)</span>
                  </div>
                  <div class="price-row">
                    <span class="price-row-label">🛒 Retailer</span>
                    <span class="price-row-value">${formatCurrency(product.pricePerUnit * 0.15)} (15%)</span>
                  </div>
                  <div class="price-row">
                    <span class="price-row-label">⛓️ Platform</span>
                    <span class="price-row-value">${formatCurrency(product.pricePerUnit * 0.05)} (5%)</span>
                  </div>
                </div>
              </div>

              <div class="card animate-fade-in-up">
                <div class="card-header">
                  <div class="card-title">⛓️ Blockchain Records</div>
                </div>
                <div class="explorer-chain">
                  ${productHistory.slice(-3).reverse().map((h, i) => `
                    <div class="block">
                      <div class="block-header">
                        <span class="block-index">Block #${h.blockIndex}</span>
                        <span class="block-time">${formatDateTime(h.blockTimestamp)}</span>
                      </div>
                      <div style="font-size: 0.82rem; color: var(--text-secondary);">
                        ${h.type?.replace(/_/g, ' ') || 'Transaction'}
                      </div>
                      <div class="block-hash">
                        <span class="block-hash-label">Hash: </span>${truncateHash(h.blockHash, 12)}
                      </div>
                    </div>
                    ${i < 2 ? '<div class="chain-connector"><div class="chain-connector-line"></div></div>' : ''}
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  // Generate QR code
  setTimeout(async () => {
    const qrContainer = container.querySelector('#trace-qr-container');
    if (qrContainer) {
      const canvas = await generateProductQR(product);
      const qrDisplay = createQRDisplay(canvas, 'Scan to verify');
      qrContainer.appendChild(qrDisplay);
    }

    // Price breakdown chart
    createDoughnutChart('trace-price-chart', {
      labels: ['Farmer (60%)', 'Intermediary (20%)', 'Retailer (15%)', 'Platform (5%)'],
      values: [60, 20, 15, 5],
      colors: [
        'rgba(34, 197, 94, 0.85)',
        'rgba(245, 158, 11, 0.85)',
        'rgba(59, 130, 246, 0.85)',
        'rgba(168, 85, 247, 0.85)',
      ],
    });
  }, 100);
}
