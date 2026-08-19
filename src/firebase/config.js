// src/firebase/config.js
// Firebase configuration module with environment/fallback support

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

import { getAnalytics, isSupported } from 'firebase/analytics';

// Default / Demo Firebase Config (can be overridden via localStorage or custom setup)
const storedConfig = localStorage.getItem('farmchain_firebase_config');
let customConfig = null;
if (storedConfig) {
  try {
    customConfig = JSON.parse(storedConfig);
  } catch (e) {
    console.warn('Failed to parse custom Firebase config:', e);
  }
}

export const firebaseConfig = customConfig || {
  apiKey: "AIzaSyDTdSIlJLs6_ihB26HBseo7mGuG3l36SDE",
  authDomain: "farmchainai.firebaseapp.com",
  projectId: "farmchainai",
  storageBucket: "farmchainai.firebasestorage.app",
  messagingSenderId: "844000232180",
  appId: "1:844000232180:web:e63282a51b20169cc554a1",
  measurementId: "G-5ZQ7J2V6CF"
};

let app;
let auth = null;
let db = null;
let analytics = null;
let googleProvider = null;
export let isFirebaseReady = false;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  isFirebaseReady = true;

  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    }).catch(() => {});
  }

  console.log("🔥 Firebase initialized successfully for farmchainai!");
} catch (error) {
  console.warn("⚠️ Firebase live connection pending config:", error.message);
}

export { app, auth, db, analytics, googleProvider };

export function saveCustomFirebaseConfig(config) {
  localStorage.setItem('farmchain_firebase_config', JSON.stringify(config));
  window.location.reload();
}
