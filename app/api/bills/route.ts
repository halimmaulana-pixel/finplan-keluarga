import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

const createBillSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().positive(),
  dueDay: z.number().int().min(1).max(31),
  category: z.enum(["ELECTRICITY", "INTERNET", "PHONE", "STAFF", "OTHER"]),
})

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const bills = await prisma.bill.findMany({
      where: { familyId: session.id, isActive: true },
      orderBy: { dueDay: "asc" },
      include: {
        payments: {
          where: {
            month: new Date().toISOString().slice(0, 7),
          },
          select: { month: true, paidAt: true, amount: true },
        },
      },
    })

    return NextResponse.json({
      data: bills.map((b) => ({
        ...b,
        amount: Number(b.amount),
        payments: b.payments.map((p) => ({ ...p, amount: Number(p.amount) })),
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
    const parsed = createBillSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" }, { status: 400 })
    }

    const bill = await prisma.bill.create({
      data: {
        familyId: session.id,
        name: parsed.data.name,
        amount: parsed.data.amount,
        dueDay: parsed.data.dueDay,
        category: parsed.data.category,
      },
      select: { id: true, name: true, amount: true, dueDay: true, category: true, isActive: true },
    })

    return NextResponse.json({ data: { ...bill, amount: Number(bill.amount) } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
