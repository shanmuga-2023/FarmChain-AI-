// ============================================
// FarmChain AI — Utility Helpers (Fully Localized)
// ============================================

import { i18n } from '../i18n/index.js';

export function formatCurrency(amount) {
  const locale = i18n.getLocale();
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatNumber(num) {
  const locale = i18n.getLocale();
  return new Intl.NumberFormat(locale).format(num || 0);
}

export function formatDate(timestamp) {
  if (!timestamp) return i18n.t('common.na') || 'N/A';
  const locale = i18n.getLocale();
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp));
}

export function formatDateTime(timestamp) {
  if (!timestamp) return i18n.t('common.na') || 'N/A';
  const locale = i18n.getLocale();
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function timeAgo(timestamp) {
  if (!timestamp) return i18n.t('time.justNow') || 'just now';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return i18n.t('time.justNow') || 'just now';
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return i18n.t('time.minutesAgo', { count: mins }) || `${mins}m ago`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return i18n.t('time.hoursAgo', { count: hours }) || `${hours}h ago`;
  }
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400);
    return i18n.t('time.daysAgo', { count: days }) || `${days}d ago`;
  }
  return formatDate(timestamp);
}

export function truncateHash(hash, length = 8) {
  if (!hash) return '';
  return `${hash.slice(0, length)}...${hash.slice(-length)}`;
}

export function getStatusBadge(status) {
  const key = (status || '').toLowerCase();
  const label = i18n.t(`status.${key}`) || status;
  const map = {
    'available': { class: 'badge-success', label: i18n.t('status.available') || 'Available', icon: '✓' },
    'active': { class: 'badge-success', label: i18n.t('status.active') || 'Active', icon: '●' },
    'pending': { class: 'badge-warning', label: i18n.t('status.pending') || 'Pending', icon: '◷' },
    'accepted': { class: 'badge-info', label: i18n.t('status.accepted') || 'Accepted', icon: '✓' },
    'shipped': { class: 'badge-purple', label: i18n.t('status.shipped') || 'Shipped', icon: '🚚' },
    'delivered': { class: 'badge-success', label: i18n.t('status.delivered') || 'Delivered', icon: '✓' },
    'cancelled': { class: 'badge-danger', label: i18n.t('status.cancelled') || 'Cancelled', icon: '✕' },
    'completed': { class: 'badge-success', label: i18n.t('status.completed') || 'Completed', icon: '✓' },
    'valid': { class: 'badge-success', label: i18n.t('status.valid') || 'Valid', icon: '✓' },
    'expired': { class: 'badge-danger', label: i18n.t('status.expired') || 'Expired', icon: '✕' },
    'confirmed': { class: 'badge-success', label: i18n.t('status.confirmed') || 'Confirmed', icon: '✓' },
  };
  return map[key] || { class: 'badge-info', label, icon: '●' };
}

export function getRoleConfig(role) {
  const key = (role || 'consumer').toLowerCase();
  const configs = {
    farmer: {
      label: i18n.t('farmerRole') || 'Farmer',
      icon: '🌾',
      gradient: 'linear-gradient(135deg, #4A7C59, #386145)',
      color: 'var(--role-farmer, #4A7C59)',
      bgColor: 'var(--role-farmer-bg, rgba(74, 124, 89, 0.12))',
    },
    intermediary: {
      label: i18n.t('intermediaryRole') || 'Intermediary',
      icon: '🏪',
      gradient: 'linear-gradient(135deg, #B8963E, #96782E)',
      color: 'var(--role-intermediary, #B8963E)',
      bgColor: 'var(--role-intermediary-bg, rgba(184, 150, 62, 0.12))',
    },
    retailer: {
      label: i18n.t('retailerRole') || 'Retailer',
      icon: '🏬',
      gradient: 'linear-gradient(135deg, #8B5E3C, #70492E)',
      color: 'var(--role-retailer, #8B5E3C)',
      bgColor: 'var(--role-retailer-bg, rgba(139, 94, 60, 0.12))',
    },
    consumer: {
      label: i18n.t('consumerRole') || 'Consumer',
      icon: '👤',
      gradient: 'linear-gradient(135deg, #6B5B7B, #534561)',
      color: 'var(--role-consumer, #6B5B7B)',
      bgColor: 'var(--role-consumer-bg, rgba(107, 91, 123, 0.12))',
    },
    admin: {
      label: i18n.t('adminRole') || 'Admin',
      icon: '🔧',
      gradient: 'linear-gradient(135deg, #A04040, #803030)',
      color: 'var(--role-admin, #A04040)',
      bgColor: 'var(--role-admin-bg, rgba(160, 64, 64, 0.12))',
    },
  };
  return configs[key] || configs.consumer;
}

export function getCropEmoji(name) {
  const emojiMap = {
    'rice': '🌾', 'wheat': '🌿', 'tomato': '🍅', 'onion': '🧅',
    'potato': '🥔', 'mango': '🥭', 'banana': '🍌', 'cotton': '🏵️',
    'sugarcane': '🎋', 'turmeric': '🟡', 'chilli': '🌶️', 'coconut': '🥥',
    'soybean': '🫘', 'mustard': '🌻', 'maize': '🌽',
  };

  const lower = (name || '').toLowerCase();
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (lower.includes(key)) return emoji;
  }
  return '🌱';
}

/**
 * Localize a crop name into the selected language
 */
