'use client'

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface DebtItem {
  name: string
  remaining: number
  monthlyPayment: number
  urgency: number
}

interface BubbleDebtProps {
  debts: DebtItem[]
}

const formatRupiah = (value: number): string =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)

const URGENCY_COLORS: Record<number, string> = {
  1: '#86efac',
  2: '#4ade80',
  3: '#facc15',
  4: '#fb923c',
  5: '#ef4444',
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: DebtItem }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const debt = payload[0].payload
  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow-md text-sm space-y-1">
      <p className="font-semibold text-gray-800">{debt.name}</p>
      <p className="text-gray-600">Sisa: {formatRupiah(debt.remaining)}</p>
      <p className="text-gray-600">Cicilan: {formatRupiah(debt.monthlyPayment)}/bln</p>
      <p className="text-gray-600">Urgensi: {debt.urgency}/5</p>
    </div>
  )
}

export default function BubbleDebt({ debts }: BubbleDebtProps) {
  const chartData = debts.map((d) => ({
    x: d.remaining,
    y: d.urgency,
    z: d.monthlyPayment,
    ...d,
  }))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart margin={{ top: 16, right: 24, bottom: 24, left: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis
          type="number"
          dataKey="x"
          name="Sisa Hutang"
          tickFormatter={(v) => formatRupiah(v as number)}
          tick={{ fontSize: 11 }}
          label={{ value: 'Sisa Hutang', position: 'insideBottom', offset: -10, fontSize: 12 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="Urgensi"
          domain={[0, 6]}
          ticks={[1, 2, 3, 4, 5]}
          tick={{ fontSize: 11 }}
          label={{ value: 'Urgensi', angle: -90, position: 'insideLeft', fontSize: 12 }}
        />
        <ZAxis type="number" dataKey="z" range={[40, 400]} name="Cicilan Bulanan" />
        <Tooltip content={<CustomTooltip />} />
        <Scatter data={chartData} opacity={0.85}>
          {chartData.map((entry, index) => (
            <Cell key={index} fill={URGENCY_COLORS[entry.urgency] ?? '#6b7280'} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  )
}
