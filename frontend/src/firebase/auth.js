// src/firebase/auth.js
// Firebase Authentication service supporting Email/Password, Google Sign-In, and custom session roles

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseReady } from './config.js';
import { store } from '../data/store.js';
import { postUser } from '../utils/api.js';

// Pre-seeded demo user fallback accounts
export const DEMO_CREDENTIALS = [
  // Primary credentials (matching README & documentation)
  { role: 'farmer', name: 'Rajesh Kumar', email: 'farmer@farmchain.io', password: 'farmer123', location: 'Nashik, Maharashtra', avatar: '👨‍🌾' },
  { role: 'intermediary', name: 'AgriTraders Pvt Ltd', email: 'trader@farmchain.io', password: 'trader123', location: 'Mumbai, Maharashtra', avatar: '🏢' },
  { role: 'retailer', name: 'FreshMart Stores', email: 'retailer@farmchain.io', password: 'retail123', location: 'Bangalore, Karnataka', avatar: '🛒' },
  { role: 'consumer', name: 'Priya Sharma', email: 'consumer@farmchain.io', password: 'consumer123', location: 'Bangalore, Karnataka', avatar: '👤' },
  { role: 'admin', name: 'System Admin', email: 'admin@farmchain.io', password: 'admin123', location: 'Platform HQ', avatar: '🔧' },

  // Secondary aliases
  { role: 'farmer', name: 'Rajesh Kumar', email: 'rajesh@farmchain.demo', password: 'farmer123', location: 'Nashik, Maharashtra', avatar: '👨‍🌾' },
  { role: 'farmer', name: 'Lakshmi Devi', email: 'lakshmi@farmchain.demo', password: 'farmer123', location: 'Thanjavur, Tamil Nadu', avatar: '👩‍🌾' },
  { role: 'intermediary', name: 'AgriTraders Pvt Ltd', email: 'agritraders@farmchain.demo', password: 'trader123', location: 'Mumbai, Maharashtra', avatar: '🏢' },
  { role: 'retailer', name: 'FreshMart Stores', email: 'freshmart@farmchain.demo', password: 'retail123', location: 'Bangalore, Karnataka', avatar: '🛒' },
  { role: 'consumer', name: 'Priya Sharma', email: 'priya@farmchain.demo', password: 'consumer123', location: 'Bangalore, Karnataka', avatar: '👤' },
  { role: 'admin', name: 'System Admin', email: 'admin@farmchain.demo', password: 'admin123', location: 'Platform HQ', avatar: '🔧' },
];

export async function registerWithEmail(email, password, displayName, role, location, walletAddress = '') {
  try {
    if (!isFirebaseReady || !auth) {
      // Local simulated fallback
      const user = {
        id: `user-${Date.now()}`,
        name: displayName,
        email,
        role,
        location,
        walletAddress,
        createdAt: Date.now(),
      };
      store.login(role, user.id, user);
      return { user };
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    await updateProfile(firebaseUser, { displayName });

    const userProfile = {
      id: firebaseUser.uid,
      name: displayName,
      email,
      role: role.toLowerCase(),
      location: location || 'India',
      walletAddress: walletAddress || '',
      avatar: getRoleAvatar(role),
      createdAt: Date.now(),
      verified: true,
    };

    if (db) {
      await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);
    }

    // Asynchronously sync to backend DB
    postUser(userProfile).catch(() => {});

    store.login(role.toLowerCase(), firebaseUser.uid, userProfile);
    return { user: userProfile, firebaseUser };
  } catch (error) {
    console.warn('Firebase registration error:', error);
    
    // If email already in use, check if it's a demo account or existing local account
    if (error.code === 'auth/email-already-in-use') {
      const demoMatch = DEMO_CREDENTIALS.find(d => d.email.toLowerCase() === email.toLowerCase());
      if (demoMatch) {
        console.info(`Demo email ${email} is already in Firebase; logging in as ${demoMatch.role}`);
        const userProfile = {
          id: `${demoMatch.role}-001`,
          name: displayName || demoMatch.name,
          email,
          role: (role || demoMatch.role).toLowerCase(),
          location: location || demoMatch.location || 'India',
          walletAddress: walletAddress || '',
          avatar: getRoleAvatar(role || demoMatch.role),
          createdAt: Date.now(),
          verified: true,
        };
        store.login(userProfile.role, userProfile.id, userProfile);
        return { user: userProfile, isFallback: true };
      }

      const localUsers = store.get('users') || [];
      const localUser = localUsers.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
      if (localUser) {
        store.login(localUser.role || role || 'farmer', localUser.id, localUser);
        return { user: localUser, isFallback: true };
      }
    }

    if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/configuration-not-found') {
      console.info('Firebase Email/Password provider is disabled in Firebase Console. Falling back to local profile.');
      const user = {
        id: `user-${Date.now()}`,
        name: displayName,
        email,
        role: role.toLowerCase(),
        location: location || 'India',
        walletAddress: walletAddress || '',
        avatar: getRoleAvatar(role),
        createdAt: Date.now(),
        verified: true,
      };
      store.login(role.toLowerCase(), user.id, user);
      return { user, isFallback: true };
    }
    throw error;
  }
}

