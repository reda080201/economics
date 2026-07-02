import {
  CALIBRATION,
  HOUSEHOLD_DEBT_SERVICE_SCALE,
  NEUTRAL_INTEREST_RATE,
  TARGET_INFLATION,
  TARGET_UNEMPLOYMENT,
  TICKS_PER_MONTH
} from "../core/config.js";
import { average, clamp, rand, safeNumber, shuffle, smoothValue, sum } from "../core/mathUtils.js";
import {
  createInitialBehavioralState,
  createInitialCreditCycle,
  createInitialFinancialMarket,
  createInitialInformationSystem,
  createInitialMacroFinancialTransmission,
  createInitialPerceivedEconomy,
  createInitialRateStructure
} from "../core/domainStateFactory.js";

export function executeConsumerPurchases(context) {
  const {
    state,
    calculateUnemploymentRate,
    computeConsumptionResponseSignal,
    effectiveBaseWage,
    getRecentUnemploymentTrend,
    recordFlow
  } = context;

  const previousInflation = Math.max(0, state.smoothedInflation);
  const averagePrice = Math.max(1, average(state.producers.map((producer) => producer.price)));
  const unemploymentTrend = getRecentUnemploymentTrend();
  const transmission = state.macroFinancial || createInitialMacroFinancialTransmission(state.config);
  const perceived = state.perceived || createInitialPerceivedEconomy();
  const info = state.information || createInitialInformationSystem();
  const behavior = state.behavior || createInitialBehavioralState();
  const financial = state.financialMarket || createInitialFinancialMarket(state.config);
  const creditCycle = state.creditCycle || createInitialCreditCycle();
  const financialConditionIndex = clamp(safeNumber(transmission.financialConditionsIndex, state.financialConditionIndex), 0, 35);
  const rates = state.rates || createInitialRateStructure(state.config || {});
  const depositRate = safeNumber(transmission.depositRate, safeNumber(rates.depositRate, state.government.interestRate * 0.62));
  const vatRate = clamp(safeNumber(state.government.valueAddedTaxRate, state.policy?.vatEffective || state.config.valueAddedTaxRate || 0.10), 0, 0.35);

  shuffle(state.consumers).forEach((consumer) => {
    if (consumer.cash <= 1) return;

    const scheduledDebtService = safeNumber(consumer.scheduledDebtService, consumer.debt * safeNumber(rates.loanRate, state.financialMarket?.loanRate || state.government.interestRate + 0.02) * HOUSEHOLD_DEBT_SERVICE_SCALE);
    const debtService = Math.min(consumer.cash * 0.045, scheduledDebtService);
    if (debtService > 0) {
      consumer.cash -= debtService;
      consumer.debtServiceTick += debtService;
      consumer.debt = Math.max(0, consumer.debt - debtService * 0.18);
    }
    const mortgageService = Math.min(consumer.cash * 0.060, safeNumber(consumer.scheduledMortgageService, consumer.mortgageDebtServiceTick));
    if (mortgageService > 0) {
      consumer.cash -= mortgageService;
      consumer.mortgageDebtServiceTick += mortgageService;
      consumer.mortgageDebt = Math.max(0, safeNumber(consumer.mortgageDebt, 0) - mortgageService * 0.12);
    }

    const perceivedInflation = safeNumber(perceived.inflation, previousInflation);
    const perceivedUnemploymentTrend = unemploymentTrend * 0.55 + (safeNumber(perceived.unemployment, state.metrics.unemploymentRate) - state.metrics.unemploymentRate) * 0.08;
    consumer.inflationExpectation = smoothValue(safeNumber(consumer.inflationExpectation, TARGET_INFLATION), perceivedInflation * 0.55 + safeNumber(perceived.expectedInflation, TARGET_INFLATION) * 0.25 + TARGET_INFLATION * 0.20, 0.045);
    const wageInflationGap = perceivedInflation - state.metrics.wageGrowth;
    const interestTransmission = clamp(1 - (financialConditionIndex / 100) * consumer.interestSensitivity * 0.78, 0.50, 1.04);
    const inflationSensitivity = safeNumber(consumer.inflationSensitivity, 1);
    const jobRiskSensitivity = safeNumber(consumer.jobRiskSensitivity, 1);
    const debtSensitivity = safeNumber(consumer.debtSensitivity, 1);
    const assetExposure = safeNumber(consumer.assetExposure, 0.25);
    const inflationDrag = clamp(1 - Math.max(0, wageInflationGap) * state.config.inflationSensitivity * 0.055 * inflationSensitivity - consumer.inflationExpectation * 0.010 * inflationSensitivity, 0.56, 1.04);
    const vatDrag = clamp(1 - vatRate * (0.42 + inflationSensitivity * 0.55), 0.74, 1.02);
    const precautionarySaving = clamp(
      1
        - Math.max(0, perceivedUnemploymentTrend) * 0.035 * jobRiskSensitivity
        - Math.max(0, 0.72 - consumer.confidence) * 0.22
        - safeNumber(consumer.precautionarySavingRate, 0.12) * 0.35
        - safeNumber(consumer.debtAnxiety, 0) * 0.10,
      0.62,
      1.04
    );
    const realDepositRate = Math.max(0, safeNumber(rates.realDepositRate, 0));
    const depositSavingDrag = clamp(1 - depositRate * safeNumber(consumer.savingsPropensity, 0.25) * 0.76 - realDepositRate * (consumer.incomeSegment === "wealthy" || consumer.incomeSegment === "high" ? 0.22 : 0.08), 0.89, 1.02);
    const cashBufferRatio = consumer.cash / Math.max(1, (consumer.employed ? consumer.income : effectiveBaseWage() * 0.45));
    const bufferDrag = cashBufferRatio < 2.2 ? clamp(0.74 + cashBufferRatio * 0.11, 0.62, 1) : 1.03;
    const jobSecurity = clamp(0.58 + safeNumber(consumer.jobSecurity, consumer.employed ? 0.82 : 0.34) * 0.48, consumer.employed ? 0.70 : 0.50, 1.04);
    const perceivedPainDrag = clamp(
      1
        - Math.max(0, safeNumber(perceived.financialStress, 0.20) - 0.24) * 0.11 * debtSensitivity
        - Math.max(0, safeNumber(perceived.housingBurden, 0.35) - 0.38) * 0.10 * safeNumber(consumer.housingExposure, 0.25)
        - Math.max(0, 0.70 - safeNumber(perceived.jobSecurity, 0.75)) * 0.14 * jobRiskSensitivity,
      0.82,
      1.02
    );
    const healthyEmployedBoost = consumer.employed && consumer.debtStress < 0.25
      ? 1.075
      : 1;
    const lowUnemploymentDemandBoost = state.metrics.unemploymentRate < 6
      ? 1.055
      : 1;
    const inventoryClearanceBoost = state.metrics.inventoryToDemand > 2.2
      ? 1.035
      : 1;
    const disposableIncome = Math.max(0, consumer.disposableIncomeTick || consumer.income);
    const incomeBudget = disposableIncome * consumer.consumptionPropensity;
    const cashBudget = consumer.cash * (0.028 + consumer.consumptionPropensity * 0.025);
    const stressMemory = clamp(consumer.stressMemory || consumer.debtStress, 0, 1);
    const stressDrag = consumer.financiallyStressed
      ? clamp(0.56 - Math.max(0, stressMemory - 0.68) * 0.78, 0.28, 0.56)
      : clamp(1 - Math.pow(consumer.debtStress, 1.35) * 0.62, 0.48, 1);
    const debtBurden = consumer.debtServiceTick / Math.max(1, disposableIncome + (consumer.employed ? 0 : effectiveBaseWage() * 0.16));
    consumer.debtBurden = smoothValue(safeNumber(consumer.debtBurden, debtBurden), debtBurden, 0.22);
    const debtServiceDrag = clamp(1 - Math.pow(consumer.debtBurden, 0.85) * 2.15 * debtSensitivity - safeNumber(consumer.debtAnxiety, 0) * 0.16 * debtSensitivity, 0.34, 1);
    const mortgageBurdenDrag = clamp(1 - Math.pow(safeNumber(consumer.mortgageBurden, 0), 0.78) * 1.15, 0.70, 1.02);
    const classPolicyTransferBoost = consumer.incomeSegment === "low"
      ? 1 + clamp(safeNumber(state.government.supportTick, 0) / Math.max(1, state.consumers.length * effectiveBaseWage()), 0, 0.10)
      : 1;
    const psychologyDrag = clamp(1 - safeNumber(consumer.inflationAnxiety, 0) * 0.08 * inflationSensitivity + safeNumber(consumer.wealthMood, 0) * 0.05 * (0.8 + assetExposure), 0.80, 1.08);
    const informationDrag = clamp(1 - safeNumber(info.misperceptionIndex, 0.12) * 0.06 - safeNumber(info.rumorIntensity, 0) * 0.05, 0.86, 1.02);
    const creditPsychDrag = clamp(
      1
        - safeNumber(creditCycle.creditCrunchRisk, 0.12) * 0.060
        - Math.max(0, 0.70 - safeNumber(financial.depositorConfidence, 0.88)) * 0.075
        - safeNumber(financial.bankFundingPressure, 0.12) * 0.040
        + safeNumber(creditCycle.creditExcessRisk, 0.12) * 0.025,
      0.84,
      1.035
    );
    const behavioralBias = clamp(
      1
        + safeNumber(behavior.fomoIntensity, 0) * 0.035 * CALIBRATION.behavioralBiasWeight
        + safeNumber(behavior.realEstateNeverFallsBelief, 0.46) * safeNumber(consumer.wealthEffectSensitivity, 0.22) * 0.026 * CALIBRATION.behavioralBiasWeight
        - safeNumber(behavior.lossAversion, 0.55) * Math.max(0, -safeNumber(consumer.wealthEffect, 0)) * 0.22 * CALIBRATION.behavioralBiasWeight
        - safeNumber(behavior.panicSellingPressure, 0.05) * 0.045 * CALIBRATION.behavioralBiasWeight
        - safeNumber(behavior.herdIntensity, 0.18) * Math.max(0, state.metrics.recessionFear || 0) * 0.018 * CALIBRATION.behavioralBiasWeight,
      0.86,
      1.08
    );
    const limitedWealthEffect = clamp(safeNumber(consumer.wealthEffect, safeNumber(transmission.wealthEffect, 0)) * safeNumber(consumer.wealthEffectSensitivity, 0.22) * (0.75 + assetExposure) * CALIBRATION.wealthEffectWeight, -0.09, 0.09);
    const sentimentAdjustedConfidence = 1 + (consumer.confidence - 1) * CALIBRATION.sentimentWeight;
    const classProfile = state.classAnalysis?.classes?.[consumer.incomeSegment];
    const classConsumptionMultiplier = clamp(safeNumber(classProfile?.consumptionMultiplier, 1), 0.82, 1.08);
    const responseConsumptionMultiplier = computeConsumptionResponseSignal(consumer, { disposableIncome });
    let consumptionBudget = (incomeBudget + cashBudget) * sentimentAdjustedConfidence * inflationDrag * vatDrag * precautionarySaving * bufferDrag * jobSecurity * stressDrag * debtServiceDrag * healthyEmployedBoost * lowUnemploymentDemandBoost * inventoryClearanceBoost * state.shock.demandMultiplier;
    consumptionBudget *= mortgageBurdenDrag * depositSavingDrag * psychologyDrag * informationDrag * creditPsychDrag * behavioralBias * perceivedPainDrag * classPolicyTransferBoost * classConsumptionMultiplier * responseConsumptionMultiplier * (1 + limitedWealthEffect);
    // 명시적 금리 공식: 금리가 오를수록 같은 소득에서도 소비 예산이 줄어든다.
    consumptionBudget *= interestTransmission;
    consumer.smoothedConsumptionBudget = smoothValue(
      safeNumber(consumer.smoothedConsumptionBudget, consumptionBudget),
      consumptionBudget,
      0.20
    );
    consumptionBudget = consumer.smoothedConsumptionBudget;
    let remainingBudget = clamp(consumptionBudget, 0, consumer.cash * 0.42);
    const minimumConsumptionFloor = clamp((consumer.employed ? consumer.income : effectiveBaseWage() * 0.18) * 0.08 + averagePrice * 0.18, 0, consumer.cash * 0.16);
    remainingBudget = Math.max(remainingBudget, minimumConsumptionFloor);
    if (stressMemory > 0.88) remainingBudget *= clamp(1 - (stressMemory - 0.88) * 3.0, 0.38, 1);

    for (let round = 0; round < 2 && remainingBudget > averagePrice * 0.25; round += 1) {
      const producer = chooseProducerForConsumer(context, consumer, averagePrice);
      if (!producer) break;

      const consumerPrice = producer.price * (1 + vatRate);
      const units = Math.min(producer.inventory, remainingBudget / Math.max(0.01, consumerPrice), rand(0.45, 3.6));
      const netSpend = units * producer.price;
      const vat = netSpend * vatRate;
      const spend = netSpend + vat;
      if (units <= 0 || spend <= 0 || spend > consumer.cash + 0.001) break;

      consumer.cash -= spend;
      consumer.lastSpent += spend;
      producer.cash += netSpend;
      producer.revenueTick += netSpend;
      producer.unitsSoldTick += units;
      producer.inventory -= units;
      remainingBudget -= spend;
      state.metrics.consumption += netSpend;
      state.metrics.unitsSold += units;
      if (vat > 0) {
        state.government.taxCollectedTick += vat;
        state.government.valueAddedTaxCollectedTick += vat;
        state.metrics.valueAddedTaxCollected += vat;
        state.metrics.totalTaxCollected += vat;
        consumer.lastTax += vat;
        recordFlow("consumer", consumer.id, "government", 0, vat, "tax");
      }
      recordFlow("consumer", consumer.id, "producer", producer.id, netSpend, "trade");
    }
  });
}

export function chooseProducerForConsumer(context, consumer, averagePrice) {
  const {
    state
  } = context;

  const available = state.producers.filter((producer) => producer.inventory > 0.2);
  if (available.length === 0) return null;

  const scored = available.map((producer) => {
    let score;
    if (consumer.demandPreference === "budget") {
      score = producer.price * rand(0.94, 1.07);
    } else if (consumer.demandPreference === "quality") {
      score = (producer.price / Math.max(0.5, producer.productivity)) * rand(0.94, 1.08);
    } else {
      const priceScore = producer.price / averagePrice;
      const stockScore = producer.inventory < producer.expectedDemand ? 0.93 : 1.03;
      score = producer.price * priceScore * stockScore * rand(0.95, 1.06);
    }
    return { producer, score };
  }).sort((a, b) => a.score - b.score);

  return scored[Math.floor(rand(0, Math.min(3, scored.length)))].producer;
}
