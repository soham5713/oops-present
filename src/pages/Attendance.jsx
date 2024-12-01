import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// Dummy timetable data (same as in SubjectSetup.jsx)
const Timetable = {
  A: {
    Monday: ["PSIPL", "EP", "DS", "TS", "MT"],
    Tuesday: ["PSIPL", "IKS", "EP", "DS"],
    Wednesday: ["TS", "MT", "EP", "DS", "ECL", "PSIPL"],
    Thursday: ["ECL", "DS", "TS", "MT", "EP"],
    Friday: ["IKS", "EP", "ECL", "MT", "EP", "DS", "TS"],
  },
  B: {
    Monday: ["EP", "DS", "ECL", "IKS", "MT"],
    Tuesday: ["DS", "TS", "EP", "IKS", "ECL", "DS"],
    Wednesday: ["PSIPL", "DS", "TS", "PSIPL", "MT"],
    Thursday: ["PSIPL", "EP", "ECL", "TS"],
    Friday: ["TS", "MT", "EP", "DS"],
  },
  C: {
    Monday: ["EC", "DS", "TS", "PSIPL"],
    Tuesday: ["DS", "EC", "MT", "ECL", "IKS", "TS"],
    Wednesday: ["TS", "MT", "EC", "DS", "IKS", "EC"],
    Thursday: ["ECL", "DS", "MT"],
    Friday: ["EC", "ECL", "PSIPL", "TS", "EC"],
  },
  D: {
    Monday: ["ECL", "DS", "TS", "MT"],
    Tuesday: ["DS", "TS", "EC", "IKS", "PSIPL"],
    Wednesday: ["MT", "EC", "DS", "ECL", "IKS", "TS"],
    Thursday: ["MT", "EC", "DS", "TS", "PSIPL"],
    Friday: ["ECL", "EC", "PSIPL", "MT"],
  },
  E: {
    Monday: ["EM", "BEE", "SS1", "ECL"],
    Tuesday: ["EM", "BEE", "SS1", "ECL", "PSIPL"],
    Wednesday: ["SS1", "MT", "EM", "BEE", "PSIPL"],
    Thursday: ["BEE", "SS1", "EM", "ECL", "UHV", "MT"],
    Friday: ["PSIPL", "UHV", "EM", "MT"],
  },
  F: {
    Monday: ["ECL", "PSIPL", "BEE", "SS1", "MT"],
    Tuesday: ["ECL", "UHV", "PSIPL", "SS1", "BEE"],
    Wednesday: ["BEE", "PSIPL", "SS1", "MT", "EM"],
    Thursday: ["EM", "BEE", "ECL", "BEE", "SS1", "MT"],
    Friday: ["EM", "UHV", "MT", "SS1"],
  },
  G: {
    Monday: ["EG", "BEE", "SS1", "ECL", "MT"],
    Tuesday: ["EG", "PSIPL", "UHV", "BEE", "MT"],
    Wednesday: ["BEE", "SS1", "EG", "ECL", "MT"],
    Thursday: ["PSIPL", "SS1", "ECL"],
    Friday: ["EG", "SS1", "BEE", "EG", "UHV"],
  },
  H: {
    Monday: ["SS1", "ECL", "EG", "PSIPL"],
    Tuesday: ["EG", "BEE", "ECL", "MT"],
    Wednesday: ["MT", "UHV", "BEE", "EG", "SS1"],
    Thursday: ["PSIPL", "SS1", "BEE", "EG"],
    Friday: ["BEE", "MT", "EG", "PSIPL", "ECL", "UHV"],
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
  const getSubjectsForDay = (division, currentDay) => {
    return Timetable[division]?.[currentDay] || [];
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
  
            console.log("User division:", userDivision); // Check division here
            
            const today = new Date().toISOString().split('T')[0];
            setDate(today);
  
            const currentDay = getCurrentDay();
            const currentDaySubjects = getSubjectsForDay(userDivision, currentDay);
            setTimetable(currentDaySubjects);
  
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
    if (division && date) {
      const selectedDay = new Date(date).toLocaleString("en-US", { weekday: "long" });
      const daySubjects = getSubjectsForDay(division, selectedDay);
      setTimetable(daySubjects);
  
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
