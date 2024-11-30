import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"; // Import Navigate here
import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import SignIn from "./pages/SignIn";
import SubjectSetup from "./pages/SubjectSetup";
import Attendance from "./pages/Attendance";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute"; // Import the ProtectedRoute component

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
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
        <Route
          path="/"
          element={
            user ? (
              <Navigate to={user ? "/attendance" : "/subject-setup"} />
            ) : (
              <Navigate to="/signin" />
            )
          }
        />
        <Route path="/signin" element={user ? <Navigate to="/" replace /> : <SignIn />} />
        <Route
          path="/subject-setup"
          element={
            <ProtectedRoute
              element={<SubjectSetup />}
              redirectTo="/signin"
              checkSetup={true} // Check if the setup is completed
            />
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute
              element={<Attendance />}
              redirectTo="/signin"
              checkSetup={false} // No setup check needed for attendance
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              element={<Dashboard />}
              redirectTo="/signin"
              checkSetup={false} // No setup check needed for dashboard
            />
          }
        />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
