export type Mode = "bebas" | "jelajah" | "ujian"

export const MODES: { id: Mode; title: string; description: string; emoji: string }[] = [
  {
    id: "bebas",
    title: "Mod Bebas",
    description: "Cuba apa sahaja arahan. Tiada sasaran, tiada had baris, tiada markah.",
    emoji: "🎮",
  },
  {
    id: "jelajah",
    title: "Mod Jelajah",
    description: "Selesaikan 12 tahap. Setiap tahap ada sasaran, halangan, had arahan dan bintang.",
    emoji: "🗺️",
  },
  {
    id: "ujian",
    title: "Mod Ujian",
    description: "Jawab tugasan yang disediakan guru. Markah dan keputusan disimpan.",
    emoji: "📝",
  },
]

export function modeTitle(mode: Mode): string {
  return MODES.find((m) => m.id === mode)?.title ?? mode
}
