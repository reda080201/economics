import { TARGET_INFLATION, TARGET_UNEMPLOYMENT, TICKS_PER_MONTH } from "../core/config.js";
import { average, calculateGini, clamp, safeNumber, smoothValue, sum } from "../core/mathUtils.js";

export function updateMacroMetricsEngine(context) {
  const {
    state,
    calculateUnemploymentRate,
    getGDPGrowthWindow,
    updateFinancialConditionIndex,
    syncRateMetrics,
    createInitialAssetMarket,
    stockVolatilityLabel,
    valuationPressureLabel,
    stockRiskSentimentLabel,
    fearGreedLabel,
    stockVolatilityIndexLabel,
    syncFinancialMarketMetrics
  } = context;

  const averagePriceRaw = average(state.producers.map((producer) => producer.price));
  const rawInflation = state.previousAveragePrice > 0
    ? ((averagePriceRaw - state.previousAveragePrice) / state.previousAveragePrice) * 100
    : 0;
  const currentUnemploymentForAnchor = calculateUnemploymentRate();
  const inflationAnchor = currentUnemploymentForAnchor < 10 && getGDPGrowthWindow() > -4
    ? clamp((TARGET_INFLATION - state.smoothedInflation) * 1.45, -0.10, 2.20)
    : clamp((TARGET_INFLATION - state.smoothedInflation) * 0.25, -0.08, 0.45);
  state.smoothedInflation = clamp(smoothValue(state.smoothedInflation, rawInflation + inflationAnchor, 0.20), -4.5, 7.5);
  state.previousAveragePrice = averagePriceRaw;

  const employedCount = state.consumers.filter((consumer) => consumer.employed).length;
  const productionValue = state.metrics.productionUnits * averagePriceRaw;
  const gdpLike = computeGDP(state);
  const averageHouseholdCash = average(state.consumers.map((consumer) => consumer.cash));
  const averageFirmCash = average(state.producers.map((producer) => producer.cash));
  const totalInventory = sum(state.producers.map((producer) => producer.inventory));
  const averageFirmProfit = average(state.producers.map((producer) => producer.lastProfit));
  const householdDebt = sum(state.consumers.map((consumer) => consumer.debt));
  const firmDebt = sum(state.producers.map((producer) => producer.debt));
  const averageHouseholdDebtBurden = average(state.consumers.map((consumer) => safeNumber(consumer.debtBurden, 0))) * 100;
  const averageFirmDSCR = average(state.producers.map((producer) => clamp(safeNumber(producer.dscr, 99), 0, 8)));
  const debtStressedHouseholdRatio = state.consumers.length
    ? state.consumers.filter((consumer) => consumer.financiallyStressed || safeNumber(consumer.debtBurden, 0) > 0.22).length / state.consumers.length * 100
    : 0;
  const debtStressedFirmRatio = state.producers.length
    ? state.producers.filter((producer) => producer.financialStressCategory === "stressed" || producer.financialStressCategory === "distressed").length / state.producers.length * 100
    : 0;
  const averageWage = employedCount > 0 ? state.metrics.wages / employedCount : average(state.producers.map((producer) => producer.wageOffered));
  const rawWageGrowth = state.previousAverageWage > 0
    ? ((averageWage - state.previousAverageWage) / state.previousAverageWage) * 100
    : 0;
  state.smoothedWageGrowth = clamp(smoothValue(state.smoothedWageGrowth, rawWageGrowth, 0.18), -2.5, 4.5);
  state.previousAverageWage = averageWage;
  const totalDebtService = sum(state.consumers.map((consumer) => consumer.debtServiceTick)) + sum(state.producers.map((producer) => producer.interestCostTick));
  const incomeBase = Math.max(1, state.metrics.wages + state.metrics.consumption + state.metrics.governmentTransfers);
  const averageDebtStress = average(state.consumers.map((consumer) => consumer.debtStress));
  const averageFirmDebtStress = average(state.producers.map((producer) => producer.debtStress));
  const salesPressure = state.metrics.unitsSold / Math.max(1, state.metrics.productionUnits);
  const inventoryToDemand = totalInventory / Math.max(1, sum(state.producers.map((producer) => producer.expectedDemand)));
  const potential = computePotentialOutputIndicators(state, gdpLike, employedCount);

  const governmentDebtService = clamp(safeNumber(state.government.debtServiceTick, 0), 0, 1000000);
  state.government.balance = state.government.taxCollectedTick - state.government.spendingActualTick - governmentDebtService;
  if (state.government.balance < 0) {
    state.government.debt = clamp(state.government.debt - state.government.balance, 0, 10000000);
  } else {
    state.government.debt = clamp(state.government.debt - state.government.balance * 0.55, 0, 10000000);
  }
  const annualizedGdpBase = Math.max(1, gdpLike * TICKS_PER_MONTH * 12);
  const debtToGdpRatio = state.government.debt / annualizedGdpBase;
  const deficitRatio = Math.max(0, -state.government.balance) / Math.max(1, gdpLike);
  const debtServiceRatio = governmentDebtService / Math.max(1, state.government.taxCollectedTick + state.government.spendingActualTick * 0.35);
  const fiscalSpaceScore = clamp(1 - debtToGdpRatio / 1.8 - debtServiceRatio * 0.55 - deficitRatio * 0.55, 0, 1);
  const fiscalSpaceLabel = fiscalSpaceScore > 0.68 ? "충분함" : fiscalSpaceScore > 0.45 ? "주의" : fiscalSpaceScore > 0.22 ? "제한적" : "위험";
  state.government.debtToGdpRatio = debtToGdpRatio;
  state.government.fiscalSpaceScore = fiscalSpaceScore;
  state.government.fiscalSpaceLabel = fiscalSpaceLabel;

  state.metrics.gdp = gdpLike;
  state.metrics.outputValue = productionValue;
  state.metrics.unemploymentRate = (1 - employedCount / Math.max(1, state.consumers.length)) * 100;
  state.metrics.employedCount = employedCount;
  state.metrics.averagePrice = averagePriceRaw;
  state.metrics.inflation = state.smoothedInflation;
  state.metrics.governmentBalance = state.government.balance;
  state.metrics.governmentDebt = state.government.debt;
  state.metrics.averageHouseholdCash = averageHouseholdCash;
  state.metrics.averageFirmCash = averageFirmCash;
  state.metrics.averageConfidence = average(state.consumers.map((consumer) => consumer.confidence));
  state.metrics.totalInventory = totalInventory;
  state.metrics.householdIncomeTaxCollected = state.government.householdIncomeTaxCollectedTick;
  state.metrics.corporateTaxCollected = state.government.corporateTaxCollectedTick;
  state.metrics.valueAddedTaxCollected = state.government.valueAddedTaxCollectedTick;
  state.metrics.totalTaxCollected = state.government.taxCollectedTick;
  state.metrics.taxCollected = state.government.taxCollectedTick;
  updateTaxSentimentMetrics(state);
  state.metrics.governmentSpendingActual = state.government.spendingActualTick;
  state.metrics.governmentDebtService = governmentDebtService;
  state.metrics.debtToGdpRatio = debtToGdpRatio;
  state.metrics.fiscalSpaceScore = fiscalSpaceScore;
  state.metrics.fiscalSpaceLabel = fiscalSpaceLabel;
  state.metrics.averageWage = averageWage;
  state.metrics.wageGrowth = state.smoothedWageGrowth;
  state.metrics.realWageGrowth = state.smoothedWageGrowth - state.smoothedInflation;
  state.metrics.averageFirmProfit = averageFirmProfit;
  state.metrics.householdDebt = householdDebt;
  state.metrics.firmDebt = firmDebt;
  state.metrics.debtServiceBurden = (totalDebtService / incomeBase) * 100;
  state.metrics.householdDebtStress = averageDebtStress;
  state.metrics.firmDebtStress = averageFirmDebtStress;
  state.metrics.averageHouseholdDebtBurden = averageHouseholdDebtBurden;
  state.metrics.averageFirmDSCR = averageFirmDSCR;
  state.metrics.debtStressedHouseholdRatio = debtStressedHouseholdRatio;
  state.metrics.debtStressedFirmRatio = debtStressedFirmRatio;
  state.metrics.financiallyStressedConsumers = state.consumers.filter((consumer) => consumer.financiallyStressed).length;
  state.metrics.financiallyStressedFirms = state.producers.filter((producer) => producer.financiallyStressed).length;
  state.metrics.averageBusinessOutlook = average(state.producers.map((producer) => producer.businessOutlook));
  state.metrics.demandPullPressure = state.priceDrivers.demandPull * 100;
  state.metrics.costPushPressure = state.priceDrivers.costPush * 100;
  state.metrics.shortagePressure = state.priceDrivers.shortage * 100;
  state.metrics.inflationExpectationPressure = state.priceDrivers.expectations * 100;
  state.metrics.salesPressure = salesPressure;
  state.metrics.inventoryToDemand = inventoryToDemand;
  state.metrics.potentialOutput = potential.potentialOutput;
  state.metrics.outputGap = potential.outputGap;
  state.metrics.capacityUtilization = potential.capacityUtilization;
  state.metrics.unemploymentGap = state.metrics.unemploymentRate - TARGET_UNEMPLOYMENT;
  state.metrics.inflationGap = state.metrics.inflation - TARGET_INFLATION;
  state.metrics.financialConditionIndex = updateFinancialConditionIndex();
  syncRateMetrics();
  const asset = state.assetMarket || createInitialAssetMarket();
  state.metrics.stockIndex = safeNumber(asset.stockIndex, 100);
  state.metrics.stockIndexPoints = safeNumber(asset.stockIndexPoints, 2500);
  state.metrics.housingIndex = safeNumber(asset.housingIndex, 100);
  state.metrics.stockReturn = safeNumber(asset.stockReturn, 0) * 100;
  state.metrics.stockMonthlyReturn = safeNumber(asset.stockMonthlyReturn, safeNumber(asset.stockReturn, 0) * TICKS_PER_MONTH) * 100;
  state.metrics.stockVolatility = safeNumber(asset.stockVolatility, 0.015) * 100;
  state.metrics.stockVolatilityLabel = stockVolatilityLabel(asset.stockVolatility);
  state.metrics.stockValuationPressure = safeNumber(asset.stockValuationPressure, 0);
  state.metrics.stockValuationPressureLabel = asset.stockValuationPressureLabel || valuationPressureLabel(asset.stockValuationPressure);
  state.metrics.stockRiskSentiment = safeNumber(asset.stockRiskSentiment, 0.65);
  state.metrics.stockRiskSentimentLabel = asset.stockRiskSentimentLabel || stockRiskSentimentLabel(asset.stockRiskSentiment);
  state.metrics.fearGreedIndex = safeNumber(asset.fearGreedIndex, 50);
  state.metrics.fearGreedLabel = asset.fearGreedLabel || fearGreedLabel(asset.fearGreedIndex);
  state.metrics.stockVolatilityIndex = safeNumber(asset.stockVolatilityIndex, 18);
  state.metrics.stockVolatilityIndexLabel = asset.stockVolatilityIndexLabel || stockVolatilityIndexLabel(asset.stockVolatilityIndex);
  state.metrics.expectedEarningsGrowth = safeNumber(asset.expectedEarningsGrowth, 0) * 100;
  state.metrics.expectedRatePath = state.metrics.expectedRatePath || safeNumber(asset.expectedRatePath, 0) * 100;
  state.metrics.expectedRiskPremium = safeNumber(asset.expectedRiskPremium, 0.04) * 100;
  state.metrics.stockExpectation = safeNumber(asset.stockExpectation, 0) * 100;
  state.metrics.stockDrawdown = safeNumber(asset.stockDrawdownFromPeak, 0) * 100;
  state.metrics.housingReturn = safeNumber(asset.housingReturn, 0) * 100;
  state.metrics.wealthEffect = safeNumber(asset.wealthEffect, 0) * 100;
  state.metrics.housingAffordability = safeNumber(state.realEstate?.housingAffordability, asset.housingAffordability || 1);
  state.metrics.averageMortgageBurden = safeNumber(asset.averageMortgageBurden, 0);
  state.metrics.negativeEquityRatio = safeNumber(asset.negativeEquityRatio, 0);
  state.metrics.assetBubbleRiskScore = safeNumber(asset.assetBubbleRisk, 0);
  state.metrics.assetBubbleRiskLabel = asset.assetBubbleRiskLabel || "낮음";
  syncFinancialMarketMetrics();
  state.metrics.gini = calculateGini(state.consumers.map((consumer) => consumer.cash));
}

