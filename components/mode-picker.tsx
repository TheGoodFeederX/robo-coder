"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MODES, type Mode } from "@/lib/modes"
import { GraduationCap, Lock } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { getAdminPin } from "@/lib/storage"
import { modeTitle } from "@/lib/modes"

export function ModePicker({
  playerName,
  onChoose,
  onAdmin,
}: {
  playerName: string
  onChoose: (mode: Mode) => void
  onAdmin: () => void
}) {
  const [asking, setAsking] = useState(false)
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")

  const tryAdmin = () => {
    if (pin === getAdminPin()) {
      setPin("")
      setError("")
      setAsking(false)
      onAdmin()
    } else {
      setError("PIN salah.")
    }
  }

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

        <div className="mt-6 border-t pt-4">
          {asking ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 justify-center">
              <label htmlFor="admin-pin" className="text-sm text-slate-600">
                PIN guru:
              </label>
              <Input
                id="admin-pin"
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && tryAdmin()}
                aria-invalid={Boolean(error)}
                aria-describedby="pin-error"
                className="w-full sm:w-32 border-2 border-slate-300"
              />
              <Button onClick={tryAdmin} variant="warning" className="ring-offset-white">
                <Lock className="mr-1 w-4 h-4" aria-hidden="true" /> Masuk
              </Button>
              <Button onClick={() => setAsking(false)} variant="light" className="ring-offset-white">
                Batal
              </Button>
              </div>
              {error && (
                <p id="pin-error" role="alert" className="text-red-700 text-sm font-bold text-center">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center">
              <Button onClick={() => setAsking(true)} variant="light" className="ring-offset-white">
                <GraduationCap className="mr-1 w-4 h-4" aria-hidden="true" /> Panel Guru
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export { modeTitle }
