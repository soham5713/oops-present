import React, { useState } from "react";
import { auth } from "../firebase";
import { getFirestore, doc, setDoc } from "firebase/firestore";

function SubjectSetup() {
  const [subjects, setSubjects] = useState([]);
  const [subjectInput, setSubjectInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAddSubject = () => {
    const newSubject = subjectInput.trim();
    if (!newSubject) {
      setError("Subject name cannot be empty.");
      return;
    }
    if (subjects.includes(newSubject)) {
      setError("Subject already exists.");
      return;
    }

    setSubjects((prevSubjects) => [...prevSubjects, newSubject]);
    setSubjectInput("");
    setError("");
    setSuccess("Subject added successfully!");
  };

  const handleSubmit = async () => {
    if (subjects.length === 0) {
      setError("Please add at least one subject.");
      return;
    }
  
    const user = auth.currentUser;
    if (user) {
      const db = getFirestore();
      const userRef = doc(db, "users", user.uid);
  
      try {
        await setDoc(userRef, {
          subjects: subjects.reduce((acc, subject) => {
            acc[subject] = { theory: "", lab: "" };
            return acc;
          }, {}),
          setupCompleted: true, // Add this field to indicate that the setup is completed
        }, { merge: true }); // Use merge to avoid overwriting other fields if they exist
  
        setSuccess("Subjects have been saved successfully!");
        setError("");
      } catch (error) {
        console.error("Error saving subjects: ", error);
        setError("Error saving subjects. Please try again.");
      }
    }
  };
  

  const handleClearAll = () => {
    setSubjects([]);
    setSubjectInput("");
    setError("");
    setSuccess("");
  };

  return (
    <div className="flex justify-center items-center min-h-[66vh] md:min-h-[90vh]">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-[75%] md:max-w-md">
        <h1 className="text-3xl font-semibold mb-4 text-center text-gray-800">Subject Setup</h1>

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
          <input
            type="text"
            value={subjectInput}
            onChange={(e) => setSubjectInput(e.target.value)}
            placeholder="Enter subject name"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <button
            onClick={handleAddSubject}
            className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
          >
            Add Subject
          </button>
        </div>

        {subjects.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700">Subjects Added:</h2>
            <ul className="list-disc pl-5 text-gray-700">
              {subjects.map((subject, index) => (
                <li key={index}>{subject}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-between mb-6 gap-0 md:gap-4 flex-wrap">
          <button
            onClick={handleClearAll}
            className="w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 mb-4 sm:mb-0"
          >
            Clear All
          </button>
          <button
            onClick={handleSubmit}
            className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200"
          >
            Save Subjects
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubjectSetup;
