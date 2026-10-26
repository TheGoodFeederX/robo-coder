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

/** Validates an imported exam file. Returns a human-readable error or null. */
export function validateExam(raw: unknown): string | null {
  if (typeof raw !== "object" || raw === null) return "Fail mesti objek JSON."
  const exam = raw as Partial<Exam>
  if (typeof exam.title !== "string" || !exam.title.trim()) return "Tajuk ujian tiada."
  if (!Array.isArray(exam.tasks) || exam.tasks.length === 0) return "Ujian mesti ada sekurang-kurangnya satu tugasan."

  for (const [i, task] of exam.tasks.entries()) {
    const where = `Tugasan ${i + 1}`
    if (!task || typeof task !== "object") return `${where}: format salah.`
    if (typeof task.prompt !== "string") return `${where}: "prompt" tiada.`
    if (!task.goal || typeof task.goal.x !== "number" || typeof task.goal.y !== "number") {
      return `${where}: sasaran (goal x/y) tiada atau bukan nombor.`
    }
    if (typeof task.maxLines !== "number" || task.maxLines < 1) return `${where}: had baris mesti ≥ 1.`
    if (task.obstacles && !Array.isArray(task.obstacles)) return `${where}: "obstacles" mesti senarai.`
    if (typeof task.id !== "string" || !task.id) return `${where}: "id" tiada.`
  }

  if (typeof exam.passMark !== "number" || exam.passMark < 0) return "Markah lulus mesti nombor ≥ 0."
  if (exam.passMark > exam.tasks.length) return "Markah lulus melebihi bilangan tugasan."
  if (exam.players && !Array.isArray(exam.players)) return "Senarai pemain mesti array."
  return null
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
