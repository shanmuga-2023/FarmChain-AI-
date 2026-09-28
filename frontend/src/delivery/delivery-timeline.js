// frontend/src/delivery/delivery-timeline.js
// Delivery event timeline component
import { i18n } from '../i18n/index.js';

const STATUS_ICONS = {
  ORDER_CREATED: '📝',
  PICKUP_ASSIGNED: '📌',
  PICKED_UP: '📦',
  IN_TRANSIT: '🚚',
  NEAR_DESTINATION: '📍',
  OUT_FOR_DELIVERY: '🏃',
  DELIVERED: '✅',
  BUYER_CONFIRMED: '🤝',
  ESCROW_RELEASED: '💰'
};

const STATUS_COLORS = {
  ORDER_CREATED: '#64748b',
  PICKUP_ASSIGNED: '#f59e0b',
  PICKED_UP: '#3b82f6',
  IN_TRANSIT: '#8b5cf6',
  NEAR_DESTINATION: '#06b6d4',
  OUT_FOR_DELIVERY: '#f97316',
  DELIVERED: '#22c55e',
  BUYER_CONFIRMED: '#10b981',
  ESCROW_RELEASED: '#0ea5e9'
};

export function getStatusLabel(status) {
  const key = `delivery.status.${status.charAt(0).toLowerCase() + status.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase())}`;
  return i18n.t(key) || status.replace(/_/g, ' ');
}

export function renderDeliveryTimeline(events = [], currentStatus = '') {
  if (!events.length) {
    return `<div style="color: var(--text-secondary); padding: 24px; text-align: center;">${i18n.t('delivery.noDeliveries')}</div>`;
  }

  return `
    <div class="delivery-timeline" style="position: relative; padding: 16px 0;">
      ${events.map((event, idx) => {
        const isLast = idx === events.length - 1;
        const icon = STATUS_ICONS[event.status] || '⏺️';
        const color = STATUS_COLORS[event.status] || '#64748b';
        const label = getStatusLabel(event.status);
        const time = event.timestamp ? new Date(event.timestamp).toLocaleString(i18n.getLocale()) : '';

        return `
          <div style="display: flex; gap: 16px; position: relative; padding-bottom: ${isLast ? '0' : '24px'};">
            ${!isLast ? `<div style="position: absolute; left: 19px; top: 40px; bottom: 0; width: 2px; background: ${isLast ? 'transparent' : 'var(--border)'};"></div>` : ''}
            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${color}20; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; z-index: 1;">
              ${icon}
            </div>
            <div style="flex: 1; padding-top: 4px;">
              <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary);">${label}</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">${time}</div>
              ${event.actor ? `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">by ${event.actor}</div>` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
