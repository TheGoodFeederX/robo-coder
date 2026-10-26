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
  /** 0-based lines that failed to parse, for editor highlighting. */
  errorLines: number[]
}

export function parseCode(code: string): ParseResult {
  const lines = code.split("\n").map((line) => line.trim())
  const commands: Command[] = []
  const errors: string[] = []
  const errorLines: number[] = []
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
          errorLines.push(lineNumber); errors.push(`Baris ${lineNumber + 1}: Arahan tp tidak betul. Cuba: tp 5,10`)
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
          errorLines.push(lineNumber); errors.push(`Baris ${lineNumber + 1}: Arahan step tidak betul. Cuba: step 3`)
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
          errorLines.push(lineNumber); errors.push(`Baris ${lineNumber + 1}: Arahan turn tidak betul. Cuba: turn left atau turn right`)
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
          errorLines.push(lineNumber); errors.push(`Baris ${lineNumber + 1}: Arahan rotate tidak betul. Cuba: rotate 90`)
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
          errorLines.push(lineNumber); errors.push(`Baris ${lineNumber + 1}: Sintaks loop salah. Cuba: loop 3 {`)
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
          errorLines.push(lineNumber); errors.push(`Baris ${lineNumber + 1}: Sintaks function salah. Cuba: function lompat {`)
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
          errorLines.push(lineNumber); errors.push(`Baris ${lineNumber + 1}: Panggilan fungsi salah. Cuba: start function lompat`)
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
        errorLines.push(lineNumber); errors.push(`Baris ${lineNumber + 1}: Arahan tidak dikenali: '${line}'`)
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
          errorLines.push(cmd.lineNumber)
          errors.push(`Baris ${cmd.lineNumber + 1}: Fungsi '${cmd.value}' belum ditakrifkan`)
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
    errorLines: Array.from(new Set(errorLines)).sort((a, b) => a - b),
  }
}
