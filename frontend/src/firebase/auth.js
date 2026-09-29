// src/firebase/auth.js
// FarmChain - Firebase Authentication Service
// Supports:
// - Demo/local accounts
// - Firebase Email/Password
// - Google Sign-In
// - Firebase Phone OTP
// - Firestore user profiles
// - Local fallback for offline/demo operation

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

import {
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';

import {
  auth,
  db,
  googleProvider,
  isFirebaseReady
} from './config.js';

import { store } from '../data/store.js';
import { postUser } from '../utils/api.js';


// ============================================================
// DEMO ACCOUNTS
// ============================================================

export const DEMO_CREDENTIALS = [
  {
    role: 'farmer',
    name: 'Rajesh Kumar',
    email: 'farmer@farmchain.io',
    password: 'farmer123',
    location: 'Nashik, Maharashtra',
    avatar: ''
  },

  {
    role: 'intermediary',
    name: 'AgriTraders Pvt Ltd',
    email: 'trader@farmchain.io',
    password: 'trader123',
    location: 'Mumbai, Maharashtra',
    avatar: ''
  },

  {
    role: 'retailer',
    name: 'FreshMart Stores',
    email: 'retailer@farmchain.io',
    password: 'retail123',
    location: 'Bangalore, Karnataka',
    avatar: ''
  },

  {
    role: 'consumer',
    name: 'Priya Sharma',
    email: 'consumer@farmchain.io',
    password: 'consumer123',
    location: 'Bangalore, Karnataka',
    avatar: ''
  },

  {
    role: 'admin',
    name: 'System Admin',
    email: 'admin@farmchain.io',
    password: 'admin123',
    location: 'Platform HQ',
    avatar: ''
  },

  // Secondary demo accounts

  {
    role: 'farmer',
    name: 'Rajesh Kumar',
    email: 'rajesh@farmchain.demo',
    password: 'farmer123',
    location: 'Nashik, Maharashtra',
    avatar: ''
  },

  {
    role: 'farmer',
    name: 'Lakshmi Devi',
    email: 'lakshmi@farmchain.demo',
    password: 'farmer123',
    location: 'Thanjavur, Tamil Nadu',
    avatar: ''
  },

  {
    role: 'intermediary',
    name: 'AgriTraders Pvt Ltd',
    email: 'agritraders@farmchain.demo',
    password: 'trader123',
    location: 'Mumbai, Maharashtra',
    avatar: ''
  },

  {
    role: 'retailer',
    name: 'FreshMart Stores',
    email: 'freshmart@farmchain.demo',
    password: 'retail123',
    location: 'Bangalore, Karnataka',
    avatar: ''
  },

  {
    role: 'consumer',
    name: 'Priya Sharma',
    email: 'priya@farmchain.demo',
    password: 'consumer123',
    location: 'Bangalore, Karnataka',
    avatar: ''
  },

  {
    role: 'admin',
    name: 'System Admin',
    email: 'admin@farmchain.demo',
    password: 'admin123',
    location: 'Platform HQ',
    avatar: ''
  }
];


// ============================================================
// HELPERS
// ============================================================

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}


function getDemoUserId(demoMatch) {
  if (demoMatch.name === 'Lakshmi Devi') {
    return 'farmer-002';
  }

  if (demoMatch.name === 'Arjun Singh') {
    return 'farmer-003';
  }

  if (demoMatch.name === 'GreenPath Distributors') {
    return 'intermediary-002';
  }

  if (demoMatch.name === "Nature's Basket") {
    return 'retailer-002';
  }

  return `${demoMatch.role}-001`;
}


function createDemoUser(demoMatch) {
  return {
    id: getDemoUserId(demoMatch),
    name: demoMatch.name,
    email: demoMatch.email,
    role: demoMatch.role,
    location: demoMatch.location,
    avatar: demoMatch.avatar,
    verified: true,
    isDemo: true
  };
}


