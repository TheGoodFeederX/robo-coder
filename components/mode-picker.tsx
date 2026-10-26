"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MODES, type Mode } from "@/lib/modes"
import { GraduationCap } from "lucide-react"


export function ModePicker({
  playerName,
  onChoose,
  onAdmin,
}: {
  playerName: string
  onChoose: (mode: Mode) => void
  onAdmin: () => void
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 via-fuchsia-700 to-rose-600 flex items-center justify-center p-4">
      <Card className="bg-white p-6 sm:p-8 max-w-3xl w-full shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-purple-700"><span aria-hidden="true">🤖</span> Pilih Mod</h1>
          <p className="text-slate-600 mt-2">Hai {playerName || "coder"}! Nak main macam mana hari ini?</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {MODES.map((mode) => (
            <div
              key={mode.id}
              className="border-2 border-slate-200 rounded-xl p-4 flex flex-col gap-3 hover:border-purple-400 transition-colors"
            >
              <div className="text-4xl text-center">{mode.emoji}</div>
              <h2 className="text-lg font-bold text-slate-800 text-center">{mode.title}</h2>
              <p className="text-sm text-slate-600 flex-1">{mode.description}</p>
              <Button
                onClick={() => onChoose(mode.id)}
                aria-label={`Main ${mode.title}`}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold"
              >
                Main
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t pt-4 text-center flex flex-col items-center gap-2">
          <Button onClick={onAdmin} variant="light" className="ring-offset-white">
            <GraduationCap className="mr-1 w-4 h-4" aria-hidden="true" /> Panel Guru
          </Button>
          <p className="text-xs text-slate-500">Panel Guru memerlukan log masuk akaun guru.</p>
        </div>
      </Card>
    </div>
  )
}
