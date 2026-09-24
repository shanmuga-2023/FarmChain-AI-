// server/routes/api.js
import express from 'express';
import { db } from '../db.js';
import { getLiveMandiRates } from '../services/mandiData.js';

export const apiRouter = express.Router();

// ==========================================
// Input Validation Helpers (Returns Codes & Params)
// ==========================================
function validateProduct(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) {
    errors.push({ code: 'ERR_NAME_REQUIRED', field: 'name' });
  }
  if (body.quantity !== undefined && (typeof body.quantity !== 'number' || body.quantity <= 0)) {
    errors.push({ code: 'ERR_QTY_INVALID', field: 'quantity' });
  }
  if (body.pricePerUnit !== undefined && (typeof body.pricePerUnit !== 'number' || body.pricePerUnit <= 0)) {
    errors.push({ code: 'ERR_PRICE_INVALID', field: 'pricePerUnit' });
  }
  if (body.quantity > 100000) {
    errors.push({ code: 'ERR_QTY_EXCEEDED', field: 'quantity', max: 100000 });
  }
  if (body.pricePerUnit > 1000000) {
    errors.push({ code: 'ERR_PRICE_EXCEEDED', field: 'pricePerUnit', max: 1000000 });
  }
  return errors;
}

function validateOrder(body) {
  const errors = [];
  if (!body.productId) errors.push({ code: 'ERR_PRODUCT_ID_REQUIRED', field: 'productId' });
  if (!body.buyerId) errors.push({ code: 'ERR_BUYER_ID_REQUIRED', field: 'buyerId' });
  if (!body.sellerId) errors.push({ code: 'ERR_SELLER_ID_REQUIRED', field: 'sellerId' });
  if (body.quantity !== undefined && (typeof body.quantity !== 'number' || body.quantity <= 0)) {
    errors.push({ code: 'ERR_QTY_INVALID', field: 'quantity' });
  }
  if (body.totalAmount !== undefined && (typeof body.totalAmount !== 'number' || body.totalAmount <= 0)) {
    errors.push({ code: 'ERR_TOTAL_INVALID', field: 'totalAmount' });
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
// API Index
// ==========================================
apiRouter.get('/', (req, res) => {
  res.json({
    name: '🌾 FarmChain AI 2.0 REST API',
    status: 'online',
    version: '2.0.0-enterprise',
    endpoints: {
      health: 'GET /api/health',
      mandiRates: 'GET /api/mandi-rates',
      products: 'GET, POST /api/products',
      productDetail: 'GET, PATCH, DELETE /api/products/:productId',
      orders: 'GET, POST, PATCH /api/orders',
      orderDetail: 'GET /api/orders/:orderId',
      users: 'GET, POST /api/users',
      sendOtp: 'POST /api/auth/send-otp',
      verifyOtp: 'POST /api/auth/verify-otp',
    },
  });
});

// ==========================================
// Health Check
// ==========================================
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', code: 'STATUS_HEALTHY', time: new Date().toISOString(), version: '2.0.0-enterprise' });
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
    return res.status(400).json({ success: false, code: 'VALIDATION_FAILED', errors });
  }

  const sanitized = sanitizeBody(req.body);
  const newProduct = {
    ...sanitized,
    productId: sanitized.productId || `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    createdAt: Date.now(),
    status: 'available',
  };
  db.addItem('products', newProduct);

  // Broadcast to WebSockets with standard code
  if (req.app.get('io')) {
    req.app.get('io').emit('product_added', { code: 'PRODUCT_ADDED', data: newProduct });
  }

  res.status(201).json({ success: true, code: 'PRODUCT_CREATED', data: newProduct });
});

apiRouter.get('/products/:productId', (req, res) => {
  const { productId } = req.params;
  const product = db.findItem('products', p => p.productId === productId);
  if (!product) {
    return res.status(404).json({ success: false, code: 'PRODUCT_NOT_FOUND', params: { productId } });
  }
  res.json({ success: true, code: 'PRODUCT_FOUND', data: product });
});

apiRouter.patch('/products/:productId', (req, res) => {
  const { productId } = req.params;
  const product = db.findItem('products', p => p.productId === productId);
  if (!product) {
    return res.status(404).json({ success: false, code: 'PRODUCT_NOT_FOUND', params: { productId } });
  }

  const updates = sanitizeBody(req.body);

  // Validate updated fields if provided
  if (updates.name !== undefined || updates.quantity !== undefined || updates.pricePerUnit !== undefined) {
    const checkBody = {
      name: updates.name !== undefined ? updates.name : product.name,
      quantity: updates.quantity !== undefined ? updates.quantity : product.quantity,
      pricePerUnit: updates.pricePerUnit !== undefined ? updates.pricePerUnit : product.pricePerUnit,
    };
    const errors = validateProduct(checkBody);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, code: 'VALIDATION_FAILED', errors });
    }
  }

  // Only allow updating specific fields
  const allowedFields = ['name', 'category', 'quantity', 'unit', 'pricePerUnit', 'description', 'origin', 'harvestDate', 'isOrganic', 'status', 'emoji'];
  const filteredUpdates = { updatedAt: Date.now() };
  for (const key of allowedFields) {
    if (updates[key] !== undefined) filteredUpdates[key] = updates[key];
  }

  db.updateItem('products', p => p.productId === productId, filteredUpdates);
  const updatedProduct = db.findItem('products', p => p.productId === productId);

  // Broadcast to WebSockets
  if (req.app.get('io')) {
    req.app.get('io').emit('product_updated', { code: 'PRODUCT_UPDATED', data: updatedProduct });
  }

  res.json({ success: true, code: 'PRODUCT_UPDATED', data: updatedProduct });
});

apiRouter.delete('/products/:productId', (req, res) => {
  const { productId } = req.params;
  const product = db.findItem('products', p => p.productId === productId);
  if (!product) {
    return res.status(404).json({ success: false, code: 'PRODUCT_NOT_FOUND', params: { productId } });
  }

  const removed = db.removeItem('products', p => p.productId === productId);
  if (!removed) {
    return res.status(500).json({ success: false, code: 'PRODUCT_DELETE_FAILED', params: { productId } });
  }

  // Broadcast to WebSockets
  if (req.app.get('io')) {
    req.app.get('io').emit('product_deleted', { code: 'PRODUCT_DELETED', productId });
  }

  res.json({ success: true, code: 'PRODUCT_DELETED', productId });
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
    return res.status(400).json({ success: false, code: 'VALIDATION_FAILED', errors });
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
    req.app.get('io').emit('order_created', { code: 'ORDER_PLACED', data: newOrder });
  }

  res.status(201).json({ success: true, code: 'ORDER_PLACED', data: newOrder });
});

apiRouter.patch('/orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  const updates = sanitizeBody(req.body);

  const allowedFields = ['status', 'shippedAt', 'deliveredAt', 'acceptedAt'];
  const filteredUpdates = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) filteredUpdates[key] = updates[key];
  }

  db.updateItem('orders', o => o.orderId === orderId, filteredUpdates);

  if (req.app.get('io')) {
    req.app.get('io').emit('order_updated', { code: 'ORDER_STATUS_CHANGED', orderId, updates: filteredUpdates });
  }

  res.json({ success: true, code: 'ORDER_STATUS_CHANGED', orderId, updates: filteredUpdates });
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
  res.status(201).json({ success: true, code: 'CERTIFICATE_ISSUED', data: newCert });
});

// ==========================================
// Users Sync
// ==========================================
apiRouter.get('/users', (req, res) => {
  const users = db.get('users');
  res.json(Array.isArray(users) ? users : Object.values(users || {}));
});

apiRouter.post('/users', (req, res) => {
  const user = sanitizeBody(req.body);
  if (!user.id && !user.email) {
    return res.status(400).json({ success: false, code: 'ERR_USER_ID_OR_EMAIL_REQUIRED' });
  }
  const existingUsers = db.get('users');
  const userList = Array.isArray(existingUsers) ? existingUsers : Object.values(existingUsers || {});
  const idx = userList.findIndex(u => (u.id && u.id === user.id) || (u.email && u.email === user.email));
  if (idx >= 0) {
    userList[idx] = { ...userList[idx], ...user };
  } else {
    userList.push(user);
  }
  db.set('users', userList);

  if (req.app.get('io')) {
    req.app.get('io').emit('user_registered', { code: 'USER_REGISTERED', data: user });
  }

  res.status(201).json({ success: true, code: 'USER_REGISTERED', data: user });
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
    req.app.get('io').emit('block_mined', { code: 'BLOCK_MINED', data: block });
  }

  res.status(201).json({ success: true, code: 'BLOCK_MINED', blockIndex: block.index });
});

// ==========================================
// Phone OTP Authentication (ERC-4337 Support)
// ==========================================
const activeOtps = new Map();

apiRouter.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone || typeof phone !== 'string' || phone.trim().length < 10) {
    return res.status(400).json({ success: false, code: 'ERR_INVALID_PHONE' });
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  activeOtps.set(cleanPhone, {
    otp,
    createdAt: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  console.log(`\n📱 [SMS GATEWAY] Dispatching OTP to ${cleanPhone}`);
  console.log(`💬 Message: "Your FarmChain AI smart wallet verification code is ${otp}. Valid for 5 minutes."\n`);

  if (req.app.get('io')) {
    req.app.get('io').emit('otp_dispatched', { code: 'OTP_SENT', phone: cleanPhone, timestamp: Date.now() });
  }

  res.json({
    success: true,
    code: 'OTP_SENT',
    phone: cleanPhone,
    expiresIn: 300,
  });
});

apiRouter.post('/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ success: false, code: 'ERR_PHONE_AND_OTP_REQUIRED' });
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const record = activeOtps.get(cleanPhone);

  if (!record) {
    return res.status(400).json({ success: false, code: 'ERR_OTP_NOT_FOUND' });
  }

  if (Date.now() > record.expiresAt) {
    activeOtps.delete(cleanPhone);
    return res.status(400).json({ success: false, code: 'ERR_OTP_EXPIRED' });
  }

  if (record.otp !== otp.trim()) {
    return res.status(400).json({ success: false, code: 'ERR_OTP_INVALID' });
  }

  activeOtps.delete(cleanPhone);

  res.json({
    success: true,
    code: 'OTP_VERIFIED',
    phone: cleanPhone,
    verified: true,
  });
});

// ==========================================
// Reset Platform State
// ==========================================
apiRouter.post('/reset', (req, res) => {
  db.reset();
  activeOtps.clear();
  if (req.app.get('io')) {
    req.app.get('io').emit('platform_reset', { code: 'PLATFORM_RESET' });
  }
  res.json({ success: true, code: 'PLATFORM_RESET' });
});
