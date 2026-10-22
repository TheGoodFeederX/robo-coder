import type { Command } from "./parser"

interface RobotState {
  x: number
  y: number
  rotation: number
}

export interface ExecuteOptions {
  /** Returns true when the given position would enter an obstacle. */
  isBlocked?: (state: RobotState) => boolean
  /** Called when the run stops early because of an obstacle. */
  onBlocked?: () => void
  /** Movement cue for sound/feedback. */
  onEvent?: (event: "step" | "turn") => void
}

export function executeCommands(
  commands: Command[],
  setRobotState: (updater: (prev: RobotState) => RobotState) => void,
  setMessage: (message: string) => void,
  setCurrentLine: (line: number) => void,
  onComplete: () => void,
  options: ExecuteOptions = {},
): () => void {
  let stopped = false
  let timeoutId: NodeJS.Timeout | null = null

  async function execute(cmds: Command[], startIndex = 0) {
    for (let i = startIndex; i < cmds.length; i++) {
      if (stopped) return

      const cmd = cmds[i]
      setCurrentLine(cmd.lineNumber)

      if (cmd.type === "tp" && cmd.coordinates) {
        const { x, y } = cmd.coordinates
        setMessage(`Teleporting to (${x}, ${y})!`)

        if (options.isBlocked?.({ x: 250 + x * 10, y: 250 - y * 10, rotation: 0 })) {
          setMessage(`Crash! (${x}, ${y}) is blocked.`)
          stopped = true
          options.onBlocked?.()
          return
        }

        setRobotState((prev) => {
          // Convert grid coordinates to canvas coordinates
          // Grid center (0,0) is at canvas (250, 250)
          // Each grid unit is 10px
          const canvasX = 250 + x * 10
          const canvasY = 250 - y * 10

          // Keep robot within bounds (30 to 470 on both axes)
          return {
            ...prev,
            x: Math.max(30, Math.min(470, canvasX)),
            y: Math.max(30, Math.min(470, canvasY)),
          }
        })
      } else if (cmd.type === "step") {
        const totalSteps = cmd.value as number
        setMessage(`Moving ${totalSteps} steps forward!`)

        for (let step = 0; step < totalSteps; step++) {
          if (stopped) return

          const moved = attemptMove()
          if (!moved) return
          options.onEvent?.("step")

          await sleep(200) // Pause between each step for visualization
        }
      } else if (cmd.type === "turn") {
        const direction = cmd.value as string
        setRobotState((prev) => ({
          ...prev,
          rotation: prev.rotation + (direction === "left" ? -90 : 90),
        }))
        setMessage(`Turning ${direction}!`)
        options.onEvent?.("turn")
      } else if (cmd.type === "rotate") {
        const degrees = cmd.value as number
        setRobotState((prev) => ({
          ...prev,
          rotation: prev.rotation + degrees,
        }))
        setMessage(`Rotating ${degrees} degrees!`)
      } else if (cmd.type === "loop" && cmd.body) {
        const times = cmd.value as number
        for (let j = 0; j < times; j++) {
          if (stopped) return
          setMessage(`Loop ${j + 1} of ${times}`)
          await execute(cmd.body)
          if (stopped) return
          await sleep(300)
        }
      }

      await sleep(400)
    }
  }

  /** Applies one grid step; refuses (and stops the run) if it hits an obstacle. */
  function attemptMove(): boolean {
    let blocked = false

    setRobotState((prev) => {
      const radians = (prev.rotation * Math.PI) / 180
      // Move exactly 10px (1 grid unit) per step
      const candidate = {
        ...prev,
        x: Math.max(30, Math.min(470, prev.x + 10 * Math.sin(radians))),
        y: Math.max(30, Math.min(470, prev.y - 10 * Math.cos(radians))),
      }
      if (options.isBlocked?.(candidate)) {
        blocked = true
        return prev
      }
      return candidate
    })

    if (blocked) {
      setMessage("Crash! Robot hit a wall. Try another path.")
      stopped = true
      options.onBlocked?.()
      return false
    }
    return true
  }

  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      timeoutId = setTimeout(resolve, ms)
    })
  }

  execute(commands).then(() => {
    if (!stopped) {
      setCurrentLine(-1)
      onComplete()
    }
  })

  return () => {
    stopped = true
    if (timeoutId) clearTimeout(timeoutId)
  }
}
