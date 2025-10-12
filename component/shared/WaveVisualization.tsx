"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface WaveVisualizationProps {
  isActive: boolean
}

export default function WaveVisualization({ isActive }: WaveVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    let animationId: number
    let phase = 0

    const draw = () => {
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight
      const centerY = height / 2

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Draw multiple wave layers
      const waves = [
        { amplitude: 20, frequency: 0.02, color: "rgba(0, 255, 255, 0.6)", offset: 0 },
        { amplitude: 15, frequency: 0.03, color: "rgba(157, 0, 255, 0.4)", offset: Math.PI / 2 },
        { amplitude: 10, frequency: 0.025, color: "rgba(255, 0, 255, 0.3)", offset: Math.PI },
      ]

      waves.forEach((wave) => {
        ctx.beginPath()
        ctx.strokeStyle = wave.color
        ctx.lineWidth = 3
        ctx.lineCap = "round"

        for (let x = 0; x < width; x++) {
          const amplitude = isActive ? wave.amplitude : wave.amplitude * 0.3
          const y =
            centerY +
            Math.sin(x * wave.frequency + phase + wave.offset) * amplitude +
            Math.sin(x * wave.frequency * 2 + phase * 1.5) * (amplitude * 0.5)

          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.stroke()
      })

      phase += isActive ? 0.1 : 0.03
      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [isActive])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-32 glass rounded-lg border border-primary/20 overflow-hidden"
    >
      <canvas ref={canvasRef} className="w-full h-full" style={{ width: "100%", height: "100%" }} />
    </motion.div>
  )
}
