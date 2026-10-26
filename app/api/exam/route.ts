import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fetchExam, storeExam } from "@/lib/exam-repo"
import { validateExam, type Exam } from "@/lib/exam"
import { requireTeacher } from "@/lib/auth-session"

export const dynamic = "force-dynamic"

export async function GET() {
  const sql = db()
  if (!sql) return NextResponse.json({ error: "Backend tidak dikonfigurasi (DATABASE_URL tiada)." }, { status: 503 })

  try {
    const exam = await fetchExam(sql)
    if (!exam) return NextResponse.json({ error: "Ujian belum disimpan." }, { status: 404 })
    return NextResponse.json({ exam })
  } catch (error) {
    console.error("GET /api/exam failed", error)
    return NextResponse.json({ error: "Gagal membaca ujian." }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const sql = db()
  if (!sql) return NextResponse.json({ error: "Backend tidak dikonfigurasi." }, { status: 503 })

  const denied = await requireTeacher()
  if (denied) return denied

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON tidak sah." }, { status: 400 })
  }

  const problem = validateExam(body)
  if (problem) return NextResponse.json({ error: problem }, { status: 422 })

  try {
    const exam = await storeExam(sql, body as Exam)
    return NextResponse.json({ exam })
  } catch (error) {
    console.error("PUT /api/exam failed", error)
    return NextResponse.json({ error: "Gagal menyimpan ujian." }, { status: 500 })
  }
}
