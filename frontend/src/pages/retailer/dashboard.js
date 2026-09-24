// ============================================
// FarmChain AI — Retailer Dashboard
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { createBarChart, createDoughnutChart } from '../../components/charts.js';
import { formatCurrency, getStatusBadge, showToast, getCropEmoji, createModal, closeModal } from '../../utils/helpers.js';
import { PaymentSplitter, Marketplace } from '../../blockchain/contracts.js';
import { generateProductQR, createQRDisplay } from '../../utils/qr.js';

export function renderRetailerDashboard(container) {
  const user = store.get('currentUser');
  const allProducts = store.get('products') || [];
  const orders = (store.get('orders') || []).filter(o => o.buyerId === user.id);
  const revenue = PaymentSplitter.getTotalRevenue(user.id);

  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main">
        <div class="topbar">
          <div class="topbar-left">
            <div>
              <div class="topbar-title">Welcome, ${user.name} 🛒</div>
              <div class="topbar-breadcrumb"><span>Retailer</span> <span>›</span> <span>Dashboard</span></div>
            </div>
          </div>
          <div class="topbar-right">
            <button class="btn-icon notification-btn">🔔<span class="notification-dot"></span></button>
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>Logout</span></button>
          </div>
        </div>

        <div class="page-content">
          <div class="dashboard-stats stagger-children">
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-blue-dim); color: var(--accent-blue);">🛍️</div>
              <div class="stat-card-value">${orders.length}</div>
              <div class="stat-card-label">Products Sourced</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-green-dim); color: var(--accent-green);">💰</div>
              <div class="stat-card-value">${formatCurrency(revenue)}</div>
              <div class="stat-card-label">Revenue (15% Share)</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-amber-dim); color: var(--accent-amber);">📦</div>
              <div class="stat-card-value">${allProducts.length}</div>
              <div class="stat-card-label">Products Available</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-purple-dim); color: var(--accent-purple);">⛓️</div>
              <div class="stat-card-value">100%</div>
              <div class="stat-card-label">Blockchain Verified</div>
            </div>
          </div>

          <!-- Retailer Hero Moment: Packaging QR Stamping Station -->
          <div class="card ledger-card" style="margin-bottom: 24px; border-left: 4px solid var(--role-retailer);">
            <div class="card-header" style="border-bottom: 1px solid var(--border-rule);">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="stamp-seal" style="border-color: var(--role-retailer); color: var(--role-retailer); background: var(--role-retailer-bg);">
                    Retail Authentication Station
                  </span>
                  <span class="stamp-seal stamp-verified">
                    Packaging QR Impression Engine ✓
                  </span>
                </div>
                <div class="card-title" style="margin-top: 8px; font-size: 1.15rem;">
                  Produce Pack QR Seal Generator & On-Shelf Stamping
                </div>
              </div>
              <div class="stamp-round" style="border-color: var(--role-retailer); color: var(--role-retailer);">
                STORE<br/>SEAL
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: center; padding: 6px 0;">
              <div>
                <p style="font-size: var(--text-sm); color: var(--loam-light); margin-bottom: 14px;">
                  Generate verifiable cryptographic stamps for carton units. Each print embeds temperature integrity, mandi batch root hash, and farmer payout guarantees.
                </p>

                <div style="background: var(--parchment-card-alt); border: 1px solid var(--border-rule); border-radius: var(--radius-sm); padding: 14px 16px; margin-bottom: 14px;">
                  <div style="display: flex; justify-content: space-between; font-size: var(--text-xs); margin-bottom: 6px;">
                    <span style="color: var(--loam-faded);">Active Batch:</span>
                    <strong style="color: var(--loam); font-family: var(--font-mono);">#BATCH-PUN-9920</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: var(--text-xs); margin-bottom: 6px;">
                    <span style="color: var(--loam-faded);">Produce:</span>
                    <span style="color: var(--loam);">Alphonso Mangoes (Ratnagiri Orchards)</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: var(--text-xs); margin-bottom: 6px;">
                    <span style="color: var(--loam-faded);">Units to Stamp:</span>
                    <span style="color: var(--role-retailer); font-family: var(--font-mono); font-weight: 700;">100 Retail Boxes (1kg each)</span>
                  </div>
                </div>

                <button class="btn btn-primary" id="btn-retailer-stamp-qr" style="background: var(--role-retailer); border-color: var(--role-retailer);">
                  Press Packaging Stamp Tool
                </button>
              </div>

              <!-- Stamping visual display -->
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--parchment-warm); border: 1.5px dashed var(--border-rule); border-radius: var(--radius-sm); padding: 20px; min-height: 200px; text-align: center;" id="retailer-stamp-target">
                <div id="stamp-impression-icon" style="font-size: 3rem; margin-bottom: 8px; transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);">
                  🏷️
                </div>
                <div id="stamp-impression-status" style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700; color: var(--loam);">
                  Ready for Stamping
                </div>
                <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--loam-faded); margin-top: 4px;" id="stamp-impression-meta">
                  Press button to apply physical ink impression & blockchain hash
                </div>
              </div>
            </div>
          </div>

            <div class="chart-card">
              <div class="chart-card-header">
                <div class="chart-card-title">📊 Sales Analytics</div>
              </div>
              <div class="chart-wrapper">
                <canvas id="retailer-sales-chart"></canvas>
              </div>
            </div>
            <div class="chart-card">
              <div class="chart-card-header">
                <div class="chart-card-title">📦 Product Categories</div>
              </div>
              <div class="chart-wrapper">
                <canvas id="retailer-category-chart"></canvas>
              </div>
            </div>
          </div>

          <!-- Storefront Products -->
          <div class="card" style="margin-top: 20px;">
            <div class="card-header">
              <div class="card-title">🏬 My Storefront Products</div>
              <button class="btn btn-primary btn-sm" onclick="window.location.hash='/retailer/source'">Source More →</button>
            </div>
            <div class="data-grid" style="margin-top: 16px;">
              ${allProducts.slice(0, 6).map(p => `
                <div class="product-card">
                  <div class="product-card-image" style="height: 120px;">
                    ${p.emoji || getCropEmoji(p.name)}
                    ${p.isOrganic ? '<span class="product-card-badge badge-organic">🌿 Organic</span>' : ''}
                  </div>
                  <div class="product-card-body">
                    <div class="product-card-name">${p.name}</div>
                    <div class="product-card-origin">📍 ${p.origin}</div>
                    <div class="product-card-price">${formatCurrency(p.pricePerUnit)}<span class="product-card-unit">/${p.unit}</span></div>
                  </div>
                  <div class="product-card-footer">
                    <span class="badge badge-success">⛓️ Verified</span>
                    <button class="btn-icon gen-qr-btn" data-product='${JSON.stringify(p)}' title="Generate QR">📱</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  // Retailer Stamping Station Handler
  const stampToolBtn = container.querySelector('#btn-retailer-stamp-qr');
  stampToolBtn?.addEventListener('click', async () => {
    const icon = container.querySelector('#stamp-impression-icon');
    const status = container.querySelector('#stamp-impression-status');
    const meta = container.querySelector('#stamp-impression-meta');
    const target = container.querySelector('#retailer-stamp-target');

    if (icon) icon.style.transform = 'translateY(14px) scale(0.9)';
    stampToolBtn.textContent = 'Pressing Ink Stamp...';

    setTimeout(async () => {
      if (icon) icon.style.transform = 'translateY(0) scale(1)';
      stampToolBtn.textContent = 'Ink Seal Applied ✓';
      stampToolBtn.classList.add('is-success');

      // Generate actual QR code on canvas
      const canvas = await generateProductQR({
        productId: 'BATCH-PUN-9920',
        name: 'Ratnagiri Alphonso Mangoes',
        batchId: 'BATCH-PUN-9920',
        origin: 'Ratnagiri Orchards',
      });

      if (target) {
        target.innerHTML = `
          <div style="border: 2px solid var(--role-retailer); padding: 12px; background: #FAF6ED; border-radius: var(--radius-sm); box-shadow: var(--shadow-sm); animation: scaleIn 0.3s ease-out;">
            <div style="font-family: var(--font-mono); font-size: 0.65rem; color: var(--role-retailer); font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">
              AUTHENTICATED INK SEAL · LOT #PUN-9920
            </div>
            <div style="display: flex; justify-content: center; margin: 8px 0;">
              ${createQRDisplay(canvas, 'Lot PUN-9920').outerHTML}
            </div>
            <div style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--loam-faded);">
              TxHash: 0x9b44...71cf · Shelf ID #B12
            </div>
          </div>
        `;
      }

      showToast('100 Retail Pack QR Stamps generated with indelible cryptographic seal!', 'success');

      setTimeout(() => {
        stampToolBtn.textContent = 'Press Packaging Stamp Tool';
        stampToolBtn.classList.remove('is-success');
      }, 3500);
    }, 450);
  });

  // QR generation
  container.querySelectorAll('.gen-qr-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const product = JSON.parse(btn.dataset.product);
      const canvas = await generateProductQR(product);
      const qrDisplay = createQRDisplay(canvas, product.name);
      createModal('Shelf QR Code', `
        <div style="display: flex; justify-content: center;">${qrDisplay.outerHTML}</div>
        <p style="text-align: center; color: var(--text-muted); font-size: 0.85rem; margin-top: 12px;">
          Print and display on shelf for consumer traceability
        </p>
      `);
    });
  });

  // Charts — use real data from orders
  setTimeout(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailySales = days.map((_, i) => {
      return orders
        .filter(o => o.createdAt && new Date(o.createdAt).getDay() === (i + 1) % 7)
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    });
    const hasRealData = dailySales.some(v => v > 0);
    const totalVolume = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);

    createBarChart('retailer-sales-chart', {
      labels: days,
      datasets: [{
        label: 'Daily Sales (₹)',
        data: hasRealData ? dailySales : [totalVolume * 0.1, totalVolume * 0.12, totalVolume * 0.07, totalVolume * 0.18, totalVolume * 0.15, totalVolume * 0.22, totalVolume * 0.16],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
      }],
    });

    // Real category distribution from ordered products
    const catCounts = {};
    orders.forEach(o => {
      const prod = allProducts.find(p => p.productId === o.productId);
      const cat = prod?.category || 'Other';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });
    const hasCatData = Object.keys(catCounts).length > 0;
    createDoughnutChart('retailer-category-chart', {
      labels: hasCatData ? Object.keys(catCounts) : ['Grains', 'Vegetables', 'Fruits', 'Spices'],
      values: hasCatData ? Object.values(catCounts) : [35, 30, 25, 10],
    });
  }, 100);
}
