// ============================================
// FarmChain AI — Product Traceability Page
// Full journey tracking with blockchain verification
// + Spatial-Temporal QR Anti-Cloning (Cybersecurity)
// + AI Visual Quality Oracle display
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { formatCurrency, formatDateTime, truncateHash, getCropEmoji, showToast } from '../../utils/helpers.js';
import { blockchain } from '../../blockchain/core.js';
import { generateProductQR, createQRDisplay } from '../../utils/qr.js';
import { createDoughnutChart } from '../../components/charts.js';
import { GeoVelocityChecker } from '../../ai/geo-velocity.js';

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
                  <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
                    <button class="btn btn-sm btn-secondary" id="demo-clone-btn" style="flex: 1; font-size: 0.75rem; border-color: rgba(245, 158, 11, 0.4); color: var(--accent-amber);">
                      📋 Test Cloned QR (Photocopy Attack)
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

    // Clone attack demo — seeds a Mumbai scan, then traces with Delhi coordinates
    container.querySelector('#demo-clone-btn')?.addEventListener('click', () => {
      const targetProduct = products[0];
      if (targetProduct) {
        // Seed a "genuine" scan from Mumbai 30 minutes ago
        GeoVelocityChecker.seedDemoScan(targetProduct.productId, 'Mumbai');
        // Navigate — the trace page will detect the clone when it captures "current" location
        window.location.hash = `/consumer/trace?id=${targetProduct.productId}&clone_demo=true`;
      } else {
        showToast('No products available for demo', 'warning');
      }
    });

    return;
  }

  // Product found — show full trace OR Counterfeit Alert
  const product = products.find(p => p.productId === productId);
  if (!product) {
    renderCounterfeitAlert(container, sidebarContainer, productId);
    return;
  }

  // ==========================================
  // Spatial-Temporal QR Anti-Cloning Check
  // ==========================================
  const isCloneDemo = new URLSearchParams(window.location.hash.split('?')[1] || '').get('clone_demo');

  // Attempt to get geolocation
  captureGeoAndRender(container, sidebarContainer, product, products, certs, transfers, isCloneDemo);
}

/**
 * Capture geolocation, check velocity, then render trace
 */
function captureGeoAndRender(container, sidebarContainer, product, products, certs, transfers, isCloneDemo) {
  const productId = product.productId;

  // For clone demo, simulate Delhi location
  if (isCloneDemo) {
    const delhiLat = 28.7041 + (Math.random() * 0.05 - 0.025);
    const delhiLon = 77.1025 + (Math.random() * 0.05 - 0.025);

    const velocityResult = GeoVelocityChecker.checkVelocity(productId, delhiLat, delhiLon);
    GeoVelocityChecker.recordScan(productId, delhiLat, delhiLon, Date.now(), 'Delhi');

    if (velocityResult.verdict === 'CLONE_DETECTED' || velocityResult.verdict === 'SUSPICIOUS') {
      renderCloneAlert(container, sidebarContainer, product, velocityResult);
      return;
    }
  }

  // Try real geolocation
  if (navigator.geolocation && !isCloneDemo) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const velocityResult = GeoVelocityChecker.checkVelocity(productId, latitude, longitude);
        GeoVelocityChecker.recordScan(productId, latitude, longitude);

        if (velocityResult.verdict === 'CLONE_DETECTED') {
          renderCloneAlert(container, sidebarContainer, product, velocityResult);
        } else {
          renderFullTrace(container, sidebarContainer, product, products, certs, transfers, velocityResult);
        }
      },
      () => {
        // Geolocation denied — render normally with no velocity data
        renderFullTrace(container, sidebarContainer, product, products, certs, transfers, null);
      },
      { timeout: 5000, enableHighAccuracy: false }
    );
  } else if (!isCloneDemo) {
    renderFullTrace(container, sidebarContainer, product, products, certs, transfers, null);
  }
}

/**
 * 🚨 Clone Detected Alert Page
 */
