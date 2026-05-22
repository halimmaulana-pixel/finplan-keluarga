import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { calcConsumptiveRate } from "@/lib/ml/classifier"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const month = searchParams.get("month")

    let dateFilter: { gte: Date; lt: Date }
    if (month) {
      const match = /^(\d{4})-(\d{2})$/.exec(month)
      if (!match) {
        return NextResponse.json({ error: "Format bulan tidak valid (gunakan YYYY-MM)" }, { status: 400 })
      }
      const year = parseInt(match[1]!, 10)
      const mo = parseInt(match[2]!, 10) - 1
      dateFilter = {
        gte: new Date(year, mo, 1),
        lt: new Date(year, mo + 1, 1),
      }
    } else {
      const now = new Date()
      dateFilter = {
        gte: new Date(now.getFullYear(), now.getMonth(), 1),
        lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      }
    }

    const expenses = await prisma.dailyExpense.findMany({
      where: { familyId: session.id, date: dateFilter },
      select: { category: true, amount: true, isConsumptive: true },
    })

    const grouped: Record<string, { total: number; count: number; items: { amount: number; isConsumptive: boolean | null }[] }> = {}

    for (const e of expenses) {
      const cat = e.category
      if (!grouped[cat]) grouped[cat] = { total: 0, count: 0, items: [] }
      grouped[cat].total += Number(e.amount)
      grouped[cat].count++
      grouped[cat].items.push({ amount: Number(e.amount), isConsumptive: e.isConsumptive })
    }

    const summary = Object.entries(grouped).map(([category, { total, count, items }]) => ({
      category,
      total,
      count,
      consumptiveRate: calcConsumptiveRate(items),
    })).sort((a, b) => b.total - a.total)

    const grandTotal = summary.reduce((s, c) => s + c.total, 0)

    return NextResponse.json({
      data: {
        byCategory: summary,
        grandTotal,
        month: month ?? new Date().toISOString().slice(0, 7),
      },
    })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
