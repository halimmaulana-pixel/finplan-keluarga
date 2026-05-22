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
import { Pencil, Check, X } from "lucide-react"

interface Asset {
  id: string
  name: string
  type: string
  value: number
}

const ASSET_TYPE_CONFIG: Record<string, { label: string; emoji: string }> = {
  PROPERTY: { label: "Properti", emoji: "🏠" },
  VEHICLE: { label: "Kendaraan", emoji: "🚗" },
  GOLD: { label: "Emas", emoji: "🥇" },
  SAVINGS: { label: "Tabungan", emoji: "💰" },
  INVESTMENT: { label: "Investasi", emoji: "📈" },
  OTHER: { label: "Lainnya", emoji: "📦" },
}

const ASSET_TYPES = Object.entries(ASSET_TYPE_CONFIG)

export default function AsetPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [totalDebt, setTotalDebt] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)

  // Add form
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState("OTHER")
  const [newValue, setNewValue] = useState("")
  const [addingAsset, setAddingAsset] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [assetsRes, debtRes] = await Promise.all([
        fetch("/api/assets"),
        fetch("/api/debts"),
      ])
      if (!assetsRes.ok) throw new Error("Gagal memuat aset")
      const assetsData = await assetsRes.json()
      setAssets(assetsData.data ?? [])

      if (debtRes.ok) {
        const debtData = await debtRes.json()
        const total = (debtData.data ?? []).reduce((s: number, d: { remainingAmount: number }) => s + Number(d.remainingAmount), 0)
        setTotalDebt(total)
      }
    } catch {
      toast.error("Gagal memuat data aset")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleUpdateValue(assetId: string) {
    const valNum = parseInt(editValue.replace(/\D/g, ""), 10)
    if (!valNum || valNum <= 0) { toast.error("Nilai tidak valid"); return }

    setSavingEdit(true)
    try {
      const res = await fetch(`/api/assets/${assetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: valNum }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? "Gagal update nilai")
      }
      toast.success("Nilai aset berhasil diperbarui")
      setEditingId(null)
      setEditValue("")
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal update")
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleAddAsset(e: React.FormEvent) {
    e.preventDefault()
    const valNum = parseInt(newValue.replace(/\D/g, ""), 10)
    if (!newName.trim()) { toast.error("Nama aset wajib diisi"); return }
    if (!valNum || valNum <= 0) { toast.error("Nilai tidak valid"); return }

    setAddingAsset(true)
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, type: newType, value: valNum }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? "Gagal menambah aset")
      }
      toast.success("Aset berhasil ditambahkan")
      setNewName("")
      setNewType("OTHER")
      setNewValue("")
      setShowForm(false)
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal")
    } finally {
      setAddingAsset(false)
    }
  }

  const totalAssets = assets.reduce((s, a) => s + a.value, 0)
  const netWorth = totalAssets - totalDebt

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Aset</h1>
          <p className="text-muted-foreground text-sm">Total kekayaan bersih keluarga</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          + Tambah Aset
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-muted-foreground">Total Aset</p>
            <p className="text-base font-bold text-green-600">{formatRupiah(totalAssets)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-muted-foreground">Total Hutang</p>
            <p className="text-base font-bold text-red-600">{formatRupiah(totalDebt)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-muted-foreground">Net Worth</p>
            <p className={`text-base font-bold ${netWorth >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatRupiah(netWorth)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Form tambah aset */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tambah Aset Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddAsset} className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Nama Aset</Label>
                <Input placeholder="Contoh: Rumah Medan" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Tipe</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v ?? "")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map(([val, { label, emoji }]) => (
                      <SelectItem key={val} value={val}>{emoji} {label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>Estimasi Nilai (Rp)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="500000000"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" disabled={addingAsset}>{addingAsset ? "Menyimpan..." : "Tambah"}</Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Asset list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Aset</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : assets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada aset. Tambah aset pertama!</p>
          ) : (
            assets.map((asset, i) => {
              const typeConfig = ASSET_TYPE_CONFIG[asset.type] ?? { label: asset.type, emoji: "📦" }
              const isEditing = editingId === asset.id

              return (
                <div key={asset.id}>
                  {i > 0 && <Separator className="mb-3" />}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">{typeConfig.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{asset.name}</p>
                        <Badge variant="outline" className="text-xs">{typeConfig.label}</Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isEditing ? (
                        <>
                          <Input
                            type="text"
                            inputMode="numeric"
                            className="w-32 h-8 text-sm"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value.replace(/\D/g, ""))}
                            placeholder={String(asset.value)}
                            autoFocus
                          />
                          <Button size="icon" className="h-8 w-8" disabled={savingEdit} onClick={() => handleUpdateValue(asset.id)}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingId(null); setEditValue("") }}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-bold">{formatRupiah(asset.value)}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => { setEditingId(asset.id); setEditValue(String(asset.value)) }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </>
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
