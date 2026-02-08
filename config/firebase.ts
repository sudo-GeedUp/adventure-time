import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

// Firebase configuration - will use local storage if not configured
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
};

let app: ReturnType<typeof initializeApp> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let db: ReturnType<typeof getDatabase> | null = null;
let firestore: ReturnType<typeof getFirestore> | null = null;

export const initializeFirebase = async () => {
  try {
    if (!firebaseConfig.projectId) {
      console.warn("Firebase config not set up. Using local storage mode.");
      return null;
    }

    app = initializeApp(firebaseConfig);
    
    // Initialize auth for web environment (browser)
    if (typeof window !== 'undefined' && window.location) {
      // Web browser environment
      auth = getAuth(app);
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        console.log("Browser persistence not available, using default");
      }
    } else {
      // Native or other environment
      auth = getAuth(app);
    }
    
    db = getDatabase(app);
    firestore = getFirestore(app);

    return { auth, db, firestore };
  } catch (error) {
    console.error("Firebase initialization error:", error);
    return null;
  }
};

export const getFirebaseServices = () => {
  return { auth, db, firestore };
};

export default {
  initializeFirebase,
  getFirebaseServices,
};
