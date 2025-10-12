"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export default function Splash() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([])

  useEffect(() => {
    // Generate random particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0f0f0f] via-[#1a0a2e] to-[#0f0f0f] overflow-hidden">
      {/* Animated background particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-primary rounded-full"
          style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Logo and brand */}
      <div className="relative z-10 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="font-heading text-6xl font-bold text-neon-blue mb-4">Yaplingo</h1>

          {/* Sound wave animation */}
          <div className="flex items-center justify-center gap-1 mb-8">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-gradient-to-t from-primary to-secondary rounded-full"
                animate={{
                  height: [20, 40, 20],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>

          <motion.p
            className="text-muted-foreground text-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            Master Your Pronunciation
          </motion.p>
        </motion.div>

        {/* Pulse animation */}
        <motion.div
          className="absolute inset-0 -z-10"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
          }}
        >
          <div className="w-full h-full rounded-full neon-glow-blue" />
        </motion.div>

        {/* Loading spinner with waveform effect */}
        <motion.div
          className="mt-12 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
        </motion.div>
      </div>
    </div>
  )
}
