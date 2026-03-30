import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, getDocFromServer } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Handle optional firestoreDatabaseId
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();

// Initialize Analytics if measurementId is present
if (firebaseConfig.measurementId) {
  getAnalytics(app);
}

// Auth functions
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

// Connection test
async function testConnection() {
  try {
    // Try to get a non-existent document to test connectivity
    await getDocFromServer(doc(db, 'test_connection', 'test'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firebase Firestore Error: The client is offline. This usually means the Firestore database has not been created in your Firebase Console yet. Please go to your Firebase Console, click on 'Firestore Database', and click 'Create Database'.");
    } else {
      console.error("Firestore connectivity test error:", error);
    }
  }
}
testConnection();

export { onAuthStateChanged, type User };
