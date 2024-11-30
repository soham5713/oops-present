import React, { useState } from "react";
import { auth } from "../firebase";
import { getFirestore, doc, setDoc } from "firebase/firestore";

function SubjectSetup() {
  const [subjects, setSubjects] = useState([]);
  const [subjectInput, setSubjectInput] = useState("");

  const handleAddSubject = () => {
    const newSubject = subjectInput.trim();
    if (newSubject && !subjects.includes(newSubject)) {
      setSubjects([...subjects, newSubject]);
      setSubjectInput("");
    } else {
      alert("Subject already exists or input is empty.");
    }
  };

  const handleSubmit = async () => {
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
        });
        alert("Subjects have been saved successfully!");
      } catch (error) {
        console.error("Error saving subjects: ", error);
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80">
        <h1 className="text-2xl font-semibold mb-4 text-center">Subject Setup</h1>
        <div className="mb-4">
          <input
            type="text"
            value={subjectInput}
            onChange={(e) => setSubjectInput(e.target.value)}
            placeholder="Enter subject name"
            className="w-full p-2 border rounded-lg"
          />
          <button
            onClick={handleAddSubject}
            className="w-full p-2 mt-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Add Subject
          </button>
        </div>
        {subjects.length > 0 && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Subjects Added:</h2>
            <ul className="list-disc pl-5">
              {subjects.map((subject, index) => (
                <li key={index}>{subject}</li>
              ))}
            </ul>
          </div>
        )}
        <button
          onClick={handleSubmit}
          className="w-full p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Save Subjects
        </button>
      </div>
    </div>
  );
}

export default SubjectSetup;
