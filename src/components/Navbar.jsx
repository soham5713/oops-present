import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Menu, X, Calendar, BarChart2, LogOut, Moon, Sun, Settings } from "lucide-react"
import { useTheme } from "./ThemeProvider"
import { signOut } from "firebase/auth"
import { auth } from "../firebase"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const Navbar = ({ user }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const { theme, setTheme } = useTheme()

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

  const NavLinks = ({ mobile = false }) => (
    <>
      {user &&
        navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive(link.path)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            } ${mobile ? "w-full" : ""}`}
            onClick={() => mobile && setIsOpen(false)}
          >
            {link.icon}
            <span>{link.label}</span>
          </Link>
        ))}
    </>
  )

  return (
    <nav className="bg-background border-b border-border shadow-sm">
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
            <NavLinks />
            <Button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              variant="ghost"
              size="sm"
              className="w-9 px-0"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            {user && (
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>Sign Out</span>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col space-y-4">
                  <NavLinks mobile />
                  {user && (
                    <Button
                      onClick={() => {
                        handleSignOut()
                        setIsOpen(false)
                      }}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      <span>Sign Out</span>
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setTheme(theme === "dark" ? "light" : "dark")
                      setIsOpen(false)
                    }}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    {theme === "dark" ? <Sun className="h-5 w-5 mr-2" /> : <Moon className="h-5 w-5 mr-2" />}
                    <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar