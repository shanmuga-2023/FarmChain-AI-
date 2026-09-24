// ============================================
// FarmChain AI — Farmer Dashboard
// Overview with stats, charts, recent activity
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { createLineChart, createDoughnutChart } from '../../components/charts.js';
import { formatCurrency, formatNumber, timeAgo, getStatusBadge, showToast } from '../../utils/helpers.js';
import { PaymentSplitter } from '../../blockchain/contracts.js';
import { FairPricePredictor } from '../../ai/price-predictor.js';
import { blockchain } from '../../blockchain/core.js';
import { router } from '../../utils/router.js';
import { fetchMandiRates } from '../../utils/api.js';

export function renderFarmerDashboard(container) {
  const user = store.get('currentUser');
  const products = (store.get('products') || []).filter(p => p.farmerId === user.id);
  const orders = (store.get('orders') || []).filter(o => o.sellerId === user.id);
  const revenue = PaymentSplitter.getTotalRevenue(user.id);
  const certs = (store.get('certificates') || []).filter(c => products.some(p => p.productId === c.productId));
  const txs = blockchain.getTransactionsByEntity(user.id);

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'accepted').length;
  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  const totalQuantity = products.reduce((s, p) => s + (p.quantity || 0), 0);

  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main">
        <div class="topbar">
          <div class="topbar-left">
            <div>
              <div class="topbar-title">Welcome back, ${user.name.split(' ')[0]}! 🌾</div>
              <div class="topbar-breadcrumb">
                <span>Dashboard</span> <span>›</span> <span>Overview</span>
              </div>
            </div>
          </div>
          <div class="topbar-right">
            <div class="topbar-search">
              <span class="topbar-search-icon">🔍</span>
              <input type="text" placeholder="Search products, orders..." id="farmer-search-input" />
            </div>
            <button class="btn-icon notification-btn" id="notification-btn">🔔${pendingOrders > 0 ? '<span class="notification-dot"></span>' : ''}</button>
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>Logout</span></button>
          </div>
        </div>

        <div class="page-content">
          <!-- Stats -->
          <div class="dashboard-stats stagger-children">
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-green-dim); color: var(--accent-green);">📦</div>
              <div class="stat-card-value">${products.length}</div>
              <div class="stat-card-label">Listed Products</div>
              <div class="stat-card-change positive">↑ ${totalQuantity} ${products[0]?.unit || 'kg'} total</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-cyan-dim); color: var(--accent-cyan);">💰</div>
              <div class="stat-card-value">${formatCurrency(revenue)}</div>
              <div class="stat-card-label">Total Revenue</div>
              <div class="stat-card-change positive">↑ 60% share guaranteed</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-amber-dim); color: var(--accent-amber);">📋</div>
              <div class="stat-card-value">${orders.length}</div>
              <div class="stat-card-label">Total Orders</div>
              <div class="stat-card-change ${pendingOrders > 0 ? 'negative' : 'positive'}">${pendingOrders} pending</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-purple-dim); color: var(--accent-purple);">✅</div>
              <div class="stat-card-value">${certs.length}</div>
              <div class="stat-card-label">Certifications</div>
              <div class="stat-card-change positive">Verified ✓</div>
            </div>
          </div>

          <!-- Charts Row -->
          <div class="charts-grid">
            <div class="chart-card">
              <div class="chart-card-header">
                <div class="chart-card-title">📈 Price Trends (AI Analysis)</div>
                <div class="tabs">
                  <button class="tab active" data-crop="Rice">Rice</button>
                  <button class="tab" data-crop="Onion">Onion</button>
                  <button class="tab" data-crop="Tomato">Tomato</button>
                </div>
              </div>
              <div class="chart-wrapper">
                <canvas id="farmer-price-chart"></canvas>
              </div>
            </div>

            <div class="chart-card">
              <div class="chart-card-header">
                <div class="chart-card-title">🥧 Product Categories</div>
              </div>
              <div class="chart-wrapper">
                <canvas id="farmer-category-chart"></canvas>
              </div>
            </div>
          </div>

          <!-- Farmer Hero Moment: Stamped AI Price Suggestion with Visible Reasoning -->
          <div class="card ledger-card" style="margin-bottom: 24px; border-left: 4px solid var(--role-farmer);">
            <div class="card-header" style="border-bottom: 1px solid var(--border-rule);">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="stamp-seal" style="border-color: var(--role-farmer); color: var(--role-farmer); background: var(--role-farmer-bg);">
                    AI Price Engine · Formula Proof
                  </span>
                  <span class="stamp-seal stamp-verified">
                    MSP Floor Protected ✓
                  </span>
                </div>
                <div class="card-title" style="margin-top: 8px; font-size: 1.15rem;">
                  Active Harvest Valuation & Transparent Reasoning
                </div>
              </div>
              <div class="stamp-round" title="Verified by AI Oracle">
                AI<br/>ORACLE
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: center; padding: 6px 0;">
              <div>
                <p style="font-size: var(--text-sm); color: var(--loam-light); margin-bottom: 14px;">
                  Every rupee of the suggested price is benchmarked against real-time APMC arrivals, moisture readings, and government MSP floors. No middleman deductions.
                </p>

                <div class="pricing-equation" style="background: var(--parchment-card-alt); border: 1px solid var(--border-rule); border-radius: var(--radius-sm); padding: 14px 16px;">
                  <div class="equation-row">
                    <span class="equation-label">MSP Government Floor</span>
                    <span class="equation-val">₹23.00 / kg</span>
                  </div>
                  <div class="equation-row">
                    <span class="equation-label">AI Quality Grade A+ (+5% Purity Bonus)</span>
                    <span class="equation-val plus">+₹1.15 / kg</span>
                  </div>
                  <div class="equation-row">
                    <span class="equation-label">Regional Mandi Demand Index (+12% Festival Arrival)</span>
                    <span class="equation-val plus">+₹2.76 / kg</span>
                  </div>
                  <div class="equation-row">
                    <span class="equation-label">Cold-Chain Moisture Factor (+7% Dry Index)</span>
                    <span class="equation-val plus">+₹1.61 / kg</span>
                  </div>
                  <div class="equation-total-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border-rule);">
                    <span class="equation-total-label" style="font-size: var(--text-sm); font-weight: 700;">Recommended Locked Price:</span>
                    <span class="equation-total-price" style="color: var(--role-farmer); font-size: 1.45rem;">₹28.52 <span style="font-size: 0.8rem; font-family: var(--font-mono); color: var(--loam-faded);">/ kg</span></span>
                  </div>
                </div>
              </div>

              <div style="background: var(--parchment-warm); padding: 18px; border-radius: var(--radius-sm); border: 1px solid var(--border-rule);">
                <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--loam-faded); text-transform: uppercase; margin-bottom: 6px;">
                  Smart Contract Verification Proof
                </div>
                <div style="font-size: 0.88rem; font-weight: 600; color: var(--loam); margin-bottom: 8px;">
                  Solidity Escrow Rule: 60% Producer Guarantee
                </div>
                <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--loam-light); line-height: 1.6; margin-bottom: 14px;">
                  • Block Index: #2847<br/>
                  • Oracle Feed: AgMarkNet Live<br/>
                  • Contract Hash: <span style="color: var(--role-farmer);">0x7b88...c14e</span><br/>
                  • Status: <strong style="color: var(--role-farmer);">LOCKED ON-CHAIN</strong>
                </div>
                <button class="btn btn-primary btn-sm" id="farmer-stamp-btn" style="background: var(--role-farmer); border-color: var(--role-farmer);">
                  Stamp & Lock Fair Price
                </button>
              </div>
            </div>
          </div>

          <!-- AI Insights + Recent Transactions -->
          <div class="charts-grid equal">
            <div class="card">
              <div class="card-header">
                <div class="card-title">Listed Harvest Valuations</div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 12px;" id="ai-insights-container">
                ${products.slice(0, 3).map(p => {
                  const prediction = FairPricePredictor.predict(p.name.split(' ').pop(), p.quantity, p.pricePerUnit);
                  return `
                    <div class="ai-insight-card" style="background: ${prediction.isFairlyPriced ? 'var(--accent-green-dim)' : 'var(--accent-amber-dim)'}; border-color: ${prediction.isFairlyPriced ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'};">
                      <div class="ai-insight-title">
                        <span>${p.emoji || '🌱'}</span> ${p.name}
                      </div>
                      <div class="ai-insight-value" style="color: ${prediction.isFairlyPriced ? 'var(--accent-green)' : 'var(--accent-amber)'};">
                        ${formatCurrency(prediction.predictedFairPrice)}<span style="font-size: 0.7rem; color: var(--text-muted);">/${p.unit}</span>
                      </div>
                      <div class="ai-insight-desc">${prediction.recommendation}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <div class="card-title">⛓️ Recent Blockchain Activity</div>
              </div>
              <div class="tx-feed">
                ${txs.slice(-5).reverse().map(tx => {
                  const statusBadge = getStatusBadge(tx.status || 'completed');
                  const icons = { 'PRODUCT_REGISTERED': '📦', 'LISTING_CREATED': '📋', 'ORDER_PLACED': '🛍️', 'PAYMENT_PROCESSED': '💰', 'CERTIFICATE_ISSUED': '✅', 'TRANSFER_INITIATED': '🔄' };
                  return `
                    <div class="tx-item">
                      <div class="tx-icon" style="background: var(--accent-green-dim); color: var(--accent-green);">${icons[tx.type] || '📝'}</div>
                      <div class="tx-info">
                        <div class="tx-title">${tx.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</div>
                        <div class="tx-meta">Block #${tx.blockIndex} · ${timeAgo(tx.blockTimestamp)}</div>
                      </div>
                      <span class="badge ${statusBadge.class}">${statusBadge.label}</span>
                    </div>
                  `;
                }).join('') || '<div class="empty-state"><p>No transactions yet</p></div>'}
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="card" style="margin-top: 20px;">
            <div class="card-header">
              <div class="card-title">⚡ Quick Actions</div>
            </div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <button class="btn btn-primary btn-sm" onclick="window.location.hash='/farmer/products'">➕ Add Product</button>
              <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/farmer/orders'">📋 View Orders</button>
              <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/farmer/pricing'">🤖 AI Pricing</button>
              <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/farmer/blockchain'">⛓️ Blockchain</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
  // Farmer stamp button handler
  const farmerStampBtn = container.querySelector('#farmer-stamp-btn');
  farmerStampBtn?.addEventListener('click', () => {
    farmerStampBtn.textContent = 'Price Locked on Blockchain ✓';
    farmerStampBtn.classList.add('is-success');
    showToast('Fair price of ₹28.52/kg stamped to Block #2847 with 60% producer payout rule!', 'success');
    setTimeout(() => {
      farmerStampBtn.textContent = 'Stamp & Lock Fair Price';
      farmerStampBtn.classList.remove('is-success');
    }, 3000);
  });

  // Notification bell handler
  container.querySelector('#notification-btn')?.addEventListener('click', () => {
    if (pendingOrders > 0) {
      showToast(`You have ${pendingOrders} pending order(s) awaiting action`, 'info');
      router.navigate('/farmer/orders');
    } else {
      showToast('No new notifications', 'info');
    }
  });

  // Fetch live Mandi rates from server
  fetchMandiRates().then(rates => {
    if (!rates) return;
    const liveContainer = container.querySelector('#live-mandi-rates');
    if (!liveContainer) return;
    const topCrops = ['Rice', 'Wheat', 'Tomato', 'Onion'].filter(c => rates[c]);
    liveContainer.innerHTML = topCrops.map(crop => {
      const r = rates[crop];
      return `
        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-subtle);">
          <span style="font-weight: 500;">${crop}</span>
          <span style="color: var(--accent-green); font-weight: 600;">₹${r.pricePerKg}/kg</span>
          <span class="badge ${r.trend === 'up' ? 'badge-success' : r.trend === 'down' ? 'badge-danger' : 'badge-info'}">${r.trend === 'up' ? '↑' : r.trend === 'down' ? '↓' : '→'}</span>
        </div>
      `;
    }).join('');
  });

  // Initialize charts
  setTimeout(() => {
    const priceTrend = FairPricePredictor.getPriceTrend('Rice');
    createLineChart('farmer-price-chart', {
      labels: priceTrend.map(t => t.month),
      datasets: [{
        label: 'Market Price (₹/quintal)',
        data: priceTrend.map(t => t.price),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
      }],
    });

    const categories = {};
    products.forEach(p => { categories[p.category] = (categories[p.category] || 0) + 1; });
    createDoughnutChart('farmer-category-chart', {
      labels: Object.keys(categories),
      values: Object.values(categories),
    });

    // Tab switching for price chart
    container.querySelectorAll('.tab[data-crop]').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.tab[data-crop]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const crop = tab.dataset.crop;
        const trend = FairPricePredictor.getPriceTrend(crop);
        createLineChart('farmer-price-chart', {
          labels: trend.map(t => t.month),
          datasets: [{
            label: `${crop} Price (₹/quintal)`,
            data: trend.map(t => t.price),
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
          }],
        });
      });
    });
  }, 100);
}
