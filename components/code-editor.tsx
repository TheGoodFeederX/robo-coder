"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Play, Square, RotateCcw, Save, Flag } from "lucide-react"
import { useEffect, useRef } from "react"
import { useRobot } from "@/lib/contexts/robot-context"

interface CodeEditorProps {
  onSave: () => void
  onEndGame: () => void
}

export function CodeEditor({
  onSave,
  onEndGame,
}: CodeEditorProps) {
  const {
    commands: code,
    isExecuting,
    updateCommands: onCodeChange,
    runCommands: onRun,
    stopExecution: onStop,
    resetRobot: onReset,
    clearAll: onClear,
  } = useRobot()

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  const lineCount = code.split("\n").length

  // Synchronize scroll between line numbers and textarea
  useEffect(() => {
    const textarea = textareaRef.current
    const lineNumbers = lineNumbersRef.current

    if (textarea && lineNumbers) {
      const handleScroll = () => {
        lineNumbers.scrollTop = textarea.scrollTop
      }

      textarea.addEventListener("scroll", handleScroll)
      return () => textarea.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <Card className="bg-slate-800 border-4 border-white shadow-2xl overflow-hidden flex flex-col">
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-4">
        <h2 className="text-2xl font-bold text-white text-center">💻 Pusat Arahan</h2>
      </div>

      <div className="flex-1 flex flex-col p-6 gap-4">
        {/* Instructions */}
        <div className="bg-blue-500/20 border-2 border-blue-400 rounded-lg p-4">
          <h3 className="text-lg font-bold text-white mb-2">📚 Arahan Tersedia:</h3>
          <ul className="text-white/90 space-y-1 text-sm">
            <li>
              <code className="text-blue-300">step &lt;nombor&gt;</code> - Bergerak ke hadapan
            </li>
            <li>
              <code className="text-blue-300">turn left/right</code> - Pusing 90 darjah
            </li>
            <li>
              <code className="text-blue-300">rotate &lt;darjah&gt;</code> - Pusing sebarang sudut
            </li>
            <li>
              <code className="text-green-300">tp &lt;x,y&gt;</code> - Teleport ke kedudukan
            </li>
            <li>
              <code className="text-purple-300">loop &lt;kali&gt; {"{ }"}</code> - Ulang arahan
            </li>
            <li>
              <code className="text-orange-300">function &lt;id&gt; {"{ }"}</code> - Buat fungsi
            </li>
            <li>
              <code className="text-orange-300">start function &lt;id&gt;</code> - Jalankan fungsi
            </li>
          </ul>
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex-1 flex bg-slate-900 border-2 border-slate-600 rounded-md overflow-hidden">
            {/* Line Numbers */}
            <div
              ref={lineNumbersRef}
              className="flex flex-col bg-slate-800 text-slate-400 text-lg font-mono px-3 py-2 select-none overflow-hidden border-r border-slate-600"
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i + 1} className="leading-6 text-right min-w-[2ch]">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Textarea */}
            <Textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              placeholder="Tulis kod anda di sini..."
              aria-label="Editor kod"
              className="flex-1 font-mono text-lg bg-slate-900 text-white border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none rounded-none leading-6"
              disabled={isExecuting}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onRun}
            disabled={isExecuting || !code.trim()}
            className="bg-green-500 hover:bg-green-600 text-white text-lg font-bold h-14 shadow-lg"
            size="lg"
          >
            <Play className="mr-2 h-5 w-5" />
            Jalankan
          </Button>

          <Button
            onClick={onStop}
            disabled={!isExecuting}
            className="bg-red-500 hover:bg-red-600 text-white text-lg font-bold h-14 shadow-lg"
            size="lg"
          >
            <Square className="mr-2 h-5 w-5" />
            Berhenti
          </Button>

          <Button
            onClick={onReset}
            disabled={isExecuting}
            className="bg-blue-500 hover:bg-blue-600 text-white text-lg font-bold h-14 shadow-lg"
            size="lg"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Set semula
          </Button>

          <Button
            onClick={onSave}
            disabled={isExecuting || !code.trim()}
            className="bg-purple-500 hover:bg-purple-600 text-white text-lg font-bold h-14 shadow-lg"
            size="lg"
          >
            <Save className="mr-2 h-5 w-5" />
            Simpan
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onClear}
            disabled={isExecuting}
            variant="outline"
            className="border-2 border-white text-white hover:bg-white/10 bg-transparent"
          >
            Kosongkan Kod
          </Button>

          <Button
            onClick={onEndGame}
            disabled={isExecuting}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold shadow-lg"
          >
            <Flag className="mr-2 h-5 w-5" />
            Tamatkan Permainan
          </Button>
        </div>
      </div>
    </Card>
  )
}
