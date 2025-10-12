"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, Flame, Trophy, TrendingUp } from "lucide-react"
import { useState, useEffect } from "react"

const categories = [
  { id: 1, name: "Vowels", icon: "🗣️", progress: 75, color: "from-primary to-secondary" },
  { id: 2, name: "Consonants", icon: "💬", progress: 60, color: "from-secondary to-primary" },
  { id: 3, name: "Diphthongs", icon: "🎵", progress: 45, color: "from-primary to-purple-500" },
  { id: 4, name: "Stress Patterns", icon: "⚡", progress: 30, color: "from-purple-500 to-primary" },
]

export default function Home() {
  const [streakDays, setStreakDays] = useState(0)

  useEffect(() => {
    // Animated counter for streak
    let count = 0
    const target = 7
    const interval = setInterval(() => {
      if (count < target) {
        count++
        setStreakDays(count)
      } else {
        clearInterval(interval)
      }
    }, 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen pb-24 px-4 pt-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-neon-blue mb-2">Welcome Back!</h1>
        <p className="text-muted-foreground">Ready to practice today?</p>
      </motion.div>

      {/* Streak Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card className="glass neon-glow-blue p-6 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-6 h-6 text-orange-500" />
                <span className="text-2xl font-bold">{streakDays} Days</span>
              </div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <Trophy className="w-8 h-8 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">12 Badges</p>
              </div>
              <div className="text-center">
                <TrendingUp className="w-8 h-8 text-secondary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">85% Avg</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Daily Challenge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="font-heading text-xl font-semibold mb-4">Daily Challenge</h2>
        <Card className="glass neon-glow-purple p-6 border-secondary/20 hover:scale-[1.02] transition-transform cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30">Today's Word</Badge>
            <span className="text-sm text-muted-foreground">+50 XP</span>
          </div>
          <h3 className="font-heading text-3xl font-bold text-neon-purple mb-2">Pronunciation</h3>
          <p className="text-muted-foreground mb-4">/prəˌnʌnsiˈeɪʃən/</p>
          <Button className="w-full bg-gradient-to-r from-secondary to-primary hover:opacity-90">
            <Mic className="w-4 h-4 mr-2" />
            Start Challenge
          </Button>
        </Card>
      </motion.div>

      {/* Practice Categories */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="font-heading text-xl font-semibold mb-4">Practice Categories</h2>
        <div className="grid grid-cols-2 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={{ scale: 1.05, rotateY: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card className="glass p-4 border-primary/10 hover:border-primary/30 transition-all cursor-pointer h-full">
                <div className="text-4xl mb-2">{category.icon}</div>
                <h3 className="font-semibold mb-2">{category.name}</h3>
                <div className="w-full bg-muted rounded-full h-2 mb-2">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${category.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${category.progress}%` }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{category.progress}% Complete</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