export function computeGDP(state) {
  return state.metrics.consumption + state.metrics.investment + state.metrics.governmentGDPSpending;
}

function updateTaxSentimentMetrics(state) {
  const incomeTax = clamp(safeNumber(state.government.householdIncomeTaxRate, 0.16), 0, 0.60);
  const corporateTax = clamp(safeNumber(state.government.corporateTaxRate, 0.18), 0, 0.60);
  const vat = clamp(safeNumber(state.government.valueAddedTaxRate, 0.10), 0, 0.35);
  const lowStress = safeNumber(state.metrics.lowIncomeStress, 0);
  const firmStress = state.producers.length
    ? state.producers.filter((producer) => producer.firmStrategy === "배당·자사주형" && safeNumber(producer.investmentConversionRate, 0) < 0.22).length / state.producers.length
    : 0;
  state.metrics.householdTaxPressure = clamp(incomeTax * 1.35 + vat * 1.10 + safeNumber(state.metrics.middleClassMortgageStress, 0) * 0.18, 0, 1);
  state.metrics.consumptionTaxPain = clamp(vat * 2.2 + lowStress * 0.35 + Math.max(0, state.metrics.inflationGap) * 0.035, 0, 1);
  state.metrics.corporateTaxPressure = clamp(corporateTax * 1.45 + safeNumber(state.metrics.firmDebtStress, 0) * 0.16, 0, 1);
  state.metrics.taxPolicyCredibility = clamp(0.82 - Math.max(0, incomeTax - 0.28) * 0.55 - Math.max(0, corporateTax - 0.30) * 0.48 - Math.max(0, vat - 0.14) * 0.62 - firmStress * 0.12, 0, 1);
  const allocatedCash = Math.max(1, state.metrics.buybackDividendSpending + state.metrics.debtRepaymentAllocation + state.metrics.retainedEarningsAllocation);
  state.metrics.buybackPayoutRatio = state.metrics.buybackDividendSpending / allocatedCash;
  state.metrics.investmentConversionRate = smoothValue(safeNumber(state.metrics.investmentConversionRate, 0), state.metrics.retainedEarningsAllocation / allocatedCash, 0.14);
  state.metrics.taxSentimentScore = clamp(state.metrics.householdTaxPressure * 0.32 + state.metrics.consumptionTaxPain * 0.28 + state.metrics.corporateTaxPressure * 0.22 + (1 - state.metrics.taxPolicyCredibility) * 0.18, 0, 1);
  state.metrics.taxSentimentLabel = state.metrics.taxSentimentScore < 0.28 ? "낮음" : state.metrics.taxSentimentScore < 0.52 ? "보통" : state.metrics.taxSentimentScore < 0.74 ? "높음" : "위험";
}

