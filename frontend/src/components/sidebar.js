// ============================================
// FarmChain AI — Sidebar Component (Fully Localized)
// Role-based sidebar navigation with Language Switcher
// ============================================

import { store } from '../data/store.js';
import { getRoleConfig } from '../utils/helpers.js';
import { router } from '../utils/router.js';
import { i18n } from '../i18n/index.js';

function getSidebarMenus() {
  return {
    farmer: [
      {
        section: i18n.t('nav.sections.dashboard') || 'Dashboard',
        items: [
          { label: i18n.t('nav.overview') || 'Overview', icon: '📊', path: '/farmer/dashboard' },
        ],
      },
      {
        section: i18n.t('nav.sections.management') || 'Management',
        items: [
          { label: i18n.t('nav.myProducts') || 'My Products', icon: '📦', path: '/farmer/products' },
          { label: i18n.t('nav.orders') || 'Orders', icon: '📋', path: '/farmer/orders' },
        ],
      },
      {
        section: i18n.t('nav.sections.insights') || 'Insights',
        items: [
          { label: i18n.t('nav.aiPricing') || 'AI Pricing', icon: '🤖', path: '/farmer/pricing' },
        ],
      },
    ],
    intermediary: [
      {
        section: i18n.t('nav.sections.dashboard') || 'Dashboard',
        items: [
          { label: i18n.t('nav.overview') || 'Overview', icon: '📊', path: '/intermediary/dashboard' },
        ],
      },
      {
        section: i18n.t('nav.sections.operations') || 'Operations',
        items: [
          { label: i18n.t('nav.marketplace') || 'Marketplace', icon: '🏪', path: '/intermediary/marketplace' },
          { label: i18n.t('nav.inventory') || 'Inventory', icon: '📦', path: '/intermediary/inventory' },
        ],
      },
      {
        section: i18n.t('nav.sections.insights') || 'Insights',
        items: [
          { label: i18n.t('nav.transactions') || 'Transactions', icon: '💰', path: '/intermediary/transactions' },
        ],
      },
    ],
    retailer: [
      {
        section: i18n.t('nav.sections.dashboard') || 'Dashboard',
        items: [
          { label: i18n.t('nav.overview') || 'Overview', icon: '📊', path: '/retailer/dashboard' },
        ],
      },
      {
        section: i18n.t('nav.sections.store') || 'Store',
        items: [
          { label: i18n.t('nav.sourceProducts') || 'Source Products', icon: '🔍', path: '/retailer/source' },
          { label: i18n.t('nav.myStorefront') || 'My Storefront', icon: '🏬', path: '/retailer/storefront' },
        ],
      },
      {
        section: i18n.t('nav.sections.insights') || 'Insights',
        items: [
          { label: i18n.t('nav.supplyChain') || 'Supply Chain', icon: '🔗', path: '/retailer/supplychain' },
        ],
      },
    ],
    consumer: [
      {
        section: i18n.t('nav.sections.shop') || 'Shop',
        items: [
          { label: i18n.t('nav.marketplace') || 'Marketplace', icon: '🛍️', path: '/consumer/marketplace' },
        ],
      },
      {
        section: i18n.t('nav.sections.verify') || 'Verify',
        items: [
          { label: i18n.t('nav.traceProduct') || 'Trace Product', icon: '🔍', path: '/consumer/trace' },
        ],
      },
      {
        section: i18n.t('nav.sections.account') || 'Account',
        items: [
          { label: i18n.t('nav.myOrders') || 'My Orders', icon: '📋', path: '/consumer/orders' },
        ],
      },
    ],
    admin: [
      {
        section: i18n.t('nav.sections.dashboard') || 'Dashboard',
        items: [
          { label: i18n.t('nav.analytics') || 'Analytics', icon: '📊', path: '/admin/dashboard' },
        ],
      },
      {
        section: i18n.t('nav.sections.platform') || 'Platform',
        items: [
          { label: i18n.t('nav.products') || 'Products', icon: '📦', path: '/admin/products' },
          { label: i18n.t('nav.users') || 'Users', icon: '👥', path: '/admin/users' },
          { label: i18n.t('nav.fraudAlerts') || 'Fraud Alerts', icon: '🚨', path: '/admin/fraud' },
        ],
      },
      {
        section: i18n.t('nav.sections.blockchain') || 'Blockchain',
        items: [
          { label: i18n.t('nav.explorer') || 'Explorer', icon: '⛓️', path: '/admin/explorer' },
          { label: i18n.t('nav.demandForecast') || 'Demand Forecast', icon: '📈', path: '/admin/forecast' },
        ],
      },
    ],
  };
}

export function renderSidebar(container) {
  const role = store.get('currentRole');
  const user = store.get('currentUser');
  if (!role || !user) return;

  const config = getRoleConfig(role);
  const menus = getSidebarMenus()[role] || [];
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
        <div class="sidebar-lang-slot" style="margin-bottom: 12px;">
          ${i18n.renderLanguageSelector('sidebar-lang-select', 'width: 100%; padding: 6px 10px; font-size: 0.8rem; background: var(--bg-card, #1e293b); color: var(--text-primary, #fff); border: 1px solid var(--border-rule, rgba(255,255,255,0.15)); border-radius: 8px; cursor: pointer;')}
        </div>
        <div id="sidebar-wallet-slot" style="margin-bottom: 12px;"></div>
        <div class="sidebar-user">
          <div class="sidebar-avatar" style="background: ${config.bgColor}; color: ${config.color};">
            ${user.avatar || config.icon}
          </div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${user.name}</div>
            <div class="sidebar-user-role">${user.email || user.location || config.label}</div>
          </div>
          <button class="sidebar-logout logout-btn" data-action="logout" title="${i18n.t('logout')}" style="background: rgba(239, 68, 68, 0.12); color: var(--accent-red); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: var(--radius-sm); padding: 6px 8px; font-size: 0.85rem; display: flex; align-items: center; gap: 4px; cursor: pointer;">
            🚪
          </button>
        </div>
      </div>
    </aside>
  `;

  // Render MetaMask connect button in sidebar only for non-farmer roles
  if (role !== 'farmer') {
    setTimeout(() => {
      import('./wallet-connect.js').then(({ renderWalletConnectButton }) => {
        renderWalletConnectButton('sidebar-wallet-slot');
      });
    }, 50);
  }
}