function getFirebaseErrorMessage(error) {
  if (!error) {
    return 'Authentication failed. Please try again.';
  }

  const code = String(error.code || '').toLowerCase();

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Invalid email or password. Please check your credentials.';

    case 'auth/user-not-found':
      return 'No account exists with this email address.';

    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';

    case 'auth/user-disabled':
      return 'This account has been disabled.';

    case 'auth/too-many-requests':
      return 'Too many login attempts. Please try again later.';

    case 'auth/operation-not-allowed':
      return 'Email/password authentication is disabled in Firebase Console.';

    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';

    case 'auth/configuration-not-found':
      return 'Firebase Authentication is not configured correctly.';

    case 'auth/invalid-email':
      return 'Please enter a valid email address.';

    default:
      return error.message || 'Authentication failed. Please try again.';
  }
}


const ACCOUNTS_STORAGE_KEY = 'farmchain_registered_accounts';

export function getRegisteredAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveRegisteredAccount(account) {
  try {
    const accounts = getRegisteredAccounts();
    const key = normalizeEmail(account.email);
    accounts[key] = {
      ...(accounts[key] || {}),
      ...account,
      email: key,
      updatedAt: Date.now()
    };
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.warn('Failed to save registered account to localStorage:', e);
  }
}


// ============================================================
// REGISTER WITH EMAIL
// ============================================================

export async function registerWithEmail(
  email,
  password,
  displayName,
  role,
  location,
  walletAddress = ''
) {
  const normalizedEmail = normalizeEmail(email);
  const targetRole = String(role || 'farmer').toLowerCase();

  const userProfile = {
    id: `user-${Date.now()}`,
    name: displayName || normalizedEmail.split('@')[0],
    email: normalizedEmail,
    role: targetRole,
    location: location || 'India',
    walletAddress: walletAddress || '',
    avatar: getRoleAvatar(targetRole),
    createdAt: Date.now(),
    verified: true
  };

  // 1. Immediately persist credentials locally so account is NEVER lost
  saveRegisteredAccount({
    ...userProfile,
    password
  });

  // 2. Set current session in reactive store
  store.login(targetRole, userProfile.id, userProfile);

  // 3. Post to backend
  postUser(userProfile).catch(() => {});

  // 4. If Firebase is active, synchronize to Firebase Auth and Firestore
  if (isFirebaseReady && auth) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

      const firebaseUser = userCredential.user;
      userProfile.id = firebaseUser.uid;

      // Update local storage with real Firebase UID
      saveRegisteredAccount({
        ...userProfile,
        id: firebaseUser.uid,
        password
      });

      await updateProfile(firebaseUser, {
        displayName: displayName || userProfile.name
      }).catch(() => {});

      if (db) {
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);
        } catch (dbError) {
          console.warn('Firestore profile save skipped:', dbError.message);
        }
      }

      store.login(targetRole, firebaseUser.uid, userProfile);

      return {
        user: userProfile,
        firebaseUser
      };
    } catch (firebaseErr) {
      console.warn('Firebase registration error, fallback local account active:', firebaseErr.code, firebaseErr.message);

      if (firebaseErr.code === 'auth/email-already-in-use') {
        const demoMatch = DEMO_CREDENTIALS.find(d => d.email.toLowerCase() === normalizedEmail);
        if (demoMatch) {
          const demoUser = createDemoUser(demoMatch);
          store.login(demoUser.role, demoUser.id, demoUser);
          return { user: demoUser, isFallback: true };
        }
      }

      return {
        user: userProfile,
        isFallback: true
      };
    }
  }

  return {
    user: userProfile,
    isFallback: true
  };
}


// ============================================================
// LOGIN WITH EMAIL
// ============================================================