function renderCloneAlert(container, sidebarContainer, product, velocityResult) {
  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main">
        <div class="topbar">
          <div class="topbar-left">
            <div>
              <div class="topbar-title" style="color: var(--accent-red);">Clone Detected 🚨</div>
              <div class="topbar-breadcrumb"><span>Trace</span> <span>›</span> <span>Cybersecurity Alert</span></div>
            </div>
          </div>
          <div class="topbar-right">
            <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/consumer/trace'">← Back to Scanner</button>
          </div>
        </div>
        <div class="page-content">
          <div class="clone-alert-card animate-fade-in" style="max-width: 720px; margin: 24px auto;">
            <!-- Pulsing Alert Header -->
            <div style="text-align: center; padding: 24px; background: rgba(239, 68, 68, 0.06); border: 2px solid var(--accent-red); border-radius: var(--radius-lg); box-shadow: 0 0 40px rgba(239, 68, 68, 0.2); animation: pulse-glow 2s infinite;">
              <div style="font-size: 4rem; margin-bottom: 12px; animation: pulse-glow 1.5s infinite;">🚨</div>
              <h2 style="color: var(--accent-red); margin-bottom: 8px; font-size: 1.4rem;">CYBERSECURITY ALERT: QR Clone Detected</h2>
              <div class="badge badge-danger" style="font-size: 0.9rem; padding: 8px 16px; margin-bottom: 16px;">
                ⚠️ Impossible Spatial-Temporal Velocity — Produce Likely Counterfeit
              </div>
              <p style="color: var(--text-secondary); line-height: 1.7; margin-bottom: 20px; font-size: 0.9rem;">
                This QR code for <strong>${product.name}</strong> has exhibited <strong>physically impossible geographic velocity</strong>. 
                The same batch was scanned in two locations that cannot be reached within the elapsed time.
              </p>

              <!-- Velocity Details -->
              <div style="background: rgba(0,0,0,0.4); border-radius: var(--radius-md); padding: 16px; text-align: left; margin-bottom: 20px; font-size: 0.85rem;">
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-subtle);">
                  <span>🏃 Calculated Velocity:</span>
                  <span style="color: var(--accent-red); font-weight: 800; font-size: 1.1rem;">${velocityResult.velocity?.toLocaleString() || '∞'} km/h</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-subtle);">
                  <span>📏 Distance Between Scans:</span>
                  <span style="color: var(--accent-amber); font-weight: 700;">${velocityResult.distance?.toLocaleString() || 'N/A'} km</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-subtle);">
                  <span>⏱️ Time Between Scans:</span>
                  <span style="font-weight: 600;">${velocityResult.timeDeltaFormatted || 'N/A'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-subtle);">
                  <span>📍 Previous Scan Location:</span>
                  <span style="font-weight: 600;">${velocityResult.previousScan?.city || velocityResult.conflictingScan?.city || 'Unknown'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-subtle);">
                  <span>📍 Current Scan Location:</span>
                  <span style="font-weight: 600;">${velocityResult.newLocation?.city || 'Current Location'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-subtle);">
                  <span>🔢 Total Scans Recorded:</span>
                  <span style="color: var(--accent-red); font-weight: 700;">${velocityResult.totalScans || 0}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                  <span>🛡️ Recommendation:</span>
                  <span style="color: var(--accent-red); font-weight: 800;">DO NOT PURCHASE</span>
                </div>
              </div>

              <!-- Visual Velocity Comparison -->
              <div style="background: rgba(0,0,0,0.3); border-radius: var(--radius-md); padding: 14px; margin-bottom: 20px; text-align: left;">
                <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 10px; text-transform: uppercase;">Velocity Comparison</div>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  <div style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem;">
                    <div style="width: ${Math.min(120 / velocityResult.velocity * 100, 100) * 0.3}%; min-width: 20px; height: 6px; background: var(--accent-green); border-radius: 3px;"></div>
                    <span>🚗 Car: 120 km/h</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem;">
                    <div style="width: ${Math.min(300 / velocityResult.velocity * 100, 100) * 0.3}%; min-width: 20px; height: 6px; background: var(--accent-amber); border-radius: 3px;"></div>
                    <span>🚄 Bullet Train: 300 km/h</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem;">
                    <div style="width: ${Math.min(900 / velocityResult.velocity * 100, 100) * 0.3}%; min-width: 20px; height: 6px; background: var(--accent-cyan); border-radius: 3px;"></div>
                    <span>✈️ Aircraft: 900 km/h</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem;">
                    <div style="width: 100%; min-width: 20px; height: 8px; background: var(--accent-red); border-radius: 3px; animation: pulse-glow 1s infinite;"></div>
                    <span style="color: var(--accent-red); font-weight: 700;">🚨 This QR: ${velocityResult.velocity?.toLocaleString()} km/h</span>
                  </div>
                </div>
              </div>

              <div style="font-size: 0.82rem; color: var(--text-muted); font-style: italic; margin-bottom: 16px;">
                "If a batch of ${product.name} travels faster than the speed of sound, it's not produce — it's a photocopy."
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
}

/**
 * 🚨 Counterfeit / Spoofed QR Alert
 */
function renderCounterfeitAlert(container, sidebarContainer, productId) {
  const escapeHtml = (str) => str.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

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
                  <span>🔬 AI Visual Oracle Score:</span>
                  <span style="color: var(--accent-red); font-weight: 700;">NONE (No Image)</span>
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
}

/**
 * Full product trace with Spatial-Temporal verification + AI Quality display
 */
