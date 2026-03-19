import { initCollector, recordMetric, recordTelemetry } from '@sentinel/sensor';
import { initializeApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Firebase configuration (from your Firebase project)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('[Sentinel] Firebase config:', firebaseConfig);

// Initialize Firebase with error handling
let firebaseApp;
let firestore: Firestore | null = null;
let sentinel;

try {
  // Check if Firebase is already initialized
  if (typeof window !== 'undefined' && (window as any).firebase?.apps?.length > 0) {
    firebaseApp = (window as any).firebase.app();
  } else {
    firebaseApp = initializeApp(firebaseConfig);
  }
  
  console.log('[Sentinel] Firebase app initialized:', firebaseApp);

  // Initialize Firestore
  firestore = getFirestore(firebaseApp);
  console.log('[Sentinel] Firestore instance:', firestore);

  // Initialize Sentinel collector
  sentinel = initCollector({
    firestore,
    source: 'talentflow-api',
    environment: process.env.NODE_ENV,
  });

  console.log('[Sentinel] Sentinel collector initialized');
} catch (error) {
  console.error('[Sentinel] Failed to initialize Firebase/Firestore:', error);
  sentinel = null;
}

export { sentinel, recordMetric, recordTelemetry };
