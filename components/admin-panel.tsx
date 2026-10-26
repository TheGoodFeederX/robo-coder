"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { clearExamResults, getExam, getExamResults, saveExam } from "@/lib/storage"
import { DEFAULT_EXAM, formatObstacles, parseObstacleList, validateExam, type Exam, type ExamResult, type ExamTask } from "@/lib/exam"
import { LEVELS } from "@/lib/levels"
import { ArrowLeft, Download, Lock, LogOut, Plus, Save, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn, signOut, signUp, useSession } from "@/lib/auth-client"
import { validateTeacherCredentials } from "@/lib/auth-rules"
import { apiBackendAvailable, apiClearResults, apiGetExam, apiListResults, apiSaveExam } from "@/lib/api-client"

function emptyTask(index: number): ExamTask {
  return { id: `t${index}-${Math.random().toString(36).slice(2, 6)}`, prompt: "", goal: { x: 0, y: 0 }, maxLines: 5 }
}

function TeacherAuth() {
  const [mode, setMode] = useState<"masuk" | "daftar">("masuk")
  const [name, setName] = useState("Guru")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setError("")
    const problem = validateTeacherCredentials(email, password)
    if (problem) {
      setError(problem)
      return
    }

    setBusy(true)
    const result =
      mode === "masuk"
        ? await signIn.email({ email: email.trim(), password })
        : await signUp.email({ email: email.trim(), password, name: name.trim() || "Guru" })
    setBusy(false)

    if (result.error) {
      setError(result.error.message ?? "Gagal log masuk.")
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="bg-slate-800 border-4 border-white p-8 w-full max-w-md flex flex-col gap-3">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Lock className="w-5 h-5" aria-hidden="true" /> Panel Guru
        </h1>
        <p className="text-white/70 text-sm">
          {mode === "masuk"
            ? "Log masuk dengan akaun guru."
            : "Cipta akaun guru pertama. Hanya satu akaun dibenarkan untuk deployment ini."}
        </p>

        {mode === "daftar" && (
          <div className="flex flex-col gap-1">
            <Label htmlFor="teacher-name" className="text-white/80">
              Nama
            </Label>
            <Input
              id="teacher-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="border-2 border-slate-500 bg-slate-900 text-white"
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <Label htmlFor="teacher-email" className="text-white/80">
            Emel
          </Label>
          <Input
            id="teacher-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-invalid={Boolean(error)}
            aria-describedby="auth-error"
            className="border-2 border-slate-500 bg-slate-900 text-white"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="teacher-password" className="text-white/80">
            Kata laluan (min 8 aksara)
          </Label>
          <Input
            id="teacher-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit()
            }}
            autoComplete={mode === "masuk" ? "current-password" : "new-password"}
            aria-invalid={Boolean(error)}
            aria-describedby="auth-error"
            className="border-2 border-slate-500 bg-slate-900 text-white"
          />
        </div>

        {error && (
          <p id="auth-error" role="alert" className="text-red-300 text-sm font-bold">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button onClick={() => void submit()} disabled={busy} variant="warning" className="flex-1">
            {busy ? "Memproses…" : mode === "masuk" ? "Masuk" : "Cipta akaun"}
          </Button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1 rounded-md border-2 border-white/60 px-4 h-11 text-white text-sm hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Permainan
          </Link>
        </div>

        <button
          type="button"
          onClick={() => {
            setError("")
            setMode(mode === "masuk" ? "daftar" : "masuk")
          }}
          className="text-white/70 text-sm underline underline-offset-2 hover:text-white self-start"
        >
          {mode === "masuk" ? "Belum ada akaun guru? Cipta akaun" : "Sudah ada akaun? Log masuk"}
        </button>
      </Card>
    </div>
  )
}

export function AdminPanel() {
  const { data: session, isPending } = useSession()
  const [exam, setExam] = useState<Exam>(DEFAULT_EXAM)
  const [saved, setSaved] = useState("")
  const [obstacleText, setObstacleText] = useState<Record<string, string>>({})
  const [resultsVersion, setResultsVersion] = useState(0)
  const [sortBy, setSortBy] = useState<"time" | "score" | "name">("time")
  const [serverResults, setServerResults] = useState<ExamResult[] | null>(null)
  const [remote, setRemote] = useState(false)

  const signedIn = Boolean(session?.user)

  // Load the exam once signed in: Neon copy first, browser copy as fallback.
  useEffect(() => {
    if (!signedIn) return
    setExam(getExam())
    let cancelled = false
    void (async () => {
      const available = await apiBackendAvailable()
      if (!available || cancelled) return
      const fromServer = await apiGetExam()
      if (cancelled) return
      setRemote(true)
      if (fromServer) setExam(fromServer)
    })()
    return () => {
      cancelled = true
    }
  }, [signedIn])

  useEffect(() => {
    if (!signedIn) return
    let cancelled = false
    void apiListResults().then((list) => {
      if (!cancelled && list) setServerResults(list)
    })
    return () => {
      cancelled = true
    }
  }, [signedIn, resultsVersion])

  if (isPending) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white/80">Menyemak sesi…</p>
      </div>
    )
  }

  if (!signedIn) return <TeacherAuth />

  const results = serverResults ?? (remote ? [] : getExamResults())

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === "score") return b.score - a.score || a.playerName.localeCompare(b.playerName)
    if (sortBy === "name") return (a.playerName || "").localeCompare(b.playerName || "")
    return b.timestamp - a.timestamp
  })

  const sortHeader = (key: "time" | "score" | "name", label: string) => (
    <th scope="col" aria-sort={sortBy === key ? "descending" : "none"} className="py-1">
      <button
        type="button"
        onClick={() => setSortBy(key)}
        className="inline-flex items-center gap-1 underline-offset-2 hover:underline focus-visible:ring-4 focus-visible:ring-yellow-300/70 rounded"
      >
        {label}
        {sortBy === key ? <span aria-hidden="true">↓</span> : null}
      </button>
    </th>
  )

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

  const download = (content: string, filename: string, type: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }))
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
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
    download(csv, "keputusan-ujian.csv", "text/csv;charset=utf-8")
  }

  const exportJson = () => download(JSON.stringify(exam, null, 2), "ujian.json", "application/json")

  const importJson = (file: File) => {
    file
      .text()
      .then((text) => {
        const parsed = JSON.parse(text) as Exam
        const problem = validateExam(parsed)
        if (problem) {
          setSaved(`Import gagal: ${problem}`)
          return
        }
        setExam(parsed)
        setSaved(`Fail dimuatkan: ${parsed.tasks.length} tugasan. Tekan Simpan ujian untuk kekalkan.`)
      })
      .catch(() => setSaved("Import gagal: bukan fail JSON yang sah."))
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="container mx-auto max-w-4xl flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">🧑‍🏫 Panel Guru — Mod Ujian</h1>
            <p className="text-white/70 text-xs">
              {session?.user?.email} · {remote ? "Neon Postgres" : "salinan setempat"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-md border-2 border-white/60 px-3 h-11 text-white text-sm hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Kembali ke permainan
            </Link>
            <Button
              variant="outline"
              onClick={async () => {
                await signOut()
                window.location.reload()
              }}
            >
              <LogOut className="mr-1 w-4 h-4" aria-hidden="true" /> Keluar
            </Button>
          </div>
        </div>

        <Card className="bg-slate-800 border-2 border-slate-600 p-4 flex flex-col gap-3">
          <h2 className="font-bold">Tetapan ujian</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1 text-sm">
              <Label htmlFor="exam-title">Tajuk ujian</Label>
              <Input
                id="exam-title"
                value={exam.title}
                onChange={(e) => setExam({ ...exam, title: e.target.value })}
                className="border-2 border-slate-500 bg-slate-900 text-white"
              />
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <Label htmlFor="exam-pass">Markah lulus (bilangan tugasan)</Label>
              <Input
                id="exam-pass"
                type="number"
                min={0}
                max={exam.tasks.length}
                value={exam.passMark}
                onChange={(e) => setExam({ ...exam, passMark: Number(e.target.value) })}
                className="border-2 border-slate-500 bg-slate-900 text-white"
              />
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <Label htmlFor="exam-players">Pemain dibenarkan (pisah dengan koma; kosong = semua)</Label>
              <Input
                id="exam-players"
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
                className="border-2 border-slate-500 bg-slate-900 text-white"
              />
            </div>
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
                className="border-2 border-slate-500 bg-slate-900 rounded-md px-2 py-2 text-sm"
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
              >
                <Plus className="mr-1 w-4 h-4" aria-hidden="true" /> Tugasan kosong
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
                  className="border-red-400/60 text-red-300"
                  aria-label={`Buang tugasan ${i + 1}`}
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>
              <Input
                value={task.prompt}
                onChange={(e) => updateTask(i, { prompt: e.target.value })}
                placeholder="Arahan untuk pemain"
                aria-label={`Arahan tugasan ${i + 1}`}
                className="border-2 border-slate-500 bg-slate-900 text-white"
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`goal-x-${task.id}`}>Sasaran X</Label>
                  <Input
                    id={`goal-x-${task.id}`}
                    type="number"
                    value={task.goal.x}
                    onChange={(e) => updateTask(i, { goal: { ...task.goal, x: Number(e.target.value) } })}
                    className="border-2 border-slate-500 bg-slate-900 text-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`goal-y-${task.id}`}>Sasaran Y</Label>
                  <Input
                    id={`goal-y-${task.id}`}
                    type="number"
                    value={task.goal.y}
                    onChange={(e) => updateTask(i, { goal: { ...task.goal, y: Number(e.target.value) } })}
                    className="border-2 border-slate-500 bg-slate-900 text-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`max-lines-${task.id}`}>Had baris</Label>
                  <Input
                    id={`max-lines-${task.id}`}
                    type="number"
                    min={1}
                    value={task.maxLines}
                    onChange={(e) => updateTask(i, { maxLines: Number(e.target.value) })}
                    className="border-2 border-slate-500 bg-slate-900 text-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`obstacles-${task.id}`}>Halangan (x,y; x,y)</Label>
                  <Input
                    id={`obstacles-${task.id}`}
                    aria-label={`Halangan tugasan ${i + 1}`}
                    value={obstacleText[task.id] ?? formatObstacles(task.obstacles)}
                    onChange={(e) => setObstacleText({ ...obstacleText, [task.id]: e.target.value })}
                    onBlur={() => applyObstacles(i, task.id)}
                    className="border-2 border-slate-500 bg-slate-900 text-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </Card>

        <Card className="bg-slate-800 border-2 border-slate-600 p-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={async () => {
                saveExam(exam)
                const stored = await apiSaveExam(exam)
                setRemote(Boolean(stored))
                setSaved(stored ? "Ujian disimpan ke Neon Postgres." : "Ujian disimpan dalam browser sahaja.")
              }}
              variant="warning"
            >
              <Save className="mr-1 w-4 h-4" aria-hidden="true" /> Simpan ujian
            </Button>
            <Button onClick={exportJson} variant="outline">
              <Download className="mr-1 w-4 h-4" aria-hidden="true" /> Eksport JSON
            </Button>
            <label className="border-2 border-white/40 rounded-md px-3 h-11 inline-flex items-center text-sm cursor-pointer">
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
            >
              Set semula contoh
            </Button>
            {saved && (
              <span role="status" className="text-green-300 text-sm">
                {saved}
              </span>
            )}
          </div>
        </Card>

        <Card className="bg-slate-800 border-2 border-slate-600 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-bold">Keputusan ({results.length})</h2>
            <div className="flex flex-wrap gap-2">
              <Button onClick={exportCsv} disabled={!results.length} variant="outline">
                <Download className="mr-1 w-4 h-4" aria-hidden="true" /> Eksport CSV
              </Button>
              <Button
                onClick={async () => {
                  clearExamResults()
                  await apiClearResults()
                  setServerResults([])
                  setResultsVersion((v) => v + 1)
                }}
                disabled={!results.length}
                variant="danger"
              >
                <Trash2 className="mr-1 w-4 h-4" aria-hidden="true" /> Padam semua
              </Button>
            </div>
          </div>
          {results.length === 0 ? (
            <p className="text-white/70 text-sm">Belum ada keputusan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-white/80 text-left">
                  <tr>
                    {sortHeader("name", "Pemain")}
                    {sortHeader("score", "Markah")}
                    <th scope="col">Status</th>
                    {sortHeader("time", "Masa")}
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((r) => (
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
      </div>
    </div>
  )
}
