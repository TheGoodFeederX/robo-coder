export interface Level {
  id: string
  title: string
  goal: { x: number; y: number }
  /** Lines of code needed for 3 stars. */
  par: number
  hint: string
}

/** Goal coords are in grid units (10px each), origin at canvas centre, +y is up. */
export const LEVELS: Level[] = [
  { id: "first-step", title: "First Step", goal: { x: 0, y: 5 }, par: 1, hint: "Use step 5." },
  { id: "right-turn", title: "Turn Right", goal: { x: 3, y: 0 }, par: 2, hint: "turn right, then step 3." },
  { id: "about-face", title: "About Face", goal: { x: 0, y: -4 }, par: 2, hint: "rotate 180, then step 4." },
  { id: "loop-power", title: "Loop Power", goal: { x: 10, y: 0 }, par: 4, hint: "turn right and loop step 1 ten times." },
  { id: "zigzag", title: "Zigzag", goal: { x: 3, y: -3 }, par: 4, hint: "Two right turns, one step 3 between them." },
]

/** Tolerance in grid units. */
export const GOAL_TOLERANCE = 0.5

/** Canvas px -> grid units. */
export function toGrid(state: { x: number; y: number }): { x: number; y: number } {
  return { x: (state.x - 250) / 10, y: (250 - state.y) / 10 }
}

export function isAtGoal(state: { x: number; y: number }, goal: { x: number; y: number }): boolean {
  const p = toGrid(state)
  return Math.hypot(p.x - goal.x, p.y - goal.y) <= GOAL_TOLERANCE
}

/** 3 stars at par, 2 within 1.5x par, else 1. */
export function starsFor(lines: number, par: number): number {
  if (lines <= par) return 3
  if (lines <= Math.ceil(par * 1.5)) return 2
  return 1
}

/** Count of non-empty, non-comment code lines. */
export function countLines(code: string): number {
  return code.split("\n").filter((l) => l.trim() && !l.trim().startsWith("//")).length
}