function computePotentialOutputIndicators(state, actualGDP, employedCount) {
  const unemploymentRate = (1 - employedCount / Math.max(1, state.consumers.length)) * 100;
  const unemploymentGap = unemploymentRate - TARGET_UNEMPLOYMENT;
  const expectedDemand = sum(state.producers.map((producer) => producer.expectedDemand));
  const inventoryDemandRatio = sum(state.producers.map((producer) => producer.inventory)) / Math.max(1, expectedDemand);
  const productionDemandRatio = state.metrics.productionUnits / Math.max(1, expectedDemand);
  const capacityUtilization = clamp(
    83 + (productionDemandRatio - 0.85) * 18 - Math.max(0, inventoryDemandRatio - 1.8) * 5 + Math.max(0, -unemploymentGap) * 0.45,
    55,
    105
  );
  const potentialMultiplier = clamp(1 + unemploymentGap * 0.014 - Math.max(0, state.smoothedInflation - TARGET_INFLATION) * 0.006, 0.90, 1.14);
  const targetPotentialOutput = Math.max(1, actualGDP * potentialMultiplier);
  state.potentialOutputEstimate = smoothValue(safeNumber(state.potentialOutputEstimate, targetPotentialOutput), targetPotentialOutput, 0.08);
  const potentialOutput = clamp(state.potentialOutputEstimate, Math.max(1, actualGDP * 0.82), Math.max(1, actualGDP * 1.18));
  return {
    potentialOutput,
    outputGap: ((actualGDP - potentialOutput) / Math.max(1, potentialOutput)) * 100,
    capacityUtilization
  };
}
