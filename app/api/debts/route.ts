import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { projectDebtPayoff } from "@/lib/finance/projection"

const createDebtSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["PINJOL", "KPR", "KKB", "PERSONAL", "OTHER"]),
  totalAmount: z.number().positive(),
  remainingAmount: z.number().positive(),
  monthlyPayment: z.number().positive(),
  dueDay: z.number().int().min(1).max(31),
  remainingMonths: z.number().int().positive(),
  startDate: z.string().datetime(),
})

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const debts = await prisma.debt.findMany({
      where: { familyId: session.id },
      orderBy: { remainingMonths: "asc" },
      include: {
        payments: {
          orderBy: { month: "desc" },
          take: 3,
          select: { id: true, month: true, paidAt: true, amount: true, isExtra: true },
        },
      },
    })

    const data = debts.map((d) => {
      const remaining = Number(d.remainingAmount)
      const monthly = Number(d.monthlyPayment)
      const { monthsLeft, totalPayment } = projectDebtPayoff(remaining, monthly)

      return {
        ...d,
        totalAmount: Number(d.totalAmount),
        remainingAmount: remaining,
        monthlyPayment: monthly,
        payments: d.payments.map((p) => ({ ...p, amount: Number(p.amount) })),
        progress: {
          paidPercent: Math.round(((Number(d.totalAmount) - remaining) / Number(d.totalAmount)) * 100),
          monthsLeft,
          totalPayment: isFinite(totalPayment) ? totalPayment : null,
        },
      }
    })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const parsed = createDebtSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" }, { status: 400 })
    }

    const debt = await prisma.debt.create({
      data: {
        familyId: session.id,
        name: parsed.data.name,
        type: parsed.data.type,
        totalAmount: parsed.data.totalAmount,
        remainingAmount: parsed.data.remainingAmount,
        monthlyPayment: parsed.data.monthlyPayment,
        dueDay: parsed.data.dueDay,
        remainingMonths: parsed.data.remainingMonths,
        startDate: new Date(parsed.data.startDate),
      },
    })

    return NextResponse.json({
      data: {
        ...debt,
        totalAmount: Number(debt.totalAmount),
        remainingAmount: Number(debt.remainingAmount),
        monthlyPayment: Number(debt.monthlyPayment),
      },
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
