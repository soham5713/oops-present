"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { auth, db } from "../firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CalendarIcon, CheckCircle, XCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

import { getDaySubjects } from "../config/timetable"

function AttendancePage() {
  const [allAttendanceData, setAllAttendanceData] = useState({})
  const [currentDateAttendance, setCurrentDateAttendance] = useState({})
  const [date, setDate] = useState(new Date())
  const [division, setDivision] = useState("")
  const [batch, setBatch] = useState("")
  const [userName, setUserName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState("")
  const navigate = useNavigate()

  const getCurrentDay = useMemo(() => {
    return date.toLocaleString("en-US", { weekday: "long" })
  }, [date])

  const timetable = useMemo(() => {
    return division && batch ? getDaySubjects(division, batch, getCurrentDay) : []
  }, [division, batch, getCurrentDay])

  const loadAttendanceData = useCallback(
    async (user) => {
      setIsLoading(true)
      try {
        const userRef = doc(db, "users", user.uid)
        const docSnap = await getDoc(userRef)

        if (docSnap.exists()) {
          const userData = docSnap.data()
          setDivision(userData.division || "")
          setBatch(userData.batch || "")
          setAllAttendanceData(userData.attendance || {})
          setUserName(userData.name || "")

          const dateStr = format(date, "yyyy-MM-dd")
          const storedAttendance = userData.attendance?.[dateStr] || {}

          const initialAttendanceData = {}
          timetable.forEach(({ subject, type }) => {
            initialAttendanceData[subject] = {
              theory: type.includes("theory") ? storedAttendance[subject]?.theory || "" : "",
              lab: type.includes("lab") ? storedAttendance[subject]?.lab || "" : "",
            }
          })
          setCurrentDateAttendance(initialAttendanceData)
        } else {
          setError("User data not found. Please set up your profile.")
        }
      } catch (error) {
        console.error("Error loading attendance data:", error)
        setError("Failed to load attendance data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    },
    [date, timetable],
  )

  useEffect(() => {
    const user = auth.currentUser
    if (!user) {
      navigate("/signin")
      return
    }

    loadAttendanceData(user)
  }, [navigate, loadAttendanceData])

  useEffect(() => {
    if (allAttendanceData && Object.keys(allAttendanceData).length > 0) {
      const dateStr = format(date, "yyyy-MM-dd")
      const storedAttendance = allAttendanceData[dateStr] || {}

      const initialAttendanceData = {}
      timetable.forEach(({ subject, type }) => {
        initialAttendanceData[subject] = {
          theory: type.includes("theory") ? storedAttendance[subject]?.theory || "" : "",
          lab: type.includes("lab") ? storedAttendance[subject]?.lab || "" : "",
        }
      })
      setCurrentDateAttendance(initialAttendanceData)
    }
  }, [date, allAttendanceData, timetable])

  const handleAttendanceChange = (subject, type, value) => {
    setCurrentDateAttendance((prev) => {
      const newData = { ...prev }
      if (!newData[subject]) {
        newData[subject] = {}
      }
      newData[subject][type] = value === newData[subject][type] ? "" : value

      // Remove empty objects
      if (Object.values(newData[subject]).every((v) => v === "")) {
        delete newData[subject]
      }

      return newData
    })
  }

  const saveAttendance = async () => {
    if (!division || !batch) {
      setError("Please select your division and batch first")
      return
    }

    setIsSaving(true)
    setError("")
    try {
      const user = auth.currentUser
      if (!user) throw new Error("User not authenticated")

      const dateStr = format(date, "yyyy-MM-dd")

      const updatedAttendance = {
        ...allAttendanceData,
        [dateStr]: currentDateAttendance,
      }

      await setDoc(
        doc(db, "users", user.uid),
        {
          attendance: updatedAttendance,
          name: userName,
          lastUpdated: new Date().toISOString(),
        },
        { merge: true },
      )

      setAllAttendanceData(updatedAttendance)
      setSuccess("Attendance and user name saved successfully!")

      setTimeout(() => {
        setSuccess("")
      }, 3000)
    } catch (error) {
      console.error("Error saving attendance:", error)
      setError(`Failed to save attendance: ${error.message}. Please try again.`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDateChange = (newDate) => {
    if (newDate) {
      setDate(newDate)
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

          <div className="mb-6">
            <Label htmlFor="userName">Your Name</Label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <div className="grid sm:grid-cols-[280px,1fr] gap-6">
            <div className="space-y-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateChange}
                className="rounded-md border w-full justify-center flex"
              />
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
                                    variant={currentDateAttendance[subject]?.theory === value ? "default" : "outline"}
                                    className={cn(
                                      "w-full sm:w-24",
                                      currentDateAttendance[subject]?.theory === value
                                        ? value === "Present"
                                          ? "bg-green-500 hover:bg-green-600"
                                          : "bg-red-500 hover:bg-red-600"
                                        : "",
                                    )}
                                    disabled={!type.includes("theory")}
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
                                    variant={currentDateAttendance[subject]?.lab === value ? "default" : "outline"}
                                    className={cn(
                                      "w-full sm:w-24",
                                      currentDateAttendance[subject]?.lab === value
                                        ? value === "Present"
                                          ? "bg-green-500 hover:bg-green-600"
                                          : "bg-red-500 hover:bg-red-600"
                                        : "",
                                    )}
                                    disabled={!type.includes("lab")}
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
          <Button
            onClick={saveAttendance}
            disabled={isSaving || !division || !batch}
            className="w-full"
            size="lg"
            aria-label="Save Attendance"
          >
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

