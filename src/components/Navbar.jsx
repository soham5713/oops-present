import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "../firebase";  // Import the sign-out function

const Navbar = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut(); // Sign the user out
      navigate("/signin");  // Redirect to sign-in page after sign-out
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 w-full z-10 contents">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 h-[10vh]">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-blue-600">
              Attendance Tracker
            </h1>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {user && (
              <>
                <Link
                  to="/subject-setup"
                  className={`font-medium ${isActive("/subject-setup") ? "text-blue-600" : "text-gray-700 hover:text-blue-600"}`}
                >
                  Setup
                </Link>
                <Link
                  to="/attendance"
                  className={`font-medium ${isActive("/attendance") ? "text-blue-600" : "text-gray-700 hover:text-blue-600"}`}
                >
                  Attendance
                </Link>
                <Link
                  to="/dashboard"
                  className={`font-medium ${isActive("/dashboard") ? "text-blue-600" : "text-gray-700 hover:text-blue-600"}`}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-gray-700 font-medium hover:text-blue-600"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              className="text-gray-700 hover:text-blue-600"
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}  // Toggle mobile menu visibility
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden flex flex-col items-center space-y-4">
            {user && (
              <>
                <Link
                  to="/subject-setup"
                  className={`font-medium ${isActive("/subject-setup") ? "text-blue-600" : "text-gray-700 hover:text-blue-600"}`}
                >
                  Setup
                </Link>
                <Link
                  to="/attendance"
                  className={`font-medium ${isActive("/attendance") ? "text-blue-600" : "text-gray-700 hover:text-blue-600"}`}
                >
                  Attendance
                </Link>
                <Link
                  to="/dashboard"
                  className={`font-medium ${isActive("/dashboard") ? "text-blue-600" : "text-gray-700 hover:text-blue-600"}`}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-gray-700 font-medium hover:text-blue-600"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
