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

const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, labelSize = 12) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, "#1a1f35")
  gradient.addColorStop(1, "#2d3748")
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = "#374151"
  ctx.lineWidth = 0.5
  for (let i = 0; i <= width; i += 10) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, height)
    ctx.stroke()
  }
  for (let i = 0; i <= height; i += 10) {
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(width, i)
    ctx.stroke()
  }

  ctx.strokeStyle = "#4b5563"
  ctx.lineWidth = 1.5
  for (let i = 0; i <= width; i += 50) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, height)
    ctx.stroke()
  }
  for (let i = 0; i <= height; i += 50) {
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(width, i)
    ctx.stroke()
  }

  // X-axis (horizontal through center)
  ctx.strokeStyle = "#60a5fa"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, height / 2)
  ctx.lineTo(width, height / 2)
  ctx.stroke()

  // Y-axis (vertical through center)
  ctx.beginPath()
  ctx.moveTo(width / 2, 0)
  ctx.lineTo(width / 2, height)
  ctx.stroke()

  // Draw coordinate markers
  ctx.fillStyle = "#60a5fa"
  ctx.font = "bold 12px Inter"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  // X-axis markers (every 5 steps = 50px)
  for (let i = -25; i <= 25; i += 5) {
    if (i === 0) continue
    const x = width / 2 + i * 10
    ctx.fillRect(x - 1, height / 2 - 5, 2, 10)
    ctx.fillText(i.toString(), x, height / 2 + 15)
  }

  // Y-axis markers (every 5 steps = 50px)
  ctx.textAlign = "right"
  for (let i = -25; i <= 25; i += 5) {
    if (i === 0) continue
    const y = height / 2 - i * 10
    ctx.fillRect(width / 2 - 5, y - 1, 10, 2)
    ctx.fillText(i.toString(), width / 2 - 10, y)
  }

  // Origin marker
  ctx.fillStyle = "#fbbf24"
  ctx.font = "bold 14px Inter"
  ctx.textAlign = "left"
  ctx.fillText("(0,0)", width / 2 + 5, height / 2 - 5)
}

const drawTrail = (ctx: CanvasRenderingContext2D, trail: { x: number; y: number }[]) => {
  if (trail.length <= 1) return

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

const drawRobot = (ctx: CanvasRenderingContext2D, robotState: RobotState) => {
  ctx.save()
  ctx.translate(robotState.x, robotState.y)
  ctx.rotate((robotState.rotation * Math.PI) / 180)

  // Robot shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
  ctx.beginPath()
  ctx.ellipse(0, 28, 24, 8, 0, 0, Math.PI * 2)
  ctx.fill()

  // Body
  const bodyGradient = ctx.createLinearGradient(-25, -25, 25, 25)
  bodyGradient.addColorStop(0, "#60a5fa")
  bodyGradient.addColorStop(0.5, "#3b82f6")
  bodyGradient.addColorStop(1, "#2563eb")
  ctx.fillStyle = bodyGradient
  ctx.beginPath()
  ctx.roundRect(-25, -25, 50, 50, 10)
  ctx.fill()

  // Chest panel
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)"
  ctx.beginPath()
  ctx.roundRect(-22, -22, 44, 25, 8)
  ctx.fill()

  // Head
  const headGradient = ctx.createRadialGradient(-5, -10, 5, 0, 0, 18)
  headGradient.addColorStop(0, "#93c5fd")
  headGradient.addColorStop(1, "#60a5fa")
  ctx.fillStyle = headGradient
  ctx.beginPath()
  ctx.arc(0, -5, 18, 0, Math.PI * 2)
  ctx.fill()

  // Eyes
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

  // Mouth
  ctx.strokeStyle = "#1e293b"
  ctx.lineWidth = 2.5
  ctx.lineCap = "round"
  ctx.beginPath()
  ctx.arc(0, 3, 12, 0.2, Math.PI - 0.2)
  ctx.stroke()

  // Antenna
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

  // Direction arrow
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

  // Arms
  ctx.fillStyle = "#3b82f6"
  ctx.beginPath()
  ctx.roundRect(-30, -5, 5, 20, 2)
  ctx.roundRect(25, -5, 5, 20, 2)
  ctx.fill()

  ctx.restore()
}

