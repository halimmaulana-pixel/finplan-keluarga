import { formatCompact } from "@/lib/currency"
import type { AnomalyResult } from "./anomaly"

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: "Makanan",
  TRANSPORT_CAR: "Transport (mobil)",
  TRANSPORT_MOTOR: "Transport (motor)",
  GROCERY: "Belanja bulanan",
  HEALTH: "Kesehatan",
  EDUCATION: "Pendidikan",
  ENTERTAINMENT: "Hiburan",
  SOCIAL: "Sosial",
  OTHER: "Lainnya",
}

export function anomalyInsight(r: AnomalyResult): { title: string; body: string } {
  const cat = CATEGORY_LABELS[r.category] ?? r.category
  const pct = Math.round((r.currentAmount / r.historicalMean - 1) * 100)
  const excess = formatCompact(r.excessAmount)

  return {
    title: `${cat} naik ${pct}% dari biasanya`,
    body: `Pengeluaran ${cat.toLowerCase()} bulan ini Rp ${formatCompact(r.currentAmount)}, ` +
      `lebih tinggi ${pct}% dari rata-rata Rp ${formatCompact(r.historicalMean)}. ` +
      `Jika dikurangi ke normal, kamu bisa hemat Rp ${excess} bulan ini.`,
  }
}

export function debtCountdownInsight(remainingMonths: number, monthlyAmount: number): string {
  if (remainingMonths <= 1) return `Satu pembayaran lagi dan hutang ini lunas! Rp ${formatCompact(monthlyAmount)} akan bebas.`
  if (remainingMonths <= 3) return `Hampir selesai — ${remainingMonths} bulan lagi, hutang lunas dan Rp ${formatCompact(monthlyAmount)}/bulan bebas.`
  return `${remainingMonths} pembayaran lagi. Setelah lunas, Rp ${formatCompact(monthlyAmount)}/bulan bisa dialokasikan ke tabungan.`
}

export function runwayInsight(months: number): string {
  if (months < 1) return "Jika pemasukan berhenti hari ini, dana tidak cukup 1 bulan. Prioritaskan dana darurat sekarang."
  if (months < 3) return `Kamu bisa bertahan ${months.toFixed(1)} bulan jika pemasukan berhenti. Target minimal 3 bulan.`
  if (months < 6) return `Dana darurat cukup untuk ${months.toFixed(1)} bulan. Bagus — targetkan 6 bulan.`
  return `Dana darurat sangat kuat — cukup untuk ${months.toFixed(1)} bulan. Keuangan terlindungi.`
}

export function savingsProjectionInsight(goalName: string, monthsLeft: number): string {
  if (monthsLeft <= 0) return `${goalName} sudah tercapai!`
  const targetDate = new Date()
  targetDate.setMonth(targetDate.getMonth() + monthsLeft)
  const label = targetDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
  return `Dengan kontribusi saat ini, ${goalName} akan tercapai sekitar ${label}.`
}

export function postIncomeAlert(daysSinceIncome: number, spentRatio: number): string {
  if (daysSinceIncome <= 3 && spentRatio > 0.3) {
    return `Kamu sudah menghabiskan ${Math.round(spentRatio * 100)}% uang dalam ${daysSinceIncome} hari pertama. Segera distribusikan sisa ke rekening tujuan.`
  }
  return ""
}
