import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

const createEntrySchema = z.object({
  incomeId: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().datetime(),
  note: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const month = searchParams.get("month")

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

    const entries = await prisma.incomeEntry.findMany({
      where: {
        income: { familyId: session.id },
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      include: { income: { select: { name: true } } },
      orderBy: { date: "desc" },
    })

    return NextResponse.json({
      data: entries.map((e) => ({ ...e, amount: Number(e.amount) })),
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
    const parsed = createEntrySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" }, { status: 400 })
    }

    const income = await prisma.income.findFirst({
      where: { id: parsed.data.incomeId, familyId: session.id },
    })
    if (!income) return NextResponse.json({ error: "Income tidak ditemukan" }, { status: 404 })

    const entry = await prisma.incomeEntry.create({
      data: {
        incomeId: parsed.data.incomeId,
        amount: parsed.data.amount,
        date: new Date(parsed.data.date),
        note: parsed.data.note,
      },
      select: { id: true, incomeId: true, amount: true, date: true, note: true, allocated: true },
    })

    return NextResponse.json({ data: { ...entry, amount: Number(entry.amount) } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
