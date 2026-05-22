"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function MasukPage() {
  const router = useRouter()
  const [familyCode, setFamilyCode] = useState("")
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!familyCode.trim()) {
      toast.error("Nama keluarga tidak boleh kosong")
      return
    }
    if (pin.length < 4) {
      toast.error("PIN minimal 4 digit")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyCode, pin }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Login gagal")
        return
      }
      toast.success(`Selamat datang, Keluarga ${data.data.name}!`)
      router.push("/dashboard")
      router.refresh()
    } catch {
      toast.error("Tidak dapat terhubung ke server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 text-4xl font-bold tracking-tight">💰 FinPlan</div>
        <CardTitle className="text-xl">Masuk ke Akun</CardTitle>
        <CardDescription>Gunakan nama keluarga dan PIN untuk masuk</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="familyCode">Nama Keluarga</Label>
            <Input
              id="familyCode"
              type="text"
              placeholder="Contoh: Keluarga Maulana"
              value={familyCode}
              onChange={(e) => setFamilyCode(e.target.value)}
              autoComplete="username"
              disabled={loading}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type="password"
              placeholder="4–6 digit PIN"
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6)
                setPin(val)
              }}
              inputMode="numeric"
              maxLength={6}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Memverifikasi..." : "Masuk"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link href="/setup/1" className="ml-1 text-foreground underline underline-offset-4 hover:no-underline">
          Buat sekarang
        </Link>
      </CardFooter>
    </Card>
  )
}
