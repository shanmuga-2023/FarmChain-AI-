// ============================================
// FarmChain AI — Sidebar Component (Fully Localized)
// Role-based sidebar navigation with Language Switcher
// ============================================

import { store } from '../data/store.js';
import { getRoleConfig } from '../utils/helpers.js';
import { router } from '../utils/router.js';
import { i18n } from '../i18n/index.js';
import { toggleTheme } from '../utils/theme.js';

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
    <aside class="saas-sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 4 13V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7a7 7 0 0 1-7 7Z"/><path d="M12 22v-2"/><path d="m9 10 3 3 3-3"/></svg>
          <span style="font-weight: 700; color: var(--text-primary); letter-spacing: -0.5px; font-size: 1.1rem;">FarmChain <span style="color: var(--primary);">AI</span> <sup style="font-size: 0.6rem; color: var(--text-secondary); font-weight: 600;">2.0</sup></span>
        </div>
      </div>

      <nav class="sidebar-nav scroll-hidden">
        ${menus.map(section => `
          <div class="sidebar-section">
            <div class="sidebar-section-title" style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin: 16px 14px 8px;">
              ${section.section}
            </div>
            ${section.items.map(item => `
              <div class="sidebar-link ${currentPath === item.path ? 'active' : ''}"
                   data-path="${item.path}"
                   onclick="window.location.hash='${item.path}'"
                   style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin: 0 8px 4px; border-radius: 12px; cursor: pointer; transition: all 0.2s ease; font-weight: ${currentPath === item.path ? '600' : '500'}; color: ${currentPath === item.path ? 'var(--primary-dark)' : 'var(--text-secondary)'}; background: ${currentPath === item.path ? 'rgba(14, 165, 233, 0.12)' : 'transparent'};">
                <span class="sidebar-link-icon" style="font-size: 1.1rem;">${item.icon}</span>
                <span style="font-size: 0.95rem;">${item.label}</span>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </nav>

      <div class="sidebar-footer">
        
        <!-- Premium User Card -->
        <div class="sidebar-user-card" style="background: var(--surface-secondary); border: 1px solid var(--border); border-radius: 18px; padding: 16px; margin: 12px; display: flex; flex-direction: column; gap: 12px; position: relative;">
          
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="sidebar-avatar" style="width: 36px; height: 36px; border-radius: 10px; background: rgba(14, 165, 233, 0.15); display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
              ${user.avatar || config.icon}
            </div>
            <div class="sidebar-user-info" style="flex: 1; min-width: 0;">
              <div class="sidebar-user-name" style="font-weight: 600; font-size: 0.9rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.name}</div>
              <div class="sidebar-user-role" style="font-size: 0.75rem; color: var(--text-secondary); text-transform: capitalize;">${config.label}</div>
            </div>
          </div>

          <div id="sidebar-wallet-slot" style="margin-top: 4px;"></div>

          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 12px; margin-top: 4px;">
            <button id="theme-toggle-btn" style="background: transparent; border: none; font-size: 1.1rem; cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; padding: 6px; border-radius: 8px; transition: all 0.2s ease;">
              <svg id="theme-icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              <svg id="theme-icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            </button>
            <button class="logout-btn" data-action="logout" style="background: transparent; border: none; font-size: 0.85rem; font-weight: 500; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; gap: 6px; transition: color 0.2s ease;">
              Logout
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            </button>
          </div>
        </div>
      </div>
    </aside>
  `;

  // Update Theme Icon Based on Current State
  const updateThemeIcon = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const sun = container.querySelector('#theme-icon-sun');
    const moon = container.querySelector('#theme-icon-moon');
    if (sun && moon) {
      sun.style.display = isDark ? 'block' : 'none';
      moon.style.display = isDark ? 'none' : 'block';
    }
  };
  
  updateThemeIcon();

  const themeBtn = container.querySelector('#theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      toggleTheme();
      updateThemeIcon();
    });
  }

  // Render MetaMask connect button in sidebar only for non-farmer roles
  if (role !== 'farmer') {
    setTimeout(() => {
      import('./wallet-connect.js').then(({ renderWalletConnectButton }) => {
        renderWalletConnectButton('sidebar-wallet-slot');
      });
    }, 50);
  }
}
