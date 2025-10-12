"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, RotateCcw, ArrowRight, Volume2 } from "lucide-react"
import { useState } from "react"
import WaveVisualization from "@/components/shared/WaveVisualization"
import confetti from "canvas-confetti"

type PracticeState = "ready" | "recording" | "analyzing" | "result"

export default function Practice() {
  const [state, setState] = useState<PracticeState>("ready")
  const [score, setScore] = useState(0)
  const [isRecording, setIsRecording] = useState(false)

  const targetWord = "Beautiful"
  const phonetic = "/ˈbjuːtɪfəl/"

  const handleRecord = () => {
    setIsRecording(true)
    setState("recording")

    // Simulate recording for 2 seconds
    setTimeout(() => {
      setIsRecording(false)
      setState("analyzing")

      // Simulate analysis
      setTimeout(() => {
        const randomScore = Math.floor(Math.random() * 30) + 70 // 70-100
        setScore(randomScore)
        setState("result")

        // Trigger confetti for high scores
        if (randomScore >= 85) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#00ffff", "#9d00ff", "#ff00ff"],
          })
        }
      }, 1500)
    }, 2000)
  }

  const handleRetry = () => {
    setState("ready")
    setScore(0)
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">Lesson 1 of 10</Badge>
        <h1 className="font-heading text-3xl font-bold text-neon-blue mb-2">Practice Session</h1>
        <p className="text-muted-foreground">Pronounce the word correctly</p>
      </motion.div>

      {/* Target Word Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card className="glass neon-glow-blue p-8 border-primary/20 text-center">
          <motion.h2
            className="font-heading text-5xl font-bold text-neon-blue mb-4"
            animate={{ scale: state === "recording" ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 0.5, repeat: state === "recording" ? Number.POSITIVE_INFINITY : 0 }}
          >
            {targetWord}
          </motion.h2>
          <motion.p
            className="text-2xl text-muted-foreground mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {phonetic}
          </motion.p>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Volume2 className="w-4 h-4" />
            Listen
          </Button>
        </Card>
      </motion.div>

      {/* Microphone Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8 flex justify-center"
      >
        <motion.div
          className="relative"
          whileHover={{ scale: state === "ready" ? 1.05 : 1 }}
          whileTap={{ scale: state === "ready" ? 0.95 : 1 }}
        >
          <Button
            size="lg"
            disabled={state !== "ready"}
            onClick={handleRecord}
            className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary hover:opacity-90 disabled:opacity-50"
          >
            <Mic className="w-12 h-12" />
          </Button>

          {/* Ripple effect when recording */}
          {isRecording && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-primary"
                animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-secondary"
                animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, delay: 0.3 }}
              />
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Wave Visualization */}
      <AnimatePresence>
        {(state === "recording" || state === "analyzing") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <WaveVisualization isActive={isRecording} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Messages */}
      <AnimatePresence mode="wait">
        {state === "recording" && (
          <motion.p
            key="recording"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center text-primary font-semibold mb-8"
          >
            Recording... Speak now!
          </motion.p>
        )}
        {state === "analyzing" && (
          <motion.p
            key="analyzing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center text-secondary font-semibold mb-8"
          >
            Analyzing your pronunciation...
          </motion.p>
        )}
      </AnimatePresence>

      {/* Result Card */}
      <AnimatePresence>
        {state === "result" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            <Card className="glass neon-glow-purple p-6 border-secondary/20 mb-8">
              <h3 className="font-heading text-xl font-semibold mb-4 text-center">Your Score</h3>

              {/* Circular Progress */}
              <div className="relative w-40 h-40 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted"
                  />
                  <motion.circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "440", strokeDashoffset: "440" }}
                    animate={{ strokeDashoffset: 440 - (440 * score) / 100 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00ffff" />
                      <stop offset="100%" stopColor="#9d00ff" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.span
                    className="font-heading text-5xl font-bold text-neon-blue"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    {score}
                  </motion.span>
                </div>
              </div>

              {/* Feedback */}
              <div className="text-center mb-6">
                <p className="text-lg font-semibold mb-2">
                  {score >= 90 ? "🎉 Excellent!" : score >= 75 ? "👍 Great job!" : "💪 Keep practicing!"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {score >= 90
                    ? "Perfect pronunciation!"
                    : score >= 75
                      ? "Almost there! Try emphasizing the first syllable."
                      : "Focus on the vowel sounds."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 gap-2 bg-transparent" onClick={handleRetry}>
                  <RotateCcw className="w-4 h-4" />
                  Retry
                </Button>
                <Button className="flex-1 gap-2 bg-gradient-to-r from-primary to-secondary">
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
