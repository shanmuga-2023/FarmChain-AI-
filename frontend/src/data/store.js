// ============================================
// FarmChain AI — Central State Management
// localStorage-backed reactive store
// ============================================

const STORE_KEY = 'farmchain_store';

const defaultState = {
  currentUser: null,
  currentRole: null,
  users: {},
  products: [],
  listings: [],
  orders: [],
  certificates: [],
  transfers: [],
  payments: [],
  notifications: [],
};

class Store {
  constructor() {
    this._state = { ...defaultState };
    this._listeners = new Map();
    this._load();
  }

  get state() {
    return this._state;
  }

  get(key) {
    return this._state[key];
  }

  set(key, value) {
    this._state[key] = value;
    this._save();
    this._notify(key, value);
  }

  update(key, updater) {
    const current = this._state[key];
    const updated = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
    this.set(key, updated);
  }

  // Add item to an array state
  addItem(key, item) {
    const arr = this._state[key] || [];
    this.set(key, [...arr, item]);
  }

  // Remove item from array state by predicate
  removeItem(key, predicate) {
    const arr = this._state[key] || [];
    this.set(key, arr.filter(item => !predicate(item)));
  }

  // Update item in array state
  updateItem(key, predicate, updates) {
    const arr = this._state[key] || [];
    this.set(key, arr.map(item => predicate(item) ? { ...item, ...updates } : item));
  }

  // Subscribe to state changes
  on(key, callback) {
    if (!this._listeners.has(key)) {
      this._listeners.set(key, []);
    }
    this._listeners.get(key).push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this._listeners.get(key) || [];
      this._listeners.set(key, listeners.filter(cb => cb !== callback));
    };
  }

  // Set current user session
  login(role, userId, userProfile = null) {
    if (!this._state.users) {
      this._state.users = {};
    }

    let user = userProfile || this._state.users[userId];
    if (!user) {
      user = {
        id: userId,
        role: role,
        name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
        email: `${role}@farmchain.demo`,
      };
    }

    // Persist in users map
    this._state.users[userId] = user;
    if (user.id && user.id !== userId) {
      this._state.users[user.id] = user;
    }

    this.set('currentUser', user);
    this.set('currentRole', role || user.role);
    this._save();
  }

  logout() {
    this.set('currentUser', null);
    this.set('currentRole', null);
    this._save();
  }

  isLoggedIn() {
    return this._state.currentUser !== null && this._state.currentUser !== undefined;
  }

  reset() {
    this._state = { ...defaultState };
    localStorage.removeItem(STORE_KEY);
    this._notify('reset', null);
  }

  _notify(key, value) {
    const callbacks = this._listeners.get(key) || [];
    callbacks.forEach(cb => cb(value));

    // Also notify wildcard listeners
    const wildcardCallbacks = this._listeners.get('*') || [];
    wildcardCallbacks.forEach(cb => cb(key, value));
  }

  _save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this._state));
    } catch (e) {
      console.warn('Store save failed:', e);
    }
  }

  _load() {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) {
        this._state = { ...defaultState, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Store load failed:', e);
    }
  }
}

export const store = new Store();
