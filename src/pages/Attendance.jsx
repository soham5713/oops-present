import { useState, useEffect, useMemo } from "react"
import { auth, db } from "../firebase"
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CalendarIcon, CheckCircle, XCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

import { getDivisionTimetable } from "../config/timetable"

function AttendancePage() {
  const [attendanceData, setAttendanceData] = useState({})
  const [date, setDate] = useState(new Date())
  const [division, setDivision] = useState("")
  const [batch, setBatch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState("")
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

        const userRef = doc(db, "users", user.uid)

        const unsubscribe = onSnapshot(
          userRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data()
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
            } else {
              setError("User data not found. Please set up your profile.")
            }
            setIsLoading(false)
          },
          (err) => {
            setError("Failed to load user data. Please try again later.")
            setIsLoading(false)
          },
        )

        return () => unsubscribe()
      } catch (error) {
        setError(error.message || "Failed to load attendance data")
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
    if (!division || !batch) {
      setError("Please select your division and batch first")
      return
    }

    setIsSaving(true)
    try {
      const user = auth.currentUser
      if (!user) throw new Error("User not authenticated")

      const userRef = doc(db, "users", user.uid)
      const dateStr = date.toISOString().split("T")[0]

      const docSnap = await getDoc(userRef)
      if (!docSnap.exists()) throw new Error("User document not found")

      const userData = docSnap.data()
      const updatedAttendance = {
        ...userData.attendance,
        [dateStr]: attendanceData,
      }

      await setDoc(
        userRef,
        {
          attendance: updatedAttendance,
          lastUpdated: new Date().toISOString(),
        },
        { merge: true },
      )

      setSuccess("Attendance saved successfully!")

      setTimeout(() => {
        setSuccess("")
      }, 3000)
    } catch (error) {
      setError("Failed to save attendance. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Daily Attendance</CardTitle>
              <CardDescription className="flex items-center mt-1">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {format(date, "EEEE, MMMM d, yyyy")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {success && (
            <Alert className="mb-6">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid sm:grid-cols-[280px,1fr] gap-6">
            <div className="space-y-4">
              <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border w-full justify-center flex" />
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
                <ScrollArea className="h-min rounded-md">
                  {timetable.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[150px] text-center">Subject</TableHead>
                          <TableHead className="w-[150px] text-center">Theory</TableHead>
                          <TableHead className="w-[150px] text-center">Lab</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {timetable.map(({ subject, type }) => (
                          <TableRow key={subject}>
                            <TableCell className="font-medium text-center">{subject}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2 items-center justify-center">
                                {["Present", "Absent"].map((value) => (
                                  <Button
                                    key={`theory-${value}`}
                                    onClick={() => handleAttendanceChange(subject, "theory", value)}
                                    size="sm"
                                    variant={attendanceData[subject]?.theory === value ? "default" : "outline"}
                                    className={cn(
                                      "w-full sm:w-24",
                                      attendanceData[subject]?.theory === value
                                        ? value === "Present"
                                          ? "bg-green-500 hover:bg-green-600"
                                          : "bg-red-500 hover:bg-red-600"
                                        : "",
                                    )}
                                    disabled={type !== "theory"}
                                  >
                                    {value === "Present" ? (
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                    ) : (
                                      <XCircle className="w-4 h-4 mr-2" />
                                    )}
                                    {value}
                                  </Button>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2 items-center justify-center">
                                {["Present", "Absent"].map((value) => (
                                  <Button
                                    key={`lab-${value}`}
                                    onClick={() => handleAttendanceChange(subject, "lab", value)}
                                    size="sm"
                                    variant={attendanceData[subject]?.lab === value ? "default" : "outline"}
                                    className={cn(
                                      "w-full sm:w-24",
                                      attendanceData[subject]?.lab === value
                                        ? value === "Present"
                                          ? "bg-green-500 hover:bg-green-600"
                                          : "bg-red-500 hover:bg-red-600"
                                        : "",
                                    )}
                                    disabled={type !== "lab"}
                                  >
                                    {value === "Present" ? (
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                    ) : (
                                      <XCircle className="w-4 h-4 mr-2" />
                                    )}
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

