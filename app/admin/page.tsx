import type { Metadata } from "next"
import { AdminPanel } from "@/components/admin-panel"

export const metadata: Metadata = {
  title: "Panel Guru — Robo-Coder",
  description: "Urus ujian, pemain dan syarat untuk Mod Ujian",
}

export default function AdminPage() {
  return <AdminPanel />
}
