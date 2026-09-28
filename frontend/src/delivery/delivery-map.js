// frontend/src/delivery/delivery-map.js
// Visual delivery route map (CSS-based, no external map library)
import { i18n } from '../i18n/index.js';
import { getIcon } from '../utils/icons.js';

const ROUTE_STEPS = ['farm', 'pickup', 'transit', 'retailer', 'delivered'];

function getStepIndex(status) {
  const map = {
    ORDER_CREATED: 0,
    PICKUP_ASSIGNED: 0,
    PICKED_UP: 1,
    IN_TRANSIT: 2,
    NEAR_DESTINATION: 3,
    OUT_FOR_DELIVERY: 3,
    DELIVERED: 4,
    BUYER_CONFIRMED: 4,
    ESCROW_RELEASED: 4
  };
  return map[status] ?? 0;
}

export function renderDeliveryMap(delivery) {
  if (!delivery) return '';

  const currentStep = getStepIndex(delivery.status);
  const progress = Math.min(100, (currentStep / (ROUTE_STEPS.length - 1)) * 100);

  const stepIcons = [
    getIcon('sprout', 20),
    getIcon('package', 20),
    getIcon('delivery', 20),
    getIcon('store', 20),
    getIcon('checkCircle', 20)
  ];
  const stepLabels = ROUTE_STEPS.map(s => i18n.t(`delivery.route.${s}`) || s);

  return `
    <div class="delivery-map-visual" style="background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 32px 24px; position: relative; overflow: hidden;">
      <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #22c55e ${progress}%, var(--border) ${progress}%); border-radius: 4px 4px 0 0;"></div>

      <div style="display: flex; justify-content: space-between; align-items: flex-start; position: relative; margin-top: 8px;">
        <!-- Progress line -->
        <div style="position: absolute; top: 24px; left: 28px; right: 28px; height: 3px; background: var(--border); z-index: 0; border-radius: 2px;">
          <div style="width: ${progress}%; height: 100%; background: linear-gradient(90deg, #22c55e, #0ea5e9); border-radius: 2px; transition: width 0.6s ease;"></div>
        </div>

        ${ROUTE_STEPS.map((step, idx) => {
          const isActive = idx <= currentStep;
          const isCurrent = idx === currentStep;
          return `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; z-index: 1; flex: 1;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: ${isActive ? (isCurrent ? 'linear-gradient(135deg, #0ea5e9, #22c55e)' : '#22c55e') : 'var(--surface-secondary)'}; border: 3px solid ${isActive ? '#22c55e' : 'var(--border)'}; display: flex; align-items: center; justify-content: center; color: ${isActive ? '#ffffff' : 'var(--text-muted)'}; ${isCurrent ? 'box-shadow: 0 0 16px rgba(14, 165, 233, 0.4); animation: pulse 2s infinite;' : ''} transition: all 0.3s ease;">
                ${stepIcons[idx]}
              </div>
              <span style="font-size: 0.75rem; font-weight: ${isCurrent ? '700' : '500'}; color: ${isActive ? 'var(--text-primary)' : 'var(--text-muted)'}; text-align: center; max-width: 80px;">
                ${stepLabels[idx]}
              </span>
            </div>
          `;
        }).join('')}
      </div>

      ${delivery.currentLocation ? `
        <div style="margin-top: 20px; padding: 12px 16px; background: var(--surface-secondary); border-radius: 12px; display: flex; align-items: center; gap: 10px; font-size: 0.85rem;">
          <span style="color: var(--accent-green); display: flex; align-items: center;">${getIcon('mapPin', 16)}</span>
          <span style="color: var(--text-secondary);">${i18n.t('delivery.currentLocation')}: ${delivery.currentLocation.lat?.toFixed(4)}, ${delivery.currentLocation.lng?.toFixed(4)}</span>
        </div>
      ` : ''}

      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      </style>
    </div>
  `;
}
