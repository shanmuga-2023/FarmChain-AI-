// ============================================
// FarmChain AI — Interactive Notification Center Dropdown
// Displays real-time Order Placed & Order Status notifications (Fully Localized)
// ============================================

import { store } from '../data/store.js';
import { router } from '../utils/router.js';
import { timeAgo } from '../utils/helpers.js';
import { escapeHtml } from '../utils/sanitize.js';
import { i18n } from '../i18n/index.js';
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  clearUserNotifications,
  getLocalizedNotification,
} from '../utils/notifications.js';

let _isOpen = false;

export function toggleNotificationCenter() {
  _isOpen = !_isOpen;
  renderNotificationCenter();
}

export function closeNotificationCenter() {
  _isOpen = false;
  const el = document.getElementById('notification-center-drawer');
  if (el) el.remove();
}

export function updateNotificationBellBadge() {
  const user = store.get('currentUser');
  const role = store.get('currentRole');
  const count = getUnreadNotificationCount(user?.id, role);

  document.querySelectorAll('.notification-btn, #notification-btn').forEach(btn => {
    let dot = btn.querySelector('.notification-dot');
    let badge = btn.querySelector('.notif-count-pill');
    if (count > 0) {
      if (!dot) {
        dot = document.createElement('span');
        dot.className = 'notification-dot';
        btn.appendChild(dot);
      }
      btn.title = i18n.t('notifications.unreadCount', { count }) || `${count} unread notifications`;
    } else {
      if (dot) dot.remove();
      if (badge) badge.remove();
      btn.title = i18n.t('notifications.none') || 'No new notifications';
    }
  });
}

export function renderNotificationCenter() {
  const existing = document.getElementById('notification-center-drawer');
  if (existing) existing.remove();

  if (!_isOpen) return;

  const user = store.get('currentUser');
  const role = store.get('currentRole');
  const notifications = getUserNotifications(user?.id, role);
  const unreadCount = getUnreadNotificationCount(user?.id, role);

  const drawer = document.createElement('div');
  drawer.id = 'notification-center-drawer';
  drawer.className = 'notification-center-dropdown animate-fade-in';
  drawer.style.cssText = `
    position: fixed;
    top: 70px;
    right: 24px;
    width: 380px;
    max-width: calc(100vw - 48px);
    max-height: 520px;
    background: var(--bg-card, #0f172a);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--border-subtle, rgba(255,255,255,0.1));
    border-radius: var(--radius-lg, 16px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(34, 197, 94, 0.1);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `;

  drawer.innerHTML = `
    <div style="padding: 16px; border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.02);">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 1.2rem;">🔔</span>
        <span style="font-weight: 700; font-size: 0.95rem;">${i18n.t('notifications.centerTitle') || 'Order Notifications'}</span>
        ${unreadCount > 0 ? `<span class="badge badge-success" style="font-size: 0.72rem; padding: 2px 8px;">${unreadCount} ${i18n.t('notifications.new') || 'New'}</span>` : ''}
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        ${notifications.length > 0 ? `
          <button id="notif-mark-read-btn" style="background: none; border: none; color: var(--accent-green, #22c55e); font-size: 0.75rem; font-weight: 600; cursor: pointer;">✓ ${i18n.t('notifications.markRead') || 'Read All'}</button>
          <button id="notif-clear-btn" style="background: none; border: none; color: var(--text-muted, #94a3b8); font-size: 0.75rem; cursor: pointer;">${i18n.t('notifications.clear') || 'Clear'}</button>
        ` : ''}
        <button id="notif-close-btn" style="background: none; border: none; color: var(--text-muted, #94a3b8); font-size: 1rem; cursor: pointer; padding: 0 4px;">✕</button>
      </div>
    </div>

    <div style="flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px;" id="notif-list-container">
      ${notifications.length > 0 ? notifications.map(n => {
        const localized = getLocalizedNotification(n);
        return `
        <div class="notif-item ${n.read ? 'read' : 'unread'}" data-action-url="${n.actionUrl || ''}" style="
          padding: 12px;
          border-radius: var(--radius-md, 10px);
          background: ${n.read ? 'rgba(255,255,255,0.02)' : 'rgba(34, 197, 94, 0.08)'};
          border: 1px solid ${n.read ? 'transparent' : 'rgba(34, 197, 94, 0.25)'};
          cursor: pointer;
          transition: all 0.2s ease;
        ">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
            <div style="font-weight: 600; font-size: 0.88rem; color: ${n.read ? 'var(--text-primary)' : 'var(--accent-green, #22c55e)'};">
              ${localized.title}
            </div>
            <span style="font-size: 0.7rem; color: var(--text-muted);">${timeAgo(n.timestamp)}</span>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px; line-height: 1.4;">
            ${localized.message}
          </div>
          ${n.details ? `
            <div style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px; font-size: 0.75rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 3px;">
              ${n.details.totalAmount ? `<div>💰 <strong>${i18n.t('notifications.amountLabel') || 'Amount:'}</strong> <span style="color: var(--accent-green);">${n.details.totalAmount}</span></div>` : ''}
              ${n.details.quantity ? `<div>📦 <strong>${i18n.t('notifications.qtyLabel') || 'Quantity:'}</strong> ${n.details.quantity}</div>` : ''}
              ${n.details.escrowLocked ? `<div>⛓️ <strong>${i18n.t('notifications.payoutRule') || 'Fair Payout Rule:'}</strong> ${n.details.escrowLocked}</div>` : ''}
            </div>
          ` : ''}
        </div>
      `;
      }).join('') : `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">🔕</div>
          <div style="font-weight: 600; font-size: 0.9rem;">${i18n.t('notifications.emptyTitle') || 'No Notifications Yet'}</div>
          <p style="font-size: 0.75rem; margin-top: 4px;">${i18n.t('notifications.emptySub') || 'Order updates and status changes will appear here in real-time.'}</p>
        </div>
      `}
    </div>
  `;

  document.body.appendChild(drawer);

  // Close button
  drawer.querySelector('#notif-close-btn')?.addEventListener('click', () => closeNotificationCenter());

  // Mark all read button
  drawer.querySelector('#notif-mark-read-btn')?.addEventListener('click', () => {
    markAllNotificationsRead(user?.id, role);
    updateNotificationBellBadge();
    renderNotificationCenter();
  });

  // Clear button
  drawer.querySelector('#notif-clear-btn')?.addEventListener('click', () => {
    clearUserNotifications(user?.id, role);
    updateNotificationBellBadge();
    renderNotificationCenter();
  });

  // Click on notification to navigate
  drawer.querySelectorAll('.notif-item').forEach(item => {
    item.addEventListener('click', () => {
      const url = item.dataset.actionUrl;
      closeNotificationCenter();
      if (url) router.navigate(url);
    });
  });
}

// Listen to custom notification events
window.addEventListener('farmchain:notification_updated', () => {
  updateNotificationBellBadge();
  if (_isOpen) renderNotificationCenter();
});
