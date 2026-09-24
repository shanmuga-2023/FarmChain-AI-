// ============================================
// FarmChain AI — Streamlined 2-Event Notification Engine
// Handles: 1. ORDER_PLACED  2. ORDER_STATUS_CHANGED
// Localized message rendering with parameter interpolation
// ============================================

import { store } from '../data/store.js';
import { showToast, formatCurrency } from './helpers.js';
import { i18n } from '../i18n/index.js';

const NOTIFICATION_STORAGE_KEY = 'farmchain_notifications';

/**
 * Get all notifications from storage
 */
export function getAllNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : (store.get('notifications') || []);
  } catch {
    return [];
  }
}

/**
 * Save notifications list
 */
function saveNotifications(notifications) {
  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
    store.set('notifications', notifications);
    // Dispatch custom event for real-time UI reaction
    window.dispatchEvent(new CustomEvent('farmchain:notification_updated', { detail: notifications }));
  } catch (e) {
    console.warn('Failed to save notifications:', e);
  }
}

/**
 * Filter notifications for the current active user & role
 */
export function getUserNotifications(userId, role) {
  const all = getAllNotifications();
  if (!userId && !role) return all;
  return all.filter(n => {
    if (n.targetUserId && n.targetUserId === userId) return true;
    if (n.targetRole && n.targetRole === role) return true;
    if (!n.targetUserId && !n.targetRole) return true; // broadcast
    return false;
  }).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

/**
 * Get count of unread notifications for user
 */
export function getUnreadNotificationCount(userId, role) {
  const list = getUserNotifications(userId, role);
  return list.filter(n => !n.read).length;
}

/**
 * Mark all notifications as read for user
 */
export function markAllNotificationsRead(userId, role) {
  const all = getAllNotifications();
  const updated = all.map(n => {
    if ((n.targetUserId && n.targetUserId === userId) || (n.targetRole && n.targetRole === role) || (!n.targetUserId && !n.targetRole)) {
      return { ...n, read: true };
    }
    return n;
  });
  saveNotifications(updated);
}

/**
 * Clear all notifications for user
 */
export function clearUserNotifications(userId, role) {
  const all = getAllNotifications();
  const remaining = all.filter(n => {
    if (n.targetUserId && n.targetUserId === userId) return false;
    if (n.targetRole && n.targetRole === role) return false;
    return true;
  });
  saveNotifications(remaining);
}

/**
 * Dynamically localize notification title and message based on active language
 */
export function getLocalizedNotification(n) {
  if (!n) return { title: '', message: '' };

  const details = n.details || {};
  if (n.type === 'ORDER_PLACED') {
    const title = i18n.t('notifications.orderPlacedTitle') || '🛍️ New Order Received!';
    const message = i18n.t('notifications.orderPlacedDesc', {
      buyer: details.buyerName || 'Buyer',
      qty: `${details.rawQuantity || details.quantity || ''} ${details.unit || 'kg'}`,
      crop: details.productName || 'produce',
    });
    return { title, message };
  }

  if (n.type === 'ORDER_STATUS_CHANGED') {
    const statusKey = (details.newStatus || '').toLowerCase();
    const statusLabel = i18n.t(`status.${statusKey}`) || details.newStatus;
    const title = i18n.t('notifications.orderStatusTitle', { status: statusLabel }) || `Order ${statusLabel}!`;
    const message = i18n.t('notifications.orderStatusDesc', {
      crop: details.productName || 'crop',
      status: statusLabel,
      seller: details.sellerName || 'Farmer',
    });
    return { title, message };
  }

  return {
    title: n.title || '',
    message: n.message || '',
  };
}

// ==========================================
// EVENT 1: ORDER_PLACED
// Triggered when any buyer places an order
// ==========================================
export function notifyOrderPlaced(order) {
  const notificationId = `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const totalStr = formatCurrency(order.totalAmount || (order.quantity * order.pricePerUnit) || 0);

  const newNotification = {
    id: notificationId,
    type: 'ORDER_PLACED',
    title: '🛍️ New Order Received!',
    message: `${order.buyerName || 'Buyer'} placed an order for ${order.quantity} ${order.unit || 'kg'} of ${order.productName || 'produce'}.`,
    details: {
      orderId: order.orderId,
      productName: order.productName,
      quantity: `${order.quantity} ${order.unit || 'kg'}`,
      rawQuantity: order.quantity,
      unit: order.unit || 'kg',
      totalAmount: totalStr,
      buyerName: order.buyerName,
      sellerName: order.sellerName,
      escrowLocked: '60% Farmer / 20% Intermediary / 15% Retailer / 5% Protocol',
    },
    targetUserId: order.sellerId, // Farmer receives the notification
    targetRole: 'farmer',
    actionUrl: '/farmer/orders',
    timestamp: Date.now(),
    read: false,
  };

  const all = getAllNotifications();
  all.unshift(newNotification);
  saveNotifications(all);

  const localized = getLocalizedNotification(newNotification);
  showToast(localized.message || `🔔 New Order: ${order.quantity} ${order.unit || 'kg'} ${order.productName} (${totalStr})`, 'success');
}

// ==========================================
// EVENT 2: ORDER_STATUS_CHANGED
// Triggered when farmer accepts / ships / delivers
// ==========================================
export function notifyOrderStatusChanged(order, newStatus) {
  const notificationId = `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const statusEmoji = newStatus === 'accepted' ? '✅' : newStatus === 'shipped' ? '🚚' : newStatus === 'delivered' ? '🎉' : '📦';
  const statusKey = (newStatus || '').toLowerCase();
  const statusLabel = i18n.t(`status.${statusKey}`) || (newStatus.charAt(0).toUpperCase() + newStatus.slice(1));

  const newNotification = {
    id: notificationId,
    type: 'ORDER_STATUS_CHANGED',
    title: `${statusEmoji} Order ${statusLabel}!`,
    message: `Order for ${order.productName || 'crop'} has been marked as ${statusLabel} by ${order.sellerName || 'Farmer'}.`,
    details: {
      orderId: order.orderId,
      productName: order.productName,
      quantity: `${order.quantity} ${order.unit || 'kg'}`,
      newStatus,
      sellerName: order.sellerName,
      buyerName: order.buyerName,
    },
    targetUserId: order.buyerId, // Buyer receives the notification
    targetRole: order.buyerRole || 'consumer',
    actionUrl: order.buyerRole === 'retailer' ? '/retailer/dashboard' : order.buyerRole === 'intermediary' ? '/intermediary/dashboard' : '/consumer/orders',
    timestamp: Date.now(),
    read: false,
  };

  const all = getAllNotifications();
  all.unshift(newNotification);
  saveNotifications(all);

  const localized = getLocalizedNotification(newNotification);
  showToast(`${statusEmoji} ${localized.message || `Order Update: ${order.productName} is now ${statusLabel}`}`, 'info');
}
