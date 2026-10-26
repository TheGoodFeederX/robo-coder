"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LEVELS, countLines, lineBudget } from "@/lib/levels"
import { useRobot } from "@/lib/contexts/robot-context"
import { ArrowRight, Lightbulb, Star, Volume2, VolumeX } from "lucide-react"

export function LevelPanel() {
  const {
    level,
    levelIndex,
    selectLevel,
    nextLevel,
    won,
    stars,
    progress,
    commands,
    attempts,
    hintUsed,
    revealHint,
    soundOn,
    toggleSound,
  } = useRobot()

  const isLast = levelIndex === LEVELS.length - 1
  const cleared = Object.keys(progress).length
  const used = countLines(commands)
  const budget = lineBudget(level)
  const overBudget = used > budget

  return (
    <Card className="bg-slate-800 border-4 border-white shadow-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-white font-bold">
          Tahap {levelIndex + 1}/{LEVELS.length}: {level.title}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-amber-300 text-sm">
            <span aria-hidden="true">🏆</span> {cleared}/{LEVELS.length} selesai
          </span>
          <Button
            size="icon"
            variant="outline"
            onClick={toggleSound}
            aria-label={soundOn ? "Matikan bunyi" : "Hidupkan bunyi"}
          >
            {soundOn ? <Volume2 className="w-5 h-5" aria-hidden="true" /> : <VolumeX className="w-5 h-5" aria-hidden="true" />}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className={`font-bold text-sm ${overBudget ? "text-red-300" : "text-white/80"}`}>
          Arahan: {used} / {budget}
          {overBudget ? " — terlalu banyak, pendekkan kod!" : ""}
        </span>
        <span className="text-white/80 text-sm">Percubaan: {attempts}</span>
        {level.obstacles?.length ? <span className="text-red-300 text-sm"><span aria-hidden="true">🧱</span> {level.obstacles.length} halangan</span> : null}
      </div>

      {hintUsed ? (
        <p className="text-white/80 text-sm" role="note">
          💡 {level.hint} Sasaran:{" "}
          <code className="text-yellow-300">
            ({level.goal.x}, {level.goal.y})
          </code>
        </p>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={revealHint}
          className="self-start border-2 border-yellow-400/60 text-yellow-300 bg-transparent hover:bg-white/10"
        >
          <Lightbulb className="mr-1 w-4 h-4" />
          Tunjuk petunjuk (had ★★)
        </Button>
      )}

      <div className="flex flex-wrap gap-2">
        {LEVELS.map((lvl, i) => (
          <Button
            key={lvl.id}
            size="sm"
            variant="outline"
            onClick={() => selectLevel(i)}
            aria-label={`Tahap ${i + 1}: ${lvl.title}`}
            aria-current={i === levelIndex ? "step" : undefined}
            className={`border-2 ${
              i === levelIndex ? "border-yellow-400 text-yellow-300" : "border-white/40 text-white/70"
            } bg-transparent hover:bg-white/10`}
          >
            {i + 1}
            <span className="ml-1 text-xs" aria-hidden="true">
              {"★".repeat(progress[lvl.id]?.stars ?? 0) || "·"}
            </span>
            <span className="sr-only">
              {progress[lvl.id] ? `selesai, ${progress[lvl.id].stars} bintang` : "belum selesai"}
              {i === levelIndex ? ", tahap semasa" : ""}
            </span>
          </Button>
        ))}
      </div>

      {won ? (
        <div className="flex items-center justify-between bg-green-500/20 border-2 border-green-400 rounded-lg px-4 py-2">
          <p className="text-white font-bold">
            Tahap selesai!{" "}
            {Array.from({ length: stars }, (_, i) => (
              <Star key={i} className="inline w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
          </p>
          <Button
            onClick={nextLevel}
            disabled={isLast}
            size="sm"
            variant="success"
          >
            {isLast ? "Habis" : "Seterusnya"}
            {!isLast && <ArrowRight className="ml-1 w-4 h-4" />}
          </Button>
        </div>
      ) : (
        <p className="text-white/80 text-sm">
          Par: {level.par} baris untuk ★★★ · terbaik anda:{" "}
          {progress[level.id] ? `${progress[level.id].bestLines} baris` : "—"}
        </p>
      )}
    </Card>
  )
}
