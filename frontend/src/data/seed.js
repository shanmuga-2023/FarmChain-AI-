// ============================================
// FarmChain AI — Seed Data
// Realistic Indian agricultural demo data
// ============================================

import { store } from './store.js';
import { blockchain } from '../blockchain/core.js';
import { ProductRegistry, Marketplace, QualityCertification, OwnershipTransfer, PaymentSplitter } from '../blockchain/contracts.js';

const USERS = {
  'farmer-001': {
    id: 'farmer-001',
    name: 'Rajesh Kumar',
    role: 'farmer',
    location: 'Nashik, Maharashtra',
    email: 'rajesh@farm.in',
    avatar: '👨‍🌾',
    joinedAt: Date.now() - 180 * 86400000,
    rating: 4.8,
    verified: true,
  },
  'farmer-002': {
    id: 'farmer-002',
    name: 'Lakshmi Devi',
    role: 'farmer',
    location: 'Thanjavur, Tamil Nadu',
    email: 'lakshmi@farm.in',
    avatar: '👩‍🌾',
    joinedAt: Date.now() - 240 * 86400000,
    rating: 4.9,
    verified: true,
  },
  'farmer-003': {
    id: 'farmer-003',
    name: 'Arjun Singh',
    role: 'farmer',
    location: 'Ludhiana, Punjab',
    email: 'arjun@farm.in',
    avatar: '👨‍🌾',
    joinedAt: Date.now() - 120 * 86400000,
    rating: 4.6,
    verified: true,
  },
  'intermediary-001': {
    id: 'intermediary-001',
    name: 'AgriTraders Pvt Ltd',
    role: 'intermediary',
    location: 'Mumbai, Maharashtra',
    email: 'info@agritraders.in',
    avatar: '🏢',
    joinedAt: Date.now() - 365 * 86400000,
    rating: 4.5,
    verified: true,
  },
  'intermediary-002': {
    id: 'intermediary-002',
    name: 'GreenPath Distributors',
    role: 'intermediary',
    location: 'Chennai, Tamil Nadu',
    email: 'contact@greenpath.in',
    avatar: '🏪',
    joinedAt: Date.now() - 200 * 86400000,
    rating: 4.3,
    verified: true,
  },
  'retailer-001': {
    id: 'retailer-001',
    name: 'FreshMart Stores',
    role: 'retailer',
    location: 'Bangalore, Karnataka',
    email: 'orders@freshmart.in',
    avatar: '🛒',
    joinedAt: Date.now() - 300 * 86400000,
    rating: 4.7,
    verified: true,
  },
  'retailer-002': {
    id: 'retailer-002',
    name: 'Nature\'s Basket',
    role: 'retailer',
    location: 'Delhi, NCR',
    email: 'store@naturesbasket.in',
    avatar: '🏬',
    joinedAt: Date.now() - 500 * 86400000,
    rating: 4.6,
    verified: true,
  },
  'consumer-001': {
    id: 'consumer-001',
    name: 'Priya Sharma',
    role: 'consumer',
    location: 'Bangalore, Karnataka',
    email: 'priya@email.in',
    avatar: '👤',
    joinedAt: Date.now() - 60 * 86400000,
    rating: 4.2,
    verified: true,
  },
  'admin-001': {
    id: 'admin-001',
    name: 'System Admin',
    role: 'admin',
    location: 'Platform HQ',
    email: 'admin@farmchain.ai',
    avatar: '🔧',
    joinedAt: Date.now() - 500 * 86400000,
    rating: 5.0,
    verified: true,
  },
};