const drawGoal = (ctx: CanvasRenderingContext2D, goal: { x: number; y: number }) => {
  const cx = 250 + goal.x * 10
  const cy = 250 - goal.y * 10

  ctx.save()
  ctx.strokeStyle = "rgba(250, 204, 21, 0.9)"
  ctx.lineWidth = 3
  ctx.setLineDash([6, 6])
  ctx.beginPath()
  ctx.arc(cx, cy, 16, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = "rgba(250, 204, 21, 0.85)"
  ctx.beginPath()
  const spikes = 5
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? 13 : 5.5
    const a = (i * Math.PI) / spikes - Math.PI / 2
    const px = cx + r * Math.cos(a)
    const py = cy + r * Math.sin(a)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

const drawObstacles = (ctx: CanvasRenderingContext2D, obstacles: { x: number; y: number }[]) => {
  for (const o of obstacles) {
    const cx = 250 + o.x * 10
    const cy = 250 - o.y * 10

    ctx.save()
    // Brick block, 26px so it reads clearly on the 10px grid
    const gradient = ctx.createLinearGradient(cx - 13, cy - 13, cx + 13, cy + 13)
    gradient.addColorStop(0, "#ef4444")
    gradient.addColorStop(1, "#991b1b")
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.roundRect(cx - 13, cy - 13, 26, 26, 4)
    ctx.fill()

    ctx.strokeStyle = "#fca5a5"
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(cx - 13, cy - 4)
    ctx.lineTo(cx + 13, cy - 4)
    ctx.moveTo(cx - 13, cy + 5)
    ctx.lineTo(cx + 13, cy + 5)
    ctx.stroke()
    ctx.restore()
  }
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
      isExecuting,
      runTarget,
      mode,
    } = useRobot()

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const bgCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const [dpr, setDpr] = useState(1)
    const [displayWidth, setDisplayWidth] = useState(500)
    const [robotState, setRobotState] = useState<RobotState>({
      x: 250,
      y: 250,
      rotation: 0,
    })
    const robotStateRef = useRef<RobotState>(robotState)
    const animationFrameRef = useRef<number | null>(null)
    const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null)

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
    }))

    // Retina/HiDPI: render at devicePixelRatio but keep 500x500 logical coordinates.
    useEffect(() => {
      const ratio = Math.min(window.devicePixelRatio || 1, 3)
      setDpr(ratio)

      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = 500 * ratio
        canvas.height = 500 * ratio
      }

      // ResizeObserver is missing in some test environments (jsdom).
      if (!canvas || typeof ResizeObserver === "undefined") return
      const observe = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width
        if (width) setDisplayWidth(width)
      })
      observe.observe(canvas)
      return () => observe.disconnect()
    }, [])

    // Static background is cached (drawn once per dpr/scale change).
    useEffect(() => {
      const bgCanvas = document.createElement("canvas")
      bgCanvas.width = 500 * dpr
      bgCanvas.height = 500 * dpr
      const bgCtx = bgCanvas.getContext("2d")
      if (bgCtx) {
        bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
        // Axis labels shrink on small screens; keep them legible (~11px minimum).
        const labelSize = displayWidth < 380 ? 18 : 12
        drawBackground(bgCtx, 500, 500, labelSize)
      }
      bgCanvasRef.current = bgCanvas
    }, [dpr, displayWidth])

    // Snap to target state when not executing (handles reset/clear)
    useEffect(() => {
      if (!isExecuting) {
        setRobotState(targetState)
        robotStateRef.current = targetState
      }
    }, [isExecuting, targetState])

    useEffect(() => {
      const animate = (): boolean => {
        const current = robotStateRef.current
        const dx = targetState.x - current.x
        const dy = targetState.y - current.y
        let dRotation = targetState.rotation - current.rotation

        while (dRotation > 180) dRotation -= 360
        while (dRotation < -180) dRotation += 360

        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1 && Math.abs(dRotation) < 0.1) {
          setRobotState(targetState)
          robotStateRef.current = targetState
          return false
        }

        const nextState = {
          x: current.x + dx * 0.15,
          y: current.y + dy * 0.15,
          rotation: current.rotation + dRotation * 0.15,
        }

        setRobotState(nextState)
        robotStateRef.current = nextState
        return true
      }

      const frame = () => {
        if (animate()) {
          animationFrameRef.current = requestAnimationFrame(frame)
        }
      }

      animationFrameRef.current = requestAnimationFrame(frame)

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
      const ctx = canvas?.getContext("2d")
      if (!canvas || !ctx) return

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (bgCanvasRef.current) {
        ctx.drawImage(bgCanvasRef.current, 0, 0)
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      if (runTarget.obstacles?.length) drawObstacles(ctx, runTarget.obstacles)
      if (mode !== "bebas") drawGoal(ctx, runTarget.goal)
      drawTrail(ctx, trail)
      drawRobot(ctx, robotState)
    }, [robotState, trail, runTarget, mode, dpr])

    return (
      <Card className="bg-slate-800 border-4 border-white shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-sky-700 p-3 sm:p-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white text-center">Medan Misi Robot</h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 relative">
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            role="img"
            aria-label={`Medan robot. Robot di (${Math.round((robotState.x - 250) / 10)}, ${Math.round((250 - robotState.y) / 10)}). ${mode === "bebas" ? "Mod bebas." : `Sasaran (${runTarget.goal.x}, ${runTarget.goal.y}).`}`}
            className="w-full max-w-[500px] h-auto aspect-square border-4 border-slate-600 rounded-lg shadow-lg cursor-crosshair [touch-action:pan-y]"
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

          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute bottom-4 inset-x-4 flex justify-center"
          >
            {message && (
              <p className="pointer-events-auto max-w-full rounded-full bg-white px-5 py-2 text-base sm:text-lg font-bold text-slate-900 shadow-lg animate-in fade-in slide-in-from-bottom-2">
                {message}
              </p>
            )}
          </div>

          <p className="pt-2 text-xs text-white/80 text-center">
            <span aria-hidden="true">⭐</span> sasaran · <span aria-hidden="true">🧱</span> halangan · garisan ungu = jejak robot
          </p>

          {currentLine >= 0 && (
            <div className="absolute top-8 right-8 bg-yellow-400 rounded-lg px-4 py-2 shadow-lg">
              <p className="text-sm font-bold text-slate-800">Baris {currentLine + 1}</p>
            </div>
          )}
        </div>
      </Card>
    )
  },
)

RobotCanvas.displayName = "RobotCanvas"
