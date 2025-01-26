import React, { useState, useEffect, useMemo } from "react"
import { auth } from "../firebase"
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CalendarIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

import { getDivisionTimetable } from "../config/timetable"

function AttendancePage() {
  const [attendanceData, setAttendanceData] = useState({})
  const [date, setDate] = useState(new Date())
  const [division, setDivision] = useState("")
  const [batch, setBatch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false) // Added isSaving state
  const navigate = useNavigate()

  const getCurrentDay = useMemo(() => {
    return date.toLocaleString("en-US", { weekday: "long" })
  }, [date])

  const timetable = useMemo(() => {
    return division && batch ? getDivisionTimetable(division, batch, getCurrentDay) : []
  }, [division, batch, getCurrentDay])

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

          const dateStr = date.toISOString().split("T")[0]
          const storedAttendance = userData.attendance?.[dateStr] || {}

          const initialAttendanceData = {}
          timetable.forEach(({ subject, type }) => {
            initialAttendanceData[subject] = {
              ...initialAttendanceData[subject],
              [type]: storedAttendance[subject]?.[type] || "",
            }
          })

          setAttendanceData(initialAttendanceData)
        }
      } catch (error) {
        console.error("Error:", error)
        setError(error.message || "Failed to load attendance data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [date, navigate, timetable])

  const handleAttendanceChange = (subject, type, value) => {
    setAttendanceData((prev) => ({
      ...prev,
      [subject]: {
        ...prev[subject],
        [type]: value === prev[subject]?.[type] ? "" : value,
      },
    }))
  }

  const saveAttendance = async () => {
    // Updated saveAttendance function
    if (!division || !batch) {
      setError("Please select your division and batch first")
      return
    }

    setIsSaving(true)
    try {
      const user = auth.currentUser
      if (!user) throw new Error("User not authenticated")

      const db = getFirestore()
      const docRef = doc(db, "users", user.uid)
      const dateStr = date.toISOString().split("T")[0]

      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) throw new Error("User document not found")

      const userData = docSnap.data()
      const updatedAttendance = {
        ...userData.attendance,
        [dateStr]: attendanceData,
      }

      await setDoc(
        docRef,
        {
          attendance: updatedAttendance,
          lastUpdated: new Date().toISOString(),
        },
        { merge: true },
      )

      navigate("/dashboard")
    } catch (error) {
      console.error("Error saving attendance:", error)
      setError("Failed to save attendance. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="space-y-1">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Daily Attendance</CardTitle>
              <CardDescription className="flex items-center mt-1">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {getCurrentDay}, {date.toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-[280px,1fr] gap-6">
            <div className="space-y-4">
              <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
            </div>

            {!division || !batch ? (
              <div className="flex items-center justify-center h-full">
                <Alert>
                  <AlertDescription className="text-center">
                    Please set up your division and batch in your profile to view and mark attendance
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <Card>
                <ScrollArea className="h-[500px] rounded-md">
                  {timetable.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Subject</TableHead>
                          <TableHead>Theory</TableHead>
                          <TableHead>Lab</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {timetable.map(({ subject, type }) => (
                          <TableRow key={subject}>
                            <TableCell className="font-medium">{subject}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {["Present", "Absent"].map((value) => (
                                  <Button
                                    key={`theory-${value}`}
                                    onClick={() => handleAttendanceChange(subject, "theory", value)}
                                    size="sm"
                                    variant={attendanceData[subject]?.theory === value ? "default" : "outline"}
                                    className={cn(
                                      "w-24",
                                      attendanceData[subject]?.theory === value
                                        ? value === "Present"
                                          ? "bg-green-500 hover:bg-green-600"
                                          : "bg-red-500 hover:bg-red-600"
                                        : "",
                                    )}
                                    disabled={type !== "theory"}
                                  >
                                    {value}
                                  </Button>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {["Present", "Absent"].map((value) => (
                                  <Button
                                    key={`lab-${value}`}
                                    onClick={() => handleAttendanceChange(subject, "lab", value)}
                                    size="sm"
                                    variant={attendanceData[subject]?.lab === value ? "default" : "outline"}
                                    className={cn(
                                      "w-24",
                                      attendanceData[subject]?.lab === value
                                        ? value === "Present"
                                          ? "bg-green-500 hover:bg-green-600"
                                          : "bg-red-500 hover:bg-red-600"
                                        : "",
                                    )}
                                    disabled={type !== "lab"}
                                  >
                                    {value}
                                  </Button>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-6">
                      <Alert>
                        <AlertDescription className="text-center">
                          No subjects scheduled for {getCurrentDay}
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </ScrollArea>
              </Card>
            )}
          </div>
        </CardContent>
        <Separator />
        <CardFooter className="p-4">
          <Button onClick={saveAttendance} disabled={isSaving || !division || !batch} className="w-full" size="lg">
            {" "}
            {/* Updated Button */}
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Attendance"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default AttendancePage

