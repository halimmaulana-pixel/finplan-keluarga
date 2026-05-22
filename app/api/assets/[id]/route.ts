import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

const updateAssetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["PROPERTY", "VEHICLE", "GOLD", "SAVINGS", "INVESTMENT", "OTHER"]).optional(),
  value: z.number().min(0).optional(),
  linkedDebtId: z.string().nullable().optional(),
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
    const parsed = updateAssetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" }, { status: 400 })
    }

    const existing = await prisma.asset.findFirst({ where: { id, familyId: session.id } })
    if (!existing) return NextResponse.json({ error: "Aset tidak ditemukan" }, { status: 404 })

    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

    const newValue = parsed.data.value ?? Number(existing.value)

    const [updated] = await prisma.$transaction([
      prisma.asset.update({
        where: { id },
        data: parsed.data,
        select: { id: true, name: true, type: true, value: true, linkedDebtId: true },
      }),
      prisma.assetSnapshot.upsert({
        where: { assetId_month: { assetId: id, month } },
        create: { assetId: id, month, value: newValue },
        update: { value: newValue },
      }),
    ])

    return NextResponse.json({ data: { ...updated, value: Number(updated.value) } })
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

    const existing = await prisma.asset.findFirst({ where: { id, familyId: session.id } })
    if (!existing) return NextResponse.json({ error: "Aset tidak ditemukan" }, { status: 404 })

    await prisma.asset.delete({ where: { id } })

    return NextResponse.json({ data: { success: true } })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
