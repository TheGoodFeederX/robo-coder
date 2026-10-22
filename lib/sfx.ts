// Tiny Web Audio cue player — no asset files, no library.
// ponytail: single shared AudioContext, created on first use; upgrade path is a real
// audio engine only if we ever need music or spatial sound.

type Cue = "step" | "turn" | "win" | "crash" | "click"

const NOTES: Record<Cue, { freq: number[]; duration: number; type: OscillatorType }> = {
  step: { freq: [440], duration: 0.06, type: "square" },
  turn: { freq: [560], duration: 0.07, type: "triangle" },
  click: { freq: [660], duration: 0.05, type: "sine" },
  crash: { freq: [220, 140, 90], duration: 0.28, type: "sawtooth" },
  win: { freq: [523, 659, 784, 1046], duration: 0.12, type: "triangle" },
}

let ctx: AudioContext | null = null
let muted = false

export function setMuted(next: boolean) {
  muted = next
}

export function isMuted() {
  return muted
}

function audio(): AudioContext | null {
  if (muted || typeof window === "undefined") return null
  if (!("AudioContext" in window || "webkitAudioContext" in window)) return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new Ctor()
  }
  if (ctx.state === "suspended") void ctx.resume()
  return ctx
}

export function play(cue: Cue) {
  const audioCtx = audio()
  if (!audioCtx) return

  const { freq, duration, type } = NOTES[cue]
  freq.forEach((hz, i) => {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    const start = audioCtx.currentTime + i * duration

    osc.type = type
    osc.frequency.setValueAtTime(hz, start)
    gain.gain.setValueAtTime(0.06, start)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

    osc.connect(gain).connect(audioCtx.destination)
    osc.start(start)
    osc.stop(start + duration)
  })
}
