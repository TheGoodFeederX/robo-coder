import { NextResponse } from "next/server"

/** Admin writes require the server-side PIN (header), never the client-side hint. */
export function requireAdmin(request: Request): NextResponse | null {
  const expected = process.env.ADMIN_PIN ?? "1234"
  const provided = request.headers.get("x-admin-pin") ?? ""
  if (provided !== expected) {
    return NextResponse.json({ error: "PIN guru salah." }, { status: 401 })
  }
  return null
}
