import { BrowserRouter as Router, Routes, Navigate, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import SignIn from "./pages/SignIn";
import SubjectSetup from "./pages/SubjectSetup";
import Attendance from "./pages/Attendance";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";

function App() {
  const [user, setUser] = useState(null);
  const [isSetupCompleted, setIsSetupCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);

        // Check setup status in Firestore
        const db = getFirestore();
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().setupCompleted) {
          setIsSetupCompleted(true);
        }
      } else {
        setUser(null);
        setIsSetupCompleted(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <Navbar user={user} />
      <Routes>
        <Route path="/" element={<Navigate to={user ? (isSetupCompleted ? "/attendance" : "/subject-setup") : "/signin"} replace />} />
        <Route path="/signin" element={user ? <Navigate to="/" replace /> : <SignIn />} />
        <Route path="/subject-setup" element={user ? <SubjectSetup setIsSetupCompleted={setIsSetupCompleted} /> : <Navigate to="/signin" replace />} />
        <Route path="/attendance" element={user ? <Attendance /> : <Navigate to="/signin" replace />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/signin" replace />} />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
