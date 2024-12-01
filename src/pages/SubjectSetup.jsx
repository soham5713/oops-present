import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

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

function SubjectSetup() {
  const [division, setDivision] = useState("");  // Default is an empty string
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
            // Ensure division exists or prompt the user to select it
            if (!userData.division) {
              setError("Please select a division to continue.");
            }
            setDivision(userData.division || "");
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
      const divisionTimetable = Timetable[division]?.[currentDay] || [];
      setTimetable(divisionTimetable);
    }
  }, [division]);

  const handleDivisionChange = (event) => {
    setDivision(event.target.value); // Make sure this updates the state
    setError(""); // Reset error if a new division is selected
    setSuccess(""); // Reset success message
  };

  const handleSubmit = async () => {
    if (!division) {
      setError("Please select a division before proceeding.");
      return;
    }
  
    const user = auth.currentUser;
    if (user) {
      const db = getFirestore();
      const userRef = doc(db, "users", user.uid);
  
      try {
        await setDoc(
          userRef,
          {
            division: division,
            timetable: timetable,
            setupCompleted: false,
          },
          { merge: true }
        );
  
        setSuccess("Division and timetable saved successfully!");
  
        setTimeout(() => {
          navigate("/attendance");
        }, 1000);
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

        {error && <div className="mb-4 text-red-500 text-center">{error}</div>}
        {success && <div className="mb-4 text-green-500 text-center">{success}</div>}

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
            <option value="D">D</option>
            <option value="E">E</option>
            <option value="F">F</option>
            <option value="G">G</option>
            <option value="H">H</option>
          </select>
        </div>

        {division && (
          <div>
            <h2 className="text-xl text-gray-800 font-semibold mb-4">
              Timetable for {division}
            </h2>
            <div>
              {timetable.length > 0 ? (
                <ul className="list-disc pl-6">
                  {timetable.map((subject, index) => (
                    <li key={index} className="text-gray-700">{subject}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No subjects available for today.</p>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="w-full p-3 bg-blue-500 text-white font-semibold rounded-lg mt-6"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export default SubjectSetup;
