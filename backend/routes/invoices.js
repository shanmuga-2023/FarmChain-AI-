// backend/routes/invoices.js
// REST API for invoice management
import express from 'express';
import {
  createInvoice, getInvoice, getInvoiceByOrder,
  getInvoicesForUser, verifyInvoice
} from '../services/invoice.js';

export const invoiceRouter = express.Router();

// GET /api/invoices — list invoices for a user
invoiceRouter.get('/', (req, res) => {
  const { userId, role } = req.query;
  if (!userId || !role) {
    return res.status(400).json({ error: 'userId and role required' });
  }
  const invoices = getInvoicesForUser(userId, role);
  res.json({ invoices });
});

// GET /api/invoices/:invoiceId
invoiceRouter.get('/:invoiceId', (req, res) => {
  const invoice = getInvoice(req.params.invoiceId);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json({ invoice });
});

// GET /api/invoices/order/:orderId
invoiceRouter.get('/order/:orderId', (req, res) => {
  const invoice = getInvoiceByOrder(req.params.orderId);
  if (!invoice) return res.status(404).json({ error: 'No invoice for this order' });
  res.json({ invoice });
});

// POST /api/invoices — generate invoice from order
invoiceRouter.post('/', (req, res) => {
  try {
    const { invoice, created } = createInvoice(req.body);
    const io = req.app.get('io');
    if (io && created) io.emit('invoice:created', invoice);
    res.status(created ? 201 : 200).json({ invoice, created });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate invoice', message: err.message });
  }
});

// GET /api/invoices/verify/:invoiceId — public verification
invoiceRouter.get('/verify/:invoiceId', (req, res) => {
  const result = verifyInvoice(req.params.invoiceId);
  if (!result) return res.status(404).json({ error: 'Invoice not found' });

  const io = req.app.get('io');
  if (io) io.emit('invoice:verified', { invoiceId: result.invoiceId });

  res.json(result);
});
