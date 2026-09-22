// ============================================
// FarmChain AI — Sidebar Component
// Role-based sidebar navigation
// ============================================

import { store } from '../data/store.js';
import { getRoleConfig } from '../utils/helpers.js';
import { router } from '../utils/router.js';

const SIDEBAR_MENUS = {
  farmer: [
    { section: 'Dashboard', items: [
      { label: 'Overview', icon: '📊', path: '/farmer/dashboard' },
    ]},
    { section: 'Management', items: [
      { label: 'My Products', icon: '📦', path: '/farmer/products' },
      { label: 'Orders', icon: '📋', path: '/farmer/orders' },
    ]},
    { section: 'Insights', items: [
      { label: 'AI Pricing', icon: '🤖', path: '/farmer/pricing' },
      { label: 'Blockchain', icon: '⛓️', path: '/farmer/blockchain' },
    ]},
  ],
  intermediary: [
    { section: 'Dashboard', items: [
      { label: 'Overview', icon: '📊', path: '/intermediary/dashboard' },
    ]},
    { section: 'Operations', items: [
      { label: 'Marketplace', icon: '🏪', path: '/intermediary/marketplace' },
      { label: 'Inventory', icon: '📦', path: '/intermediary/inventory' },
    ]},
    { section: 'Insights', items: [
      { label: 'Transactions', icon: '💰', path: '/intermediary/transactions' },
    ]},
  ],
  retailer: [
    { section: 'Dashboard', items: [
      { label: 'Overview', icon: '📊', path: '/retailer/dashboard' },
    ]},
    { section: 'Store', items: [
      { label: 'Source Products', icon: '🔍', path: '/retailer/source' },
      { label: 'My Storefront', icon: '🏬', path: '/retailer/storefront' },
    ]},
    { section: 'Insights', items: [
      { label: 'Supply Chain', icon: '🔗', path: '/retailer/supplychain' },
    ]},
  ],
  consumer: [
    { section: 'Shop', items: [
      { label: 'Marketplace', icon: '🛍️', path: '/consumer/marketplace' },
    ]},
    { section: 'Verify', items: [
      { label: 'Trace Product', icon: '🔍', path: '/consumer/trace' },
    ]},
    { section: 'Account', items: [
      { label: 'My Orders', icon: '📋', path: '/consumer/orders' },
    ]},
  ],
  admin: [
    { section: 'Dashboard', items: [
      { label: 'Analytics', icon: '📊', path: '/admin/dashboard' },
    ]},
    { section: 'Platform', items: [
      { label: 'Products', icon: '📦', path: '/admin/products' },
      { label: 'Users', icon: '👥', path: '/admin/users' },
      { label: 'Fraud Alerts', icon: '🚨', path: '/admin/fraud' },
    ]},
    { section: 'Blockchain', items: [
      { label: 'Explorer', icon: '⛓️', path: '/admin/explorer' },
      { label: 'Demand Forecast', icon: '📈', path: '/admin/forecast' },
    ]},
  ],
};

export function renderSidebar(container) {
  const role = store.get('currentRole');
  const user = store.get('currentUser');
  if (!role || !user) return;

  const config = getRoleConfig(role);
  const menus = SIDEBAR_MENUS[role] || [];
  const currentPath = router.getCurrentPath();

  container.innerHTML = `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="sidebar-logo-icon" style="background: var(--gradient-primary);">⛓️</div>
          <span>FarmChain <span class="text-gradient">AI</span></span>
        </div>
        <span class="sidebar-role" style="background: ${config.bgColor}; color: ${config.color};">
          ${config.icon} ${config.label}
        </span>
      </div>

      <nav class="sidebar-nav">
        ${menus.map(section => `
          <div class="sidebar-section">
            <div class="sidebar-section-title">${section.section}</div>
            ${section.items.map(item => `
              <div class="sidebar-link ${currentPath === item.path ? 'active' : ''}"
                   data-path="${item.path}"
                   onclick="window.location.hash='${item.path}'">
                <span class="sidebar-link-icon">${item.icon}</span>
                <span>${item.label}</span>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </nav>

      <div class="sidebar-footer">
        <div id="sidebar-wallet-slot" style="margin-bottom: 12px;"></div>
        <div class="sidebar-user">
          <div class="sidebar-avatar" style="background: ${config.bgColor}; color: ${config.color};">
            ${user.avatar || config.icon}
          </div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${user.name}</div>
            <div class="sidebar-user-role">${user.email || user.location || config.label}</div>
          </div>
          <button class="sidebar-logout logout-btn" data-action="logout" title="Log Out of ${user.name}" style="background: rgba(239, 68, 68, 0.12); color: var(--accent-red); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: var(--radius-sm); padding: 6px 8px; font-size: 0.85rem; display: flex; align-items: center; gap: 4px; cursor: pointer;">
            🚪
          </button>
        </div>
      </div>
    </aside>
  `;

  // Render MetaMask connect button in sidebar after insertion
  setTimeout(() => {
    import('./wallet-connect.js').then(({ renderWalletConnectButton }) => {
      renderWalletConnectButton('sidebar-wallet-slot');
    });
  }, 50);
}
