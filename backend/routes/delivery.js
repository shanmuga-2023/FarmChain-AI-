// backend/routes/delivery.js
// REST API for delivery tracking
import express from 'express';
import {
  createDelivery, getDelivery, getDeliveriesForUser,
  getDeliveryByOrder, updateDeliveryStatus, updateDeliveryLocation
} from '../services/delivery.js';

export const deliveryRouter = express.Router();

// GET /api/deliveries — list deliveries for a user
deliveryRouter.get('/', (req, res) => {
  const { userId, role } = req.query;
  if (!userId || !role) {
    return res.status(400).json({ error: 'userId and role required' });
  }
  const deliveries = getDeliveriesForUser(userId, role);
  res.json({ deliveries });
});

// GET /api/deliveries/:deliveryId
deliveryRouter.get('/:deliveryId', (req, res) => {
  const delivery = getDelivery(req.params.deliveryId);
  if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
  res.json({ delivery });
});

// GET /api/deliveries/order/:orderId
deliveryRouter.get('/order/:orderId', (req, res) => {
  const delivery = getDeliveryByOrder(req.params.orderId);
  if (!delivery) return res.status(404).json({ error: 'No delivery for this order' });
  res.json({ delivery });
});

// POST /api/deliveries — create delivery from order
deliveryRouter.post('/', (req, res) => {
  try {
    const delivery = createDelivery(req.body);
    const io = req.app.get('io');
    if (io) io.emit('delivery:created', delivery);
    res.status(201).json({ delivery });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create delivery', message: err.message });
  }
});

// PATCH /api/deliveries/:deliveryId/status
deliveryRouter.patch('/:deliveryId/status', (req, res) => {
  const { status, actorId, location, driver } = req.body;
  if (!status || !actorId) {
    return res.status(400).json({ error: 'status and actorId required' });
  }
  const result = updateDeliveryStatus(req.params.deliveryId, status, actorId, location, driver);
  if (!result) return res.status(400).json({ error: 'Invalid status transition or delivery not found' });

  const io = req.app.get('io');
  if (io) {
    io.emit('delivery:updated', result.delivery);
    if (status === 'DELIVERED') io.emit('delivery:delivered', result.delivery);
  }

  res.json(result);
});

// PATCH /api/deliveries/:deliveryId/location
deliveryRouter.patch('/:deliveryId/location', (req, res) => {
  const { lat, lng, accuracy } = req.body;
  if (lat == null || lng == null) {
    return res.status(400).json({ error: 'lat and lng required' });
  }
  const delivery = updateDeliveryLocation(req.params.deliveryId, { lat, lng, accuracy });
  if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

  const io = req.app.get('io');
  if (io) io.emit('delivery:location', { deliveryId: delivery.deliveryId, location: delivery.currentLocation });

  res.json({ delivery });
});
