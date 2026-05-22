import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { classifyExpense } from "@/lib/ml/classifier"

const VALID_CATEGORIES = [
  "FOOD", "TRANSPORT_CAR", "TRANSPORT_MOTOR", "GROCERY",
  "HEALTH", "EDUCATION", "ENTERTAINMENT", "SOCIAL", "OTHER",
] as const

const updateExpenseSchema = z.object({
  date: z.string().datetime().optional(),
  amount: z.number().positive().optional(),
  category: z.enum(VALID_CATEGORIES).optional(),
  subcategory: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const parsed = updateExpenseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" }, { status: 400 })
    }

    const existing = await prisma.dailyExpense.findFirst({ where: { id, familyId: session.id } })
    if (!existing) return NextResponse.json({ error: "Pengeluaran tidak ditemukan" }, { status: 404 })

    const newCategory = parsed.data.category ?? existing.category
    const newAmount = parsed.data.amount ?? Number(existing.amount)
    const classification = classifyExpense(newCategory, newAmount)

    const { date, ...restData } = parsed.data

    const updated = await prisma.dailyExpense.update({
      where: { id },
      data: {
        ...restData,
        ...(date ? { date: new Date(date) } : {}),
        isConsumptive: classification.isConsumptive,
        consumptiveScore: classification.score,
      },
    })

    return NextResponse.json({
      data: {
        ...updated,
        amount: Number(updated.amount),
        consumptiveScore: updated.consumptiveScore !== null ? Number(updated.consumptiveScore) : null,
      },
    })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const existing = await prisma.dailyExpense.findFirst({ where: { id, familyId: session.id } })
    if (!existing) return NextResponse.json({ error: "Pengeluaran tidak ditemukan" }, { status: 404 })

    await prisma.dailyExpense.delete({ where: { id } })

    return NextResponse.json({ data: { success: true } })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
