import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

const updateIncomeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  amount: z.number().positive().optional(),
  frequency: z.enum(["MONTHLY", "IRREGULAR"]).optional(),
  isActive: z.boolean().optional(),
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
    const parsed = updateIncomeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" }, { status: 400 })
    }

    const existing = await prisma.income.findFirst({
      where: { id, familyId: session.id },
    })
    if (!existing) return NextResponse.json({ error: "Income tidak ditemukan" }, { status: 404 })

    const updated = await prisma.income.update({
      where: { id },
      data: parsed.data,
      select: { id: true, name: true, amount: true, frequency: true, isActive: true },
    })

    return NextResponse.json({ data: { ...updated, amount: Number(updated.amount) } })
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

    const existing = await prisma.income.findFirst({
      where: { id, familyId: session.id },
    })
    if (!existing) return NextResponse.json({ error: "Income tidak ditemukan" }, { status: 404 })

    await prisma.income.delete({ where: { id } })

    return NextResponse.json({ data: { success: true } })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
