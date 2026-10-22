import { describe, expect, test } from "vitest"
import { DEFAULT_EXAM, formatObstacles, parseObstacleList, scoreExam } from "../exam"
import { isAtGoal } from "../levels"

describe("exam scoring", () => {
  test("counts completed tasks and compares against pass mark", () => {
    const results = [
      { taskId: "t1", completed: true, lines: 2 },
      { taskId: "t2", completed: false },
      { taskId: "t3", completed: true, lines: 4 },
    ]
    const summary = scoreExam(DEFAULT_EXAM, results)
    expect(summary.score).toBe(2)
    expect(summary.total).toBe(3)
    expect(summary.passed).toBe(true) // passMark = 2
  })

  test("fails when below pass mark", () => {
    const summary = scoreExam(DEFAULT_EXAM, [{ taskId: "t1", completed: true, lines: 1 }, { taskId: "t2", completed: false }])
    expect(summary.passed).toBe(false)
  })
})

describe("obstacle list parsing", () => {
  test("parses coordinates with spaces and negatives", () => {
    expect(parseObstacleList("3,2; -5,1")).toEqual([
      { x: 3, y: 2 },
      { x: -5, y: 1 },
    ])
  })

  test("empty string means no obstacles", () => {
    expect(parseObstacleList("   ")).toEqual([])
  })

  test("rejects malformed input", () => {
    expect(parseObstacleList("3;2")).toBeNull()
    expect(parseObstacleList("a,b")).toBeNull()
  })

  test("format round-trips", () => {
    expect(formatObstacles(parseObstacleList("3,2; -5,1")!)).toBe("3,2; -5,1")
  })
})

describe("default exam", () => {
  test("every task's goal is inside the grid and not covered by an obstacle", () => {
    for (const task of DEFAULT_EXAM.tasks) {
      expect(Math.abs(task.goal.x)).toBeLessThanOrEqual(22)
      expect(Math.abs(task.goal.y)).toBeLessThanOrEqual(22)
      expect(task.obstacles ?? []).not.toContainEqual(task.goal)
      expect(task.maxLines).toBeGreaterThan(0)
    }
  })

  test("task goals are reachable in principle (goal check is distance based)", () => {
    // canvas pixel for task 1 goal (0,5)
    expect(isAtGoal({ x: 250, y: 200 }, DEFAULT_EXAM.tasks[0].goal)).toBe(true)
  })
})
