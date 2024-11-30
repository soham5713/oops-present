import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

function AttendancePage() {
  const [subjects, setSubjects] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [date, setDate] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().subjects) {
          setSubjects(Object.keys(docSnap.data().subjects));
          setIsLoaded(true);
        }
      }
    };
    fetchSubjects();
  }, []);

  const handleAttendanceChange = (subject, type, value) => {
    setAttendanceData((prev) => ({
      ...prev,
      [subject]: { ...prev[subject], [type]: value },
    }));
  };

  const saveAttendance = async () => {
    if (!date) {
      alert("Please select a date for attendance!");
      return;
    }

    const user = auth.currentUser;
    if (user) {
      const db = getFirestore();
      const docRef = doc(db, "users", user.uid);

      try {
        const docSnap = await getDoc(docRef);
        const userData = docSnap.exists() ? docSnap.data() : {};
        const updatedAttendance = userData.attendance || {};

        // Save attendance for the selected date
        updatedAttendance[date] = attendanceData;

        await updateDoc(docRef, { attendance: updatedAttendance });
        alert("Attendance saved successfully!");
      } catch (error) {
        console.error("Error saving attendance:", error);
      }
    }
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80">
        <h1 className="text-2xl font-semibold mb-4 text-center">Attendance</h1>
        <div className="mb-4">
          <label>Select Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
        </div>
        {subjects.map((subject) => (
          <div key={subject} className="mb-4">
            <h3 className="text-xl">{subject}</h3>
            <div className="flex justify-between mb-2">
              <label>Theory</label>
              <select
                value={attendanceData[subject]?.theory || ""}
                onChange={(e) =>
                  handleAttendanceChange(subject, "theory", e.target.value)
                }
              >
                <option value="">Select</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
            <div className="flex justify-between mb-2">
              <label>Lab</label>
              <select
                value={attendanceData[subject]?.lab || ""}
                onChange={(e) =>
                  handleAttendanceChange(subject, "lab", e.target.value)
                }
              >
                <option value="">Select</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
          </div>
        ))}
        <button
          onClick={saveAttendance}
          className="w-full p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Save Attendance
        </button>
      </div>
    </div>
  );
}

export default AttendancePage;
