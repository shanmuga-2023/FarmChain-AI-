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
    avatar: '👨‍🌾'
  },

  {
    role: 'intermediary',
    name: 'AgriTraders Pvt Ltd',
    email: 'trader@farmchain.io',
    password: 'trader123',
    location: 'Mumbai, Maharashtra',
    avatar: '🏢'
  },

  {
    role: 'retailer',
    name: 'FreshMart Stores',
    email: 'retailer@farmchain.io',
    password: 'retail123',
    location: 'Bangalore, Karnataka',
    avatar: '🛒'
  },

  {
    role: 'consumer',
    name: 'Priya Sharma',
    email: 'consumer@farmchain.io',
    password: 'consumer123',
    location: 'Bangalore, Karnataka',
    avatar: '👤'
  },

  {
    role: 'admin',
    name: 'System Admin',
    email: 'admin@farmchain.io',
    password: 'admin123',
    location: 'Platform HQ',
    avatar: '🔧'
  },

  // Secondary demo accounts

  {
    role: 'farmer',
    name: 'Rajesh Kumar',
    email: 'rajesh@farmchain.demo',
    password: 'farmer123',
    location: 'Nashik, Maharashtra',
    avatar: '👨‍🌾'
  },

  {
    role: 'farmer',
    name: 'Lakshmi Devi',
    email: 'lakshmi@farmchain.demo',
    password: 'farmer123',
    location: 'Thanjavur, Tamil Nadu',
    avatar: '👩‍🌾'
  },

  {
    role: 'intermediary',
    name: 'AgriTraders Pvt Ltd',
    email: 'agritraders@farmchain.demo',
    password: 'trader123',
    location: 'Mumbai, Maharashtra',
    avatar: '🏢'
  },

  {
    role: 'retailer',
    name: 'FreshMart Stores',
    email: 'freshmart@farmchain.demo',
    password: 'retail123',
    location: 'Bangalore, Karnataka',
    avatar: '🛒'
  },

  {
    role: 'consumer',
    name: 'Priya Sharma',
    email: 'priya@farmchain.demo',
    password: 'consumer123',
    location: 'Bangalore, Karnataka',
    avatar: '👤'
  },

  {
    role: 'admin',
    name: 'System Admin',
    email: 'admin@farmchain.demo',
    password: 'admin123',
    location: 'Platform HQ',
    avatar: '🔧'
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

  try {
    // --------------------------------------------------------
    // Firebase unavailable -> local registration
    // --------------------------------------------------------

    if (!isFirebaseReady || !auth) {
      const user = {
        id: `user-${Date.now()}`,
        name: displayName,
        email: normalizedEmail,
        role: String(role || 'farmer').toLowerCase(),
        location: location || 'India',
        walletAddress,
        avatar: getRoleAvatar(role),
        createdAt: Date.now(),
        verified: true,
        isLocal: true
      };

      store.login(user.role, user.id, user);

      return {
        user,
        isFallback: true
      };
    }

    // --------------------------------------------------------
    // Firebase registration
    // --------------------------------------------------------

    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

    const firebaseUser = userCredential.user;

    await updateProfile(firebaseUser, {
      displayName
    });

    const userProfile = {
      id: firebaseUser.uid,
      name: displayName,
      email: normalizedEmail,
      role: String(role || 'farmer').toLowerCase(),
      location: location || 'India',
      walletAddress: walletAddress || '',
      avatar: getRoleAvatar(role),
      createdAt: Date.now(),
      verified: true
    };

    // --------------------------------------------------------
    // Firestore profile
    // --------------------------------------------------------

    if (db) {
      try {
        await setDoc(
          doc(db, 'users', firebaseUser.uid),
          userProfile
        );
      } catch (dbError) {
        console.warn(
          'Firestore profile save skipped:',
          dbError.message
        );
      }
    }

    // --------------------------------------------------------
    // Backend sync
    // --------------------------------------------------------

    postUser(userProfile).catch(() => { });

    store.login(
      userProfile.role,
      firebaseUser.uid,
      userProfile
    );

    return {
      user: userProfile,
      firebaseUser
    };

  } catch (error) {

    console.error(
      'Firebase registration error:',
      error.code,
      error.message
    );

    // --------------------------------------------------------
    // Demo account already exists
    // --------------------------------------------------------

    if (error.code === 'auth/email-already-in-use') {

      const demoMatch = DEMO_CREDENTIALS.find(
        demo =>
          demo.email.toLowerCase() === normalizedEmail
      );

      if (demoMatch) {
        const demoUser = createDemoUser(demoMatch);

        store.login(
          demoUser.role,
          demoUser.id,
          demoUser
        );

        return {
          user: demoUser,
          isFallback: true
        };
      }
    }

    // --------------------------------------------------------
    // Firebase provider disabled
    // --------------------------------------------------------

    if (
      error.code === 'auth/operation-not-allowed' ||
      error.code === 'auth/configuration-not-found'
    ) {

      const user = {
        id: `user-${Date.now()}`,
        name: displayName,
        email: normalizedEmail,
        role: String(role || 'farmer').toLowerCase(),
        location: location || 'India',
        walletAddress: walletAddress || '',
        avatar: getRoleAvatar(role),
        createdAt: Date.now(),
        verified: true,
        isLocal: true
      };

      store.login(
        user.role,
        user.id,
        user
      );

      return {
        user,
        isFallback: true
      };
    }

    throw error;
  }
}


