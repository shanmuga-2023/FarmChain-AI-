// frontend/src/delivery/delivery-timeline.js
// Delivery event timeline component
import { i18n } from '../i18n/index.js';
import { getIcon } from '../utils/icons.js';

function getStatusTimelineIcon(status, color) {
  const iconMap = {
    ORDER_CREATED: 'fileText',
    PICKUP_ASSIGNED: 'mapPin',
    PICKED_UP: 'package',
    IN_TRANSIT: 'delivery',
    NEAR_DESTINATION: 'mapPin',
    OUT_FOR_DELIVERY: 'delivery',
    DELIVERED: 'checkCircle',
    BUYER_CONFIRMED: 'check',
    ESCROW_RELEASED: 'shieldCheck'
  };
  const iconName = iconMap[status] || 'clock';
  return getIcon(iconName, 18, '', `color: ${color};`);
}

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
        const color = STATUS_COLORS[event.status] || '#64748b';
        const icon = getStatusTimelineIcon(event.status, color);
        const label = getStatusLabel(event.status);
        const time = event.timestamp ? new Date(event.timestamp).toLocaleString(i18n.getLocale()) : '';

        return `
          <div style="display: flex; gap: 16px; position: relative; padding-bottom: ${isLast ? '0' : '24px'};">
            ${!isLast ? `<div style="position: absolute; left: 19px; top: 40px; bottom: 0; width: 2px; background: ${isLast ? 'transparent' : 'var(--border)'};"></div>` : ''}
            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${color}20; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; z-index: 1;">
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
