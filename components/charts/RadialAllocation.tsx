'use client'

import { ResponsiveRadar } from '@nivo/radar'

interface RadialAllocationProps {
  actual: {
    needs: number
    wants: number
    savings: number
  }
}

const IDEAL = { needs: 50, wants: 30, savings: 20 }

const KEYS = ['Aktual', 'Ideal'] as const

export default function RadialAllocation({ actual }: RadialAllocationProps) {
  if (typeof window === 'undefined') return null

  const chartData: Record<string, unknown>[] = [
    { category: 'Kebutuhan', Aktual: actual.needs, Ideal: IDEAL.needs },
    { category: 'Keinginan', Aktual: actual.wants, Ideal: IDEAL.wants },
    { category: 'Tabungan', Aktual: actual.savings, Ideal: IDEAL.savings },
  ]

  return (
    <div style={{ height: 320 }}>
      <ResponsiveRadar
        data={chartData}
        keys={[...KEYS]}
        indexBy="category"
        maxValue={100}
        margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
        curve="linearClosed"
        borderWidth={2}
        borderColor={{ from: 'color' }}
        gridLevels={5}
        gridShape="circular"
        gridLabelOffset={16}
        enableDots
        dotSize={8}
        dotColor={{ theme: 'background' }}
        dotBorderWidth={2}
        dotBorderColor={{ from: 'color' }}
        enableDotLabel
        dotLabel="value"
        dotLabelYOffset={-12}
        colors={['#2563eb', '#9ca3af']}
        fillOpacity={0.25}
        blendMode="multiply"
        animate
        legends={[
          {
            anchor: 'top-left',
            direction: 'column',
            translateX: -60,
            translateY: -40,
            itemWidth: 80,
            itemHeight: 20,
            itemTextColor: '#374151',
            symbolSize: 12,
            symbolShape: 'circle',
            effects: [{ on: 'hover', style: { itemTextColor: '#111827' } }],
          },
        ]}
      />
    </div>
  )
}
