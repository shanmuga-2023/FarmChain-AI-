// src/firebase/firestore.js
// Firestore CRUD and Real-time listener service

import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc
} from 'firebase/firestore';
import { db, isFirebaseReady } from './config.js';
import { store } from '../data/store.js';

// ==========================
// 1. Products Collection
// ==========================
export async function addFirestoreProduct(product) {
  if (!isFirebaseReady || !db) return product;

  try {
    const productRef = doc(collection(db, 'products'), product.productId);
    await setDoc(productRef, product);
    return product;
  } catch (error) {
    console.warn('Firestore addProduct error:', error);
    return product;
  }
}

export async function getFirestoreProducts() {
  if (!isFirebaseReady || !db) return [];

  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push(doc.data());
    });
    return products;
  } catch (error) {
    console.warn('Firestore getProducts error:', error);
    return [];
  }
}

export function subscribeToProducts(callback) {
  if (!isFirebaseReady || !db) return () => {};

  const q = query(collection(db, 'products'));
  return onSnapshot(q, (snapshot) => {
    const products = [];
    snapshot.forEach((doc) => {
      products.push(doc.data());
    });
    store.set('products', products);
    if (callback) callback(products);
  });
}

// ==========================
// 2. Orders Collection
// ==========================
export async function addFirestoreOrder(order) {
  if (!isFirebaseReady || !db) return order;

  try {
    const orderRef = doc(collection(db, 'orders'), order.orderId);
    await setDoc(orderRef, order);
    return order;
  } catch (error) {
    console.warn('Firestore addOrder error:', error);
    return order;
  }
}

export async function updateFirestoreOrderStatus(orderId, status) {
  if (!isFirebaseReady || !db) return;

  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status, updatedAt: Date.now() });
  } catch (error) {
    console.warn('Firestore updateOrderStatus error:', error);
  }
}

export function subscribeToOrders(callback) {
  if (!isFirebaseReady || !db) return () => {};

  const q = query(collection(db, 'orders'));
  return onSnapshot(q, (snapshot) => {
    const orders = [];
    snapshot.forEach((doc) => {
      orders.push(doc.data());
    });
    store.set('orders', orders);
    if (callback) callback(orders);
  });
}
