'use client'

import { ResponsiveCalendar } from '@nivo/calendar'

interface CalendarDay {
  day: string
  value: number
}

interface CalendarHeatmapProps {
  data: CalendarDay[]
  from: string
  to: string
}

const formatRupiah = (value: number): string =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

export default function CalendarHeatmap({ data, from, to }: CalendarHeatmapProps) {
  if (typeof window === 'undefined') return null

  return (
    <div style={{ height: 200 }}>
      <ResponsiveCalendar
        data={data}
        from={from}
        to={to}
        emptyColor="#f9fafb"
        colors={['#dcfce7', '#86efac', '#4ade80', '#16a34a', '#fca5a5', '#ef4444', '#b91c1c']}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        yearSpacing={40}
        monthBorderColor="#ffffff"
        dayBorderWidth={2}
        dayBorderColor="#ffffff"
        tooltip={({ day, value }) => (
          <div
            style={{
              padding: '6px 12px',
              background: '#1f2937',
              color: '#f9fafb',
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            <strong>{day}</strong>
            <br />
            {formatRupiah(value as unknown as number)}
          </div>
        )}
        legends={[
          {
            anchor: 'bottom-right',
            direction: 'row',
            translateY: 36,
            itemCount: 4,
            itemWidth: 42,
            itemHeight: 36,
            itemsSpacing: 14,
            itemDirection: 'right-to-left',
          },
        ]}
      />
    </div>
  )
}
