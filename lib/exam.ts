import type { GridPoint } from "./levels"

export interface ExamTask {
  id: string
  prompt: string
  goal: GridPoint
  obstacles?: GridPoint[]
  /** Hard cap on code lines for this task. */
  maxLines: number
}

export interface Exam {
  title: string
  /** How many tasks a player must clear to pass. */
  passMark: number
  tasks: ExamTask[]
  /** Allowed player names; empty means anyone. */
  players: string[]
  updatedAt: number
}

export interface ExamTaskResult {
  taskId: string
  completed: boolean
  lines?: number
}

export interface ExamResult {
  id: string
  playerName: string
  examTitle: string
  score: number
  total: number
  passed: boolean
  perTask: ExamTaskResult[]
  timestamp: number
}

export const DEFAULT_EXAM: Exam = {
  title: "Ujian Robot 1",
  passMark: 2,
  tasks: [
    { id: "t1", prompt: "Pergi ke (0, 5).", goal: { x: 0, y: 5 }, maxLines: 3 },
    { id: "t2", prompt: "Pergi ke (4, 0).", goal: { x: 4, y: 0 }, maxLines: 3 },
    {
      id: "t3",
      prompt: "Pergi ke (-5, 0) tanpa melanggar dinding di (-2, 0).",
      goal: { x: -5, y: 0 },
      obstacles: [{ x: -2, y: 0 }],
      maxLines: 5,
    },
  ],
  players: [],
  updatedAt: 0,
}

export function scoreExam(
  exam: Exam,
  perTask: ExamTaskResult[],
): Omit<ExamResult, "id" | "playerName" | "examTitle" | "timestamp"> {
  // Normalise so a result always covers every task, even ones never attempted.
  const normalised = exam.tasks.map(
    (task) => perTask.find((r) => r.taskId === task.id) ?? { taskId: task.id, completed: false },
  )
  const score = normalised.filter((t) => t.completed).length
  return { score, total: exam.tasks.length, passed: score >= exam.passMark, perTask: normalised }
}

/** Parses "3,2; 5,6" into grid points. Returns null when malformed. */
export function parseObstacleList(raw: string): GridPoint[] | null {
  const trimmed = raw.trim()
  if (!trimmed) return []
  const points: GridPoint[] = []
  for (const chunk of trimmed.split(";")) {
    const match = chunk.trim().match(/^(-?\d+)\s*,\s*(-?\d+)$/)
    if (!match) return null
    points.push({ x: Number(match[1]), y: Number(match[2]) })
  }
  return points
}

export function formatObstacles(points?: GridPoint[]): string {
  return (points ?? []).map((p) => `${p.x},${p.y}`).join("; ")
}
