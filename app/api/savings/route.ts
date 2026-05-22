import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { projectGoalCompletion } from "@/lib/finance/projection"

const createGoalSchema = z.object({
  name: z.string().min(1).max(100),
  targetAmount: z.number().positive(),
  monthlyContrib: z.number().min(0),
  targetDate: z.string().datetime().optional(),
  priority: z.number().int().min(1).optional().default(1),
  emoji: z.string().max(10).optional(),
})

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const goals = await prisma.savingsGoal.findMany({
      where: { familyId: session.id },
      orderBy: [{ priority: "asc" }, { name: "asc" }],
      include: {
        contributions: {
          orderBy: { date: "desc" },
          take: 5,
          select: { id: true, amount: true, date: true, note: true },
        },
      },
    })

    const data = goals.map((g) => {
      const current = Number(g.currentAmount)
      const target = Number(g.targetAmount)
      const monthly = Number(g.monthlyContrib)
      const { monthsLeft, completionDate } = projectGoalCompletion(current, target, monthly)

      return {
        ...g,
        targetAmount: target,
        currentAmount: current,
        monthlyContrib: monthly,
        contributions: g.contributions.map((c) => ({ ...c, amount: Number(c.amount) })),
        projection: {
          progressPercent: target > 0 ? Math.round((current / target) * 100) : 0,
          monthsLeft: isFinite(monthsLeft) ? monthsLeft : null,
          completionDate: completionDate?.toISOString() ?? null,
        },
      }
    })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const parsed = createGoalSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" }, { status: 400 })
    }

    const goal = await prisma.savingsGoal.create({
      data: {
        familyId: session.id,
        name: parsed.data.name,
        targetAmount: parsed.data.targetAmount,
        monthlyContrib: parsed.data.monthlyContrib,
        targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : null,
        priority: parsed.data.priority,
        emoji: parsed.data.emoji,
      },
    })

    return NextResponse.json({
      data: {
        ...goal,
        targetAmount: Number(goal.targetAmount),
        currentAmount: Number(goal.currentAmount),
        monthlyContrib: Number(goal.monthlyContrib),
      },
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
