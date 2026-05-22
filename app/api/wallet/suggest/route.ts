import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { suggestAllocations } from "@/lib/finance/allocation"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const walletEntryId = searchParams.get("walletEntryId")
    if (!walletEntryId) {
      return NextResponse.json({ error: "walletEntryId diperlukan" }, { status: 400 })
    }

    const entry = await prisma.walletEntry.findFirst({
      where: { id: walletEntryId, familyId: session.id },
    })
    if (!entry) return NextResponse.json({ error: "Wallet entry tidak ditemukan" }, { status: 404 })

    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

    const [bills, accounts, debts, goals] = await Promise.all([
      prisma.bill.findMany({
        where: { familyId: session.id, isActive: true },
        include: {
          payments: {
            where: { month: currentMonth },
            select: { paidAt: true },
          },
        },
      }),
      prisma.account.findMany({
        where: { familyId: session.id },
        select: { id: true, name: true, role: true, balance: true },
      }),
      prisma.debt.findMany({
        where: { familyId: session.id },
        select: { monthlyPayment: true, remainingAmount: true },
      }),
      prisma.savingsGoal.findMany({
        where: { familyId: session.id },
        select: { monthlyContrib: true, currentAmount: true, targetAmount: true, name: true },
      }),
    ])

    const pendingBills = bills
      .filter((b) => !b.payments[0]?.paidAt)
      .map((b) => ({
        name: b.name,
        amount: Number(b.amount),
        dueDaysLeft: b.dueDay >= now.getDate() ? b.dueDay - now.getDate() : daysInMonth - now.getDate() + b.dueDay,
      }))

    const transportAccount = accounts.find((a) => a.role === "TRANSPORT")
    const groceryAccount = accounts.find((a) => a.role === "GROCERY")
    const savingsAccount = accounts.find((a) => a.role === "SAVINGS")

    const totalDebtMonthly = debts.reduce((s, d) => s + Number(d.monthlyPayment), 0)
    const emergencyGoal = goals.find((g) => g.name.toLowerCase().includes("darurat"))
    const babyGoal = goals.find((g) => g.name.toLowerCase().includes("baby") || g.name.toLowerCase().includes("anak"))

    const suggestions = suggestAllocations({
      incomingAmount: Number(entry.amount),
      pendingBills,
      weeklyTransportBudget: 200_000,
      currentTransportBalance: Number(transportAccount?.balance ?? 0),
      monthlyGroceryBudget: 1_500_000,
      currentGroceryBalance: Number(groceryAccount?.balance ?? 0),
      sinkingFundTarget: 5_000_000,
      currentSinkingFund: Number(savingsAccount?.balance ?? 0),
      emergencyFundTarget: emergencyGoal ? Number(emergencyGoal.targetAmount) : 0,
      currentEmergencyFund: emergencyGoal ? Number(emergencyGoal.currentAmount) : 0,
      babyFundMonthly: babyGoal ? Number(babyGoal.monthlyContrib) : 0,
      extraDebtPayment: totalDebtMonthly > 0 ? Math.round(totalDebtMonthly * 0.1) : 0,
    })

    return NextResponse.json({ data: { suggestions, accounts } })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