const PRODUCTS = [
  {
    name: 'Organic Basmati Rice',
    category: 'Grains',
    farmerId: 'farmer-002',
    farmerName: 'Lakshmi Devi',
    quantity: 500,
    unit: 'kg',
    pricePerUnit: 85,
    origin: 'Thanjavur, Tamil Nadu',
    harvestDate: '2024-10-15',
    isOrganic: true,
    description: 'Premium aged Basmati rice, organically grown using traditional methods. No pesticides or chemical fertilizers.',
    emoji: '🌾',
  },
  {
    name: 'Fresh Nashik Onions',
    category: 'Vegetables',
    farmerId: 'farmer-001',
    farmerName: 'Rajesh Kumar',
    quantity: 1000,
    unit: 'kg',
    pricePerUnit: 32,
    origin: 'Nashik, Maharashtra',
    harvestDate: '2024-11-20',
    isOrganic: false,
    description: 'Premium quality red onions from Nashik. Fresh harvest, well-sorted and graded.',
    emoji: '🧅',
  },
  {
    name: 'Punjab Premium Wheat',
    category: 'Grains',
    farmerId: 'farmer-003',
    farmerName: 'Arjun Singh',
    quantity: 2000,
    unit: 'kg',
    pricePerUnit: 28,
    origin: 'Ludhiana, Punjab',
    harvestDate: '2024-04-10',
    isOrganic: false,
    description: 'High-quality wheat grain, sun-dried and cleaned. Ideal for premium flour production.',
    emoji: '🌿',
  },
  {
    name: 'Alphonso Mangoes',
    category: 'Fruits',
    farmerId: 'farmer-001',
    farmerName: 'Rajesh Kumar',
    quantity: 300,
    unit: 'kg',
    pricePerUnit: 450,
    origin: 'Ratnagiri, Maharashtra',
    harvestDate: '2024-05-01',
    isOrganic: true,
    description: 'GI-tagged Ratnagiri Alphonso mangoes. Naturally ripened, premium export quality.',
    emoji: '🥭',
  },
  {
    name: 'Organic Turmeric',
    category: 'Spices',
    farmerId: 'farmer-002',
    farmerName: 'Lakshmi Devi',
    quantity: 200,
    unit: 'kg',
    pricePerUnit: 120,
    origin: 'Erode, Tamil Nadu',
    harvestDate: '2024-02-10',
    isOrganic: true,
    description: 'High-curcumin Erode turmeric. Organically cultivated, sun-dried and polished.',
    emoji: '🟡',
  },
  {
    name: 'Fresh Tomatoes',
    category: 'Vegetables',
    farmerId: 'farmer-001',
    farmerName: 'Rajesh Kumar',
    quantity: 800,
    unit: 'kg',
    pricePerUnit: 25,
    origin: 'Nashik, Maharashtra',
    harvestDate: '2024-12-01',
    isOrganic: false,
    description: 'Farm-fresh, vine-ripened tomatoes. Sorted by size, packed in ventilated crates.',
    emoji: '🍅',
  },
  {
    name: 'Organic Bananas',
    category: 'Fruits',
    farmerId: 'farmer-002',
    farmerName: 'Lakshmi Devi',
    quantity: 600,
    unit: 'kg',
    pricePerUnit: 40,
    origin: 'Trichy, Tamil Nadu',
    harvestDate: '2024-11-25',
    isOrganic: true,
    description: 'Naturally ripened Robusta bananas. Chemical-free cultivation, packed fresh.',
    emoji: '🍌',
  },
  {
    name: 'Green Chillies',
    category: 'Vegetables',
    farmerId: 'farmer-003',
    farmerName: 'Arjun Singh',
    quantity: 150,
    unit: 'kg',
    pricePerUnit: 60,
    origin: 'Guntur, Andhra Pradesh',
    harvestDate: '2024-11-15',
    isOrganic: false,
    description: 'Guntur green chillies. Medium spice level, vibrant green color, freshly picked.',
    emoji: '🌶️',
  },
];

const CERTIFICATES = [
  { productName: 'Organic Basmati Rice', certType: 'organic', grade: 'A+', issuerName: 'India Organic', details: 'NPOP certified organic production' },
  { productName: 'Alphonso Mangoes', certType: 'quality', grade: 'A+', issuerName: 'APEDA', details: 'GI-tagged Ratnagiri origin verified' },
  { productName: 'Organic Turmeric', certType: 'organic', grade: 'A', issuerName: 'India Organic', details: 'Certified organic, high curcumin content' },
  { productName: 'Organic Bananas', certType: 'organic', grade: 'A', issuerName: 'FSSAI', details: 'Food safety and organic certification' },
  { productName: 'Fresh Nashik Onions', certType: 'quality', grade: 'A', issuerName: 'AGMARK', details: 'Grade A quality certified' },
];

