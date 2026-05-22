'use client'

import { ResponsiveSankey } from '@nivo/sankey'

if (typeof window === 'undefined') {
  // SSR guard handled via conditional render below
}

interface SankeyNode {
  id: string
}

interface SankeyLink {
  source: string
  target: string
  value: number
}

interface SankeyData {
  nodes: SankeyNode[]
  links: SankeyLink[]
}

interface SankeyChartProps {
  data: SankeyData
}

const NODE_COLORS: Record<string, string> = {
  income: '#16a34a',
  tagihan: '#dc2626',
  hutang: '#ea580c',
  tabungan: '#2563eb',
  sisa: '#6b7280',
}

function getNodeColor(nodeId: string): string {
  const lower = nodeId.toLowerCase()
  for (const [key, color] of Object.entries(NODE_COLORS)) {
    if (lower.includes(key)) return color
  }
  return '#6b7280'
}

export default function SankeyChart({ data }: SankeyChartProps) {
  if (typeof window === 'undefined') return null

  return (
    <div style={{ height: 400 }}>
      <ResponsiveSankey
        data={data}
        margin={{ top: 20, right: 160, bottom: 20, left: 50 }}
        align="justify"
        colors={(node) => getNodeColor(node.id as string)}
        nodeOpacity={1}
        nodeHoverOthersOpacity={0.35}
        nodeThickness={18}
        nodeSpacing={24}
        nodeBorderWidth={0}
        nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
        linkOpacity={0.5}
        linkHoverOthersOpacity={0.1}
        linkContract={3}
        enableLinkGradient
        labelPosition="outside"
        labelOrientation="vertical"
        labelPadding={16}
        labelTextColor={{ from: 'color', modifiers: [['darker', 1]] }}
        legends={[
          {
            anchor: 'bottom-right',
            direction: 'column',
            translateX: 130,
            itemWidth: 100,
            itemHeight: 14,
            itemDirection: 'right-to-left',
            itemsSpacing: 2,
            symbolSize: 14,
            effects: [
              {
                on: 'hover',
                style: {
                  itemTextColor: '#000',
                },
              },
            ],
          },
        ]}
      />
    </div>
  )
}
