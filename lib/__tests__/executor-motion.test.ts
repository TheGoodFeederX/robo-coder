import { describe, expect, test } from "vitest"
import type { Command } from "../parser"

// Mirror of the pixel math in lib/executor.ts so level goals can be validated
// without driving React state.
const START = { x: 250, y: 250, rotation: 0 }

function simulate(commands: Command[], state = { ...START }) {
  const clamp = (v: number) => Math.max(30, Math.min(470, v))
  for (const cmd of commands) {
    if (cmd.type === "step") {
      for (let i = 0; i < (cmd.value as number); i++) {
        const rad = (state.rotation * Math.PI) / 180
        state = {
          ...state,
          x: clamp(state.x + 10 * Math.sin(rad)),
          y: clamp(state.y - 10 * Math.cos(rad)),
        }
      }
    } else if (cmd.type === "turn") {
      state = { ...state, rotation: state.rotation + (cmd.value === "left" ? -90 : 90) }
    } else if (cmd.type === "rotate") {
      state = { ...state, rotation: state.rotation + (cmd.value as number) }
    } else if (cmd.type === "tp" && cmd.coordinates) {
      state = { ...state, x: clamp(250 + cmd.coordinates.x * 10), y: clamp(250 - cmd.coordinates.y * 10) }
    }
  }
  return state
}

describe("executor motion math", () => {
  test("step moves forward along facing direction", () => {
    expect(simulate([{ type: "step", value: 5, lineNumber: 0 }])).toMatchObject({ x: 250, y: 200 })
    expect(simulate([{ type: "rotate", value: 90, lineNumber: 0 }, { type: "step", value: 5, lineNumber: 1 }])).toMatchObject({
      x: 300,
      y: 250,
    })
  })

  test("turn right then step moves +x, turn left returns", () => {
    const s = simulate([
      { type: "turn", value: "right", lineNumber: 0 },
      { type: "step", value: 3, lineNumber: 1 },
      { type: "turn", value: "left", lineNumber: 2 },
      { type: "step", value: 2, lineNumber: 3 },
    ])
    expect(s).toMatchObject({ x: 280, y: 230, rotation: 0 })
  })

  test("coordinates clamp to canvas bounds", () => {
    expect(simulate([{ type: "step", value: 100, lineNumber: 0 }]).y).toBe(30)
  })
})