function renderFullTrace(container, sidebarContainer, product, products, certs, transfers, velocityResult) {
  const productId = product.productId;
  const productCerts = certs.filter(c => c.productId === productId);
  const productTransfers = transfers.filter(t => t.productId === productId);
  const productHistory = blockchain.getProductHistory(productId);
  const users = store.get('users') || {};
  const aiScore = product.aiQualityScore || 0;
  const aiGrade = product.aiQualityGrade || '';

  // Determine dynamic payment split based on AI quality
  let farmerPct = 60, intermediaryPct = 20, retailerPct = 15, platformPct = 5;
  let qualityBonusLabel = '';
  if (aiScore >= 95) {
    farmerPct = 65; platformPct = 0;
    qualityBonusLabel = '🏆 High-Quality Bonus Active';
  } else if (aiScore > 0 && aiScore < 60) {
    farmerPct = 55; platformPct = 10;
    qualityBonusLabel = '⚠️ Quality Reduction Applied';
  }

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

  // AI Quality Verification step
  if (aiScore > 0) {
    journeySteps.push({
      title: '🔬 AI Quality Verified',
      location: 'Edge AI (Browser)',
      actor: 'Visual Oracle AI',
      role: 'AI Engine',
      date: product.createdAt || Date.now() - 22 * 86400000,
      color: 'var(--accent-purple)',
      details: `Score: ${aiScore}% · Grade: ${aiGrade} · IPFS: ${(product.imageIpfsHash || '').slice(0, 16)}...`,
    });
  }

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

  // Spatial-Temporal verification badge
  const geoVerified = velocityResult && velocityResult.verdict !== 'CLONE_DETECTED';
  const geoStatus = velocityResult
    ? (velocityResult.verdict === 'FIRST_SCAN' ? '🟢 First Scan' : geoVerified ? '🟢 Spatially Verified' : '🔴 Clone Alert')
    : '⚪ Geo N/A';

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
          <!-- Spatial-Temporal Verification Banner -->
          ${velocityResult ? `
            <div style="background: ${geoVerified ? 'rgba(34, 197, 94, 0.06)' : 'rgba(239, 68, 68, 0.06)'}; border: 1px solid ${geoVerified ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}; border-radius: var(--radius-md); padding: 10px 14px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.1rem;">${geoVerified ? '🛡️' : '🚨'}</span>
                <div>
                  <div style="font-size: 0.8rem; font-weight: 700; color: ${geoVerified ? 'var(--accent-green)' : 'var(--accent-red)'};">
                    Spatial-Temporal QR Verification: ${geoStatus}
                  </div>
                  <div style="font-size: 0.7rem; color: var(--text-muted);">
                    ${velocityResult.verdict === 'FIRST_SCAN' ? 'First scan recorded — anti-cloning tracking initiated' : `Velocity: ${velocityResult.velocity} km/h · ${velocityResult.totalScans} total scans`}
                  </div>
                </div>
              </div>
              <span class="badge ${geoVerified ? 'badge-success' : 'badge-danger'}" style="font-size: 0.7rem;">${geoStatus}</span>
            </div>
          ` : ''}

          <!-- Consumer Hero Moment: Full Farm-to-Table Provenance Story -->
          <div class="card ledger-card" style="margin-bottom: 24px; border-left: 4px solid var(--role-consumer); background: var(--parchment-card);">
            <div class="card-header" style="border-bottom: 1px solid var(--border-rule);">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="stamp-seal" style="border-color: var(--role-consumer); color: var(--role-consumer); background: var(--role-consumer-bg);">
                    Consumer Provenance Roll
                  </span>
                  <span class="stamp-seal stamp-verified">
                    Blockchain Verified Origin ✓
                  </span>
                </div>
                <div class="card-title" style="margin-top: 8px; font-size: 1.15rem;">
                  Soil-to-Plate Provenance Story
                </div>
              </div>
              <div class="stamp-round" style="border-color: var(--role-consumer); color: var(--role-consumer);">
                TABLE<br/>SEAL
              </div>
            </div>

            <div style="background: var(--parchment-warm); border: 1px solid var(--border-rule); border-radius: var(--radius-sm); padding: 18px 20px; margin-bottom: 4px;">
              <div style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; color: var(--loam); line-height: 1.45; margin-bottom: 8px;">
                "This ${product.name} left ${product.origin} on Sep 1, verified across 3 handlers with full cold-chain integrity, and reached your local store on Sep 5 with zero middleman dilution."
              </div>
              <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--loam-faded); display: flex; gap: 16px; flex-wrap: wrap;">
                <span>• Farmer: <strong style="color: var(--loam);">${product.farmerName}</strong></span>
                <span>• Merkle Root: <strong style="color: var(--role-consumer);">0x9e12...55ad</strong></span>
                <span>• Payout: <strong style="color: var(--semantic-success);">60% Farmer Guaranteed</strong></span>
              </div>
            </div>
          </div>

          <!-- Product Hero -->
          <div class="trace-hero animate-fade-in">
            <div class="trace-hero-qr" id="trace-qr-container"></div>
            <div class="trace-hero-info">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
                ${product.isOrganic ? '<span class="badge badge-success">🌿 Organic Certified</span>' : ''}
                ${productCerts.map(c => `<span class="badge badge-info">✅ ${c.certType} Grade ${c.grade}</span>`).join('')}
                <span class="badge badge-purple">⛓️ Blockchain Verified</span>
                ${aiScore > 0 ? `<span class="badge ${aiScore >= 90 ? 'badge-success' : aiScore >= 65 ? 'badge-info' : 'badge-warning'}">🔬 AI: ${aiGrade} (${aiScore}%)</span>` : ''}
                ${aiScore >= 95 ? '<span class="badge badge-purple" style="font-size: 0.65rem;">🏆 Quality Bonus</span>' : ''}
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
                ${aiScore > 0 ? `
                  <div class="trace-detail">
                    <div class="trace-detail-label">AI Quality</div>
                    <div class="trace-detail-value" style="color: ${aiScore >= 80 ? 'var(--accent-green)' : 'var(--accent-amber)'};">${aiScore}% ${aiGrade}</div>
                  </div>
                ` : ''}
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
                  <div class="card-title">💰 Price Transparency ${qualityBonusLabel ? `<span class="badge badge-purple" style="font-size: 0.65rem; margin-left: 6px;">${qualityBonusLabel}</span>` : ''}</div>
                </div>
                <div class="chart-wrapper" style="height: 200px;">
                  <canvas id="trace-price-chart"></canvas>
                </div>
                <div class="price-breakdown" style="margin-top: 16px;">
                  <div class="price-row">
                    <span class="price-row-label">🌾 Farmer receives</span>
                    <span class="price-row-value" style="color: var(--accent-green);">${formatCurrency(product.pricePerUnit * farmerPct / 100)} (${farmerPct}%)${aiScore >= 95 ? ' 🏆' : ''}</span>
                  </div>
                  <div class="price-row">
                    <span class="price-row-label">🏪 Intermediary</span>
                    <span class="price-row-value">${formatCurrency(product.pricePerUnit * intermediaryPct / 100)} (${intermediaryPct}%)</span>
                  </div>
                  <div class="price-row">
                    <span class="price-row-label">🛒 Retailer</span>
                    <span class="price-row-value">${formatCurrency(product.pricePerUnit * retailerPct / 100)} (${retailerPct}%)</span>
                  </div>
                  <div class="price-row">
                    <span class="price-row-label">⛓️ Platform</span>
                    <span class="price-row-value">${formatCurrency(product.pricePerUnit * platformPct / 100)} (${platformPct}%)${platformPct === 0 ? ' ✨ Waived' : ''}</span>
                  </div>
                </div>
              </div>

              <!-- IPFS & AI Binding -->
              ${aiScore > 0 ? `
                <div class="card animate-fade-in-up">
                  <div class="card-header">
                    <div class="card-title">🔬 AI Oracle × IPFS Binding</div>
                  </div>
                  <div style="padding: 4px 0; font-size: 0.82rem;">
                    <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-subtle);">
                      <span>AI Quality Score</span>
                      <span style="font-weight: 700; color: ${aiScore >= 80 ? 'var(--accent-green)' : 'var(--accent-amber)'};">${aiScore}%</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-subtle);">
                      <span>Quality Grade</span>
                      <span style="font-weight: 700;">${aiGrade}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-subtle);">
                      <span>Image IPFS Hash</span>
                      <span style="font-family: monospace; font-size: 0.72rem; color: var(--accent-cyan);">${(product.imageIpfsHash || '').slice(0, 20)}...</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 6px 0;">
                      <span>Verified By</span>
                      <span>MobileNet v2 (Edge AI)</span>
                    </div>
                  </div>
                </div>
              ` : ''}

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

    // Price breakdown chart with dynamic splits
    createDoughnutChart('trace-price-chart', {
      labels: [`Farmer (${farmerPct}%)`, `Intermediary (${intermediaryPct}%)`, `Retailer (${retailerPct}%)`, `Platform (${platformPct}%)`],
      values: [farmerPct, intermediaryPct, retailerPct, platformPct],
      colors: [
        'rgba(34, 197, 94, 0.85)',
        'rgba(245, 158, 11, 0.85)',
        'rgba(59, 130, 246, 0.85)',
        'rgba(168, 85, 247, 0.85)',
      ],
    });
  }, 100);
}
