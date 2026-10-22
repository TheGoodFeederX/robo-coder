import type { ProgressMap, SavedExecution } from "./types"

const STORAGE_KEY = "robo-coder-saves"
const PROGRESS_KEY = "robo-coder-progress"
const PLAYER_KEY = "robo-coder-player"
const LEVEL_KEY = "robo-coder-level"
const SOUND_KEY = "robo-coder-sound"

export function getSavedExecutions(): SavedExecution[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

export function saveExecution(execution: SavedExecution): void {
  const executions = getSavedExecutions()
  executions.push(execution)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(executions))
}

export function clearSavedExecutions(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function getProgress(): ProgressMap {
  if (typeof window === "undefined") return {}
  const data = localStorage.getItem(PROGRESS_KEY)
  return data ? JSON.parse(data) : {}
}

/** Keeps the better of the old and new result. Returns the updated map. */
export function recordLevelResult(levelId: string, stars: number, lines: number): ProgressMap {
  const progress = getProgress()
  const prev = progress[levelId]
  progress[levelId] = {
    stars: Math.max(stars, prev?.stars ?? 0),
    bestLines: prev ? Math.min(lines, prev.bestLines) : lines,
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
  }
  return progress
}

export function getPlayerName(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem(PLAYER_KEY) ?? ""
}

export function savePlayerName(name: string): void {
  if (typeof window !== "undefined") localStorage.setItem(PLAYER_KEY, name)
}

export function clearPlayerName(): void {
  if (typeof window !== "undefined") localStorage.removeItem(PLAYER_KEY)
}

export function getLevelIndex(): number {
  if (typeof window === "undefined") return 0
  const raw = localStorage.getItem(LEVEL_KEY)
  const index = raw ? Number.parseInt(raw, 10) : 0
  return Number.isFinite(index) && index >= 0 ? index : 0
}

export function saveLevelIndex(index: number): void {
  if (typeof window !== "undefined") localStorage.setItem(LEVEL_KEY, String(index))
}

export function getSoundEnabled(): boolean {
  if (typeof window === "undefined") return true
  return localStorage.getItem(SOUND_KEY) !== "off"
}

export function saveSoundEnabled(enabled: boolean): void {
  if (typeof window !== "undefined") localStorage.setItem(SOUND_KEY, enabled ? "on" : "off")
}

export function clearProgress(): void {
  if (typeof window !== "undefined") localStorage.removeItem(PROGRESS_KEY)
}
