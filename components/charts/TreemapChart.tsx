'use client'

import { ResponsiveTreeMap } from '@nivo/treemap'

interface TreemapChild {
  name: string
  value: number
  color?: string
}

interface TreemapData {
  name: string
  children: TreemapChild[]
}

interface TreemapChartProps {
  data: TreemapData
}

const formatRupiah = (value: number): string =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

const CATEGORY_COLORS: Record<string, string> = {
  makanan: '#f97316',
  transport: '#8b5cf6',
  tagihan: '#dc2626',
  tabungan: '#2563eb',
  hiburan: '#ec4899',
  kesehatan: '#16a34a',
  pendidikan: '#0891b2',
  belanja: '#d97706',
}

function getCategoryColor(name: string): string {
  const lower = name.toLowerCase()
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (lower.includes(key)) return color
  }
  return '#6b7280'
}

export default function TreemapChart({ data }: TreemapChartProps) {
  if (typeof window === 'undefined') return null

  return (
    <div style={{ height: 400 }}>
      <ResponsiveTreeMap
        data={data}
        identity="name"
        value="value"
        valueFormat={(v) => formatRupiah(v as number)}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        labelSkipSize={32}
        label={(node) => `${node.id}\n${formatRupiah(node.value)}`}
        labelTextColor={{ from: 'color', modifiers: [['darker', 3]] }}
        colors={(node) => {
          const child = data.children.find((c) => c.name === node.id)
          return child?.color ?? getCategoryColor(node.id as string)
        }}
        borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
        nodeOpacity={0.9}
        parentLabelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
      />
    </div>
  )
}
