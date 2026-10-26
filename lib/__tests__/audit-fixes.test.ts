import { afterEach, describe, expect, test, vi } from "vitest"
import { validateExam } from "../exam"
import { saveExecution, getSavedExecutions } from "../storage"
import { parseCode } from "../parser"

describe("exam import validation", () => {
  const valid = {
    title: "Ujian",
    passMark: 1,
    tasks: [{ id: "t1", prompt: "Pergi", goal: { x: 0, y: 5 }, maxLines: 3 }],
    players: [],
    updatedAt: 0,
  }

  test("accepts a well-formed exam", () => {
    expect(validateExam(valid)).toBeNull()
  })

  test("rejects missing goals, bad limits and impossible pass marks", () => {
    expect(validateExam({ ...valid, tasks: [] })).toContain("sekurang-kurangnya satu")
    expect(validateExam({ ...valid, tasks: [{ prompt: "x", maxLines: 3, id: "a" }] })).toContain("sasaran")
    expect(validateExam({ ...valid, tasks: [{ ...valid.tasks[0], maxLines: 0 }] })).toContain("had baris")
    expect(validateExam({ ...valid, passMark: 5 })).toContain("melebihi")
    expect(validateExam("nope")).toContain("objek JSON")
  })
})

describe("localStorage quota guard", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  test("keeps the newest record when the quota is exceeded", () => {
    const original = JSON.parse(JSON.stringify(localStorage))
    void original

    // Pretend the first write fails with a quota error.
    let calls = 0
    const setItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key: string, value: string) {
      calls += 1
      if (calls === 1) throw new DOMException("quota", "QuotaExceededError")
      return setItem.call(this, key, value)
    })

    saveExecution({ id: "old", timestamp: 1, playerName: "Ali", commands: "step 1", screenshot: "data:," })
    saveExecution({ id: "new", timestamp: 2, playerName: "Ali", commands: "step 2", screenshot: "data:," })

    const saved = getSavedExecutions()
    expect(saved.map((s) => s.id)).toEqual(["new"])
  })
})

describe("Malay parser messages", () => {
  test("unknown commands are reported in Malay", () => {
    const { errors } = parseCode("lompat 3")
    expect(errors[0]).toContain("Baris 1")
    expect(errors[0]).toContain("tidak dikenali")
  })

  test("bad tp syntax suggests the right form", () => {
    const { errors } = parseCode("tp x")
    expect(errors[0]).toContain("tp 5,10")
  })
})
