import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { hashPin, getSession, setSession } from "@/lib/auth"

const createFamilySchema = z.object({
  name: z.string().min(1).max(100),
  pin: z.string().min(4).max(8),
  startMonth: z.string().regex(/^\d{4}-\d{2}$/, "Format startMonth: YYYY-MM"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = createFamilySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" }, { status: 400 })
    }

    const { name, pin, startMonth } = parsed.data

    const existing = await prisma.family.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    })
    if (existing) {
      return NextResponse.json({ error: "Nama keluarga sudah dipakai" }, { status: 409 })
    }

    const pinHash = await hashPin(pin)
    const [year, month] = startMonth.split("-").map(Number) as [number, number]

    const family = await prisma.family.create({
      data: {
        name,
        pinHash,
        startMonth: new Date(year, month - 1, 1),
      },
      select: { id: true, name: true, startMonth: true },
    })

    await setSession(family.id)

    return NextResponse.json({ data: family }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const [family, incomeAgg, billAgg, debtAgg] = await Promise.all([
      prisma.family.findUnique({
        where: { id: session.id },
        select: { id: true, name: true, startMonth: true, createdAt: true },
      }),
      prisma.income.aggregate({
        where: { familyId: session.id, isActive: true },
        _sum: { amount: true },
      }),
      prisma.bill.aggregate({
        where: { familyId: session.id, isActive: true },
        _sum: { amount: true },
      }),
      prisma.debt.aggregate({
        where: { familyId: session.id },
        _sum: { remainingAmount: true, monthlyPayment: true },
      }),
    ])

    if (!family) return NextResponse.json({ error: "Family tidak ditemukan" }, { status: 404 })

    return NextResponse.json({
      data: {
        ...family,
        summary: {
          totalIncome: Number(incomeAgg._sum.amount ?? 0),
          totalBills: Number(billAgg._sum.amount ?? 0),
          totalDebtRemaining: Number(debtAgg._sum.remainingAmount ?? 0),
          totalMonthlyDebtPayment: Number(debtAgg._sum.monthlyPayment ?? 0),
        },
      },
    })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
