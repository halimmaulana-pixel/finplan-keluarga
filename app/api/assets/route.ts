import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

const createAssetSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["PROPERTY", "VEHICLE", "GOLD", "SAVINGS", "INVESTMENT", "OTHER"]),
  value: z.number().min(0),
  linkedDebtId: z.string().optional(),
})

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const [assets, debtAgg] = await Promise.all([
      prisma.asset.findMany({
        where: { familyId: session.id },
        orderBy: { value: "desc" },
        select: {
          id: true,
          name: true,
          type: true,
          value: true,
          linkedDebtId: true,
          snapshots: {
            orderBy: { month: "desc" },
            take: 3,
            select: { month: true, value: true },
          },
        },
      }),
      prisma.debt.aggregate({
        where: { familyId: session.id },
        _sum: { remainingAmount: true },
      }),
    ])

    const totalAssetValue = assets.reduce((s, a) => s + Number(a.value), 0)
    const totalDebt = Number(debtAgg._sum.remainingAmount ?? 0)
    const netWorth = totalAssetValue - totalDebt

    return NextResponse.json({
      data: {
        assets: assets.map((a) => ({
          ...a,
          value: Number(a.value),
          snapshots: a.snapshots.map((s) => ({ ...s, value: Number(s.value) })),
        })),
        summary: {
          totalAssetValue,
          totalDebt,
          netWorth,
        },
      },
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
    const parsed = createAssetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" }, { status: 400 })
    }

    if (parsed.data.linkedDebtId) {
      const debt = await prisma.debt.findFirst({
        where: { id: parsed.data.linkedDebtId, familyId: session.id },
      })
      if (!debt) return NextResponse.json({ error: "Hutang terkait tidak ditemukan" }, { status: 404 })
    }

    const asset = await prisma.asset.create({
      data: {
        familyId: session.id,
        name: parsed.data.name,
        type: parsed.data.type,
        value: parsed.data.value,
        linkedDebtId: parsed.data.linkedDebtId,
      },
      select: { id: true, name: true, type: true, value: true, linkedDebtId: true },
    })

    return NextResponse.json({ data: { ...asset, value: Number(asset.value) } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
