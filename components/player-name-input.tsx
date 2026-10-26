"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Heart } from "lucide-react"

interface PlayerNameInputProps {
  onStartGame: (playerName: string) => void
}

export function PlayerNameInput({ onStartGame }: PlayerNameInputProps) {
  const [name, setName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onStartGame(name.trim())
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 via-fuchsia-700 to-rose-600 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="bg-white p-8 max-w-md w-full shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-purple-700 mb-2"><span aria-hidden="true">🤖</span> Robo-Coder Playground</h1>
            <p className="text-lg text-slate-600">Selamat datang, coder muda!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="playerName" className="text-lg font-semibold text-slate-700">
                Siapa nama anda?
              </Label>
              <Input
                id="playerName"
                type="text"
                maxLength={30}
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama anda"
                className="text-lg h-12 border-2 border-purple-300 focus:border-purple-500"
              />
            </div>

            <p className="text-sm text-slate-500">Isi nama (maksimum 30 aksara) untuk mula.</p>

            <Button
              type="submit"
              disabled={!name.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xl font-bold h-14 shadow-lg"
            >
              Mula Coding! 🚀
            </Button>
          </form>
        </Card>
      </div>

      <footer className="py-4 text-center text-white/90 text-sm backdrop-blur-sm bg-black/10">
        <p className="flex items-center justify-center gap-2">
          Dibina dengan <Heart className="w-4 h-4 fill-red-500 text-red-500" /> oleh Ustaz Najmi | 2025
        </p>
      </footer>
    </div>
  )
}
