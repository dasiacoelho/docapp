import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, type Firestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAnalytics, type Analytics, isSupported } from 'firebase/analytics';
import { getFunctions, type Functions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyA6iIldPA0vfYDuk_IRl7wVt5U0cEkCd8A",
  authDomain: "docapp-e64d9.firebaseapp.com",
  projectId: "docapp-e64d9",
  storageBucket: "docapp-e64d9.firebasestorage.app",
  messagingSenderId: "663709327506",
  appId: "1:663709327506:web:58068b6d605a413c23864b",
  measurementId: "G-4TMDP789Z9"
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;
let functions: Functions | null = null;

export function initializeFirebase(): FirebaseApp {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app, 'asia-south1');

  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app!);
      }
    });

    enableIndexedDbPersistence(db!).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('Current browser does not support offline persistence.');
      }
    });
  }

  return app!;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    initializeFirebase();
  }
  return auth!;
}

export function getFirestoreDb(): Firestore {
  if (!db) {
    initializeFirebase();
  }
  return db!;
}

export function getFirebaseAnalytics(): Analytics | null {
  return analytics;
}

export function getFirebaseFunctions(): Functions {
  if (!functions) {
    initializeFirebase();
  }
  return functions!;
}

export { app, auth, db, analytics, functions };

export default app;