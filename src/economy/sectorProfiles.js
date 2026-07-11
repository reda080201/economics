import { NEUTRAL_INTEREST_RATE, TARGET_INFLATION } from "../core/config.js";
import { clamp, rand, safeNumber } from "../core/mathUtils.js";

export function getSectorProfile(sector) {
  const profiles = {
    manufacturing: { exportExposure: 0.42, importCostExposure: 0.36, energyCostExposure: 0.30, wageCostShare: 0.34, interestSensitivity: 0.88, demandSensitivity: 1.05, assetSensitivity: 0.55, creditSensitivity: 0.92, productivityTrend: 0.004 },
    services: { exportExposure: 0.08, importCostExposure: 0.10, energyCostExposure: 0.12, wageCostShare: 0.58, interestSensitivity: 0.65, demandSensitivity: 1.18, assetSensitivity: 0.38, creditSensitivity: 0.62, productivityTrend: 0.002 },
    agriculture: { exportExposure: 0.12, importCostExposure: 0.24, energyCostExposure: 0.38, wageCostShare: 0.30, interestSensitivity: 0.52, demandSensitivity: 0.72, assetSensitivity: 0.25, creditSensitivity: 0.62, productivityTrend: 0.001 },
    energy: { exportExposure: 0.20, importCostExposure: 0.18, energyCostExposure: 0.12, wageCostShare: 0.24, interestSensitivity: 0.82, demandSensitivity: 0.88, assetSensitivity: 0.70, creditSensitivity: 0.85, productivityTrend: 0.002 },
    construction: { exportExposure: 0.02, importCostExposure: 0.22, energyCostExposure: 0.24, wageCostShare: 0.42, interestSensitivity: 1.38, demandSensitivity: 1.25, assetSensitivity: 1.20, creditSensitivity: 1.32, productivityTrend: 0.001 },
    financial: { exportExposure: 0.04, importCostExposure: 0.04, energyCostExposure: 0.03, wageCostShare: 0.38, interestSensitivity: 1.05, demandSensitivity: 0.78, assetSensitivity: 1.05, creditSensitivity: 1.42, productivityTrend: 0.002 },
    technology: { exportExposure: 0.24, importCostExposure: 0.18, energyCostExposure: 0.08, wageCostShare: 0.46, interestSensitivity: 1.55, demandSensitivity: 1.12, assetSensitivity: 1.45, creditSensitivity: 1.08, productivityTrend: 0.009 },
    staples: { exportExposure: 0.10, importCostExposure: 0.20, energyCostExposure: 0.18, wageCostShare: 0.32, interestSensitivity: 0.48, demandSensitivity: 0.62, assetSensitivity: 0.30, creditSensitivity: 0.45, productivityTrend: 0.002 }
  };
  return profiles[sector] || profiles.services;
}

export function getSectorBehaviorMultiplier(producer, state) {
  const sector = producer?.sector || "services";
  const m = state.metrics || {};
  const rates = state.rates || {};
  const creditTightness = clamp((100 - safeNumber(m.creditSupplyIndex, 100)) / 100, 0, 1);
  const demandSignal = clamp(safeNumber(m.salesPressure, 1), 0.45, 1.65);
  if (sector === "manufacturing") {
    return clamp(1 + Math.max(0, safeNumber(m.exportDemand, 100) - 100) * 0.0015 - safeNumber(m.importInflationPressure, 0) * 0.040 - safeNumber(m.commodityCostPressure, 0) * safeNumber(producer.energyCostExposure, 0.2) * 0.050, 0.68, 1.10);
  }
  if (sector === "services") {
    return clamp(0.82 + demandSignal * 0.20 + safeNumber(m.consumerSentiment, 0.8) * 0.10 - Math.max(0, safeNumber(m.wageGrowth, 0) - 3) * 0.012, 0.72, 1.08);
  }
  if (sector === "agriculture") {
    return clamp(0.98 - safeNumber(m.commodityCostPressure, 0) * 0.035 - Math.max(0, safeNumber(m.energyPriceIndex, 100) - 100) * 0.0013 - safeNumber(m.lowIncomeStress, 0) * 0.08 + Math.max(0, safeNumber(m.inflation, 0) - TARGET_INFLATION) * 0.010, 0.66, 1.08);
  }
  if (sector === "energy") {
    return clamp(0.90 + Math.max(0, safeNumber(m.energyPriceIndex, 100) - 100) * 0.0024 + Math.max(0, safeNumber(m.globalDemand, 100) - 100) * 0.0012 - creditTightness * 0.14 - Math.max(0, safeNumber(m.importInflationPressure, 0)) * 0.020, 0.64, 1.14);
  }
  if (sector === "construction") {
    return clamp(1.05 - Math.max(0, safeNumber(m.mortgageRate, 0) - 5.0) * 0.045 - Math.max(0, safeNumber(m.housingAffordability, 1) - 1.35) * 0.12 - creditTightness * 0.18 + Math.max(0, safeNumber(m.residentialReturn, 0)) * 0.006, 0.55, 1.08);
  }
  if (sector === "financial") {
    const marginSupport = clamp(safeNumber(m.bankNetInterestMargin, 2) / 4, 0, 0.28);
    return clamp(0.90 + marginSupport - safeNumber(m.bankStress, 0) * 0.32 - creditTightness * 0.16 - safeNumber(m.nonPerformingLoanRatio, 0) * 0.018, 0.60, 1.10);
  }
  if (sector === "technology") {
    return clamp(1.05 - Math.max(0, safeNumber(m.bondYield10Y, 0) - NEUTRAL_INTEREST_RATE) * 0.050 - Math.max(0, safeNumber(rates.realPolicyRate, 0) * 100 - 1.2) * 0.035 + Math.max(0, safeNumber(m.stockRiskSentiment, 0.65) - 0.58) * 0.18 - safeNumber(m.stockVulnerability, 0) * 0.10, 0.58, 1.12);
  }
  if (sector === "staples") {
    return clamp(0.94 + Math.min(1.15, demandSignal) * 0.06 - safeNumber(m.lowIncomeStress, 0) * 0.07, 0.82, 1.05);
  }
  return 1;
}

export function weightedPick(entries) {
  const total = entries.reduce((acc, [, weight]) => acc + weight, 0);
  let roll = rand(0, Math.max(0.0001, total));
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

export function firmStrategyLabel(strategy) {
  return strategy || "균형형";
}
