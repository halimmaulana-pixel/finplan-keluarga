'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface NetWorthDataPoint {
  month: string
  netWorth: number
}

interface NetWorthAreaProps {
  data: NetWorthDataPoint[]
}

const formatRupiah = (value: number): string =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)

const MONTH_SHORT: Record<string, string> = {
  January: 'Jan', February: 'Feb', March: 'Mar', April: 'Apr',
  May: 'Mei', June: 'Jun', July: 'Jul', August: 'Agu',
  September: 'Sep', October: 'Okt', November: 'Nov', December: 'Des',
}

function shortMonth(month: string): string {
  return MONTH_SHORT[month] ?? month.slice(0, 3)
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow-md text-sm">
      <p className="font-semibold text-gray-700">{label}</p>
      <p className="text-blue-600">{formatRupiah(payload[0].value)}</p>
    </div>
  )
}

export default function NetWorthArea({ data }: NetWorthAreaProps) {
  const isGrowing =
    data.length >= 2 ? data[data.length - 1].netWorth >= data[0].netWorth : true

  const gradientId = isGrowing ? 'netWorthGradientUp' : 'netWorthGradientDown'
  const strokeColor = isGrowing ? '#2563eb' : '#dc2626'
  const gradientStart = isGrowing ? '#93c5fd' : '#fca5a5'
  const gradientEnd = isGrowing ? '#dbeafe' : '#fee2e2'

  const displayData = data.map((d) => ({ ...d, month: shortMonth(d.month) }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={displayData} margin={{ top: 16, right: 16, bottom: 8, left: 16 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={gradientStart} stopOpacity={0.8} />
            <stop offset="95%" stopColor={gradientEnd} stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(v) => formatRupiah(v as number)} tick={{ fontSize: 11 }} width={80} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="netWorth"
          stroke={strokeColor}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={{ fill: strokeColor, r: 3 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
