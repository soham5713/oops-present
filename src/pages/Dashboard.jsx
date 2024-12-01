import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from "chart.js";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

function Dashboard() {
  const [attendanceData, setAttendanceData] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
    
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const attendanceData = userData.attendance || {};
          
          // Extract unique subjects from attendance data
          const uniqueSubjects = new Set();
          Object.values(attendanceData).forEach((dailyAttendance) => {
            Object.keys(dailyAttendance).forEach((subject) => {
              uniqueSubjects.add(subject);
            });
          });
    
          setAttendanceData(attendanceData);
          setSubjects(Array.from(uniqueSubjects));
          setIsLoaded(true);
        }
      }
    };
    fetchAttendanceData();

    // Check window width to determine if the device is mobile
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768); // Adjust 768px breakpoint as needed
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize); // Listen for window resize
    return () => window.removeEventListener("resize", handleResize); // Clean up listener
  }, []);

  const calculateTotalAttendance = () => {
    let present = 0;
    let total = 0;

    Object.values(attendanceData).forEach((dailyAttendance) => {
      Object.values(dailyAttendance).forEach(({ theory, lab }) => {
        if (theory === "Present") present += 1;
        if (lab === "Present") present += 1;
        total += 2;
      });
    });

    return { present, absent: total - present, total };
  };

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
          borderWidth: 0,
        },
      ],
    };
  };

  const renderBarChartData = () => {
    // Get subjects from attendance data if not already set
    const labels = subjects.length > 0 ? subjects : Object.keys(attendanceData[Object.keys(attendanceData)[0]] || {});
    const theoryPercentageData = [];
    const labPercentageData = [];
  
    labels.forEach((subject) => {
      let theoryCount = 0;
      let labCount = 0;
      let totalTheoryCount = 0;
      let totalLabCount = 0;
  
      Object.values(attendanceData).forEach((dailyAttendance) => {
        if (dailyAttendance[subject]) {
          if (dailyAttendance[subject].theory === "Present") {
            theoryCount += 1;
          }
          totalTheoryCount += 1;
  
          if (dailyAttendance[subject].lab === "Present") {
            labCount += 1;
          }
          totalLabCount += 1;
        }
      });
  
      // Prevent division by zero
      const theoryPercentage = totalTheoryCount > 0 ? (theoryCount / totalTheoryCount) * 100 : 0;
      const labPercentage = totalLabCount > 0 ? (labCount / totalLabCount) * 100 : 0;
  
      theoryPercentageData.push(theoryPercentage || 0);
      labPercentageData.push(labPercentage || 0);
    });
  
    return {
      labels: labels,
      datasets: [
        {
          label: "Theory Attendance (%)",
          data: theoryPercentageData,
          backgroundColor: "#3B82F6",
          barThickness: isMobile ? 20 : 25,
          hoverBackgroundColor: "#1D4ED8",
        },
        {
          label: "Lab Attendance (%)",
          data: labPercentageData,
          backgroundColor: "#FF9F00",
          barThickness: isMobile ? 20 : 25,
          hoverBackgroundColor: "#FB923C",
        },
      ],
    };
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-[90vh]">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[90vh] p-4">
      <div className="w-full max-w-5xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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