export async function loginWithEmail(email, password, desiredRole = null) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    const error = new Error('Email and password are required.');
    error.code = 'auth/missing-login-fields';
    throw error;
  }

  // ==========================================================
  // 1. CHECK DEMO ACCOUNT FIRST
  // ==========================================================
  const demoMatch = DEMO_CREDENTIALS.find(
    demo => demo.email.toLowerCase() === normalizedEmail
  );

  if (demoMatch) {
    if (demoMatch.password !== password) {
      const error = new Error('Incorrect demo account password.');
      error.code = 'auth/wrong-password';
      throw error;
    }

    const demoUser = createDemoUser(demoMatch);
    store.login(demoUser.role, demoUser.id, demoUser);
    console.info(`Demo login successful: ${normalizedEmail}`);
    return { user: demoUser, isFallback: true };
  }

  // Check persistent registered accounts
  const registeredAccounts = getRegisteredAccounts();
  const savedAccount = registeredAccounts[normalizedEmail];

  // ==========================================================
  // 2. ATTEMPT REAL FIREBASE ACCOUNT IF READY
  // ==========================================================
  if (isFirebaseReady && auth) {
    try {
      console.info(`Firebase login attempt: ${normalizedEmail}`);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );
      const firebaseUser = userCredential.user;

      // 3. LOAD FIRESTORE PROFILE
      let userProfile = null;
      if (db) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            userProfile = docSnap.data();
          }
        } catch (dbError) {
          console.warn('Firestore profile unavailable:', dbError.message);
        }
      }

      // 4. RESTORE PROFILE FROM LOCAL REGISTERED ACCOUNTS OR DESIRED ROLE
      // NEVER blindly default to 'farmer'
      if (!userProfile) {
        const resolvedRole = savedAccount?.role || (desiredRole ? String(desiredRole).toLowerCase() : 'farmer');
        userProfile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || savedAccount?.name || normalizedEmail.split('@')[0],
          email: firebaseUser.email || normalizedEmail,
          role: resolvedRole,
          location: savedAccount?.location || 'India',
          walletAddress: savedAccount?.walletAddress || '',
          avatar: savedAccount?.avatar || getRoleAvatar(resolvedRole),
          verified: firebaseUser.emailVerified ?? true
        };

        if (db) {
          setDoc(doc(db, 'users', firebaseUser.uid), userProfile).catch(() => {});
        }
      }

      // Update registered accounts cache with password
      saveRegisteredAccount({
        ...userProfile,
        password
      });

      // Sync with backend
      postUser(userProfile).catch(() => {});

      // 5. STORE SESSION
      store.login(userProfile.role, userProfile.id, userProfile);
      console.info(`Firebase login successful: ${normalizedEmail} (Role: ${userProfile.role})`);

      return {
        user: userProfile,
        firebaseUser
      };
    } catch (firebaseError) {
      console.warn('Firebase login failed:', firebaseError.code, firebaseError.message);

      // Check if local registered account can authenticate
      if (savedAccount) {
        if (savedAccount.password && savedAccount.password !== password) {
          const error = new Error('Incorrect password. Please try again.');
          error.code = 'auth/wrong-password';
          throw error;
        }

        const role = savedAccount.role || (desiredRole ? String(desiredRole).toLowerCase() : 'farmer');
        const user = {
          ...savedAccount,
          role,
          id: savedAccount.id || `user-${Date.now()}`
        };
        store.login(role, user.id, user);
        console.info(`Local registered account login successful: ${normalizedEmail} (Role: ${role})`);
        return { user, isFallback: true };
      }

      // Check store users fallback
      const rawUsers = store.get('users') || {};
      const usersList = Array.isArray(rawUsers) ? rawUsers : Object.values(rawUsers);
      const localUser = usersList.find(u => u && u.email && u.email.toLowerCase() === normalizedEmail);
      if (localUser) {
        const role = localUser.role || desiredRole || 'farmer';
        store.login(role, localUser.id, localUser);
        return { user: localUser, isFallback: true };
      }

      // Rethrow friendly error
      const friendlyError = new Error(getFirebaseErrorMessage(firebaseError));
      friendlyError.code = firebaseError.code || 'auth/login-failed';
      friendlyError.originalError = firebaseError;
      throw friendlyError;
    }
  }

  // ==========================================================
  // 3. FIREBASE NOT READY -> LOCAL LOGIN
  // ==========================================================
  if (savedAccount) {
    if (savedAccount.password && savedAccount.password !== password) {
      const error = new Error('Incorrect password. Please try again.');
      error.code = 'auth/wrong-password';
      throw error;
    }

    const role = savedAccount.role || (desiredRole ? String(desiredRole).toLowerCase() : 'farmer');
    const user = { ...savedAccount, role };
    store.login(role, user.id, user);
    return { user, isFallback: true };
  }

  // Check store users fallback
  const rawUsers = store.get('users') || {};
  const usersList = Array.isArray(rawUsers) ? rawUsers : Object.values(rawUsers);
  const localUser = usersList.find(u => u && u.email && u.email.toLowerCase() === normalizedEmail);
  if (localUser) {
    store.login(localUser.role || desiredRole || 'farmer', localUser.id, localUser);
    return { user: localUser, isFallback: true };
  }

  const err = new Error('No account found with this email. Please check your credentials or create a new account.');
  err.code = 'auth/user-not-found';
  throw err;
}


