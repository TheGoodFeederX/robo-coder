import { act, cleanup, fireEvent, render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { RobotProvider, useRobot } from "@/lib/contexts/robot-context"
import { LEVELS, lineBudget } from "@/lib/levels"

function Probe({ code }: { code: string }) {
  const { updateCommands, runCommands, isExecuting, message } = useRobot()
  return (
    <div>
      <span data-testid="executing">{String(isExecuting)}</span>
      <span data-testid="message">{message}</span>
      <button data-testid="set" onClick={() => updateCommands(code)} />
      <button data-testid="run" onClick={runCommands} />
    </div>
  )
}

describe("command budget", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  test("code longer than the budget never starts executing", async () => {
    const budget = lineBudget(LEVELS[0])
    const tooLong = Array.from({ length: budget + 1 }, () => "step 1").join("\n")

    const utils = render(
      <RobotProvider>
        <Probe code={tooLong} />
      </RobotProvider>,
    )
    act(() => {
      fireEvent.click(utils.getByTestId("set"))
    })
    act(() => {
      fireEvent.click(utils.getByTestId("run"))
    })

    expect(utils.getByTestId("executing").textContent).toBe("false")
    expect(utils.getByTestId("message").textContent).toContain("Too many commands")
  })

  test("code within budget runs", async () => {
    const utils = render(
      <RobotProvider>
        <Probe code="step 5" />
      </RobotProvider>,
    )
    await act(async () => {
      fireEvent.click(utils.getByTestId("set"))
    })
    await act(async () => {
      fireEvent.click(utils.getByTestId("run"))
    })
    expect(utils.getByTestId("executing").textContent).toBe("true")

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000)
    })
    expect(utils.getByTestId("executing").textContent).toBe("false")
  })
})
