import React, { useState, useEffect, useCallback } from "react"
import { auth, db } from "../firebase"
import { doc, onSnapshot } from "firebase/firestore"
import { ErrorBoundary } from "react-error-boundary"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { Divisions, AllSubjects, hasSubject, getDivisionTimetable } from "../config/timetable"

const ErrorFallback = ({ error }) => (
  <Alert variant="destructive">
    <AlertDescription>Something went wrong: {error.message}</AlertDescription>
  </Alert>
)

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
          const dayOfWeek = new Date(date).toLocaleString("en-US", { weekday: "long" })
          const dayTimetable = getDivisionTimetable(division, batch, dayOfWeek)

          if (theory !== undefined) {
            semesterStats[subject].theory.total++
            monthlyStats[monthKey][subject].theory.total++
            if (theory === "Present") {
              semesterStats[subject].theory.present++
              monthlyStats[monthKey][subject].theory.present++
            }
          }

          if (lab !== undefined) {
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

  const prepareChartData = useCallback(
    (stats) => {
      return Object.entries(stats).map(([subject, data]) => ({
        subject,
        theoryAttendance: calculatePercentage(data.theory.present, data.theory.total),
        labAttendance: calculatePercentage(data.lab.present, data.lab.total),
        theoryTotal: data.theory.total,
        labTotal: data.lab.total,
      }))
    },
    [calculatePercentage],
  )

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
  const semesterChartData = prepareChartData(semesterStats)
  const defaulters = detectDefaulters(semesterStats)

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="container mx-auto py-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Attendance Dashboard</CardTitle>
            <CardDescription>Track and analyze your attendance across subjects</CardDescription>
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
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Subject</TableHead>
                              <TableHead>Theory Attendance</TableHead>
                              <TableHead>Lab Attendance</TableHead>
                              <TableHead>Theory Total</TableHead>
                              <TableHead>Lab Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(stats).map(([subject, data]) => (
                              <TableRow key={subject}>
                                <TableCell>{subject}</TableCell>
                                <TableCell>
                                  {calculatePercentage(data.theory.present, data.theory.total).toFixed(2)}%
                                </TableCell>
                                <TableCell>
                                  {calculatePercentage(data.lab.present, data.lab.total).toFixed(2)}%
                                </TableCell>
                                <TableCell>{data.theory.total}</TableCell>
                                <TableCell>{data.lab.total}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
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
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Theory</TableHead>
                            <TableHead>Lab</TableHead>
                            <TableHead>Theory Total</TableHead>
                            <TableHead>Lab Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(defaulters).map(([subject, data]) => (
                            <TableRow key={subject}>
                              <TableCell>{subject}</TableCell>
                              <TableCell>{data.theory ? "Defaulter" : "OK"}</TableCell>
                              <TableCell>{data.lab ? "Defaulter" : "OK"}</TableCell>
                              <TableCell>{data.theoryTotal}</TableCell>
                              <TableCell>{data.labTotal}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  )
}

export default Dashboard
