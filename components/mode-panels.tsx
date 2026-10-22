"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRobot } from "@/lib/contexts/robot-context"
import { ArrowRight, Check, RotateCcw, Send, VolumeX, Volume2 } from "lucide-react"
import { useState } from "react"
import type { ExamResult } from "@/lib/exam"

export function FreePanel() {
  const { commands, soundOn, toggleSound, resetRobot } = useRobot()
  const lines = commands.split("\n").filter((l) => l.trim() && !l.trim().startsWith("//")).length

  return (
    <Card className="bg-slate-800 border-4 border-white shadow-2xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold">🎮 Mod Bebas</h3>
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-xs">Arahan: {lines} (tiada had)</span>
          <Button
            size="sm"
            variant="outline"
            onClick={toggleSound}
            aria-label={soundOn ? "Matikan bunyi" : "Hidupkan bunyi"}
            className="border-2 border-white/40 text-white/80 bg-transparent hover:bg-white/10 h-8 px-2"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      <p className="text-white/70 text-sm">
        Tiada sasaran dan tiada had. Cuba <code className="text-blue-300">step</code>,{" "}
        <code className="text-purple-300">loop</code>, <code className="text-orange-300">function</code> dan{" "}
        <code className="text-green-300">tp</code> sepuas hati. Robot kekal dalam medan 500×500.
      </p>
      <Button size="sm" variant="outline" onClick={resetRobot} className="self-start border-2 border-white/40 text-white/80 bg-transparent hover:bg-white/10">
        <RotateCcw className="mr-1 w-4 h-4" /> Set semula robot
      </Button>
    </Card>
  )
}

export function ExamPanel({ playerName }: { playerName: string }) {
  const { exam, examTaskIndex, examResults, won, nextExamTask, submitExam, attempts, soundOn, toggleSound } = useRobot()
  const [result, setResult] = useState<ExamResult | null>(null)

  const tasks = exam.tasks
  const task = tasks[examTaskIndex]
  const allowed =
    exam.players.length === 0 || exam.players.some((p) => p.toLowerCase() === playerName.trim().toLowerCase())
  const isLast = examTaskIndex === tasks.length - 1
  const done = examResults.filter((r) => r.completed).length

  if (!allowed) {
    return (
      <Card className="bg-slate-800 border-4 border-white shadow-2xl p-4">
        <p className="text-white font-bold">🚫 Nama anda tiada dalam senarai pemain ujian ini.</p>
        <p className="text-white/60 text-sm mt-1">
          Minta guru tambah &quot;{playerName}&quot; di Panel Guru, atau tekan Tukar mod untuk mod lain.
        </p>
      </Card>
    )
  }

  if (!task) {
    return (
      <Card className="bg-slate-800 border-4 border-white shadow-2xl p-4">
        <p className="text-white">Ujian ini belum ada tugasan. Minta guru isi di Panel Guru.</p>
      </Card>
    )
  }

  if (result) {
    return (
      <Card className="bg-slate-800 border-4 border-white shadow-2xl p-4 flex flex-col gap-2">
        <h3 className="text-white font-bold">
          Keputusan: {result.score}/{result.total} — {result.passed ? "LULUS ✅" : "BELUM LULUS ❌"}
        </h3>
        <p className="text-white/70 text-sm">
          {result.playerName} · {result.examTitle} · {new Date(result.timestamp).toLocaleString()}
        </p>
        <ul className="text-white/80 text-sm list-disc list-inside">
          {result.perTask.map((t, i) => (
            <li key={t.taskId}>
              Tugasan {i + 1}: {t.completed ? `selesai (${t.lines} baris)` : "tidak selesai"}
            </li>
          ))}
        </ul>
        <p className="text-white/50 text-xs">Keputusan disimpan. Guru boleh lihat di Panel Guru.</p>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800 border-4 border-white shadow-2xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold">
          📝 {exam.title} — Tugasan {examTaskIndex + 1}/{tasks.length}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-xs">Selesai: {done}/{tasks.length}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={toggleSound}
            aria-label={soundOn ? "Matikan bunyi" : "Hidupkan bunyi"}
            className="border-2 border-white/40 text-white/80 bg-transparent hover:bg-white/10 h-8 px-2"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <p className="text-white/85 text-sm">{task.prompt}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        <span className="text-yellow-300">
          Sasaran: ({task.goal.x}, {task.goal.y})
        </span>
        <span className="text-white/60">Had: {task.maxLines} baris</span>
        <span className="text-white/60">Percubaan: {attempts}</span>
        {task.obstacles?.length ? <span className="text-red-300">🧱 {task.obstacles.length} halangan</span> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {tasks.map((t, i) => (
          <span
            key={t.id}
            className={`text-xs px-2 py-1 rounded-md border ${
              i === examTaskIndex
                ? "border-yellow-400 text-yellow-300"
                : examResults[i]?.completed
                  ? "border-green-400 text-green-300"
                  : "border-white/30 text-white/50"
            }`}
          >
            {examResults[i]?.completed ? <Check className="inline w-3 h-3 mr-1" /> : null}
            {i + 1}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {won && !isLast && (
          <Button size="sm" onClick={nextExamTask} className="bg-green-500 hover:bg-green-600 text-white">
            Tugasan seterusnya <ArrowRight className="ml-1 w-4 h-4" />
          </Button>
        )}
        {(isLast || done > 0) && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setResult(submitExam(playerName))}
            className="border-2 border-yellow-400 text-yellow-300 bg-transparent hover:bg-white/10"
          >
            <Send className="mr-1 w-4 h-4" /> Hantar ujian
          </Button>
        )}
        {!(won && !isLast) && !isLast && (
          <Button size="sm" variant="outline" onClick={nextExamTask} className="border-2 border-white/40 text-white/80 bg-transparent hover:bg-white/10">
            Langkau <ArrowRight className="ml-1 w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  )
}
