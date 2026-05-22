'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, AlertTriangle, Lightbulb, Flame } from 'lucide-react'

interface WeeklyBrainReportProps {
  achievements: string[]
  warnings: string[]
  recommendations: string[]
  streakDays: number
}

export default function WeeklyBrainReport({
  achievements,
  warnings,
  recommendations,
  streakDays,
}: WeeklyBrainReportProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-800">
            Laporan Mingguan
          </CardTitle>
          <div className="flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-2.5 py-1">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-bold text-orange-600">{streakDays} hari</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pencapaian */}
        {achievements.length > 0 && (
          <section>
            <div className="mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <h3 className="text-sm font-semibold text-green-700">Pencapaian</h3>
            </div>
            <ul className="space-y-1">
              {achievements.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {achievements.length > 0 && warnings.length > 0 && <Separator />}

        {/* Peringatan */}
        {warnings.length > 0 && (
          <section>
            <div className="mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <h3 className="text-sm font-semibold text-yellow-700">Perlu Diperhatikan</h3>
            </div>
            <ul className="space-y-1">
              {warnings.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-400" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {warnings.length > 0 && recommendations.length > 0 && <Separator />}

        {/* Rekomendasi */}
        {recommendations.length > 0 && (
          <section>
            <div className="mb-2 flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-blue-700">Rekomendasi</h3>
            </div>
            <ul className="space-y-1">
              {recommendations.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}
      </CardContent>
    </Card>
  )
}
