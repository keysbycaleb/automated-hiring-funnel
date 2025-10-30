import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics"; // Added this
import { getFunctions, httpsCallable } from "firebase/functions"; // Added for our new functions

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID, // Added this
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export all the services we'll need
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app); // Added this
export const functions = getFunctions(app); // Added this

// --- Create helper exports for our new Cloud Functions ---
// This allows us to call them easily from our React components
export const generateQuotePDF = httpsCallable(functions, 'generateQuotePDF');
export const generateContract = httpsCallable(functions, 'generateContract');
export const generateContractV2 = httpsCallable(functions, 'generateContractV2'); // <-- Add this new line