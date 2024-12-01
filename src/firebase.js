import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { signOut as firebaseSignOut } from 'firebase/auth'; 

const firebaseConfig = {
  apiKey: "AIzaSyB7bQWcAiC1j5xF9VKhrNvOh-WMIbSGh7s",
  authDomain: "oops-present.firebaseapp.com",
  projectId: "oops-present",
  storageBucket: "oops-present.appspot.com",
  messagingSenderId: "224246705716",
  appId: "1:224246705716:web:767dd62a5ea68100632461",
  measurementId: "G-BZ5XKQYM88"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// Sign-out function
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

// Function to create user in Firestore if not already present
export const createUserInFirestore = async (user) => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const userData = {
    name: user.displayName || "Anonymous",
    email: user.email || "No email provided",
    createdAt: new Date(),
  };

  try {
    await setDoc(userRef, userData, { merge: true });
  } catch (error) {
    console.error("Error creating user in Firestore:", error);
  }
};

// Export services
export { auth, provider, signInWithPopup, db };
