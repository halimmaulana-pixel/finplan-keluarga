import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

const createWalletEntrySchema = z.object({
  amount: z.number().positive(),
  source: z.string().min(1).max(100),
  date: z.string().datetime(),
})

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const entries = await prisma.walletEntry.findMany({
      where: { familyId: session.id, isAllocated: false },
      orderBy: { date: "desc" },
      include: {
        allocations: {
          select: {
            id: true,
            amount: true,
            purpose: true,
            account: { select: { id: true, name: true, role: true } },
          },
        },
      },
    })

    return NextResponse.json({
      data: entries.map((e) => ({
        ...e,
        amount: Number(e.amount),
        allocations: e.allocations.map((a) => ({ ...a, amount: Number(a.amount) })),
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
    const parsed = createWalletEntrySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" }, { status: 400 })
    }

    const entry = await prisma.walletEntry.create({
      data: {
        familyId: session.id,
        amount: parsed.data.amount,
        source: parsed.data.source,
        date: new Date(parsed.data.date),
      },
      select: { id: true, amount: true, source: true, date: true, isAllocated: true },
    })

    return NextResponse.json({ data: { ...entry, amount: Number(entry.amount) } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
