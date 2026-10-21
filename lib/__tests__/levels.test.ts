import { describe, expect, test } from "vitest"
import { GOAL_TOLERANCE, LEVELS, countLines, isAtGoal, lineBudget, starsFor, toGrid } from "../levels"
import { SOLUTIONS } from "../levels"

describe("levels", () => {
  test("grid conversion round-trips through canvas coords", () => {
    expect(toGrid({ x: 250, y: 250 })).toEqual({ x: 0, y: 0 })
    expect(toGrid({ x: 300, y: 200 })).toEqual({ x: 5, y: 5 })
  })

  test("isAtGoal respects tolerance", () => {
    const goal = { x: 5, y: 0 }
    expect(isAtGoal({ x: 300, y: 250 }, goal)).toBe(true)
    // half a grid unit off is still inside tolerance
    expect(isAtGoal({ x: 300 + GOAL_TOLERANCE * 10 - 0.01, y: 250 }, goal)).toBe(true)
    expect(isAtGoal({ x: 300 + 10, y: 250 }, goal)).toBe(false)
  })

  test("stars: par gets 3, 1.5x par gets 2, rest 1", () => {
    expect(starsFor(2, 2)).toBe(3)
    expect(starsFor(3, 2)).toBe(2)
    expect(starsFor(4, 2)).toBe(1)
  })

  test("countLines ignores blanks and comments", () => {
    expect(countLines("// hi\n\nstep 5\n  \nturn right")).toBe(2)
  })

  test("every level goal is reachable inside the playable 22-unit radius", () => {
    for (const level of LEVELS) {
      expect(Math.abs(level.goal.x)).toBeLessThanOrEqual(22)
      expect(Math.abs(level.goal.y)).toBeLessThanOrEqual(22)
      expect(level.par).toBeGreaterThan(0)
    }
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length)
  })

  test("line budget is at least par and every reference solution fits it", () => {
    for (const level of LEVELS) {
      const budget = lineBudget(level)
      expect(budget).toBeGreaterThanOrEqual(level.par)
      expect(countLines(SOLUTIONS[level.id])).toBeLessThanOrEqual(budget)
    }
  })

  test("obstacles are inside the grid, unique, and never on the goal", () => {
    for (const level of LEVELS) {
      const obstacles = level.obstacles ?? []
      const cells = obstacles.map((o) => `${o.x},${o.y}`)
      expect(new Set(cells).size).toBe(cells.length)
      for (const o of obstacles) {
        expect(Math.abs(o.x)).toBeLessThanOrEqual(22)
        expect(Math.abs(o.y)).toBeLessThanOrEqual(22)
        expect(o).not.toEqual(level.goal)
      }
    }
  })
})
