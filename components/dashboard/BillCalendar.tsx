'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react'

interface Bill {
  name: string
  dueDay: number
  amount: number
  isPaid: boolean
}

interface BillCalendarProps {
  bills: Bill[]
}

const formatRupiah = (value: number): string =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

function getBillStatus(bill: Bill, today: number): 'paid' | 'overdue' | 'upcoming' {
  if (bill.isPaid) return 'paid'
  if (bill.dueDay < today) return 'overdue'
  return 'upcoming'
}

export default function BillCalendar({ bills }: BillCalendarProps) {
  const today = new Date().getDate()
  const sorted = [...bills].sort((a, b) => a.dueDay - b.dueDay)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-800">
          Tagihan Bulan Ini
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-72 pr-2">
          <ul className="space-y-2">
            {sorted.map((bill, idx) => {
              const status = getBillStatus(bill, today)

              const statusStyles = {
                paid: {
                  bg: 'bg-green-50',
                  border: 'border-green-200',
                  text: 'text-green-700',
                  icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
                  badge: 'Lunas',
                  badgeClass: 'bg-green-100 text-green-700 hover:bg-green-100',
                },
                overdue: {
                  bg: 'bg-red-50',
                  border: 'border-red-200',
                  text: 'text-red-700',
                  icon: <AlertCircle className="h-4 w-4 text-red-500" />,
                  badge: 'Terlambat',
                  badgeClass: 'bg-red-100 text-red-700 hover:bg-red-100',
                },
                upcoming: {
                  bg: 'bg-yellow-50',
                  border: 'border-yellow-200',
                  text: 'text-yellow-700',
                  icon: <Clock className="h-4 w-4 text-yellow-500" />,
                  badge: `Tgl ${bill.dueDay}`,
                  badgeClass: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
                },
              }[status]

              return (
                <li
                  key={idx}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 ${statusStyles.bg} ${statusStyles.border}`}
                >
                  <div className="flex items-center gap-2">
                    {statusStyles.icon}
                    <div>
                      <p className={`text-sm font-medium ${statusStyles.text}`}>{bill.name}</p>
                      <p className="text-xs text-gray-500">{formatRupiah(bill.amount)}</p>
                    </div>
                  </div>
                  <Badge className={`text-xs ${statusStyles.badgeClass}`}>
                    {statusStyles.badge}
                  </Badge>
                </li>
              )
            })}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
