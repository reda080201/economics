import { TARGET_INFLATION } from "../core/config.js";
import { clamp, safeNumber } from "../core/mathUtils.js";

export function createInitialCausalDecomposition() {
  return {
    categories: [],
    dominant: "형성 중",
    secondary: "없음",
    target: "GDP",
    summary: "경제 신호가 누적되면 원인 분해가 표시됩니다."
  };
}

export function updateCausalDecomposition(state) {
  if (!state.causalDecomposition) state.causalDecomposition = createInitialCausalDecomposition();
  const categories = computeCausalPressureScores(state.metrics || {});
  const sorted = [...categories].sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
  const dominant = sorted[0] || { label: "형성 중", score: 0, target: "GDP" };
  const secondary = sorted[1] || { label: "없음", score: 0, target: "GDP" };
  state.causalDecomposition.categories = categories;
  state.causalDecomposition.dominant = dominant.label;
  state.causalDecomposition.secondary = secondary.label;
  state.causalDecomposition.target = dominant.target;
  state.causalDecomposition.summary = `${dominant.label} 압력이 ${dominant.target}에 가장 크게 작용하고 있습니다.`;
  state.metrics.causalDominant = dominant.label;
  state.metrics.causalSecondary = secondary.label;
  state.metrics.causalDominantScore = dominant.score;
}

export function computeCausalPressureScores(metrics = {}) {
  const score = (value) => clamp(Math.round(safeNumber(value, 0)), -100, 100);
  const outputGap = safeNumber(metrics.outputGap, 0);
  const inflationGap = safeNumber(metrics.inflationGap, safeNumber(metrics.inflation, TARGET_INFLATION) - TARGET_INFLATION);
  const rateDebt = score(
    Math.max(0, safeNumber(metrics.realPolicyRate, 0) - 1.2) * 13
      + Math.max(0, safeNumber(metrics.loanRate, 0) - 5.5) * 8
      + safeNumber(metrics.averageHouseholdDebtBurden, 0) * 1.4
      + Math.max(0, safeNumber(metrics.mortgageRate, 0) - 5.5) * 7
      - Math.max(0, 1.0 - safeNumber(metrics.realPolicyRate, 0)) * 5
  );
  const credit = score(
    Math.max(0, 92 - safeNumber(metrics.creditSupplyIndex, 100)) * 1.0
      + safeNumber(metrics.creditSpread, 2) * 8
      + safeNumber(metrics.creditCrunchRisk, 0.12) * 42
      + safeNumber(metrics.creditOfficerCaution, 0.28) * 28
      + Math.max(0, 0.72 - safeNumber(metrics.interbankTrust, 0.84)) * 48
      - safeNumber(metrics.creditExcessRisk, 0.12) * 18
  );
  const asset = score(
    safeNumber(metrics.assetBubbleRiskScore, 0) * 34
      + Math.max(0, safeNumber(metrics.stockMispricing, 0)) * 0.52
      + Math.max(0, safeNumber(metrics.housingMispricing, 0)) * 0.46
      - Math.max(0, -safeNumber(metrics.stockMonthlyReturn, 0)) * 3.2
      - Math.max(0, 96 - safeNumber(metrics.collateralValueIndex, 100)) * 1.1
  );
  const fiscalTax = score(
    Math.max(0, 0.45 - safeNumber(metrics.fiscalSpaceScore, 0.7)) * 62
      + Math.max(0, safeNumber(metrics.debtToGdpRatio, 0) - 1.0) * 30
      + safeNumber(metrics.taxSentimentScore, 0) * 26
      + safeNumber(metrics.consumptionTaxPain, 0) * 18
      - Math.max(0, safeNumber(metrics.governmentSpendingActual, 0)) / Math.max(1, safeNumber(metrics.gdp, 1)) * 18
  );
  const external = score(
    Math.max(0, safeNumber(metrics.exchangeRateIndex, 100) - 104) * 1.2
      + Math.max(0, safeNumber(metrics.importPriceIndex, 100) - 103) * 1.0
      + Math.max(0, 0.62 - safeNumber(metrics.foreignInvestorSentiment, 0.72)) * 45
      + Math.max(0, 0.62 - safeNumber(metrics.foreignBondDemand, 0.74)) * 38
      + safeNumber(metrics.externalVulnerability, 0) * 28
  );
  const sentimentInfo = score(
    Math.max(0, 0.62 - safeNumber(metrics.consumerSentiment, 0.8)) * 40
      + Math.max(0, 0.62 - safeNumber(metrics.businessSentiment, 0.8)) * 42
      + safeNumber(metrics.recessionFear, 0.2) * 34
      + safeNumber(metrics.informationUncertainty, 0.16) * 24
      + safeNumber(metrics.misperceptionIndex, 0.12) * 22
      + safeNumber(metrics.rumorIntensity, 0) * 18
  );
  const supply = score(
    Math.max(0, safeNumber(metrics.commodityPriceIndex, 100) - 104) * 0.78
      + Math.max(0, safeNumber(metrics.energyPriceIndex, 100) - 104) * 0.75
      + safeNumber(metrics.commodityCostPressure, 0) * 13
      + safeNumber(metrics.agricultureStress, 0) * 28
      + safeNumber(metrics.energyStress, 0) * 32
      + Math.max(0, inflationGap) * 5
  );
  const classPressure = score(
    safeNumber(metrics.lowIncomeStress, 0) * 34
      + safeNumber(metrics.middleClassMortgageStress, 0) * 32
      + safeNumber(metrics.socialStressIndex, 0) * 28
      + Math.max(0, 1 - safeNumber(metrics.lowIncomeConsumptionCapacity, 1)) * 34
      + safeNumber(metrics.classSentimentGap, 0) * 20
  );
  const classifyTarget = (label, value) => {
    if (label === "공급비용" || (value > 25 && inflationGap > 1.0)) return "물가";
    if (label === "금리·부채" || label === "은행·신용" || label === "자산시장") return value > 0 ? "투자" : "소비";
    if (label === "계층 압박" || label === "심리·정보") return "소비";
    if (outputGap < -2) return "GDP";
    return "GDP";
  };
  return [
    { key: "rateDebt", label: "금리·부채", score: rateDebt },
    { key: "credit", label: "은행·신용", score: credit },
    { key: "asset", label: "자산시장", score: asset },
    { key: "fiscalTax", label: "세금·재정", score: fiscalTax },
    { key: "external", label: "대외·환율", score: external },
    { key: "sentimentInfo", label: "심리·정보", score: sentimentInfo },
    { key: "supply", label: "공급비용", score: supply },
    { key: "classPressure", label: "계층 압박", score: classPressure }
  ].map((item) => ({ ...item, target: classifyTarget(item.label, item.score) }));
}
