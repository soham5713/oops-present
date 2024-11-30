import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { signOut as firebaseSignOut } from 'firebase/auth'; // Use the correct function from the auth module

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

// Get Firebase Authentication and Google Auth provider
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);  // Make sure `auth` is defined correctly
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

// Export services
export { auth, provider, signInWithPopup };
