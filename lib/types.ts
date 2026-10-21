export interface SavedExecution {
  id: string
  timestamp: number
  playerName: string
  commands: string
  screenshot: string
  levelId?: string
  stars?: number
}

/** Best result per level id. */
export interface LevelProgress {
  stars: number
  bestLines: number
}

export type ProgressMap = Record<string, LevelProgress>
