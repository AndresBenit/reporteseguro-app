import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Configuración Firebase - usando variables de entorno cuando están disponibles
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyASF424zUhmoeAUJ2xVv7keG6RSxYpeD5M",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sst01-31e6e.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sst01-31e6e",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sst01-31e6e.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "391943641264",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:391943641264:web:8ae84dec0b5227dd1a8375",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-VR1RZDN6GB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Exportar también la app para uso adicional
export default app;
