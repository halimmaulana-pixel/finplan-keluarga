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
import { Pencil, Check, X, Plus } from "lucide-react"

interface Account {
  id: string
  name: string
  type: string
  role: string
  balance: number
  color: string | null
}

const ROLES = [
  { value: "TRANSIT", label: "Transit", description: "Rekening masuk gaji" },
  { value: "BILLS", label: "Tagihan", description: "Bayar tagihan rutin" },
  { value: "SAVINGS", label: "Tabungan", description: "Simpanan & goals" },
  { value: "TRANSPORT", label: "Transport", description: "Bensin & transportasi" },
  { value: "GROCERY", label: "Belanja", description: "Kebutuhan sehari-hari" },
  { value: "SOCIAL", label: "Sosial", description: "Hiburan & sosial" },
]

const TYPES = [
  { value: "BANK", label: "Bank" },
  { value: "EWALLET", label: "E-Wallet" },
]

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  TRANSIT: { label: "Transit", color: "secondary" },
  BILLS: { label: "Tagihan", color: "destructive" },
  SAVINGS: { label: "Tabungan", color: "outline" },
  TRANSPORT: { label: "Transport", color: "outline" },
  GROCERY: { label: "Belanja", color: "outline" },
  SOCIAL: { label: "Sosial", color: "outline" },
}

export default function RekeningPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBalance, setEditBalance] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Add form
  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState("BANK")
  const [newRole, setNewRole] = useState("TRANSIT")
  const [newBalance, setNewBalance] = useState("")
  const [addingAccount, setAddingAccount] = useState(false)

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/accounts")
      if (!res.ok) throw new Error("Gagal memuat rekening")
      const data = await res.json()
      setAccounts(data.data ?? [])
    } catch {
      toast.error("Gagal memuat data rekening")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  async function handleUpdateBalance(accountId: string) {
    const balNum = parseInt(editBalance.replace(/\D/g, ""), 10)
    if (isNaN(balNum)) { toast.error("Saldo tidak valid"); return }

    setSavingEdit(true)
    try {
      const res = await fetch(`/api/accounts/${accountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: balNum }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? "Gagal update saldo")
      }
      toast.success("Saldo berhasil diperbarui")
      setEditingId(null)
      setEditBalance("")
      fetchAccounts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal update")
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) { toast.error("Nama rekening wajib diisi"); return }

    const balNum = parseInt(newBalance.replace(/\D/g, ""), 10) || 0

    setAddingAccount(true)
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, type: newType, role: newRole, balance: balNum }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? "Gagal menambah rekening")
      }
      toast.success("Rekening berhasil ditambahkan")
      setNewName("")
      setNewType("BANK")
      setNewRole("TRANSIT")
      setNewBalance("")
      setShowForm(false)
      fetchAccounts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal")
    } finally {
      setAddingAccount(false)
    }
  }

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)

  // Group by role
  const byRole = ROLES.map((r) => ({
    ...r,
    accounts: accounts.filter((a) => a.role === r.value),
  })).filter((r) => r.accounts.length > 0)

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rekening</h1>
          <p className="text-muted-foreground text-sm">
            Total saldo: {formatRupiah(totalBalance)} · {accounts.length} rekening
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />
          Tambah
        </Button>
      </div>

      {/* Form tambah rekening */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tambah Rekening Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddAccount} className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Nama Rekening</Label>
                <Input placeholder="Contoh: BCA Tabungan" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Tipe</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v ?? "")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Role</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v ?? "")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label} <span className="text-muted-foreground text-xs">— {r.description}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Saldo Awal (Rp)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" disabled={addingAccount}>{addingAccount ? "Menyimpan..." : "Tambah Rekening"}</Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Accounts grid */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat...</p>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-sm text-muted-foreground">Belum ada rekening. Tambah rekening pertama!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => {
            const roleConfig = ROLE_CONFIG[acc.role] ?? { label: acc.role, color: "outline" }
            const isEditing = editingId === acc.id

            return (
              <Card key={acc.id} className="relative">
                <CardContent className="pt-4 pb-4 px-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={roleConfig.color as "secondary" | "destructive" | "outline"} className="text-xs">
                      {roleConfig.label}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{acc.type === "BANK" ? "Bank" : "E-Wallet"}</Badge>
                  </div>

                  <p className="text-sm font-semibold">{acc.name}</p>

                  {isEditing ? (
                    <div className="flex gap-1 items-center">
                      <Input
                        type="text"
                        inputMode="numeric"
                        className="h-8 text-sm flex-1"
                        value={editBalance}
                        onChange={(e) => setEditBalance(e.target.value.replace(/\D/g, ""))}
                        autoFocus
                      />
                      <Button size="icon" className="h-8 w-8 shrink-0" disabled={savingEdit} onClick={() => handleUpdateBalance(acc.id)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => { setEditingId(null); setEditBalance("") }}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-base font-bold">{formatRupiah(acc.balance)}</p>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => { setEditingId(acc.id); setEditBalance(String(acc.balance)) }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
