export interface Level {
  id: string
  title: string
  goal: { x: number; y: number }
  /** Lines of code needed for 3 stars. */
  par: number
  hint: string
  /** Optional pre-filled starter code for the editor. */
  starter?: string
}

/** Goal coords are in grid units (10px each), origin at canvas centre, +y is up. */
export const LEVELS: Level[] = [
  { id: "first-step", title: "First Step", goal: { x: 0, y: 5 }, par: 1, hint: "Use step 5." },
  { id: "right-turn", title: "Turn Right", goal: { x: 3, y: 0 }, par: 2, hint: "turn right, then step 3." },
  { id: "about-face", title: "About Face", goal: { x: 0, y: -4 }, par: 2, hint: "rotate 180, then step 4." },
  { id: "loop-power", title: "Loop Power", goal: { x: 10, y: 0 }, par: 4, hint: "turn right and loop step 1 ten times." },
  { id: "zigzag", title: "Zigzag", goal: { x: 3, y: -3 }, par: 4, hint: "Two right turns, one step 3 between them." },
  {
    id: "long-haul",
    title: "Long Haul",
    goal: { x: -12, y: 0 },
    par: 4,
    hint: "12 langkah jauhnya — jangan tulis 12 baris. Pusing kiri, loop 4 kali step 3.",
  },
  {
    id: "moonwalk",
    title: "Moonwalk",
    goal: { x: 0, y: -6 },
    par: 2,
    hint: "Pusing belakang dulu: rotate 180, kemudian step 6.",
  },
  {
    id: "crossroads",
    title: "Crossroads",
    goal: { x: 5, y: -4 },
    par: 4,
    hint: "Dua arah: kanan 5 langkah, pusing kanan, 4 langkah ke bawah.",
  },
  {
    id: "double-function",
    title: "Double Function",
    goal: { x: 4, y: 4 },
    par: 6,
    hint: "Buat fungsi yang `step 4` dan `turn right`, kemudian panggil dua kali.",
    starter: "function jog {\n  step 4\n  turn right\n}\n",
  },
  {
    id: "teleport",
    title: "Teleport",
    goal: { x: -15, y: 15 },
    par: 1,
    hint: "Satu arahan sahaja: tp -15,15.",
  },
]

/** Reference solutions used by the test suite to prove every par is achievable. */
export const SOLUTIONS: Record<string, string> = {
  "first-step": "step 5",
  "right-turn": "turn right\nstep 3",
  "about-face": "rotate 180\nstep 4",
  "loop-power": "turn right\nloop 10 {\n  step 1\n}",
  zigzag: "turn right\nstep 3\nturn right\nstep 3",
  "long-haul": "turn left\nloop 4 {\n  step 3\n}",
  moonwalk: "rotate 180\nstep 6",
  crossroads: "turn right\nstep 5\nturn right\nstep 4",
  "double-function": "function jog {\n  step 4\n  turn right\n}\nstart function jog\nstart function jog",
  teleport: "tp -15,15",
}

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
