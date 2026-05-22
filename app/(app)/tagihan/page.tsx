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
import { CheckCircle2, XCircle, Plus } from "lucide-react"

interface Bill {
  id: string
  name: string
  amount: number
  dueDay: number
  category: string
  isActive: boolean
}

interface BillPayment {
  billId: string
  month: string
  paidAt: string | null
  amount: number
}

interface BillWithStatus extends Bill {
  paid: boolean
  paidAt: string | null
}

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

const CATEGORY_LABEL: Record<string, string> = {
  ELECTRICITY: "Listrik",
  INTERNET: "Internet",
  PHONE: "Telepon",
  STAFF: "Karyawan",
  OTHER: "Lainnya",
}

const BILL_CATEGORIES = Object.entries(CATEGORY_LABEL)

export default function TagihanPage() {
  const [bills, setBills] = useState<BillWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [formName, setFormName] = useState("")
  const [formAmount, setFormAmount] = useState("")
  const [formDueDay, setFormDueDay] = useState("1")
  const [formCategory, setFormCategory] = useState("OTHER")
  const [formSubmitting, setFormSubmitting] = useState(false)

  const month = currentMonthKey()

  const fetchBills = useCallback(async () => {
    setLoading(true)
    try {
      const [billsRes, paymentsRes] = await Promise.all([
        fetch("/api/bills"),
        fetch(`/api/bills/payments?month=${month}`),
      ])
      if (!billsRes.ok) throw new Error("Gagal memuat tagihan")
      const billsData = await billsRes.json()
      const paymentsData = paymentsRes.ok ? await paymentsRes.json() : { data: [] }

      const paymentMap = new Map<string, BillPayment>(
        (paymentsData.data ?? []).map((p: BillPayment) => [p.billId, p])
      )

      setBills(
        (billsData.data ?? []).map((b: Bill) => ({
          ...b,
          paid: !!paymentMap.get(b.id)?.paidAt,
          paidAt: paymentMap.get(b.id)?.paidAt ?? null,
        }))
      )
    } catch {
      toast.error("Gagal memuat data tagihan")
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { fetchBills() }, [fetchBills])

  async function handlePay(billId: string) {
    setPayingId(billId)
    try {
      const res = await fetch(`/api/bills/${billId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? "Gagal membayar tagihan")
      }
      toast.success("Tagihan berhasil ditandai lunas")
      fetchBills()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membayar")
    } finally {
      setPayingId(null)
    }
  }

  async function handleAddBill(e: React.FormEvent) {
    e.preventDefault()
    const amountNum = parseInt(formAmount.replace(/\D/g, ""), 10)
    if (!formName.trim()) { toast.error("Nama tagihan wajib diisi"); return }
    if (!amountNum || amountNum <= 0) { toast.error("Jumlah tidak valid"); return }

    setFormSubmitting(true)
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          amount: amountNum,
          dueDay: parseInt(formDueDay, 10),
          category: formCategory,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? "Gagal menambah tagihan")
      }
      toast.success("Tagihan berhasil ditambahkan")
      setFormName("")
      setFormAmount("")
      setFormDueDay("1")
      setFormCategory("OTHER")
      setShowForm(false)
      fetchBills()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambah tagihan")
    } finally {
      setFormSubmitting(false)
    }
  }

  const totalTagihan = bills.reduce((s, b) => s + b.amount, 0)
  const totalBelumBayar = bills.filter((b) => !b.paid).reduce((s, b) => s + b.amount, 0)
  const [year, mon] = month.split("-").map(Number) as [number, number]
  const monthName = new Date(year, mon - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tagihan</h1>
          <p className="text-muted-foreground text-sm">{monthName}</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />
          Tambah
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-muted-foreground">Total Tagihan</p>
            <p className="text-lg font-bold">{formatRupiah(totalTagihan)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-muted-foreground">Belum Bayar</p>
            <p className={`text-lg font-bold ${totalBelumBayar > 0 ? "text-red-600" : "text-green-600"}`}>
              {formatRupiah(totalBelumBayar)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Form tambah tagihan */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tambah Tagihan Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddBill} className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Nama Tagihan</Label>
                <Input
                  placeholder="Contoh: Listrik PLN"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Jumlah (Rp)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="500000"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Tanggal Jatuh Tempo</Label>
                <Select value={formDueDay} onValueChange={(v) => setFormDueDay(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                      <SelectItem key={d} value={String(d)}>Tanggal {d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Kategori</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BILL_CATEGORIES.map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" disabled={formSubmitting}>
                  {formSubmitting ? "Menyimpan..." : "Simpan Tagihan"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List tagihan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Tagihan Bulan Ini</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : bills.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada tagihan. Tambah tagihan baru.</p>
          ) : (
            bills.map((bill, i) => (
              <div key={bill.id}>
                {i > 0 && <Separator className="my-2" />}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {bill.paid ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 shrink-0 text-red-500" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{bill.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {CATEGORY_LABEL[bill.category] ?? bill.category} · jatuh tempo tgl {bill.dueDay}
                      </p>
                      {bill.paid && bill.paidAt && (
                        <p className="text-xs text-green-600">
                          Dibayar {new Date(bill.paidAt).toLocaleDateString("id-ID")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold">{formatRupiah(bill.amount)}</span>
                    {!bill.paid && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-300 hover:bg-green-50"
                        disabled={payingId === bill.id}
                        onClick={() => handlePay(bill.id)}
                      >
                        {payingId === bill.id ? "..." : "Lunas"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
