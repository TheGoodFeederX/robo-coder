"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { RobotCanvas, type RobotCanvasRef } from "@/components/robot-canvas"
import { CodeEditor } from "@/components/code-editor"
import { PlayerNameInput } from "@/components/player-name-input"
import { SummaryPage } from "@/components/summary-page"
import { LevelPanel } from "@/components/level-panel"
import { ModePicker } from "@/components/mode-picker"
import { ExamPanel, FreePanel } from "@/components/mode-panels"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { captureCanvasScreenshot } from "@/lib/canvas-screenshot"
import {
  saveExecution,
  getSavedExecutions,
  clearSavedExecutions,
  clearPlayerName,
  getPlayerName,
  getMode,
  getExam,
  savePlayerName,
} from "@/lib/storage"
import type { SavedExecution } from "@/lib/types"
import type { Mode } from "@/lib/modes"
import { Heart, Home, LayoutGrid, Monitor, Code2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RobotProvider, useRobot } from "@/lib/contexts/robot-context"

type Screen = "name" | "mode" | "play" | "summary"

interface UrlState {
  screen: Screen
  mode: Mode | null
  level?: number
}

function urlFor(state: UrlState): string {
  const params = new URLSearchParams()
  if (state.screen === "play" || state.screen === "summary") {
    if (state.mode) params.set("mod", state.mode)
    if (state.mode === "jelajah" && state.level && state.level > 1) params.set("tahap", String(state.level))
  }
  const query = params.toString()
  return query ? `/?${query}` : "/"
}

