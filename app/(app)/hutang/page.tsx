"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { formatRupiah } from "@/lib/currency"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface Debt {
  id: string
  name: string
  type: string
  totalAmount: number
  remainingAmount: number
  monthlyPayment: number
  dueDay: number
  remainingMonths: number
  payments: { month: string; paidAt: string | null; amount: number }[]
}

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

const DEBT_TYPE_CONFIG: Record<string, { label: string; variant: "destructive" | "secondary" | "outline" }> = {
  PINJOL: { label: "Pinjol", variant: "destructive" },
  KPR: { label: "KPR", variant: "secondary" },
  KKB: { label: "KKB", variant: "outline" },
  PERSONAL: { label: "Personal", variant: "outline" },
  OTHER: { label: "Lainnya", variant: "outline" },
}

export default function HutangPage() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState<string | null>(null)

  const month = currentMonthKey()

  const fetchDebts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/debts")
      if (!res.ok) throw new Error("Gagal memuat hutang")
      const data = await res.json()
      setDebts(data.data ?? [])
    } catch {
      toast.error("Gagal memuat data hutang")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDebts() }, [fetchDebts])

  async function handlePayCicilan(debtId: string, amount: number) {
    setPayingId(debtId)
    try {
      const res = await fetch(`/api/debts/${debtId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, amount }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? "Gagal membayar cicilan")
      }
      toast.success("Cicilan berhasil dicatat")
      fetchDebts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membayar cicilan")
    } finally {
      setPayingId(null)
    }
  }

  const totalRemaining = debts.reduce((s, d) => s + d.remainingAmount, 0)
  const totalMonthly = debts.reduce((s, d) => s + d.monthlyPayment, 0)

  const [year, mon] = month.split("-").map(Number) as [number, number]
  const monthName = new Date(year, mon - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Hutang</h1>
        <p className="text-muted-foreground text-sm">{monthName}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-muted-foreground">Total Hutang Tersisa</p>
            <p className="text-lg font-bold text-red-600">{formatRupiah(totalRemaining)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-muted-foreground">Cicilan Bulan Ini</p>
            <p className="text-lg font-bold">{formatRupiah(totalMonthly)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Debt list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Hutang</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : debts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada hutang aktif. Alhamdulillah!</p>
          ) : (
            debts.map((debt, i) => {
              const paidThisMonth = debt.payments.find((p) => p.month === month && p.paidAt)
              const paidPct = Math.max(0, Math.min(100, ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100))
              const typeConfig = DEBT_TYPE_CONFIG[debt.type] ?? { label: debt.type, variant: "outline" as const }

              return (
                <div key={debt.id}>
                  {i > 0 && <Separator className="mb-4" />}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{debt.name}</span>
                          <Badge variant={typeConfig.variant} className="text-xs">
                            {typeConfig.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Jatuh tempo tgl {debt.dueDay} · Sisa {debt.remainingMonths} bulan
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-red-600">{formatRupiah(debt.remainingAmount)}</p>
                        <p className="text-xs text-muted-foreground">{formatRupiah(debt.monthlyPayment)}/bln</p>
                      </div>
                    </div>

                    {/* Progress pelunasan */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Pelunasan</span>
                        <span>{paidPct.toFixed(1)}%</span>
                      </div>
                      <Progress value={paidPct} className="h-1.5" />
                    </div>

                    {/* Countdown */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {debt.remainingMonths > 0
                          ? `⏳ Lunas dalam ${debt.remainingMonths} bulan lagi`
                          : "✓ Sudah lunas"}
                      </p>
                      {!paidThisMonth && debt.remainingAmount > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={payingId === debt.id}
                          onClick={() => handlePayCicilan(debt.id, debt.monthlyPayment)}
                        >
                          {payingId === debt.id ? "Menyimpan..." : `Bayar ${formatRupiah(debt.monthlyPayment)}`}
                        </Button>
                      )}
                      {paidThisMonth && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                          ✓ Dibayar bulan ini
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
