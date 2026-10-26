"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/** Minimal accessible confirmation dialog (no extra dependency). */
export function ConfirmDialog({ open, title, description, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const onClose = () => open && onCancel()
    dialog.addEventListener("close", onClose)
    return () => dialog.removeEventListener("close", onClose)
  }, [open, onCancel])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-description"
      className="rounded-xl border-0 p-0 backdrop:bg-black/50 max-w-sm w-[92vw]"
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
    >
      <div className="p-5 flex flex-col gap-3 bg-white text-slate-800">
        <h2 id="confirm-title" className="text-lg font-bold">
          {title}
        </h2>
        <p id="confirm-description" className="text-sm text-slate-600">
          {description}
        </p>
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="light" onClick={onCancel} autoFocus>
            Batal
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
