import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

const updateGoalSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  targetAmount: z.number().positive().optional(),
  monthlyContrib: z.number().min(0).optional(),
  targetDate: z.string().datetime().nullable().optional(),
  priority: z.number().int().min(1).optional(),
  emoji: z.string().max(10).nullable().optional(),
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
    const parsed = updateGoalSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" }, { status: 400 })
    }

    const existing = await prisma.savingsGoal.findFirst({ where: { id, familyId: session.id } })
    if (!existing) return NextResponse.json({ error: "Goal tidak ditemukan" }, { status: 404 })

    const { targetDate, ...rest } = parsed.data

    const updated = await prisma.savingsGoal.update({
      where: { id },
      data: {
        ...rest,
        ...(targetDate !== undefined ? { targetDate: targetDate ? new Date(targetDate) : null } : {}),
      },
    })

    return NextResponse.json({
      data: {
        ...updated,
        targetAmount: Number(updated.targetAmount),
        currentAmount: Number(updated.currentAmount),
        monthlyContrib: Number(updated.monthlyContrib),
      },
    })
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

    const existing = await prisma.savingsGoal.findFirst({ where: { id, familyId: session.id } })
    if (!existing) return NextResponse.json({ error: "Goal tidak ditemukan" }, { status: 404 })

    await prisma.savingsGoal.delete({ where: { id } })

    return NextResponse.json({ data: { success: true } })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
