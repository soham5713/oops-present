import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithPopup, auth, provider } from "../firebase"; // Import Firebase services
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase"; // Import Firestore instance

function SignIn() {
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Initialize the default data for a new user
  const initializeUserData = async (user) => {
    try {
      // Reference to the user's document
      const userDocRef = doc(db, "users", user.uid);

      // Check if the document exists
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Default data structure for new users
        const defaultData = {
          attendance: {
          },
          division: "",
          setupCompleted: true,
          subjects: {},
          timetable: [""],
        };

        // Write the default data to Firestore for a new user
        await setDoc(userDocRef, defaultData);
        console.log("User data initialized successfully.");
      } else {
        console.log("User data already exists.");
      }
    } catch (error) {
      console.error("Error initializing user data:", error);
    }
  };

  // Update the user data after they modify their information
  const updateUserData = async (user, updatedData) => {
    try {
      const userDocRef = doc(db, "users", user.uid);

      // Update user data in Firestore
      await updateDoc(userDocRef, updatedData);
      console.log("User data updated successfully.");
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  };

  // Handle Google sign-in and initialize/update user data
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Initialize Firestore data if user is new
      await initializeUserData(user);

      console.log("Signed in and user data initialized:", user);

      // Navigate to the dashboard after sign-in
      navigate("/dashboard");

    } catch (error) {
      console.error("Error during sign-in:", error);
      setError(error.message); // Display error to the user
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[66vh] md:min-h-[90vh]">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96 max-w-md">
        <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">Sign In</h2>
        <p className="text-lg text-center text-gray-600 mb-4">Please sign in with your Google account to continue.</p>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <button
          onClick={handleGoogleSignIn}
          className="w-full py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center gap-3 transition duration-200"
        >
          <img
            src="https://logos-world.net/wp-content/uploads/2020/09/Google-Symbol.png"
            alt="Google logo"
            className="w-10"
          />
          Sign In with Google
        </button>

        <div className="mt-6 text-center text-gray-600">
          <p>
            Don't have an account?{" "}
            <a href="/signup" className="text-blue-500 font-semibold hover:underline">
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
