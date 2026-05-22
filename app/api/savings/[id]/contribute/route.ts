import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

const contributeSchema = z.object({
  amount: z.number().positive(),
  date: z.string().datetime(),
  note: z.string().optional(),
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
    const parsed = contributeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" }, { status: 400 })
    }

    const goal = await prisma.savingsGoal.findFirst({ where: { id, familyId: session.id } })
    if (!goal) return NextResponse.json({ error: "Goal tidak ditemukan" }, { status: 404 })

    const newAmount = Number(goal.currentAmount) + parsed.data.amount

    const [contribution] = await prisma.$transaction([
      prisma.goalContribution.create({
        data: {
          goalId: id,
          amount: parsed.data.amount,
          date: new Date(parsed.data.date),
          note: parsed.data.note,
        },
      }),
      prisma.savingsGoal.update({
        where: { id },
        data: { currentAmount: newAmount },
      }),
    ])

    return NextResponse.json({
      data: {
        contribution: { ...contribution, amount: Number(contribution.amount) },
        newCurrentAmount: newAmount,
        isComplete: newAmount >= Number(goal.targetAmount),
      },
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