export async function loginWithEmail(email, password) {
  // Check demo credentials first for fast login
  const demoMatch = DEMO_CREDENTIALS.find(d => d.email.toLowerCase() === email.toLowerCase());
  if (demoMatch && (demoMatch.password === password || password === 'farmer123' || password === 'trader123' || password === 'retail123' || password === 'consumer123' || password === 'admin123' || password === 'demo123')) {
    let demoUserId = `${demoMatch.role}-001`;
    if (demoMatch.name === 'Lakshmi Devi') demoUserId = 'farmer-002';
    else if (demoMatch.name === 'Arjun Singh') demoUserId = 'farmer-003';
    else if (demoMatch.name === 'GreenPath Distributors') demoUserId = 'intermediary-002';
    else if (demoMatch.name === "Nature's Basket") demoUserId = 'retailer-002';

    const demoUser = {
      id: demoUserId,
      name: demoMatch.name,
      email: demoMatch.email,
      role: demoMatch.role,
      location: demoMatch.location,
      avatar: demoMatch.avatar,
      verified: true,
    };
    store.login(demoMatch.role, demoUser.id, demoUser);
    return { user: demoUser };
  }

  try {
    if (!isFirebaseReady || !auth) {
      throw new Error("Firebase Auth is offline. Please use pre-seeded demo accounts or check config.");
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    let userProfile = null;
    if (db) {
      const docSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (docSnap.exists()) {
        userProfile = docSnap.data();
      }
    }

    if (!userProfile) {
      userProfile = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || email.split('@')[0],
        email: firebaseUser.email,
        role: 'consumer',
        location: 'India',
        avatar: '👤',
      };
    }

    store.login(userProfile.role, userProfile.id, userProfile);
    return { user: userProfile, firebaseUser };
  } catch (error) {
    console.warn('Firebase login error:', error);
    
    // Auto-recovery for demo credentials if password mismatched or invalid-credential returned
    if (demoMatch) {
      console.info(`Auto-recovering demo login for ${email}`);
      const demoUserId = `${demoMatch.role}-001`;
      const demoUser = {
        id: demoUserId,
        name: demoMatch.name,
        email: demoMatch.email,
        role: demoMatch.role,
        location: demoMatch.location,
        avatar: demoMatch.avatar,
        verified: true,
      };
      store.login(demoMatch.role, demoUser.id, demoUser);
      return { user: demoUser, isFallback: true };
    }

    // Check if user exists in local store
    const localUsers = store.get('users') || [];
    const localUser = localUsers.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (localUser) {
      console.info(`Logging in with local profile for ${email}`);
      store.login(localUser.role || 'farmer', localUser.id, localUser);
      return { user: localUser, isFallback: true };
    }

    if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/configuration-not-found') {
      console.info('Firebase Email/Password provider is disabled in Firebase Console. Falling back to local profile.');
      const user = {
        id: `user-${Date.now()}`,
        name: email.split('@')[0],
        email,
        role: 'farmer',
        location: 'India',
        avatar: '👨‍🌾',
        verified: true,
      };
      store.login(user.role, user.id, user);
      return { user, isFallback: true };
    }
    throw error;
  }
}

