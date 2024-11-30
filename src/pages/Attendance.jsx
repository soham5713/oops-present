import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function AttendancePage() {
  const [subjects, setSubjects] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [date, setDate] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

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

        // Redirect to the dashboard
        navigate("/dashboard");
      } catch (error) {
        console.error("Error saving attendance:", error);
      }
    }
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
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg w-full max-w-3xl mt-5 mb-5">
        <h1 className="text-2xl md:text-3xl font-semibold text-center text-gray-800 mb-6">
          Attendance Tracker
        </h1>

        <div className="mb-6">
          <label htmlFor="date" className="block text-lg text-gray-700 mb-2">
            Select Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {subjects.map((subject) => (
          <div key={subject} className="mb-6">
            <h3 className="text-lg md:text-xl font-medium text-gray-700 mb-4">{subject}</h3>

            <div className="flex flex-col md:flex-row md:space-x-6 mb-6">
              {/* Theory Section */}
              <div className="w-full md:w-1/2 mb-4 md:mb-0">
                <h4 className="text-lg text-gray-700 mb-2">Theory</h4>
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleAttendanceChange(subject, "theory", "Present")}
                    className={`w-full md:w-32 py-2 rounded-lg text-white ${
                      attendanceData[subject]?.theory === "Present"
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  >
                    Present
                  </button>
                  <button
                    onClick={() => handleAttendanceChange(subject, "theory", "Absent")}
                    className={`w-full md:w-32 py-2 rounded-lg text-white ${
                      attendanceData[subject]?.theory === "Absent"
                        ? "bg-red-500"
                        : "bg-gray-300"
                    }`}
                  >
                    Absent
                  </button>
                </div>
              </div>

              {/* Lab Section */}
              <div className="w-full md:w-1/2">
                <h4 className="text-lg text-gray-700 mb-2">Lab</h4>
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleAttendanceChange(subject, "lab", "Present")}
                    className={`w-full md:w-32 py-2 rounded-lg text-white ${
                      attendanceData[subject]?.lab === "Present"
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  >
                    Present
                  </button>
                  <button
                    onClick={() => handleAttendanceChange(subject, "lab", "Absent")}
                    className={`w-full md:w-32 py-2 rounded-lg text-white ${
                      attendanceData[subject]?.lab === "Absent"
                        ? "bg-red-500"
                    : "bg-gray-300"
                    }`}
                  >
                    Absent
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={saveAttendance}
          className="w-full py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition duration-200"
        >
          Save Attendance
        </button>
      </div>
    </div>
  );
}

export default AttendancePage;
