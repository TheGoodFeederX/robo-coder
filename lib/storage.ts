import type { SavedExecution } from "./types"

const STORAGE_KEY = "robo-coder-saves"

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
