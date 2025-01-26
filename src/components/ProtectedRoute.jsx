import { Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { auth } from "../firebase"
import { getFirestore, doc, getDoc } from "firebase/firestore"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const ProtectedRoute = ({ element, redirectTo, checkSetup = false }) => {
  const [isSetupCompleted, setIsSetupCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const checkUserSetup = async () => {
      try {
        const user = auth.currentUser
        if (user && checkSetup) {
          const db = getFirestore()
          const docRef = doc(db, "users", user.uid)
          const docSnap = await getDoc(docRef)

          setIsSetupCompleted(docSnap.exists() && docSnap.data().setupComplete)
        }
      } catch (error) {
        console.error("Error checking setup:", error)
        setError(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    checkUserSetup()
  }, [checkSetup])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const user = auth.currentUser

  if (!user) return <Navigate to={redirectTo} replace />

  if (checkSetup && !isSetupCompleted) {
    return <Navigate to="/subject-setup" replace />
  }

  return element
}

export default ProtectedRoute

