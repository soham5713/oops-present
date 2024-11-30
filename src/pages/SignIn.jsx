import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, provider, signInWithPopup } from "../firebase"; // Import auth and provider

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
          <p>Don't have an account? <a href="/signup" className="text-blue-500 font-semibold hover:underline">Sign Up</a></p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
