// ============================================
// FarmChain AI — HTML Sanitizer
// Prevents XSS via innerHTML injection
// ============================================

const ENTITY_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML entities in a string to prevent XSS via innerHTML.
 * @param {string} str — raw user input
 * @returns {string} — safe string for innerHTML interpolation
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return String(str ?? '');
  return str.replace(/[&<>"'`=\/]/g, (char) => ENTITY_MAP[char]);
}

/**
 * Validate and sanitize a product-like data object.
 * Returns a new object with all string fields escaped.
 */
export function sanitizeProduct(product) {
  if (!product) return product;
  return {
    ...product,
    name: escapeHtml(product.name),
    description: escapeHtml(product.description),
    origin: escapeHtml(product.origin),
    farmerName: escapeHtml(product.farmerName),
    category: escapeHtml(product.category),
  };
}

/**
 * Validate numeric inputs for product/order forms.
 * Returns { valid: boolean, errors: string[] }
 */
export function validateProductInput({ name, quantity, price }) {
  const errors = [];

  if (!name || name.trim().length === 0) {
    errors.push('Product name is required');
  }
  if (name && name.trim().length < 2) {
    errors.push('Product name must be at least 2 characters');
  }

  const qty = Number(quantity);
  if (isNaN(qty) || qty <= 0) {
    errors.push('Quantity must be a positive number');
  }
  if (qty > 100000) {
    errors.push('Quantity cannot exceed 100,000');
  }

  const p = Number(price);
  if (isNaN(p) || p <= 0) {
    errors.push('Price must be a positive number');
  }
  if (p > 1000000) {
    errors.push('Price cannot exceed ₹10,00,000');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate order quantity against available stock.
 */
export function validateOrderQuantity(requestedQty, availableQty) {
  const errors = [];
  const qty = Number(requestedQty);

  if (isNaN(qty) || qty <= 0) {
    errors.push('Quantity must be a positive number');
  }
  if (qty > availableQty) {
    errors.push(`Cannot order more than ${availableQty} available units`);
  }

  return { valid: errors.length === 0, errors };
}