export async function loginWithGoogle(desiredRole = 'consumer') {
  try {
    if (!isFirebaseReady || !auth) {
      throw new Error("Firebase Google Sign-In requires active Firebase credentials.");
    }

    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;

    let userProfile = null;
    if (db) {
      const docSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (docSnap.exists()) {
        userProfile = docSnap.data();
      }
    }

    if (!userProfile) {
      userProfile = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        role: desiredRole.toLowerCase(),
        location: 'India',
        avatar: firebaseUser.photoURL || '👤',
        createdAt: Date.now(),
      };
      if (db) {
        await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);
      }
    }

    store.login(userProfile.role, userProfile.id, userProfile);
    return { user: userProfile, firebaseUser };
  } catch (error) {
    console.error('Google Sign-In error:', error);
    throw error;
  }
}

// ==========================================
// Phone OTP Authentication (Real Firebase SMS)
// ==========================================

let _appVerifier = null;

/**
 * Normalize and validate Indian mobile phone numbers to E.164 format (+91XXXXXXXXXX)
 * @param {string} input - Raw input phone number
 * @returns {string|null} E.164 formatted string or null if invalid
 */
export function normalizeIndianPhone(input) {
  if (!input || typeof input !== 'string') return null;
  const cleaned = input.trim().replace(/[\s\-\(\)]/g, '');

  if (cleaned.startsWith('+91')) {
    const rest = cleaned.slice(3).replace(/^0+/, '');
    if (/^[6-9]\d{9}$/.test(rest) || /^\d{10}$/.test(rest)) return `+91${rest}`;
    return null;
  }
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    const rest = cleaned.slice(2);
    if (/^[6-9]\d{9}$/.test(rest) || /^\d{10}$/.test(rest)) return `+91${rest}`;
    return null;
  }
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    const rest = cleaned.slice(1);
    if (/^[6-9]\d{9}$/.test(rest) || /^\d{10}$/.test(rest)) return `+91${rest}`;
    return null;
  }
  if (/^[6-9]\d{9}$/.test(cleaned) || /^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  return null;
}

/**
 * Map Firebase error codes to clear, user-friendly messages
 * @param {Error|{code: string, message: string}} error 
 * @returns {string} User-friendly message
 */
export function getFriendlyAuthErrorMessage(error) {
  if (!error) return 'An error occurred during authentication.';
  const code = (error.code || '').toLowerCase();
  const message = (error.message || '').toLowerCase();

  if (code.includes('billing-not-enabled') || message.includes('billing-not-enabled')) {
    return 'Firebase SMS verification is not enabled for this project. Please enable billing for the Firebase project in Google Cloud / Firebase Console.';
  }
  if (code.includes('invalid-phone-number') || message.includes('invalid-phone-number')) {
    return 'Please enter a valid phone number.';
  }
  if (code.includes('missing-phone-number') || message.includes('missing-phone-number')) {
    return 'Please enter your phone number.';
  }
  if (code.includes('too-many-requests') || message.includes('too-many-requests')) {
    return 'Too many attempts. Please try again later.';
  }
  if (code.includes('quota-exceeded') || message.includes('quota-exceeded')) {
    return 'SMS quota exceeded for this project. Please try again later.';
  }
  if (code.includes('captcha-check-failed') || message.includes('captcha-check-failed')) {
    return 'reCAPTCHA verification failed. Please try again.';
  }
  if (code.includes('invalid-verification-code') || message.includes('invalid-verification-code')) {
    return 'Invalid OTP. Please check the SMS and try again.';
  }
  if (code.includes('code-expired') || message.includes('code-expired')) {
    return 'OTP expired. Please request a new OTP.';
  }
  if (code.includes('network-request-failed') || message.includes('network-request-failed')) {
    return 'Network connection error. Please check your internet connection.';
  }
  if (code.includes('app-not-authorized') || code.includes('unauthorized-domain') || message.includes('unauthorized-domain')) {
    return 'This domain is not authorized in Firebase Console → Authentication → Settings → Authorized domains.';
  }
  if (code.includes('operation-not-allowed') || message.includes('operation-not-allowed')) {
    return 'Phone authentication is disabled in Firebase Console. Please enable Phone provider in Authentication → Sign-in method.';
  }
  if (code.includes('invalid-app-credential') || message.includes('invalid-app-credential')) {
    return 'Invalid app credential. Please check reCAPTCHA configuration in Firebase Console.';
  }

  return error.message || 'Authentication failed. Please try again.';
}

/**
 * Safely clean up any existing reCAPTCHA instance to avoid duplicates
 */
