// src/hooks/useAuth.js

import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useState, useEffect } from "react";

const useAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return unsubscribe; // Cleanup on unmount
  }, []);

  return user;
};

export default useAuth; // Ensure you're exporting the hook
