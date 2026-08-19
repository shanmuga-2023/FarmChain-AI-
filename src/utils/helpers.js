// ============================================
// FarmChain AI — Utility Helpers
// ============================================

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num) {
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(timestamp) {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(timestamp);
}

export function truncateHash(hash, length = 8) {
  if (!hash) return '';
  return `${hash.slice(0, length)}...${hash.slice(-length)}`;
}

export function getStatusBadge(status) {
  const map = {
    'available': { class: 'badge-success', label: 'Available', icon: '✓' },
    'active': { class: 'badge-success', label: 'Active', icon: '●' },
    'pending': { class: 'badge-warning', label: 'Pending', icon: '◷' },
    'accepted': { class: 'badge-info', label: 'Accepted', icon: '✓' },
    'shipped': { class: 'badge-purple', label: 'Shipped', icon: '🚚' },
    'delivered': { class: 'badge-success', label: 'Delivered', icon: '✓' },
    'cancelled': { class: 'badge-danger', label: 'Cancelled', icon: '✕' },
    'completed': { class: 'badge-success', label: 'Completed', icon: '✓' },
    'valid': { class: 'badge-success', label: 'Valid', icon: '✓' },
    'expired': { class: 'badge-danger', label: 'Expired', icon: '✕' },
    'confirmed': { class: 'badge-success', label: 'Confirmed', icon: '✓' },
  };
  return map[status] || { class: 'badge-info', label: status, icon: '●' };
}

export function getRoleConfig(role) {
  const configs = {
    farmer: {
      label: 'Farmer',
      icon: '🌾',
      gradient: 'var(--gradient-farmer)',
      color: 'var(--accent-green)',
      bgColor: 'var(--accent-green-dim)',
    },
    intermediary: {
      label: 'Intermediary',
      icon: '🏪',
      gradient: 'var(--gradient-intermediary)',
      color: 'var(--accent-amber)',
      bgColor: 'var(--accent-amber-dim)',
    },
    retailer: {
      label: 'Retailer',
      icon: '🛒',
      gradient: 'var(--gradient-retailer)',
      color: 'var(--accent-blue)',
      bgColor: 'var(--accent-blue-dim)',
    },
    consumer: {
      label: 'Consumer',
      icon: '👤',
      gradient: 'var(--gradient-consumer)',
      color: 'var(--accent-purple)',
      bgColor: 'var(--accent-purple-dim)',
    },
    admin: {
      label: 'Admin',
      icon: '🔧',
      gradient: 'var(--gradient-admin)',
      color: 'var(--accent-red)',
      bgColor: 'var(--accent-red-dim)',
    },
  };
  return configs[role] || configs.consumer;
}

export function getCropEmoji(name) {
  const emojiMap = {
    'rice': '🌾', 'wheat': '🌿', 'tomato': '🍅', 'onion': '🧅',
    'potato': '🥔', 'mango': '🥭', 'banana': '🍌', 'cotton': '🏵️',
    'sugarcane': '🎋', 'turmeric': '🟡', 'chilli': '🌶️', 'coconut': '🥥',
    'soybean': '🫘', 'mustard': '🌻', 'maize': '🌽',
  };

  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (lower.includes(key)) return emoji;
  }
  return '🌱';
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
