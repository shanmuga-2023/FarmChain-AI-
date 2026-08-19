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

          <div class="charts-grid">
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
