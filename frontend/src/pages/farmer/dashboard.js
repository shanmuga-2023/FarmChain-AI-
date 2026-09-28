import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { createLineChart } from '../../components/charts.js';
import { formatCurrency, formatNumber, timeAgo, showToast, localizeCropName, localizeUnit } from '../../utils/helpers.js';
import { PaymentSplitter } from '../../blockchain/contracts.js';
import { blockchain } from '../../blockchain/core.js';
import { i18n } from '../../i18n/index.js';

export function renderFarmerDashboard(container) {
  const user = store.get('currentUser') || { name: 'Farmer', id: 'farmer-001', location: 'Nashik, Maharashtra' };
  const products = (store.get('products') || []).filter(p => p.farmerId === user.id);
  const orders = (store.get('orders') || []).filter(o => o.sellerId === user.id);
  const revenue = PaymentSplitter.getTotalRevenue(user.id);
  const txs = blockchain.getTransactionsByEntity(user.id);

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'accepted');
  const activeProducts = products.filter(p => p.stage !== 'Sold');

  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

  const firstName = user.name.split(' ')[0];

  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main">
        
        <!-- HEADER/NAV -->
        <header class="glass-header">
          <div class="header-left">
            <h2 class="header-title">${i18n.t('roles.farmer')} Portal</h2>
            <nav class="header-nav">
              <a href="#/farmer/dashboard" class="nav-tab active">📊 Dashboard</a>
              <a href="#/farmer/products" class="nav-tab">🌾 My Products</a>
              <a href="#/farmer/orders" class="nav-tab">📦 Orders</a>
            </nav>
          </div>
          <div class="header-right">
            ${i18n.renderLanguageSelector('farmer-lang')}
            <button class="btn-icon bell-btn">🔔<span class="dot-badge"></span></button>
            <div class="avatar-dropdown">
              <div class="avatar-circle">👨🏽‍🌾</div>
            </div>
          </div>
        </header>

        <div class="page-content">
          
          <!-- TOP HERO WELCOME STRIP -->
          <div class="hero-strip glass-card emerald-border-left">
            <div class="hero-content">
              <h1 class="hero-greeting">Good Morning, ${firstName}! 🌞</h1>
              <p class="hero-subtitle">Your farm in ${user.location} is performing well today.</p>
              <div class="quick-stat-pills">
                <span class="pill pill-green">🌾 ${activeProducts.length} Active Listings</span>
                <span class="pill pill-green">💰 ${formatCurrency(24800)} This Month</span>
                <span class="pill pill-emerald">⭐ Grade A Avg</span>
              </div>
            </div>
            <div class="hero-illustration">
              <span style="font-size: 4rem;">🚜</span>
            </div>
          </div>

          <!-- EARNINGS OVERVIEW -->
          <div class="stats-grid">
            <div class="stat-card glass-card">
              <div class="stat-icon bg-emerald-dim text-emerald">💰</div>
              <div class="stat-value">${formatCurrency(revenue || 124800)}</div>
              <div class="stat-label">Total Earnings</div>
              <div class="stat-trend positive">↑ +18% vs last month</div>
            </div>
            <div class="stat-card glass-card">
              <div class="stat-icon bg-violet-dim text-violet">📦</div>
              <div class="stat-value">34</div>
              <div class="stat-label">Batches Minted</div>
              <div class="stat-trend violet-text">⛓️ On Polygon Amoy</div>
            </div>
            <div class="stat-card glass-card">
              <div class="stat-icon bg-emerald-dim text-emerald">🔬</div>
              <div class="stat-value">87/100</div>
              <div class="stat-label">Avg Quality Score</div>
              <div class="stat-trend positive">✨ Grade A</div>
            </div>
            <div class="stat-card glass-card">
              <div class="stat-icon bg-amber-dim text-amber">⚡</div>
              <div class="stat-value">${formatCurrency(8200)}</div>
              <div class="stat-label">Pending Payouts</div>
              <div class="stat-trend warning">Processing in 2 hrs</div>
            </div>
          </div>

          <!-- MIDDLE SECTION: CHART & LISTINGS -->
          <div class="main-grid">
            
            <!-- EARNINGS CHART -->
            <div class="glass-card chart-section">
              <div class="card-header-flex">
                <h3 class="card-title">📈 Earnings Trend</h3>
                <div class="pill-toggles">
                  <button class="pill-btn">Month</button>
                  <button class="pill-btn active">Quarter</button>
                  <button class="pill-btn">Year</button>
                </div>
              </div>
              <div class="chart-container">
                <canvas id="earnings-chart"></canvas>
              </div>
              <div class="insight-tooltip text-emerald text-sm mt-2">
                ✨ AI Grade A months peak earnings by 28%
              </div>
            </div>

            <!-- MY ACTIVE LISTINGS -->
            <div class="glass-card listings-section">
              <div class="card-header-flex">
                <h3 class="card-title">🌾 Active Listings</h3>
                <a href="#/farmer/products" class="view-all">View All →</a>
              </div>
              <div class="listings-grid">
                ${activeProducts.slice(0, 2).map(p => `
                  <div class="product-mini-card glass-panel">
                    <div class="product-img-wrapper">
                      <div class="placeholder-img bg-dark-dim">📸 ${localizeCropName(p.name)}</div>
                      <span class="badge badge-emerald absolute top-left">Grade A ✨</span>
                      <span class="badge badge-violet absolute top-right">⛓️ On-Chain</span>
                      <div class="gps-watermark absolute bottom-left">📍 ${user.location}</div>
                    </div>
                    <div class="product-details">
                      <h4>${localizeCropName(p.name)}</h4>
                      <p>${p.quantity} ${localizeUnit(p.unit)} • ${formatCurrency(p.pricePerUnit)}/kg</p>
                      <span class="stage-badge status-harvested">Harvested 🌾</span>
                      <div class="action-row">
                        <button class="btn-text">Edit</button>
                        <button class="btn-text">View QR</button>
                      </div>
                    </div>
                  </div>
                `).join('') || '<p class="text-muted">No active listings.</p>'}
              </div>
            </div>

          </div>

          <!-- RECENT ORDERS -->
          <div class="glass-card mt-4">
            <h3 class="card-title mb-3">📦 Recent Orders</h3>
            <div class="table-responsive">
              <table class="glass-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Buyer</th>
                    <th>Crop</th>
                    <th>Qty</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${orders.slice(0, 3).map(o => `
                    <tr class="clickable-row">
                      <td class="font-mono text-violet">${o.id}</td>
                      <td>👤 Retailer</td>
                      <td>${localizeCropName(o.cropName || 'Tomato')}</td>
                      <td>${o.quantity} kg</td>
                      <td class="text-emerald font-bold">${formatCurrency(o.totalPrice)}</td>
                      <td><span class="status-chip ${o.status === 'delivered' ? 'chip-green' : 'chip-amber'}">${o.status}</span></td>
                      <td class="text-muted">${timeAgo(o.createdAt || Date.now())}</td>
                    </tr>
                  `).join('') || '<tr><td colspan="7" class="text-center text-muted">No recent orders</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>

          <!-- BLOCKCHAIN ACTIVITY FEED -->
          <div class="activity-feed mt-4">
            <div class="feed-header">
              <span class="live-dot pulse-green"></span>
              <span class="text-sm text-muted">Live Blockchain Activity (Polygon Amoy)</span>
            </div>
            <div class="feed-scroll">
              <div class="feed-item">
                <span class="text-emerald">✅</span> Batch #FC-3847 verified on Polygon Amoy · 2 mins ago
              </div>
              <div class="feed-item">
                <span class="text-violet">⛓️</span> Smart contract payment released for Order #ORD-882 · 15 mins ago
              </div>
            </div>
          </div>

        </div>

        <!-- QUICK ACTION FABS -->
        <div class="fab-container">
          <button class="fab fab-secondary" id="fab-voice" title="Voice List">🎙️</button>
          <button class="fab fab-primary" id="fab-list" title="List New Produce">➕</button>
        </div>
      </main>
    </div>
  `;

  // Render Earnings Chart
  const ctx = container.querySelector('#earnings-chart');
  if (ctx) {
    createLineChart('earnings-chart', {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Earnings (₹)',
        data: [12000, 19000, 15000, 25000, 22000, 31800],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        fill: true,
        tension: 0.4
      }]
    });
  }

  // Event Listeners for FABs
  container.querySelector('#fab-list')?.addEventListener('click', async () => {
    const { FarmerProductWizard } = await import('./product-wizard.js');
    new FarmerProductWizard(container, () => renderFarmerDashboard(container)).open();
  });

  container.querySelector('#fab-voice')?.addEventListener('click', async () => {
    const { FarmerProductWizard } = await import('./product-wizard.js');
    new FarmerProductWizard(container, () => renderFarmerDashboard(container), { initialMode: 'voice' }).open();
  });

  // Theme support
  document.body.classList.add('dark-mode');
}
