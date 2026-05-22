import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { classifyExpense } from "@/lib/ml/classifier"

const VALID_CATEGORIES = [
  "FOOD", "TRANSPORT_CAR", "TRANSPORT_MOTOR", "GROCERY",
  "HEALTH", "EDUCATION", "ENTERTAINMENT", "SOCIAL", "OTHER",
] as const

const createExpenseSchema = z.object({
  date: z.string().datetime(),
  amount: z.number().positive(),
  category: z.enum(VALID_CATEGORIES),
  subcategory: z.string().optional(),
  note: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const month = searchParams.get("month")
    const category = searchParams.get("category")

    let dateFilter: { gte: Date; lt: Date } | undefined
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
    }

    const expenses = await prisma.dailyExpense.findMany({
      where: {
        familyId: session.id,
        ...(dateFilter ? { date: dateFilter } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: { date: "desc" },
    })

    return NextResponse.json({
      data: expenses.map((e) => ({
        ...e,
        amount: Number(e.amount),
        consumptiveScore: e.consumptiveScore !== null ? Number(e.consumptiveScore) : null,
      })),
    })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const parsed = createExpenseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" }, { status: 400 })
    }

    const classification = classifyExpense(parsed.data.category, parsed.data.amount)

    const expense = await prisma.dailyExpense.create({
      data: {
        familyId: session.id,
        date: new Date(parsed.data.date),
        amount: parsed.data.amount,
        category: parsed.data.category,
        subcategory: parsed.data.subcategory,
        note: parsed.data.note,
        isConsumptive: classification.isConsumptive,
        consumptiveScore: classification.score,
      },
    })

    return NextResponse.json({
      data: {
        ...expense,
        amount: Number(expense.amount),
        consumptiveScore: expense.consumptiveScore !== null ? Number(expense.consumptiveScore) : null,
        classification,
      },
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
