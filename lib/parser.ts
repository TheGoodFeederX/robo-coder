export interface Command {
  type: "step" | "turn" | "rotate" | "loop" | "function" | "call" | "tp"
  value?: number | string
  coordinates?: { x: number; y: number }
  body?: Command[]
  lineNumber: number
}

export interface ParseResult {
  commands: Command[]
  errors: string[]
}

export function parseCode(code: string): ParseResult {
  const lines = code.split("\n").map((line) => line.trim())
  const commands: Command[] = []
  const errors: string[] = []
  const functions: Map<string, Command[]> = new Map()

  let index = 0

  function parseBlock(): Command[] {
    const block: Command[] = []

    while (index < lines.length) {
      const line = lines[index]
      const lineNumber = index

      // Skip empty lines and comments
      if (!line || line.startsWith("//")) {
        index++
        continue
      }

      // Handle closing brace
      if (line === "}") {
        index++
        return block
      }

      // Handle tp command
      if (line.startsWith("tp ")) {
        const match = line.match(/^tp\s+(-?\d+)\s*,\s*(-?\d+)/)
        if (match) {
          const x = Number.parseInt(match[1])
          const y = Number.parseInt(match[2])
          block.push({
            type: "tp",
            coordinates: { x, y },
            lineNumber,
          })
        } else {
          errors.push(`Line ${lineNumber + 1}: Invalid tp command. Use 'tp x,y' (e.g., tp 5,10)`)
        }
        index++
        continue
      }

      // Handle step command
      if (line.startsWith("step ")) {
        const match = line.match(/^step\s+(\d+)/)
        if (match) {
          block.push({
            type: "step",
            value: Number.parseInt(match[1]),
            lineNumber,
          })
        } else {
          errors.push(`Line ${lineNumber + 1}: Invalid step command`)
        }
        index++
        continue
      }

      // Handle turn command
      if (line.startsWith("turn ")) {
        const match = line.match(/^turn\s+(left|right)/)
        if (match) {
          block.push({
            type: "turn",
            value: match[1],
            lineNumber,
          })
        } else {
          errors.push(`Line ${lineNumber + 1}: Invalid turn command. Use 'turn left' or 'turn right'`)
        }
        index++
        continue
      }

      // Handle rotate command
      if (line.startsWith("rotate ")) {
        const match = line.match(/^rotate\s+(\d+)/)
        if (match) {
          block.push({
            type: "rotate",
            value: Number.parseInt(match[1]),
            lineNumber,
          })
        } else {
          errors.push(`Line ${lineNumber + 1}: Invalid rotate command`)
        }
        index++
        continue
      }

      // Handle loop command
      if (line.startsWith("loop ")) {
        const match = line.match(/^loop\s+(\d+)\s*\{/)
        if (match) {
          index++
          const loopBody = parseBlock()
          block.push({
            type: "loop",
            value: Number.parseInt(match[1]),
            body: loopBody,
            lineNumber,
          })
        } else {
          errors.push(`Line ${lineNumber + 1}: Invalid loop syntax. Use 'loop <number> {'`)
          index++
        }
        continue
      }

      // Handle function definition
      if (line.startsWith("function ")) {
        const match = line.match(/^function\s+(\w+)\s*\{/)
        if (match) {
          const funcId = match[1]
          index++
          const funcBody = parseBlock()
          functions.set(funcId, funcBody)
        } else {
          errors.push(`Line ${lineNumber + 1}: Invalid function syntax. Use 'function <id> {'`)
          index++
        }
        continue
      }

      // Handle function call
      if (line.startsWith("start function ")) {
        const match = line.match(/^start\s+function\s+(\w+)/)
        if (match) {
          block.push({
            type: "call",
            value: match[1],
            lineNumber,
          })
        } else {
          errors.push(`Line ${lineNumber + 1}: Invalid function call. Use 'start function <id>'`)
        }
        index++
        continue
      }

      // Handle stop function (no-op for compatibility)
      if (line.startsWith("stop function ")) {
        index++
        continue
      }

      // Unknown command
      if (line) {
        errors.push(`Line ${lineNumber + 1}: Unknown command '${line}'`)
      }
      index++
    }

    return block
  }

  const parsedCommands = parseBlock()

  // Expand function calls
  function expandCommands(cmds: Command[]): Command[] {
    const expanded: Command[] = []

    for (const cmd of cmds) {
      if (cmd.type === "call") {
        const funcBody = functions.get(cmd.value as string)
        if (funcBody) {
          expanded.push(...expandCommands(funcBody))
        } else {
          errors.push(`Line ${cmd.lineNumber + 1}: Function '${cmd.value}' is not defined`)
        }
      } else if (cmd.type === "loop" && cmd.body) {
        expanded.push({
          ...cmd,
          body: expandCommands(cmd.body),
        })
      } else {
        expanded.push(cmd)
      }
    }

    return expanded
  }

  const expandedCommands = expandCommands(parsedCommands)

  return {
    commands: expandedCommands,
    errors,
  }
}
