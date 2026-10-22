import type { ProgressMap, SavedExecution } from "./types"
import { DEFAULT_EXAM, type Exam, type ExamResult } from "./exam"
import type { Mode } from "./modes"

const STORAGE_KEY = "robo-coder-saves"
const PROGRESS_KEY = "robo-coder-progress"
const PLAYER_KEY = "robo-coder-player"
const LEVEL_KEY = "robo-coder-level"
const SOUND_KEY = "robo-coder-sound"
const MODE_KEY = "robo-coder-mode"
const EXAM_KEY = "robo-coder-exam"
const RESULTS_KEY = "robo-coder-exam-results"
const PIN_KEY = "robo-coder-admin-pin"

export const DEFAULT_ADMIN_PIN = "1234"

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

export function getMode(): Mode | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(MODE_KEY)
  return raw === "bebas" || raw === "jelajah" || raw === "ujian" ? raw : null
}

export function saveMode(mode: Mode): void {
  if (typeof window !== "undefined") localStorage.setItem(MODE_KEY, mode)
}

export function getExam(): Exam {
  if (typeof window === "undefined") return DEFAULT_EXAM
  const raw = localStorage.getItem(EXAM_KEY)
  if (!raw) return DEFAULT_EXAM
  try {
    return JSON.parse(raw) as Exam
  } catch {
    return DEFAULT_EXAM
  }
}

export function saveExam(exam: Exam): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(EXAM_KEY, JSON.stringify({ ...exam, updatedAt: Date.now() }))
  }
}

export function getExamResults(): ExamResult[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(RESULTS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as ExamResult[]
  } catch {
    return []
  }
}

export function saveExamResult(result: ExamResult): void {
  if (typeof window === "undefined") return
  const all = getExamResults()
  all.push(result)
  localStorage.setItem(RESULTS_KEY, JSON.stringify(all))
}

export function clearExamResults(): void {
  if (typeof window !== "undefined") localStorage.removeItem(RESULTS_KEY)
}

export function getAdminPin(): string {
  if (typeof window === "undefined") return DEFAULT_ADMIN_PIN
  return localStorage.getItem(PIN_KEY) ?? DEFAULT_ADMIN_PIN
}

export function saveAdminPin(pin: string): void {
  if (typeof window !== "undefined") localStorage.setItem(PIN_KEY, pin)
}

export function clearProgress(): void {
  if (typeof window !== "undefined") localStorage.removeItem(PROGRESS_KEY)
}
