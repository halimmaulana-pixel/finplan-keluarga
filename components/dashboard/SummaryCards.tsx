import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface SummaryCardsProps {
  income: number
  expense: number
  remaining: number
  netWorth: number
  prevIncome?: number
  prevExpense?: number
  prevRemaining?: number
  prevNetWorth?: number
}

const formatRupiah = (value: number): string =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

function calcChange(current: number, prev?: number): number | null {
  if (prev == null || prev === 0) return null
  return ((current - prev) / Math.abs(prev)) * 100
}

interface CardItemProps {
  title: string
  value: number
  change: number | null
  positiveIsGood?: boolean
}

function SummaryCardItem({ title, value, change, positiveIsGood = true }: CardItemProps) {
  const isPositive = change !== null && change >= 0
  const isGood = positiveIsGood ? isPositive : !isPositive

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-gray-900 truncate">{formatRupiah(value)}</p>
        {change !== null && (
          <div
            className={`mt-1 flex items-center gap-1 text-xs font-medium ${
              isGood ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {change > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : change < 0 ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            <span>
              {change > 0 ? '+' : ''}
              {change.toFixed(1)}% vs bulan lalu
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function SummaryCards({
  income,
  expense,
  remaining,
  netWorth,
  prevIncome,
  prevExpense,
  prevRemaining,
  prevNetWorth,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <SummaryCardItem
        title="Total Pemasukan"
        value={income}
        change={calcChange(income, prevIncome)}
        positiveIsGood
      />
      <SummaryCardItem
        title="Total Pengeluaran"
        value={expense}
        change={calcChange(expense, prevExpense)}
        positiveIsGood={false}
      />
      <SummaryCardItem
        title="Sisa Bulan Ini"
        value={remaining}
        change={calcChange(remaining, prevRemaining)}
        positiveIsGood
      />
      <SummaryCardItem
        title="Net Worth"
        value={netWorth}
        change={calcChange(netWorth, prevNetWorth)}
        positiveIsGood
      />
    </div>
  )
}
