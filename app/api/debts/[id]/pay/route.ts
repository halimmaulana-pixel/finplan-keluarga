import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

const payDebtSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Format month: YYYY-MM"),
  isExtra: z.boolean().optional().default(false),
  amount: z.number().positive().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const parsed = payDebtSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" }, { status: 400 })
    }

    const debt = await prisma.debt.findFirst({ where: { id, familyId: session.id } })
    if (!debt) return NextResponse.json({ error: "Hutang tidak ditemukan" }, { status: 404 })

    const payAmount = parsed.data.amount ?? Number(debt.monthlyPayment)
    const newRemaining = Math.max(0, Number(debt.remainingAmount) - payAmount)
    const newRemainingMonths = Math.max(0, debt.remainingMonths - 1)

    const [payment] = await prisma.$transaction([
      prisma.debtPayment.upsert({
        where: { debtId_month: { debtId: id, month: parsed.data.month } },
        create: {
          debtId: id,
          month: parsed.data.month,
          amount: payAmount,
          paidAt: new Date(),
          isExtra: parsed.data.isExtra,
        },
        update: {
          paidAt: new Date(),
          amount: payAmount,
          isExtra: parsed.data.isExtra,
        },
      }),
      prisma.debt.update({
        where: { id },
        data: {
          remainingAmount: newRemaining,
          remainingMonths: newRemainingMonths,
        },
      }),
    ])

    return NextResponse.json({
      data: {
        payment: { ...payment, amount: Number(payment.amount) },
        newRemainingAmount: newRemaining,
        newRemainingMonths,
      },
    })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