export async function seedData() {
  // Check if already seeded
  if (store.get('products').length > 0) {
    console.log('Data already seeded, skipping...');
    return;
  }

  console.log('🌱 Seeding FarmChain AI demo data...');

  // Initialize blockchain
  await blockchain.initialize();

  // Store users
  store.set('users', USERS);

  // Register products on blockchain
  const registeredProducts = [];
  for (const product of PRODUCTS) {
    try {
      const result = await ProductRegistry.registerProduct(product);
      const productData = {
        ...product,
        productId: result.productId,
        status: 'available',
        createdAt: Date.now() - Math.random() * 30 * 86400000,
      };
      registeredProducts.push(productData);
    } catch (e) {
      console.warn('Failed to register product:', product.name, e);
    }
  }
  store.set('products', registeredProducts);

  // Create listings
  const listings = [];
  for (const product of registeredProducts) {
    try {
      const result = await Marketplace.createListing({
        productId: product.productId,
        sellerId: product.farmerId,
        sellerName: product.farmerName,
        sellerRole: 'farmer',
        productName: product.name,
        quantity: product.quantity,
        unit: product.unit,
        pricePerUnit: product.pricePerUnit,
      });
      listings.push({
        ...product,
        listingId: result.transaction.listingId,
        sellerRole: 'farmer',
      });
    } catch (e) {
      console.warn('Failed to create listing:', product.name, e);
    }
  }
  store.set('listings', listings);

  // Issue certificates
  const certs = [];
  for (const cert of CERTIFICATES) {
    const product = registeredProducts.find(p => p.name === cert.productName);
    if (product) {
      try {
        const result = await QualityCertification.issueCertificate({
          productId: product.productId,
          productName: cert.productName,
          issuerId: 'admin-001',
          issuerName: cert.issuerName,
          certType: cert.certType,
          grade: cert.grade,
          validUntil: Date.now() + 365 * 86400000,
          details: cert.details,
        });
        certs.push({
          ...cert,
          certId: result.transaction.certId,
          productId: product.productId,
          validUntil: Date.now() + 365 * 86400000,
        });
      } catch (e) {
        console.warn('Failed to issue certificate:', cert.productName, e);
      }
    }
  }
  store.set('certificates', certs);

  // Create some demo orders
  const demoOrders = [
    {
      productName: 'Fresh Nashik Onions',
      buyerId: 'intermediary-001',
      buyerName: 'AgriTraders Pvt Ltd',
      buyerRole: 'intermediary',
      quantity: 500,
      status: 'delivered',
    },
    {
      productName: 'Organic Basmati Rice',
      buyerId: 'retailer-001',
      buyerName: 'FreshMart Stores',
      buyerRole: 'retailer',
      quantity: 200,
      status: 'shipped',
    },
    {
      productName: 'Alphonso Mangoes',
      buyerId: 'intermediary-002',
      buyerName: 'GreenPath Distributors',
      buyerRole: 'intermediary',
      quantity: 100,
      status: 'accepted',
    },
  ];

  const orders = [];
  for (const orderData of demoOrders) {
    const product = registeredProducts.find(p => p.name === orderData.productName);
    if (product) {
      try {
        const result = await Marketplace.placeOrder({
          productId: product.productId,
          productName: product.name,
          buyerId: orderData.buyerId,
          buyerName: orderData.buyerName,
          buyerRole: orderData.buyerRole,
          sellerId: product.farmerId,
          sellerName: product.farmerName,
          quantity: orderData.quantity,
          unit: product.unit,
          totalAmount: orderData.quantity * product.pricePerUnit,
        });

        orders.push({
          ...orderData,
          orderId: result.transaction.orderId,
          productId: product.productId,
          sellerId: product.farmerId,
          sellerName: product.farmerName,
          unit: product.unit,
          pricePerUnit: product.pricePerUnit,
          totalAmount: orderData.quantity * product.pricePerUnit,
          createdAt: Date.now() - Math.random() * 15 * 86400000,
        });

        // Process payment for delivered orders
        if (orderData.status === 'delivered') {
          await PaymentSplitter.processPayment({
            orderId: result.transaction.orderId,
            productId: product.productId,
            totalAmount: orderData.quantity * product.pricePerUnit,
            farmerId: product.farmerId,
            intermediaryId: orderData.buyerRole === 'intermediary' ? orderData.buyerId : null,
            retailerId: orderData.buyerRole === 'retailer' ? orderData.buyerId : null,
          });
        }
      } catch (e) {
        console.warn('Failed to create order:', orderData.productName, e);
      }
    }
  }
  store.set('orders', orders);

  // Create ownership transfers for delivered orders
  const transfers = [];
  for (const order of orders.filter(o => o.status === 'delivered' || o.status === 'shipped')) {
    const product = registeredProducts.find(p => p.productId === order.productId);
    if (product) {
      try {
        const result = await OwnershipTransfer.initiateTransfer({
          productId: product.productId,
          productName: product.name,
          from: product.farmerId,
          fromName: product.farmerName,
          fromRole: 'farmer',
          to: order.buyerId,
          toName: order.buyerName,
          toRole: order.buyerRole,
          quantity: order.quantity,
          unit: product.unit,
          location: product.origin,
        });

        transfers.push({
          transferId: result.transaction.transferId,
          productId: product.productId,
          productName: product.name,
          from: product.farmerId,
          fromName: product.farmerName,
          to: order.buyerId,
          toName: order.buyerName,
          status: order.status === 'delivered' ? 'confirmed' : 'pending',
        });
      } catch (e) {
        console.warn('Failed to create transfer:', e);
      }
    }
  }
  store.set('transfers', transfers);

  console.log('✅ Seed data loaded successfully!');
  console.log(`   📦 ${registeredProducts.length} products registered`);
  console.log(`   📋 ${listings.length} listings created`);
  console.log(`   📑 ${certs.length} certificates issued`);
  console.log(`   🛍️ ${orders.length} demo orders created`);
  console.log(`   🔗 ${blockchain.getBlockCount()} blocks in chain`);
}
