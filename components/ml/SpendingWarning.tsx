'use client'

import { AlertTriangle, XOctagon } from 'lucide-react'

interface SpendingWarningProps {
  category: string
  currentAmount: number
  limit: number
  suggestion?: string
}

const formatRupiah = (value: number): string =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

export default function SpendingWarning({
  category,
  currentAmount,
  limit,
  suggestion,
}: SpendingWarningProps) {
  const pct = (currentAmount / limit) * 100

  if (pct < 80) return null

  const isOver = pct >= 100

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
        isOver
          ? 'border-red-300 bg-red-50 text-red-700'
          : 'border-yellow-300 bg-yellow-50 text-yellow-700'
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {isOver ? (
          <XOctagon className="h-5 w-5 text-red-500" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
        )}
      </div>
      <div className="space-y-1 text-sm">
        <p className="font-semibold">
          {isOver
            ? `Pengeluaran ${category} melebihi batas!`
            : `Pengeluaran ${category} mendekati batas`}
        </p>
        <p>
          {formatRupiah(currentAmount)} dari {formatRupiah(limit)} ({pct.toFixed(0)}%)
        </p>
        {suggestion && <p className="text-xs opacity-80">{suggestion}</p>}
      </div>
    </div>
  )
}
