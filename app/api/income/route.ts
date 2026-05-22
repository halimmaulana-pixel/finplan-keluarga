import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

const createIncomeSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().positive(),
  frequency: z.enum(["MONTHLY", "IRREGULAR"]),
})

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const incomes = await prisma.income.findMany({
      where: { familyId: session.id, isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        amount: true,
        frequency: true,
        isActive: true,
        _count: { select: { entries: true } },
      },
    })

    return NextResponse.json({
      data: incomes.map((i) => ({ ...i, amount: Number(i.amount) })),
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
    const parsed = createIncomeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" }, { status: 400 })
    }

    const income = await prisma.income.create({
      data: {
        familyId: session.id,
        name: parsed.data.name,
        amount: parsed.data.amount,
        frequency: parsed.data.frequency,
      },
      select: { id: true, name: true, amount: true, frequency: true, isActive: true },
    })

    return NextResponse.json({ data: { ...income, amount: Number(income.amount) } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
