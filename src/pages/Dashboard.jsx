import { useState, useEffect, useCallback } from "react"
import { auth, db } from "../firebase"
import { doc, onSnapshot } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, FileDown } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PDFDownloadLink } from "@react-pdf/renderer"
import AttendanceReport from "../components/AttendanceReport"

import { AllSubjects, hasSubject, getDivisionTimetable } from "../config/timetable"

const AttendanceCard = ({ subject, theoryPercentage, labPercentage, theoryTotal, labTotal }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-semibold">{subject}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Theory ({theoryTotal} lectures)</span>
          <span className={`font-medium ${theoryPercentage < 75 ? "text-destructive" : "text-primary"}`}>
            {theoryPercentage.toFixed(1)}%
          </span>
        </div>
        <Progress value={theoryPercentage} className="h-2" />
      </div>
      <div className="space-y-2 mt-2">
        <div className="flex justify-between text-sm">
          <span>Lab ({labTotal} sessions)</span>
          <span className={`font-medium ${labPercentage < 100 ? "text-destructive" : "text-primary"}`}>
            {labPercentage.toFixed(1)}%
          </span>
        </div>
        <Progress value={labPercentage} className="h-2" />
      </div>
    </CardContent>
  </Card>
)

const Dashboard = () => {
  const [attendanceData, setAttendanceData] = useState({})
  const [division, setDivision] = useState("")
  const [batch, setBatch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) {
      setError("Please sign in to view your attendance")
      setLoading(false)
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
          setAttendanceData(userData.attendance || {})
        } else {
          setError("No attendance data found. Please mark your attendance first.")
        }
        setLoading(false)
      },
      (err) => {
        setError("Failed to fetch attendance data. Please try again later.")
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  const calculateAttendance = useCallback(() => {
    const semesterStats = {}
    const monthlyStats = {}

    AllSubjects.forEach((subject) => {
      if (hasSubject(division, batch, subject)) {
        semesterStats[subject] = { theory: { present: 0, total: 0 }, lab: { present: 0, total: 0 } }
      }
    })

    Object.entries(attendanceData).forEach(([date, dailyRecord]) => {
      const [year, month] = date.split("-")
      const monthKey = `${year}-${month}`

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = JSON.parse(JSON.stringify(semesterStats))
      }

      Object.entries(dailyRecord).forEach(([subject, { theory, lab }]) => {
        if (semesterStats[subject]) {
          if (theory) {
            semesterStats[subject].theory.total++
            monthlyStats[monthKey][subject].theory.total++
            if (theory === "Present") {
              semesterStats[subject].theory.present++
              monthlyStats[monthKey][subject].theory.present++
            }
          }

          if (lab) {
            semesterStats[subject].lab.total++
            monthlyStats[monthKey][subject].lab.total++
            if (lab === "Present") {
              semesterStats[subject].lab.present++
              monthlyStats[monthKey][subject].lab.present++
            }
          }
        }
      })
    })

    return { semesterStats, monthlyStats }
  }, [attendanceData, division, batch])

  const calculatePercentage = useCallback((present, total) => {
    return total > 0 ? (present / total) * 100 : 0
  }, [])

  const detectDefaulters = useCallback(
    (stats) => {
      const defaulters = {}
      Object.entries(stats).forEach(([subject, data]) => {
        const theoryPercentage = calculatePercentage(data.theory.present, data.theory.total)
        const labPercentage = calculatePercentage(data.lab.present, data.lab.total)
        if (theoryPercentage < 75 || labPercentage < 100) {
          defaulters[subject] = {
            theory: theoryPercentage < 75,
            lab: labPercentage < 100,
            theoryPercentage,
            labPercentage,
            theoryTotal: data.theory.total,
            labTotal: data.lab.total,
          }
        }
      })
      return defaulters
    },
    [calculatePercentage],
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const { semesterStats, monthlyStats } = calculateAttendance()
  const defaulters = detectDefaulters(semesterStats)

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Attendance Dashboard</CardTitle>
              <CardDescription>Track and analyze your attendance across subjects</CardDescription>
            </div>
            <PDFDownloadLink
              document={
                <AttendanceReport
                  attendanceData={semesterStats}
                  userInfo={{
                    name: auth.currentUser?.displayName || "Student Name",
                    email: auth.currentUser?.email || "student@example.com",
                    division,
                    batch,
                  }}
                  defaulters={defaulters}
                />
              }
              fileName="attendance_report.pdf"
            >
              {({ blob, url, loading, error }) => (
                <Button disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                  {loading ? "Generating..." : "Download Report"}
                </Button>
              )}
            </PDFDownloadLink>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="defaulters">Defaulters</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(semesterStats).map(([subject, stats]) => (
                    <AttendanceCard
                      key={subject}
                      subject={subject}
                      theoryPercentage={calculatePercentage(stats.theory.present, stats.theory.total)}
                      labPercentage={calculatePercentage(stats.lab.present, stats.lab.total)}
                      theoryTotal={stats.theory.total}
                      labTotal={stats.lab.total}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="monthly" className="space-y-6">
                {Object.entries(monthlyStats).map(([month, stats]) => (
                  <Card key={month}>
                    <CardHeader>
                      <CardTitle>{month}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-center">Subject</TableHead>
                              <TableHead className="text-center">Theory Attendance</TableHead>
                              <TableHead className="text-center">Lab Attendance</TableHead>
                              <TableHead className="text-center">Theory Total</TableHead>
                              <TableHead className="text-center">Lab Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(stats).map(([subject, data]) => (
                              <TableRow key={subject} className="text-center">
                                <TableCell className="text-center">{subject}</TableCell>
                                <TableCell className="text-center">
                                  {calculatePercentage(data.theory.present, data.theory.total).toFixed(2)}%
                                </TableCell>
                                <TableCell className="text-center">
                                  {calculatePercentage(data.lab.present, data.lab.total).toFixed(2)}%
                                </TableCell>
                                <TableCell className="text-center">{data.theory.total}</TableCell>
                                <TableCell className="text-center">{data.lab.total}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="defaulters" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Defaulters List</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-center">Subject</TableHead>
                            <TableHead className="text-center">Theory</TableHead>
                            <TableHead className="text-center">Lab</TableHead>
                            <TableHead className="text-center">Theory Total</TableHead>
                            <TableHead className="text-center">Lab Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(defaulters).map(([subject, data]) => (
                            <TableRow key={subject}>
                              <TableCell className="text-center">{subject}</TableCell>
                              <TableCell className="text-center">{data.theory ? `${data.theoryPercentage.toFixed(2)}%` : "OK"}</TableCell>
                              <TableCell className="text-center">{data.lab ? `${data.labPercentage.toFixed(2)}%` : "OK"}</TableCell>
                              <TableCell className="text-center">{data.theoryTotal}</TableCell>
                              <TableCell className="text-center">{data.labTotal}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