// ============================================================
// GOOGLE LOGIN
// ============================================================

export async function loginWithGoogle(
  desiredRole = 'consumer'
) {

  try {

    if (!isFirebaseReady || !auth) {
      throw new Error(
        'Firebase Google Sign-In requires active Firebase credentials.'
      );
    }


    const result =
      await signInWithPopup(
        auth,
        googleProvider
      );


    const firebaseUser =
      result.user;


    let userProfile = null;


    if (db) {

      try {

        const docSnap =
          await getDoc(
            doc(
              db,
              'users',
              firebaseUser.uid
            )
          );


        if (docSnap.exists()) {
          userProfile = docSnap.data();
        }

      } catch (dbError) {

        console.warn(
          'Firestore profile unavailable:',
          dbError.message
        );
      }
    }


    if (!userProfile) {

      userProfile = {

        id: firebaseUser.uid,

        name:
          firebaseUser.displayName ||
          'FarmChain User',

        email:
          firebaseUser.email || '',

        role:
          String(desiredRole || 'consumer')
            .toLowerCase(),

        location: 'India',

        avatar:
          firebaseUser.photoURL ||
          '',

        createdAt: Date.now(),

        verified: true
      };


      if (db) {

        try {

          await setDoc(
            doc(
              db,
              'users',
              firebaseUser.uid
            ),
            userProfile,
            { merge: true }
          );

        } catch (dbError) {

          console.warn(
            'Firestore profile save skipped:',
            dbError.message
          );
        }
      }
    }


    store.login(
      userProfile.role,
      userProfile.id,
      userProfile
    );


    return {
      user: userProfile,
      firebaseUser
    };


  } catch (error) {

    console.error(
      'Google Sign-In error:',
      error.code,
      error.message
    );

    throw error;
  }
}


// ============================================================
// PHONE OTP AUTHENTICATION
// ============================================================

let _appVerifier = null;


// ============================================================
// NORMALIZE INDIAN PHONE NUMBER
// ============================================================

export function normalizeIndianPhone(input) {

  if (
    !input ||
    typeof input !== 'string'
  ) {
    return null;
  }


  const cleaned =
    input
      .trim()
      .replace(/[\s\-\(\)]/g, '');


  if (cleaned.startsWith('+91')) {

    const rest =
      cleaned
        .slice(3)
        .replace(/^0+/, '');


    if (
      /^[6-9]\d{9}$/.test(rest) ||
      /^\d{10}$/.test(rest)
    ) {
      return `+91${rest}`;
    }

    return null;
  }


  if (
    cleaned.startsWith('91') &&
    cleaned.length === 12
  ) {

    const rest =
      cleaned.slice(2);


    if (
      /^[6-9]\d{9}$/.test(rest) ||
      /^\d{10}$/.test(rest)
    ) {
      return `+91${rest}`;
    }

    return null;
  }


  if (
    cleaned.startsWith('0') &&
    cleaned.length === 11
  ) {

    const rest =
      cleaned.slice(1);


    if (
      /^[6-9]\d{9}$/.test(rest) ||
      /^\d{10}$/.test(rest)
    ) {
      return `+91${rest}`;
    }

    return null;
  }


  if (
    /^[6-9]\d{9}$/.test(cleaned) ||
    /^\d{10}$/.test(cleaned)
  ) {
    return `+91${cleaned}`;
  }


  return null;
}


