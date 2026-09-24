// ============================================
// FarmChain AI — Main Entry Point
// Wires up router, seeds data, initializes app
// ============================================

import { router } from './utils/router.js';
import { store } from './data/store.js';
import { blockchain } from './blockchain/core.js';
import { seedData } from './data/seed.js';
import { destroyAllCharts } from './components/charts.js';
import { showToast } from './utils/helpers.js';

// Pages
import { renderLanding } from './pages/landing.js';
import { renderAuthPage } from './pages/auth.js';
import { renderFarmerDashboard } from './pages/farmer/dashboard.js';
import { renderFarmerProducts } from './pages/farmer/products.js';
import { renderFarmerOrders } from './pages/farmer/orders.js';
import { renderIntermediaryDashboard } from './pages/intermediary/dashboard.js';
import { renderIntermediaryInventory } from './pages/intermediary/inventory.js';
import { renderRetailerDashboard } from './pages/retailer/dashboard.js';
import { renderRetailerSource } from './pages/retailer/source.js';
import { renderConsumerMarketplace } from './pages/consumer/marketplace.js';
import { renderConsumerTrace } from './pages/consumer/trace.js';
import { renderConsumerOrders } from './pages/consumer/orders.js';
import { renderAdminDashboard } from './pages/admin/dashboard.js';
import { renderAdminExplorer } from './pages/admin/explorer.js';
import { renderAdminFraud } from './pages/admin/fraud.js';
import { renderAdminForecast } from './pages/admin/forecast.js';
import { renderAdminUsers } from './pages/admin/users.js';
import { renderAdminProducts } from './pages/admin/products.js';

// App container
const app = document.getElementById('app');

// ==========================================
// RBAC — Role-Based Access Control
// ==========================================
const ROLE_ROUTE_MAP = {
  farmer: ['/farmer/'],
  intermediary: ['/intermediary/'],
  retailer: ['/retailer/'],
  consumer: ['/consumer/'],
  admin: ['/admin/', '/farmer/', '/intermediary/', '/retailer/', '/consumer/'], // admin can view all
};

function isRouteAllowedForRole(path, role) {
  if (!role) return false;
  const allowed = ROLE_ROUTE_MAP[role];
  if (!allowed) return false;
  return allowed.some(prefix => path.startsWith(prefix));
}

// Loading screen
function showLoading() {
  app.innerHTML = `
    <div class="loading-overlay" id="loading-screen">
      <div style="text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 16px; animation: float 2s ease-in-out infinite;">⛓️</div>
        <h2 style="font-family: var(--font-display); margin-bottom: 8px;">
          FarmChain <span class="text-gradient">AI</span>
        </h2>
        <div class="spinner" style="margin: 16px auto;"></div>
        <p class="loading-text">Initializing blockchain & Firebase sync...</p>
      </div>
    </div>
  `;
}

// Render function wrapper — clears charts before each render
function render(renderFn) {
  return (route) => {
    destroyAllCharts();
    window.scrollTo(0, 0);
    renderFn(app, route);
  };
}

// Auth guard + RBAC — redirect if not logged in or wrong role
router.beforeEach((path) => {
  const publicPaths = ['/', '/login', '/register', 'how-it-works', 'mandi-section', 'features', 'roles'];
  // If it's a known public path or an in-page landing anchor (no leading slash or landing section), allow it
  if (publicPaths.includes(path) || !path.startsWith('/') || path.startsWith('/#')) return true;

  if (!store.isLoggedIn()) {
    router.navigate('/login');
    return false;
  }

  // RBAC check
  const role = store.get('currentRole');
  if (!isRouteAllowedForRole(path, role)) {
    showToast(`Access denied. You are logged in as ${role}.`, 'error');
    router.navigate(`/${role}/dashboard`);
    return false;
  }

  return true;
});

// Register routes
router.register('/', render(renderLanding));
router.register('/login', render(renderAuthPage));
router.register('/register', render(renderAuthPage));

// Farmer routes
router.register('/farmer/dashboard', render(renderFarmerDashboard));
router.register('/farmer/products', render(renderFarmerProducts));
router.register('/farmer/orders', render(renderFarmerOrders));
router.register('/farmer/pricing', render(renderFarmerDashboard)); // reuses dashboard for now
router.register('/farmer/blockchain', () => {
  router.navigate('/farmer/dashboard');
});

