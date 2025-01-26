import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { auth } from "../firebase"
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Timetable, getBatches } from "../config/timetable"

const DIVISIONS = ["A", "B", "C", "D", "E", "F", "G", "H"]

function SubjectSetup() {
  const [division, setDivision] = useState("")
  const [batch, setBatch] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    const fetchUserDivision = async () => {
      try {
        const user = auth.currentUser
        if (!user) {
          navigate("/signin")
          return
        }

        const db = getFirestore()
        const userRef = doc(db, "users", user.uid)
        const userDoc = await getDoc(userRef)

        if (!isMounted) return

        if (userDoc.exists()) {
          const userData = userDoc.data()

          if (userData.setupComplete) {
            navigate("/attendance")
            return
          }

          setDivision(userData.division || "")
          setBatch(userData.batch || "")

          if (!userData.division) {
            setError("Please select a division to continue.")
          }
        }
      } catch (error) {
        if (!isMounted) return
        console.error("Error fetching user division:", error)
        setError("Failed to load user data. Please try again later.")
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchUserDivision()

    return () => {
      isMounted = false
    }
  }, [navigate])

  const handleDivisionChange = (value) => {
    setDivision(value)
    setBatch("")
    setError("")
    setSuccess("")
  }

  const handleBatchChange = (value) => {
    setBatch(value)
    setError("")
    setSuccess("")
  }

  const handleSubmit = () => {
    if (!division || !batch) {
      setError("Please select both a division and a batch to continue.")
      return
    }
    setShowConfirmation(true)
  }

  const confirmSetup = async () => {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error("No authenticated user found")
      }

      const db = getFirestore()
      const userRef = doc(db, "users", user.uid)

      await setDoc(
        userRef,
        {
          division,
          batch,
          setupComplete: true,
          attendance: {},
          lastUpdated: new Date().toISOString(),
        },
        { merge: true },
      )

      setSuccess("Setup completed successfully!")

      setTimeout(() => {
        navigate("/attendance")
      }, 1500)
    } catch (error) {
      console.error("Error saving user data:", error)
      setError(error.message || "Failed to save user data. Please try again.")
    } finally {
      setSaving(false)
      setShowConfirmation(false)
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
    <div className="container mx-auto py-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Subject Setup</CardTitle>
          <CardDescription>Select your division and batch to continue</CardDescription>
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
                htmlFor="division"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Division
              </label>
              <Select value={division} onValueChange={handleDivisionChange} disabled={saving}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Division" />
                </SelectTrigger>
                <SelectContent>
                  {DIVISIONS.map((div) => (
                    <SelectItem key={div} value={div}>
                      Division {div}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {division && (
              <div className="space-y-2">
                <label
                  htmlFor="batch"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Batch
                </label>
                <Select value={batch} onValueChange={handleBatchChange} disabled={saving}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {getBatches(division).map((b) => (
                      <SelectItem key={b} value={b}>
                        Batch {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button onClick={handleSubmit} className="w-full" disabled={!division || !batch || saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save and Continue"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Setup</DialogTitle>
            <DialogDescription>
              Are you sure you want to set your division to {division} and batch to {batch}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSetup}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SubjectSetup