export function clearRecaptchaVerifier(containerId = 'recaptcha-container') {
  if (_appVerifier) {
    try {
      _appVerifier.clear();
    } catch (e) {
      console.warn('Error clearing _appVerifier:', e);
    }
    _appVerifier = null;
  }
  if (typeof window !== 'undefined' && window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {
      // Ignored
    }
    window.recaptchaVerifier = null;
  }

  if (typeof document !== 'undefined') {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
    }
  }
}

/**
 * Get or create a reCAPTCHA verifier instance
 * @param {string} containerId - Element ID for reCAPTCHA widget
 * @returns {RecaptchaVerifier}
 */
export function getRecaptchaVerifier(containerId = 'recaptcha-container') {
  if (!isFirebaseReady || !auth) {
    throw new Error('Firebase Authentication is not ready. Please check Firebase configuration.');
  }

  // Clear previous instance to avoid "reCAPTCHA already rendered" error
  clearRecaptchaVerifier(containerId);

  _appVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved automatically
    },
    'expired-callback': () => {
      console.warn('⚠️ reCAPTCHA expired, resetting verifier...');
      clearRecaptchaVerifier(containerId);
    },
  });

  if (typeof window !== 'undefined') {
    window.recaptchaVerifier = _appVerifier;
  }

  return _appVerifier;
}

/**
 * Send real SMS OTP via Firebase Authentication
 * The OTP is NEVER generated, displayed, logged, or returned here.
 * It is dispatched directly by Firebase SMS to the user's mobile device.
 * @param {string} rawPhone - 10-digit Indian phone number or E.164 number
 * @param {string} containerId - reCAPTCHA container ID
 * @returns {Promise<{confirmationResult: import('firebase/auth').ConfirmationResult, phone: string}>}
 */
export async function sendPhoneOtp(rawPhone, containerId = 'recaptcha-container') {
  const e164Phone = normalizeIndianPhone(rawPhone);
  if (!e164Phone) {
    const err = new Error('Invalid phone number. Please enter a valid 10-digit Indian mobile number.');
    err.code = 'auth/invalid-phone-number';
    throw err;
  }

  if (!isFirebaseReady || !auth) {
    throw new Error('Firebase Authentication is offline or not configured.');
  }

  const verifier = getRecaptchaVerifier(containerId);

  try {
    const confirmationResult = await signInWithPhoneNumber(auth, e164Phone, verifier);
    return {
      confirmationResult,
      phone: e164Phone,
    };
  } catch (error) {
    clearRecaptchaVerifier(containerId);
    throw error;
  }
}

/**
 * Verify user-entered SMS OTP with Firebase Authentication
 * Purely verifies through Firebase ConfirmationResult.confirm(otp).
 * Never compares against or generates any local/mock OTP.
 * @param {import('firebase/auth').ConfirmationResult} confirmationResult
 * @param {string} otpCode - 6-digit code entered by user
 * @returns {Promise<{firebaseUser: import('firebase/auth').User, idToken: string, phone: string, uid: string}>}
 */
export async function verifyPhoneOtp(confirmationResult, otpCode) {
  if (!confirmationResult || typeof confirmationResult.confirm !== 'function') {
    throw new Error('No active SMS verification session. Please request a new OTP.');
  }

  const cleanOtp = (otpCode || '').trim();
  if (!cleanOtp || cleanOtp.length !== 6) {
    const err = new Error('Please enter the complete 6-digit OTP code received on your mobile phone.');
    err.code = 'auth/invalid-verification-code';
    throw err;
  }

  const credential = await confirmationResult.confirm(cleanOtp);
  const firebaseUser = credential.user;
  const idToken = await firebaseUser.getIdToken();

  return {
    firebaseUser,
    idToken,
    phone: firebaseUser.phoneNumber,
    uid: firebaseUser.uid,
  };
}

export async function logoutUser() {
  if (auth && isFirebaseReady) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out error:', e);
    }
  }
  clearRecaptchaVerifier();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('farmchain_gasless');
  }
  store.logout();
}

function getRoleAvatar(role) {
  const map = {
    farmer: '👨‍🌾',
    intermediary: '🏢',
    retailer: '🛒',
    consumer: '👤',
    admin: '🔧',
  };
  return map[role.toLowerCase()] || '👤';
}

