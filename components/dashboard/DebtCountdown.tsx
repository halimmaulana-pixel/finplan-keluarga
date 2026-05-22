import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface DebtCountdownProps {
  debtName: string
  remainingMonths: number
  monthlyPayment: number
  originalMonths?: number
}

const formatRupiah = (value: number): string =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

export default function DebtCountdown({
  debtName,
  remainingMonths,
  monthlyPayment,
  originalMonths,
}: DebtCountdownProps) {
  const progress = originalMonths
    ? Math.max(0, Math.min(100, ((originalMonths - remainingMonths) / originalMonths) * 100))
    : 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-800">{debtName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <span className="text-5xl font-black text-gray-900 tabular-nums">
            {remainingMonths}
          </span>
          <span className="ml-2 text-xl font-semibold text-gray-500">bulan lagi</span>
        </div>

        {originalMonths && (
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <p className="text-right text-xs text-gray-400">
              {progress.toFixed(0)}% selesai
            </p>
          </div>
        )}

        <div className="rounded-lg bg-blue-50 px-4 py-3">
          <p className="text-xs text-blue-600 font-medium">Proyeksi setelah lunas</p>
          <p className="mt-0.5 text-sm font-bold text-blue-800">
            {formatRupiah(monthlyPayment)}/bulan bebas
          </p>
        </div>

        <p className="text-center text-xs text-gray-400">
          Cicilan bulanan: {formatRupiah(monthlyPayment)}
        </p>
      </CardContent>
    </Card>
  )
}
