import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: "Makanan",
  TRANSPORT_CAR: "Transport (mobil)",
  TRANSPORT_MOTOR: "Transport (motor)",
  GROCERY: "Belanja bulanan",
  HEALTH: "Kesehatan",
  EDUCATION: "Pendidikan",
  ENTERTAINMENT: "Hiburan",
  SOCIAL: "Sosial",
  OTHER: "Lainnya",
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

    // Last 7 days
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)

    const families = await prisma.family.findMany({ select: { id: true } })

    const results = await Promise.allSettled(
      families.map(async (family) => {
        const familyId = family.id

        const expenses = await prisma.dailyExpense.findMany({
          where: {
            familyId,
            date: { gte: weekStart, lte: now },
          },
          select: { category: true, amount: true },
        })

        if (expenses.length === 0) return

        const byCategory: Record<string, { total: number; count: number }> = {}
        for (const e of expenses) {
          if (!byCategory[e.category]) byCategory[e.category] = { total: 0, count: 0 }
          byCategory[e.category].total += Number(e.amount)
          byCategory[e.category].count++
        }

        const sorted = Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total)
        const topCategories = sorted.slice(0, 3)

        const weekLabel = weekStart.toLocaleDateString("id-ID", { day: "numeric", month: "short" })
        const todayLabel = now.toLocaleDateString("id-ID", { day: "numeric", month: "short" })
        const totalSpent = sorted.reduce((s, [, v]) => s + v.total, 0)

        const bodyLines = topCategories.map(([cat, { total, count }]) => {
          const label = CATEGORY_LABELS[cat] ?? cat
          return `• ${label}: Rp ${total.toLocaleString("id-ID")} (${count}x)`
        })

        await prisma.insight.create({
          data: {
            familyId,
            type: "PATTERN",
            title: `Ringkasan minggu ini: Rp ${totalSpent.toLocaleString("id-ID")}`,
            body: `Pengeluaran ${weekLabel}–${todayLabel}:\n${bodyLines.join("\n")}\n\nTotal: Rp ${totalSpent.toLocaleString("id-ID")}`,
            severity: "INFO",
            month,
          },
        })
      })
    )

    const failed = results.filter((r) => r.status === "rejected").length
    return NextResponse.json({
      data: { processed: families.length, failed, month },
    })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
