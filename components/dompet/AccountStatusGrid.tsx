'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Account {
  name: string
  type: string
  role: string
  balance: number
  color?: string
}

interface AccountStatusGridProps {
  accounts: Account[]
}

const formatRupiah = (value: number): string =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

const ROLE_COLORS: Record<string, string> = {
  tabungan: 'bg-blue-100 text-blue-700',
  operasional: 'bg-gray-100 text-gray-600',
  darurat: 'bg-red-100 text-red-600',
  investasi: 'bg-green-100 text-green-700',
  cicilan: 'bg-orange-100 text-orange-700',
}

function getRoleBadgeClass(role: string): string {
  const lower = role.toLowerCase()
  for (const [key, cls] of Object.entries(ROLE_COLORS)) {
    if (lower.includes(key)) return cls
  }
  return 'bg-gray-100 text-gray-600'
}

const DEFAULT_COLORS = [
  '#3b82f6', '#10b981', '#f97316', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f59e0b',
]

export default function AccountStatusGrid({ accounts }: AccountStatusGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {accounts.map((account, idx) => {
        const dotColor = account.color ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length]
        return (
          <Card key={idx} className="border border-gray-100">
            <CardContent className="flex items-center gap-3 py-3 px-4">
              <div
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: dotColor }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-semibold text-gray-800 truncate">{account.name}</p>
                  <Badge
                    className={`shrink-0 text-[10px] px-1.5 py-0 ${getRoleBadgeClass(account.role)}`}
                  >
                    {account.role}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{account.type}</p>
              </div>
              <p className="shrink-0 text-sm font-bold text-gray-700 tabular-nums">
                {formatRupiah(account.balance)}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
