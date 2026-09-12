// src/firebase/auth.js
// Firebase Authentication service supporting Email/Password, Google Sign-In, and custom session roles

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseReady } from './config.js';
import { store } from '../data/store.js';

// Pre-seeded demo user fallback accounts
export const DEMO_CREDENTIALS = [
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

    store.login(role.toLowerCase(), firebaseUser.uid, userProfile);
    return { user: userProfile, firebaseUser };
  } catch (error) {
    console.warn('Firebase registration error:', error);
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
  const demoMatch = DEMO_CREDENTIALS.find(d => d.email.toLowerCase() === email.toLowerCase() && d.password === password);
  if (demoMatch) {
    const demoUser = {
      id: `demo-${demoMatch.role}-001`,
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

export async function logoutUser() {
  if (auth && isFirebaseReady) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out error:', e);
    }
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
