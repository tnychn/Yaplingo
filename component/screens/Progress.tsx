"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target, TrendingUp } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

const accuracyData = [
  { day: "Mon", score: 65 },
  { day: "Tue", score: 72 },
  { day: "Wed", score: 78 },
  { day: "Thu", score: 75 },
  { day: "Fri", score: 85 },
  { day: "Sat", score: 88 },
  { day: "Sun", score: 92 },
]

const skillData = [
  { skill: "Vowels", score: 85 },
  { skill: "Consonants", score: 78 },
  { skill: "Stress", score: 72 },
  { skill: "Intonation", score: 80 },
  { skill: "Fluency", score: 75 },
]

const badges = [
  { id: 1, name: "First Steps", icon: "🎯", unlocked: true },
  { id: 2, name: "Week Warrior", icon: "🔥", unlocked: true },
  { id: 3, name: "Perfect Score", icon: "💯", unlocked: true },
  { id: 4, name: "Speed Demon", icon: "⚡", unlocked: false },
  { id: 5, name: "Master", icon: "👑", unlocked: false },
  { id: 6, name: "Legend", icon: "🏆", unlocked: false },
]

export default function Progress() {
  return (
    <div className="min-h-screen pb-24 px-4 pt-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-neon-blue mb-2">Your Progress</h1>
        <p className="text-muted-foreground">Track your improvement over time</p>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-4 mb-8"
      >
        <Card className="glass p-4 border-primary/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">156</p>
              <p className="text-xs text-muted-foreground">Total Sessions</p>
            </div>
          </div>
        </Card>

        <Card className="glass p-4 border-secondary/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">85%</p>
              <p className="text-xs text-muted-foreground">Avg Accuracy</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Accuracy Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="font-heading text-xl font-semibold mb-4">Weekly Accuracy</h2>
        <Card className="glass p-4 border-primary/10">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={accuracyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0,0,0,0.8)",
                  border: "1px solid rgba(0,255,255,0.3)",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#00ffff"
                strokeWidth={3}
                dot={{ fill: "#00ffff", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Skill Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <h2 className="font-heading text-xl font-semibold mb-4">Skill Breakdown</h2>
        <Card className="glass p-4 border-secondary/10">
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={skillData}>
              <PolarGrid stroke="rgba(255,255,255,0.2)" />
              <PolarAngleAxis dataKey="skill" stroke="rgba(255,255,255,0.5)" />
              <PolarRadiusAxis stroke="rgba(255,255,255,0.3)" />
              <Radar name="Score" dataKey="score" stroke="#9d00ff" fill="#9d00ff" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Badges */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h2 className="font-heading text-xl font-semibold mb-4">Achievements</h2>
        <div className="grid grid-cols-3 gap-4">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              whileHover={{ scale: badge.unlocked ? 1.1 : 1 }}
            >
              <Card
                className={`glass p-4 text-center ${
                  badge.unlocked ? "border-primary/30 neon-glow-blue" : "border-muted/20 opacity-50"
                }`}
              >
                <motion.div
                  className="text-4xl mb-2"
                  animate={badge.unlocked ? { rotate: [0, -10, 10, -10, 0] } : {}}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.05 }}
                >
                  {badge.icon}
                </motion.div>
                <p className="text-xs font-semibold">{badge.name}</p>
                {badge.unlocked && (
                  <Badge className="mt-2 bg-primary/20 text-primary border-primary/30 text-[10px]">Unlocked</Badge>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
