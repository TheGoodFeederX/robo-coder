"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { SavedExecution } from "@/lib/types"
import { Home, Printer, Heart } from "lucide-react"

interface SummaryPageProps {
  playerName: string
  savedExecutions: SavedExecution[]
  onBackToStart: () => void
}

export function SummaryPage({ playerName, savedExecutions, onBackToStart }: SummaryPageProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex flex-col">
      <div className="container mx-auto p-4 flex-1">
        <div className="text-center py-6 mb-4 no-print">
          <h1 className="text-5xl font-bold text-white drop-shadow-lg">🏆 Game Summary</h1>
          <p className="text-2xl text-white/90 mt-2">Great work, {playerName}!</p>
          <p className="text-lg text-white/80 mt-1">
            You saved {savedExecutions.length} execution{savedExecutions.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="print-only text-center mb-4">
          <h1 className="text-3xl font-bold">Game Summary</h1>
          <p className="text-xl mt-2">Player: {playerName}</p>
          <p className="text-base text-slate-600 mt-1">Total Executions: {savedExecutions.length}</p>
          <hr className="my-4 border-slate-300" />
        </div>

        {savedExecutions.length === 0 ? (
          <Card className="bg-white p-8 max-w-2xl mx-auto text-center">
            <p className="text-xl text-slate-600 mb-6">No executions saved yet!</p>
            <Button
              onClick={onBackToStart}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg font-bold"
            >
              <Home className="mr-2 h-5 w-5" />
              Start New Game
            </Button>
          </Card>
        ) : (
          <div className="space-y-4 max-w-6xl mx-auto">
            {savedExecutions.map((execution, index) => (
              <Card key={execution.id} className="bg-white p-6 shadow-xl print-card">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-purple-600 mb-2">Execution #{index + 1}</h3>
                      {execution.stars ? (
                        <p className="text-yellow-500 text-xl" title={`${execution.stars} stars`}>
                          {"★".repeat(execution.stars)}
                        </p>
                      ) : null}
                      <p className="text-sm text-slate-500">{new Date(execution.timestamp).toLocaleString()}</p>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-slate-700 mb-2">Commands Used:</h4>
                      <pre className="bg-slate-100 p-4 rounded-lg text-sm font-mono overflow-x-auto max-h-64 overflow-y-auto border-2 border-slate-300">
                        {execution.commands}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-slate-700 mb-2">Robot Trail:</h4>
                    <img
                      src={execution.screenshot || "/placeholder.svg"}
                      alt={`Execution ${index + 1} screenshot`}
                      className="w-full border-4 border-slate-300 rounded-lg shadow-lg"
                    />
                  </div>
                </div>
              </Card>
            ))}

            <div className="text-center pt-4 no-print flex flex-wrap gap-4 justify-center pb-4">
              <Button
                onClick={handlePrint}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-xl font-bold h-14 px-8 shadow-lg"
              >
                <Printer className="mr-2 h-6 w-6" />
                Print
              </Button>
              <Button
                onClick={onBackToStart}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xl font-bold h-14 px-8 shadow-lg"
              >
                <Home className="mr-2 h-6 w-6" />
                Start New Game
              </Button>
            </div>
          </div>
        )}
      </div>

      <footer className="py-4 text-center text-white/90 text-sm backdrop-blur-sm bg-black/10 no-print">
        <p className="flex items-center justify-center gap-2">
          Made with <Heart className="w-4 h-4 fill-red-500 text-red-500" /> by Ustaz Najmi | 2025
        </p>
      </footer>

      <style jsx>{`
        @media print {
          /* Hide non-printable elements */
          .no-print {
            display: none !important;
          }
          
          /* Show print-only elements */
          .print-only {
            display: block !important;
          }
          
          /* Remove background gradients */
          body {
            background: white !important;
          }
          
          /* Optimize card layout for print */
          .print-card {
            page-break-inside: avoid;
            margin-bottom: 1.5rem;
            box-shadow: none !important;
            border: 1px solid #e2e8f0;
          }
          
          /* Fit approximately 5 records per page */
          @page {
            size: A4;
            margin: 1cm;
          }
          
          /* Adjust font sizes for print */
          h1 {
            font-size: 24pt;
          }
          
          h3 {
            font-size: 16pt;
          }
          
          h4 {
            font-size: 12pt;
          }
          
          p, pre {
            font-size: 10pt;
          }
          
          /* Ensure images fit properly */
          img {
            max-width: 100%;
            height: auto;
          }
        }
        
        /* Hide print-only content on screen */
        .print-only {
          display: none;
        }
      `}</style>
    </div>
  )
}