function PlaygroundContent() {
  const [screen, setScreen] = useState<Screen>("name")
  const [playerName, setPlayerName] = useState("")
  const [savedExecutions, setSavedExecutions] = useState<SavedExecution[]>([])
  const [mobileTab, setMobileTab] = useState<"field" | "code">("field")
  const [askClearRecords, setAskClearRecords] = useState(false)
  const robotCanvasRef = useRef<RobotCanvasRef>(null)
  const router = useRouter()

  const { commands, clearAll, level, levelIndex, stars, mode, chooseMode, changeMode, startExam, selectLevel } = useRobot()

  const goTo = useCallback(
    (next: Screen, urlMode: Mode | null, levelNumber?: number) => {
      window.history.pushState(
        { screen: next, mode: urlMode, level: levelNumber },
        "",
        urlFor({ screen: next, mode: urlMode, level: levelNumber }),
      )
      setScreen(next)
    },
    [],
  )

  // Browser/Android back must walk inside the app, not exit it (audit P9).
  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const state = event.state as UrlState | null
      if (!state?.screen) {
        setScreen("name")
        return
      }
      if (state.screen === "play" && state.mode) {
        chooseMode(state.mode)
        if (state.mode === "ujian") startExam(getExam())
        if (state.mode === "jelajah" && state.level) selectLevel(state.level - 1)
      }
      setScreen(state.screen)
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [chooseMode, selectLevel, startExam])

  // Deep links: /?mod=jelajah&tahap=3 so a teacher can send a direct link.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlMode = params.get("mod")
    if (urlMode !== "bebas" && urlMode !== "jelajah" && urlMode !== "ujian") return

    setPlayerName(getPlayerName() || "Tetamu")
    setSavedExecutions(getSavedExecutions())
    chooseMode(urlMode)
    if (urlMode === "ujian") startExam(getExam())
    const levelNumber = Number(params.get("tahap") ?? "0")
    if (urlMode === "jelajah" && levelNumber > 0) selectLevel(levelNumber - 1)
    window.history.replaceState({ screen: "play", mode: urlMode, level: levelNumber }, "", window.location.search)
    setScreen("play")
  }, [chooseMode, selectLevel, startExam])

  // Resume the last player automatically so a kid can close the tab and come back.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mod")) return
    const saved = getPlayerName()
    if (!saved) return
    setPlayerName(saved)
    setSavedExecutions(getSavedExecutions())
    const savedMode = getMode()
    if (savedMode === "ujian") startExam(getExam())
    setScreen(savedMode ? "play" : "mode")
    if (savedMode) {
      window.history.replaceState({ screen: "play", mode: savedMode }, "", urlFor({ screen: "play", mode: savedMode }))
    }
  }, [startExam])

  const handleStartGame = (name: string) => {
    savePlayerName(name)
    setPlayerName(name)
    setSavedExecutions([])
    goTo("mode", null)
  }

  const handleChooseMode = (next: Mode) => {
    chooseMode(next)
    if (next === "ujian") startExam(getExam())
    setMobileTab("field")
    goTo("play", next, 1)
  }

  const handleChangeMode = () => {
    changeMode()
    goTo("mode", null)
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
  }

  const handleEndGame = () => {
    setSavedExecutions(getSavedExecutions())
    goTo("summary", mode)
  }

  const handleContinue = () => {
    goTo("play", mode, levelIndex + 1)
  }

  const resetToName = () => {
    clearAll()
    selectLevel(0)
    clearPlayerName()
    setPlayerName("")
    setSavedExecutions([])
    clearSavedExecutions()
    setAskClearRecords(false)
    goTo("name", null)
  }

  const handleBackToStart = () => {
    if (savedExecutions.length > 0) {
      setAskClearRecords(true)
      return
    }
    resetToName()
  }

  if (screen === "name") {
    return <PlayerNameInput onStartGame={handleStartGame} />
  }

  if (screen === "mode") {
    return <ModePicker playerName={playerName} onChoose={handleChooseMode} onAdmin={() => router.push("/admin")} />
  }

  if (screen === "summary") {
    return (
      <>
        <SummaryPage
          playerName={playerName}
          savedExecutions={savedExecutions}
          onBackToStart={handleBackToStart}
          onContinue={handleContinue}
        />
        <ConfirmDialog
          open={askClearRecords}
          title="Padam semua rekod?"
          description="Semua rekod yang disimpan untuk pemain ini akan dipadam. Tindakan ini tidak boleh dibatalkan."
          confirmLabel="Ya, padam"
          onConfirm={resetToName}
          onCancel={() => setAskClearRecords(false)}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 via-fuchsia-700 to-rose-600 flex flex-col">
      <div className="container mx-auto px-3 py-2 sm:p-4 flex-1 flex flex-col">
        {/* Compact play header: one row on mobile, roomier on desktop */}
        <div className="flex items-center justify-between gap-2 py-2">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-white truncate">
              <span aria-hidden="true">🤖 </span>Robo-Coder
            </h1>
            <p className="text-white/90 text-xs sm:text-sm truncate">
              {playerName} ·{" "}
              {mode === "bebas"
                ? "Mod Bebas"
                : mode === "ujian"
                  ? "Mod Ujian"
                  : `Tahap ${levelIndex + 1}: ${level.title}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleChangeMode} size="icon" variant="outline" aria-label="Tukar mod">
              <LayoutGrid className="w-5 h-5" aria-hidden="true" />
            </Button>
            <Button onClick={handleEndGame} size="icon" variant="outline" aria-label="Ke ringkasan">
              <Home className="w-5 h-5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Mode panel */}
        <div className="pb-2 sm:pb-3">
          {mode === "jelajah" && <LevelPanel />}
          {mode === "bebas" && <FreePanel />}
          {mode === "ujian" && <ExamPanel playerName={playerName} />}
        </div>

        {/* Mobile tabs so the robot and the code are one tap apart (audit P5) */}
        <div className="lg:hidden flex gap-2 pb-2" role="tablist" aria-label="Paparan">
          <Button
            role="tab"
            aria-selected={mobileTab === "field"}
            aria-controls="field-panel"
            id="field-tab"
            onClick={() => setMobileTab("field")}
            variant={mobileTab === "field" ? "warning" : "outline"}
            className="flex-1"
          >
            <Monitor className="mr-1 w-4 h-4" aria-hidden="true" /> Medan
          </Button>
          <Button
            role="tab"
            aria-selected={mobileTab === "code"}
            aria-controls="code-panel"
            id="code-tab"
            onClick={() => setMobileTab("code")}
            variant={mobileTab === "code" ? "warning" : "outline"}
            className="flex-1"
          >
            <Code2 className="mr-1 w-4 h-4" aria-hidden="true" /> Kod
          </Button>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 pb-4">
          <div
            id="field-panel"
            role="tabpanel"
            aria-labelledby="field-tab"
            className={`${mobileTab === "field" ? "flex" : "hidden"} lg:flex flex-col`}
          >
            <RobotCanvas ref={robotCanvasRef} />
          </div>
          <div
            id="code-panel"
            role="tabpanel"
            aria-labelledby="code-tab"
            className={`${mobileTab === "code" ? "flex" : "hidden"} lg:flex flex-col`}
          >
            <CodeEditor onSave={handleSave} onEndGame={handleEndGame} />
          </div>
        </div>
      </div>

      <footer className="hidden sm:block py-3 text-center text-white/90 text-sm backdrop-blur-sm bg-black/10">
        <p className="flex items-center justify-center gap-2">
          Dibina dengan <Heart className="w-4 h-4 fill-red-400 text-red-400" aria-hidden="true" /> oleh Ustaz Najmi
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
