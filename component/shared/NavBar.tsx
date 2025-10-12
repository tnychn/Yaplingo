"use client"

import { motion } from "framer-motion"
import { Home, Mic, TrendingUp, Settings } from "lucide-react"

type Screen = "home" | "practice" | "progress" | "settings"

interface NavBarProps {
  currentScreen: Screen
  onNavigate: (screen: Screen) => void
}

const navItems = [
  { id: "home" as Screen, icon: Home, label: "Home" },
  { id: "practice" as Screen, icon: Mic, label: "Practice" },
  { id: "progress" as Screen, icon: TrendingUp, label: "Progress" },
  { id: "settings" as Screen, icon: Settings, label: "Settings" },
]

export default function NavBar({ currentScreen, onNavigate }: NavBarProps) {
  return (
    <motion.nav initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-0 left-0 right-0 z-50">
      <div className="glass border-t border-primary/20 backdrop-blur-xl">
        <div className="flex items-center justify-around px-4 py-3 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentScreen === item.id

            return (
              <motion.button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="relative flex flex-col items-center gap-1 px-4 py-2"
                whileTap={{ scale: 0.9 }}
              >
                <div className="relative">
                  <Icon
                    className={`w-6 h-6 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
                  />
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -inset-2 rounded-full bg-primary/20 -z-10"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </div>
                <span
                  className={`text-xs font-medium transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.nav>
  )
}
