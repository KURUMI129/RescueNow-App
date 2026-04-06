import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
// @ts-ignore — Firebase v12 exports this from a sub-path
import { getReactNativePersistence } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const hasMissingConfig = Object.values(firebaseConfig).some(
  (value) => typeof value !== "string" || value.length === 0,
);

if (hasMissingConfig) {
  console.warn(
    "Firebase env vars are missing. Check .env and restart Expo.",
  );
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Use AsyncStorage for auth persistence on native, default on web
export const firebaseAuth =
  Platform.OS === "web"
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });

export const firestoreDb = getFirestore(app);

// Enable offline persistence for Firestore (web only, native has it by default)
if (Platform.OS === "web") {
  enableIndexedDbPersistence(firestoreDb).catch((err) => {
    console.warn("Firestore persistence error:", err.code);
  });
}

export const firebaseApp = app;

