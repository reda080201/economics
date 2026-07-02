import {
  CALIBRATION,
  HOUSEHOLD_DEBT_SERVICE_SCALE,
  NEUTRAL_INTEREST_RATE,
  TARGET_INFLATION,
  TARGET_UNEMPLOYMENT,
  TICKS_PER_MONTH
} from "../core/config.js";
import { average, clamp, rand, safeNumber, shuffle, smoothValue, sum } from "../core/mathUtils.js";

export function executeGovernmentSpending(context) {
  const {
    state,
    calculateUnemploymentRate,
    effectiveBaseWage,
    recordFlow
  } = context;

  const debtBrake = getDebtSpendingBrake(context);
  const unemploymentRate = calculateUnemploymentRate();
  const automaticStabilizer = unemploymentRate > 30
    ? state.consumers.length * effectiveBaseWage() * 0.085
    : unemploymentRate > 15
      ? state.consumers.length * effectiveBaseWage() * 0.035
      : unemploymentRate > TARGET_UNEMPLOYMENT + 2
        ? state.consumers.length * effectiveBaseWage() * 0.012
        : 0;
  const targetSpending = state.government.spending * debtBrake + automaticStabilizer;
  const plannedSpending = smoothValue(safeNumber(state.government.spendingImpulse, targetSpending), targetSpending, 0.16);
  state.government.spendingImpulse = plannedSpending;
  state.government.effectiveSpending = plannedSpending;
  if (plannedSpending <= 0) return;

  const transferRecipients = state.consumers.filter((consumer) => !consumer.employed || consumer.incomeSegment === "low" || consumer.cash < effectiveBaseWage() * 1.2);
  const supportPool = plannedSpending * (unemploymentRate > 30 ? 0.44 : unemploymentRate > 15 ? 0.36 : 0.26);
  if (transferRecipients.length > 0 && supportPool > 0) {
  const supportCap = effectiveBaseWage() * (unemploymentRate > 30 ? 0.86 : unemploymentRate > 15 ? 0.72 : 0.62);
  const supportPerPerson = Math.min(supportCap, supportPool / transferRecipients.length);
    transferRecipients.forEach((consumer) => {
      const transfer = supportPerPerson * (!consumer.employed ? 1 : 0.45);
      consumer.transferMemory = smoothValue(safeNumber(consumer.transferMemory, transfer), transfer, 0.25);
      consumer.cash += consumer.transferMemory;
      state.government.spendingActualTick += consumer.transferMemory;
      state.government.supportTick += consumer.transferMemory;
      state.metrics.governmentTransfers += consumer.transferMemory;
      recordFlow("government", 0, "consumer", consumer.id, consumer.transferMemory, "spending");
    });
  }

  let procurementBudget = plannedSpending * 0.42;
  let guard = 0;
  while (procurementBudget > 2 && guard < 80) {
    guard += 1;
    const suppliers = state.producers
      .filter((producer) => producer.inventory > 0.6)
      .sort((a, b) => a.price - b.price);
    if (suppliers.length === 0) break;

    const producer = suppliers[Math.floor(rand(0, Math.min(3, suppliers.length)))];
    const units = Math.min(producer.inventory, procurementBudget / producer.price, rand(0.8, 4.2));
    const spend = units * producer.price;
    if (spend <= 0) break;

    producer.inventory -= units;
    producer.cash += spend;
    producer.govRevenueTick += spend;
    producer.unitsSoldTick += units * 0.28;
    procurementBudget -= spend;
    state.metrics.governmentDemand += spend;
    state.metrics.governmentGDPSpending += spend;
    state.metrics.governmentProcurement += spend;
    state.government.spendingActualTick += spend;
    state.government.procurementTick += spend;
    recordFlow("government", 0, "producer", producer.id, spend, "spending");
  }

  const subsidyPool = plannedSpending * 0.08;
  if (subsidyPool > 0 && state.producers.length > 0) {
    const eligible = state.producers
      .filter((producer) => producer.lastProfit < 60 || producer.inventory < producer.expectedDemand)
      .slice(0, Math.max(1, Math.ceil(state.producers.length * 0.45)));
    const subsidyReceivers = eligible.length ? eligible : state.producers.slice(0, 1);
    const perFirmGrant = subsidyPool / subsidyReceivers.length;
    subsidyReceivers.forEach((producer) => {
      producer.cash += perFirmGrant;
      producer.govRevenueTick += perFirmGrant * 0.20;
      state.government.spendingActualTick += perFirmGrant;
      state.government.subsidyTick += perFirmGrant;
      state.metrics.governmentSubsidies += perFirmGrant;
      recordFlow("government", 0, "producer", producer.id, perFirmGrant, "spending");
    });
  }

  const publicServices = plannedSpending * 0.12 + Math.max(0, procurementBudget) * 0.20;
  if (publicServices > 0 && state.producers.length > 0) {
    const softDemand = publicServices * 0.35;
    const perFirmGrant = softDemand / state.producers.length;
    state.producers.forEach((producer) => {
      producer.cash += perFirmGrant;
      producer.govRevenueTick += perFirmGrant * 0.25;
      state.government.spendingActualTick += perFirmGrant;
      state.government.publicServicesTick += perFirmGrant;
      state.metrics.governmentGDPSpending += perFirmGrant;
      state.metrics.governmentDemand += perFirmGrant;
      recordFlow("government", 0, "producer", producer.id, perFirmGrant, "spending");
    });
  }
}

