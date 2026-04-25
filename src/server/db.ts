import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import 'dotenv/config';

const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

console.log('Firebase Init - Project ID used:', projectId);

if (!projectId) {
  console.error('CRITICAL ERROR: No Firebase Project ID found. Please set VITE_FIREBASE_PROJECT_ID in Secrets.');
}

// In Cloud Run environment, firebase-admin can often initialize with default credentials
let app: admin.app.App;
try {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (serviceAccount) {
    console.log('Firebase Init - Using Service Account Key from environment.');
    const cert = JSON.parse(serviceAccount);
    app = admin.initializeApp({
      credential: admin.credential.cert(cert),
      projectId: cert.project_id || projectId,
    });
  } else if (projectId) {
    console.log('Firebase Init - Initializing with Project ID only (using ADC if available):', projectId);
    app = admin.initializeApp({
      projectId: projectId,
    });
  } else {
    console.warn('Firebase Init - No Project ID or Service Account found. Falling back to default credentials.');
    app = admin.initializeApp();
  }
} catch (error) {
  console.log('Firebase Admin check (might be already initialized or failed):', error);
  app = admin.app();
}

const dbId = process.env.VITE_FIREBASE_DATABASE_ID || '(default)';
console.log('Connecting to Firestore Database:', dbId);
export const db = getFirestore(app, dbId);
export const auth = admin.auth(app);
