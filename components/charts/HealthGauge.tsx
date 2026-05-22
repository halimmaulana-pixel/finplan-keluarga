interface HealthGaugeProps {
  score: number
  label: string
}

interface ArcSegment {
  min: number
  max: number
  color: string
  label: string
}

const ARC_SEGMENTS: ArcSegment[] = [
  { min: 0, max: 30, color: '#ef4444', label: 'Kritis' },
  { min: 30, max: 50, color: '#f97316', label: 'Perlu Perhatian' },
  { min: 50, max: 70, color: '#eab308', label: 'Cukup' },
  { min: 70, max: 85, color: '#86efac', label: 'Baik' },
  { min: 85, max: 100, color: '#16a34a', label: 'Sangat Baik' },
]

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 180) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  }
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polarToCartesian(cx, cy, r, startDeg)
  const end = polarToCartesian(cx, cy, r, endDeg)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

export default function HealthGauge({ score, label }: HealthGaugeProps) {
  const clamped = Math.min(100, Math.max(0, score))

  const CX = 150
  const CY = 140
  const R = 100
  const STROKE = 20

  // Semicircle: 0deg (left) to 180deg (right), total 180deg
  const scoreToDeg = (s: number) => (s / 100) * 180
  const needleDeg = scoreToDeg(clamped)

  const needleEnd = polarToCartesian(CX, CY, R - 10, needleDeg)
  const needleBase1 = polarToCartesian(CX, CY, 8, needleDeg + 90)
  const needleBase2 = polarToCartesian(CX, CY, 8, needleDeg - 90)

  const activeSegment = ARC_SEGMENTS.find((s) => clamped >= s.min && clamped <= s.max)
  const activeColor = activeSegment?.color ?? '#6b7280'

  return (
    <div className="flex flex-col items-center">
      <svg width={300} height={180} viewBox="0 0 300 180">
        {/* Background track */}
        <path
          d={arcPath(CX, CY, R, 0, 180)}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={STROKE}
          strokeLinecap="butt"
        />

        {/* Colored arc segments */}
        {ARC_SEGMENTS.map((seg) => (
          <path
            key={seg.label}
            d={arcPath(CX, CY, R, scoreToDeg(seg.min), scoreToDeg(seg.max))}
            fill="none"
            stroke={seg.color}
            strokeWidth={STROKE}
            opacity={0.3}
            strokeLinecap="butt"
          />
        ))}

        {/* Active progress arc */}
        <path
          d={arcPath(CX, CY, R, 0, needleDeg)}
          fill="none"
          stroke={activeColor}
          strokeWidth={STROKE}
          strokeLinecap="butt"
          style={{ transition: 'all 0.8s ease' }}
        />

        {/* Needle */}
        <polygon
          points={`${needleEnd.x},${needleEnd.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
          fill={activeColor}
          style={{ transition: 'all 0.8s ease' }}
        />

        {/* Center hub */}
        <circle cx={CX} cy={CY} r={10} fill="#1f2937" />

        {/* Score text */}
        <text
          x={CX}
          y={CY + 30}
          textAnchor="middle"
          fontSize={28}
          fontWeight={700}
          fill={activeColor}
          style={{ transition: 'fill 0.5s ease' }}
        >
          {clamped}
        </text>
        <text x={CX} y={CY + 50} textAnchor="middle" fontSize={13} fill="#6b7280">
          {label}
        </text>
        {activeSegment && (
          <text x={CX} y={CY + 68} textAnchor="middle" fontSize={11} fill={activeColor} fontWeight={600}>
            {activeSegment.label}
          </text>
        )}
      </svg>
    </div>
  )
}
