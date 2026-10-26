# 🤖 Robo-Coder Playground

Aplikasi latihan pengaturcaraan untuk kanak-kanak dalam bentuk permainan. Tulis arahan ringkas, robot bergerak di atas grid, dan capai sasaran ⭐.

Dibina dengan **Next.js 16**, **React 19**, **Tailwind CSS 4** dan **TypeScript**.

🔗 **Live:** https://robo-coder.vercel.app · [![CI](https://github.com/TheGoodFeederX/robo-coder/actions/workflows/ci.yml/badge.svg)](https://github.com/TheGoodFeederX/robo-coder/actions/workflows/ci.yml)

## Tiga mod permainan

| Mod | Keterangan |
| --- | --- |
| 🎮 **Bebas** | Apa sahaja arahan, tiada sasaran, tiada had baris, tiada markah. Untuk penerokaan. |
| 🗺️ **Jelajah** | 12 tahap dengan sasaran, halangan, had arahan, petunjuk dan bintang. |
| 📝 **Ujian** | Tugasan yang ditetapkan guru (sasaran, halangan, had baris, markah lulus, senarai pemain). Keputusan disimpan & boleh dieksport CSV. |

Pilih mod selepas isi nama; butang **Tukar mod** ada di pengepala.

### Panel Guru (`/admin`)

- Dilindungi PIN mudah (asal `1234`, boleh ditukar). **Bukan kawalan keselamatan sebenar** — data disimpan dalam `localStorage` browser guru sahaja.
- Tambah/edit/buang tugasan: arahan, sasaran X/Y, had baris, halangan (`x,y; x,y`).
- Import tugasan dari mana-mana tahap Jelajah.
- Tetapan ujian: tajuk, markah lulus, senarai pemain dibenarkan.
- Eksport/import ujian (JSON), keputusan pemain (CSV), padam keputusan.

## Ciri-ciri

- **Editor kod kanak-kanak** — arahan baris demi baris dengan nombor baris dan highlight baris yang sedang dijalankan.
- **Petunjuk berharga** — petunjuk tersorok; membukanya hadkan bintang kepada ★★. Percubaan dikira setiap tahap.
- **Kesan bunyi** — Web Audio (tiada fail aset): langkah, pusingan, kemenangan, perlanggaran. Boleh dimatikan; pilihan disimpan.
- **Sambung semula** — nama pemain, tahap terakhir dan progress dipulihkan bila tab dibuka semula.
- **Responsif** — kanvas ikut lebar skrin, mesej status guna `aria-live` untuk pembaca skrin.
- **Kanvas robot** — grid 500×500, jejak pergerakan (trail), caching background + animasi idle-aware (rAF hanya berjalan semasa robot bergerak).
- **Sistem level** — 12 cabaran dengan sasaran, halangan 🧱, petunjuk, kod permulaan, dan had arahan (default *par + 2* baris).
- **Bintang bermakna** — kod melebihi had arahan tak akan jalan; ★★★ hanya bila ≤ *par*, ★★ ≤ 1.5× *par*.
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

## Aksesibiliti & UX (selepas audit)

- Kontras butang ≥ 4.5:1 (hijau/merah/biru/ungu 700); gradien latar digelapkan untuk teks putih.
- Fokus papan kekunci: cincin kuning 4px pada semua butang; bekas editor guna `focus-within`.
- Sasaran sentuh ≥ 44px; editor dengan chip arahan boleh ketuk dan Tab tidak melompat keluar.
- Mesej parser/executor dalam Bahasa Melayu; baris bermasalah ditanda merah dalam gutter.
- `prefers-reduced-motion` dihormati; kawasan `role="status"` sentiasa wujud (bukan bersyarat).
- Font Fredoka + Geist Mono dimuatkan melalui `next/font`.
- Kanvas HiDPI (`devicePixelRatio`), label paksi diskalakan, label sasaran pada kanvas, legenda ringkas.
- Butang Kembali pelayar berfungsi (history API), pautan terus `/?mod=jelajah&tahap=3`.
- Dialog pengesahan sebelum padam rekod; had kuota localStorage menyimpan rekod terbaharu.
- Sedikit tersasar sengaja: tiada sintaks penuh/penyerlahan baris dalam editor (hanya gutter),
  tiada komponen `Select` baharu untuk satu medan, token `.dark` sedia ada belum dipakai.

## Backend (Neon Postgres)

Ujian dan keputusan disimpan dalam Postgres (Neon, projek `robo-coder`, region `ap-southeast-1`). App terus berfungsi tanpa backend — setiap panggilan API gagal dengan tenang dan app kembali kepada salinan `localStorage`.

| Laluan | Kaedah | Auth | Fungsi |
| --- | --- | --- | --- |
| `/api/exam` | GET | — | Baca ujian aktif |
| `/api/exam` | PUT | `x-admin-pin` | Simpan ujian (divalidasi `validateExam`) |
| `/api/results` | POST | — | Simpan keputusan pemain (markah dikira semula di pelayan) |
| `/api/results` | GET | `x-admin-pin` | Senarai keputusan |
| `/api/results` | DELETE | `x-admin-pin` | Padam semua keputusan |

Persekitaran yang diperlukan:

```bash
DATABASE_URL=postgresql://...   # Neon pooled connection string
ADMIN_PIN=1234                  # PIN guru, disemak di pelayan
```

Kedua-duanya perlu ada dalam `.env.local` (pembangunan) dan tetapan Environment Variables Vercel (production/preview/development). `.env.local` diabaikan oleh git.

Migrasi skema:

```bash
pnpm db:migrate   # jalankan db/schema.sql
```

Jadual: `exams` (satu baris `id='default'`, tugasan dalam `jsonb`) dan `exam_results` (satu baris per penyerahan, indeks pada `created_at`).

Nota keselamatan: PIN dihantar sebagai header dan disemak di pelayan, tetapi ia PIN kongsi mudah — bukan pengesahan pengguna sebenar.

## Pembangunan

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # vitest (jsdom)
pnpm typecheck  # tsc --noEmit
pnpm build      # production build
pnpm start      # serve build standalone (salin static + public automatik)
```

> Guna **pnpm 12** (`packageManager` dalam `package.json`). Sharp build scripts dinyahlaku melalui `pnpm-workspace.yaml`.

## Struktur

```
app/            Halaman utama (state game: name-input → playing → summary)
components/      RobotCanvas, CodeEditor, LevelPanel, SummaryPage, UI (shadcn)
lib/parser.ts   Parser arahan → Command[]
lib/executor.ts Enjin gerakan beranimasi
lib/levels.ts   Definisi level, halangan, semakan sasaran, penarafan bintang
lib/db.ts       Klien Neon + pemetaan baris <-> domain
lib/exam-repo.ts  Pertanyaan SQL untuk ujian dan keputusan
lib/api-auth.ts   Semakan PIN guru di pelayan
lib/api-client.ts Panggilan API dengan fallback setempat
lib/modes.ts    Definisi tiga mod
lib/exam.ts     Model ujian, tugasan, pemarkahan, parser halangan
lib/sfx.ts      Kesan bunyi Web Audio (tanpa aset)
lib/storage.ts  Simpanan localStorage (executions, progress, pemain, tahap, bunyi)
lib/contexts/   RobotContext — state robot, level, dan lifecycle execution
docs/           Spec reka bentuk
```

## Deployment

### Vercel

Repo ini sudah disambung ke projek Vercel `robo-coder` (team `thegoodfeederxs-projects`). Setiap push ke `main` membina dan deploy secara automatik.

- Production: https://robo-coder.vercel.app
- Manual: `vercel deploy --prod`

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