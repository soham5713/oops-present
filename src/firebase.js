import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth"
import { getFirestore, doc, setDoc } from "firebase/firestore"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
const auth = getAuth(app)
const provider = new GoogleAuthProvider()
const db = getFirestore(app)

// Sign-out function
export const signOut = async () => {
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error("Error signing out:", error)
  }
}

// Function to create user in Firestore if not already present
export const createUserInFirestore = async (user) => {
  if (!user) return

  const userRef = doc(db, "users", user.uid)
  const userData = {
    name: user.displayName || "Anonymous",
    email: user.email || "No email provided",
    createdAt: new Date(),
  }

  try {
    await setDoc(userRef, userData, { merge: true })
    console.log("User created in Firestore successfully")
  } catch (error) {
    console.error("Error creating user in Firestore:", error)
    throw error // Rethrow the error to be handled by the calling function
  }
}

// Export services
export { auth, provider, signInWithPopup, db }