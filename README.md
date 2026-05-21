# FinPlan Keluarga

Aplikasi web personal financial planner untuk keluarga Indonesia — Zero-Based Budgeting + ML insights, tanpa external AI API.

## Fitur Utama

- **Dompet Masuk** — staging area uang sebelum dialokasikan, rekomendasi otomatis ke rekening yang tepat
- **Zero-Based Budgeting** — setiap rupiah punya tujuan, saldo dompet selalu Rp 0
- **Multi-Account Roles** — BCA, Jenius, GoPay, OVO, Superbank masing-masing punya peran spesifik
- **ML Engine (server-side)** — anomaly detection, clustering pola konsumtif, prediksi akhir bulan, health score
- **Dashboard Visualisasi** — Sankey, Treemap, Calendar Heatmap, Waterfall, Progress Rings, dan lainnya
- **Debt Countdown** — hitung mundur pelunasan + proyeksi post-debt
- **Akses PIN** — tidak ada login, cukup PIN 4-6 digit

## Tech Stack

- **Frontend**: Next.js 15 App Router + TypeScript + Tailwind + shadcn/ui
- **Charts**: Nivo + Recharts
- **Backend**: Next.js API Routes + Prisma ORM
- **Database**: Railway PostgreSQL
- **ML**: simple-statistics + ml-kmeans (zero external AI API)
- **Deploy**: Vercel + Railway

## Setup

```bash
pnpm install
cp .env.example .env.local
# Isi DATABASE_URL dengan Railway PostgreSQL URL
pnpm prisma migrate dev
pnpm dev
```
