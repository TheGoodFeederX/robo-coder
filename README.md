# 🤖 Robo-Coder Playground

Aplikasi latihan pengaturcaraan untuk kanak-kanak dalam bentuk permainan. Tulis arahan ringkas, robot bergerak di atas grid, dan capai sasaran ⭐.

Dibina dengan **Next.js 16**, **React 19**, **Tailwind CSS 4** dan **TypeScript**.

## Ciri-ciri

- **Editor kod kanak-kanak** — arahan baris demi baris dengan nombor baris dan highlight baris yang sedang dijalankan.
- **Kanvas robot** — grid 500×500, jejak pergerakan (trail), caching background + animasi idle-aware (rAF hanya berjalan semasa robot bergerak).
- **Sistem level** — 5 cabaran dengan sasaran, petunjuk, dan penarafan bintang (★★★ jika bilangan baris ≤ *par*).
- **Simpan & ringkasan** — simpan setiap execution (dengan screenshot) ke `localStorage`, kemudian cetak ringkasan.
- **Progress disimpan** — bintang terbaik setiap level kekal dalam browser.

## Arahan yang disokong

| Arahan | Keterangan |
| --- | --- |
| `step <n>` | Bergerak ke hadapan `n` langkah (1 langkah = 1 unit grid = 10px) |
| `turn left` / `turn right` | Pusing 90° |
| `rotate <deg>` | Pusing mengikut darjah |
| `tp <x>,<y>` | Teleport ke koordinat grid |
| `loop <n> { ... }` | Ulang blok `n` kali |
| `function <id> { ... }` | Takrif fungsi |
| `start function <id>` | Panggil fungsi |

Komen guna `//`.

Contoh:

```text
turn right
loop 3 {
  step 2
  turn left
}
tp 0,5
```

## Pembangunan

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # vitest (jsdom)
pnpm typecheck  # tsc --noEmit
pnpm build      # production build
```

> Guna **pnpm 12** (`packageManager` dalam `package.json`). Sharp build scripts dinyahlaku melalui `pnpm-workspace.yaml`.

## Struktur

```
app/            Halaman utama (state game: name-input → playing → summary)
components/      RobotCanvas, CodeEditor, LevelPanel, SummaryPage, UI (shadcn)
lib/parser.ts   Parser arahan → Command[]
lib/executor.ts Enjin gerakan beranimasi
lib/levels.ts   Definisi level, semakan sasaran, penarafan bintang
lib/storage.ts  Simpanan localStorage (executions + progress)
lib/contexts/   RobotContext — state robot, level, dan lifecycle execution
docs/           Spec reka bentuk
```

## Deployment

### Vercel

Import repo di Vercel dan deploy — tiada konfigurasi tambahan diperlukan.

### Docker

```bash
docker build -t robo-coder .
docker run -p 3000:3000 robo-coder
```

atau `docker compose up --build`.

### CI

`.github/workflows/ci.yml` menjalankan `pnpm typecheck`, `pnpm test` dan `pnpm build` pada setiap push ke `main` dan pull request.

---

Made with ❤️ untuk belajar coding dengan seronok.