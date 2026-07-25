import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

// Replace these with your Firebase project credentials
// Get these from Firebase Console: https://console.firebase.google.com
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

    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app);
    firestore = getFirestore(app);

    // Set persistence for auth on web only; React Native uses its own default
    if (Platform.OS === "web") {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch {
        console.log("Persistence not available, using default");
      }
    }

    return { auth, db, firestore };
  } catch {
    console.error("Firebase initialization error");
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
