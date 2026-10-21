import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { RobotProvider, useRobot } from "@/lib/contexts/robot-context"

function Probe() {
  const { won, stars, level, updateCommands, runCommands } = useRobot()
  return (
    <div>
      <span data-testid="won">{String(won)}</span>
      <span data-testid="stars">{stars}</span>
      <span data-testid="level">{level.id}</span>
      <button data-testid="set" onClick={() => updateCommands("step 5")} />
      <button data-testid="run" onClick={runCommands} />
    </div>
  )
}

describe("level win detection", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test("reaching the goal marks the level won and records stars", async () => {
    render(
      <RobotProvider>
        <Probe />
      </RobotProvider>,
    )

    expect(screen.getByTestId("level").textContent).toBe("first-step")

    fireEvent.click(screen.getByTestId("set"))
    fireEvent.click(screen.getByTestId("run"))

    // Let the executor walk its steps and settle.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })

    expect(screen.getByTestId("won").textContent).toBe("true")
    expect(screen.getByTestId("stars").textContent).toBe("3")

    const progress = JSON.parse(localStorage.getItem("robo-coder-progress") ?? "{}")
    expect(progress["first-step"]).toEqual({ stars: 3, bestLines: 1 })
  })
})
