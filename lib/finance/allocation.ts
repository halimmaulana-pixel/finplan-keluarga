export interface AllocationRule {
  accountRole: string
  accountName: string
  purpose: string
  amount: number
  priority: number
  isUrgent: boolean
}

export interface AllocationInput {
  incomingAmount: number
  pendingBills: { name: string; amount: number; dueDaysLeft: number }[]
  weeklyTransportBudget: number
  currentTransportBalance: number
  monthlyGroceryBudget: number
  currentGroceryBalance: number
  sinkingFundTarget: number
  currentSinkingFund: number
  emergencyFundTarget: number
  currentEmergencyFund: number
  babyFundMonthly: number
  extraDebtPayment: number
}

export function suggestAllocations(input: AllocationInput): AllocationRule[] {
  const suggestions: AllocationRule[] = []
  let remaining = input.incomingAmount
  let priority = 1

  // 1. Tagihan urgent (< 7 hari)
  for (const bill of input.pendingBills.filter((b) => b.dueDaysLeft <= 7)) {
    const amount = Math.min(bill.amount, remaining)
    if (amount <= 0) continue
    suggestions.push({
      accountRole: "BILLS",
      accountName: "Superbank",
      purpose: bill.name,
      amount,
      priority: priority++,
      isUrgent: true,
    })
    remaining -= amount
  }

  // 2. Transport minggu ini
  const transportNeeded = Math.max(0, input.weeklyTransportBudget - input.currentTransportBalance)
  if (transportNeeded > 0 && remaining > 0) {
    const amount = Math.min(transportNeeded, remaining)
    suggestions.push({
      accountRole: "TRANSPORT",
      accountName: "GoPay",
      purpose: "Transport minggu ini",
      amount,
      priority: priority++,
      isUrgent: false,
    })
    remaining -= amount
  }

  // 3. Belanja bulanan
  const groceryNeeded = Math.max(0, input.monthlyGroceryBudget - input.currentGroceryBalance)
  if (groceryNeeded > 0 && remaining > 0) {
    const amount = Math.min(groceryNeeded, remaining)
    suggestions.push({
      accountRole: "GROCERY",
      accountName: "OVO",
      purpose: "Belanja bulanan",
      amount,
      priority: priority++,
      isUrgent: false,
    })
    remaining -= amount
  }

  // 4. Sinking fund kendaraan (min Rp 100rb jika ada sisa)
  const sinkingNeeded = Math.max(0, input.sinkingFundTarget - input.currentSinkingFund)
  if (sinkingNeeded > 0 && remaining >= 100_000) {
    const amount = Math.min(sinkingNeeded, remaining * 0.2, remaining)
    suggestions.push({
      accountRole: "SAVINGS",
      accountName: "Jenius — Sinking Kendaraan",
      purpose: "Dana sinking kendaraan",
      amount: Math.round(amount),
      priority: priority++,
      isUrgent: false,
    })
    remaining -= amount
  }

  // 5. Dana darurat
  const emergencyNeeded = Math.max(0, input.emergencyFundTarget - input.currentEmergencyFund)
  if (emergencyNeeded > 0 && remaining > 0) {
    const amount = Math.min(emergencyNeeded, remaining * 0.3, remaining)
    suggestions.push({
      accountRole: "SAVINGS",
      accountName: "Jenius — Dana Darurat",
      purpose: "Dana darurat",
      amount: Math.round(amount),
      priority: priority++,
      isUrgent: false,
    })
    remaining -= amount
  }

  // 6. Baby fund
  if (input.babyFundMonthly > 0 && remaining > 0) {
    const amount = Math.min(input.babyFundMonthly, remaining)
    suggestions.push({
      accountRole: "SAVINGS",
      accountName: "Jenius — Baby Fund",
      purpose: "Tabungan anak",
      amount: Math.round(amount),
      priority: priority++,
      isUrgent: false,
    })
    remaining -= amount
  }

  // 7. Percepat hutang
  if (input.extraDebtPayment > 0 && remaining > 0) {
    const amount = Math.min(input.extraDebtPayment, remaining)
    suggestions.push({
      accountRole: "BILLS",
      accountName: "Superbank — Extra Hutang",
      purpose: "Percepat pelunasan hutang",
      amount: Math.round(amount),
      priority: priority++,
      isUrgent: false,
    })
    remaining -= amount
  }

  return suggestions
}
