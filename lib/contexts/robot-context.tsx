"use client"

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react"
import { parseCode } from "@/lib/parser"
import { executeCommands } from "@/lib/executor"
import { LEVELS, countLines, isAtGoal, isBlocked, lineBudget, starsFor, type GridPoint, type Level } from "@/lib/levels"
import {
  getExam,
  getExamResults,
  getLevelIndex,
  getMode,
  getProgress,
  getSoundEnabled,
  recordLevelResult,
  saveExamResult,
  saveLevelIndex,
  saveMode,
  saveSoundEnabled,
} from "@/lib/storage"
import { play, setMuted } from "@/lib/sfx"
import type { Mode } from "@/lib/modes"
import { scoreExam, type Exam, type ExamResult, type ExamTaskResult } from "@/lib/exam"
import type { ProgressMap } from "@/lib/types"

export interface RobotState {
  x: number
  y: number
  rotation: number
}

/** What the robot is currently trying to do — keeps the canvas mode-agnostic. */
export interface RunTarget {
  goal: GridPoint
  obstacles?: GridPoint[]
}

interface RobotContextType {
  mode: Mode | null
  chooseMode: (mode: Mode) => void
  changeMode: () => void
  targetState: RobotState
  commands: string
  isExecuting: boolean
  currentLine: number
  errorLines: number[]
  message: string
  trail: { x: number; y: number }[]
  level: Level
  levelIndex: number
  runTarget: RunTarget
  won: boolean
  stars: number
  attempts: number
  hintUsed: boolean
  soundOn: boolean
  progress: ProgressMap
  exam: Exam
  examTaskIndex: number
  examResults: ExamTaskResult[]
  selectLevel: (index: number) => void
  nextLevel: () => void
  revealHint: () => void
  toggleSound: () => void
  updateCommands: (code: string) => void
  runCommands: () => void
  stopExecution: () => void
  resetRobot: () => void
  clearAll: () => void
  startExam: (exam: Exam) => void
  nextExamTask: () => void
  submitExam: (playerName: string) => ExamResult | null
}

/** Hint costs the third star, so hints stay honest. */
const MAX_STARS_WITH_HINT = 2

/** Mod Bebas still needs a visible marker; the robot can roam the whole field. */
const FREE_TARGET: RunTarget = { goal: { x: 0, y: 0 }, obstacles: [] }

const RobotContext = createContext<RobotContextType | undefined>(undefined)

