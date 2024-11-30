import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, provider, signInWithPopup } from '../firebase'; // Import auth and provider

function SignIn() {
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider); // Pass auth and provider to signInWithPopup
      const user = result.user; // Get user info from result
      console.log("Signed in user:", user);
      navigate("/dashboard"); // Redirect to dashboard after successful sign-in
    } catch (error) {
      setError(error.message); // Set error if any occurs
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-md shadow-md w-96">
        <h2 className="text-2xl font-semibold text-center mb-4">Sign In with Google</h2>
        {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
        <button
          onClick={handleGoogleSignIn}
          className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Sign In with Google
        </button>
      </div>
    </div>
  );
}

export default SignIn;
