import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

// Firebase configuration using environment credentials
const firebaseConfig = {
  apiKey: 'AIzaSyAlAhepGwnpklDG-1M3YWbEkL9NKztJpu8',
  authDomain: 'aigram-9a4c3.firebaseapp.com',
  projectId: 'aigram-9a4c3',
  storageBucket: 'aigram-9a4c3.firebasestorage.app',
  messagingSenderId: '211865574543',
  appId: '1:211865574543:android:572ff44c0ecd0b8e4fa4fa',
};

// Initialize Firebase App
let app: any;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Lazily initialize Firebase Auth using require() to defer firebase/auth module
// loading until after all modules are fully evaluated. This avoids the
// "Component auth has not been registered yet" error on iOS/Hermes.
let _auth: any = null;

export function getFirebaseAuth(): any {
  if (_auth) return _auth;
  const { initializeAuth, getReactNativePersistence, getAuth } = require('firebase/auth');
  if (Platform.OS === 'web') {
    _auth = getAuth(app);
  } else {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      _auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      // Already initialized (e.g. hot-reload) — reuse existing instance
      _auth = getAuth(app);
    }
  }
  return _auth;
}

export const firebaseApp = app;

// Initialize Firestore
export const db = getFirestore(firebaseApp);

// Initialize Storage
export const storage = getStorage(firebaseApp);

export default firebaseApp;
