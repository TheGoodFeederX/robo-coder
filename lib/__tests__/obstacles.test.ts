import { describe, expect, test } from "vitest"
import { LEVELS, isBlocked, toCell } from "../levels"
import { parseCode } from "../parser"
import { executeCommands } from "../executor"
import { vi } from "vitest"

async function runUntilDone(code: string, obstacles: { x: number; y: number }[]) {
  const { commands } = parseCode(code)
  let state = { x: 250, y: 250, rotation: 0 }
  let onCompleteCalled = false
  let onBlockedCalled = false

  vi.useFakeTimers()
  executeCommands(
    commands,
    (updater) => {
      state = updater(state)
    },
    () => {},
    () => {},
    () => {
      onCompleteCalled = true
    },
    {
      isBlocked: (s) => isBlocked(s, obstacles),
      onBlocked: () => {
        onBlockedCalled = true
      },
    },
  )
  await vi.advanceTimersByTimeAsync(60_000)
  vi.useRealTimers()
  return { state, onCompleteCalled, onBlockedCalled }
}

describe("obstacles", () => {
  const wall = [{ x: -3, y: 0 }]

  test("toCell maps pixels to grid cells", () => {
    expect(toCell({ x: 250, y: 250 })).toEqual({ x: 0, y: 0 })
    expect(toCell({ x: 220, y: 250 })).toEqual({ x: -3, y: 0 })
  })

  test("isBlocked only matches obstacle cells", () => {
    expect(isBlocked({ x: 220, y: 250 }, wall)).toBe(true)
    expect(isBlocked({ x: 230, y: 250 }, wall)).toBe(false)
    expect(isBlocked({ x: 220, y: 250 }, undefined)).toBe(false)
  })

  test("robot stops before a wall instead of passing through", async () => {
    const { state, onCompleteCalled, onBlockedCalled } = await runUntilDone("turn left\nstep 10", wall)

    // Turned left from (0,0) means heading -x; it must stop at x = -2.
    expect(toCell(state)).toEqual({ x: -2, y: 0 })
    expect(onBlockedCalled).toBe(true)
    expect(onCompleteCalled).toBe(false)
  })

  test("teleporting into a wall is rejected", async () => {
    const { state, onBlockedCalled } = await runUntilDone("tp -3,0", wall)
    expect(toCell(state)).toEqual({ x: 0, y: 0 })
    expect(onBlockedCalled).toBe(true)
  })

  test("driving around the wall reaches the goal", async () => {
    const level = LEVELS.find((l) => l.id === "wall")!
    const { state, onBlockedCalled } = await runUntilDone("step 3\nturn left\nstep 6\nturn left\nstep 3", level.obstacles ?? [])
    expect(onBlockedCalled).toBe(false)
    expect(toCell(state)).toEqual(level.goal)
  })
})
