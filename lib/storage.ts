import type { ProgressMap, SavedExecution } from "./types"

const STORAGE_KEY = "robo-coder-saves"
const PROGRESS_KEY = "robo-coder-progress"

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

export function clearProgress(): void {
  if (typeof window !== "undefined") localStorage.removeItem(PROGRESS_KEY)
}