export function localizeCropName(name) {
  if (!name) return '';
  const lower = name.toLowerCase();

  if (lower.includes('basmati') || (lower.includes('rice') && lower.includes('organic'))) {
    return i18n.t('crops.organicBasmatiRice') || name;
  }
  if (lower.includes('sona masoori')) {
    return i18n.t('crops.sonaMasooriRice') || name;
  }
  if (lower.includes('paddy')) {
    return i18n.t('crops.organicPaddy') || name;
  }
  if (lower.includes('rice')) {
    return i18n.t('crops.basmatiRice') || name;
  }
  if (lower.includes('sharbati') || (lower.includes('wheat') && lower.includes('premium'))) {
    return i18n.t('crops.punjabWheat') || name;
  }
  if (lower.includes('wheat')) {
    return i18n.t('crops.sharbatiWheat') || name;
  }
  if (lower.includes('nashik') && lower.includes('onion')) {
    return i18n.t('crops.freshNashikOnions') || name;
  }
  if (lower.includes('onion')) {
    return i18n.t('crops.onion') || name;
  }
  if (lower.includes('tomato')) {
    return i18n.t('crops.freshTomatoes') || name;
  }
  if (lower.includes('potato')) {
    return i18n.t('crops.freshPotato') || name;
  }
  if (lower.includes('alphonso') || lower.includes('mango')) {
    return i18n.t('crops.alphonsoMango') || name;
  }
  if (lower.includes('turmeric')) {
    return i18n.t('crops.salemTurmeric') || name;
  }
  if (lower.includes('banana')) {
    return i18n.t('crops.organicBananas') || name;
  }
  if (lower.includes('chilli') || lower.includes('chili')) {
    return i18n.t('crops.greenChillies') || name;
  }
  if (lower.includes('cotton')) {
    return i18n.t('crops.rawCotton') || name;
  }
  if (lower.includes('sugarcane')) {
    return i18n.t('crops.sweetSugarcane') || name;
  }
  if (lower.includes('maize') || lower.includes('corn')) {
    return i18n.t('crops.sweetMaize') || name;
  }
  if (lower.includes('garlic')) {
    return i18n.t('crops.desiGarlic') || name;
  }
  if (lower.includes('ginger')) {
    return i18n.t('crops.freshGinger') || name;
  }
  if (lower.includes('coconut')) {
    return i18n.t('crops.freshCoconut') || name;
  }

  return name;
}

/**
 * Localize unit of measurement (kg, quintal, ton, dozen)
 */
export function localizeUnit(unit) {
  if (!unit) return 'kg';
  const u = unit.toLowerCase();
  if (u.includes('quintal')) return i18n.t('units.quintalShort') || 'quintal';
  if (u.includes('ton')) return i18n.t('units.tonShort') || 'ton';
  if (u.includes('dozen')) return i18n.t('units.dozenShort') || 'dozen';
  if (u.includes('crate')) return i18n.t('units.crateShort') || 'crate';
  return i18n.t('units.kgShort') || 'kg';
}

/**
 * Localize category name
 */
export function localizeCategory(category) {
  if (!category) return '';
  const c = category.toLowerCase();
  if (c.includes('grain')) return i18n.t('catGrains') || category;
  if (c.includes('vegetable')) return i18n.t('catVegetables') || category;
  if (c.includes('fruit')) return i18n.t('catFruits') || category;
  if (c.includes('spice')) return i18n.t('catSpices') || category;
  if (c.includes('cash')) return i18n.t('catCashCrops') || category;
  return category;
}

/**
 * Localize Indian city/district locations
 */
export function localizeLocation(location) {
  if (!location) return '';
  const l = location.toLowerCase();
  if (l.includes('nashik')) return i18n.t('locations.nashik') || location;
  if (l.includes('ratnagiri')) return i18n.t('locations.ratnagiri') || location;
  if (l.includes('thanjavur')) return i18n.t('locations.thanjavur') || location;
  if (l.includes('erode')) return i18n.t('locations.erode') || location;
  if (l.includes('ludhiana')) return i18n.t('locations.ludhiana') || location;
  if (l.includes('trichy') || l.includes('tiruchirappalli')) return i18n.t('locations.trichy') || location;
  if (l.includes('mumbai')) return i18n.t('locations.mumbai') || location;
  if (l.includes('chennai')) return i18n.t('locations.chennai') || location;
  if (l.includes('bangalore') || l.includes('bengaluru')) return i18n.t('locations.bangalore') || location;
  if (l.includes('delhi')) return i18n.t('locations.delhi') || location;
  if (l.includes('pune')) return i18n.t('locations.pune') || location;
  if (l.includes('thuraiyur')) return i18n.t('locations.thuraiyur') || location;
  if (l.includes('guntur')) return i18n.t('locations.guntur') || location;
  if (l.includes('salem')) return i18n.t('locations.salem') || location;
  return location;
}

export function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <span>${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 4000);
}

export function createModal(title, content, actions = '') {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="modal-close" id="modal-close-btn">×</button>
      </div>
      <div class="modal-body">${content}</div>
      ${actions ? `<div class="modal-footer">${actions}</div>` : ''}
    </div>
  `;
  document.body.appendChild(overlay);

  // Close handlers
  overlay.querySelector('#modal-close-btn').onclick = () => overlay.remove();
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };

  return overlay;
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.remove();
}

export function generateId(prefix = 'ID') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}
