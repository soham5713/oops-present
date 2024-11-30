import React from "react";
import { signout } from "../firebase"; // Correct import

const SignOut = () => {
  const handleSignOut = async () => {
    try {
      await signout();
      console.log("User signed out");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
    <div className="bg-white p-8 rounded-md shadow-md w-96">
      <h2 className="text-2xl font-semibold text-center mb-4">Sign In with Google</h2>
      {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
      <button
        onClick={handleSignOut}
        className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 btn-signout"
      >
        Sign In with Google
      </button>
    </div>
  </div>
  );
};

export default SignOut;
