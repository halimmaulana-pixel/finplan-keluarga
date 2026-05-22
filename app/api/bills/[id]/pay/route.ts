import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

const payBillSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Format month: YYYY-MM"),
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
    const parsed = payBillSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" }, { status: 400 })
    }

    const bill = await prisma.bill.findFirst({ where: { id, familyId: session.id } })
    if (!bill) return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 })

    const payment = await prisma.billPayment.upsert({
      where: { billId_month: { billId: id, month: parsed.data.month } },
      create: {
        billId: id,
        month: parsed.data.month,
        amount: bill.amount,
        paidAt: new Date(),
      },
      update: {
        paidAt: new Date(),
        amount: bill.amount,
      },
      select: { id: true, billId: true, month: true, paidAt: true, amount: true },
    })

    return NextResponse.json({ data: { ...payment, amount: Number(payment.amount) } })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
