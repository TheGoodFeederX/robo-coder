import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { RobotProvider, useRobot } from "@/lib/contexts/robot-context"
import { DEFAULT_EXAM } from "@/lib/exam"
import { ExamPanel } from "@/components/mode-panels"

function Probe({ code }: { code: string }) {
  const { mode, chooseMode, updateCommands, runCommands, message, won, attempts, examResults, submitExam } = useRobot()
  return (
    <div>
      <span data-testid="mode">{mode ?? "none"}</span>
      <span data-testid="message">{message}</span>
      <span data-testid="won">{String(won)}</span>
      <span data-testid="attempts">{attempts}</span>
      <span data-testid="done">{examResults.filter((r) => r.completed).length}</span>
      <button data-testid="mode-bebas" onClick={() => chooseMode("bebas")} />
      <button data-testid="mode-ujian" onClick={() => chooseMode("ujian")} />
      <button data-testid="set" onClick={() => updateCommands(code)} />
      <button data-testid="run" onClick={runCommands} />
      <button data-testid="submit" onClick={() => submitExam("Ali")} />
    </div>
  )
}

async function runToEnd(utils: ReturnType<typeof render>) {
  act(() => {
    fireEvent.click(utils.getByTestId("set"))
  })
  act(() => {
    fireEvent.click(utils.getByTestId("run"))
  })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(20_000)
  })
}

describe("game modes", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  test("mod bebas ignores the line budget", async () => {
    const longCode = Array.from({ length: 30 }, () => "step 1").join("\n")

    const utils = render(
      <RobotProvider>
        <Probe code={longCode} />
      </RobotProvider>,
    )
    act(() => {
      fireEvent.click(utils.getByTestId("mode-bebas"))
    })
    await runToEnd(utils)

    expect(utils.getByTestId("message").textContent).not.toContain("terlalu banyak")
    expect(utils.getByTestId("message").textContent).toContain("Selesai")
    expect(utils.getByTestId("won").textContent).toBe("false")
  })

  test("mod bebas has no goal: any finish is accepted without win state", async () => {
    const utils = render(
      <RobotProvider>
        <Probe code="turn left\nstep 3" />
      </RobotProvider>,
    )
    act(() => {
      fireEvent.click(utils.getByTestId("mode-bebas"))
    })
    await runToEnd(utils)

    expect(utils.getByTestId("won").textContent).toBe("false")
    expect(utils.getByTestId("message").textContent).not.toContain("Belum sampai")
  })

  test("mod ujian caps lines per exam task and records completed tasks", async () => {
    function ExamProbe() {
      const { exam, examTaskIndex, chooseMode, updateCommands, runCommands, examResults } = useRobot()
      const task = exam.tasks[examTaskIndex]
      return (
        <div>
          <span data-testid="prompt">{task.prompt}</span>
          <span data-testid="max">{task.maxLines}</span>
          <span data-testid="done">{examResults.filter((r) => r.completed).length}</span>
          <button data-testid="mode-ujian" onClick={() => chooseMode("ujian")} />
          <button data-testid="set" onClick={() => updateCommands("step 5")} />
          <button data-testid="run" onClick={runCommands} />
        </div>
      )
    }

    const utils = render(
      <RobotProvider>
        <ExamProbe />
      </RobotProvider>,
    )
    act(() => {
      fireEvent.click(utils.getByTestId("mode-ujian"))
    })
    expect(utils.getByTestId("prompt").textContent).toBe(DEFAULT_EXAM.tasks[0].prompt)

    act(() => {
      fireEvent.click(utils.getByTestId("set"))
    })
    act(() => {
      fireEvent.click(utils.getByTestId("run"))
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000)
    })

    // First exam task is (0,5) with "step 5".
    expect(utils.getByTestId("done").textContent).toBe("1")
  })

  test("an exam with a player allow-list only lets listed names take it", async () => {
    const restricted = { ...DEFAULT_EXAM, players: ["Siti"] }
    function AllowProbe() {
      const { exam, startExam } = useRobot()
      return (
        <div>
          <span data-testid="players">{exam.players.join(",")}</span>
          <button data-testid="start" onClick={() => startExam(restricted)} />
          <ExamPanel playerName="Ali" />
        </div>
      )
    }

    const utils = render(
      <RobotProvider>
        <AllowProbe />
      </RobotProvider>,
    )
    act(() => {
      fireEvent.click(utils.getByTestId("start"))
    })
    expect(screen.getByText(/tiada dalam senarai pemain/i)).toBeTruthy()
  })

  test("submitting an exam stores a result with the player name", async () => {
    const utils = render(
      <RobotProvider>
        <Probe code="step 5" />
      </RobotProvider>,
    )
    act(() => {
      fireEvent.click(utils.getByTestId("mode-ujian"))
    })
    act(() => {
      fireEvent.click(utils.getByTestId("submit"))
    })

    const results = JSON.parse(localStorage.getItem("robo-coder-exam-results") ?? "[]")
    expect(results).toHaveLength(1)
    expect(results[0].playerName).toBe("Ali")
    expect(results[0].total).toBe(DEFAULT_EXAM.tasks.length)
  })
})
