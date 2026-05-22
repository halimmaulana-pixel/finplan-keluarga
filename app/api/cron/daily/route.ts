import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { detectAnomalies } from "@/lib/ml/anomaly"
import { calcHealthScore } from "@/lib/ml/scorer"
import { calcConsumptiveRate } from "@/lib/ml/classifier"
import { anomalyInsight, runwayInsight } from "@/lib/ml/templates"
import { predictMonthEnd, calcRunway } from "@/lib/finance/projection"

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const prevMonths = Array.from({ length: 3 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i - 1, 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    })

    const families = await prisma.family.findMany({ select: { id: true } })

    const results = await Promise.allSettled(
      families.map(async (family) => {
        const familyId = family.id

        const [
          incomeAgg,
          expenses,
          debtAgg,
          savingsGoals,
          assets,
          overdueCount,
          prevExpenses,
        ] = await Promise.all([
          prisma.incomeEntry.aggregate({
            where: { income: { familyId }, date: { gte: monthStart, lt: monthEnd } },
            _sum: { amount: true },
          }),
          prisma.dailyExpense.findMany({
            where: { familyId, date: { gte: monthStart, lt: monthEnd } },
            select: { date: true, amount: true, category: true, isConsumptive: true },
          }),
          prisma.debt.aggregate({
            where: { familyId },
            _sum: { monthlyPayment: true, remainingAmount: true },
          }),
          prisma.savingsGoal.findMany({
            where: { familyId },
            select: { currentAmount: true, targetAmount: true },
          }),
          prisma.asset.aggregate({
            where: { familyId },
            _sum: { value: true },
          }),
          prisma.billPayment.count({
            where: {
              bill: { familyId },
              month,
              paidAt: null,
            },
          }),
          prisma.dailyExpense.findMany({
            where: {
              familyId,
              date: {
                gte: new Date(now.getFullYear(), now.getMonth() - 3, 1),
                lt: monthStart,
              },
            },
            select: { category: true, amount: true, date: true },
          }),
        ])

        const monthlyIncome = Number(incomeAgg._sum.amount ?? 0)
        const monthlyExpense = expenses.reduce((s, e) => s + Number(e.amount), 0)
        const monthlyDebtPayment = Number(debtAgg._sum.monthlyPayment ?? 0)
        const totalAssets = Number(assets._sum.value ?? 0)
        const totalDebt = Number(debtAgg._sum.remainingAmount ?? 0)

        const emergencyGoal = savingsGoals[0]
        const emergencyFundAmount = emergencyGoal ? Number(emergencyGoal.currentAmount) : 0
        const emergencyFundTarget = emergencyGoal ? Number(emergencyGoal.targetAmount) : monthlyExpense * 6

        const consumptiveRate = calcConsumptiveRate(
          expenses.map((e) => ({ amount: Number(e.amount), isConsumptive: e.isConsumptive }))
        )

        const healthResult = calcHealthScore({
          monthlyIncome,
          monthlyExpense,
          monthlyDebtPayment,
          emergencyFundAmount,
          emergencyFundTarget,
          overdueCount,
          consumptiveRate,
        })

        await prisma.monthlyReport.upsert({
          where: { familyId_month: { familyId, month } },
          create: {
            familyId,
            month,
            totalIncome: monthlyIncome,
            totalExpense: monthlyExpense,
            totalSaved: Math.max(0, monthlyIncome - monthlyExpense - monthlyDebtPayment),
            netWorth: totalAssets - totalDebt,
            healthScore: healthResult.score,
            consumptiveRate,
            insights: healthResult.breakdown,
          },
          update: {
            totalIncome: monthlyIncome,
            totalExpense: monthlyExpense,
            totalSaved: Math.max(0, monthlyIncome - monthlyExpense - monthlyDebtPayment),
            netWorth: totalAssets - totalDebt,
            healthScore: healthResult.score,
            consumptiveRate,
            insights: healthResult.breakdown,
          },
        })

        // Detect anomalies
        const currentByCategory: Record<string, number> = {}
        for (const e of expenses) {
          currentByCategory[e.category] = (currentByCategory[e.category] ?? 0) + Number(e.amount)
        }

        const historicalByCategory: Record<string, number[]> = {}
        for (const e of prevExpenses) {
          const mo = `${new Date(e.date).getFullYear()}-${String(new Date(e.date).getMonth() + 1).padStart(2, "0")}`
          if (!prevMonths.includes(mo)) continue
          if (!historicalByCategory[e.category]) historicalByCategory[e.category] = []
          historicalByCategory[e.category].push(Number(e.amount))
        }

        const anomalies = detectAnomalies(currentByCategory, historicalByCategory)

        for (const anomaly of anomalies) {
          const { title, body } = anomalyInsight(anomaly)
          await prisma.insight.create({
            data: {
              familyId,
              type: "ANOMALY",
              category: anomaly.category,
              title,
              body,
              severity: anomaly.severity,
              month,
            },
          })
        }

        // Predict month end
        const dailyExpenses = expenses.map((e) => ({
          date: new Date(e.date),
          amount: Number(e.amount),
        }))
        const totalBudget = monthlyIncome - monthlyDebtPayment
        const prediction = predictMonthEnd(dailyExpenses, totalBudget)

        if (prediction.isAtRisk) {
          await prisma.insight.create({
            data: {
              familyId,
              type: "PREDICTION",
              title: "Pengeluaran melebihi anggaran bulan ini",
              body: `Proyeksi akhir bulan: pengeluaran Rp ${Math.round(prediction.predictedTotal).toLocaleString("id-ID")}. Sisa anggaran diperkirakan negatif (Rp ${Math.round(prediction.predictedRemaining).toLocaleString("id-ID")}).`,
              severity: "WARNING",
              month,
            },
          })
        }

        // Runway insight — delete stale and recreate to avoid duplicate constraint issues
        const runwayMonths = calcRunway(emergencyFundAmount, monthlyExpense)
        const runwayBody = runwayInsight(runwayMonths)
        const existingRunway = await prisma.insight.findFirst({
          where: { familyId, month, type: "RECOMMENDATION", title: "Status dana darurat" },
          select: { id: true },
        })
        if (existingRunway) {
          await prisma.insight.update({
            where: { id: existingRunway.id },
            data: { body: runwayBody, severity: runwayMonths < 3 ? "WARNING" : "INFO" },
          })
        } else {
          await prisma.insight.create({
            data: {
              familyId,
              type: "RECOMMENDATION",
              title: "Status dana darurat",
              body: runwayBody,
              severity: runwayMonths < 3 ? "WARNING" : "INFO",
              month,
            },
          })
        }
      })
    )

    const failed = results.filter((r) => r.status === "rejected").length
    return NextResponse.json({
      data: {
        processed: families.length,
        failed,
        month,
      },
    })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
