'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle } from 'lucide-react'

interface Suggestion {
  accountName: string
  purpose: string
  amount: number
  priority: number
  isUrgent: boolean
}

interface AllocationSuggestionProps {
  walletAmount: number
  suggestions: Suggestion[]
  onConfirm: (allocations: Suggestion[]) => void
  onCustomize: () => void
}

const formatRupiah = (value: number): string =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

export default function AllocationSuggestion({
  walletAmount,
  suggestions,
  onConfirm,
  onCustomize,
}: AllocationSuggestionProps) {
  const [loading, setLoading] = useState(false)

  const total = suggestions.reduce((sum, s) => sum + s.amount, 0)
  const diff = walletAmount - total
  const sorted = [...suggestions].sort((a, b) => a.priority - b.priority)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm(sorted)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-800">
          Saran Alokasi Dana
        </CardTitle>
        <p className="text-sm text-gray-500">
          Dana masuk: <span className="font-semibold text-gray-700">{formatRupiah(walletAmount)}</span>
        </p>
      </CardHeader>

      <CardContent className="space-y-2">
        {sorted.map((s, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
              s.isUrgent ? 'border-orange-200 bg-orange-50' : 'border-gray-100 bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              {s.isUrgent && <AlertTriangle className="h-4 w-4 shrink-0 text-orange-500" />}
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-gray-800">{s.accountName}</p>
                  <Badge
                    variant="outline"
                    className="h-4 px-1 py-0 text-[10px] text-gray-400"
                  >
                    #{s.priority}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">{s.purpose}</p>
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">
              {formatRupiah(s.amount)}
            </p>
          </div>
        ))}

        <Separator className="my-3" />

        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Total dialokasikan</span>
          <span className="font-semibold text-gray-800">{formatRupiah(total)}</span>
        </div>
        {diff !== 0 && (
          <div className="flex justify-between text-sm">
            <span className={diff < 0 ? 'text-red-500' : 'text-green-600'}>
              {diff < 0 ? 'Melebihi dana' : 'Sisa dana'}
            </span>
            <span className={`font-semibold ${diff < 0 ? 'text-red-500' : 'text-green-600'}`}>
              {formatRupiah(Math.abs(diff))}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          className="flex-1"
          onClick={handleConfirm}
          disabled={loading || diff < 0}
        >
          {loading ? 'Memproses...' : 'Terapkan Semua'}
        </Button>
        <Button variant="outline" onClick={onCustomize} className="flex-1">
          Ubah Manual
        </Button>
      </CardFooter>
    </Card>
  )
}
