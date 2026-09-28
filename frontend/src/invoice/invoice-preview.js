// frontend/src/invoice/invoice-preview.js
// Full-screen invoice preview modal with print/download
import { generateInvoiceHTML } from './invoice-template.js';
import { i18n } from '../i18n/index.js';

export function showInvoicePreview(invoice) {
  // Remove existing preview
  const existing = document.getElementById('invoice-preview-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'invoice-preview-modal';
  modal.style.cssText = 'position: fixed; inset: 0; z-index: 99999; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 24px; overflow-y: auto;';

  modal.innerHTML = `
    <div style="position: relative; width: 100%; max-width: 860px; max-height: 90vh; overflow-y: auto; border-radius: 24px; background: var(--background); box-shadow: 0 24px 48px rgba(0,0,0,0.3);">
      <!-- Toolbar -->
      <div style="position: sticky; top: 0; z-index: 10; display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; background: var(--surface); border-bottom: 1px solid var(--border); border-radius: 24px 24px 0 0;">
        <h3 style="font-size: 1rem; font-weight: 700; margin: 0; color: var(--text-primary);">${i18n.t('invoice.preview')}</h3>
        <div style="display: flex; gap: 8px;">
          <button id="invoice-print-btn" class="btn btn-sm" style="background: var(--surface-secondary); border: 1px solid var(--border); color: var(--text-primary); padding: 6px 14px; border-radius: 10px; font-size: 0.8rem; font-weight: 600; cursor: pointer;">
            🖨️ ${i18n.t('invoice.print')}
          </button>
          <button id="invoice-download-btn" class="btn btn-primary btn-sm" style="padding: 6px 14px; border-radius: 10px; font-size: 0.8rem; font-weight: 600; cursor: pointer;">
            📥 ${i18n.t('invoice.downloadPdf')}
          </button>
          <button id="invoice-close-btn" style="background: none; border: none; font-size: 1.3rem; cursor: pointer; color: var(--text-secondary); padding: 4px 8px;">✕</button>
        </div>
      </div>

      <!-- Invoice Content -->
      <div id="invoice-content" style="padding: 24px;">
        ${generateInvoiceHTML(invoice)}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close button
  modal.querySelector('#invoice-close-btn').addEventListener('click', () => modal.remove());

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  // Print button
  modal.querySelector('#invoice-print-btn').addEventListener('click', () => {
    printInvoice(invoice);
  });

  // Download button
  modal.querySelector('#invoice-download-btn').addEventListener('click', () => {
    printInvoice(invoice); // Uses print-to-PDF
  });
}

function printInvoice(invoice) {
  const printWindow = window.open('', '_blank', 'width=800,height=1100');
  if (!printWindow) return;

  const html = generateInvoiceHTML(invoice, { print: true });

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${invoice.invoiceId} — FarmChain AI Invoice</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, sans-serif; padding: 20px; background: #fff; color: #1a1a1a; }
        @media print { body { padding: 0; } @page { margin: 15mm; } }
      </style>
    </head>
    <body>${html}</body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 500);
}
