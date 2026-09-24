// src/components/camera-qr-scanner.js
// Live video camera QR code scanner with html5-qrcode decode + manual fallback

import { createModal, closeModal, showToast } from '../utils/helpers.js';
import { router } from '../utils/router.js';
import { i18n } from '../i18n/index.js';

export function openCameraScanner() {
  let scannerInstance = null;

  const modal = createModal(`📸 ${i18n.t('scanner.modalTitle')}`, `
    <div style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px;">
      <p style="font-size: 0.85rem; color: var(--text-secondary);">
        ${i18n.t('scanner.instructions')}
      </p>

      <div id="qr-reader" style="width: 100%; max-width: 360px; border-radius: var(--radius-md); overflow: hidden; border: 2px solid var(--accent-green);"></div>

      <div id="qr-scan-status" style="font-size: 0.82rem; color: var(--text-muted);">${i18n.t('scanner.initializing')}</div>

      <div style="width: 100%; padding-top: 12px; border-top: 1px solid var(--border-subtle);">
        <label class="form-label" style="text-align: left; display: block; margin-bottom: 6px;">${i18n.t('scanner.manualLabel')}</label>
        <div style="display: flex; gap: 8px;">
          <input type="text" class="form-input" id="manual-batch-input" placeholder="e.g. PROD-170300..." style="flex: 1;" />
          <button class="btn btn-primary btn-sm" id="manual-verify-btn">${i18n.t('scanner.inspectBtn')}</button>
        </div>
      </div>
    </div>
  `, `
    <button class="btn btn-secondary btn-sm" id="close-camera-modal">${i18n.t('common.close')}</button>
  `);

  // Initialize html5-qrcode scanner
  const statusEl = document.getElementById('qr-scan-status');

  async function startScanner() {
    try {
      // Dynamically import html5-qrcode
      const { Html5Qrcode } = await import('html5-qrcode');
      scannerInstance = new Html5Qrcode('qr-reader');

      await scannerInstance.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        // Success callback — QR code decoded
        (decodedText) => {
          if (statusEl) statusEl.textContent = `✅ ${i18n.t('scanner.qrDetected')}: ${decodedText.slice(0, 40)}...`;

          // Parse QR data
          let productId = null;
          try {
            const data = JSON.parse(decodedText);
            if (data.type === 'FARMCHAIN_PRODUCT' && data.productId) {
              productId = data.productId;
            }
          } catch {
            // Maybe it's a direct product ID string
            if (decodedText.startsWith('PROD-')) {
              productId = decodedText;
            }
          }

          if (productId) {
            cleanup();
            showToast(i18n.t('scanner.scanSuccess'), 'success');
            router.navigate(`/consumer/trace?id=${productId}`);
          } else {
            if (statusEl) statusEl.textContent = `⚠️ ${i18n.t('scanner.invalidProduct')}`;
          }
        },
        // Error callback — ignored (fires on every non-QR frame)
        () => {}
      );

      if (statusEl) statusEl.textContent = `🔍 ${i18n.t('scanner.scanningPrompt')}`;
    } catch (err) {
      console.warn('QR Scanner init error:', err);
      if (statusEl) {
        statusEl.textContent = i18n.t('scanner.cameraError');
      }
    }
  }

  startScanner();

  // Handle manual input
  document.getElementById('manual-verify-btn')?.addEventListener('click', () => {
    const val = document.getElementById('manual-batch-input')?.value.trim();
    if (val) {
      cleanup();
      router.navigate(`/consumer/trace?id=${val}`);
    } else {
      showToast(i18n.t('scanner.enterValidId'), 'warning');
    }
  });

  // Cleanup function
  const cleanup = () => {
    if (scannerInstance) {
      scannerInstance.stop().catch(() => {});
      scannerInstance.clear();
      scannerInstance = null;
    }
    closeModal();
  };

  document.getElementById('close-camera-modal')?.addEventListener('click', cleanup);
}
