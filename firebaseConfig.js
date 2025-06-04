import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBxCHhJXRFf7pQBigwmYcJCb1Bemfbi-00",
  authDomain: "fir-auth-98a44.firebaseapp.com",
  projectId: "fir-auth-98a44",
  storageBucket: "fir-auth-98a44.appspot.com",
  messagingSenderId: "724658732879",
  appId: "1:724658732879:web:adf2e72b7b98e7c48a0f3a"
};

// Ensure the app is only initialized once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize auth with persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  auth = getAuth(app);
}

// ✅ Initialize and export Firestore
const db = getFirestore(app);

export { auth, db };
