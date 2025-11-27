"use client"

import { useState, useRef } from "react"
import { RobotCanvas, type RobotCanvasRef } from "@/components/robot-canvas"
import { CodeEditor } from "@/components/code-editor"
import { PlayerNameInput } from "@/components/player-name-input"
import { SummaryPage } from "@/components/summary-page"
import { captureCanvasScreenshot } from "@/lib/canvas-screenshot"
import { saveExecution, getSavedExecutions, clearSavedExecutions } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import type { SavedExecution } from "@/lib/types"
import { Heart } from "lucide-react"

type GameState = "name-input" | "playing" | "summary"

export default function PlaygroundPage() {
  const [gameState, setGameState] = useState<GameState>("name-input")
  const [playerName, setPlayerName] = useState("")
  const [commands, setCommands] = useState<string>("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionTrigger, setExecutionTrigger] = useState(0)
  const [resetTrigger, setResetTrigger] = useState(0)
  const [clearTrigger, setClearTrigger] = useState(0)
  const [savedExecutions, setSavedExecutions] = useState<SavedExecution[]>([])
  const robotCanvasRef = useRef<RobotCanvasRef>(null)
  const { toast } = useToast()

  const handleStartGame = (name: string) => {
    setPlayerName(name)
    setGameState("playing")
    setSavedExecutions([])
    clearSavedExecutions()
  }

  const handleRun = () => {
    setIsExecuting(true)
    setExecutionTrigger((prev) => prev + 1)
  }

  const handleStop = () => {
    setIsExecuting(false)
  }

  const handleReset = () => {
    setIsExecuting(false)
    setResetTrigger((prev) => prev + 1)
  }

  const handleClear = () => {
    setIsExecuting(false)
    setCommands("")
    setClearTrigger((prev) => prev + 1)
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
    }

    saveExecution(execution)
    setSavedExecutions((prev) => [...prev, execution])

    toast({
      title: "Saved!",
      description: "Your code execution has been saved.",
    })

    handleClear()
  }

  const handleEndGame = () => {
    setSavedExecutions(getSavedExecutions())
    setGameState("summary")
  }

  const handleBackToStart = () => {
    setCommands("")
    setClearTrigger((prev) => prev + 1)
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
            Welcome back, {playerName}! Program your robot with simple commands!
          </p>
        </div>

        {/* Main Content - Split Screen */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
          {/* Left Panel - Robot Canvas */}
          <RobotCanvas
            ref={robotCanvasRef}
            commands={commands}
            isExecuting={isExecuting}
            executionTrigger={executionTrigger}
            resetTrigger={resetTrigger}
            clearTrigger={clearTrigger}
            onExecutionComplete={() => setIsExecuting(false)}
          />

          {/* Right Panel - Code Editor */}
          <CodeEditor
            code={commands}
            onCodeChange={setCommands}
            onRun={handleRun}
            onStop={handleStop}
            onReset={handleReset}
            onClear={handleClear}
            onSave={handleSave}
            onEndGame={handleEndGame}
            isExecuting={isExecuting}
          />
        </div>
      </div>

      <footer className="py-4 text-center text-white/90 text-sm backdrop-blur-sm bg-black/10">
        <p className="flex items-center justify-center gap-2">
          Made with <Heart className="w-4 h-4 fill-red-500 text-red-500" /> by Ustaz Najmi | 2025
        </p>
      </footer>
    </div>
  )
}
