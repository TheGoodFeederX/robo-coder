import { describe, expect, test } from "vitest"
import { LEVELS, SOLUTIONS, countLines, isAtGoal } from "../levels"
import { parseCode } from "../parser"
import { executeCommands } from "../executor"

import { vi } from "vitest"

describe("level solutions", () => {
  test.each(LEVELS.map((l) => [l.id, l] as const))("%s is solved at par by its reference solution", async (id, level) => {
    const code = SOLUTIONS[id]
    expect(code, `no reference solution for ${id}`).toBeTruthy()
    expect(countLines(code)).toBeLessThanOrEqual(level.par)

    const { commands } = parseCode(code)
    let state = { x: 250, y: 250, rotation: 0 }

    vi.useFakeTimers()
    executeCommands(
      commands,
      (updater) => {
        state = updater(state)
      },
      () => {},
      () => {},
      () => {},
    )
    await vi.advanceTimersByTimeAsync(60_000)
    vi.useRealTimers()

    expect(isAtGoal(state, level.goal), `${id}: ended at ${JSON.stringify(state)}`).toBe(true)
  })
})
