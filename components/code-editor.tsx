"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Play, Square, RotateCcw, Save, Flag, Check, Plus } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useRobot } from "@/lib/contexts/robot-context"

interface CodeEditorProps {
  onSave: () => void
  onEndGame: () => void
}

const CHIPS = ["step ", "turn left", "turn right", "rotate ", "tp ", "loop 3 {", "}"] as const

export function CodeEditor({ onSave, onEndGame }: CodeEditorProps) {
  const {
    commands: code,
    isExecuting,
    currentLine,
    errorLines,
    updateCommands: onCodeChange,
    runCommands: onRun,
    stopExecution: onStop,
    resetRobot: onReset,
    clearAll: onClear,
  } = useRobot()

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const [justSaved, setJustSaved] = useState(false)
  const [showReference, setShowReference] = useState(true)

  const lineCount = code.split("\n").length

  // Keep line numbers in sync with the textarea scroll.
  useEffect(() => {
    const textarea = textareaRef.current
    const lineNumbers = lineNumbersRef.current
    if (!textarea || !lineNumbers) return

    const handleScroll = () => {
      lineNumbers.scrollTop = textarea.scrollTop
    }
    textarea.addEventListener("scroll", handleScroll)
    return () => textarea.removeEventListener("scroll", handleScroll)
  }, [])

  // Scroll the running line into view while the robot executes.
  useEffect(() => {
    if (currentLine < 0) return
    const gutter = lineNumbersRef.current
    const textarea = textareaRef.current
    if (!gutter || !textarea) return

    const lineHeight = 24 // leading-6
    const targetTop = currentLine * lineHeight - textarea.clientHeight / 2
    textarea.scrollTop = Math.max(0, targetTop)
    gutter.scrollTop = textarea.scrollTop
  }, [currentLine])

  const insertChip = (chip: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      onCodeChange(code + chip)
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const next = code.slice(0, start) + chip + code.slice(end)
    onCodeChange(next)
    requestAnimationFrame(() => {
      textarea.focus()
      const caret = start + chip.length
      textarea.setSelectionRange(caret, caret)
    })
  }

  const handleSave = () => {
    onSave()
    setJustSaved(true)
    window.setTimeout(() => setJustSaved(false), 2000)
  }

  return (
    <Card className="bg-slate-800 border-2 border-white/70 shadow-2xl overflow-hidden flex flex-col">
      <div className="bg-purple-700 p-3 sm:p-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white text-center">
          <span aria-hidden="true">💻 </span>Pusat Arahan
        </h2>
      </div>

      <div className="flex-1 flex flex-col p-3 sm:p-6 gap-3 sm:gap-4">
        {/* Collapsible command reference with tappable chips */}
        <div className="bg-sky-950/60 border-2 border-sky-600 rounded-lg p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-white">
              <span aria-hidden="true">📚 </span>Arahan Tersedia
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowReference((v) => !v)}
              aria-expanded={showReference}
              aria-controls="command-reference"
            >
              {showReference ? "Sembunyi" : "Tunjuk"}
            </Button>
          </div>

          {showReference && (
            <div id="command-reference" className="mt-2 flex flex-col gap-2">
              <ul className="text-white/90 space-y-1 text-sm">
                <li>
                  <code className="text-blue-300">step &lt;nombor&gt;</code> — bergerak ke hadapan
                </li>
                <li>
                  <code className="text-blue-300">turn left/right</code> — pusing 90 darjah
                </li>
                <li>
                  <code className="text-blue-300">rotate &lt;darjah&gt;</code> — pusing sebarang sudut
                </li>
                <li>
                  <code className="text-green-300">tp &lt;x,y&gt;</code> — teleport ke kedudukan
                </li>
                <li>
                  <code className="text-purple-300">loop &lt;kali&gt; {"{ }"}</code> — ulang arahan
                </li>
                <li>
                  <code className="text-amber-300">function &lt;id&gt; {"{ }"}</code> — buat fungsi
                </li>
                <li>
                  <code className="text-amber-300">start function &lt;id&gt;</code> — jalankan fungsi
                </li>
              </ul>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-white/70 text-xs self-center">Tekan untuk sisip:</span>
                {CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => insertChip(chip)}
                    disabled={isExecuting}
                    className="inline-flex items-center gap-1 rounded-full border border-sky-400/60 bg-sky-900/60 px-3 py-2 text-xs font-mono text-sky-100 hover:bg-sky-800 focus-visible:ring-4 focus-visible:ring-yellow-300/70 disabled:opacity-50"
                  >
                    <Plus className="w-3 h-3" aria-hidden="true" />
                    {chip.trim()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Code editor */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex-1 flex min-h-[180px] bg-slate-900 border-2 border-slate-600 rounded-md overflow-hidden focus-within:border-yellow-300 focus-within:ring-4 focus-within:ring-yellow-300/40">
            <div
              ref={lineNumbersRef}
              aria-hidden="true"
              className="flex flex-col bg-slate-800 text-slate-400 text-sm font-mono px-2 sm:px-3 py-2 select-none overflow-hidden border-r border-slate-600 tabular-nums"
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div
                  key={i + 1}
                  className={`leading-6 text-right min-w-[2ch] ${
                    i === currentLine
                      ? "bg-yellow-300 text-slate-900 font-bold rounded-sm"
                      : errorLines.includes(i)
                        ? "bg-red-300 text-slate-900 font-bold rounded-sm"
                        : ""
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            <Textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              placeholder="Tulis kod anda di sini..."
              aria-label="Editor kod"
              aria-describedby="command-reference"
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              wrap="off"
              className="flex-1 font-mono text-base sm:text-lg bg-slate-900 text-white border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none rounded-none leading-6 whitespace-pre overflow-auto"
              disabled={isExecuting}
            />
          </div>
        </div>

        {/* Primary actions: 44px+ tall, all ≥4.5:1 with white text */}
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={onRun} disabled={isExecuting || !code.trim()} variant="success" size="lg">
            <Play className="mr-2 h-5 w-5" aria-hidden="true" />
            Jalankan
          </Button>

          <Button onClick={onStop} disabled={!isExecuting} variant="danger" size="lg">
            <Square className="mr-2 h-5 w-5" aria-hidden="true" />
            Berhenti
          </Button>

          <Button onClick={onReset} disabled={isExecuting} variant="info" size="lg">
            <RotateCcw className="mr-2 h-5 w-5" aria-hidden="true" />
            Set semula
          </Button>

          <Button onClick={handleSave} disabled={isExecuting || !code.trim()} variant="warning" size="lg">
            {justSaved ? (
              <Check className="mr-2 h-5 w-5" aria-hidden="true" />
            ) : (
              <Save className="mr-2 h-5 w-5" aria-hidden="true" />
            )}
            {justSaved ? "Disimpan" : "Simpan"}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button onClick={onClear} disabled={isExecuting} variant="outline">
            Kosongkan Kod
          </Button>

          <Button onClick={onEndGame} disabled={isExecuting} variant="warning">
            <Flag className="mr-2 h-5 w-5" aria-hidden="true" />
            Tamatkan
          </Button>
        </div>

        {/* Always-present live region so save feedback is announced reliably */}
        <div role="status" aria-live="polite" className="sr-only">
          {justSaved ? "Kod disimpan." : ""}
        </div>
      </div>
    </Card>
  )
}
