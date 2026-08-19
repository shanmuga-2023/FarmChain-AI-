// ============================================
// FarmChain AI — Smart Contract Simulations
// 5 contracts: ProductRegistry, Marketplace,
// PaymentSplitter, QualityCertification, OwnershipTransfer
// ============================================

import { blockchain } from './core.js';

// ==========================================
// 1. Product Registry Contract
// ==========================================
export class ProductRegistry {
  static async registerProduct(product) {
    const productData = {
      type: 'PRODUCT_REGISTERED',
      productId: `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: product.name,
      category: product.category,
      farmerId: product.farmerId,
      farmerName: product.farmerName,
      quantity: product.quantity,
      unit: product.unit,
      pricePerUnit: product.pricePerUnit,
      currency: 'INR',
      origin: product.origin,
      harvestDate: product.harvestDate,
      isOrganic: product.isOrganic || false,
      description: product.description || '',
      status: 'available',
      createdAt: Date.now(),
    };

    const result = await blockchain.addTransaction(productData);
    return { ...productData, ...result };
  }

  static async updateProduct(productId, updates) {
    const updateData = {
      type: 'PRODUCT_UPDATED',
      productId,
      updates,
      updatedAt: Date.now(),
    };

    return await blockchain.addTransaction(updateData);
  }

  static getProduct(productId) {
    const history = blockchain.getProductHistory(productId);
    if (history.length === 0) return null;

    // Merge all updates to get current state
    let product = {};
    for (const event of history) {
      if (event.type === 'PRODUCT_REGISTERED') {
        product = { ...event };
      } else if (event.type === 'PRODUCT_UPDATED') {
        product = { ...product, ...event.updates };
      }
    }
    return product;
  }

  static getProductsByFarmer(farmerId) {
    const allProducts = blockchain.getTransactionsByType('PRODUCT_REGISTERED');
    return allProducts.filter(p => p.farmerId === farmerId);
  }

  static getAllProducts() {
    return blockchain.getTransactionsByType('PRODUCT_REGISTERED');
  }
}

// ==========================================
// 2. Marketplace Contract
// ==========================================
export class Marketplace {
  static async createListing(listing) {
    const listingData = {
      type: 'LISTING_CREATED',
      listingId: `LIST-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      productId: listing.productId,
      sellerId: listing.sellerId,
      sellerName: listing.sellerName,
      sellerRole: listing.sellerRole,
      productName: listing.productName,
      quantity: listing.quantity,
      unit: listing.unit,
      pricePerUnit: listing.pricePerUnit,
      minOrderQuantity: listing.minOrderQuantity || 1,
      status: 'active',
      createdAt: Date.now(),
    };

    return await blockchain.addTransaction(listingData);
  }

  static async placeOrder(order) {
    const orderData = {
      type: 'ORDER_PLACED',
      orderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      listingId: order.listingId,
      productId: order.productId,
      productName: order.productName,
      buyerId: order.buyerId,
      buyerName: order.buyerName,
      buyerRole: order.buyerRole,
      sellerId: order.sellerId,
      sellerName: order.sellerName,
      quantity: order.quantity,
      unit: order.unit,
      totalAmount: order.totalAmount,
      status: 'pending',
      createdAt: Date.now(),
    };

    return await blockchain.addTransaction(orderData);
  }

  static async acceptOrder(orderId, sellerId) {
    const acceptData = {
      type: 'ORDER_ACCEPTED',
      orderId,
      sellerId,
      acceptedAt: Date.now(),
    };

    return await blockchain.addTransaction(acceptData);
  }

  static async shipOrder(orderId, sellerId) {
    return await blockchain.addTransaction({
      type: 'ORDER_SHIPPED',
      orderId,
      sellerId,
      shippedAt: Date.now(),
    });
  }

  static async deliverOrder(orderId, buyerId) {
    return await blockchain.addTransaction({
      type: 'ORDER_DELIVERED',
      orderId,
      buyerId,
      deliveredAt: Date.now(),
    });
  }

  static async cancelOrder(orderId, cancelledBy) {
    return await blockchain.addTransaction({
      type: 'ORDER_CANCELLED',
      orderId,
      cancelledBy,
      cancelledAt: Date.now(),
    });
  }

  static getOrdersByBuyer(buyerId) {
    return blockchain.getTransactionsByType('ORDER_PLACED')
      .filter(o => o.buyerId === buyerId);
  }

  static getOrdersBySeller(sellerId) {
    return blockchain.getTransactionsByType('ORDER_PLACED')
      .filter(o => o.sellerId === sellerId);
  }

  static getAllOrders() {
    return blockchain.getTransactionsByType('ORDER_PLACED');
  }

  static getAllListings() {
    return blockchain.getTransactionsByType('LISTING_CREATED');
  }

  static getActiveListings() {
    const listings = this.getAllListings();
    return listings.filter(l => l.status === 'active');
  }
}

