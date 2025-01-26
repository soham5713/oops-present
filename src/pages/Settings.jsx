import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { auth } from "../firebase"
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

import { Divisions, getBatches } from "../config/timetable"

function Settings() {
  const [division, setDivision] = useState("")
  const [batch, setBatch] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser
        if (!user) {
          navigate("/signin")
          return
        }

        const db = getFirestore()
        const userRef = doc(db, "users", user.uid)
        const userDoc = await getDoc(userRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          setDivision(userData.division || "")
          setBatch(userData.batch || "")
          setEmail(user.email || "")
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        setError("Failed to load user data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [navigate])

  const handleSave = async () => {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const user = auth.currentUser
      if (!user) throw new Error("No authenticated user found")

      const db = getFirestore()
      const userRef = doc(db, "users", user.uid)

      await updateDoc(userRef, {
        division,
        batch,
        lastUpdated: new Date().toISOString(),
      })

      setSuccess("Settings updated successfully!")
    } catch (error) {
      console.error("Error saving user data:", error)
      setError(error.message || "Failed to save settings. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Settings</CardTitle>
          <CardDescription>Manage your account settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-6">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Email
              </label>
              <Input id="email" type="email" value={email} disabled />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="division"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Division
              </label>
              <Select value={division} onValueChange={setDivision}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Division" />
                </SelectTrigger>
                <SelectContent>
                  {Divisions.map((div) => (
                    <SelectItem key={div} value={div}>
                      Division {div}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="batch"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Batch
              </label>
              <Select value={batch} onValueChange={setBatch}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Batch" />
                </SelectTrigger>
                <SelectContent>
                  {division &&
                    getBatches(division).map((b) => (
                      <SelectItem key={b} value={b}>
                        Batch {b}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSave} className="w-full" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Settings

