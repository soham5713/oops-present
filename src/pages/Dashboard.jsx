import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// Register chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

function Dashboard() {
  const [attendanceData, setAttendanceData] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().attendance) {
          setAttendanceData(docSnap.data().attendance);
          setIsLoaded(true);
        }
      }
    };
    fetchAttendanceData();
  }, []);

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

  const renderChartData = () => {
    const { present, absent, total } = calculateTotalAttendance();
    const presentPercentage = (present / total) * 100;
    const absentPercentage = (absent / total) * 100;

    return {
      labels: ["Present", "Absent"],
      datasets: [
        {
          data: [presentPercentage, absentPercentage],
          backgroundColor: ["green", "red"],
        },
      ],
    };
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80">
        <h1 className="text-2xl font-semibold mb-4 text-center">Dashboard</h1>
        <Pie data={renderChartData()} />
      </div>
    </div>
  );
}

export default Dashboard;
