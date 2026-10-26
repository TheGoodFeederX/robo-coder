import type { Metadata } from "next"
import type React from "react"

import { Fredoka, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"

import "./globals.css"

const fredoka = Fredoka({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-fredoka", display: "swap" })
const geistMono = Geist_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-geist-mono", display: "swap" })

export const metadata: Metadata = {
  title: "Robo-Coder Playground",
  description: "Permainan pengaturcaraan untuk kanak-kanak belajar asas coding",
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ms" className={`${fredoka.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
