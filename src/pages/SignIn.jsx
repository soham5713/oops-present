import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { signInWithPopup, auth, provider } from "../firebase"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { db } from "../firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

function SignIn() {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const initializeUserData = async (user) => {
    try {
      const userDocRef = doc(db, "users", user.uid)
      const userDoc = await getDoc(userDocRef)

      if (!userDoc.exists()) {
        const defaultData = {
          attendance: {},
          division: "",
          setupComplete: false,
          subjects: {},
          timetable: [""],
          createdAt: new Date().toISOString(),
        }

        await setDoc(userDocRef, defaultData)
        console.log("User data initialized successfully.")
      }
    } catch (error) {
      console.error("Error initializing user data:", error)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      await initializeUserData(user)
      console.log("Signed in and user data initialized:", user)
      navigate("/dashboard")
    } catch (error) {
      console.error("Error during sign-in:", error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Sign in with your Google account to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button onClick={handleGoogleSignIn} className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google logo"
                  className="w-5 h-5 mr-2"
                />
                Sign In with Google
              </>
            )}
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <a href="/signup" className="text-primary font-semibold hover:underline">
              Sign Up
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default SignIn

