export interface HealthScoreInput {
  monthlyIncome: number
  monthlyExpense: number
  monthlyDebtPayment: number
  emergencyFundAmount: number
  emergencyFundTarget: number
  overdueCount: number
  consumptiveRate: number
}

export interface HealthScoreResult {
  score: number
  label: "Kritis" | "Waspada" | "Aman" | "Sehat" | "Sangat Sehat"
  breakdown: {
    savingRate: { score: number; label: string }
    debtRatio: { score: number; label: string }
    emergencyFund: { score: number; label: string }
    billsOnTime: { score: number; label: string }
    consumptive: { score: number; label: string }
  }
}

export function calcHealthScore(input: HealthScoreInput): HealthScoreResult {
  let score = 100

  const savingRate =
    input.monthlyIncome > 0
      ? (input.monthlyIncome - input.monthlyExpense) / input.monthlyIncome
      : 0

  const debtRatio =
    input.monthlyIncome > 0
      ? input.monthlyDebtPayment / input.monthlyIncome
      : 1

  const emergencyRatio =
    input.emergencyFundTarget > 0
      ? input.emergencyFundAmount / input.emergencyFundTarget
      : 0

  // Saving rate penalty
  let savingScore = 25
  if (savingRate < 0) { score -= 30; savingScore = 0 }
  else if (savingRate < 0.1) { score -= 20; savingScore = 5 }
  else if (savingRate < 0.2) { score -= 10; savingScore = 15 }

  // Debt ratio penalty
  let debtScore = 25
  if (debtRatio > 0.5) { score -= 25; debtScore = 0 }
  else if (debtRatio > 0.3) { score -= 10; debtScore = 15 }

  // Emergency fund penalty
  let emergencyScore = 25
  if (emergencyRatio < 0.1) { score -= 20; emergencyScore = 0 }
  else if (emergencyRatio < 0.5) { score -= 10; emergencyScore = 10 }

  // Overdue bills penalty
  const overdueScore = Math.max(0, 15 - input.overdueCount * 5)
  score -= 15 - overdueScore

  // Consumptive rate penalty
  let consumptiveScore = 10
  if (input.consumptiveRate > 0.3) { score -= 10; consumptiveScore = 0 }
  else if (input.consumptiveRate > 0.2) { score -= 5; consumptiveScore = 5 }

  score = Math.max(0, Math.min(100, score))

  let label: HealthScoreResult["label"] = "Sehat"
  if (score < 30) label = "Kritis"
  else if (score < 50) label = "Waspada"
  else if (score < 70) label = "Aman"
  else if (score < 85) label = "Sehat"
  else label = "Sangat Sehat"

  return {
    score,
    label,
    breakdown: {
      savingRate: { score: savingScore, label: `${(savingRate * 100).toFixed(0)}% dari income` },
      debtRatio: { score: debtScore, label: `${(debtRatio * 100).toFixed(0)}% dari income` },
      emergencyFund: { score: emergencyScore, label: `${(emergencyRatio * 100).toFixed(0)}% dari target` },
      billsOnTime: { score: overdueScore, label: `${input.overdueCount} tagihan terlambat` },
      consumptive: { score: consumptiveScore, label: `${(input.consumptiveRate * 100).toFixed(0)}% konsumtif` },
    },
  }
}
