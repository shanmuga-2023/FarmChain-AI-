// server/routes/api.js
import express from 'express';
import { db } from '../db.js';
import { getLiveMandiRates } from '../services/mandiData.js';

export const apiRouter = express.Router();

// ==========================================
// Input Validation Helpers
// ==========================================
function validateProduct(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) {
    errors.push('Product name is required and must be at least 2 characters');
  }
  if (body.quantity !== undefined && (typeof body.quantity !== 'number' || body.quantity <= 0)) {
    errors.push('Quantity must be a positive number');
  }
  if (body.pricePerUnit !== undefined && (typeof body.pricePerUnit !== 'number' || body.pricePerUnit <= 0)) {
    errors.push('Price must be a positive number');
  }
  if (body.quantity > 100000) {
    errors.push('Quantity cannot exceed 100,000');
  }
  if (body.pricePerUnit > 1000000) {
    errors.push('Price cannot exceed 10,00,000');
  }
  return errors;
}

function validateOrder(body) {
  const errors = [];
  if (!body.productId) errors.push('Product ID is required');
  if (!body.buyerId) errors.push('Buyer ID is required');
  if (!body.sellerId) errors.push('Seller ID is required');
  if (body.quantity !== undefined && (typeof body.quantity !== 'number' || body.quantity <= 0)) {
    errors.push('Quantity must be a positive number');
  }
  if (body.totalAmount !== undefined && (typeof body.totalAmount !== 'number' || body.totalAmount <= 0)) {
    errors.push('Total amount must be a positive number');
  }
  return errors;
}

// ==========================================
// Sanitize — strip dangerous HTML
// ==========================================
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>"'`]/g, '');
}

function sanitizeBody(body) {
  const sanitized = {};
  for (const [key, value] of Object.entries(body)) {
    sanitized[key] = typeof value === 'string' ? sanitizeString(value) : value;
  }
  return sanitized;
}

// ==========================================
// Health Check
// ==========================================
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), version: '2.0.0-enterprise' });
});

// ==========================================
// Live Mandi Spot Price Oracle
// ==========================================
apiRouter.get('/mandi-rates', (req, res) => {
  res.json(getLiveMandiRates());
});

// ==========================================
// Products
// ==========================================
apiRouter.get('/products', (req, res) => {
  res.json(db.get('products'));
});

apiRouter.post('/products', (req, res) => {
  const errors = validateProduct(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  const sanitized = sanitizeBody(req.body);
  const newProduct = {
    ...sanitized,
    productId: sanitized.productId || `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    createdAt: Date.now(),
    status: 'available',
  };
  db.addItem('products', newProduct);

  // Broadcast to WebSockets
  if (req.app.get('io')) {
    req.app.get('io').emit('product_added', newProduct);
  }

  res.status(201).json(newProduct);
});

// ==========================================
// Orders
// ==========================================
apiRouter.get('/orders', (req, res) => {
  res.json(db.get('orders'));
});

apiRouter.post('/orders', (req, res) => {
  const errors = validateOrder(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  const sanitized = sanitizeBody(req.body);
  const newOrder = {
    ...sanitized,
    orderId: sanitized.orderId || `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    status: sanitized.status || 'pending',
    createdAt: Date.now(),
  };
  db.addItem('orders', newOrder);

  if (req.app.get('io')) {
    req.app.get('io').emit('order_created', newOrder);
  }

  res.status(201).json(newOrder);
});

apiRouter.patch('/orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  const updates = sanitizeBody(req.body);

  // Only allow status and specific fields to be updated
  const allowedFields = ['status', 'shippedAt', 'deliveredAt', 'acceptedAt'];
  const filteredUpdates = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) filteredUpdates[key] = updates[key];
  }

  db.updateItem('orders', o => o.orderId === orderId, filteredUpdates);

  if (req.app.get('io')) {
    req.app.get('io').emit('order_updated', { orderId, updates: filteredUpdates });
  }

  res.json({ success: true, orderId, updates: filteredUpdates });
});

// ==========================================
// Certificates
// ==========================================
apiRouter.get('/certificates', (req, res) => {
  res.json(db.get('certificates'));
});

apiRouter.post('/certificates', (req, res) => {
  const sanitized = sanitizeBody(req.body);
  const newCert = {
    ...sanitized,
    certId: sanitized.certId || `CERT-${Date.now()}`,
    issuedAt: Date.now(),
  };
  db.addItem('certificates', newCert);
  res.status(201).json(newCert);
});

// ==========================================
// Blockchain Blocks Sync
// ==========================================
apiRouter.get('/blocks', (req, res) => {
  res.json(db.get('blocks'));
});

apiRouter.post('/blocks', (req, res) => {
  const block = req.body;
  db.addItem('blocks', block);

  if (req.app.get('io')) {
    req.app.get('io').emit('block_mined', block);
  }

  res.status(201).json({ success: true, blockIndex: block.index });
});

// ==========================================
// Phone OTP Authentication (ERC-4337 Support)
// ==========================================
const activeOtps = new Map();

apiRouter.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone || typeof phone !== 'string' || phone.trim().length < 10) {
    return res.status(400).json({ success: false, error: 'Valid phone number is required' });
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  activeOtps.set(cleanPhone, {
    otp,
    createdAt: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  });

  console.log(`\n📱 [SMS GATEWAY] Dispatching OTP to ${cleanPhone}`);
  console.log(`💬 Message: "Your FarmChain AI smart wallet verification code is ${otp}. Valid for 5 minutes."\n`);

  // Broadcast to WebSockets for live device sync
  if (req.app.get('io')) {
    req.app.get('io').emit('otp_dispatched', { phone: cleanPhone, timestamp: Date.now() });
  }

  res.json({
    success: true,
    phone: cleanPhone,
    expiresIn: 300,
    otp, // Delivered via secure payload for browser notification simulation
    message: `OTP sent successfully to ${cleanPhone}`,
  });
});

apiRouter.post('/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ success: false, error: 'Phone and OTP are required' });
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const record = activeOtps.get(cleanPhone);

  if (!record) {
    return res.status(400).json({ success: false, error: 'No OTP request found for this number. Please request a new OTP.' });
  }

  if (Date.now() > record.expiresAt) {
    activeOtps.delete(cleanPhone);
    return res.status(400).json({ success: false, error: 'OTP has expired. Please request a new one.' });
  }

  if (record.otp !== otp.trim()) {
    return res.status(400).json({ success: false, error: 'Invalid verification code. Please check and try again.' });
  }

  // Verified successfully - consume OTP
  activeOtps.delete(cleanPhone);

  res.json({
    success: true,
    phone: cleanPhone,
    verified: true,
    message: 'Phone number verified successfully',
  });
});

// ==========================================
// Reset Platform State
// ==========================================
apiRouter.post('/reset', (req, res) => {
  db.reset();
  activeOtps.clear();
  if (req.app.get('io')) {
    req.app.get('io').emit('platform_reset', {});
  }
  res.json({ success: true, message: 'Platform state reset successfully' });
});