export function RobotProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode | null>(null)
  const [commands, setCommands] = useState("")
  const [targetState, setTargetState] = useState<RobotState>({ x: 250, y: 250, rotation: 0 })
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentLine, setCurrentLine] = useState(-1)
  const [errorLines, setErrorLines] = useState<number[]>([])
  const [message, setMessage] = useState("")
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([{ x: 250, y: 250 }])
  const [levelIndex, setLevelIndex] = useState(0)
  const [won, setWon] = useState(false)
  const [stars, setStars] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [hintUsed, setHintUsed] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [progress, setProgress] = useState<ProgressMap>({})
  const [exam, setExam] = useState<Exam | null>(null)
  const [examTaskIndex, setExamTaskIndex] = useState(0)
  const [examResults, setExamResults] = useState<ExamTaskResult[]>([])

  const executionRef = useRef<(() => void) | null>(null)
  const targetRef = useRef(targetState)
  const modeRef = useRef<Mode | null>(null)
  const runTargetRef = useRef<RunTarget>(FREE_TARGET)
  const levelRef = useRef(LEVELS[0])
  const examRef = useRef<Exam | null>(null)
  const hintRef = useRef(false)

  modeRef.current = mode
  examRef.current = exam
  hintRef.current = hintUsed

  const level = LEVELS[levelIndex]
  levelRef.current = level

  const examTask = exam ? exam.tasks[examTaskIndex] : undefined

  const runTarget: RunTarget =
    mode === "ujian" && examTask
      ? { goal: examTask.goal, obstacles: examTask.obstacles }
      : mode === "bebas"
        ? FREE_TARGET
        : { goal: level.goal, obstacles: level.obstacles }
  runTargetRef.current = runTarget

  const updateCommands = (code: string) => {
    setCommands(code)
    if (errorLines.length) setErrorLines([])
  }

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

  // Browser-only state is read after mount for SSR safety.
  useEffect(() => {
    const savedSound = getSoundEnabled()
    setSoundOn(savedSound)
    setMuted(!savedSound)
    setProgress(getProgress())
    setMode(getMode())
    setExam(getExam())

    const savedLevel = getLevelIndex()
    if (savedLevel > 0 && savedLevel < LEVELS.length) {
      setLevelIndex(savedLevel)
      setCommands(LEVELS[savedLevel].starter ?? "")
    }
  }, [])

  // Keep one result slot per exam task, whoever started the run.
  useEffect(() => {
    if (!exam) return
    setExamResults((prev) => {
      if (prev.length === exam.tasks.length) return prev
      return exam.tasks.map((t) => prev.find((r) => r.taskId === t.id) ?? { taskId: t.id, completed: false })
    })
  }, [exam])

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

  const chooseMode = useCallback(
    (next: Mode) => {
      setMode(next)
      saveMode(next)
      clearAll()
      if (next === "jelajah") setCommands(LEVELS[levelIndex].starter ?? "")
      play("click")
    },
    [clearAll, levelIndex],
  )

  const changeMode = useCallback(() => {
    stopExecution()
    setMode(null)
    clearAll()
  }, [clearAll, stopExecution])

  const startExam = useCallback(
    (examToRun: Exam) => {
      setExam(examToRun)
      setExamTaskIndex(0)
      setExamResults(examToRun.tasks.map((t) => ({ taskId: t.id, completed: false })))
      setMode("ujian")
      saveMode("ujian")
      clearAll()
      play("click")
    },
    [clearAll],
  )

  const nextExamTask = useCallback(() => {
    setExamTaskIndex((i) => Math.min((examRef.current?.tasks.length ?? 1) - 1, i + 1))
    resetRobot()
  }, [resetRobot])

  const submitExam = useCallback(
    (playerName: string): ExamResult | null => {
      const currentExam = examRef.current
      if (!currentExam) return null

      const result: ExamResult = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        playerName,
        examTitle: currentExam.title,
        timestamp: Date.now(),
        ...scoreExam(currentExam, examResults),
      }
      saveExamResult(result)
      setMessage(`Keputusan dihantar: ${result.score}/${result.total}`)
      play("win")
      return result
    },
    [examResults],
  )

  const runCommands = useCallback(() => {
    stopExecution()

    const parsed = parseCode(commands)
    if (parsed.errors.length > 0) {
      setErrorLines(parsed.errorLines)
      setMessage(`Ralat: ${parsed.errors[0]}`)
      return
    }
    setErrorLines([])

    const activeMode = modeRef.current
    const lines = countLines(commands)

    // Mod Bebas: no goal, no line limit, no score.
    if (activeMode !== "bebas") {
      const cap =
        activeMode === "ujian" && examRef.current ? examRef.current.tasks[examTaskIndex].maxLines : lineBudget(levelRef.current)
      if (lines > cap) {
        setMessage(`Arahan terlalu banyak: ${lines}/${cap}. Pendekkan kod anda!`)
        return
      }
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

        if (modeRef.current === "bebas") {
          setMessage("Selesai! Robot berhenti di sini.")
          return
        }

        const goal = runTargetRef.current.goal
        if (!isAtGoal(targetRef.current, goal)) {
          setMessage("Belum sampai — cuba lagi!")
          return
        }

        if (modeRef.current === "ujian") {
          const taskIndex = examTaskIndex
          setExamResults((prev) =>
            prev.map((r, i) => (i === taskIndex ? { ...r, completed: true, lines } : r)),
          )
          setWon(true)
          setStars(1)
          setMessage("Tugasan selesai!")
          play("win")
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
        isBlocked: (state) => isBlocked(state, runTargetRef.current.obstacles),
        onBlocked: () => {
          setIsExecuting(false)
          executionRef.current = null
          play("crash")
        },
        onEvent: (event) => play(event),
      },
    )

    executionRef.current = stop
  }, [commands, stopExecution, examTaskIndex])

  return (
    <RobotContext.Provider
      value={{
        mode,
        chooseMode,
        changeMode,
        targetState,
        commands,
        isExecuting,
        currentLine,
        errorLines,
        message,
        trail,
        level,
        levelIndex,
        runTarget,
        won,
        stars,
        attempts,
        hintUsed,
        soundOn,
        progress,
        exam: exam ?? getExam(),
        examTaskIndex,
        examResults,
        selectLevel,
        nextLevel,
        revealHint,
        toggleSound,
        updateCommands,
        runCommands,
        stopExecution,
        resetRobot,
        clearAll,
        startExam,
        nextExamTask,
        submitExam,
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
