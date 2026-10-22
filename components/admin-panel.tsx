"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DEFAULT_ADMIN_PIN,
  clearExamResults,
  getAdminPin,
  getExam,
  getExamResults,
  saveAdminPin,
  saveExam,
} from "@/lib/storage"
import { DEFAULT_EXAM, formatObstacles, parseObstacleList, type Exam, type ExamTask } from "@/lib/exam"
import { LEVELS } from "@/lib/levels"
import { Download, Lock, Plus, Save, Trash2 } from "lucide-react"

function emptyTask(index: number): ExamTask {
  return { id: `t${index}-${Math.random().toString(36).slice(2, 6)}`, prompt: "", goal: { x: 0, y: 0 }, maxLines: 5 }
}

export function AdminPanel() {
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState("")
  const [exam, setExam] = useState<Exam>(DEFAULT_EXAM)
  const [saved, setSaved] = useState("")
  const [obstacleText, setObstacleText] = useState<Record<string, string>>({})
  const [resultsVersion, setResultsVersion] = useState(0)
  const [newPin, setNewPin] = useState("")

  useEffect(() => {
    setExam(getExam())
  }, [])

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="bg-slate-800 border-4 border-white p-8 w-full max-w-md flex flex-col gap-3">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5" /> Panel Guru
          </h1>
          <p className="text-white/70 text-sm">Masukkan PIN untuk mengurus ujian. PIN asal: {DEFAULT_ADMIN_PIN}</p>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return
              if (pin === getAdminPin()) setUnlocked(true)
              else setPinError("PIN salah.")
            }}
            className="border-2 border-slate-500 bg-slate-900 text-white rounded-md px-3 py-2"
            aria-label="PIN guru"
            autoFocus
          />
          {pinError && <p className="text-red-400 text-sm">{pinError}</p>}
          <Button
            onClick={() => (pin === getAdminPin() ? setUnlocked(true) : setPinError("PIN salah."))}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold"
          >
            Masuk
          </Button>
        </Card>
      </div>
    )
  }

  const results = getExamResults()
  void resultsVersion

  const updateTask = (index: number, patch: Partial<ExamTask>) => {
    setExam((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    }))
  }

  const applyObstacles = (index: number, taskId: string) => {
    const parsed = parseObstacleList(obstacleText[taskId] ?? formatObstacles(exam.tasks[index].obstacles))
    if (parsed === null) {
      setSaved("Format halangan salah. Guna contoh: 3,2; 5,-1")
      return
    }
    updateTask(index, { obstacles: parsed })
    setSaved("")
  }

  const loadLevelTemplate = (levelId: string) => {
    const level = LEVELS.find((l) => l.id === levelId)
    if (!level) return
    setExam((prev) => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          id: `t${prev.tasks.length + 1}-${Math.random().toString(36).slice(2, 6)}`,
          prompt: `Ikut tahap "${level.title}": pergi ke (${level.goal.x}, ${level.goal.y}).`,
          goal: level.goal,
          obstacles: level.obstacles,
          maxLines: level.par + 2,
        },
      ],
    }))
  }

  const exportCsv = () => {
    const rows = [
      ["pemain", "ujian", "markah", "jumlah", "lulus", "masa"],
      ...results.map((r) => [
        r.playerName || "(tanpa nama)",
        r.examTitle,
        String(r.score),
        String(r.total),
        r.passed ? "ya" : "tidak",
        new Date(r.timestamp).toLocaleString(),
      ]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "keputusan-ujian.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(exam, null, 2)], { type: "application/json" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "ujian.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  const importJson = (file: File) => {
    file
      .text()
      .then((text) => {
        const parsed = JSON.parse(text) as Exam
        if (!Array.isArray(parsed.tasks)) throw new Error("fail tidak sah")
        setExam(parsed)
        setSaved("Fail dimuatkan. Tekan Simpan Ujian untuk kekalkan.")
      })
      .catch(() => setSaved("Gagal baca fail JSON."))
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="container mx-auto max-w-4xl flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold">🧑‍🏫 Panel Guru — Mod Ujian</h1>
          <p className="text-white/60 text-xs">
            Tetapan disimpan dalam browser ini sahaja (tidak dimuat naik).
          </p>
        </div>

        <Card className="bg-slate-800 border-2 border-slate-600 p-4 flex flex-col gap-3">
          <h2 className="font-bold">Tetapan ujian</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Tajuk ujian
              <input
                value={exam.title}
                onChange={(e) => setExam({ ...exam, title: e.target.value })}
                className="border-2 border-slate-500 bg-slate-900 rounded-md px-2 py-1"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Markah lulus (bilangan tugasan)
              <input
                type="number"
                min={0}
                max={exam.tasks.length}
                value={exam.passMark}
                onChange={(e) => setExam({ ...exam, passMark: Number(e.target.value) })}
                className="border-2 border-slate-500 bg-slate-900 rounded-md px-2 py-1"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Pemain dibenarkan (pisah dengan koma; kosong = semua)
              <input
                value={exam.players.join(", ")}
                onChange={(e) =>
                  setExam({
                    ...exam,
                    players: e.target.value
                      .split(",")
                      .map((p) => p.trim())
                      .filter(Boolean),
                  })
                }
                className="border-2 border-slate-500 bg-slate-900 rounded-md px-2 py-1"
              />
            </label>
          </div>
        </Card>

        <Card className="bg-slate-800 border-2 border-slate-600 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-bold">Tugasan ({exam.tasks.length})</h2>
            <div className="flex flex-wrap gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) loadLevelTemplate(e.target.value)
                  e.target.value = ""
                }}
                className="border-2 border-slate-500 bg-slate-900 rounded-md px-2 py-1 text-sm"
                aria-label="Tambah dari tahap jelajah"
                defaultValue=""
              >
                <option value="">Tambah dari tahap jelajah…</option>
                {LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setExam({ ...exam, tasks: [...exam.tasks, emptyTask(exam.tasks.length + 1)] })}
                className="border-2 border-white/40 bg-transparent text-white"
              >
                <Plus className="mr-1 w-4 h-4" /> Tugasan kosong
              </Button>
            </div>
          </div>

          {exam.tasks.map((task, i) => (
            <div key={task.id} className="border-2 border-slate-600 rounded-lg p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">Tugasan {i + 1}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setExam({ ...exam, tasks: exam.tasks.filter((_, j) => j !== i) })}
                  className="border-2 border-red-400/60 bg-transparent text-red-300"
                  aria-label={`Buang tugasan ${i + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <input
                value={task.prompt}
                onChange={(e) => updateTask(i, { prompt: e.target.value })}
                placeholder="Arahan untuk pemain"
                className="border-2 border-slate-500 bg-slate-900 rounded-md px-2 py-1 text-sm"
                aria-label={`Arahan tugasan ${i + 1}`}
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <label className="flex flex-col gap-1">
                  Sasaran X
                  <input
                    type="number"
                    value={task.goal.x}
                    onChange={(e) => updateTask(i, { goal: { ...task.goal, x: Number(e.target.value) } })}
                    className="border-2 border-slate-500 bg-slate-900 rounded-md px-2 py-1"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  Sasaran Y
                  <input
                    type="number"
                    value={task.goal.y}
                    onChange={(e) => updateTask(i, { goal: { ...task.goal, y: Number(e.target.value) } })}
                    className="border-2 border-slate-500 bg-slate-900 rounded-md px-2 py-1"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  Had baris
                  <input
                    type="number"
                    min={1}
                    value={task.maxLines}
                    onChange={(e) => updateTask(i, { maxLines: Number(e.target.value) })}
                    className="border-2 border-slate-500 bg-slate-900 rounded-md px-2 py-1"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  Halangan (x,y; x,y)
                  <input
                    value={obstacleText[task.id] ?? formatObstacles(task.obstacles)}
                    onChange={(e) => setObstacleText({ ...obstacleText, [task.id]: e.target.value })}
                    onBlur={() => applyObstacles(i, task.id)}
                    className="border-2 border-slate-500 bg-slate-900 rounded-md px-2 py-1"
                  />
                </label>
              </div>
            </div>
          ))}
        </Card>

        <Card className="bg-slate-800 border-2 border-slate-600 p-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                saveExam(exam)
                setSaved("Ujian disimpan.")
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold"
            >
              <Save className="mr-1 w-4 h-4" /> Simpan ujian
            </Button>
            <Button onClick={exportJson} variant="outline" className="border-2 border-white/40 bg-transparent text-white">
              <Download className="mr-1 w-4 h-4" /> Eksport JSON
            </Button>
            <label className="border-2 border-white/40 rounded-md px-3 py-2 text-sm cursor-pointer">
              Import JSON
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])}
              />
            </label>
            <Button
              onClick={() => {
                setExam(DEFAULT_EXAM)
                setSaved("Ditetapkan semula kepada ujian contoh (belum disimpan).")
              }}
              variant="outline"
              className="border-2 border-white/40 bg-transparent text-white"
            >
              Set semula contoh
            </Button>
            {saved && <span className="text-green-300 text-sm">{saved}</span>}
          </div>
        </Card>

        <Card className="bg-slate-800 border-2 border-slate-600 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-bold">Keputusan ({results.length})</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={exportCsv}
                disabled={!results.length}
                variant="outline"
                className="border-2 border-white/40 bg-transparent text-white"
              >
                <Download className="mr-1 w-4 h-4" /> Eksport CSV
              </Button>
              <Button
                onClick={() => {
                  clearExamResults()
                  setResultsVersion((v) => v + 1)
                }}
                disabled={!results.length}
                variant="outline"
                className="border-2 border-red-400/60 bg-transparent text-red-300"
              >
                <Trash2 className="mr-1 w-4 h-4" /> Padam semua
              </Button>
            </div>
          </div>
          {results.length === 0 ? (
            <p className="text-white/60 text-sm">Belum ada keputusan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-white/60 text-left">
                  <tr>
                    <th className="py-1">Pemain</th>
                    <th>Markah</th>
                    <th>Status</th>
                    <th>Masa</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.id} className="border-t border-slate-700">
                      <td className="py-1">{r.playerName || "(tanpa nama)"}</td>
                      <td>
                        {r.score}/{r.total}
                      </td>
                      <td className={r.passed ? "text-green-300" : "text-red-300"}>
                        {r.passed ? "Lulus" : "Belum lulus"}
                      </td>
                      <td>{new Date(r.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="bg-slate-800 border-2 border-slate-600 p-4 flex flex-col gap-2">
          <h2 className="font-bold">PIN guru</h2>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-sm">
              PIN baru
              <input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="border-2 border-slate-500 bg-slate-900 rounded-md px-2 py-1"
              />
            </label>
            <Button
              onClick={() => {
                if (newPin.trim().length < 4) {
                  setSaved("PIN mesti sekurang-kurangnya 4 aksara.")
                  return
                }
                saveAdminPin(newPin.trim())
                setNewPin("")
                setSaved("PIN dikemas kini.")
              }}
              variant="outline"
              className="border-2 border-white/40 bg-transparent text-white"
            >
              Tukar PIN
            </Button>
          </div>
          <p className="text-white/50 text-xs">
            Amaran: PIN dan data ujian disimpan dalam localStorage browser ini sahaja — bukan kawalan keselamatan sebenar.
          </p>
        </Card>
      </div>
    </div>
  )
}