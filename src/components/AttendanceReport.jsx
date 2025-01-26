import React from "react"
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { format } from "date-fns"

// Define styles for PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: "#3b82f6",
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: "column",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3b82f6",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  section: {
    margin: 10,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3b82f6",
    marginBottom: 10,
    borderBottom: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 5,
  },
  table: {
    display: "table",
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
    alignItems: "center",
    minHeight: 24,
  },
  tableHeader: {
    backgroundColor: "#f3f4f6",
  },
  tableCol: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableCell: {
    fontSize: 9,
    color: "#374151",
    textAlign: "center",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#6b7280",
    width: 80,
  },
  infoValue: {
    fontSize: 10,
    color: "#374151",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
  },
  defaulterWarning: {
    color: "#ef4444",
    fontWeight: "bold",
  },
})

const AttendanceReport = ({ attendanceData, userInfo, defaulters }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Attendance Report</Text>
            <Text style={styles.subtitle}>Generated on {format(new Date(), "MMMM d, yyyy")}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Student Information</Text>
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1 }}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{userInfo.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{userInfo.email}</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Division:</Text>
                <Text style={styles.infoValue}>{userInfo.division}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Batch:</Text>
                <Text style={styles.infoValue}>{userInfo.batch}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance Summary</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={[styles.tableCol, { width: "20%" }]}>
                <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Subject</Text>
              </View>
              <View style={[styles.tableCol, { width: "20%" }]}>
                <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Theory Attended/Conducted</Text>
              </View>
              <View style={[styles.tableCol, { width: "20%" }]}>
                <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Labs Attended/Conducted</Text>
              </View>
              <View style={[styles.tableCol, { width: "20%" }]}>
                <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Theory %</Text>
              </View>
              <View style={[styles.tableCol, { width: "20%" }]}>
                <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Lab %</Text>
              </View>
            </View>
            {Object.entries(attendanceData).map(([subject, data]) => {
              const theoryLecturesConducted = data.theory.total
              const theoryLecturesAttended = data.theory.present
              const labLecturesConducted = data.lab.total
              const labLecturesAttended = data.lab.present
              const theoryPercentage = (theoryLecturesAttended / theoryLecturesConducted) * 100 || 0
              const labPercentage = (labLecturesAttended / labLecturesConducted) * 100 || 0

              return (
                <View style={styles.tableRow} key={subject}>
                  <View style={[styles.tableCol, { width: "20%" }]}>
                    <Text style={styles.tableCell}>{subject}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: "20%" }]}>
                    <Text style={styles.tableCell}>{`${theoryLecturesAttended}/${theoryLecturesConducted}`}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: "20%" }]}>
                    <Text style={styles.tableCell}>{`${labLecturesAttended}/${labLecturesConducted}`}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: "20%" }]}>
                    <Text style={[styles.tableCell, { color: theoryPercentage < 75 ? "#ef4444" : "#22c55e" }]}>
                      {`${theoryPercentage.toFixed(1)}%`}
                    </Text>
                  </View>
                  <View style={[styles.tableCol, { width: "20%" }]}>
                    <Text style={[styles.tableCell, { color: labPercentage < 100 ? "#ef4444" : "#22c55e" }]}>
                      {`${labPercentage.toFixed(1)}%`}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Defaulters List</Text>
          {Object.keys(defaulters).length > 0 ? (
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <View style={[styles.tableCol, { width: "25%" }]}>
                  <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Subject</Text>
                </View>
                <View style={[styles.tableCol, { width: "25%" }]}>
                  <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Theory</Text>
                </View>
                <View style={[styles.tableCol, { width: "25%" }]}>
                  <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Lab</Text>
                </View>
                <View style={[styles.tableCol, { width: "25%" }]}>
                  <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Reason</Text>
                </View>
              </View>
              {Object.entries(defaulters).map(([subject, data]) => (
                <View style={styles.tableRow} key={subject}>
                  <View style={[styles.tableCol, { width: "25%" }]}>
                    <Text style={styles.tableCell}>{subject}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: "25%" }]}>
                    <Text style={[styles.tableCell, data.theory && styles.defaulterWarning]}>
                      {data.theory ? "Defaulter" : "OK"}
                    </Text>
                  </View>
                  <View style={[styles.tableCol, { width: "25%" }]}>
                    <Text style={[styles.tableCell, data.lab && styles.defaulterWarning]}>
                      {data.lab ? "Defaulter" : "OK"}
                    </Text>
                  </View>
                  <View style={[styles.tableCol, { width: "25%" }]}>
                    <Text style={styles.tableCell}>
                      {data.theory && data.lab ? "Both" : data.theory ? "Theory" : "Lab"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.tableCell, { color: "#22c55e" }]}>No defaulters found. Keep up the good work!</Text>
          )}
        </View>

        <Text style={styles.footer}>
          This report is generated automatically and is valid as of the date of generation.
        </Text>
      </Page>
    </Document>
  )
}

export default AttendanceReport

