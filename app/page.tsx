"use client"

import { useEffect, useState, useRef } from "react"
import { RobotCanvas, type RobotCanvasRef } from "@/components/robot-canvas"
import { CodeEditor } from "@/components/code-editor"
import { PlayerNameInput } from "@/components/player-name-input"
import { LevelPanel } from "@/components/level-panel"
import { SummaryPage } from "@/components/summary-page"
import { captureCanvasScreenshot } from "@/lib/canvas-screenshot"
import {
  saveExecution,
  getSavedExecutions,
  clearSavedExecutions,
  clearPlayerName,
  getPlayerName,
  savePlayerName,
} from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import type { SavedExecution } from "@/lib/types"
import { Heart } from "lucide-react"
import { RobotProvider, useRobot } from "@/lib/contexts/robot-context"

type GameState = "name-input" | "playing" | "summary"

function PlaygroundContent() {
  const [gameState, setGameState] = useState<GameState>("name-input")
  const [playerName, setPlayerName] = useState("")
  const [savedExecutions, setSavedExecutions] = useState<SavedExecution[]>([])
  const robotCanvasRef = useRef<RobotCanvasRef>(null)
  const { toast } = useToast()

  // Use values and functions from RobotContext
  const { commands, clearAll, level, stars, selectLevel } = useRobot()

  // Resume the last player automatically so a kid can close the tab and come back.
  useEffect(() => {
    const saved = getPlayerName()
    if (!saved) return
    setPlayerName(saved)
    setSavedExecutions(getSavedExecutions())
    setGameState("playing")
  }, [])

  const handleStartGame = (name: string) => {
    setPlayerName(name)
    savePlayerName(name)
    setGameState("playing")
    setSavedExecutions([])
    clearSavedExecutions()
  }

  const handleSave = () => {
    const canvas = robotCanvasRef.current?.getCanvas()
    if (!canvas || !commands.trim()) return

    const screenshot = captureCanvasScreenshot(canvas)
    const execution: SavedExecution = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      playerName,
      commands,
      screenshot,
      levelId: level.id,
      stars,
    }

    saveExecution(execution)
    setSavedExecutions((prev) => [...prev, execution])

    toast({
      title: "Disimpan!",
      description: "Rekod kod anda telah disimpan.",
    })
  }

  const handleEndGame = () => {
    setSavedExecutions(getSavedExecutions())
    setGameState("summary")
  }

  const handleBackToStart = () => {
    clearAll()
    selectLevel(0)
    clearPlayerName()
    setPlayerName("")
    setSavedExecutions([])
    clearSavedExecutions()
    setGameState("name-input")
  }

  if (gameState === "name-input") {
    return <PlayerNameInput onStartGame={handleStartGame} />
  }

  if (gameState === "summary") {
    return <SummaryPage playerName={playerName} savedExecutions={savedExecutions} onBackToStart={handleBackToStart} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex flex-col">
      <div className="container mx-auto p-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-5xl font-bold text-white drop-shadow-lg">🤖 Robo-Coder Playground</h1>
          <p className="text-xl text-white/90 mt-2">
            Selamat kembali, {playerName}! Gerakkan robot dengan arahan mudah!
          </p>
        </div>

        {/* Level Bar */}
        <div className="pb-4">
          <LevelPanel />
        </div>

        {/* Main Content - Split Screen */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
          {/* Left Panel - Robot Canvas */}
          <RobotCanvas
            ref={robotCanvasRef}
          />

          {/* Right Panel - Code Editor */}
          <CodeEditor
            onSave={handleSave}
            onEndGame={handleEndGame}
          />
        </div>
      </div>

      <footer className="py-4 text-center text-white/90 text-sm backdrop-blur-sm bg-black/10">
        <p className="flex items-center justify-center gap-2">
          Dibina dengan <Heart className="w-4 h-4 fill-red-500 text-red-500" /> oleh Ustaz Najmi | 2025
        </p>
      </footer>
    </div>
  )
}

export default function PlaygroundPage() {
  return (
    <RobotProvider>
      <PlaygroundContent />
    </RobotProvider>
  )
}