export function getDebtSpendingBrake(context) {
  const {
    state
  } = context;

  const debtToGdp = safeNumber(state.government.debtToGdpRatio, state.metrics.debtToGdpRatio || 0);
  const fiscalSpace = safeNumber(state.government.fiscalSpaceScore, 1);
  const debtBrake = debtToGdp < 0.90 ? 1 : clamp(1 - (debtToGdp - 0.90) * 0.22, 0.62, 1);
  const spaceBrake = fiscalSpace > 0.45 ? 1 : clamp(0.72 + fiscalSpace * 0.62, 0.55, 1);
  return clamp(debtBrake * spaceBrake, 0.55, 1);
}

export function collectProfitTaxes(context) {
  const {
    state,
    recordFlow
  } = context;

  state.producers.forEach((producer) => {
    const revenue = producer.revenueTick + producer.govRevenueTick;
    const propertyCost = safeNumber(producer.rentCost, 0) / TICKS_PER_MONTH + safeNumber(producer.propertyDebt, 0) * safeNumber(state.macroFinancial?.loanRate, state.financialMarket?.loanRate || 0.05) * 0.020 / TICKS_PER_MONTH;
    const externalCostPressure = Math.max(0, safeNumber(state.metrics.importPriceIndex, 100) - 100) * safeNumber(producer.importCostExposure, 0) * 0.00045
      + Math.max(0, safeNumber(state.metrics.energyPriceIndex, 100) - 100) * safeNumber(producer.energyCostExposure, 0) * 0.00058;
    const sectorCostMultiplier = producer.sector === "manufacturing" ? 1.12 : producer.sector === "construction" ? 1.06 : 1;
    const externalOperatingCost = Math.max(0, producer.productionTick * producer.price * externalCostPressure * sectorCostMultiplier);
    const operatingCost = Math.max(0, producer.productionTick * producer.price * 0.055 + producer.inventory * producer.price * 0.0015 + propertyCost + externalOperatingCost);
    producer.operatingCostTick = operatingCost;
    const cashFlowBeforeDebtService = revenue - producer.wageCostTick - operatingCost - producer.investmentTick * 0.35 + producer.cash * 0.020;
    const preTaxProfit = cashFlowBeforeDebtService - producer.interestCostTick - producer.investmentTick * 0.27;
    let corporateTax = 0;
    if (preTaxProfit > 0) {
      corporateTax = Math.min(producer.cash, preTaxProfit * state.government.corporateTaxRate);
      producer.cash -= corporateTax;
      state.government.taxCollectedTick += corporateTax;
      state.government.corporateTaxCollectedTick += corporateTax;
      state.metrics.corporateTaxCollected += corporateTax;
      state.metrics.totalTaxCollected += corporateTax;
      recordFlow("producer", producer.id, "government", 0, corporateTax, "tax");
    }
    producer.preTaxProfit = preTaxProfit;
    producer.afterTaxProfit = preTaxProfit - corporateTax;
    producer.lastProfit = producer.afterTaxProfit;
    allocateAfterTaxCashFlow(context, producer, producer.afterTaxProfit);
    const firmDebtService = Math.max(0.01, producer.interestCostTick);
    producer.dscr = smoothValue(safeNumber(producer.dscr, 99), cashFlowBeforeDebtService / Math.max(1, firmDebtService), 0.24);
    producer.profitTrend = clamp(smoothValue(producer.profitTrend, producer.lastProfit, 0.16), -800, 1200);
  });
}

