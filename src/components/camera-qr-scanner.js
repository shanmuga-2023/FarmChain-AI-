// src/components/camera-qr-scanner.js
// Live video camera QR code scanner with html5-qrcode decode + manual fallback

import { createModal, closeModal, showToast } from '../utils/helpers.js';
import { router } from '../utils/router.js';

export function openCameraScanner() {
  let scannerInstance = null;

  const modal = createModal('📸 Live Produce QR Scanner', `
    <div style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px;">
      <p style="font-size: 0.85rem; color: var(--text-secondary);">
        Point your mobile or webcam at the physical QR code label on the crop packaging to verify its blockchain provenance.
      </p>

      <div id="qr-reader" style="width: 100%; max-width: 360px; border-radius: var(--radius-md); overflow: hidden; border: 2px solid var(--accent-green);"></div>

      <div id="qr-scan-status" style="font-size: 0.82rem; color: var(--text-muted);">Initializing scanner...</div>

      <div style="width: 100%; padding-top: 12px; border-top: 1px solid var(--border-subtle);">
        <label class="form-label" style="text-align: left; display: block; margin-bottom: 6px;">Or enter Product Batch ID manually:</label>
        <div style="display: flex; gap: 8px;">
          <input type="text" class="form-input" id="manual-batch-input" placeholder="e.g. PROD-170300..." style="flex: 1;" />
          <button class="btn btn-primary btn-sm" id="manual-verify-btn">Inspect</button>
        </div>
      </div>
    </div>
  `, `
    <button class="btn btn-secondary btn-sm" id="close-camera-modal">Close</button>
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
          if (statusEl) statusEl.textContent = `✅ QR Detected: ${decodedText.slice(0, 40)}...`;

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
            showToast('QR code scanned! Tracing product...', 'success');
            router.navigate(`/consumer/trace?id=${productId}`);
          } else {
            if (statusEl) statusEl.textContent = '⚠️ QR code detected but not a valid FarmChain product.';
          }
        },
        // Error callback — ignored (fires on every non-QR frame)
        () => {}
      );

      if (statusEl) statusEl.textContent = '🔍 Scanning... Point camera at QR code';
    } catch (err) {
      console.warn('QR Scanner init error:', err);
      if (statusEl) {
        statusEl.textContent = 'Camera not available or permission denied. Use manual entry below.';
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
      showToast('Please enter a valid product ID', 'warning');
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
