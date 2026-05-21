export function projectGoalCompletion(
  currentAmount: number,
  targetAmount: number,
  monthlyContrib: number
): { monthsLeft: number; completionDate: Date | null } {
  if (monthlyContrib <= 0) return { monthsLeft: Infinity, completionDate: null }
  const remaining = targetAmount - currentAmount
  if (remaining <= 0) return { monthsLeft: 0, completionDate: new Date() }
  const monthsLeft = Math.ceil(remaining / monthlyContrib)
  const completionDate = new Date()
  completionDate.setMonth(completionDate.getMonth() + monthsLeft)
  return { monthsLeft, completionDate }
}

export function projectDebtPayoff(
  remainingAmount: number,
  monthlyPayment: number,
  extraPayment = 0
): { monthsLeft: number; totalPayment: number } {
  const effective = monthlyPayment + extraPayment
  if (effective <= 0) return { monthsLeft: Infinity, totalPayment: Infinity }
  const monthsLeft = Math.ceil(remainingAmount / effective)
  return { monthsLeft, totalPayment: monthsLeft * effective }
}

export function calcRunway(
  liquidAssets: number,
  monthlyExpense: number
): number {
  if (monthlyExpense <= 0) return Infinity
  return liquidAssets / monthlyExpense
}

export function predictMonthEnd(
  dailyExpenses: { date: Date; amount: number }[],
  totalBudget: number
): { predictedTotal: number; predictedRemaining: number; isAtRisk: boolean } {
  if (dailyExpenses.length === 0) return { predictedTotal: 0, predictedRemaining: totalBudget, isAtRisk: false }

  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysPassed = now.getDate()
  const daysLeft = daysInMonth - daysPassed

  const totalSoFar = dailyExpenses.reduce((s, e) => s + e.amount, 0)
  const dailyAvg = totalSoFar / daysPassed
  const predictedTotal = totalSoFar + dailyAvg * daysLeft
  const predictedRemaining = totalBudget - predictedTotal

  return {
    predictedTotal,
    predictedRemaining,
    isAtRisk: predictedRemaining < 0,
  }
}
