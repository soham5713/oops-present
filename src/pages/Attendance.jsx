import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// Dummy timetable data (same as in SubjectSetup.jsx)
const dummyTimetable = {
  A: {
    Monday: ["Math", "Physics", "Chemistry", "English"],
    Tuesday: ["Biology", "Math", "History", "PE"],
    Wednesday: ["Physics", "Chemistry", "English", "CS"],
    Thursday: ["History", "Biology", "Math", "PE"],
    Friday: ["CS", "Physics", "Chemistry", "English"],
    Saturday: ["Math", "Sports", "Lab", "History"],
    Sunday: ["Sports", "Lab", "English", "History"],
  },
  B: {
    Monday: ["English", "History", "PE", "Math"],
    Tuesday: ["Physics", "Chemistry", "CS", "Biology"],
    Wednesday: ["Math", "PE", "History", "English"],
    Thursday: ["CS", "Biology", "Physics", "Chemistry"],
    Friday: ["Math", "English", "PE", "History"],
    Saturday: ["Lab", "Sports", "Math", "Physics"],
    Sunday: ["Physics", "Chemistry", "English", "CS"],
  },
  C: {
    Monday: ["CS", "Physics", "Biology", "Math"],
    Tuesday: ["Chemistry", "English", "History", "PE"],
    Wednesday: ["Math", "Biology", "Physics", "CS"],
    Thursday: ["PE", "History", "Chemistry", "English"],
    Friday: ["Biology", "Math", "Physics", "CS"],
    Saturday: ["Sports", "Lab", "English", "History"],
    Sunday: ["Math", "Sports", "Lab", "History"],
  },
};

function AttendancePage() {
  const [subjects, setSubjects] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [date, setDate] = useState("");
  const [division, setDivision] = useState("");
  const [timetable, setTimetable] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Function to get the current day
  const getCurrentDay = () => {
    return new Date().toLocaleString("en-US", { weekday: "long" });
  };

  // Function to get subjects for a specific day
  const getSubjectsForDay = (division, day) => {
    return dummyTimetable[division]?.[day] || [];
  };

  useEffect(() => {
    const fetchUserDivisionAndTimetable = async () => {
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const userRef = doc(db, "users", user.uid);

        try {
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userDivision = userData.division || "";
            setDivision(userDivision);

            // Set the date to today by default
            const today = new Date().toISOString().split('T')[0];
            setDate(today);

            // Get subjects for the current day
            const currentDay = getCurrentDay();
            const currentDaySubjects = getSubjectsForDay(userDivision, currentDay);
            setTimetable(currentDaySubjects);

            // Initialize attendance data for current day subjects
            const initialAttendanceData = {};
            currentDaySubjects.forEach((subject) => {
              initialAttendanceData[subject] = {
                theory: userData.attendance?.[today]?.[subject]?.theory || "",
                lab: userData.attendance?.[today]?.[subject]?.lab || "",
              };
            });
            setAttendanceData(initialAttendanceData);
            setSubjects(currentDaySubjects);

            setIsLoaded(true);
          }
        } catch (error) {
          console.error("Error fetching user data: ", error);
          setError("Error fetching data. Please try again later.");
        }
      }
    };

    fetchUserDivisionAndTimetable();
  }, []); // Empty dependency array to run only once on component mount

  useEffect(() => {
    // This effect runs when the date changes
    if (division && date) {
      const selectedDay = new Date(date).toLocaleString("en-US", { weekday: "long" });
      const daySubjects = getSubjectsForDay(division, selectedDay);
      setTimetable(daySubjects);

      // Reinitialize attendance data for the selected day
      const initialAttendanceData = {};
      daySubjects.forEach((subject) => {
        initialAttendanceData[subject] = {
          theory: "",
          lab: "",
        };
      });
      setAttendanceData(initialAttendanceData);
      setSubjects(daySubjects);
    }
  }, [date, division]);

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

        // Update attendance for the selected date
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

  return (
    <div className="flex justify-center items-center min-h-[90vh] p-4">
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg w-full max-w-3xl mt-5 mb-5">
        <h1 className="text-2xl md:text-3xl font-semibold text-center text-gray-800 mb-6">
          Attendance Tracker
        </h1>

        {error && (
          <div className="mb-4 text-red-500 text-center">
            <span>{error}</span>
          </div>
        )}

        {/* Date Selection */}
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

        {/* Timetable and Attendance Input */}
        {isLoaded && division && timetable.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700">
              {new Date(date).toLocaleString("en-US", { weekday: "long" })}'s Timetable:
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="font-semibold">Subject</div>
              <div className="font-semibold">Theory</div>
              <div className="font-semibold">Lab</div>
              {timetable.map((subject, index) => (
                <React.Fragment key={index}>
                  <div>{subject}</div>
                  <div className="flex space-x-4">
                    {/* Theory Attendance */}
                    <button
                      onClick={() => handleAttendanceChange(subject, "theory", "Present")}
                      className={`w-20 py-2 rounded-lg text-white ${attendanceData[subject]?.theory === "Present" ? "bg-green-500" : "bg-gray-300"}`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => handleAttendanceChange(subject, "theory", "Absent")}
                      className={`w-20 py-2 rounded-lg text-white ${attendanceData[subject]?.theory === "Absent" ? "bg-red-500" : "bg-gray-300"}`}
                    >
                      Absent
                    </button>
                  </div>
                  <div className="flex space-x-4">
                    {/* Lab Attendance */}
                    <button
                      onClick={() => handleAttendanceChange(subject, "lab", "Present")}
                      className={`w-20 py-2 rounded-lg text-white ${attendanceData[subject]?.lab === "Present" ? "bg-green-500" : "bg-gray-300"}`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => handleAttendanceChange(subject, "lab", "Absent")}
                      className={`w-20 py-2 rounded-lg text-white ${attendanceData[subject]?.lab === "Absent" ? "bg-red-500" : "bg-gray-300"}`}
                    >
                      Absent
                    </button>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Save Attendance Button */}
        <div className="flex justify-center">
          <button
            onClick={saveAttendance}
            className="w-full py-3 bg-blue-500 text-white rounded-lg mt-6 font-semibold"
          >
            Save Attendance
          </button>
        </div>
      </div>
    </div>
  );
}

export default AttendancePage;
