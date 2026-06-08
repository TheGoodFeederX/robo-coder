"use client"

import type React from "react"

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react"
import { Card } from "@/components/ui/card"
import { useRobot } from "@/lib/contexts/robot-context"

interface RobotState {
  x: number
  y: number
  rotation: number
}

export interface RobotCanvasRef {
  getCanvas: () => HTMLCanvasElement | null
}

export const RobotCanvas = forwardRef<RobotCanvasRef, {}>(
  ({}, ref) => {
    const {
      targetState,
      trail,
      message,
      currentLine,
      isExecuting
    } = useRobot()

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [robotState, setRobotState] = useState<RobotState>({
      x: 250,
      y: 250,
      rotation: 0,
    })
    const animationFrameRef = useRef<number | null>(null)
    const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null)

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
    }))

    // Snap to target state when not executing (handles reset/clear)
    useEffect(() => {
      if (!isExecuting) {
        setRobotState(targetState)
      }
    }, [isExecuting, targetState])

    useEffect(() => {
      const animate = () => {
        setRobotState((current) => {
          const dx = targetState.x - current.x
          const dy = targetState.y - current.y
          let dRotation = targetState.rotation - current.rotation

          while (dRotation > 180) dRotation -= 360
          while (dRotation < -180) dRotation += 360

          if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1 && Math.abs(dRotation) < 0.1) {
            return targetState
          }

          return {
            x: current.x + dx * 0.15,
            y: current.y + dy * 0.15,
            rotation: current.rotation + dRotation * 0.15,
          }
        })

        animationFrameRef.current = requestAnimationFrame(animate)
      }

      animationFrameRef.current = requestAnimationFrame(animate)

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    }, [targetState])

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Convert canvas coordinates to grid coordinates (center is 0,0)
      const gridX = Math.round((x - 250) / 10)
      const gridY = Math.round((250 - y) / 10)

      setHoverCoords({ x: gridX, y: gridY })
    }

    const handleMouseLeave = () => {
      setHoverCoords(null)
    }

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "#1a1f35")
      gradient.addColorStop(1, "#2d3748")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.strokeStyle = "#374151"
      ctx.lineWidth = 0.5
      for (let i = 0; i <= canvas.width; i += 10) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, canvas.height)
        ctx.stroke()
      }
      for (let i = 0; i <= canvas.height; i += 10) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(canvas.width, i)
        ctx.stroke()
      }

      ctx.strokeStyle = "#4b5563"
      ctx.lineWidth = 1.5
      for (let i = 0; i <= canvas.width; i += 50) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, canvas.height)
        ctx.stroke()
      }
      for (let i = 0; i <= canvas.height; i += 50) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(canvas.width, i)
        ctx.stroke()
      }

      // X-axis (horizontal through center)
      ctx.strokeStyle = "#60a5fa"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, 250)
      ctx.lineTo(500, 250)
      ctx.stroke()

      // Y-axis (vertical through center)
      ctx.beginPath()
      ctx.moveTo(250, 0)
      ctx.lineTo(250, 500)
      ctx.stroke()

      // Draw coordinate markers
      ctx.fillStyle = "#60a5fa"
      ctx.font = "bold 12px Inter"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      // X-axis markers (every 5 steps = 50px)
      for (let i = -25; i <= 25; i += 5) {
        if (i === 0) continue
        const x = 250 + i * 10
        ctx.fillRect(x - 1, 245, 2, 10)
        ctx.fillText(i.toString(), x, 265)
      }

      // Y-axis markers (every 5 steps = 50px)
      ctx.textAlign = "right"
      for (let i = -25; i <= 25; i += 5) {
        if (i === 0) continue
        const y = 250 - i * 10
        ctx.fillRect(245, y - 1, 10, 2)
        ctx.fillText(i.toString(), 240, y)
      }

      // Origin marker
      ctx.fillStyle = "#fbbf24"
      ctx.font = "bold 14px Inter"
      ctx.textAlign = "left"
      ctx.fillText("(0,0)", 255, 245)

      if (trail.length > 1) {
        for (let i = 1; i < trail.length; i++) {
          const prev = trail[i - 1]
          const curr = trail[i]
          const alpha = Math.max(0.3, (i / trail.length) * 0.8)

          ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`
          ctx.lineWidth = 5
          ctx.lineCap = "round"
          ctx.lineJoin = "round"

          ctx.beginPath()
          ctx.moveTo(prev.x, prev.y)
          ctx.lineTo(curr.x, curr.y)
          ctx.stroke()

          ctx.fillStyle = `rgba(167, 139, 250, ${alpha})`
          ctx.shadowColor = "rgba(139, 92, 246, 0.8)"
          ctx.shadowBlur = 8
          ctx.beginPath()
          ctx.arc(curr.x, curr.y, 4, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
        }
      }

      ctx.save()
      ctx.translate(robotState.x, robotState.y)
      ctx.rotate((robotState.rotation * Math.PI) / 180)

      ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
      ctx.beginPath()
      ctx.ellipse(0, 28, 24, 8, 0, 0, Math.PI * 2)
      ctx.fill()

      const bodyGradient = ctx.createLinearGradient(-25, -25, 25, 25)
      bodyGradient.addColorStop(0, "#60a5fa")
      bodyGradient.addColorStop(0.5, "#3b82f6")
      bodyGradient.addColorStop(1, "#2563eb")
      ctx.fillStyle = bodyGradient
      ctx.beginPath()
      ctx.roundRect(-25, -25, 50, 50, 10)
      ctx.fill()

      ctx.fillStyle = "rgba(255, 255, 255, 0.2)"
      ctx.beginPath()
      ctx.roundRect(-22, -22, 44, 25, 8)
      ctx.fill()

      const headGradient = ctx.createRadialGradient(-5, -10, 5, 0, 0, 18)
      headGradient.addColorStop(0, "#93c5fd")
      headGradient.addColorStop(1, "#60a5fa")
      ctx.fillStyle = headGradient
      ctx.beginPath()
      ctx.arc(0, -5, 18, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = "#ffffff"
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
      ctx.shadowBlur = 3
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1
      ctx.beginPath()
      ctx.arc(-9, -8, 5, 0, Math.PI * 2)
      ctx.arc(9, -8, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      ctx.fillStyle = "#1e293b"
      ctx.beginPath()
      ctx.arc(-9, -8, 3, 0, Math.PI * 2)
      ctx.arc(9, -8, 3, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = "#ffffff"
      ctx.beginPath()
      ctx.arc(-10, -9, 1.5, 0, Math.PI * 2)
      ctx.arc(8, -9, 1.5, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = "#1e293b"
      ctx.lineWidth = 2.5
      ctx.lineCap = "round"
      ctx.beginPath()
      ctx.arc(0, 3, 12, 0.2, Math.PI - 0.2)
      ctx.stroke()

      ctx.strokeStyle = "#64748b"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, -23)
      ctx.lineTo(0, -32)
      ctx.stroke()

      const antennaBallGradient = ctx.createRadialGradient(-1, -34, 1, 0, -35, 5)
      antennaBallGradient.addColorStop(0, "#fbbf24")
      antennaBallGradient.addColorStop(1, "#f59e0b")
      ctx.fillStyle = antennaBallGradient
      ctx.beginPath()
      ctx.arc(0, -35, 5, 0, Math.PI * 2)
      ctx.fill()

      const arrowGradient = ctx.createLinearGradient(0, -40, 0, -25)
      arrowGradient.addColorStop(0, "#fde047")
      arrowGradient.addColorStop(1, "#fbbf24")
      ctx.fillStyle = arrowGradient
      ctx.beginPath()
      ctx.moveTo(0, -45)
      ctx.lineTo(-7, -30)
      ctx.lineTo(7, -30)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = "rgba(0, 0, 0, 0.2)"
      ctx.beginPath()
      ctx.moveTo(0, -43)
      ctx.lineTo(-6, -30)
      ctx.lineTo(6, -30)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = "#3b82f6"
      ctx.beginPath()
      ctx.roundRect(-30, -5, 5, 20, 2)
      ctx.roundRect(25, -5, 5, 20, 2)
      ctx.fill()

      ctx.restore()
    }, [robotState, trail])

    return (
      <Card className="bg-slate-800 border-4 border-white shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4">
          <h2 className="text-2xl font-bold text-white text-center">Robot Mission Field</h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className="border-4 border-slate-600 rounded-lg shadow-lg cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />

          {hoverCoords && (
            <div className="absolute top-4 left-4 bg-blue-500 rounded-lg px-4 py-2 shadow-lg border-2 border-white">
              <p className="text-sm font-bold text-white">
                X: {hoverCoords.x}, Y: {hoverCoords.y}
              </p>
            </div>
          )}

          {message && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-full px-6 py-3 shadow-lg animate-bounce">
              <p className="text-lg font-bold text-slate-800">{message}</p>
            </div>
          )}

          {currentLine >= 0 && (
            <div className="absolute top-8 right-8 bg-yellow-400 rounded-lg px-4 py-2 shadow-lg">
              <p className="text-sm font-bold text-slate-800">Running line {currentLine + 1}</p>
            </div>
          )}
        </div>
      </Card>
    )
  },
)

RobotCanvas.displayName = "RobotCanvas"
