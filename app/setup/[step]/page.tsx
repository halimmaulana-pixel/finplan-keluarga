"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import StepIndicator from "@/components/setup/StepIndicator"

const STEPS = [
  { label: "Profil & PIN" },
  { label: "Pemasukan" },
  { label: "Tagihan & Hutang" },
  { label: "Tabungan" },
  { label: "Aset & Rekening" },
]

const STORAGE_KEY = "finplan_setup"

function loadDraft() {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, unknown> } catch { return {} }
}

function saveDraft(data: Record<string, unknown>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────
function Step1({ onNext }: { onNext: () => void }) {
  const [name, setName] = useState("")
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const d = loadDraft()
    if (d.familyName) setName(d.familyName as string)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pin.length < 4) return toast.error("PIN minimal 4 digit")
    if (pin !== confirmPin) return toast.error("PIN tidak cocok")
    setLoading(true)
    const res = await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, pin, startMonth: new Date().toISOString() }),
    })
    if (!res.ok) {
      const err = await res.json() as { error: string }
      toast.error(err.error ?? "Gagal membuat profil")
    } else {
      const json = await res.json() as { data: { id: string } }
      saveDraft({ ...loadDraft(), familyName: name, familyId: json.data.id })
      onNext()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>Nama Keluarga</Label>
        <Input placeholder="Keluarga Halim" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label>PIN Akses (4-6 digit)</Label>
        <Input type="password" inputMode="numeric" maxLength={6} placeholder="••••••" value={pin} onChange={(e) => setPin(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label>Konfirmasi PIN</Label>
        <Input type="password" inputMode="numeric" maxLength={6} placeholder="••••••" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Menyimpan..." : "Lanjut →"}
      </Button>
    </form>
  )
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────
interface IncomeSource { name: string; amount: string; frequency: string }

function Step2({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [sources, setSources] = useState<IncomeSource[]>([
    { name: "Gaji Halim", amount: "", frequency: "MONTHLY" },
    { name: "Gaji Istri", amount: "", frequency: "MONTHLY" },
  ])
  const [loading, setLoading] = useState(false)

  function update(i: number, field: keyof IncomeSource, val: string) {
    setSources((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valid = sources.filter((s) => s.name && Number(s.amount) > 0)
    if (valid.length === 0) return toast.error("Tambah minimal 1 sumber pemasukan")
    setLoading(true)
    await Promise.all(valid.map((s) =>
      fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: s.name, amount: Number(s.amount), frequency: s.frequency }),
      })
    ))
    onNext()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {sources.map((s, i) => (
        <div key={i} className="p-3 border rounded-lg space-y-2">
          <div className="flex gap-2">
            <Input placeholder="Nama sumber" value={s.name} onChange={(e) => update(i, "name", e.target.value)} className="flex-1" />
            <Button type="button" variant="ghost" className="text-red-500 px-2" onClick={() => setSources((p) => p.filter((_, idx) => idx !== i))}>✕</Button>
          </div>
          <div className="flex gap-2">
            <Input type="number" placeholder="Jumlah (Rp)" value={s.amount} onChange={(e) => update(i, "amount", e.target.value)} className="flex-1" />
            <Select value={s.frequency} onValueChange={(v) => update(i, "frequency", v ?? "MONTHLY")}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Bulanan</SelectItem>
                <SelectItem value="IRREGULAR">Tidak tetap</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" className="w-full" onClick={() => setSources((p) => [...p, { name: "", amount: "", frequency: "MONTHLY" }])}>
        + Tambah Sumber
      </Button>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>← Kembali</Button>
        <Button type="submit" className="flex-1" disabled={loading}>{loading ? "Menyimpan..." : "Lanjut →"}</Button>
      </div>
    </form>
  )
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────
const BILL_PRESETS = [
  { name: "Listrik PLN", category: "ELECTRICITY", dueDay: 20 },
  { name: "Internet", category: "INTERNET", dueDay: 25 },
  { name: "Kartu Halo Halim", category: "PHONE", dueDay: 10 },
  { name: "Kartu Halo Istri", category: "PHONE", dueDay: 10 },
  { name: "ART", category: "STAFF", dueDay: 1 },
  { name: "Tukang Kebun", category: "STAFF", dueDay: 15 },
]

interface BillForm { name: string; amount: string; dueDay: string; category: string; enabled: boolean }
interface DebtForm { name: string; type: string; totalAmount: string; remainingAmount: string; monthlyPayment: string; dueDay: string; remainingMonths: string }

function Step3({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [bills, setBills] = useState<BillForm[]>(BILL_PRESETS.map((p) => ({ ...p, amount: "", dueDay: String(p.dueDay), enabled: false })))
  const [debts, setDebts] = useState<DebtForm[]>([{ name: "Pinjol", type: "PINJOL", totalAmount: "", remainingAmount: "", monthlyPayment: "3000000", dueDay: "5", remainingMonths: "6" }])
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const activeBills = bills.filter((b) => b.enabled && b.amount)
    const activeDebts = debts.filter((d) => d.name && d.monthlyPayment)

    await Promise.all([
      ...activeBills.map((b) => fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: b.name, amount: Number(b.amount), dueDay: Number(b.dueDay), category: b.category }),
      })),
      ...activeDebts.map((d) => fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: d.name, type: d.type,
          totalAmount: Number(d.totalAmount) || Number(d.monthlyPayment) * Number(d.remainingMonths),
          remainingAmount: Number(d.remainingAmount) || Number(d.monthlyPayment) * Number(d.remainingMonths),
          monthlyPayment: Number(d.monthlyPayment),
          dueDay: Number(d.dueDay), remainingMonths: Number(d.remainingMonths),
          startDate: new Date().toISOString(),
        }),
      })),
    ])
    onNext()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="text-sm font-medium mb-2">Tagihan Rutin</p>
        <div className="space-y-2">
          {bills.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="checkbox" checked={b.enabled} onChange={(e) => setBills((p) => p.map((x, idx) => idx === i ? { ...x, enabled: e.target.checked } : x))} className="w-4 h-4" />
              <span className="text-sm w-36 shrink-0">{b.name}</span>
              {b.enabled && (
                <Input type="number" placeholder="Rp" value={b.amount}
                  onChange={(e) => setBills((p) => p.map((x, idx) => idx === i ? { ...x, amount: e.target.value } : x))}
                  className="flex-1 h-8 text-sm" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Hutang Aktif</p>
        {debts.map((d, i) => (
          <div key={i} className="p-3 border rounded-lg space-y-2 mb-2">
            <div className="flex gap-2">
              <Input placeholder="Nama hutang" value={d.name} onChange={(e) => setDebts((p) => p.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} className="flex-1" />
              <Select value={d.type} onValueChange={(v) => setDebts((p) => p.map((x, idx) => idx === i ? { ...x, type: v ?? "OTHER" } : x))}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["PINJOL", "KPR", "KKB", "PERSONAL", "OTHER"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label className="text-xs">Cicilan/bln</Label><Input type="number" value={d.monthlyPayment} onChange={(e) => setDebts((p) => p.map((x, idx) => idx === i ? { ...x, monthlyPayment: e.target.value } : x))} /></div>
              <div><Label className="text-xs">Tgl jatuh tempo</Label><Input type="number" min="1" max="31" value={d.dueDay} onChange={(e) => setDebts((p) => p.map((x, idx) => idx === i ? { ...x, dueDay: e.target.value } : x))} /></div>
              <div><Label className="text-xs">Sisa bulan</Label><Input type="number" value={d.remainingMonths} onChange={(e) => setDebts((p) => p.map((x, idx) => idx === i ? { ...x, remainingMonths: e.target.value } : x))} /></div>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => setDebts((p) => [...p, { name: "", type: "OTHER", totalAmount: "", remainingAmount: "", monthlyPayment: "", dueDay: "5", remainingMonths: "" }])}>
          + Tambah Hutang
        </Button>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>← Kembali</Button>
        <Button type="submit" className="flex-1" disabled={loading}>{loading ? "Menyimpan..." : "Lanjut →"}</Button>
      </div>
    </form>
  )
}

// ─── Step 4 ───────────────────────────────────────────────────────────────────
interface GoalForm { name: string; targetAmount: string; monthlyContrib: string; emoji: string }

function Step4({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [goals, setGoals] = useState<GoalForm[]>([
    { name: "Dana Darurat", targetAmount: "", monthlyContrib: "", emoji: "🛡️" },
    { name: "Sinking Fund Kendaraan", targetAmount: "3000000", monthlyContrib: "300000", emoji: "🚗" },
    { name: "Baby Fund", targetAmount: "", monthlyContrib: "", emoji: "👶" },
  ])
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valid = goals.filter((g) => g.name && Number(g.targetAmount) > 0)
    if (valid.length === 0) return toast.error("Isi minimal 1 goal tabungan")
    setLoading(true)
    await Promise.all(valid.map((g, i) => fetch("/api/savings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: g.name, targetAmount: Number(g.targetAmount), monthlyContrib: Number(g.monthlyContrib) || 0, priority: i + 1, emoji: g.emoji }),
    })))
    onNext()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {goals.map((g, i) => (
        <div key={i} className="p-3 border rounded-lg space-y-2">
          <div className="flex gap-2 items-center">
            <span className="text-xl">{g.emoji}</span>
            <Input value={g.name} onChange={(e) => setGoals((p) => p.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} className="flex-1" placeholder="Nama goal" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Target (Rp)</Label><Input type="number" value={g.targetAmount} onChange={(e) => setGoals((p) => p.map((x, idx) => idx === i ? { ...x, targetAmount: e.target.value } : x))} /></div>
            <div><Label className="text-xs">Kontribusi/bln</Label><Input type="number" value={g.monthlyContrib} onChange={(e) => setGoals((p) => p.map((x, idx) => idx === i ? { ...x, monthlyContrib: e.target.value } : x))} /></div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" className="w-full" onClick={() => setGoals((p) => [...p, { name: "", targetAmount: "", monthlyContrib: "", emoji: "🎯" }])}>
        + Tambah Goal
      </Button>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>← Kembali</Button>
        <Button type="submit" className="flex-1" disabled={loading}>{loading ? "Menyimpan..." : "Lanjut →"}</Button>
      </div>
    </form>
  )
}

// ─── Step 5 ───────────────────────────────────────────────────────────────────
interface AssetForm { name: string; type: string; value: string }
interface AccountForm { name: string; type: string; role: string; balance: string; color: string }

const ACCOUNT_PRESETS: AccountForm[] = [
  { name: "BCA", type: "BANK", role: "TRANSIT", balance: "0", color: "#1565C0" },
  { name: "Superbank", type: "BANK", role: "BILLS", balance: "0", color: "#00838F" },
  { name: "Jenius", type: "BANK", role: "SAVINGS", balance: "0", color: "#00BCD4" },
  { name: "GoPay", type: "EWALLET", role: "TRANSPORT", balance: "0", color: "#00BFA5" },
  { name: "OVO", type: "EWALLET", role: "GROCERY", balance: "0", color: "#6A1B9A" },
  { name: "ShopeePay", type: "EWALLET", role: "SOCIAL", balance: "0", color: "#EF6C00" },
  { name: "Dana", type: "EWALLET", role: "SOCIAL", balance: "0", color: "#1976D2" },
]

function Step5({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [assets, setAssets] = useState<AssetForm[]>([
    { name: "Sepeda Motor", type: "VEHICLE", value: "" },
    { name: "Mobil", type: "VEHICLE", value: "" },
  ])
  const [accounts, setAccounts] = useState<AccountForm[]>(ACCOUNT_PRESETS)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const validAssets = assets.filter((a) => a.name && Number(a.value) > 0)
    await Promise.all([
      ...validAssets.map((a) => fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: a.name, type: a.type, value: Number(a.value) }),
      })),
      ...accounts.map((a) => fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: a.name, type: a.type, role: a.role, balance: Number(a.balance) || 0, color: a.color }),
      })),
    ])
    localStorage.removeItem(STORAGE_KEY)
    onNext()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="text-sm font-medium mb-2">Aset</p>
        <div className="space-y-2">
          {assets.map((a, i) => (
            <div key={i} className="flex gap-2">
              <Input value={a.name} onChange={(e) => setAssets((p) => p.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} placeholder="Nama aset" className="flex-1" />
              <Input type="number" value={a.value} onChange={(e) => setAssets((p) => p.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))} placeholder="Estimasi nilai (Rp)" className="flex-1" />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setAssets((p) => [...p, { name: "", type: "OTHER", value: "" }])}>+ Tambah Aset</Button>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Rekening & E-Wallet (saldo awal semua Rp 0)</p>
        <div className="space-y-2">
          {accounts.map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-24 shrink-0 font-medium">{a.name}</span>
              <span className="text-muted-foreground text-xs w-20">{a.role}</span>
              <Input type="number" value={a.balance} onChange={(e) => setAccounts((p) => p.map((x, idx) => idx === i ? { ...x, balance: e.target.value } : x))} placeholder="Saldo" className="flex-1 h-8" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>← Kembali</Button>
        <Button type="submit" className="flex-1" disabled={loading}>{loading ? "Menyimpan..." : "Selesai & Mulai →"}</Button>
      </div>
    </form>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SetupStepPage() {
  const params = useParams()
  const router = useRouter()
  const step = Number(params.step)

  function goNext() { router.push(step < 5 ? `/setup/${step + 1}` : "/dashboard") }
  function goBack() { if (step > 1) router.push(`/setup/${step - 1}`) }

  const titles = ["Profil & PIN", "Pemasukan", "Tagihan & Hutang", "Tabungan & Goals", "Aset & Rekening"]

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-lg space-y-4">
        <StepIndicator currentStep={step} totalSteps={5} steps={STEPS} />
        <Card>
          <CardHeader>
            <CardTitle>{titles[step - 1]}</CardTitle>
            <CardDescription>Langkah {step} dari 5</CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && <Step1 onNext={goNext} />}
            {step === 2 && <Step2 onNext={goNext} onBack={goBack} />}
            {step === 3 && <Step3 onNext={goNext} onBack={goBack} />}
            {step === 4 && <Step4 onNext={goNext} onBack={goBack} />}
            {step === 5 && <Step5 onNext={goNext} onBack={goBack} />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
