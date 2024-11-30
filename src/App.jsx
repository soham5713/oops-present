import { BrowserRouter as Router, Routes, Navigate, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth } from "./firebase"; // Import Firebase auth
import { onAuthStateChanged } from "firebase/auth"; // Firebase auth listener
import SignIn from "./pages/SignIn";
import SubjectSetup from "./pages/SubjectSetup";
import Attendance from './pages/Attendance'; // Ensure the path is correct
import Navbar from "./components/Navbar";
import Dashboard from './pages/Dashboard'; // Ensure the path is correct  

function App() {
  const [user, setUser] = useState(null);

  // Check if the user is logged in or not
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <Navbar user={user} />
      <Routes>
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/signin"} replace />} />
        <Route path="/signin" element={user ? <Navigate to="/dashboard" replace /> : <SignIn />} />
        <Route path="/subject-setup" element={user ? <SubjectSetup /> : <Navigate to="/signin" replace />} />
        <Route path="/attendance" element={user ? <Attendance /> : <Navigate to="/signin" replace />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/signin" replace />} />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
