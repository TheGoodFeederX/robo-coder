"use client"

import React, { createContext, useContext, useState, useRef, useCallback } from "react"
import { Command, parseCode } from "@/lib/parser"

export interface RobotState {
  x: number
  y: number
  rotation: number
}

interface RobotContextType {
  robotState: RobotState
  targetState: RobotState
  commands: string
  isExecuting: boolean
  currentLine: number
  message: string
  trail: { x: number; y: number }[]
  updateCommands: (code: string) => void
  runCommands: () => void
  stopExecution: () => void
  resetRobot: () => void
  clearAll: () => void
}

const RobotContext = createContext<RobotContextType | undefined>(undefined)

export function RobotProvider({ children }: { children: React.ReactNode }) {
  const [commands, setCommands] = useState("")
  const [robotState, setRobotState] = useState<RobotState>({ x: 250, y: 250, rotation: 0 })
  const [targetState, setTargetState] = useState<RobotState>({ x: 250, y: 250, rotation: 0 })
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentLine, setCurrentLine] = useState(-1)
  const [message, setMessage] = useState("")
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([{ x: 250, y: 250 }])

  const executionRef = useRef<(() => void) | null>(null)

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
    setRobotState({ x: 250, y: 250, rotation: 0 })
    setTargetState({ x: 250, y: 250, rotation: 0 })
    setTrail([{ x: 250, y: 250 }])
    setMessage("")
  }, [stopExecution])

  const clearAll = useCallback(() => {
    resetRobot()
    setCommands("")
  }, [resetRobot])

  const runCommands = () => {
    // Placeholder
  }

  return (
    <RobotContext.Provider value={{
      robotState, targetState, commands, isExecuting, currentLine, message, trail,
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
