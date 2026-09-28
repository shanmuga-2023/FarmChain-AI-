import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { createLineChart } from '../../components/charts.js';
import { formatCurrency, formatNumber, timeAgo, showToast, localizeCropName, localizeUnit } from '../../utils/helpers.js';
import { PaymentSplitter } from '../../blockchain/contracts.js';
import { blockchain } from '../../blockchain/core.js';
import { i18n } from '../../i18n/index.js';
import { getIcon } from '../../utils/icons.js';

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
              <a href="#/farmer/dashboard" class="nav-tab active">${getIcon('overview', 15)} Dashboard</a>
              <a href="#/farmer/products" class="nav-tab">${getIcon('package', 15)} My Products</a>
              <a href="#/farmer/orders" class="nav-tab">${getIcon('orders', 15)} Orders</a>
            </nav>
          </div>
          <div class="header-right">
            ${i18n.renderLanguageSelector('farmer-lang')}
            <button class="btn-icon theme-toggle-btn" id="header-theme-toggle" data-action="toggle-theme" title="Toggle Dark/Light Mode" aria-label="Toggle theme" style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: var(--surface-secondary); border: 1px solid var(--border); color: var(--text-secondary); cursor: pointer; transition: all 0.2s ease;">
              <svg id="theme-icon-sun" class="theme-icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              <svg id="theme-icon-moon" class="theme-icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            </button>
            <button class="btn-icon bell-btn notification-btn" title="Notifications">${getIcon('bell', 18)}<span class="dot-badge"></span></button>
            <div class="avatar-dropdown">
              <div class="avatar-circle" style="background: rgba(14, 165, 233, 0.12); color: var(--primary); display: flex; align-items: center; justify-content: center;">${getIcon('farmer', 20)}</div>
            </div>
          </div>
        </header>

        <div class="page-content">
          
          <!-- TOP HERO WELCOME STRIP -->
          <div class="hero-strip glass-card emerald-border-left">
            <div class="hero-content">
              <h1 class="hero-greeting">Good Morning, ${firstName}!</h1>
              <p class="hero-subtitle">Your farm in ${user.location} is active and operating smoothly today.</p>
              <div class="quick-stat-pills">
                <span class="pill pill-green">${getIcon('package', 13)} ${activeProducts.length} Active Listings</span>
                <span class="pill pill-green">${getIcon('rupee', 13)} ${formatCurrency(24800)} This Month</span>
                <span class="pill pill-emerald">${getIcon('shieldCheck', 13)} Grade A Avg</span>
              </div>
            </div>
            <div class="hero-illustration">
              <div style="width: 64px; height: 64px; border-radius: 20px; background: rgba(16, 185, 129, 0.12); color: #10b981; display: flex; align-items: center; justify-content: center;">
                ${getIcon('sprout', 36)}
              </div>
            </div>
          </div>

          <!-- EARNINGS OVERVIEW -->
          <div class="stats-grid">
            <div class="stat-card glass-card">
              <div class="stat-icon bg-emerald-dim text-emerald">${getIcon('rupee', 20)}</div>
              <div class="stat-value">${formatCurrency(revenue || 124800)}</div>
              <div class="stat-label">Total Earnings</div>
              <div class="stat-trend positive">${getIcon('trendingUp', 14)} +18% vs last month</div>
            </div>
            <div class="stat-card glass-card">
              <div class="stat-icon bg-violet-dim text-violet">${getIcon('blockchain', 20)}</div>
              <div class="stat-value">34</div>
              <div class="stat-label">Batches Minted</div>
              <div class="stat-trend violet-text">${getIcon('link', 13)} Polygon Amoy</div>
            </div>
            <div class="stat-card glass-card">
              <div class="stat-icon bg-emerald-dim text-emerald">${getIcon('shieldCheck', 20)}</div>
              <div class="stat-value">87/100</div>
              <div class="stat-label">Avg Quality Score</div>
              <div class="stat-trend positive">${getIcon('checkCircle', 13)} Grade A</div>
            </div>
            <div class="stat-card glass-card">
              <div class="stat-icon bg-amber-dim text-amber">${getIcon('clock', 20)}</div>
              <div class="stat-value">${formatCurrency(8200)}</div>
              <div class="stat-label">Pending Payouts</div>
              <div class="stat-trend warning">${getIcon('refresh', 13)} Processing in 2 hrs</div>
            </div>
          </div>

          <!-- MIDDLE SECTION: CHART & LISTINGS -->
          <div class="main-grid">
            
            <!-- EARNINGS CHART -->
            <div class="glass-card chart-section">
              <div class="card-header-flex">
                <h3 class="card-title">${getIcon('trendingUp', 18)} Earnings Trend</h3>
                <div class="pill-toggles">
                  <button class="pill-btn">Month</button>
                  <button class="pill-btn active">Quarter</button>
                  <button class="pill-btn">Year</button>
                </div>
              </div>
              <div class="chart-container">
                <canvas id="earnings-chart"></canvas>
              </div>
              <div class="insight-tooltip text-emerald text-sm mt-2" style="display: flex; align-items: center; gap: 6px;">
                ${getIcon('sparkles', 15)} AI Grade A months peak earnings by 28%
              </div>
            </div>

            <!-- MY ACTIVE LISTINGS -->
            <div class="glass-card listings-section">
              <div class="card-header-flex">
                <h3 class="card-title">${getIcon('package', 18)} Active Listings</h3>
                <a href="#/farmer/products" class="view-all">View All →</a>
              </div>
              <div class="listings-grid">
                ${activeProducts.slice(0, 2).map(p => `
                  <div class="product-mini-card glass-panel">
                    <div class="product-img-wrapper">
                      <div class="placeholder-img bg-dark-dim" style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                        ${getIcon('camera', 16)} ${localizeCropName(p.name)}
                      </div>
                      <span class="badge badge-emerald absolute top-left">${getIcon('checkCircle', 12)} Grade A</span>
                      <span class="badge badge-violet absolute top-right">${getIcon('link', 12)} On-Chain</span>
                      <div class="gps-watermark absolute bottom-left">${getIcon('mapPin', 11)} ${user.location}</div>
                    </div>
                    <div class="product-details">
                      <h4>${localizeCropName(p.name)}</h4>
                      <p>${p.quantity} ${localizeUnit(p.unit)} • ${formatCurrency(p.pricePerUnit)}/kg</p>
                      <span class="stage-badge status-harvested">${getIcon('sprout', 12)} Harvested</span>
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
            <h3 class="card-title mb-3" style="display: flex; align-items: center; gap: 8px;">
              ${getIcon('orders', 18)} Recent Orders
            </h3>
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
                      <td>Retailer</td>
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
            <div class="feed-header" style="display: flex; align-items: center; gap: 8px;">
              <span class="live-dot pulse-green"></span>
              <span class="text-sm text-muted">Live Blockchain Activity (Polygon Amoy)</span>
            </div>
            <div class="feed-scroll">
              <div class="feed-item" style="display: flex; align-items: center; gap: 8px;">
                <span class="text-emerald">${getIcon('checkCircle', 15)}</span> Batch #FC-3847 verified on Polygon Amoy · 2 mins ago
              </div>
              <div class="feed-item" style="display: flex; align-items: center; gap: 8px;">
                <span class="text-violet">${getIcon('link', 15)}</span> Smart contract payment released for Order #ORD-882 · 15 mins ago
              </div>
            </div>
          </div>

        </div>

        <!-- QUICK ACTION FABS -->
        <div class="fab-container">
          <button class="fab fab-secondary" id="fab-voice" title="Voice List">${getIcon('mic', 20)}</button>
          <button class="fab fab-primary" id="fab-list" title="List New Produce">${getIcon('plus', 20)}</button>
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
