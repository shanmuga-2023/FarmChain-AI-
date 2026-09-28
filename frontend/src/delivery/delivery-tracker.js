// frontend/src/delivery/delivery-tracker.js
// Main delivery tracking page — works for all roles
import { store } from '../data/store.js';
import { renderSidebar } from '../components/sidebar.js';
import { i18n } from '../i18n/index.js';
import { formatCurrency, showToast } from '../utils/helpers.js';
import { renderDeliveryMap } from './delivery-map.js';
import { renderDeliveryTimeline, getStatusLabel } from './delivery-timeline.js';
import { initDeliverySocket, onDeliveryEvent } from './delivery-events.js';

export function renderDeliveryTracker(container) {
  const user = store.get('currentUser');
  const role = store.get('currentRole');
  const allDeliveries = store.get('deliveries') || [];

  // Filter by role
  const deliveries = allDeliveries.filter(d => {
    if (role === 'farmer') return d.farmerId === user.id;
    if (role === 'intermediary') return d.intermediaryId === user.id || d.farmerId === user.id;
    if (role === 'retailer') return d.retailerId === user.id;
    if (role === 'consumer') return d.consumerId === user.id;
    if (role === 'admin') return true;
    return false;
  });

  const activeDeliveries = deliveries.filter(d => !['DELIVERED', 'BUYER_CONFIRMED', 'ESCROW_RELEASED'].includes(d.status));
  const completedDeliveries = deliveries.filter(d => ['DELIVERED', 'BUYER_CONFIRMED', 'ESCROW_RELEASED'].includes(d.status));

  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

  const titleKey = role === 'retailer' ? 'delivery.incomingDeliveries' : (role === 'admin' ? 'delivery.deliveryMonitor' : 'delivery.myDeliveries');

  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main">
        <header class="glass-header">
          <div class="header-left">
            <div>
              <h2 class="header-title">${i18n.t('delivery.title')}</h2>
              <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">${i18n.t(titleKey)}</div>
            </div>
          </div>
          <div class="header-right">
            <div style="font-size: 0.85rem; color: var(--text-secondary);">
              ${activeDeliveries.length} ${i18n.t('status.active') || 'active'} · ${completedDeliveries.length} ${i18n.t('status.delivered') || 'delivered'}
            </div>
          </div>
        </header>

        <div class="page-content">
          <!-- Stats -->
          <div class="dashboard-stats">
            <div class="stat-card">
              <div class="stat-card-icon" style="background: rgba(139,92,246,0.1); color: #8b5cf6;">🚚</div>
              <div class="stat-card-value">${deliveries.length}</div>
              <div class="stat-card-label">${i18n.t('delivery.title')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: rgba(245,158,11,0.1); color: #f59e0b;">📦</div>
              <div class="stat-card-value">${activeDeliveries.length}</div>
              <div class="stat-card-label">${i18n.t('delivery.status.inTransit')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: rgba(34,197,94,0.1); color: #22c55e;">✅</div>
              <div class="stat-card-value">${completedDeliveries.length}</div>
              <div class="stat-card-label">${i18n.t('delivery.status.delivered')}</div>
            </div>
          </div>

          ${deliveries.length === 0 ? `
            <div class="card" style="text-align: center; padding: 60px 24px;">
              <div style="font-size: 3rem; margin-bottom: 16px;">🚚</div>
              <h3 style="color: var(--text-primary); margin-bottom: 8px;">${i18n.t('delivery.noDeliveries')}</h3>
              <p style="color: var(--text-secondary); font-size: 0.9rem;">${i18n.t('delivery.errors.unavailable')}</p>
            </div>
          ` : `
            <div id="deliveries-list">
              ${deliveries.map(del => renderDeliveryCard(del, role)).join('')}
            </div>
          `}
        </div>
      </main>
    </div>
  `;

  // Initialize socket for real-time updates
  initDeliverySocket();

  // Bind expand/collapse and action buttons
  container.querySelectorAll('.delivery-expand-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const details = btn.closest('.delivery-card-wrapper').querySelector('.delivery-details');
      if (details) {
        details.style.display = details.style.display === 'none' ? 'block' : 'none';
        btn.textContent = details.style.display === 'none' ? '▼' : '▲';
      }
    });
  });

  // Bind status update buttons
  container.querySelectorAll('[data-delivery-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const deliveryId = btn.dataset.deliveryId;
      const newStatus = btn.dataset.deliveryAction;
      handleStatusUpdate(deliveryId, newStatus, user.id);
    });
  });
}

function renderDeliveryCard(delivery, role) {
  const statusLabel = getStatusLabel(delivery.status);
  const statusColor = getStatusColor(delivery.status);
  const eta = delivery.estimatedDelivery ? new Date(delivery.estimatedDelivery).toLocaleDateString(i18n.getLocale()) : '—';

  const actionButtons = getActionButtons(delivery, role);

  return `
    <div class="card delivery-card-wrapper" style="margin-bottom: 16px; overflow: hidden;">
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 0;">
        <div style="display: flex; align-items: center; gap: 16px; flex: 1;">
          <div style="width: 44px; height: 44px; border-radius: 14px; background: ${statusColor}15; display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">🚚</div>
          <div>
            <div style="font-weight: 700; font-size: 1rem; color: var(--text-primary);">${delivery.produce || 'Produce'}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${delivery.deliveryId} · ${delivery.quantity || 0} ${delivery.unit || 'kg'}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; background: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor}30;">${statusLabel}</span>
          <div style="text-align: right;">
            <div style="font-size: 0.75rem; color: var(--text-muted);">${i18n.t('delivery.eta')}</div>
            <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">${eta}</div>
          </div>
          <button class="delivery-expand-btn" style="background: none; border: none; cursor: pointer; font-size: 1rem; color: var(--text-secondary); padding: 4px 8px;">▼</button>
        </div>
      </div>

      <div class="delivery-details" style="display: none; margin-top: 16px; border-top: 1px solid var(--border); padding-top: 16px;">
        ${renderDeliveryMap(delivery)}

        <div style="margin-top: 20px;">
          <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin-bottom: 12px;">📜 ${i18n.t('delivery.deliveryTimeline')}</h4>
          ${renderDeliveryTimeline(delivery.events || [], delivery.status)}
        </div>

        ${delivery.driver ? `
          <div style="margin-top: 16px; padding: 12px 16px; background: var(--surface-secondary); border-radius: 12px;">
            <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">🚗 ${i18n.t('delivery.driver')}</div>
            <div style="font-size: 0.9rem; color: var(--text-primary);">${delivery.driver.name || '—'} · ${delivery.driver.phone || '—'}</div>
          </div>
        ` : ''}

        ${delivery.batchId ? `
          <div style="margin-top: 12px; padding: 12px 16px; background: var(--surface-secondary); border-radius: 12px; display: flex; justify-content: space-between;">
            <span style="font-size: 0.85rem; color: var(--text-secondary);">${i18n.t('delivery.batchId')}</span>
            <span style="font-size: 0.85rem; font-weight: 600; color: var(--primary);">${delivery.batchId}</span>
          </div>
        ` : ''}

        ${delivery.qualityGrade ? `
          <div style="margin-top: 8px; padding: 12px 16px; background: var(--surface-secondary); border-radius: 12px; display: flex; justify-content: space-between;">
            <span style="font-size: 0.85rem; color: var(--text-secondary);">${i18n.t('delivery.qualityGrade')}</span>
            <span style="font-size: 0.85rem; font-weight: 600; color: #22c55e;">⭐ ${delivery.qualityGrade}</span>
          </div>
        ` : ''}

        ${actionButtons ? `
          <div style="margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap;">
            ${actionButtons}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function getActionButtons(delivery, role) {
  const btns = [];
  const id = delivery.deliveryId;

  if (role === 'intermediary') {
    if (delivery.status === 'ORDER_CREATED') {
      btns.push(`<button class="btn btn-primary btn-sm" data-delivery-id="${id}" data-delivery-action="PICKUP_ASSIGNED">${i18n.t('delivery.assignPickup')}</button>`);
    }
    if (delivery.status === 'PICKUP_ASSIGNED') {
      btns.push(`<button class="btn btn-primary btn-sm" data-delivery-id="${id}" data-delivery-action="PICKED_UP">📦 ${i18n.t('delivery.status.pickedUp')}</button>`);
    }
    if (delivery.status === 'PICKED_UP') {
      btns.push(`<button class="btn btn-primary btn-sm" data-delivery-id="${id}" data-delivery-action="IN_TRANSIT">🚚 ${i18n.t('delivery.updateShipment')}</button>`);
    }
  }

  if (role === 'retailer') {
    if (delivery.status === 'OUT_FOR_DELIVERY' || delivery.status === 'NEAR_DESTINATION') {
      btns.push(`<button class="btn btn-primary btn-sm" data-delivery-id="${id}" data-delivery-action="DELIVERED">${i18n.t('delivery.confirmArrival')}</button>`);
    }
  }

  if (role === 'consumer') {
    if (delivery.status === 'DELIVERED') {
      btns.push(`<button class="btn btn-primary btn-sm" data-delivery-id="${id}" data-delivery-action="BUYER_CONFIRMED">${i18n.t('delivery.confirmDelivery')}</button>`);
    }
  }

  return btns.join('');
}

function getStatusColor(status) {
  const colors = {
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
  return colors[status] || '#64748b';
}

function handleStatusUpdate(deliveryId, newStatus, actorId) {
  const deliveries = store.get('deliveries') || [];
  const idx = deliveries.findIndex(d => d.deliveryId === deliveryId);
  if (idx === -1) return;

  const now = new Date().toISOString();
  deliveries[idx].status = newStatus;
  deliveries[idx].updatedAt = now;
  deliveries[idx].events = deliveries[idx].events || [];
  deliveries[idx].events.push({ status: newStatus, timestamp: now, actor: actorId });
  store.set('deliveries', deliveries);

  showToast(`${getStatusLabel(newStatus)} ✅`, 'success');

  // Re-render
  const app = document.getElementById('app');
  if (app) renderDeliveryTracker(app);
}
