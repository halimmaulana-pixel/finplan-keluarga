'use client'

import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
  ResponsiveContainer,
} from 'recharts'

interface WaterfallItem {
  name: string
  value: number
  type: 'income' | 'expense' | 'result'
}

interface WaterfallChartProps {
  items: WaterfallItem[]
}

const TYPE_COLORS: Record<WaterfallItem['type'], string> = {
  income: '#16a34a',
  expense: '#dc2626',
  result: '#2563eb',
}

const formatRupiah = (value: number): string =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Math.abs(value))

interface CustomLabelProps {
  x?: number
  y?: number
  width?: number
  value?: number
}

function CustomLabel({ x = 0, y = 0, width = 0, value = 0 }: CustomLabelProps) {
  const isPositive = value >= 0
  const dy = isPositive ? -6 : 14
  return (
    <text
      x={x + width / 2}
      y={y + dy}
      fill="#374151"
      textAnchor="middle"
      fontSize={11}
      fontWeight={600}
    >
      {isPositive ? '+' : '-'}
      {formatRupiah(value)}
    </text>
  )
}

export default function WaterfallChart({ items }: WaterfallChartProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={items} margin={{ top: 24, right: 24, bottom: 8, left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis
          tickFormatter={(v) => formatRupiah(v as number)}
          tick={{ fontSize: 11 }}
          width={80}
        />
        <Tooltip
          formatter={(value) => [formatRupiah(Number(value ?? 0)), 'Jumlah']}
          labelStyle={{ fontWeight: 600 }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {items.map((item, index) => (
            <Cell key={index} fill={TYPE_COLORS[item.type]} />
          ))}
          <LabelList content={<CustomLabel />} />
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  )
}
