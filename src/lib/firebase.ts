import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// CRITICAL: Must use firestoreDatabaseId from config
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

/**
 * CRITICAL CONSTRAINT: Test connection to Firestore on boot
 */
export async function testFirestoreConnection() {
  try {
    // Attempting to get a dummy doc to verify connection
    await getDocFromServer(doc(db, 'system', 'connection-test'));
    console.log('✅ Firestore connection verified');
  } catch (error: any) {
    if (error.message?.includes('the client is offline')) {
      console.error("❌ Please check your Firebase configuration. The client is offline.");
    } else if (error.code === 'permission-denied') {
       console.log('✅ Firestore reachable (Permission Denied is expected for dummy doc)');
    } else {
      console.error("❌ Firestore connection failed:", error);
    }
  }
}
