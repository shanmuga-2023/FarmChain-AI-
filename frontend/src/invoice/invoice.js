// frontend/src/invoice/invoice.js
// Invoice list page — works for all roles
import { store } from '../data/store.js';
import { renderSidebar } from '../components/sidebar.js';
import { i18n } from '../i18n/index.js';
import { formatCurrency, showToast } from '../utils/helpers.js';
import { showInvoicePreview } from './invoice-preview.js';
import { generateInvoiceHTML } from './invoice-template.js';
import { getIcon } from '../utils/icons.js';

import { API_BASE } from '../utils/api.js';

export async function renderInvoicePage(container) {
  const user = store.get('currentUser');
  const role = store.get('currentRole');
  if (!user || !role) return;

  container.innerHTML = `
    <div class="dashboard-layout">
      <div id="sidebar-temp"></div>
      <main class="dashboard-main">
        <div style="padding: 40px; text-align: center;">Loading invoices...</div>
      </main>
    </div>
  `;
  renderSidebar(container.querySelector('#sidebar-temp'));

  let invoices = [];
  try {
    const res = await fetch(`${API_BASE}/invoices?userId=${user.id}&role=${role}`);
    if (res.ok) {
      const data = await res.json();
      invoices = data.invoices || [];
    }
  } catch (e) {
    console.error('Failed to fetch invoices', e);
  }

  const totalRevenue = invoices.reduce((s, inv) => s + (role === 'farmer' ? (inv.farmerPayout || 0) : (inv.total || 0)), 0);

  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main">
        <header class="glass-header">
          <div class="header-left">
            <div>
              <h2 class="header-title">${i18n.t('invoice.title') || 'Invoices'}</h2>
              <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">${i18n.t('invoice.myInvoices') || 'Invoice History'}</div>
            </div>
          </div>
        </header>

        <div class="page-content">
          <!-- Stats -->
          <div class="dashboard-stats">
            <div class="stat-card">
              <div class="stat-card-icon" style="background: rgba(14,165,233,0.1); color: #0ea5e9;">${getIcon('fileText', 22)}</div>
              <div class="stat-card-value">${invoices.length}</div>
              <div class="stat-card-label">${i18n.t('invoice.title') || 'Invoices'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: rgba(34,197,94,0.1); color: #22c55e;">${getIcon('creditCard', 22)}</div>
              <div class="stat-card-value">${formatCurrency(totalRevenue)}</div>
              <div class="stat-card-label">${role === 'farmer' ? (i18n.t('invoice.farmerPayout') || 'Payout') : (i18n.t('invoice.total') || 'Total')}</div>
            </div>
          </div>

          ${invoices.length === 0 ? `
            <div class="card" style="text-align: center; padding: 60px 24px;">
              <div style="display: flex; justify-content: center; margin-bottom: 16px; color: var(--text-muted);">${getIcon('fileText', 44)}</div>
              <h3 style="color: var(--text-primary); margin-bottom: 8px;">${i18n.t('invoice.noInvoices') || 'No Invoices Found'}</h3>
              <p style="color: var(--text-secondary); font-size: 0.9rem;">${i18n.t('invoice.generatedAutomatically') || 'Invoices are generated upon completed transactions.'}</p>
            </div>
          ` : `
            <div class="card">
              <div class="card-header">
                <div class="card-title">${i18n.t('invoice.myInvoices') || 'Invoice History'}</div>
              </div>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>${i18n.t('invoice.invoiceId') || 'Invoice ID'}</th>
                    <th>${i18n.t('invoice.produce') || 'Produce'}</th>
                    <th>${i18n.t('invoice.quantity') || 'Quantity'}</th>
                    <th>${i18n.t('invoice.total') || 'Total'}</th>
                    <th>${i18n.t('invoice.invoiceDate') || 'Date'}</th>
                    <th>${i18n.t('common.actions') || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoices.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(inv => `
                    <tr>
                      <td><span style="font-weight: 600; color: var(--primary);">${inv.invoiceId}</span></td>
                      <td>${inv.produce || '—'}</td>
                      <td>${inv.quantity || 0} ${inv.unit || 'kg'}</td>
                      <td style="font-weight: 600;">${formatCurrency(inv.total || 0)}</td>
                      <td style="font-size: 0.85rem; color: var(--text-secondary);">${inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString(i18n.getLocale()) : '—'}</td>
                      <td>
                        <button class="btn btn-sm invoice-view-btn" data-invoice-id="${inv.invoiceId}" style="font-size: 0.8rem; padding: 6px 12px; background: var(--surface-secondary); border: 1px solid var(--border); color: var(--text-primary); border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                          ${getIcon('search', 13)}
                          <span>${i18n.t('invoice.preview') || 'View'}</span>
                        </button>
                        <button class="btn btn-sm btn-primary invoice-dl-btn" data-invoice-id="${inv.invoiceId}" style="font-size: 0.8rem; padding: 6px 12px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                          ${getIcon('download', 13)}
                          <span>Print/DL</span>
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </main>
    </div>
  `;

  // Bind view buttons
  container.querySelectorAll('.invoice-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const invoiceId = btn.dataset.invoiceId;
      window.open(`${API_BASE}/invoices/${invoiceId}/html`);
    });
  });
  
  // Bind download/print buttons
  container.querySelectorAll('.invoice-dl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const invoiceId = btn.dataset.invoiceId;
      window.open(`${API_BASE}/invoices/${invoiceId}/html?print=true`);
    });
  });
}

// Public invoice verification page
export function renderInvoiceVerify(container) {
  const hash = window.location.hash;
  const match = hash.match(/\/verify\/invoice\/(.+)/);
  const invoiceId = match ? match[1] : null;

  if (!invoiceId) {
    container.innerHTML = `<div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--background);"><div class="card" style="max-width: 500px; text-align: center; padding: 40px;"><div style="display: flex; justify-content: center; margin-bottom: 12px; color: var(--accent-red);">${getIcon('alert', 40)}</div><h2 style="font-size: 1.25rem;">${i18n.t('invoice.errors.notFound')}</h2></div></div>`;
    return;
  }

  const allInvoices = store.get('invoices') || [];
  const invoice = allInvoices.find(inv => inv.invoiceId === invoiceId);

  if (!invoice) {
    container.innerHTML = `<div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--background);"><div class="card" style="max-width: 500px; text-align: center; padding: 40px;"><div style="display: flex; justify-content: center; margin-bottom: 12px; color: var(--accent-red);">${getIcon('alert', 40)}</div><h2 style="font-size: 1.25rem;">${i18n.t('invoice.errors.notFound')}</h2><p style="color: var(--text-secondary); margin-top: 8px;">${invoiceId}</p></div></div>`;
    return;
  }

  container.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--background); padding: 24px;">
      <div style="max-width: 600px; width: 100%;">
        <div class="card" style="padding: 40px; text-align: center; margin-bottom: 16px;">
          <div style="display: flex; justify-content: center; margin-bottom: 16px; color: #22c55e;">${getIcon('checkCircle', 48)}</div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #22c55e; margin-bottom: 8px;">${i18n.t('invoice.verified')}</h2>
          <p style="color: var(--text-secondary); margin-bottom: 24px;">${i18n.t('invoice.publicVerification')}</p>

          <div style="text-align: left; display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border);">
              <span style="color: var(--text-secondary);">${i18n.t('invoice.invoiceId')}</span>
              <span style="font-weight: 600; color: var(--primary);">${invoice.invoiceId}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border);">
              <span style="color: var(--text-secondary);">${i18n.t('delivery.orderId')}</span>
              <span style="font-weight: 600;">${invoice.orderId || '—'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border);">
              <span style="color: var(--text-secondary);">${i18n.t('delivery.batchId')}</span>
              <span style="font-weight: 600;">${invoice.batchId || '—'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border);">
              <span style="color: var(--text-secondary);">${i18n.t('invoice.total')}</span>
              <span style="font-weight: 700; font-size: 1.1rem;">${formatCurrency(invoice.total || 0)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border);">
              <span style="color: var(--text-secondary);">${i18n.t('invoice.paymentStatus')}</span>
              <span style="font-weight: 600; color: #22c55e; display: inline-flex; align-items: center; gap: 4px;">${getIcon('check', 14)} ${invoice.paymentStatus || 'Completed'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border);">
              <span style="color: var(--text-secondary);">${i18n.t('invoice.blockchainVerification')}</span>
              <span style="font-weight: 600; color: #0ea5e9; display: inline-flex; align-items: center; gap: 4px;">${invoice.blockchainVerified ? `${getIcon('blockchain', 14)} VERIFIED` : `${getIcon('clock', 14)} Pending`}</span>
            </div>
          </div>

          ${invoice.invoiceHash ? `
            <div style="margin-top: 20px; padding: 12px; background: var(--surface-secondary); border-radius: 12px; text-align: left;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">SHA-256 Hash</div>
              <div style="font-size: 10px; font-family: 'JetBrains Mono', monospace; word-break: break-all; color: var(--text-secondary);">${invoice.invoiceHash}</div>
            </div>
          ` : ''}
        </div>

        <div style="text-align: center;">
          <a href="#/login" style="color: var(--primary); font-weight: 600; text-decoration: none; font-size: 0.9rem;">← ${i18n.t('backHome')}</a>
        </div>
      </div>
    </div>
  `;
}
