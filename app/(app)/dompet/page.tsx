"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { formatRupiah } from "@/lib/currency"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface WalletEntry {
  id: string
  source: string
  amount: number
  date: string
  isAllocated: boolean
}

interface Account {
  id: string
  name: string
  role: string
  balance: number
  type: string
}

interface AllocationSuggestion {
  accountId: string
  accountName: string
  amount: number
  purpose: string
}

const INCOME_SOURCES = [
  "Gaji Halim",
  "Gaji Istri",
  "Honorarium",
  "Freelance",
  "Investasi",
  "Lainnya",
]

const ROLE_LABEL: Record<string, string> = {
  TRANSIT: "Transit",
  BILLS: "Tagihan",
  SAVINGS: "Tabungan",
  TRANSPORT: "Transport",
  GROCERY: "Belanja",
  SOCIAL: "Sosial",
}

const ROLE_COLOR: Record<string, string> = {
  TRANSIT: "outline",
  BILLS: "secondary",
  SAVINGS: "outline",
  TRANSPORT: "outline",
  GROCERY: "outline",
  SOCIAL: "outline",
}

export default function DompetPage() {
  const [entries, setEntries] = useState<WalletEntry[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingEntries, setLoadingEntries] = useState(true)
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  // Form state
  const [source, setSource] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0])
  const [submitting, setSubmitting] = useState(false)

  // Allocation state
  const [allocatingId, setAllocatingId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<AllocationSuggestion[]>([])
  const [confirmingAllocation, setConfirmingAllocation] = useState(false)

  const fetchEntries = useCallback(async () => {
    setLoadingEntries(true)
    try {
      const res = await fetch("/api/wallet")
      if (!res.ok) throw new Error("Gagal memuat data dompet")
      const data = await res.json()
      setEntries(data.data ?? [])
    } catch {
      toast.error("Gagal memuat data dompet")
    } finally {
      setLoadingEntries(false)
    }
  }, [])

  const fetchAccounts = useCallback(async () => {
    setLoadingAccounts(true)
    try {
      const res = await fetch("/api/accounts")
      if (!res.ok) throw new Error("Gagal memuat rekening")
      const data = await res.json()
      setAccounts(data.data ?? [])
    } catch {
      toast.error("Gagal memuat data rekening")
    } finally {
      setLoadingAccounts(false)
    }
  }, [])

  useEffect(() => {
    fetchEntries()
    fetchAccounts()
  }, [fetchEntries, fetchAccounts])

  async function handleAddIncome(e: React.FormEvent) {
    e.preventDefault()
    const amountNum = parseInt(amount.replace(/\D/g, ""), 10)
    if (!source) { toast.error("Pilih sumber pemasukan"); return }
    if (!amountNum || amountNum <= 0) { toast.error("Jumlah tidak valid"); return }

    setSubmitting(true)
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, amount: amountNum, date }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? "Gagal menambah pemasukan")
      }
      toast.success("Pemasukan berhasil ditambahkan")
      setSource("")
      setAmount("")
      setDate(new Date().toISOString().split("T")[0])
      fetchEntries()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAllocate(entryId: string) {
    setAllocatingId(entryId)
    setSuggestions([])
    try {
      const res = await fetch(`/api/wallet/${entryId}/suggest`)
      if (!res.ok) throw new Error("Gagal mendapat saran alokasi")
      const data = await res.json()
      setSuggestions(data.data ?? [])
    } catch {
      toast.error("Gagal mendapat saran alokasi")
      setAllocatingId(null)
    }
  }

  async function handleConfirmAllocation(entryId: string) {
    setConfirmingAllocation(true)
    try {
      const res = await fetch(`/api/wallet/${entryId}/allocate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocations: suggestions }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? "Gagal mengalokasikan")
      }
      toast.success("Alokasi berhasil disimpan")
      setAllocatingId(null)
      setSuggestions([])
      fetchEntries()
      fetchAccounts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengalokasikan")
    } finally {
      setConfirmingAllocation(false)
    }
  }

  const unallocated = entries.filter((e) => !e.isAllocated)
  const allocated = entries.filter((e) => e.isAllocated)

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Dompet Masuk</h1>
        <p className="text-muted-foreground text-sm">Catat dan alokasikan pemasukan keluarga</p>
      </div>

      {/* Form tambah pemasukan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tambah Pemasukan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddIncome} className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label>Sumber</Label>
              <Select value={source} onValueChange={(v) => setSource(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih sumber..." />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Jumlah</Label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Contoh: 5000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="sm:col-span-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Tambah Pemasukan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Belum dialokasikan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Belum Dialokasikan</CardTitle>
          <CardDescription className="text-xs">
            {unallocated.length} entri · Total:{" "}
            {formatRupiah(unallocated.reduce((s, e) => s + e.amount, 0))}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingEntries ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : unallocated.length === 0 ? (
            <p className="text-sm text-muted-foreground">Semua pemasukan sudah dialokasikan.</p>
          ) : (
            unallocated.map((entry) => (
              <div key={entry.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{entry.source}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString("id-ID")} · {formatRupiah(entry.amount)}
                    </p>
                  </div>
                  {allocatingId !== entry.id && (
                    <Button size="sm" variant="outline" onClick={() => handleAllocate(entry.id)}>
                      Alokasikan
                    </Button>
                  )}
                </div>

                {/* Suggestion panel */}
                {allocatingId === entry.id && suggestions.length > 0 && (
                  <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Saran Alokasi
                    </p>
                    {suggestions.map((s) => (
                      <div key={s.accountId} className="flex justify-between text-sm">
                        <span>{s.accountName} <span className="text-muted-foreground text-xs">({s.purpose})</span></span>
                        <span className="font-medium">{formatRupiah(s.amount)}</span>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        disabled={confirmingAllocation}
                        onClick={() => handleConfirmAllocation(entry.id)}
                      >
                        {confirmingAllocation ? "Menyimpan..." : "Konfirmasi"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setAllocatingId(null); setSuggestions([]) }}
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                )}

                {allocatingId === entry.id && suggestions.length === 0 && (
                  <p className="text-xs text-muted-foreground pl-1">Memuat saran...</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Account status grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Rekening</CardTitle>
          <CardDescription className="text-xs">
            Total saldo: {formatRupiah(accounts.reduce((s, a) => s + a.balance, 0))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAccounts ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {accounts.map((acc) => (
                <div key={acc.id} className="rounded-md border p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Badge variant={ROLE_COLOR[acc.role] as "outline" | "secondary" ?? "outline"} className="text-xs">
                      {ROLE_LABEL[acc.role] ?? acc.role}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium truncate">{acc.name}</p>
                  <p className="text-sm font-bold">{formatRupiah(acc.balance)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sudah dialokasikan */}
      {allocated.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sudah Dialokasikan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {allocated.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{entry.source}</span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    {new Date(entry.date).toLocaleDateString("id-ID")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs text-green-600 border-green-300">✓ Teralokasi</Badge>
                  <span className="font-medium">{formatRupiah(entry.amount)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
