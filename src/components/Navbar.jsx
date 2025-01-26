import React, { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Menu, X, BookOpen, Calendar, BarChart2, LogOut, Moon, Sun, User, Settings } from "lucide-react"
import { useTheme } from "./ThemeProvider"
import { signOut } from "firebase/auth"
import { auth } from "../firebase"
import { Button } from "@/components/ui/button"

const Navbar = ({ user }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const isActive = (path) => location.pathname === path

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      navigate("/signin")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const navLinks = [
    { path: "/attendance", label: "Attendance", icon: <Calendar className="w-4 h-4" /> },
    { path: "/dashboard", label: "Dashboard", icon: <BarChart2 className="w-4 h-4" /> },
    { path: "/settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ]

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Calendar className="w-6 h-6 text-primary" />
              <span className="text-xl font-semibold text-foreground">Attendance</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {user &&
              navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))}
            <Button onClick={toggleTheme} variant="ghost" size="sm" className="w-9 px-0">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            {user && (
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <Button onClick={() => setIsOpen(!isOpen)} variant="ghost" size="sm" className="md:hidden">
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`md:hidden ${isOpen ? "block" : "hidden"}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {user &&
            navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
          {user && (
            <button
              onClick={() => {
                handleSignOut()
                setIsOpen(false)
              }}
              className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar