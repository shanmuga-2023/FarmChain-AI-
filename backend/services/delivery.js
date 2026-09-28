// backend/services/delivery.js
// Delivery lifecycle management service
import { db } from '../db.js';

const DELIVERY_STATUSES = [
  'ORDER_CREATED', 'PICKUP_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT',
  'NEAR_DESTINATION', 'OUT_FOR_DELIVERY', 'DELIVERED', 'BUYER_CONFIRMED', 'ESCROW_RELEASED'
];

const BLOCKCHAIN_STAGE_MAP = {
  'PICKED_UP': 'InTransit',
  'DELIVERED': 'AtRetailer',
  'BUYER_CONFIRMED': 'Sold'
};

function generateDeliveryId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DEL-${ts}-${rand}`;
}

export function createDelivery(orderData) {
  const deliveryId = generateDeliveryId();
  const now = new Date().toISOString();

  const delivery = {
    deliveryId,
    orderId: orderData.orderId,
    batchId: orderData.batchId || null,
    farmerId: orderData.sellerId || orderData.farmerId,
    intermediaryId: orderData.intermediaryId || null,
    retailerId: orderData.retailerId || null,
    consumerId: orderData.buyerId || orderData.consumerId,
    status: 'ORDER_CREATED',
    pickupLocation: orderData.pickupLocation || { lat: 19.076, lng: 72.8777 },
    destination: orderData.destination || { lat: 19.229, lng: 72.8544 },
    currentLocation: null,
    estimatedDelivery: orderData.estimatedDelivery || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    driver: null,
    produce: orderData.produce || orderData.productName || 'Produce',
    quantity: orderData.quantity || 0,
    unit: orderData.unit || 'kg',
    qualityGrade: orderData.qualityGrade || null,
    events: [{
      status: 'ORDER_CREATED',
      timestamp: now,
      location: null,
      actor: orderData.sellerId || 'system',
      note: 'Delivery created from order'
    }],
    createdAt: now,
    updatedAt: now
  };

  // Store in db
  const deliveries = db.get('deliveries') || [];
  deliveries.push(delivery);
  db.set('deliveries', deliveries);

  return delivery;
}

export function getDelivery(deliveryId) {
  const deliveries = db.get('deliveries') || [];
  return deliveries.find(d => d.deliveryId === deliveryId) || null;
}

export function getDeliveriesForUser(userId, role) {
  const deliveries = db.get('deliveries') || [];
  return deliveries.filter(d => {
    if (role === 'farmer') return d.farmerId === userId;
    if (role === 'intermediary') return d.intermediaryId === userId || d.farmerId === userId;
    if (role === 'retailer') return d.retailerId === userId;
    if (role === 'consumer') return d.consumerId === userId;
    if (role === 'admin') return true;
    return false;
  });
}

export function getDeliveryByOrder(orderId) {
  const deliveries = db.get('deliveries') || [];
  return deliveries.find(d => d.orderId === orderId) || null;
}

export function updateDeliveryStatus(deliveryId, newStatus, actorId, location = null, driverInfo = null) {
  const deliveries = db.get('deliveries') || [];
  const idx = deliveries.findIndex(d => d.deliveryId === deliveryId);
  if (idx === -1) return null;

  const delivery = deliveries[idx];
  const statusIdx = DELIVERY_STATUSES.indexOf(newStatus);
  const currentIdx = DELIVERY_STATUSES.indexOf(delivery.status);

  if (statusIdx < 0) return null;
  if (statusIdx <= currentIdx) return null; // Can only move forward

  const now = new Date().toISOString();
  delivery.status = newStatus;
  delivery.updatedAt = now;

  if (location) {
    delivery.currentLocation = { ...location, timestamp: now };
  }

  if (driverInfo) {
    delivery.driver = driverInfo;
  }

  delivery.events.push({
    status: newStatus,
    timestamp: now,
    location: location || null,
    actor: actorId
  });

  deliveries[idx] = delivery;
  db.set('deliveries', deliveries);

  return {
    delivery,
    blockchainStage: BLOCKCHAIN_STAGE_MAP[newStatus] || null
  };
}

export function updateDeliveryLocation(deliveryId, location) {
  const deliveries = db.get('deliveries') || [];
  const idx = deliveries.findIndex(d => d.deliveryId === deliveryId);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  deliveries[idx].currentLocation = {
    lat: location.lat,
    lng: location.lng,
    accuracy: location.accuracy || null,
    timestamp: now
  };
  deliveries[idx].updatedAt = now;
  db.set('deliveries', deliveries);
  return deliveries[idx];
}

export { DELIVERY_STATUSES, BLOCKCHAIN_STAGE_MAP };
