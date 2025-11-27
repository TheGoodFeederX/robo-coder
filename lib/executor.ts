import type React from "react"
import type { Command } from "./parser"

interface RobotState {
  x: number
  y: number
  rotation: number
}

export function executeCommands(
  commands: Command[],
  setRobotState: React.Dispatch<React.SetStateAction<RobotState>>,
  setMessage: React.Dispatch<React.SetStateAction<string>>,
  setCurrentLine: React.Dispatch<React.SetStateAction<number>>,
  onComplete: () => void,
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

          setRobotState((prev) => {
            const radians = (prev.rotation * Math.PI) / 180
            // Move exactly 10px (1 grid unit) per step
            return {
              ...prev,
              x: Math.max(30, Math.min(470, prev.x + 10 * Math.sin(radians))),
              y: Math.max(30, Math.min(470, prev.y - 10 * Math.cos(radians))),
            }
          })

          await sleep(200) // Pause between each step for visualization
        }
      } else if (cmd.type === "turn") {
        const direction = cmd.value as string
        setRobotState((prev) => ({
          ...prev,
          rotation: prev.rotation + (direction === "left" ? -90 : 90),
        }))
        setMessage(`Turning ${direction}!`)
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
