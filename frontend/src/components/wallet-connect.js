// src/components/wallet-connect.js
// MetaMask Connect Button UI Component

import { web3Service } from '../web3/provider.js';
import { truncateHash, showToast } from '../utils/helpers.js';
import { i18n } from '../i18n/index.js';

export function renderWalletConnectButton(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  function updateUI() {
    if (web3Service.isConnected) {
      web3Service.getBalance().then(balance => {
        container.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); padding: 4px 12px; border-radius: var(--radius-full); font-size: 0.8rem;">
            <span style="display: inline-block; width: 8px; height: 8px; background: #22c55e; border-radius: 50%;"></span>
            <span style="font-family: monospace; color: var(--accent-green); font-weight: 600;">${truncateHash(web3Service.address, 6)}</span>
            <span style="color: var(--text-muted); font-size: 0.75rem;">(${balance} SepoliaETH)</span>
          </div>
        `;
      });
    } else {
      container.innerHTML = `
        <button class="btn btn-secondary btn-sm" id="connect-metamask-btn" style="display: flex; align-items: center; gap: 6px; padding: 5px 12px; font-size: 0.8rem; border-color: rgba(245, 158, 11, 0.4); background: rgba(245, 158, 11, 0.08);">
          <span>🦊</span> ${i18n.t('wallet.connectMetaMask')}
        </button>
      `;

      container.querySelector('#connect-metamask-btn')?.addEventListener('click', async () => {
        try {
          await web3Service.connect();
          await web3Service.switchToSepolia();
          showToast(`MetaMask ${i18n.t('wallet.connectedSepolia')} 🦊`, 'success');
          updateUI();
        } catch (error) {
          showToast(error.message || i18n.t('wallet.connectFailed'), 'error');
        }
      });
    }
  }

  web3Service.onChange(updateUI);
  updateUI();
}
