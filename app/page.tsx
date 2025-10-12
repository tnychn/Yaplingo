"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Login from "@/components/screens/Login"
import Splash from "@/components/screens/Splash"
import Home from "@/components/screens/Home"
import Practice from "@/components/screens/Practice"
import Progress from "@/components/screens/Progress"
import Settings from "@/components/screens/Settings"
import NavBar from "@/components/shared/NavBar"

type Screen = "login" | "splash" | "home" | "practice" | "progress" | "settings"

export default function Page() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Auto-transition from splash to home after 3 seconds
    if (currentScreen === "splash") {
      const timer = setTimeout(() => {
        setCurrentScreen("home")
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [currentScreen])

  const handleLogin = () => {
    setIsAuthenticated(true)
    setCurrentScreen("splash")
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "login":
        return <Login onLogin={handleLogin} />
      case "splash":
        return <Splash />
      case "home":
        return <Home />
      case "practice":
        return <Practice />
      case "progress":
        return <Progress />
      case "settings":
        return <Settings />
      default:
        return <Login onLogin={handleLogin} />
    }
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>

      {isAuthenticated && currentScreen !== "splash" && currentScreen !== "login" && (
        <NavBar currentScreen={currentScreen} onNavigate={setCurrentScreen} />
      )}
    </div>
  )
}
