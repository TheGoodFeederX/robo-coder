"use client"

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react"
import { parseCode } from "@/lib/parser"
import { executeCommands } from "@/lib/executor"
import { LEVELS, countLines, isAtGoal, isBlocked, lineBudget, starsFor, type Level } from "@/lib/levels"
import {
  getLevelIndex,
  getProgress,
  getSoundEnabled,
  recordLevelResult,
  saveLevelIndex,
  saveSoundEnabled,
} from "@/lib/storage"
import { play, setMuted } from "@/lib/sfx"
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
  attempts: number
  hintUsed: boolean
  soundOn: boolean
  progress: ProgressMap
  selectLevel: (index: number) => void
  nextLevel: () => void
  revealHint: () => void
  toggleSound: () => void
  updateCommands: (code: string) => void
  runCommands: () => void
  stopExecution: () => void
  resetRobot: () => void
  clearAll: () => void
}

/** Hint costs the third star, so hints stay honest. */
const MAX_STARS_WITH_HINT = 2

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
  const [attempts, setAttempts] = useState(0)
  const [hintUsed, setHintUsed] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [progress, setProgress] = useState<ProgressMap>({})

  const executionRef = useRef<(() => void) | null>(null)
  const targetRef = useRef(targetState)
  const levelRef = useRef<Level>(LEVELS[0])
  const hintRef = useRef(false)

  const level = LEVELS[levelIndex]
  levelRef.current = level
  hintRef.current = hintUsed

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
    setAttempts(0)
    setHintUsed(false)
  }, [stopExecution])

  const clearAll = useCallback(() => {
    resetRobot()
    setCommands("")
  }, [resetRobot])

  // Browser-only state (progress, last level, sound pref) is read after mount for SSR safety.
  useEffect(() => {
    const savedSound = getSoundEnabled()
    setSoundOn(savedSound)
    setMuted(!savedSound)
    setProgress(getProgress())

    const savedLevel = getLevelIndex()
    if (savedLevel > 0 && savedLevel < LEVELS.length) {
      setLevelIndex(savedLevel)
      setCommands(LEVELS[savedLevel].starter ?? "")
    }
  }, [])

  const goToLevel = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(LEVELS.length - 1, index))
      setLevelIndex(clamped)
      saveLevelIndex(clamped)
      clearAll()
      setCommands(LEVELS[clamped].starter ?? "")
    },
    [clearAll],
  )

  const selectLevel = useCallback((index: number) => goToLevel(index), [goToLevel])

  const nextLevel = useCallback(() => goToLevel(levelIndex + 1), [goToLevel, levelIndex])

  const revealHint = useCallback(() => {
    setHintUsed(true)
    play("click")
  }, [])

  const toggleSound = useCallback(() => {
    setSoundOn((on) => {
      const next = !on
      saveSoundEnabled(next)
      setMuted(!next)
      if (next) play("click")
      return next
    })
  }, [])

  const runCommands = useCallback(() => {
    stopExecution()

    const parsed = parseCode(commands)
    if (parsed.errors.length > 0) {
      setMessage(`Ralat: ${parsed.errors[0]}`)
      return
    }

    const budget = lineBudget(levelRef.current)
    const lines = countLines(commands)
    if (lines > budget) {
      setMessage(`Arahan terlalu banyak: ${lines}/${budget}. Pendekkan kod anda!`)
      return
    }

    setWon(false)
    setStars(0)
    setAttempts((n) => n + 1)
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

        if (!isAtGoal(targetRef.current, levelRef.current.goal)) {
          setMessage("Belum sampai — cuba lagi!")
          return
        }

        const earned = Math.min(starsFor(lines, levelRef.current.par), hintRef.current ? MAX_STARS_WITH_HINT : 3)
        setWon(true)
        setStars(earned)
        setProgress(recordLevelResult(levelRef.current.id, earned, lines))
        setMessage(`Tahap selesai! ${"★".repeat(earned)}`)
        play("win")
      },
      {
        isBlocked: (state) => isBlocked(state, levelRef.current.obstacles),
        onBlocked: () => {
          setIsExecuting(false)
          executionRef.current = null
          play("crash")
        },
        onEvent: (event) => play(event),
      },
    )

    executionRef.current = stop
  }, [commands, stopExecution])

  return (
    <RobotContext.Provider
      value={{
        targetState,
        commands,
        isExecuting,
        currentLine,
        message,
        trail,
        level,
        levelIndex,
        won,
        stars,
        attempts,
        hintUsed,
        soundOn,
        progress,
        selectLevel,
        nextLevel,
        revealHint,
        toggleSound,
        updateCommands,
        runCommands,
        stopExecution,
        resetRobot,
        clearAll,
      }}
    >
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
