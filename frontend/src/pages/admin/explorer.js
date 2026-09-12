// ============================================
// FarmChain AI — Blockchain Explorer (Admin)
// Full chain visualization
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { formatDateTime, truncateHash } from '../../utils/helpers.js';
import { blockchain } from '../../blockchain/core.js';

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
              <div class="topbar-title">Blockchain Explorer ⛓️</div>
              <div class="topbar-breadcrumb"><span>Admin</span> <span>›</span> <span>Explorer</span></div>
            </div>
          </div>
          <div class="topbar-right">
            <span class="badge ${isValid ? 'badge-success' : 'badge-danger'}" style="font-size: 0.85rem; padding: 6px 14px;">
              ${isValid ? '✅ Chain Integrity Verified' : '❌ Chain Compromised'}
            </span>
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>Logout</span></button>
          </div>
        </div>

        <div class="page-content">
          <div class="dashboard-stats stagger-children">
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-green-dim); color: var(--accent-green);">⛓️</div>
              <div class="stat-card-value">${chain.length}</div>
              <div class="stat-card-label">Total Blocks</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-cyan-dim); color: var(--accent-cyan);">📝</div>
              <div class="stat-card-value">${chain.length - 1}</div>
              <div class="stat-card-label">Transactions</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-amber-dim); color: var(--accent-amber);">🔒</div>
              <div class="stat-card-value">SHA-256</div>
              <div class="stat-card-label">Hash Algorithm</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: ${isValid ? 'var(--accent-green-dim)' : 'var(--accent-red-dim)'}; color: ${isValid ? 'var(--accent-green)' : 'var(--accent-red)'};">
                ${isValid ? '✅' : '❌'}
              </div>
              <div class="stat-card-value">${isValid ? 'Valid' : 'Invalid'}</div>
              <div class="stat-card-label">Chain Status</div>
            </div>
          </div>

          <!-- Search -->
          <div class="card" style="margin-bottom: 20px;">
            <div class="search-bar">
              <span class="search-bar-icon">🔍</span>
              <input type="text" placeholder="Search by block index, hash, or transaction type..." id="block-search" />
            </div>
          </div>

          <!-- Chain Blocks -->
          <div class="explorer-chain" id="blocks-container">
            ${chain.slice().reverse().map((block, i) => `
              <div class="block explorer-block" data-index="${block.index}" data-type="${block.data?.type || ''}" data-hash="${block.hash || ''}">
                <div class="block-header">
                  <span class="block-index">${block.index === 0 ? '🏁 Genesis Block' : `Block #${block.index}`}</span>
                  <span class="block-time">${formatDateTime(block.timestamp)}</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 8px 0;">
                  <div>
                    <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Type</span>
                    <div style="font-size: 0.85rem; font-weight: 500;">${block.data?.type?.replace(/_/g, ' ') || 'Genesis'}</div>
                  </div>
                  ${block.data?.productName ? `
                    <div>
                      <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Product</span>
                      <div style="font-size: 0.85rem;">${block.data.productName}</div>
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
                  <span class="block-hash-label">Hash: </span>${block.hash || 'N/A'}
                </div>
                <div class="block-hash" style="margin-top: 4px;">
                  <span class="block-hash-label">Previous Hash: </span>${block.previousHash || 'N/A'}
                </div>

                <div style="margin-top: 8px; display: flex; justify-content: flex-end;">
                  <a href="https://sepolia.etherscan.io/address/0x89A36a18d19F9F8d5B39d997232230D6222b4033" target="_blank" rel="noopener noreferrer" style="font-size: 0.72rem; color: var(--accent-cyan); text-decoration: underline; display: flex; align-items: center; gap: 4px;">
                    🔗 View on Etherscan Sepolia ↗
                  </a>
                </div>
              </div>
              ${i < chain.length - 1 ? '<div class="chain-connector"><div class="chain-connector-line"></div></div>' : ''}
            `).join('')}
          </div>
        </div>
      </main>
    </div>
  `;

  // Search functionality
  container.querySelector('#block-search')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    container.querySelectorAll('.explorer-block').forEach(block => {
      const index = block.dataset.index;
      const type = block.dataset.type.toLowerCase();
      const hash = block.dataset.hash.toLowerCase();
      block.style.display = (index.includes(query) || type.includes(query) || hash.includes(query) || !query) ? '' : 'none';
    });
  });
}
