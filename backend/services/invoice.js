// backend/services/invoice.js
// Invoice generation, hashing, and deduplication service
import { db } from '../db.js';
import crypto from 'crypto';

let invoiceCounter = 0;

function generateInvoiceId() {
  invoiceCounter++;
  const year = new Date().getFullYear();
  const num = String(invoiceCounter).padStart(6, '0');
  return `INV-${year}-${num}`;
}

function computeInvoiceHash(invoiceId, orderId, batchId, total, timestamp) {
  const payload = `${invoiceId}|${orderId}|${batchId || 'N/A'}|${total}|${timestamp}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

export function createInvoice(orderData) {
  const invoices = db.get('invoices') || [];

  // Idempotency: check if invoice for this order already exists
  const existing = invoices.find(inv => inv.orderId === orderData.orderId);
  if (existing) return { invoice: existing, created: false };

  const invoiceId = generateInvoiceId();
  const now = new Date().toISOString();

  const subtotal = (orderData.quantity || 0) * (orderData.pricePerUnit || 0);
  const deliveryFee = orderData.deliveryFee || Math.round(subtotal * 0.02);
  const platformFee = Math.round(subtotal * 0.05);
  const qualityAllocation = Math.round(subtotal * 0.03);
  const farmerPayout = Math.round(subtotal * 0.60);
  const total = subtotal + deliveryFee;

  const invoiceHash = computeInvoiceHash(invoiceId, orderData.orderId, orderData.batchId, total, now);

  const invoice = {
    invoiceId,
    orderId: orderData.orderId,
    batchId: orderData.batchId || null,
    invoiceDate: now,
    seller: {
      id: orderData.sellerId,
      name: orderData.sellerName || 'Farmer',
      location: orderData.sellerLocation || ''
    },
    buyer: {
      id: orderData.buyerId,
      name: orderData.buyerName || 'Buyer',
      location: orderData.buyerLocation || ''
    },
    produce: orderData.productName || orderData.produce || 'Produce',
    category: orderData.category || '',
    quantity: orderData.quantity || 0,
    unit: orderData.unit || 'kg',
    unitPrice: orderData.pricePerUnit || 0,
    subtotal,
    deliveryFee,
    platformFee,
    qualityAllocation,
    farmerPayout,
    total,
    paymentStatus: orderData.paymentStatus || 'completed',
    deliveryStatus: orderData.deliveryStatus || 'delivered',
    blockchainVerified: orderData.blockchainVerified || false,
    invoiceHash,
    createdAt: now,
    updatedAt: now
  };

  invoices.push(invoice);
  db.set('invoices', invoices);

  return { invoice, created: true };
}

export function getInvoice(invoiceId) {
  const invoices = db.get('invoices') || [];
  return invoices.find(inv => inv.invoiceId === invoiceId) || null;
}

export function getInvoiceByOrder(orderId) {
  const invoices = db.get('invoices') || [];
  return invoices.find(inv => inv.orderId === orderId) || null;
}

export function getInvoicesForUser(userId, role) {
  const invoices = db.get('invoices') || [];
  return invoices.filter(inv => {
    if (role === 'farmer') return inv.seller.id === userId;
    if (role === 'consumer') return inv.buyer.id === userId;
    if (role === 'intermediary') return inv.seller.id === userId || inv.buyer.id === userId;
    if (role === 'retailer') return inv.seller.id === userId || inv.buyer.id === userId;
    if (role === 'admin') return true;
    return false;
  });
}

export function verifyInvoice(invoiceId) {
  const invoice = getInvoice(invoiceId);
  if (!invoice) return null;

  const expectedHash = computeInvoiceHash(
    invoice.invoiceId, invoice.orderId, invoice.batchId, invoice.total, invoice.createdAt
  );

  return {
    verified: expectedHash === invoice.invoiceHash,
    invoiceId: invoice.invoiceId,
    orderId: invoice.orderId,
    batchId: invoice.batchId,
    invoiceHash: invoice.invoiceHash,
    paymentStatus: invoice.paymentStatus,
    deliveryStatus: invoice.deliveryStatus,
    blockchainVerified: invoice.blockchainVerified,
    total: invoice.total,
    invoiceDate: invoice.invoiceDate
  };
}
