import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { Pie, Bar } from "react-chartjs-2"; // Importing both Pie and Bar
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from "chart.js";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

function Dashboard() {
  const [attendanceData, setAttendanceData] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          setAttendanceData(userData.attendance || {});
          setSubjects(Object.keys(userData.subjects || {})); // Fetch subjects
          setIsLoaded(true);
        }
      }
    };
    fetchAttendanceData();
  }, []);

  // Calculate total attendance for pie chart
  const calculateTotalAttendance = () => {
    let present = 0;
    let total = 0;

    Object.values(attendanceData).forEach((dailyAttendance) => {
      Object.values(dailyAttendance).forEach(({ theory, lab }) => {
        if (theory === "Present") present += 1;
        if (lab === "Present") present += 1;
        total += 2; // 1 for theory, 1 for lab
      });
    });

    return { present, absent: total - present, total };
  };

  // Render data for Pie chart
  const renderPieChartData = () => {
    const { present, absent, total } = calculateTotalAttendance();
    const presentPercentage = (present / total) * 100;
    const absentPercentage = (absent / total) * 100;

    return {
      labels: ["Present", "Absent"],
      datasets: [
        {
          data: [presentPercentage, absentPercentage],
          backgroundColor: ["#34D399", "#EF4444"],
          borderWidth: 0, // Remove border
        },
      ],
    };
  };

  // Render data for the Double Bar Chart with percentage
  const renderBarChartData = () => {
    const labels = subjects; // Use subjects as labels
    const theoryPercentageData = [];
    const labPercentageData = [];

    subjects.forEach((subject) => {
      let theoryCount = 0;
      let labCount = 0;
      let totalCount = 0;

      Object.values(attendanceData).forEach((dailyAttendance) => {
        if (dailyAttendance[subject]) {
          if (dailyAttendance[subject].theory === "Present") theoryCount += 1;
          if (dailyAttendance[subject].lab === "Present") labCount += 1;
          totalCount += 1;
        }
      });

      // Calculate the percentage for each subject
      const theoryPercentage = (theoryCount / totalCount) * 100;
      const labPercentage = (labCount / totalCount) * 100;

      theoryPercentageData.push(theoryPercentage);
      labPercentageData.push(labPercentage);
    });

    return {
      labels: labels,
      datasets: [
        {
          label: "Theory Attendance (%)",
          data: theoryPercentageData,
          backgroundColor: "#3B82F6",
          barThickness: 35,
          borderRadius: 8,
          hoverBackgroundColor: "#1D4ED8", // Add hover effect
        },
        {
          label: "Lab Attendance (%)",
          data: labPercentageData,
          backgroundColor: "#FF9F00",
          barThickness: 35,
          borderRadius: 8,
          hoverBackgroundColor: "#FB923C", // Add hover effect
        },
      ],
    };
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-[90vh]">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-blue-500"></div> {/* Spinner loader */}
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[90vh] p-4"> {/* Adjust for fixed Navbar */}
      <div className="w-full max-w-5xl space-y-8">
        {/* Charts container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pie chart for total attendance percentage */}
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h1 className="text-2xl font-semibold mb-6 text-center text-gray-800">Total Attendance</h1>
            <Pie
              data={renderPieChartData()}
              options={{
                responsive: true,
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: (tooltipItem) => `${tooltipItem.label}: ${tooltipItem.raw.toFixed(1)}%`,
                    },
                  },
                  legend: {
                    labels: {
                      font: { size: 14, weight: "bold" },
                      color: "#4B5563",
                    },
                  },
                },
              }}
            />
          </div>

          {/* Bar graph for individual subject attendance */}
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h1 className="text-2xl font-semibold mb-6 text-center text-gray-800">Subject-wise Attendance</h1>
            <div className="h-80">
              <Bar
                data={renderBarChartData()}
                options={{
                  responsive: true,
                  scales: {
                    x: {
                      ticks: { font: { size: 12 }, color: "#4B5563" },
                      title: {
                        display: true,
                        text: "Subjects",
                        font: { size: 14, weight: "bold" },
                        color: "#4B5563",
                      },
                    },
                    y: {
                      max: 100,
                      ticks: { font: { size: 12 }, color: "#4B5563" },
                      title: {
                        display: true,
                        text: "Attendance (%)",
                        font: { size: 14, weight: "bold" },
                        color: "#4B5563",
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      labels: {
                        font: { size: 12, weight: "bold" },
                        color: "#4B5563",
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
