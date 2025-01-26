import React, { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { auth } from "./firebase"
import { onAuthStateChanged } from "firebase/auth"

import SignIn from "./pages/SignIn"
import Attendance from "./pages/Attendance"
import Dashboard from "./pages/Dashboard"
import Navbar from "./components/Navbar"
import ThemeProvider from "./components/ThemeProvider"
import ProtectedRoute from "./components/ProtectedRoute"
import Settings from "./pages/Settings"
import SubjectSetup from "./pages/SubjectSetup"

import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

function App() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user)
        setIsLoading(false)
      },
      (error) => {
        console.error("Auth state change error:", error)
        setIsLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  if (isLoading) {
    return (
      <ThemeProvider>
        <div className="flex justify-center items-center min-h-screen bg-background">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        </div>
      </ThemeProvider>
    )
  }

  return (
    <Router>
      <ThemeProvider>
        <div className="min-h-screen flex flex-col bg-background">
          <Navbar user={user} />
          <main className="flex-1 container mx-auto px-4 py-8 md:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={user ? <Navigate to="/attendance" /> : <Navigate to="/signin" />} />
              <Route path="/signin" element={user ? <Navigate to="/" replace /> : <SignIn />} />
              <Route
                path="/attendance"
                element={<ProtectedRoute element={<Attendance />} redirectTo="/signin" checkSetup={true} />}
              />
              <Route
                path="/dashboard"
                element={<ProtectedRoute element={<Dashboard />} redirectTo="/signin" checkSetup={true} />}
              />
              <Route
                path="/settings"
                element={<ProtectedRoute element={<Settings />} redirectTo="/signin" checkSetup={true} />}
              />
              <Route
                path="/subject-setup"
                element={<ProtectedRoute element={<SubjectSetup />} redirectTo="/signin" checkSetup={false} />}
              />
              <Route path="*" element={<Navigate to="/signin" replace />} />
            </Routes>
          </main>
        </div>
      </ThemeProvider>
    </Router>
  )
}

export default App