// ==========================================
// 3. Payment Splitter Contract
// ==========================================
export class PaymentSplitter {
  static async processPayment(payment) {
    const { totalAmount, farmerId, intermediaryId, retailerId } = payment;

    // Fair split calculation
    const farmerShare = totalAmount * 0.60;   // 60% to farmer
    const intermediaryShare = intermediaryId ? totalAmount * 0.20 : 0; // 20% intermediary
    const retailerShare = retailerId ? totalAmount * 0.15 : 0; // 15% retailer
    const platformFee = totalAmount * (intermediaryId ? 0.05 : retailerId ? 0.25 : 0.40); // rest is platform

    const paymentData = {
      type: 'PAYMENT_PROCESSED',
      paymentId: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      orderId: payment.orderId,
      productId: payment.productId,
      totalAmount,
      currency: 'INR',
      splits: {
        farmer: { id: farmerId, amount: farmerShare, percentage: 60 },
        intermediary: intermediaryId ? { id: intermediaryId, amount: intermediaryShare, percentage: 20 } : null,
        retailer: retailerId ? { id: retailerId, amount: retailerShare, percentage: 15 } : null,
        platform: { amount: platformFee, percentage: intermediaryId ? 5 : retailerId ? 25 : 40 },
      },
      status: 'completed',
      processedAt: Date.now(),
    };

    return await blockchain.addTransaction(paymentData);
  }

  static getPaymentHistory(entityId) {
    const payments = blockchain.getTransactionsByType('PAYMENT_PROCESSED');
    return payments.filter(p => {
      const s = p.splits;
      return (s.farmer && s.farmer.id === entityId) ||
        (s.intermediary && s.intermediary.id === entityId) ||
        (s.retailer && s.retailer.id === entityId);
    });
  }

  static getTotalRevenue(entityId) {
    const payments = this.getPaymentHistory(entityId);
    return payments.reduce((total, p) => {
      const s = p.splits;
      if (s.farmer && s.farmer.id === entityId) return total + s.farmer.amount;
      if (s.intermediary && s.intermediary.id === entityId) return total + s.intermediary.amount;
      if (s.retailer && s.retailer.id === entityId) return total + s.retailer.amount;
      return total;
    }, 0);
  }

  static getAllPayments() {
    return blockchain.getTransactionsByType('PAYMENT_PROCESSED');
  }
}

// ==========================================
// 4. Quality Certification Contract
// ==========================================
export class QualityCertification {
  static async issueCertificate(cert) {
    const certData = {
      type: 'CERTIFICATE_ISSUED',
      certId: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      productId: cert.productId,
      productName: cert.productName,
      issuerId: cert.issuerId,
      issuerName: cert.issuerName,
      certType: cert.certType, // 'organic', 'quality', 'safety', 'fair-trade'
      grade: cert.grade, // 'A+', 'A', 'B', 'C'
      validUntil: cert.validUntil,
      details: cert.details || '',
      status: 'valid',
      issuedAt: Date.now(),
    };

    return await blockchain.addTransaction(certData);
  }

  static async verifyCertificate(certId) {
    const certs = blockchain.getTransactionsByType('CERTIFICATE_ISSUED');
    const cert = certs.find(c => c.certId === certId);
    if (!cert) return { valid: false, reason: 'Certificate not found' };

    const revocations = blockchain.getTransactionsByType('CERTIFICATE_REVOKED');
    const isRevoked = revocations.some(r => r.certId === certId);
    if (isRevoked) return { valid: false, reason: 'Certificate has been revoked', cert };

    if (cert.validUntil && Date.now() > cert.validUntil) {
      return { valid: false, reason: 'Certificate has expired', cert };
    }

    return { valid: true, cert };
  }

  static async revokeCertificate(certId, reason) {
    return await blockchain.addTransaction({
      type: 'CERTIFICATE_REVOKED',
      certId,
      reason,
      revokedAt: Date.now(),
    });
  }

  static getCertificatesByProduct(productId) {
    return blockchain.getTransactionsByType('CERTIFICATE_ISSUED')
      .filter(c => c.productId === productId);
  }

  static getAllCertificates() {
    return blockchain.getTransactionsByType('CERTIFICATE_ISSUED');
  }
}

// ==========================================
// 5. Ownership Transfer Contract
// ==========================================
export class OwnershipTransfer {
  static async initiateTransfer(transfer) {
    const transferData = {
      type: 'TRANSFER_INITIATED',
      transferId: `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      productId: transfer.productId,
      productName: transfer.productName,
      from: transfer.from,
      fromName: transfer.fromName,
      fromRole: transfer.fromRole,
      to: transfer.to,
      toName: transfer.toName,
      toRole: transfer.toRole,
      quantity: transfer.quantity,
      unit: transfer.unit,
      location: transfer.location || '',
      status: 'pending',
      initiatedAt: Date.now(),
    };

    return await blockchain.addTransaction(transferData);
  }

  static async confirmTransfer(transferId, confirmerId) {
    return await blockchain.addTransaction({
      type: 'TRANSFER_CONFIRMED',
      transferId,
      confirmerId,
      confirmedAt: Date.now(),
    });
  }

  static getOwnershipChain(productId) {
    const transfers = blockchain.getProductHistory(productId)
      .filter(t => t.type === 'TRANSFER_INITIATED' || t.type === 'TRANSFER_CONFIRMED');
    return transfers;
  }

  static getTransfersByEntity(entityId) {
    const transfers = blockchain.getTransactionsByType('TRANSFER_INITIATED');
    return transfers.filter(t => t.from === entityId || t.to === entityId);
  }

  static getAllTransfers() {
    return blockchain.getTransactionsByType('TRANSFER_INITIATED');
  }
}