// ============================================================
// FRIENDLY AUTH ERROR
// ============================================================

export function getFriendlyAuthErrorMessage(error) {

  if (!error) {
    return 'An error occurred during authentication.';
  }


  const code =
    String(error.code || '')
      .toLowerCase();


  const message =
    String(error.message || '')
      .toLowerCase();


  if (
    code.includes('billing-not-enabled') ||
    message.includes('billing-not-enabled')
  ) {
    return 'Firebase SMS verification is not enabled for this project. Please enable billing in Firebase Console.';
  }


  if (
    code.includes('invalid-phone-number') ||
    message.includes('invalid-phone-number')
  ) {
    return 'Please enter a valid phone number.';
  }


  if (
    code.includes('missing-phone-number') ||
    message.includes('missing-phone-number')
  ) {
    return 'Please enter your phone number.';
  }


  if (
    code.includes('too-many-requests') ||
    message.includes('too-many-requests')
  ) {
    return 'Too many attempts. Please try again later.';
  }


  if (
    code.includes('quota-exceeded') ||
    message.includes('quota-exceeded')
  ) {
    return 'SMS quota exceeded for this project. Please try again later.';
  }


  if (
    code.includes('captcha-check-failed') ||
    message.includes('captcha-check-failed')
  ) {
    return 'reCAPTCHA verification failed. Please try again.';
  }


  if (
    code.includes('invalid-verification-code') ||
    message.includes('invalid-verification-code')
  ) {
    return 'Invalid OTP. Please check the SMS and try again.';
  }


  if (
    code.includes('code-expired') ||
    message.includes('code-expired')
  ) {
    return 'OTP expired. Please request a new OTP.';
  }


  if (
    code.includes('network-request-failed') ||
    message.includes('network-request-failed')
  ) {
    return 'Network connection error. Please check your internet connection.';
  }


  if (
    code.includes('app-not-authorized') ||
    code.includes('unauthorized-domain') ||
    message.includes('unauthorized-domain')
  ) {
    return 'This domain is not authorized in Firebase Console → Authentication → Settings → Authorized domains.';
  }


  if (
    code.includes('operation-not-allowed') ||
    message.includes('operation-not-allowed')
  ) {
    return 'This authentication provider is disabled in Firebase Console.';
  }


  if (
    code.includes('invalid-app-credential') ||
    message.includes('invalid-app-credential')
  ) {
    return 'Invalid app credential. Please check the reCAPTCHA configuration.';
  }


  if (
    code.includes('invalid-credential')
  ) {
    return 'Invalid login credentials. Please check your email and password.';
  }


  return (
    error.message ||
    'Authentication failed. Please try again.'
  );
}


// ============================================================
// RECAPTCHA CLEANUP
// ============================================================

export function clearRecaptchaVerifier(
  containerId = 'recaptcha-container'
) {

  if (_appVerifier) {

    try {
      _appVerifier.clear();
    } catch (error) {
      console.warn(
        'Error clearing _appVerifier:',
        error
      );
    }

    _appVerifier = null;
  }


  if (
    typeof window !== 'undefined' &&
    window.recaptchaVerifier
  ) {

    try {
      window.recaptchaVerifier.clear();
    } catch {
      // Ignore cleanup errors
    }

    window.recaptchaVerifier = null;
  }


  if (
    typeof document !== 'undefined'
  ) {

    const container =
      document.getElementById(
        containerId
      );


    if (container) {
      container.innerHTML = '';
    }
  }
}


