// frontend/src/invoice/invoice-template.js
// HTML invoice template generator — used for preview and print
import { i18n } from '../i18n/index.js';
import { formatCurrency } from '../utils/helpers.js';

export function generateInvoiceHTML(invoice, opts = {}) {
  if (!invoice) return '';

  const isPrint = opts.print || false;
  const locale = i18n.getLocale();
  const dateStr = invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  return `
    <div class="invoice-document" style="max-width: 800px; margin: 0 auto; padding: 40px; background: ${isPrint ? '#fff' : 'var(--surface)'}; color: ${isPrint ? '#1a1a1a' : 'var(--text-primary)'}; font-family: 'Inter', sans-serif; border-radius: ${isPrint ? '0' : '20px'}; border: ${isPrint ? 'none' : '1px solid var(--border)'};">

      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid ${isPrint ? '#e5e7eb' : 'var(--border)'};">
        <div>
          <h1 style="font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
            🌾 FarmChain <span style="color: #0ea5e9;">AI</span>
          </h1>
          <p style="font-size: 12px; color: ${isPrint ? '#6b7280' : 'var(--text-secondary)'}; margin: 4px 0 0;">Blockchain-Verified Agricultural Invoice</p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 20px; font-weight: 800; color: #0ea5e9;">${invoice.invoiceId}</div>
          <div style="font-size: 13px; color: ${isPrint ? '#6b7280' : 'var(--text-secondary)'}; margin-top: 4px;">${dateStr}</div>
        </div>
      </div>

      <!-- Seller & Buyer -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px;">
        <div style="padding: 16px; background: ${isPrint ? '#f9fafb' : 'var(--surface-secondary)'}; border-radius: 12px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${isPrint ? '#9ca3af' : 'var(--text-muted)'}; margin-bottom: 8px;">${i18n.t('invoice.seller')}</div>
          <div style="font-weight: 600; font-size: 15px;">${invoice.seller?.name || '—'}</div>
          <div style="font-size: 13px; color: ${isPrint ? '#6b7280' : 'var(--text-secondary)'}; margin-top: 2px;">${invoice.seller?.location || ''}</div>
        </div>
        <div style="padding: 16px; background: ${isPrint ? '#f9fafb' : 'var(--surface-secondary)'}; border-radius: 12px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${isPrint ? '#9ca3af' : 'var(--text-muted)'}; margin-bottom: 8px;">${i18n.t('invoice.buyer')}</div>
          <div style="font-weight: 600; font-size: 15px;">${invoice.buyer?.name || '—'}</div>
          <div style="font-size: 13px; color: ${isPrint ? '#6b7280' : 'var(--text-secondary)'}; margin-top: 2px;">${invoice.buyer?.location || ''}</div>
        </div>
      </div>

      <!-- Produce Details -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="border-bottom: 2px solid ${isPrint ? '#e5e7eb' : 'var(--border)'};">
            <th style="text-align: left; padding: 10px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${isPrint ? '#6b7280' : 'var(--text-muted)'};">${i18n.t('invoice.produce')}</th>
            <th style="text-align: center; padding: 10px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${isPrint ? '#6b7280' : 'var(--text-muted)'};">${i18n.t('invoice.quantity')}</th>
            <th style="text-align: center; padding: 10px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${isPrint ? '#6b7280' : 'var(--text-muted)'};">${i18n.t('invoice.unitPrice')}</th>
            <th style="text-align: right; padding: 10px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${isPrint ? '#6b7280' : 'var(--text-muted)'};">${i18n.t('invoice.subtotal')}</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid ${isPrint ? '#f3f4f6' : 'var(--border)'};">
            <td style="padding: 14px 0; font-weight: 600; font-size: 15px;">${invoice.produce || '—'}</td>
            <td style="padding: 14px 0; text-align: center; font-size: 14px;">${invoice.quantity || 0} ${invoice.unit || 'kg'}</td>
            <td style="padding: 14px 0; text-align: center; font-size: 14px;">${formatCurrency(invoice.unitPrice || 0)}/${invoice.unit || 'kg'}</td>
            <td style="padding: 14px 0; text-align: right; font-weight: 600; font-size: 15px;">${formatCurrency(invoice.subtotal || 0)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Pricing Breakdown -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 28px;">
        <div style="width: 320px;">
          <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: ${isPrint ? '#6b7280' : 'var(--text-secondary)'};">
            <span>${i18n.t('invoice.subtotal')}</span><span>${formatCurrency(invoice.subtotal || 0)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: ${isPrint ? '#6b7280' : 'var(--text-secondary)'};">
            <span>${i18n.t('invoice.deliveryFee')}</span><span>${formatCurrency(invoice.deliveryFee || 0)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: ${isPrint ? '#9ca3af' : 'var(--text-muted)'};">
            <span>${i18n.t('invoice.platformFee')} (5%)</span><span>${formatCurrency(invoice.platformFee || 0)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: ${isPrint ? '#9ca3af' : 'var(--text-muted)'};">
            <span>${i18n.t('invoice.qualityAllocation')}</span><span>${formatCurrency(invoice.qualityAllocation || 0)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #22c55e;">
            <span>🌾 ${i18n.t('invoice.farmerPayout')} (60%)</span><span style="font-weight: 600;">${formatCurrency(invoice.farmerPayout || 0)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 12px 0; margin-top: 8px; border-top: 2px solid ${isPrint ? '#111827' : 'var(--text-primary)'}; font-size: 18px; font-weight: 800;">
            <span>${i18n.t('invoice.total')}</span><span>${formatCurrency(invoice.total || 0)}</span>
          </div>
        </div>
      </div>

      <!-- Verification -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
        <div style="padding: 12px 16px; background: ${isPrint ? '#f0fdf4' : 'rgba(34,197,94,0.08)'}; border-radius: 12px; border: 1px solid ${isPrint ? '#bbf7d0' : 'rgba(34,197,94,0.2)'};">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${isPrint ? '#16a34a' : '#22c55e'}; margin-bottom: 4px;">${i18n.t('invoice.paymentStatus')}</div>
          <div style="font-size: 14px; font-weight: 600;">✅ ${invoice.paymentStatus || 'Completed'}</div>
        </div>
        <div style="padding: 12px 16px; background: ${isPrint ? '#eff6ff' : 'rgba(14,165,233,0.08)'}; border-radius: 12px; border: 1px solid ${isPrint ? '#bfdbfe' : 'rgba(14,165,233,0.2)'};">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #0ea5e9; margin-bottom: 4px;">${i18n.t('invoice.blockchainVerification')}</div>
          <div style="font-size: 14px; font-weight: 600;">${invoice.blockchainVerified ? '⛓️ VERIFIED' : '⏳ Pending'}</div>
        </div>
      </div>

      <!-- Hash -->
      ${invoice.invoiceHash ? `
        <div style="padding: 12px 16px; background: ${isPrint ? '#f9fafb' : 'var(--surface-secondary)'}; border-radius: 12px; margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${isPrint ? '#9ca3af' : 'var(--text-muted)'}; margin-bottom: 4px;">${i18n.t('invoice.invoiceHash')}</div>
          <div style="font-size: 11px; font-family: 'JetBrains Mono', monospace; word-break: break-all; color: ${isPrint ? '#4b5563' : 'var(--text-secondary)'};">${invoice.invoiceHash}</div>
        </div>
      ` : ''}

      <!-- Order/Batch IDs -->
      <div style="display: flex; gap: 12px; font-size: 12px; color: ${isPrint ? '#9ca3af' : 'var(--text-muted)'};">
        <span>${i18n.t('delivery.orderId')}: ${invoice.orderId || '—'}</span>
        <span>·</span>
        <span>${i18n.t('delivery.batchId')}: ${invoice.batchId || '—'}</span>
      </div>
    </div>
  `;
}
