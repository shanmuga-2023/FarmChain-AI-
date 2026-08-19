// ============================================
// FarmChain AI — SPA Client-Side Router
// Hash-based routing for simplicity
// ============================================

class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.beforeHooks = [];
    this._init();
  }

  _init() {
    window.addEventListener('hashchange', () => this._handleRoute());
    window.addEventListener('load', () => this._handleRoute());
  }

  register(path, handler) {
    this.routes.set(path, handler);
    return this;
  }

  navigate(path) {
    window.location.hash = path;
  }

  beforeEach(hook) {
    this.beforeHooks.push(hook);
  }

  _handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const [path, queryString] = hash.split('?');

    // Parse query params
    const params = {};
    if (queryString) {
      queryString.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      });
    }

    // Run before hooks
    for (const hook of this.beforeHooks) {
      const result = hook(path, this.currentRoute);
      if (result === false) return;
    }

    // Find matching route
    let handler = this.routes.get(path);

    // Try wildcard matching (e.g., /farmer/* matches /farmer/products)
    if (!handler) {
      for (const [routePath, routeHandler] of this.routes) {
        if (routePath.endsWith('/*')) {
          const basePath = routePath.slice(0, -2);
          if (path.startsWith(basePath)) {
            handler = routeHandler;
            break;
          }
        }
      }
    }

    // Fallback to 404 or landing
    if (!handler) {
      handler = this.routes.get('/') || (() => {});
    }

    this.currentRoute = path;
    handler({ path, params });
  }

  getCurrentPath() {
    return window.location.hash.slice(1) || '/';
  }
}

export const router = new Router();
