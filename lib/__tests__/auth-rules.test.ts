import { describe, expect, test } from "vitest"
import { canCreateTeacher, validateTeacherCredentials } from "../auth-rules"

describe("teacher account rules", () => {
  test("allows the first account only", () => {
    expect(canCreateTeacher(0).allowed).toBe(true)
    const second = canCreateTeacher(1)
    expect(second.allowed).toBe(false)
    expect(second.message).toContain("sudah wujud")
  })

  test("validates email and password strength", () => {
    expect(validateTeacherCredentials("guru@sekolah.edu.my", "rahsia123")).toBeNull()
    expect(validateTeacherCredentials("bukan-emel", "rahsia123")).toContain("Emel")
    expect(validateTeacherCredentials("guru@sekolah.edu.my", "pendek")).toContain("8 aksara")
  })
})
