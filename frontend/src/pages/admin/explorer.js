// ============================================
// FarmChain AI — Blockchain Explorer (Admin)
// Full chain visualization
// Fully Localized (en, hi, ta, te)
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { formatDateTime, truncateHash, localizeCropName } from '../../utils/helpers.js';
import { blockchain } from '../../blockchain/core.js';
import { i18n } from '../../i18n/index.js';

export function renderAdminExplorer(container) {
  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

  const chain = blockchain.chain || [];
  const isValid = blockchain.isChainValid();

  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main">
        <div class="topbar">
          <div class="topbar-left">
            <div>
              <div class="topbar-title">${i18n.t('admin.explorerTitle') || 'Blockchain Explorer ⛓️'}</div>
              <div class="topbar-breadcrumb"><span>${i18n.t('admin.role') || 'Admin'}</span> <span>›</span> <span>${i18n.t('admin.navExplorer') || 'Explorer'}</span></div>
            </div>
          </div>
          <div class="topbar-right">
            <span class="badge ${isValid ? 'badge-success' : 'badge-danger'}" style="font-size: 0.85rem; padding: 6px 14px;">
              ${isValid ? (i18n.t('admin.chainVerified') || '✅ Chain Integrity Verified') : (i18n.t('admin.chainCompromised') || '❌ Chain Compromised')}
            </span>
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>${i18n.t('common.logout') || 'Logout'}</span></button>
          </div>
        </div>

        <div class="page-content">
          <div class="dashboard-stats stagger-children">
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-green-dim); color: var(--accent-green);">⛓️</div>
              <div class="stat-card-value">${chain.length}</div>
              <div class="stat-card-label">${i18n.t('admin.statBlocks') || 'Total Blocks'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-cyan-dim); color: var(--accent-cyan);">📝</div>
              <div class="stat-card-value">${chain.length - 1}</div>
              <div class="stat-card-label">${i18n.t('admin.transactions') || 'Transactions'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-amber-dim); color: var(--accent-amber);">🔒</div>
              <div class="stat-card-value">SHA-256</div>
              <div class="stat-card-label">${i18n.t('admin.hashAlgorithm') || 'Hash Algorithm'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: ${isValid ? 'var(--accent-green-dim)' : 'var(--accent-red-dim)'}; color: ${isValid ? 'var(--accent-green)' : 'var(--accent-red)'};">
                ${isValid ? '✅' : '❌'}
              </div>
              <div class="stat-card-value">${isValid ? (i18n.t('admin.statusValid') || 'Valid') : (i18n.t('admin.statusInvalid') || 'Invalid')}</div>
              <div class="stat-card-label">${i18n.t('admin.chainStatus') || 'Chain Status'}</div>
            </div>
          </div>

          <!-- Search -->
          <div class="card" style="margin-bottom: 20px;">
            <div class="search-bar">
              <span class="search-bar-icon">🔍</span>
              <input type="text" placeholder="${i18n.t('admin.searchBlocks') || 'Search by block index, hash, or transaction type...'}" id="block-search" />
            </div>
          </div>

          <!-- Chain Blocks -->
          <div class="explorer-chain" id="blocks-container">
            ${chain.slice().reverse().map((block, i) => `
              <div class="block explorer-block" data-index="${block.index}" data-type="${block.data?.type || ''}" data-hash="${block.hash || ''}">
                <div class="block-header">
                  <span class="block-index">${block.index === 0 ? (i18n.t('admin.genesisBlock') || '🏁 Genesis Block') : (i18n.t('trace.blockNumber', { index: block.index }) || `Block #${block.index}`)}</span>
                  <span class="block-time">${formatDateTime(block.timestamp)}</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 8px 0;">
                  <div>
                    <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">${i18n.t('common.type') || 'Type'}</span>
                    <div style="font-size: 0.85rem; font-weight: 500;">${block.data?.type?.replace(/_/g, ' ') || 'Genesis'}</div>
                  </div>
                  ${block.data?.productName ? `
                    <div>
                      <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">${i18n.t('common.product') || 'Product'}</span>
                      <div style="font-size: 0.85rem;">${localizeCropName(block.data.productName)}</div>
                    </div>
                  ` : ''}
                  ${block.data?.txId ? `
                    <div>
                      <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">TX ID</span>
                      <div style="font-family: monospace; font-size: 0.78rem; color: var(--accent-cyan);">${block.data.txId}</div>
                    </div>
                  ` : ''}
                  <div>
                    <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Nonce</span>
                    <div style="font-size: 0.85rem;">${block.nonce || 0}</div>
                  </div>
                </div>

                <div class="block-hash">
                  <span class="block-hash-label">Hash: </span>${block.hash}
                </div>
                <div class="block-hash" style="margin-top: 4px;">
                  <span class="block-hash-label">Prev: </span>${block.previousHash}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </main>
    </div>
  `;

  // Search filter
  container.querySelector('#block-search')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    container.querySelectorAll('.explorer-block').forEach(b => {
      const idx = b.dataset.index;
      const type = b.dataset.type.toLowerCase();
      const hash = b.dataset.hash.toLowerCase();
      b.style.display = idx.includes(query) || type.includes(query) || hash.includes(query) ? '' : 'none';
    });
  });
}
