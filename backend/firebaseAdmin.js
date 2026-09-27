// backend/firebaseAdmin.js
// Firebase Admin SDK integration for backend token verification
import { getApps, initializeApp, getApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let firebaseAdminApp = null;
let isFirebaseAdminInitialized = false;

export function initFirebaseAdmin() {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseAdminApp = existingApps[0];
    isFirebaseAdminInitialized = true;
    return firebaseAdminApp;
  }

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountJson) {
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(serviceAccountJson);
      } catch (parseErr) {
        console.warn('⚠️ Could not parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:', parseErr.message);
        serviceAccount = null;
      }

      if (serviceAccount) {
        firebaseAdminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID || 'farmchainai',
        });
        isFirebaseAdminInitialized = true;
        console.log('🔥 Firebase Admin SDK initialized with service account credentials');
        return firebaseAdminApp;
      }
    }

    // Default project initialization (verifies ID tokens against Google public certs for this project)
    const projectId = process.env.FIREBASE_PROJECT_ID || 'farmchainai';
    firebaseAdminApp = initializeApp({
      projectId,
    });
    isFirebaseAdminInitialized = true;
    console.log(`🔥 Firebase Admin SDK initialized with project ID: ${projectId}`);
    return firebaseAdminApp;
  } catch (error) {
    console.warn('⚠️ Firebase Admin SDK initialization error:', error.message);
    return null;
  }
}

// Auto-initialize on import
initFirebaseAdmin();

/**
 * Verify a Firebase ID token sent from the client
 * @param {string} idToken - The Firebase ID token from client user.getIdToken()
 * @returns {Promise<import('firebase-admin/auth').DecodedIdToken>} Decoded token containing uid, phone_number, etc.
 */
export async function verifyFirebaseIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Firebase ID token is required and must be a string');
  }

  if (!isFirebaseAdminInitialized) {
    initFirebaseAdmin();
  }

  const app = firebaseAdminApp || (getApps().length > 0 ? getApps()[0] : null);
  if (!app) {
    throw new Error('Firebase Admin SDK is not initialized');
  }

  const auth = getAuth(app);
  return await auth.verifyIdToken(idToken);
}

export { firebaseAdminApp, isFirebaseAdminInitialized };
