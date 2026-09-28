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

// GET /api/invoices/:invoiceId/html
invoiceRouter.get('/:invoiceId/html', (req, res) => {
  const invoice = getInvoice(req.params.invoiceId);
  if (!invoice) return res.status(404).send('Invoice not found');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.invoiceId}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f0f9ff; margin: 0; padding: 40px; color: #0f172a; }
        .invoice-box { max-width: 800px; margin: auto; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.06); }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
        .title { font-size: 28px; font-weight: bold; color: #0369a1; }
        .info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; color: #64748b; font-weight: 600; }
        .total-row { font-weight: bold; font-size: 18px; color: #0f172a; border-top: 2px solid #0f172a; }
        .badge { background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-size: 14px; font-weight: 500; }
        .footer { text-align: center; color: #94a3b8; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
        @media print {
          body { background: white; padding: 0; }
          .invoice-box { box-shadow: none; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <div class="header">
          <div class="title">FARMCHAIN AI</div>
          <div style="text-align: right;">
            <strong>INVOICE</strong><br>
            # ${invoice.invoiceId}<br>
            Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}
          </div>
        </div>
        <div class="info">
          <div>
            <strong>Billed To:</strong><br>
            ${invoice.buyer.name}<br>
            ID: ${invoice.buyer.id}
          </div>
          <div style="text-align: right;">
            <strong>Seller / Farmer:</strong><br>
            ${invoice.seller.name}<br>
            ID: ${invoice.seller.id}
          </div>
        </div>
        <table>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
          <tr>
            <td>${invoice.produce} ${invoice.category ? '(' + invoice.category + ')' : ''}</td>
            <td>${invoice.quantity} ${invoice.unit}</td>
            <td>₹${(invoice.unitPrice || 0).toFixed(2)}</td>
            <td>₹${(invoice.subtotal || 0).toFixed(2)}</td>
          </tr>
        </table>
        
        <div style="width: 50%; float: right;">
          <table>
            <tr><td>Farmer Payout (60%)</td><td>₹${(invoice.farmerPayout || 0).toFixed(2)}</td></tr>
            <tr><td>Intermediary (20%)</td><td>₹${(invoice.intermediaryLogistics || 0).toFixed(2)}</td></tr>
            <tr><td>Retailer (15%)</td><td>₹${(invoice.retailerStore || 0).toFixed(2)}</td></tr>
            <tr><td>Platform Fee (5%)</td><td>₹${(invoice.platformFee || 0).toFixed(2)}</td></tr>
            <tr class="total-row"><td>Total Paid</td><td>₹${(invoice.total || 0).toFixed(2)}</td></tr>
          </table>
        </div>
        <div style="clear: both;"></div>
        
        <div style="margin-top: 20px; background: #f8fafc; padding: 16px; border-radius: 8px;">
          <strong>Order ID:</strong> ${invoice.orderId}<br>
          <strong>Payment Status:</strong> <span class="badge">Completed</span><br>
          <strong>Blockchain Verification:</strong> <span class="badge">Verified</span><br>
          <div style="margin-top: 8px; font-size: 13px; color: #64748b; word-break: break-all;">
            <strong>Tx Hash:</strong> ${invoice.invoiceHash}
          </div>
        </div>
        
        <div class="footer">
          Thank you for supporting transparent agriculture!<br>
          FarmChain AI Transparent Escrow System
        </div>
      </div>
      <script>
        if (window.location.search.includes('print=true')) {
          setTimeout(() => window.print(), 500);
        }
      </script>
    </body>
    </html>
  `;
  res.send(html);
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
