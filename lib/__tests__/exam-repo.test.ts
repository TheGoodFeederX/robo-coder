import { describe, expect, test, vi } from "vitest"
import { addResult, clearResults, fetchExam, listResults, storeExam } from "../exam-repo"
import { examToRow, rowToExam, rowToResult, type QueryFn } from "../db"
import { DEFAULT_EXAM, scoreExam } from "../exam"

const NOW = "2026-01-01T00:00:00.000Z"

function fakeSql(rows: unknown[][]) {
  const calls: string[] = []
  const sql = vi.fn(async (strings: TemplateStringsArray) => {
    calls.push(strings.join("?"))
    return rows.shift() ?? []
  }) as unknown as QueryFn
  return { sql, calls }
}

describe("exam repository", () => {
  test("fetchExam maps a row to an Exam", async () => {
    const { sql, calls } = fakeSql([
      [{ id: "default", title: "Ujian", pass_mark: 2, players: ["Ali"], tasks: DEFAULT_EXAM.tasks, updated_at: NOW }],
    ])
    const exam = await fetchExam(sql)
    expect(exam?.title).toBe("Ujian")
    expect(exam?.passMark).toBe(2)
    expect(exam?.players).toEqual(["Ali"])
    expect(exam?.updatedAt).toBe(new Date(NOW).getTime())
    expect(calls[0]).toContain("from exams")
  })

  test("fetchExam returns null when there is no row", async () => {
    const { sql } = fakeSql([[]])
    expect(await fetchExam(sql)).toBeNull()
  })

  test("storeExam upserts jsonb fields", async () => {
    const row = { id: "default", title: "Baru", pass_mark: 1, players: [], tasks: [], updated_at: NOW }
    const { sql, calls } = fakeSql([[row]])
    const saved = await storeExam(sql, { ...DEFAULT_EXAM, title: "Baru", passMark: 1 })
    expect(saved.title).toBe("Baru")
    expect(calls[0]).toContain("on conflict (id) do update")
  })

  test("listResults maps rows and passes the limit", async () => {
    const { sql, calls } = fakeSql([
      [
        {
          id: "r1",
          player_name: "Ali",
          exam_title: "Ujian",
          score: 2,
          total: 3,
          passed: true,
          per_task: [{ taskId: "t1", completed: true, lines: 1 }],
          created_at: NOW,
        },
      ],
    ])
    const results = await listResults(sql, 50)
    expect(results[0].playerName).toBe("Ali")
    expect(results[0].passed).toBe(true)
    expect(calls[0]).toContain("order by created_at desc")
  })

  test("addResult inserts server-computed score", async () => {
    const summary = scoreExam(DEFAULT_EXAM, [{ taskId: "t1", completed: true, lines: 1 }])
    const result = { id: "r2", playerName: "Siti", examTitle: "Ujian", timestamp: 1, ...summary }
    const { sql, calls } = fakeSql([
      [
        {
          id: "r2",
          player_name: "Siti",
          exam_title: "Ujian",
          score: summary.score,
          total: summary.total,
          passed: summary.passed,
          per_task: result.perTask,
          created_at: NOW,
        },
      ],
    ])
    const saved = await addResult(sql, result)
    expect(saved.playerName).toBe("Siti")
    expect(calls[0]).toContain("insert into exam_results")
  })

  test("clearResults reports how many rows were removed", async () => {
    const { sql } = fakeSql([[{ count: "7" }]])
    expect(await clearResults(sql)).toBe(7)
  })
})

describe("row/domain mapping", () => {
  test("round-trips an exam through the DB row shape", () => {
    const row = examToRow(DEFAULT_EXAM)
    const back = rowToExam({ id: "default", updated_at: NOW, ...row })
    expect(back.title).toBe(DEFAULT_EXAM.title)
    expect(back.tasks).toEqual(DEFAULT_EXAM.tasks)
    expect(back.passMark).toBe(DEFAULT_EXAM.passMark)
  })

  test("maps a result row", () => {
    const mapped = rowToResult({
      id: "x",
      player_name: "Ali",
      exam_title: "Ujian",
      score: 1,
      total: 2,
      passed: false,
      per_task: [],
      created_at: NOW,
    })
    expect(mapped).toMatchObject({ playerName: "Ali", score: 1, total: 2, passed: false })
  })
})