export function allocateAfterTaxCashFlow(context, producer, afterTaxProfit) {
  const {
    state
  } = context;

  if (!producer || afterTaxProfit <= 0) {
    producer.investmentConversionRate = smoothValue(safeNumber(producer.investmentConversionRate, 0), 0, 0.08);
    return;
  }
  const strategy = producer.firmStrategy || "투자형";
  const demandOutlook = clamp(safeNumber(producer.businessOutlook, 1) * safeNumber(state.metrics.salesPressure, 1), 0.35, 1.65);
  const creditTight = clamp((safeNumber(state.metrics.creditSpread, 2) - 2) / 7 + Math.max(0, 85 - safeNumber(state.metrics.creditSupplyIndex, 100)) / 70, 0, 1);
  const corporateTax = clamp(safeNumber(state.government.corporateTaxRate, 0.18), 0, 0.60);
  const taxRelief = clamp((0.22 - corporateTax) / 0.22, -0.8, 1.0);
  const weakDemand = demandOutlook < 0.88 || state.metrics.inventoryToDemand > 2.4;
  let investShare = strategy === "고성장형" ? 0.48 : strategy === "투자형" ? 0.42 : strategy === "부채축소형" ? 0.18 : strategy === "배당·자사주형" ? 0.16 : 0.24;
  let payoutShare = strategy === "배당·자사주형" ? 0.42 : strategy === "현금보수형" ? 0.18 : strategy === "고성장형" ? 0.10 : 0.16;
  let debtShare = strategy === "부채축소형" ? 0.42 : producer.debtStress > 0.55 ? 0.34 : 0.18;

  investShare += Math.max(0, demandOutlook - 1) * 0.16 - creditTight * 0.18 + taxRelief * (weakDemand ? -0.04 : 0.08);
  payoutShare += taxRelief * (weakDemand ? 0.14 : 0.04) + safeNumber(producer.shareholderPayoutPreference, 0.25) * 0.16 + Math.max(0, state.metrics.stockValuationPressure - 0.45) * 0.08;
  debtShare += creditTight * 0.12 + Math.max(0, safeNumber(producer.debtStress, 0) - 0.35) * 0.18;
  if (producer.sector === "technology") investShare += 0.06;
  if (producer.sector === "financial") payoutShare += 0.04;
  if (producer.sector === "staples") payoutShare += 0.05;

  investShare = clamp(investShare, 0.04, 0.62);
  payoutShare = clamp(payoutShare, 0.02, 0.54);
  debtShare = clamp(debtShare, 0.03, 0.56);
  const total = Math.max(0.01, investShare + payoutShare + debtShare);
  if (total > 0.86) {
    investShare *= 0.86 / total;
    payoutShare *= 0.86 / total;
    debtShare *= 0.86 / total;
  }
  const distributable = Math.min(producer.cash * 0.18, afterTaxProfit * 0.55);
  const buyback = Math.max(0, distributable * payoutShare);
  const debtRepayment = Math.min(producer.debt, Math.max(0, distributable * debtShare));
  const retained = Math.max(0, distributable * Math.max(0, 1 - investShare - payoutShare - debtShare));
  const investmentReserve = Math.max(0, distributable * investShare);

  producer.cash = clamp(producer.cash - buyback - debtRepayment, 0, 3500000);
  producer.debt = Math.max(0, producer.debt - debtRepayment);
  producer.buybackAndDividendTick += buyback;
  producer.debtRepaymentAllocationTick += debtRepayment;
  producer.retainedEarningsTick += retained + investmentReserve;
  producer.investmentConversionRate = smoothValue(safeNumber(producer.investmentConversionRate, 0), investmentReserve / Math.max(0.01, distributable), 0.12);
  producer.investorSentiment = clamp(smoothValue(safeNumber(producer.investorSentiment, 1), 1 + buyback / Math.max(1, producer.marketCap) * 0.22 - weakDemand * 0.04, 0.08), 0.70, 1.22);
  producer.equityFinancingCondition = clamp(safeNumber(producer.equityFinancingCondition, 1) + buyback / Math.max(1, producer.marketCap) * 0.018, 0.55, 1.18);

  state.metrics.buybackDividendSpending += buyback;
  state.metrics.debtRepaymentAllocation += debtRepayment;
  state.metrics.retainedEarningsAllocation += retained + investmentReserve;
  state.metrics.investmentConversionRate = smoothValue(safeNumber(state.metrics.investmentConversionRate, 0), producer.investmentConversionRate, 0.08);
}
