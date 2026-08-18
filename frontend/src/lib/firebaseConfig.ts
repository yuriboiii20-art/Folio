import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    import.meta.env.VITE_API_KEY ||
    'AIzaSyCd4GPABx4RIvk87-SgN6sF9J1rZP1VIKw',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    import.meta.env.VITE_AUTH_DOMAIN ||
    'folio-59177.firebaseapp.com',
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    import.meta.env.VITE_PROJECT_ID ||
    'folio-59177',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    import.meta.env.VITE_STORAGE_BUCKET ||
    'folio-59177.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    import.meta.env.VITE_MESSAGING_SENDER_ID ||
    '1063150666663',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    import.meta.env.VITE_APP_ID ||
    '1:1063150666663:web:13575e7c28432aee2aec82',
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ||
    'G-8R5CK7BMHQ',
};

// Initialize Firebase once
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export const isFirebaseConfigured = true;
