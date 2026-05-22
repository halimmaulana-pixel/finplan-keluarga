'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

type Severity = 'INFO' | 'WARNING' | 'CRITICAL'

interface InsightCardProps {
  title: string
  body: string
  severity: Severity
  category?: string
  isRead: boolean
  onRead: () => void
}

const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; badgeClass: string; borderClass: string }
> = {
  INFO: {
    label: 'Info',
    badgeClass: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
    borderClass: 'border-blue-200',
  },
  WARNING: {
    label: 'Perhatian',
    badgeClass: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
    borderClass: 'border-yellow-200',
  },
  CRITICAL: {
    label: 'Kritis',
    badgeClass: 'bg-red-100 text-red-700 hover:bg-red-100',
    borderClass: 'border-red-200',
  },
}

export default function InsightCard({
  title,
  body,
  severity,
  category,
  isRead,
  onRead,
}: InsightCardProps) {
  const config = SEVERITY_CONFIG[severity]

  return (
    <Card
      className={`border ${config.borderClass} transition-opacity duration-300 ${
        isRead ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`text-xs font-semibold ${config.badgeClass}`}>
              {config.label}
            </Badge>
            {category && (
              <Badge variant="outline" className="text-xs text-gray-500">
                {category}
              </Badge>
            )}
          </div>
          {!isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRead}
              className="h-7 shrink-0 gap-1 px-2 text-xs text-gray-400 hover:text-green-600"
              aria-label="Tandai sudah dibaca"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Tandai dibaca
            </Button>
          )}
        </div>
        <CardTitle className="mt-1 text-sm font-semibold text-gray-800">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
      </CardContent>
    </Card>
  )
}
