"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LEVELS, countLines, lineBudget } from "@/lib/levels"
import { useRobot } from "@/lib/contexts/robot-context"
import { ArrowRight, Star } from "lucide-react"

export function LevelPanel() {
  const { level, levelIndex, selectLevel, nextLevel, won, stars, progress, commands } = useRobot()
  const isLast = levelIndex === LEVELS.length - 1
  const cleared = Object.keys(progress).length
  const used = countLines(commands)
  const budget = lineBudget(level)
  const overBudget = used > budget

  return (
    <Card className="bg-slate-800 border-4 border-white shadow-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold">
          Level {levelIndex + 1}/{LEVELS.length}: {level.title}
        </h3>
        <span className="text-yellow-300 text-sm">🏆 {cleared}/{LEVELS.length} cleared</span>
      </div>

      <p className={`text-xs font-bold ${overBudget ? "text-red-400" : "text-white/70"}`}>
        Commands: {used} / {budget} {overBudget ? "— terlalu banyak, pendekkan kod!" : ""}
      </p>

      <p className="text-white/80 text-sm">
        Reach the ⭐ at <code className="text-yellow-300">({level.goal.x}, {level.goal.y})</code>.{" "}
        {level.hint}
      </p>

      <div className="flex flex-wrap gap-2">
        {LEVELS.map((lvl, i) => (
          <Button
            key={lvl.id}
            size="sm"
            variant="outline"
            onClick={() => selectLevel(i)}
            className={`border-2 ${
              i === levelIndex ? "border-yellow-400 text-yellow-300" : "border-white/40 text-white/70"
            } bg-transparent hover:bg-white/10`}
          >
            {i + 1}
            <span className="ml-1 text-xs">
              {"★".repeat(progress[lvl.id]?.stars ?? 0) || "·"}
            </span>
          </Button>
        ))}
      </div>

      {won ? (
        <div className="flex items-center justify-between bg-green-500/20 border-2 border-green-400 rounded-lg px-4 py-2">
          <p className="text-white font-bold">
            Level cleared! {Array.from({ length: stars }, (_, i) => (
              <Star key={i} className="inline w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
          </p>
          <Button onClick={nextLevel} disabled={isLast} size="sm" className="bg-green-500 hover:bg-green-600 text-white">
            {isLast ? "Done" : "Next"}
            {!isLast && <ArrowRight className="ml-1 w-4 h-4" />}
          </Button>
        </div>
      ) : (
        <p className="text-white/60 text-xs">
          Par: {level.par} lines for ★★★ · your best:{" "}
          {progress[level.id] ? `${progress[level.id].bestLines} lines` : "—"}
        </p>
      )}
    </Card>
  )
}
