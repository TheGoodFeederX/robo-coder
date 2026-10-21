"use client"

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react"
import { Command, parseCode } from "@/lib/parser"
import { executeCommands } from "@/lib/executor"
import { LEVELS, countLines, isAtGoal, isBlocked, starsFor, type Level } from "@/lib/levels"
import { getProgress, recordLevelResult } from "@/lib/storage"
import type { ProgressMap } from "@/lib/types"

export interface RobotState {
  x: number
  y: number
  rotation: number
}

interface RobotContextType {
  targetState: RobotState
  commands: string
  isExecuting: boolean
  currentLine: number
  message: string
  trail: { x: number; y: number }[]
  level: Level
  levelIndex: number
  won: boolean
  stars: number
  progress: ProgressMap
  selectLevel: (index: number) => void
  nextLevel: () => void
  updateCommands: (code: string) => void
  runCommands: () => void
  stopExecution: () => void
  resetRobot: () => void
  clearAll: () => void
}

const RobotContext = createContext<RobotContextType | undefined>(undefined)

export function RobotProvider({ children }: { children: React.ReactNode }) {
  const [commands, setCommands] = useState("")
  const [targetState, setTargetState] = useState<RobotState>({ x: 250, y: 250, rotation: 0 })
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentLine, setCurrentLine] = useState(-1)
  const [message, setMessage] = useState("")
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([{ x: 250, y: 250 }])
  const [levelIndex, setLevelIndex] = useState(0)
  const [won, setWon] = useState(false)
  const [stars, setStars] = useState(0)
  const [progress, setProgress] = useState<ProgressMap>({})

  const executionRef = useRef<(() => void) | null>(null)
  const targetRef = useRef(targetState)
  const levelRef = useRef<Level>(LEVELS[0])

  const level = LEVELS[levelIndex]
  levelRef.current = level

  const updateCommands = (code: string) => setCommands(code)

  const stopExecution = useCallback(() => {
    if (executionRef.current) {
      executionRef.current()
      executionRef.current = null
    }
    setIsExecuting(false)
    setCurrentLine(-1)
    setMessage("")
  }, [])

  const resetRobot = useCallback(() => {
    stopExecution()
    setTargetState({ x: 250, y: 250, rotation: 0 })
    targetRef.current = { x: 250, y: 250, rotation: 0 }
    setTrail([{ x: 250, y: 250 }])
    setMessage("")
    setWon(false)
    setStars(0)
  }, [stopExecution])

  const clearAll = useCallback(() => {
    resetRobot()
    setCommands("")
  }, [resetRobot])

  // Progress lives in localStorage, read after mount to stay SSR-safe.
  useEffect(() => setProgress(getProgress()), [])

  const selectLevel = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(LEVELS.length - 1, index))
      setLevelIndex(clamped)
      clearAll()
      setCommands(LEVELS[clamped].starter ?? "")
    },
    [clearAll],
  )

  const nextLevel = useCallback(() => {
    const clamped = Math.min(LEVELS.length - 1, levelIndex + 1)
    setLevelIndex(clamped)
    clearAll()
    setCommands(LEVELS[clamped].starter ?? "")
  }, [clearAll, levelIndex])

  const runCommands = useCallback(() => {
    stopExecution()

    const parsed = parseCode(commands)
    if (parsed.errors.length > 0) {
      setMessage(`Error: ${parsed.errors[0]}`)
      return
    }

    setWon(false)
    setStars(0)
    setIsExecuting(true)

    const stop = executeCommands(
      parsed.commands,
      (updater) => {
        // Compute eagerly so the final position is available synchronously.
        const prev = targetRef.current
        const next = updater(prev)
        targetRef.current = next
        setTargetState(next)
        if (next.x !== prev.x || next.y !== prev.y) {
          setTrail((t) => [...t, { x: next.x, y: next.y }])
        }
      },
      setMessage,
      setCurrentLine,
      () => {
        setIsExecuting(false)
        executionRef.current = null

        const goal = levelRef.current.goal
        if (!isAtGoal(targetRef.current, goal)) {
          setMessage("Not there yet — try again!")
          return
        }

        const lines = countLines(commands)
        const earned = starsFor(lines, levelRef.current.par)
        setWon(true)
        setStars(earned)
        setProgress(recordLevelResult(levelRef.current.id, earned, lines))
        setMessage(`Level cleared with ${"★".repeat(earned)}!`)
      },
      {
        isBlocked: (state) => isBlocked(state, levelRef.current.obstacles),
        onBlocked: () => {
          setIsExecuting(false)
          executionRef.current = null
        },
      },
    )

    executionRef.current = stop
  }, [commands, stopExecution])

  return (
    <RobotContext.Provider value={{
      targetState, commands, isExecuting, currentLine, message, trail,
      level, levelIndex, won, stars, progress, selectLevel, nextLevel,
      updateCommands, runCommands, stopExecution, resetRobot, clearAll
    }}>
      {children}
    </RobotContext.Provider>
  )
}

export function useRobot() {
  const context = useContext(RobotContext)
  if (context === undefined) {
    throw new Error("useRobot must be used within a RobotProvider")
  }
  return context
}
