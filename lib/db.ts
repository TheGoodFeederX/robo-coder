import { neon } from "@neondatabase/serverless"
import type { Exam } from "./exam"
import type { ExamResult } from "./exam"

export type QueryFn = <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]) => Promise<T[]>

let cached: QueryFn | null = null

/** Returns a query function, or null when DATABASE_URL is not configured (offline/local mode). */
export function db(): QueryFn | null {
  const url = process.env.DATABASE_URL
  if (!url) return null
  if (!cached) {
    cached = neon(url) as unknown as QueryFn
  }
  return cached
}

export interface ExamRow {
  id: string
  title: string
  pass_mark: number
  /** Neon returns parsed JSON; a text driver would return a string. */
  players: string[] | string
  tasks: Exam["tasks"] | string
  updated_at: string
}

/** jsonb columns arrive parsed from Neon, but tolerate text for other drivers. */
function asJson<T>(value: T | string | null | undefined, fallback: T): T {
  if (value == null) return fallback
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }
  return value
}

export function rowToExam(row: ExamRow): Exam {
  return {
    title: row.title,
    passMark: row.pass_mark,
    players: asJson<string[]>(row.players, []),
    tasks: asJson<Exam["tasks"]>(row.tasks, []),
    updatedAt: new Date(row.updated_at).getTime(),
  }
}

export function examToRow(exam: Exam) {
  return {
    title: exam.title,
    pass_mark: exam.passMark,
    players: JSON.stringify(exam.players),
    tasks: JSON.stringify(exam.tasks),
  }
}

export interface ResultRow {
  id: string
  player_name: string
  exam_title: string
  score: number
  total: number
  passed: boolean
  per_task: ExamResult["perTask"] | string
  created_at: string
}

export function rowToResult(row: ResultRow): ExamResult {
  return {
    id: row.id,
    playerName: row.player_name,
    examTitle: row.exam_title,
    score: row.score,
    total: row.total,
    passed: row.passed,
    perTask: asJson<ExamResult["perTask"]>(row.per_task, []),
    timestamp: new Date(row.created_at).getTime(),
  }
}

export const DEFAULT_EXAM_ID = "default"