// Intermediary routes
router.register('/intermediary/dashboard', render(renderIntermediaryDashboard));
router.register('/intermediary/marketplace', render(renderIntermediaryDashboard));
router.register('/intermediary/inventory', render(renderIntermediaryInventory));
router.register('/intermediary/transactions', render(renderIntermediaryDashboard));

// Retailer routes
router.register('/retailer/dashboard', render(renderRetailerDashboard));
router.register('/retailer/source', render(renderRetailerSource));
router.register('/retailer/storefront', render(renderRetailerDashboard));
router.register('/retailer/supplychain', render(renderRetailerDashboard));

// Consumer routes
router.register('/consumer/dashboard', render(renderConsumerMarketplace));
router.register('/consumer/marketplace', render(renderConsumerMarketplace));
router.register('/consumer/trace', render(renderConsumerTrace));
router.register('/consumer/orders', render(renderConsumerOrders));

// Admin routes
router.register('/admin/dashboard', render(renderAdminDashboard));
router.register('/admin/products', render(renderAdminProducts));
router.register('/admin/explorer', render(renderAdminExplorer));
router.register('/admin/fraud', render(renderAdminFraud));
router.register('/admin/forecast', render(renderAdminForecast));
router.register('/admin/users', render(renderAdminUsers));

// Initialize the application
async function init() {
  showLoading();

  try {
    // Initialize blockchain
    await blockchain.initialize();

    // Seed demo data
    await seedData();

    // Small delay for dramatic effect
    await new Promise(resolve => setTimeout(resolve, 800));

    // Remove loading screen and trigger route
    const currentHash = window.location.hash.slice(1) || '/';
    if (currentHash === '/' || !store.isLoggedIn()) {
      renderLanding(app);
    } else {
      router._handleRoute();
    }

    console.log('🌾 FarmChain AI initialized successfully!');
    console.log('⛓️ Blockchain blocks:', blockchain.getBlockCount());
    console.log('📦 Products:', store.get('products').length);
  } catch (error) {
    console.error('Failed to initialize:', error);
    app.innerHTML = `
      <div class="loading-overlay">
        <div style="text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 16px;">⚠️</div>
          <h2>Initialization Error</h2>
          <p style="color: var(--text-secondary); margin: 12px 0;">${error.message}</p>
          <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>
        </div>
      </div>
    `;
  }
}

// Global click handler for logout buttons and notification bell across all pages
document.addEventListener('click', async (e) => {
  // Logout handler
  const logoutBtn = e.target.closest('[data-action="logout"], .logout-btn, #logout-btn, .sidebar-logout');
  if (logoutBtn) {
    e.preventDefault();
    try {
      const { logoutUser } = await import('./firebase/auth.js');
      await logoutUser();
      showToast('Logged out successfully 👋', 'info');
      router.navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      store.set('currentUser', null);
      store.set('currentRole', null);
      router.navigate('/login');
    }
    return;
  }

  // Notification Bell handler
  const notifBtn = e.target.closest('.notification-btn, #notification-btn');
  if (notifBtn) {
    e.preventDefault();
    e.stopPropagation();
    const { toggleNotificationCenter } = await import('./components/notification-center.js');
    toggleNotificationCenter();
    return;
  }

  // Close notification drawer if clicked outside
  const drawer = document.getElementById('notification-center-drawer');
  if (drawer && !drawer.contains(e.target) && !e.target.closest('.notification-btn, #notification-btn')) {
    const { closeNotificationCenter } = await import('./components/notification-center.js');
    closeNotificationCenter();
  }
});

// Update bell badge on route change
router.beforeEach(() => {
  import('./components/notification-center.js').then(({ updateNotificationBellBadge }) => {
    setTimeout(updateNotificationBellBadge, 100);
  });
  return true;
});

// React instantly to language change without full reload
window.addEventListener('farmchain:lang_changed', () => {
  const currentHash = window.location.hash.slice(1) || '/';
  if (currentHash === '/' || !store.isLoggedIn()) {
    renderLanding(app);
  } else {
    router._handleRoute();
  }
  import('./components/notification-center.js').then(({ updateNotificationBellBadge, renderNotificationCenter }) => {
    updateNotificationBellBadge();
    const drawer = document.getElementById('notification-center-drawer');
    if (drawer) renderNotificationCenter();
  });
});

// Start the app
init();
