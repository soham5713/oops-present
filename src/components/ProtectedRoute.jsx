import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const ProtectedRoute = ({ element, redirectTo, checkSetup = false }) => {
  const [isSetupCompleted, setIsSetupCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserSetup = async () => {
      const user = auth.currentUser;
      if (user && checkSetup) {
        const db = getFirestore();
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().setupCompleted) {
          setIsSetupCompleted(true);
        } else {
          setIsSetupCompleted(false);
        }
      }
      setIsLoading(false);
    };
    checkUserSetup();
  }, [checkSetup]);

  const user = auth.currentUser;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (checkSetup && !isSetupCompleted) {
    return <Navigate to="/subject-setup" replace />;
  }

  return element;
};

export default ProtectedRoute;
