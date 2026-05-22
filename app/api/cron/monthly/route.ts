import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { calcHealthScore } from "@/lib/ml/scorer"
import { calcConsumptiveRate } from "@/lib/ml/classifier"

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()
    // Run for the previous month (since monthly cron fires at month start)
    const reportDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const month = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, "0")}`
    const monthStart = new Date(reportDate.getFullYear(), reportDate.getMonth(), 1)
    const monthEnd = new Date(reportDate.getFullYear(), reportDate.getMonth() + 1, 1)
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

    const families = await prisma.family.findMany({ select: { id: true } })

    const results = await Promise.allSettled(
      families.map(async (family) => {
        const familyId = family.id

        const [
          incomeAgg,
          expenses,
          debtAgg,
          assets,
          savingsGoals,
          overdueCount,
        ] = await Promise.all([
          prisma.incomeEntry.aggregate({
            where: { income: { familyId }, date: { gte: monthStart, lt: monthEnd } },
            _sum: { amount: true },
          }),
          prisma.dailyExpense.findMany({
            where: { familyId, date: { gte: monthStart, lt: monthEnd } },
            select: { amount: true, isConsumptive: true },
          }),
          prisma.debt.aggregate({
            where: { familyId },
            _sum: { remainingAmount: true, monthlyPayment: true },
          }),
          prisma.asset.findMany({
            where: { familyId },
            select: { id: true, value: true },
          }),
          prisma.savingsGoal.findMany({
            where: { familyId },
            select: { currentAmount: true, targetAmount: true },
          }),
          prisma.billPayment.count({
            where: { bill: { familyId }, month, paidAt: null },
          }),
        ])

        const monthlyIncome = Number(incomeAgg._sum.amount ?? 0)
        const monthlyExpense = expenses.reduce((s, e) => s + Number(e.amount), 0)
        const monthlyDebtPayment = Number(debtAgg._sum.monthlyPayment ?? 0)
        const totalAssetValue = assets.reduce((s, a) => s + Number(a.value), 0)
        const totalDebt = Number(debtAgg._sum.remainingAmount ?? 0)
        const netWorth = totalAssetValue - totalDebt

        const consumptiveRate = calcConsumptiveRate(
          expenses.map((e) => ({ amount: Number(e.amount), isConsumptive: e.isConsumptive }))
        )

        const emergencyGoal = savingsGoals[0]
        const emergencyFundAmount = emergencyGoal ? Number(emergencyGoal.currentAmount) : 0
        const emergencyFundTarget = emergencyGoal ? Number(emergencyGoal.targetAmount) : monthlyExpense * 6

        const healthResult = calcHealthScore({
          monthlyIncome,
          monthlyExpense,
          monthlyDebtPayment,
          emergencyFundAmount,
          emergencyFundTarget,
          overdueCount,
          consumptiveRate,
        })

        // Snapshot all assets for this month
        await Promise.all(
          assets.map((asset) =>
            prisma.assetSnapshot.upsert({
              where: { assetId_month: { assetId: asset.id, month } },
              create: { assetId: asset.id, month, value: Number(asset.value) },
              update: { value: Number(asset.value) },
            })
          )
        )

        // Upsert monthly report
        await prisma.monthlyReport.upsert({
          where: { familyId_month: { familyId, month } },
          create: {
            familyId,
            month,
            totalIncome: monthlyIncome,
            totalExpense: monthlyExpense,
            totalSaved: Math.max(0, monthlyIncome - monthlyExpense - monthlyDebtPayment),
            netWorth,
            healthScore: healthResult.score,
            consumptiveRate,
            insights: healthResult.breakdown,
          },
          update: {
            totalIncome: monthlyIncome,
            totalExpense: monthlyExpense,
            totalSaved: Math.max(0, monthlyIncome - monthlyExpense - monthlyDebtPayment),
            netWorth,
            healthScore: healthResult.score,
            consumptiveRate,
            insights: healthResult.breakdown,
          },
        })

        // Generate monthly summary insight
        const savedAmount = Math.max(0, monthlyIncome - monthlyExpense - monthlyDebtPayment)
        const savingRate = monthlyIncome > 0 ? (savedAmount / monthlyIncome) * 100 : 0

        await prisma.insight.create({
          data: {
            familyId,
            type: "PATTERN",
            title: `Laporan bulanan ${month}: skor ${healthResult.score} (${healthResult.label})`,
            body: [
              `Pemasukan: Rp ${monthlyIncome.toLocaleString("id-ID")}`,
              `Pengeluaran: Rp ${monthlyExpense.toLocaleString("id-ID")}`,
              `Ditabung: Rp ${savedAmount.toLocaleString("id-ID")} (${savingRate.toFixed(0)}%)`,
              `Net worth: Rp ${netWorth.toLocaleString("id-ID")}`,
              `Skor kesehatan: ${healthResult.score}/100 — ${healthResult.label}`,
            ].join("\n"),
            severity: healthResult.score < 50 ? "WARNING" : "INFO",
            month: currentMonth,
          },
        })
      })
    )

    const failed = results.filter((r) => r.status === "rejected").length
    return NextResponse.json({
      data: { processed: families.length, failed, month },
    })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
