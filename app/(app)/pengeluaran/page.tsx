"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { formatRupiah } from "@/lib/currency"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface Expense {
  id: string
  date: string
  amount: number
  category: string
  subcategory: string | null
  note: string | null
  isConsumptive: boolean | null
  consumptiveScore: number | null
}

const CATEGORIES = [
  { value: "FOOD", label: "Makanan & Minuman", emoji: "🍽️" },
  { value: "TRANSPORT_CAR", label: "Transport (Mobil)", emoji: "🚗" },
  { value: "TRANSPORT_MOTOR", label: "Transport (Motor)", emoji: "🏍️" },
  { value: "GROCERY", label: "Belanja Bulanan", emoji: "🛒" },
  { value: "HEALTH", label: "Kesehatan", emoji: "🏥" },
  { value: "EDUCATION", label: "Pendidikan", emoji: "📚" },
  { value: "ENTERTAINMENT", label: "Hiburan", emoji: "🎬" },
  { value: "SOCIAL", label: "Sosial", emoji: "🤝" },
  { value: "OTHER", label: "Lainnya", emoji: "📦" },
]

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]))

// Consumptive categories — spending limit warning threshold (80%)
const CONSUMPTIVE_CATEGORIES = new Set(["FOOD", "ENTERTAINMENT", "SOCIAL"])
const CONSUMPTIVE_MONTHLY_LIMIT = 3_000_000 // default, ideally fetched from config

function groupByDate(expenses: Expense[]) {
  const groups = new Map<string, Expense[]>()
  for (const exp of expenses) {
    const key = exp.date.split("T")[0]
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(exp)
  }
  return groups
}

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export default function PengeluaranPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  // Form
  const [category, setCategory] = useState("FOOD")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0])
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Filter
  const [filterMonth, setFilterMonth] = useState(currentMonthKey())
  const [filterCategory, setFilterCategory] = useState("ALL")

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ month: filterMonth })
      if (filterCategory !== "ALL") params.set("category", filterCategory)
      const res = await fetch(`/api/expenses?${params}`)
      if (!res.ok) throw new Error("Gagal memuat pengeluaran")
      const data = await res.json()
      setExpenses(data.data ?? [])
    } catch {
      toast.error("Gagal memuat data pengeluaran")
    } finally {
      setLoading(false)
    }
  }, [filterMonth, filterCategory])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amountNum = parseInt(amount.replace(/\D/g, ""), 10)
    if (!amountNum || amountNum <= 0) { toast.error("Jumlah tidak valid"); return }

    setSubmitting(true)
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, amount: amountNum, date, note: note || null }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? "Gagal menyimpan pengeluaran")
      }
      toast.success("Pengeluaran berhasil dicatat")
      setAmount("")
      setNote("")
      setDate(new Date().toISOString().split("T")[0])
      fetchExpenses()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal")
    } finally {
      setSubmitting(false)
    }
  }

  // Consumptive spending this month
  const consumptiveTotal = expenses
    .filter((e) => CONSUMPTIVE_CATEGORIES.has(e.category))
    .reduce((s, e) => s + e.amount, 0)
  const consumptivePct = (consumptiveTotal / CONSUMPTIVE_MONTHLY_LIMIT) * 100
  const isNearLimit = consumptivePct >= 80

  const today = new Date().toISOString().split("T")[0]
  const thisWeekStart = new Date()
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay())
  const weekStart = thisWeekStart.toISOString().split("T")[0]

  const todayExpenses = expenses.filter((e) => e.date.startsWith(today))
  const weekExpenses = expenses.filter((e) => e.date.split("T")[0] >= weekStart)

  const grouped = groupByDate(expenses)
  const sortedDates = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a))

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Pengeluaran</h1>
        <p className="text-muted-foreground text-sm">Catat pengeluaran harian</p>
      </div>

      {/* Warning konsumtif */}
      {isNearLimit && (
        <Card className="border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              ⚠️ Pengeluaran konsumtif sudah {consumptivePct.toFixed(0)}% dari limit bulan ini
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-0.5">
              {formatRupiah(consumptiveTotal)} dari {formatRupiah(CONSUMPTIVE_MONTHLY_LIMIT)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-muted-foreground">Hari Ini</p>
            <p className="text-lg font-bold">{formatRupiah(todayExpenses.reduce((s, e) => s + e.amount, 0))}</p>
            <p className="text-xs text-muted-foreground">{todayExpenses.length} transaksi</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-muted-foreground">Minggu Ini</p>
            <p className="text-lg font-bold">{formatRupiah(weekExpenses.reduce((s, e) => s + e.amount, 0))}</p>
            <p className="text-xs text-muted-foreground">{weekExpenses.length} transaksi</p>
          </CardContent>
        </Card>
      </div>

      {/* Form input cepat */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catat Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Kategori</Label>
              <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.emoji} {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Jumlah (Rp)</Label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tanggal</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Catatan (opsional)</Label>
              <Input placeholder="Makan siang..." value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Simpan Pengeluaran"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Bulan</Label>
          <Input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-40 h-8 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Kategori</Label>
          <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v ?? "")}>
            <SelectTrigger className="w-44 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Expense list grouped by date */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Pengeluaran</CardTitle>
          <CardDescription className="text-xs">
            Total: {formatRupiah(expenses.reduce((s, e) => s + e.amount, 0))} · {expenses.length} transaksi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : sortedDates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada pengeluaran bulan ini.</p>
          ) : (
            sortedDates.map((dateKey) => {
              const dayExpenses = grouped.get(dateKey)!
              const dayTotal = dayExpenses.reduce((s, e) => s + e.amount, 0)
              const [y, m, d] = dateKey.split("-").map(Number) as [number, number, number]
              const dateLabel = new Date(y, m - 1, d).toLocaleDateString("id-ID", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })

              return (
                <div key={dateKey} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {dateLabel}
                    </p>
                    <p className="text-xs font-medium">{formatRupiah(dayTotal)}</p>
                  </div>
                  {dayExpenses.map((exp, i) => {
                    const catConfig = CATEGORY_MAP[exp.category] ?? { emoji: "📦", label: exp.category }
                    return (
                      <div key={exp.id} className="flex items-center justify-between gap-2 pl-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base shrink-0">{catConfig.emoji}</span>
                          <div className="min-w-0">
                            <p className="text-sm truncate">{exp.note || catConfig.label}</p>
                            {exp.isConsumptive !== null && (
                              <Badge
                                variant={exp.isConsumptive ? "destructive" : "outline"}
                                className="text-xs mt-0.5"
                              >
                                {exp.isConsumptive ? "Konsumtif" : "Perlu"}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-medium shrink-0">{formatRupiah(exp.amount)}</span>
                      </div>
                    )
                  })}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
