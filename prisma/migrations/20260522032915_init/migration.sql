-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "startMonth" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Income" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "frequency" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Income_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomeEntry" (
    "id" TEXT NOT NULL,
    "incomeId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "allocated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "IncomeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "dueDay" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillPayment" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "amount" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "BillPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Debt" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "remainingAmount" DECIMAL(15,2) NOT NULL,
    "monthlyPayment" DECIMAL(15,2) NOT NULL,
    "dueDay" INTEGER NOT NULL,
    "remainingMonths" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Debt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebtPayment" (
    "id" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "amount" DECIMAL(15,2) NOT NULL,
    "isExtra" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DebtPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingsGoal" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetAmount" DECIMAL(15,2) NOT NULL,
    "currentAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "monthlyContrib" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "targetDate" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 1,
    "emoji" TEXT,

    CONSTRAINT "SavingsGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalContribution" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT,

    CONSTRAINT "GoalContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "linkedDebtId" TEXT,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetSnapshot" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "AssetSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyExpense" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "note" TEXT,
    "isConsumptive" BOOLEAN,
    "consumptiveScore" DECIMAL(4,3),

    CONSTRAINT "DailyExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "color" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletEntry" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "source" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isAllocated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WalletEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletAllocation" (
    "id" TEXT NOT NULL,
    "walletEntryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "purpose" TEXT NOT NULL,

    CONSTRAINT "WalletAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyReport" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "totalIncome" DECIMAL(15,2) NOT NULL,
    "totalExpense" DECIMAL(15,2) NOT NULL,
    "totalSaved" DECIMAL(15,2) NOT NULL,
    "netWorth" DECIMAL(15,2) NOT NULL,
    "healthScore" INTEGER NOT NULL,
    "consumptiveRate" DECIMAL(5,4) NOT NULL,
    "insights" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpendingPattern" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "clusterData" JSONB NOT NULL,
    "dnaProfile" JSONB NOT NULL,
    "triggers" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpendingPattern_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillPayment_billId_month_key" ON "BillPayment"("billId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "DebtPayment_debtId_month_key" ON "DebtPayment"("debtId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "AssetSnapshot_assetId_month_key" ON "AssetSnapshot"("assetId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyReport_familyId_month_key" ON "MonthlyReport"("familyId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "SpendingPattern_familyId_month_key" ON "SpendingPattern"("familyId", "month");

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeEntry" ADD CONSTRAINT "IncomeEntry_incomeId_fkey" FOREIGN KEY ("incomeId") REFERENCES "Income"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillPayment" ADD CONSTRAINT "BillPayment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtPayment" ADD CONSTRAINT "DebtPayment_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsGoal" ADD CONSTRAINT "SavingsGoal_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalContribution" ADD CONSTRAINT "GoalContribution_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "SavingsGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetSnapshot" ADD CONSTRAINT "AssetSnapshot_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyExpense" ADD CONSTRAINT "DailyExpense_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletEntry" ADD CONSTRAINT "WalletEntry_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletAllocation" ADD CONSTRAINT "WalletAllocation_walletEntryId_fkey" FOREIGN KEY ("walletEntryId") REFERENCES "WalletEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletAllocation" ADD CONSTRAINT "WalletAllocation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyReport" ADD CONSTRAINT "MonthlyReport_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpendingPattern" ADD CONSTRAINT "SpendingPattern_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
