"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { formatRupiah } from "@/lib/currency"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus } from "lucide-react"

interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  monthlyContrib: number
  targetDate: string | null
  priority: number
  emoji: string | null
}

function estimateCompletion(goal: SavingsGoal): string {
  const remaining = goal.targetAmount - goal.currentAmount
  if (remaining <= 0) return "Sudah tercapai!"
  if (goal.monthlyContrib <= 0) return "Kontribusi belum diset"
  const months = Math.ceil(remaining / goal.monthlyContrib)
  const target = new Date()
  target.setMonth(target.getMonth() + months)
  return `~${target.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`
}

export default function TabunganPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [contributingId, setContributingId] = useState<string | null>(null)
  const [contributeAmount, setContributeAmount] = useState("")
  const [submittingContrib, setSubmittingContrib] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  // New goal form
  const [newName, setNewName] = useState("")
  const [newTarget, setNewTarget] = useState("")
  const [newContrib, setNewContrib] = useState("")
  const [newTargetDate, setNewTargetDate] = useState("")
  const [newEmoji, setNewEmoji] = useState("🎯")
  const [addingGoal, setAddingGoal] = useState(false)

  const fetchGoals = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/savings")
      if (!res.ok) throw new Error("Gagal memuat tabungan")
      const data = await res.json()
      setGoals(data.data ?? [])
    } catch {
      toast.error("Gagal memuat data tabungan")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  async function handleContribute(goalId: string) {
    const amountNum = parseInt(contributeAmount.replace(/\D/g, ""), 10)
    if (!amountNum || amountNum <= 0) { toast.error("Jumlah tidak valid"); return }

    setSubmittingContrib(true)
    try {
      const res = await fetch(`/api/savings/${goalId}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountNum, date: new Date().toISOString().split("T")[0] }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? "Gagal menambah kontribusi")
      }
      toast.success("Kontribusi berhasil ditambahkan")
      setContributingId(null)
      setContributeAmount("")
      fetchGoals()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal")
    } finally {
      setSubmittingContrib(false)
    }
  }

  async function handleAddGoal(e: React.FormEvent) {
    e.preventDefault()
    const targetNum = parseInt(newTarget.replace(/\D/g, ""), 10)
    const contribNum = parseInt(newContrib.replace(/\D/g, ""), 10)
    if (!newName.trim()) { toast.error("Nama goal wajib diisi"); return }
    if (!targetNum || targetNum <= 0) { toast.error("Target amount tidak valid"); return }

    setAddingGoal(true)
    try {
      const res = await fetch("/api/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          targetAmount: targetNum,
          monthlyContrib: contribNum || 0,
          targetDate: newTargetDate || null,
          emoji: newEmoji,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? "Gagal membuat goal")
      }
      toast.success("Goal tabungan berhasil dibuat")
      setNewName("")
      setNewTarget("")
      setNewContrib("")
      setNewTargetDate("")
      setNewEmoji("🎯")
      setShowAddForm(false)
      fetchGoals()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal")
    } finally {
      setAddingGoal(false)
    }
  }

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0)
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0)

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tabungan & Goals</h1>
          <p className="text-muted-foreground text-sm">
            {formatRupiah(totalSaved)} dari {formatRupiah(totalTarget)}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-1" />
          Tambah Goal
        </Button>
      </div>

      {/* Form tambah goal */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Goal Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddGoal} className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Nama Goal</Label>
                <Input placeholder="Contoh: Dana Darurat" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Emoji</Label>
                <Input placeholder="🎯" value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} maxLength={2} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Target (Rp)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="50000000"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Kontribusi Bulanan (Rp)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="1000000"
                  value={newContrib}
                  onChange={(e) => setNewContrib(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>Target Tanggal (opsional)</Label>
                <Input type="date" value={newTargetDate} onChange={(e) => setNewTargetDate(e.target.value)} />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" disabled={addingGoal}>
                  {addingGoal ? "Menyimpan..." : "Buat Goal"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>Batal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Goals list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Goal Tabungan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada goal tabungan. Buat goal pertama!</p>
          ) : (
            goals.map((goal, i) => {
              const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
              const isDone = goal.currentAmount >= goal.targetAmount
              const estimation = estimateCompletion(goal)

              return (
                <div key={goal.id}>
                  {i > 0 && <Separator className="mb-5" />}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{goal.emoji ?? "🎯"}</span>
                          <span className="font-medium text-sm">{goal.name}</span>
                          {isDone && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                              Tercapai!
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {estimation}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">{formatRupiah(goal.currentAmount)}</p>
                        <p className="text-xs text-muted-foreground">dari {formatRupiah(goal.targetAmount)}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{pct.toFixed(1)}%</span>
                        <span>{formatRupiah(goal.monthlyContrib)}/bln</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>

                    {contributingId === goal.id ? (
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label className="text-xs">Jumlah Kontribusi</Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="500000"
                            value={contributeAmount}
                            onChange={(e) => setContributeAmount(e.target.value.replace(/\D/g, ""))}
                            className="mt-1"
                          />
                        </div>
                        <Button
                          size="sm"
                          disabled={submittingContrib}
                          onClick={() => handleContribute(goal.id)}
                        >
                          {submittingContrib ? "..." : "Simpan"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setContributingId(null); setContributeAmount("") }}
                        >
                          Batal
                        </Button>
                      </div>
                    ) : (
                      !isDone && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setContributingId(goal.id)}
                        >
                          + Tambah Kontribusi
                        </Button>
                      )
                    )}
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
