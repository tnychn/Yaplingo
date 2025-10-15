"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { Appearance } from "react-native"

type Theme = "light" | "dark"

type ThemeContextType = {
  theme: Theme
  toggleTheme: () => void
  colors: {
    background: string
    card: string
    text: string
    textSecondary: string
    border: string
    accent: string
    accentLight: string
    success: string
    warning: string
    error: string
  }
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(Appearance.getColorScheme() || "dark")

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme || "dark")
    })
    return () => subscription.remove()
  }, [])

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
  }

  const colors = {
    background: theme === "dark" ? "#000000" : "#ffffff",
    card: theme === "dark" ? "#0a0a0a" : "#f5f5f5",
    text: theme === "dark" ? "#ffffff" : "#000000",
    textSecondary: theme === "dark" ? "#9ca3af" : "#6b7280",
    border: theme === "dark" ? "#1a1a1a" : "#e5e7eb",
    accent: theme === "dark" ? "#00d9ff" : "#0891b2",
    accentLight: theme === "dark" ? "#00d9ff" : "#06b6d4",
    success: theme === "dark" ? "#10b981" : "#059669",
    warning: theme === "dark" ? "#f59e0b" : "#d97706",
    error: theme === "dark" ? "#ef4444" : "#dc2626",
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used within ThemeProvider")
  return context
}
