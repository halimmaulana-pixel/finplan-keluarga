import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RunwayCardProps {
  months: number
}

interface RunwayConfig {
  label: string
  sublabel: string
  bgClass: string
  textClass: string
  borderClass: string
}

function getRunwayConfig(months: number): RunwayConfig {
  if (months < 1) {
    return {
      label: 'Kritis!',
      sublabel: 'Dana darurat hampir habis. Segera tindakan!',
      bgClass: 'bg-red-50',
      textClass: 'text-red-600',
      borderClass: 'border-red-200',
    }
  }
  if (months <= 3) {
    return {
      label: 'Perlu Perhatian',
      sublabel: 'Dana darurat kurang dari 3 bulan. Perbanyak tabungan.',
      bgClass: 'bg-orange-50',
      textClass: 'text-orange-500',
      borderClass: 'border-orange-200',
    }
  }
  if (months <= 6) {
    return {
      label: 'Cukup',
      sublabel: 'Dana darurat memadai. Terus tingkatkan.',
      bgClass: 'bg-yellow-50',
      textClass: 'text-yellow-600',
      borderClass: 'border-yellow-200',
    }
  }
  return {
    label: 'Aman',
    sublabel: 'Dana darurat sangat baik. Pertahankan!',
    bgClass: 'bg-green-50',
    textClass: 'text-green-600',
    borderClass: 'border-green-200',
  }
}

export default function RunwayCard({ months }: RunwayCardProps) {
  const config = getRunwayConfig(months)
  const displayMonths = months < 1 ? '<1' : months.toFixed(1)

  return (
    <Card className={`border-2 ${config.borderClass} ${config.bgClass}`}>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-gray-500">Dana Darurat (Runway)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className={`text-5xl font-black tabular-nums ${config.textClass}`}>
            {displayMonths}
          </span>
          <span className="text-lg font-semibold text-gray-500">bulan</span>
        </div>
        <div>
          <span
            className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold ${config.textClass} bg-white border ${config.borderClass}`}
          >
            {config.label}
          </span>
        </div>
        <p className="text-xs text-gray-500">{config.sublabel}</p>
      </CardContent>
    </Card>
  )
}
