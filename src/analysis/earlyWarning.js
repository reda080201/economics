import { TARGET_INFLATION } from "../core/config.js";
import { clamp, round, safeNumber } from "../core/mathUtils.js";

export function createInitialEarlyWarning() {
  return {
    items: [],
    topRisks: [],
    summary: "조기경보 신호가 안정 범위입니다.",
    maxScore: 0
  };
}

export function updateEarlyWarningSystem(state, formatters = {}) {
  if (!state.earlyWarning) state.earlyWarning = createInitialEarlyWarning();
  const m = state.metrics || {};
  const warning = (label, rawScore) => {
    const score = clamp(Math.round(safeNumber(rawScore, 0)), 0, 100);
    const level = score >= 70 ? "위험" : score >= 42 ? "주의" : "안정";
    return { label, score, level };
  };
  const items = [
    warning("신용경색", safeNumber(m.creditCrunchRisk, 0.12) * 58 + Math.max(0, 88 - safeNumber(m.creditSupplyIndex, 100)) * 0.85 + safeNumber(m.creditSpread, 2) * 5.8 + safeNumber(m.creditOfficerCaution, 0.28) * 22),
    warning("신용 과다", safeNumber(m.creditExcessRisk, 0.12) * 62 + safeNumber(m.riskUnderpricing, 0.12) * 24 + Math.max(0, safeNumber(m.creditGap, 0)) * 90 + safeNumber(m.assetBubbleRiskScore, 0) * 20),
    warning("자산버블", safeNumber(m.assetBubbleRiskScore, 0) * 46 + Math.max(0, safeNumber(m.stockMispricing, 0)) * 0.58 + Math.max(0, safeNumber(m.housingMispricing, 0)) * 0.52 + safeNumber(m.fomoIntensity, 0) * 20),
    warning("은행불안", safeNumber(m.bankStress, 0) * 36 + Math.max(0, 76 - safeNumber(m.bankHealthIndex, 100)) * 0.78 + Math.max(0, 0.66 - safeNumber(m.depositorConfidence, 0.88)) * 52 + Math.max(0, 0.66 - safeNumber(m.interbankTrust, 0.84)) * 48),
    warning("외환불안", Math.max(0, safeNumber(m.exchangeRateIndex, 100) - 106) * 1.6 + Math.max(0, safeNumber(m.importPriceIndex, 100) - 105) * 1.1 + Math.max(0, 0.60 - safeNumber(m.foreignInvestorSentiment, 0.72)) * 52 + safeNumber(m.externalVulnerability, 0) * 28),
    warning("재정압박", Math.max(0, safeNumber(m.debtToGdpRatio, 0) - 1.0) * 42 + Math.max(0, 0.48 - safeNumber(m.fiscalSpaceScore, 0.7)) * 72 + Math.max(0, 0.55 - safeNumber(m.fiscalCredibility, 0.75)) * 42 + Math.max(0, safeNumber(m.governmentAverageFundingRate, 0) - 5.5) * 5),
    warning("인플레이션 기대불안", Math.max(0, safeNumber(m.sentimentInflationExpectations, TARGET_INFLATION) - TARGET_INFLATION) * 24 + Math.max(0, safeNumber(m.inflation, TARGET_INFLATION) - TARGET_INFLATION) * 8 + Math.max(0, 0.62 - safeNumber(m.inflationTargetCredibility, 0.8)) * 52 + safeNumber(m.safeHavenDemand, 0) * 0.22),
    warning("계층 스트레스", safeNumber(m.lowIncomeStress, 0) * 35 + safeNumber(m.middleClassMortgageStress, 0) * 30 + safeNumber(m.socialStressIndex, 0) * 30 + Math.max(0, 1 - safeNumber(m.lowIncomeConsumptionCapacity, 1)) * 34),
    warning("시장 실패", safeNumber(m.marketFailureRisk, 0.22) * 66 + safeNumber(m.informationFailure, 0.12) * 16 + safeNumber(m.creditMisallocation, 0.12) * 18 + safeNumber(m.inequalityDrag, 0.12) * 12)
  ].sort((a, b) => b.score - a.score);
  state.earlyWarning.items = items;
  state.earlyWarning.topRisks = items.slice(0, 3);
  state.earlyWarning.maxScore = items[0]?.score || 0;
  state.earlyWarning.summary = items.slice(0, 3).map((item) => `${item.label} ${item.level}`).join(" · ");
  state.metrics.earlyWarningMaxScore = state.earlyWarning.maxScore;
  state.metrics.earlyWarningTopRisk = items[0]?.label || "없음";
  state.metrics.earlyWarningReason = earlyWarningReasonLabel(items[0]?.label || "없음", m, formatters);
}

export function earlyWarningReasonLabel(label, metrics = {}, formatters = {}) {
  const percent = formatters.percent || ((value, digits = 1) => `${round(value, digits).toFixed(digits)}%`);
  const signedPercent = formatters.signedPercent || ((value, digits = 1) => `${value >= 0 ? "+" : ""}${round(value, digits).toFixed(digits)}%`);
  const formatSigned = formatters.formatSigned || ((value, digits = 1) => `${value >= 0 ? "+" : ""}${round(value, digits).toFixed(digits)}`);
  const reasons = {
    "신용경색": `신용공급 ${round(safeNumber(metrics.creditSupplyIndex, 100), 1).toFixed(1)}, 신용스프레드 ${round(safeNumber(metrics.creditSpread, 0), 2).toFixed(2)}%p`,
    "신용 과다": `신용갭 ${formatSigned(safeNumber(metrics.creditGap, 0) * 100, 1)}%p, 위험 과소평가 ${percent(safeNumber(metrics.riskUnderpricing, 0) * 100, 0)}`,
    "자산버블": `주식 괴리 ${signedPercent(safeNumber(metrics.stockMispricing, 0))}, 주택 괴리 ${signedPercent(safeNumber(metrics.housingMispricing, 0))}`,
    "은행불안": `은행건전성 ${round(safeNumber(metrics.bankHealthIndex, 100), 1).toFixed(1)}, 은행 간 신뢰 ${percent(safeNumber(metrics.interbankTrust, 0.84) * 100, 0)}`,
    "외환불안": `환율지수 ${round(safeNumber(metrics.exchangeRateIndex, 100), 1).toFixed(1)}, 수입물가 ${round(safeNumber(metrics.importPriceIndex, 100), 1).toFixed(1)}`,
    "재정압박": `부채/GDP ${percent(safeNumber(metrics.debtToGdpRatio, 0) * 100, 1)}, 재정여력 ${percent(safeNumber(metrics.fiscalSpaceScore, 0.7) * 100, 0)}`,
    "인플레이션 기대불안": `기대물가 ${signedPercent(safeNumber(metrics.sentimentInflationExpectations, TARGET_INFLATION))}, 목표 신뢰 ${percent(safeNumber(metrics.inflationTargetCredibility, 0.8) * 100, 0)}`,
    "계층 스트레스": `저소득 스트레스 ${percent(safeNumber(metrics.lowIncomeStress, 0) * 100, 0)}, 중산층 주거부담 ${percent(safeNumber(metrics.middleClassHousingBurden, 0), 1)}`,
    "시장 실패": `실패유형 ${metrics.marketFailureType || "없음"}, 배분효율 ${percent(safeNumber(metrics.allocationQuality, 0.62) * 100, 0)}`
  };
  return reasons[label] || "위험 신호가 안정 범위입니다.";
}
