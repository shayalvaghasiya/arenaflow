import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import 'dotenv/config';
import { GoogleAuth } from 'google-auth-library';

const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const dbId = process.env.VITE_FIREBASE_DATABASE_ID || '(default)';

let app: admin.app.App;
let activeIdentity = 'Checking...';

// Resolve Identity
async function resolveIdentity() {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccount) {
    try {
      const cert = JSON.parse(serviceAccount);
      activeIdentity = cert.client_email;
    } catch (e) {
      activeIdentity = 'Invalid JSON in FIREBASE_SERVICE_ACCOUNT_KEY';
    }
  } else {
    try {
      const auth = new GoogleAuth();
      const client = await auth.getClient();
      // On Cloud Run/Compute, this fetches the service account email
      const credentials = await auth.getCredentials();
      activeIdentity = credentials.client_email || 'Compute Default (ADC)';
    } catch (e) {
      activeIdentity = 'ADC (Discovery failed)';
    }
  }
  console.log(`[Firebase Identity] Active: ${activeIdentity}`);
}

resolveIdentity();

try {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (serviceAccount) {
    const cert = JSON.parse(serviceAccount);
    app = admin.initializeApp({
      credential: admin.credential.cert(cert),
      projectId: cert.project_id || projectId,
    }, 'server-admin');
  } else if (projectId) {
    app = admin.initializeApp({
      projectId: projectId,
    }, 'server-admin');
  } else {
    app = admin.initializeApp({}, 'server-admin');
  }
} catch (error) {
  try {
    app = admin.app('server-admin');
  } catch (e) {
    app = admin.initializeApp({}, 'server-admin');
  }
}

let dbInstance;
try {
  dbInstance = getFirestore(app, dbId);
} catch (e) {
  dbInstance = getFirestore(app, '(default)');
}

export const db = dbInstance;
export const auth = admin.auth(app);
export const firebaseConfig = {
  projectId,
  dbId,
  get serviceAccountEmail() { return activeIdentity; }
};