// ============================================================
// GET / CREATE RECAPTCHA
// ============================================================

export function getRecaptchaVerifier(
  containerId = 'recaptcha-container'
) {

  if (
    !isFirebaseReady ||
    !auth
  ) {
    throw new Error(
      'Firebase Authentication is not ready. Please check Firebase configuration.'
    );
  }


  clearRecaptchaVerifier(
    containerId
  );


  _appVerifier =
    new RecaptchaVerifier(
      auth,
      containerId,
      {
        size: 'invisible',

        callback: () => {
          // reCAPTCHA solved
        },

        'expired-callback': () => {

          console.warn(
            'reCAPTCHA expired. Resetting verifier.'
          );

          clearRecaptchaVerifier(
            containerId
          );
        }
      }
    );


  if (
    typeof window !== 'undefined'
  ) {
    window.recaptchaVerifier =
      _appVerifier;
  }


  return _appVerifier;
}


// ============================================================
// SEND PHONE OTP
// ============================================================

export async function sendPhoneOtp(
  rawPhone,
  containerId = 'recaptcha-container'
) {

  const e164Phone =
    normalizeIndianPhone(
      rawPhone
    );


  if (!e164Phone) {

    const error =
      new Error(
        'Invalid phone number. Please enter a valid 10-digit Indian mobile number.'
      );

    error.code =
      'auth/invalid-phone-number';

    throw error;
  }


  if (
    !isFirebaseReady ||
    !auth
  ) {

    throw new Error(
      'Firebase Authentication is offline or not configured.'
    );
  }


  const verifier =
    getRecaptchaVerifier(
      containerId
    );


  try {

    const confirmationResult =
      await signInWithPhoneNumber(
        auth,
        e164Phone,
        verifier
      );


    return {
      confirmationResult,
      phone: e164Phone
    };

  } catch (error) {

    clearRecaptchaVerifier(
      containerId
    );

    throw error;
  }
}


// ============================================================
// VERIFY PHONE OTP
// ============================================================

export async function verifyPhoneOtp(
  confirmationResult,
  otpCode
) {

  if (
    !confirmationResult ||
    typeof confirmationResult.confirm !== 'function'
  ) {

    throw new Error(
      'No active SMS verification session. Please request a new OTP.'
    );
  }


  const cleanOtp =
    String(otpCode || '').trim();


  if (
    !cleanOtp ||
    cleanOtp.length !== 6
  ) {

    const error =
      new Error(
        'Please enter the complete 6-digit OTP code received on your mobile phone.'
      );

    error.code =
      'auth/invalid-verification-code';

    throw error;
  }


  const credential =
    await confirmationResult.confirm(
      cleanOtp
    );


  const firebaseUser =
    credential.user;


  const idToken =
    await firebaseUser.getIdToken();


  return {
    firebaseUser,
    idToken,
    phone: firebaseUser.phoneNumber,
    uid: firebaseUser.uid
  };
}


// ============================================================
// LOGOUT
// ============================================================

export async function logoutUser() {

  if (
    auth &&
    isFirebaseReady
  ) {

    try {

      await signOut(auth);

    } catch (error) {

      console.warn(
        'Sign out error:',
        error
      );
    }
  }


  clearRecaptchaVerifier();


  if (
    typeof window !== 'undefined'
  ) {

    localStorage.removeItem(
      'farmchain_gasless'
    );
  }


  store.logout();
}


// ============================================================
// AUTH STATE LISTENER
// ============================================================

export function onAuthChange(callback) {

  if (
    !auth ||
    !isFirebaseReady
  ) {
    return () => { };
  }


  return onAuthStateChanged(
    auth,
    callback
  );
}


// ============================================================
// ROLE AVATAR
// ============================================================

function getRoleAvatar(role) {
  return '';
}