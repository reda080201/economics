import { clamp, safeNumber, smoothValue, sum } from "../core/mathUtils.js";

export function createInitialMarketOutcome() {
  return {
    marketEfficiency: 0.62,
    marketFailureRisk: 0.22,
    marketSuccessScore: 0.50,
    allocationQuality: 0.62,
    competitionPressure: 0.50,
    externalityPressure: 0.12,
    informationFailure: 0.12,
    creditMisallocation: 0.12,
    inequalityDrag: 0.12,
    publicGoodsGap: 0.10,
    failureType: "없음",
    successType: "형성 중"
  };
}

export function computeMarketOutcome(state) {
  if (!state.marketOutcome) state.marketOutcome = createInitialMarketOutcome();
  const m = state.metrics;
  const outcome = state.marketOutcome;
  const infoFailure = clamp(
    safeNumber(m.misperceptionIndex, 0.12) * 0.42
      + safeNumber(m.informationUncertainty, 0.16) * 0.34
      + safeNumber(m.marketOverreaction, 0.10) * 0.18
      + safeNumber(m.rumorIntensity, 0) * 0.16,
    0,
    1
  );
  const creditMisallocation = clamp(
    safeNumber(m.creditExcessRisk, 0.12) * 0.38
      + safeNumber(m.creditCrunchRisk, 0.12) * 0.32
      + safeNumber(m.riskUnderpricing, 0.12) * 0.18
      + safeNumber(m.zombieFirmRatio, 0) / 100 * 0.20,
    0,
    1
  );
  const externalityPressure = clamp(
    Math.max(0, safeNumber(m.importInflationPressure, 0)) * 0.070
      + Math.max(0, safeNumber(m.commodityCostPressure, 0)) * 0.090
      + safeNumber(m.energyStress, 0) * 0.30
      + safeNumber(m.agricultureStress, 0) * 0.22
      + Math.max(0, safeNumber(m.energyPriceIndex, 100) - 110) / 180,
    0,
    1
  );
  const sectorStats = state.metrics.sectorStress || {};
  const sectorCounts = Object.values(sectorStats).map((sector) => safeNumber(sector.count, 0));
  const totalSectors = Math.max(1, sum(sectorCounts));
  const largestSectorShare = sectorCounts.length ? Math.max(...sectorCounts) / totalSectors : 0.25;
  const competitionPressure = clamp(0.18 + Math.max(0, largestSectorShare - 0.32) * 1.1 + Math.max(0, 18 - state.producers.length) / 40, 0, 1);
  const inequalityDrag = clamp(
    safeNumber(m.wealthInequality, 0) * 0.30
      + Math.max(0, 1 - safeNumber(m.lowIncomeConsumptionCapacity, 1)) * 0.34
      + safeNumber(m.socialStressIndex, 0) * 0.26,
    0,
    1
  );
  const supplyBottleneck = clamp(
    Math.max(0, safeNumber(m.capacityUtilization, 75) - 92) / 25
      + Math.max(0, 0.85 - safeNumber(m.inventoryToDemand, 1.2)) * 0.50
      + externalityPressure * 0.28,
    0,
    1
  );
  const publicGoodsGap = clamp(
    Math.max(0, 0.36 - safeNumber(m.fiscalSpaceScore, 0.7)) * 0.52
      + Math.max(0, safeNumber(m.unemploymentGap, 0)) / 25
      + Math.max(0, externalityPressure - 0.45) * 0.22,
    0,
    1
  );
  const inventoryPenalty = clamp(Math.max(0, safeNumber(m.inventoryToDemand, 1) - 2.2) / 2.8, 0, 1);
  const allocationQualityTarget = clamp(
    0.76
      - creditMisallocation * 0.22
      - infoFailure * 0.16
      - inventoryPenalty * 0.16
      - safeNumber(m.zombieFirmRatio, 0) / 100 * 0.14
      - inequalityDrag * 0.12
      + clamp(safeNumber(m.investmentConversionRate, 0.25), 0, 0.8) * 0.12,
    0,
    1
  );
  const marketEfficiencyTarget = clamp(
    allocationQualityTarget * 0.46
      + clamp(safeNumber(m.creditSupplyIndex, 100) / 115, 0, 1) * 0.18
      + clamp(1 - Math.abs(safeNumber(m.outputGap, 0)) / 12, 0, 1) * 0.16
      + clamp(1 - Math.abs(safeNumber(m.inflationGap, 0)) / 6, 0, 1) * 0.12
      + clamp(1 - competitionPressure, 0, 1) * 0.08,
    0,
    1
  );
  const bubbleFailure = clamp(Math.max(
    safeNumber(m.assetBubbleRiskScore, 0),
    safeNumber(m.behavioralMispricingIndex, 0),
    Math.max(0, safeNumber(m.stockMispricing, 0)) / 100,
    Math.max(0, safeNumber(m.housingMispricing, 0)) / 100
  ), 0, 1);
  const failureDrivers = [
    ["정보 비대칭", infoFailure],
    ["신용 배분 실패", creditMisallocation],
    ["자산 버블", bubbleFailure],
    ["독과점/경쟁 약화", competitionPressure],
    ["외부비용 충격", externalityPressure],
    ["불평등에 따른 수요 약화", inequalityDrag],
    ["공공재·안정화 부족", publicGoodsGap],
    ["공급 병목", supplyBottleneck]
  ];
  const strongestFailure = failureDrivers.reduce((best, item) => item[1] > best[1] ? item : best, failureDrivers[0]);
  const marketFailureTarget = clamp(
    infoFailure * 0.15
      + creditMisallocation * 0.18
      + bubbleFailure * 0.14
      + competitionPressure * 0.08
      + externalityPressure * 0.15
      + inequalityDrag * 0.12
      + publicGoodsGap * 0.08
      + supplyBottleneck * 0.10,
    0,
    1
  );
  const broadConsumption = clamp((safeNumber(m.lowIncomeConsumptionCapacity, 1) + clamp(1 - safeNumber(m.middleClassMortgageStress, 0), 0, 1) + safeNumber(m.consumerSentiment, 0.8)) / 3, 0, 1.2);
  const healthyInvestment = clamp(safeNumber(m.investmentConversionRate, 0.25) * 1.8 + Math.max(0, safeNumber(m.sectorTotalInvestment, 0)) / Math.max(1, safeNumber(m.gdp, 1)) * 0.4, 0, 1);
  const successDrivers = [
    ["균형 성장", clamp((1 - Math.abs(safeNumber(m.outputGap, 0)) / 7) * 0.34 + (1 - Math.abs(safeNumber(m.inflationGap, 0)) / 4) * 0.30 + (1 - Math.abs(safeNumber(m.unemploymentGap, 0)) / 12) * 0.22 + marketEfficiencyTarget * 0.14, 0, 1)],
    ["생산성 개선", clamp(healthyInvestment * 0.38 + Math.max(0, safeNumber(m.realWageGrowth, 0)) / 4 * 0.18 + marketEfficiencyTarget * 0.28 + Math.max(0, safeNumber(m.outputGap, 0)) / 10 * 0.10, 0, 1)],
    ["안정적 신용공급", clamp((1 - Math.abs(safeNumber(m.creditSupplyIndex, 100) - 96) / 50) * 0.46 + (1 - safeNumber(m.creditCrunchRisk, 0.12)) * 0.22 + (1 - safeNumber(m.creditExcessRisk, 0.12)) * 0.18, 0, 1)],
    ["광범위한 소비 회복", broadConsumption],
    ["물가 안정", clamp(1 - Math.abs(safeNumber(m.inflationGap, 0)) / 4, 0, 1)],
    ["건전한 투자 확대", clamp(healthyInvestment * 0.62 + (1 - safeNumber(m.firmVulnerability, 0.15)) * 0.22 + safeNumber(m.businessSentiment, 0.8) * 0.16, 0, 1)]
  ];
  const strongestSuccess = successDrivers.reduce((best, item) => item[1] > best[1] ? item : best, successDrivers[0]);
  const successTarget = clamp(strongestSuccess[1] * 0.50 + marketEfficiencyTarget * 0.32 + (1 - marketFailureTarget) * 0.18, 0, 1);

  outcome.allocationQuality = clamp(smoothValue(safeNumber(outcome.allocationQuality, 0.62), allocationQualityTarget, 0.12), 0, 1);
  outcome.marketEfficiency = clamp(smoothValue(safeNumber(outcome.marketEfficiency, 0.62), marketEfficiencyTarget, 0.12), 0, 1);
  outcome.marketFailureRisk = clamp(smoothValue(safeNumber(outcome.marketFailureRisk, 0.22), marketFailureTarget, marketFailureTarget > safeNumber(outcome.marketFailureRisk, 0.22) ? 0.14 : 0.07), 0, 1);
  outcome.marketSuccessScore = clamp(smoothValue(safeNumber(outcome.marketSuccessScore, 0.50), successTarget, 0.10), 0, 1);
  outcome.competitionPressure = competitionPressure;
  outcome.externalityPressure = externalityPressure;
  outcome.informationFailure = infoFailure;
  outcome.creditMisallocation = creditMisallocation;
  outcome.inequalityDrag = inequalityDrag;
  outcome.publicGoodsGap = publicGoodsGap;
  outcome.failureType = strongestFailure[1] > 0.34 ? strongestFailure[0] : "없음";
  outcome.successType = strongestSuccess[1] > 0.56 ? strongestSuccess[0] : "형성 중";

  m.marketEfficiency = outcome.marketEfficiency;
  m.marketFailureRisk = outcome.marketFailureRisk;
  m.marketSuccessScore = outcome.marketSuccessScore;
  m.allocationQuality = outcome.allocationQuality;
  m.competitionPressure = outcome.competitionPressure;
  m.externalityPressure = outcome.externalityPressure;
  m.informationFailure = outcome.informationFailure;
  m.creditMisallocation = outcome.creditMisallocation;
  m.inequalityDrag = outcome.inequalityDrag;
  m.publicGoodsGap = outcome.publicGoodsGap;
  m.marketFailureType = outcome.failureType;
  m.marketSuccessType = outcome.successType;
}