// ============================================================
// LOGIN WITH EMAIL
// ============================================================

export async function loginWithEmail(email, password) {

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    const error = new Error(
      'Email and password are required.'
    );

    error.code = 'auth/missing-login-fields';

    throw error;
  }


  // ==========================================================
  // 1. CHECK DEMO ACCOUNT FIRST
  // ==========================================================

  const demoMatch = DEMO_CREDENTIALS.find(
    demo =>
      demo.email.toLowerCase() === normalizedEmail
  );


  if (demoMatch) {

    // IMPORTANT:
    // Demo accounts never call Firebase.
    // This prevents auth/invalid-credential console errors.

    if (demoMatch.password !== password) {

      const error = new Error(
        'Incorrect demo account password.'
      );

      error.code = 'auth/wrong-password';

      throw error;
    }


    const demoUser = createDemoUser(demoMatch);

    store.login(
      demoUser.role,
      demoUser.id,
      demoUser
    );

    console.info(
      `Demo login successful: ${normalizedEmail}`
    );

    return {
      user: demoUser,
      isFallback: true
    };
  }


  // ==========================================================
  // 2. REAL FIREBASE ACCOUNT
  // ==========================================================

  try {

    if (!isFirebaseReady || !auth) {

      const error = new Error(
        'Firebase Authentication is not configured. Please check your Firebase configuration.'
      );

      error.code = 'auth/not-configured';

      throw error;
    }


    console.info(
      `Firebase login attempt: ${normalizedEmail}`
    );


    const userCredential =
      await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );


    const firebaseUser =
      userCredential.user;


    // ========================================================
    // 3. LOAD FIRESTORE PROFILE
    // ========================================================

    let userProfile = null;


    if (db) {

      try {

        const userRef =
          doc(
            db,
            'users',
            firebaseUser.uid
          );


        const docSnap =
          await getDoc(userRef);


        if (docSnap.exists()) {
          userProfile = docSnap.data();
        }

      } catch (dbError) {

        // Firestore failure must NOT destroy successful Auth login.

        console.warn(
          'Firestore profile unavailable:',
          dbError.message
        );
      }
    }


    // ========================================================
    // 4. CREATE FALLBACK PROFILE
    // ========================================================

    if (!userProfile) {

      userProfile = {

        id: firebaseUser.uid,

        name:
          firebaseUser.displayName ||
          normalizedEmail.split('@')[0],

        email:
          firebaseUser.email ||
          normalizedEmail,

        role: 'farmer',

        location: 'India',

        avatar: '👨‍🌾',

        verified:
          firebaseUser.emailVerified ?? false
      };
    }


    // ========================================================
    // 5. STORE SESSION
    // ========================================================

    store.login(
      userProfile.role,
      userProfile.id,
      userProfile
    );


    console.info(
      `Firebase login successful: ${normalizedEmail}`
    );


    return {
      user: userProfile,
      firebaseUser
    };


  } catch (error) {

    console.error(
      'Firebase login failed:',
      error.code,
      error.message
    );


    // ========================================================
    // LOCAL USER FALLBACK
    // ========================================================

    const rawUsers =
      store.get('users') || {};


    const usersList =
      Array.isArray(rawUsers)
        ? rawUsers
        : Object.values(rawUsers);


    const localUser =
      usersList.find(
        user =>
          user &&
          user.email &&
          user.email.toLowerCase() === normalizedEmail
      );


    if (localUser) {

      console.info(
        `Local profile login: ${normalizedEmail}`
      );


      store.login(
        localUser.role || 'farmer',
        localUser.id,
        localUser
      );


      return {
        user: localUser,
        isFallback: true
      };
    }


    // ========================================================
    // FRIENDLY ERROR
    // ========================================================

    const friendlyError =
      new Error(
        getFirebaseErrorMessage(error)
      );

    friendlyError.code =
      error.code || 'auth/login-failed';

    friendlyError.originalError =
      error;

    throw friendlyError;
  }
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
          '👤',

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

  const map = {

    farmer: '👨‍🌾',

    intermediary: '🏢',

    retailer: '🛒',

    consumer: '👤',

    admin: '🔧'

  };


  return (
    map[
    String(role || '')
      .toLowerCase()
    ] || '👤'
  );
}