import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Dummy timetable data
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

function SubjectSetup() {
  const [division, setDivision] = useState("");
  const [timetable, setTimetable] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserDivision = async () => {
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const userRef = doc(db, "users", user.uid);

        try {
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setDivision(userData.division || ""); // Fetch user's division
          }
        } catch (error) {
          console.error("Error fetching user division: ", error);
          setError("Error fetching user division. Please try again later.");
        }
      }
    };

    fetchUserDivision();
  }, []);

  useEffect(() => {
    if (division) {
      const currentDay = new Date().toLocaleString("en-US", {
        weekday: "long",
      });
      const divisionTimetable = dummyTimetable[division]?.[currentDay] || [];
      setTimetable(divisionTimetable);
    }
  }, [division]);

  const handleDivisionChange = (event) => {
    setDivision(event.target.value);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;  // Get the current user
    if (user) {
      const db = getFirestore();  // Initialize Firestore
      const userRef = doc(db, "users", user.uid);  // Reference to the user's document
  
      try {
        // Save data to Firestore
        await setDoc(
          userRef,
          {
            division: division,  // Save the division
            timetable: timetable, // Save the timetable (subject list)
            setupCompleted: true   // Indicate that setup is completed
          },
          { merge: true }  // Merge ensures existing fields are preserved, and only new fields are added
        );
  
        setSuccess("Division and timetable have been saved successfully!");
        setError("");  // Clear any previous errors
  
        // Redirect to another page after successful save
        setTimeout(() => {
          navigate("/attendance");  // Redirect to the attendance page
        }, 1000);  // Wait 1 second before redirecting
      } catch (error) {
        console.error("Error saving data: ", error);
        setError("Error saving data. Please try again.");
      }
    }
  };
  

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
      <div className="bg-white m-6 p-6 rounded-lg shadow-lg w-full max-w-[75%] md:max-w-md">
        <h1 className="text-3xl font-semibold mb-4 text-center text-gray-800">
          Subject Setup
        </h1>

        {error && (
          <div className="mb-4 text-red-500 text-center">
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 text-green-500 text-center">
            <span>{success}</span>
          </div>
        )}

        <div className="mb-6">
          <label htmlFor="division" className="block text-lg text-gray-700 mb-2">
            Select Division
          </label>
          <select
            id="division"
            value={division}
            onChange={handleDivisionChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Division</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>

        {division && timetable.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700">
              Today's Timetable:
            </h2>
            <ul className="list-disc pl-5 text-gray-700">
              {timetable.map((subject, index) => (
                <li key={index}>{subject}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-6">
          <button
            onClick={handleSubmit}
            className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200"
          >
            Save Division
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubjectSetup;
