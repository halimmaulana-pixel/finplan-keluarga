interface ProgressRingProps {
  value: number
  size?: number
  label?: string
  sublabel?: string
  color?: string
}

export default function ProgressRing({
  value,
  size = 120,
  label,
  sublabel,
  color = '#2563eb',
}: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const strokeWidth = size * 0.08
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference
  const center = size / 2

  return (
    <div className="flex flex-col items-center gap-1" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        {/* Centered text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-bold text-gray-900" style={{ fontSize: size * 0.2 }}>
            {clamped}%
          </span>
          {label && (
            <span className="font-medium text-gray-600" style={{ fontSize: size * 0.1 }}>
              {label}
            </span>
          )}
        </div>
      </div>

      {sublabel && (
        <p className="text-xs text-gray-500 text-center leading-tight">{sublabel}</p>
      )}
    </div>
  )
}
