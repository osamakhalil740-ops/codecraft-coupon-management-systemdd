
// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { logger } from './utils/logger';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBg-9a8Qv7yohzmPQyPHi8zcKWrCxOp_hg",
  authDomain: "effortless-coupon-management.firebaseapp.com",
  projectId: "effortless-coupon-management",
  storageBucket: "effortless-coupon-management.firebasestorage.app",
  messagingSenderId: "674509917896",
  appId: "1:674509917896:web:4dab684ec72dff301adffd",
  measurementId: "G-5T0WC2L3JD"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let functions: Functions;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);

  // Get Firebase services
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);

  // Enable offline persistence for better UX (don't block on this)
  // Only run in browser environment, not during SSR/build
  if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db, { 
      forceOwnership: false // Allow multiple tabs without error
    }).catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time
        logger.warn('Firebase persistence failed: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        // The current browser doesn't support persistence
        logger.warn('Firebase persistence not supported in this browser');
      } else {
        logger.warn('Firebase persistence setup failed:', err);
      }
    });
  }

  logger.debug('✅ Firebase initialized successfully');
} catch (error) {
  logger.error('❌ Firebase initialization failed:', error);
  
  // Show user-friendly error message
  if (typeof window !== 'undefined') {
    const showFirebaseError = () => {
      const errorDiv = document.createElement('div');
      errorDiv.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          font-family: system-ui, -apple-system, sans-serif;
        ">
          <div style="
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          ">
            <div style="
              width: 60px;
              height: 60px;
              background: #fee;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 1rem;
              font-size: 30px;
            ">⚠️</div>
            <h2 style="
              font-size: 1.5rem;
              font-weight: bold;
              margin-bottom: 0.5rem;
              color: #1f2937;
            ">Connection Error</h2>
            <p style="
              color: #6b7280;
              margin-bottom: 1.5rem;
              line-height: 1.5;
            ">
              Unable to connect to Kobonz services. Please check your internet connection and try again.
            </p>
            <button onclick="window.location.reload()" style="
              background: #007AFF;
              color: white;
              padding: 0.75rem 2rem;
              border: none;
              border-radius: 0.5rem;
              font-weight: 600;
              cursor: pointer;
              width: 100%;
              font-size: 1rem;
            ">
              Retry Connection
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(errorDiv);
    };

    // Show error after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showFirebaseError);
    } else {
      showFirebaseError();
    }
  }
  
  throw error;
}

// Export them for use in other files
export { auth, db, functions };
