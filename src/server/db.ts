import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// In Cloud Run environment, firebase-admin can often initialize with default credentials
let app: admin.app.App;
try {
  app = admin.initializeApp();
  console.log('Firebase Admin initialized with default credentials');
} catch (error) {
  console.log('Firebase Admin check (might be already initialized):', error);
  app = admin.app();
}

const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
console.log('Connecting to Firestore Database:', dbId);
export const db = getFirestore(app, dbId);
export const auth = admin.auth(app);
