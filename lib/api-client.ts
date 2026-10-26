import type { Exam, ExamResult, ExamTaskResult } from "./exam"

// Thin client for the Neon-backed API. Every helper resolves null on failure so
// the app can fall back to the browser-local copy instead of breaking.

async function call<T>(input: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(input, { ...init, cache: "no-store" })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function apiGetExam(): Promise<Exam | null> {
  const data = await call<{ exam: Exam }>("/api/exam")
  return data?.exam ?? null
}

export async function apiSaveExam(exam: Exam, pin: string): Promise<Exam | null> {
  const data = await call<{ exam: Exam }>("/api/exam", {
    method: "PUT",
    headers: { "content-type": "application/json", "x-admin-pin": pin },
    body: JSON.stringify(exam),
  })
  return data?.exam ?? null
}

export async function apiListResults(pin: string): Promise<ExamResult[] | null> {
  const data = await call<{ results: ExamResult[] }>("/api/results", { headers: { "x-admin-pin": pin } })
  return data?.results ?? null
}

export async function apiAddResult(playerName: string, exam: Exam, perTask: ExamTaskResult[]): Promise<ExamResult | null> {
  const data = await call<{ result: ExamResult }>("/api/results", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ playerName, exam, perTask }),
  })
  return data?.result ?? null
}

export async function apiClearResults(pin: string): Promise<number | null> {
  const data = await call<{ removed: number }>("/api/results", { method: "DELETE", headers: { "x-admin-pin": pin } })
  return data?.removed ?? null
}
