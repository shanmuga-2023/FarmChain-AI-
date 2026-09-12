// ============================================
// FarmChain AI — API Client
// Connects the SPA to the Express backend
// Falls back gracefully if server is offline
// ============================================

const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:4000/api' : 'https://farmchain-ai-.onrender.com/api');
let _serverOnline = null; // null = unknown, true/false = checked

/**
 * Check if the Express server is reachable.
 * Caches result for 30 seconds.
 */
let _lastCheck = 0;
export async function isServerOnline() {
  const now = Date.now();
  if (_serverOnline !== null && now - _lastCheck < 30000) {
    return _serverOnline;
  }
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    _serverOnline = res.ok;
  } catch {
    _serverOnline = false;
  }
  _lastCheck = now;
  return _serverOnline;
}

/**
 * Generic fetch wrapper with timeout and error handling.
 */
async function apiFetch(endpoint, options = {}) {
  const online = await isServerOnline();
  if (!online) return null;

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      signal: options.signal || AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.warn(`API ${endpoint} returned ${res.status}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.warn(`API ${endpoint} failed:`, err.message);
    return null;
  }
}

// ==========================================
// Products
// ==========================================

export async function fetchProducts() {
  return await apiFetch('/products');
}

export async function postProduct(product) {
  return await apiFetch('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

// ==========================================
// Orders
// ==========================================

export async function fetchOrders() {
  return await apiFetch('/orders');
}

export async function postOrder(order) {
  return await apiFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

export async function patchOrderStatus(orderId, updates) {
  return await apiFetch(`/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// ==========================================
// Live Mandi Rates (with Offline Resilient Cache)
// ==========================================

const MANDI_FALLBACK_DEFAULT = {
  Rice: { crop: 'Rice', modalPriceQuintal: 2450, pricePerKg: 24.50, trend: 'up', primaryMandi: 'Punjab / Tamil Nadu', source: 'Agmarknet Cached' },
  Wheat: { crop: 'Wheat', modalPriceQuintal: 2380, pricePerKg: 23.80, trend: 'stable', primaryMandi: 'Madhya Pradesh', source: 'Agmarknet Cached' },
  Tomato: { crop: 'Tomato', modalPriceQuintal: 1450, pricePerKg: 14.50, trend: 'down', primaryMandi: 'Maharashtra', source: 'Agmarknet Cached' },
  Onion: { crop: 'Onion', modalPriceQuintal: 2100, pricePerKg: 21.00, trend: 'up', primaryMandi: 'Nashik, Maharashtra', source: 'Agmarknet Cached' },
  Potato: { crop: 'Potato', modalPriceQuintal: 1150, pricePerKg: 11.50, trend: 'stable', primaryMandi: 'Uttar Pradesh', source: 'Agmarknet Cached' },
  Turmeric: { crop: 'Turmeric', modalPriceQuintal: 10800, pricePerKg: 108.00, trend: 'up', primaryMandi: 'Erode, Tamil Nadu', source: 'Agmarknet Cached' },
  Mango: { crop: 'Mango', modalPriceQuintal: 4200, pricePerKg: 42.00, trend: 'up', primaryMandi: 'Ratnagiri', source: 'Agmarknet Cached' },
  Banana: { crop: 'Banana', modalPriceQuintal: 1850, pricePerKg: 18.50, trend: 'stable', primaryMandi: 'Trichy', source: 'Agmarknet Cached' },
};

export async function fetchMandiRates() {
  try {
    const liveData = await apiFetch('/mandi-rates');
    if (liveData && Object.keys(liveData).length > 0) {
      localStorage.setItem('farmchain_cached_mandi_rates', JSON.stringify({
        timestamp: Date.now(),
        data: liveData,
      }));
      return liveData;
    }
  } catch (err) {
    console.warn('Live mandi fetch failed, using cache:', err.message);
  }

  // Offline / Venue Wi-Fi dropped fallback
  const cached = localStorage.getItem('farmchain_cached_mandi_rates');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed?.data) return parsed.data;
    } catch {}
  }

  return MANDI_FALLBACK_DEFAULT;
}

// ==========================================
// Certificates
// ==========================================

export async function fetchCertificates() {
  return await apiFetch('/certificates');
}

export async function postCertificate(cert) {
  return await apiFetch('/certificates', {
    method: 'POST',
    body: JSON.stringify(cert),
  });
}

// ==========================================
// Platform Reset
// ==========================================

export async function resetPlatform() {
  return await apiFetch('/reset', { method: 'POST' });
}
