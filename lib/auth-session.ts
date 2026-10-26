import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"

/** Reads the signed-in teacher from the request cookies. */
export async function getTeacherSession() {
  if (!process.env.DATABASE_URL) return null
  try {
    return await auth.api.getSession({ headers: await headers() })
  } catch {
    return null
  }
}

/** Admin API guard: a real session is required, the old shared PIN is gone. */
export async function requireTeacher(): Promise<NextResponse | null> {
  const session = await getTeacherSession()
  if (!session) {
    return NextResponse.json({ error: "Sila log masuk sebagai guru." }, { status: 401 })
  }
  return null
}
