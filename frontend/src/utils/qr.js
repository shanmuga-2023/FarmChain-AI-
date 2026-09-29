// ============================================
// FarmChain — QR Code Utilities
// ============================================

import QRCode from 'qrcode';

export async function generateQRCode(data, options = {}) {
  const {
    width = 300,
    margin = 1,
    color = { dark: '#000000', light: '#ffffff' },
  } = options;

  try {
    const dataUrl = await QRCode.toDataURL(JSON.stringify(data), {
      width,
      margin,
      color,
      errorCorrectionLevel: 'H',
    });
    const img = document.createElement('img');
    img.src = dataUrl;
    img.width = width;
    img.height = width;
    img.alt = 'QR Code';
    img.style.borderRadius = '4px';
    img.style.display = 'block';
    img.style.imageRendering = 'crisp-edges';
    return img;
  } catch (err) {
    console.error('QR generation failed:', err);
    return null;
  }
}

export async function generateProductQR(product) {
  const qrData = {
    type: 'FARMCHAIN_PRODUCT',
    productId: product.productId,
    name: product.name,
    origin: product.origin,
    farmerId: product.farmerId,
    isOrganic: product.isOrganic,
    traceUrl: `${window.location.origin}/#/consumer/trace?id=${product.productId}`,
  };

  return await generateQRCode(qrData);
}

export function createQRDisplay(canvas, label = '') {
  const container = document.createElement('div');
  container.className = 'qr-container';

  if (canvas) {
    container.appendChild(canvas);
  }

  if (label) {
    const labelEl = document.createElement('div');
    labelEl.className = 'qr-label';
    labelEl.textContent = label;
    container.appendChild(labelEl);
  }

  return container;
}
