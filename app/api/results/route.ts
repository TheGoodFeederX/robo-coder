import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { addResult, clearResults, listResults } from "@/lib/exam-repo"
import { requireTeacher } from "@/lib/auth-session"
import { scoreExam, type Exam, type ExamTaskResult, type ExamResult } from "@/lib/exam"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const sql = db()
  if (!sql) return NextResponse.json({ error: "Backend tidak dikonfigurasi." }, { status: 503 })
  const denied = await requireTeacher()
  if (denied) return denied

  try {
    return NextResponse.json({ results: await listResults(sql) })
  } catch (error) {
    console.error("GET /api/results failed", error)
    return NextResponse.json({ error: "Gagal membaca keputusan." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const sql = db()
  if (!sql) return NextResponse.json({ error: "Backend tidak dikonfigurasi." }, { status: 503 })

  let body: { playerName?: string; exam?: Exam; perTask?: ExamTaskResult[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON tidak sah." }, { status: 400 })
  }

  const playerName = body.playerName?.trim()
  if (!playerName) return NextResponse.json({ error: "Nama pemain diperlukan." }, { status: 400 })
  if (playerName.length > 30) return NextResponse.json({ error: "Nama pemain terlalu panjang." }, { status: 400 })
  if (!body.exam || !Array.isArray(body.exam.tasks)) {
    return NextResponse.json({ error: "Ujian tidak lengkap." }, { status: 400 })
  }
  if (!Array.isArray(body.perTask)) return NextResponse.json({ error: "Keputusan tugasan tiada." }, { status: 400 })

  // Server recomputes the score; never trust a client-supplied total.
  const summary = scoreExam(body.exam, body.perTask)
  const result: ExamResult = {
    id: crypto.randomUUID(),
    playerName,
    examTitle: body.exam.title,
    timestamp: Date.now(),
    ...summary,
  }

  try {
    const saved = await addResult(sql, result)
    return NextResponse.json({ result: saved }, { status: 201 })
  } catch (error) {
    console.error("POST /api/results failed", error)
    return NextResponse.json({ error: "Gagal menyimpan keputusan." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const sql = db()
  if (!sql) return NextResponse.json({ error: "Backend tidak dikonfigurasi." }, { status: 503 })
  const denied = await requireTeacher()
  if (denied) return denied

  try {
    const removed = await clearResults(sql)
    return NextResponse.json({ removed })
  } catch (error) {
    console.error("DELETE /api/results failed", error)
    return NextResponse.json({ error: "Gagal memadam keputusan." }, { status: 500 })
  }
}
