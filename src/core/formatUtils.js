import { clamp, round, safeNumber, sum } from "./mathUtils.js";

export function giniCoefficient(values) {
  const arr = values.map((value) => Math.max(0, safeNumber(value, 0))).sort((a, b) => a - b);
  const n = arr.length;
  const total = sum(arr);
  if (!n || total <= 0) return 0;
  let weighted = 0;
  arr.forEach((value, index) => {
    weighted += (index + 1) * value;
  });
  return clamp((2 * weighted) / (n * total) - (n + 1) / n, 0, 1);
}

export function mostFrequent(values) {
  const counts = new Map();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  let best = values[0] || "없음";
  let bestCount = 0;
  counts.forEach((count, value) => {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  });
  return best;
}

export function creditRatingScore(rating) {
  return rating === "A" ? 4 : rating === "BBB" ? 3 : rating === "BB" ? 2 : 1;
}

export function sectorLabel(sector) {
  const labels = {
    agriculture: "농업",
    services: "서비스업",
    manufacturing: "제조업",
    technology: "기술산업",
    financial: "금융업",
    energy: "에너지산업",
    construction: "건설·부동산업",
    staples: "필수소비재"
  };
  return labels[sector] || "기타";
}

export function capacityLabel(value) {
  const v = safeNumber(value, 1);
  if (v >= 1.25) return "강함";
  if (v >= 0.85) return "보통";
  if (v >= 0.60) return "약함";
  return "위험";
}

export function creditRatingLabelFromScore(score) {
  const s = safeNumber(score, 3);
  if (s >= 3.65) return "A";
  if (s >= 2.65) return "BBB";
  if (s >= 1.65) return "BB";
  return "취약";
}

export function sentimentLabel(value, positive = true) {
  const v = safeNumber(value, positive ? 0.7 : 0.3);
  if (positive) {
    if (v >= 0.82) return "강함";
    if (v >= 0.58) return "보통";
    if (v >= 0.36) return "약함";
    return "위험";
  }
  return riskLabel(v);
}

export function riskLabel(value) {
  const v = safeNumber(value, 0);
  if (v < 0.28) return "낮음";
  if (v < 0.52) return "보통";
  if (v < 0.74) return "높음";
  return "위험";
}

export function formatStockReturn(value) {
  const safe = safeNumber(value, 0) * 100;
  const sign = safe > 0 ? "+" : "";
  return `${sign}${safe.toFixed(1)}%`;
}

export function stockVolatilityLabel(value) {
  const monthlyVolatility = safeNumber(value, 0) * 100;
  if (monthlyVolatility < 1.5) return "낮음";
  if (monthlyVolatility < 3.5) return "보통";
  if (monthlyVolatility < 6.0) return "높음";
  return "매우 높음";
}

export function valuationPressureLabel(value) {
  const pressure = safeNumber(value, 0);
  if (pressure < 0.28) return "낮음";
  if (pressure < 0.58) return "주의";
  return "높음";
}

export function stockRiskSentimentLabel(value) {
  const sentiment = safeNumber(value, 0.65);
  if (sentiment >= 0.65) return "안정";
  if (sentiment >= 0.40) return "주의";
  return "위험";
}

export function fearGreedLabel(value) {
  const index = safeNumber(value, 50);
  if (index < 20) return "극단적 공포";
  if (index < 40) return "공포";
  if (index < 60) return "중립";
  if (index < 80) return "탐욕";
  return "극단적 탐욕";
}

export function stockVolatilityIndexLabel(value) {
  const index = safeNumber(value, 18);
  if (index < 16) return "낮음";
  if (index < 30) return "보통";
  if (index < 48) return "높음";
  return "공포";
}

export function realEstateStressLabel(value) {
  const stress = safeNumber(value, 0);
  if (stress < 0.25) return "낮음";
  if (stress < 0.50) return "주의";
  if (stress < 0.72) return "높음";
  return "위험";
}

export function housingStatusLabel(value) {
  const labels = {
    renter: "임차",
    lowMortgageOwner: "저부담 자가",
    highMortgageOwner: "고부담 자가",
    highAssetOwner: "고자산 자가"
  };
  return labels[value] || "주거 상태 미상";
}

export function propertyExposureLabel(value) {
  const labels = {
    assetLight: "자산 경량",
    renter: "임차 기업",
    propertyOwner: "부동산 보유",
    leveragedProperty: "레버리지 부동산"
  };
  return labels[value] || "일반";
}

export function translatePreference(preference) {
  if (preference === "budget") return "저가 선호";
  if (preference === "quality") return "품질 선호";
  return "균형 선호";
}

export function money(value, digits = 0) {
  const safe = safeNumber(value, 0);
  return `₩${safe.toLocaleString("ko-KR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  })}`;
}

export function compactMoney(value) {
  const safe = safeNumber(value, 0);
  const sign = safe < 0 ? "-" : "";
  const abs = Math.abs(safe);
  if (abs >= 1000000) return `${sign}₩${round(abs / 1000000, 1)}M`;
  if (abs >= 1000) return `${sign}₩${round(abs / 1000, 1)}K`;
  return `${sign}₩${round(abs, 0)}`;
}

export function percent(value, digits = 1) {
  return `${safeNumber(value, 0).toFixed(digits)}%`;
}

export function formatSigned(value, digits = 1) {
  const safe = safeNumber(value, 0);
  const sign = safe > 0 ? "+" : "";
  return `${sign}${safe.toFixed(digits)}`;
}

export function signedPercent(value) {
  const safe = safeNumber(value, 0);
  const sign = safe > 0 ? "+" : "";
  return `${sign}${safe.toFixed(2)}%`;
}

export function formatIndexPoint(value) {
  return `${Math.round(safeNumber(value, 0)).toLocaleString("ko-KR")}pt`;
}

export function intensityLabel(value) {
  const v = safeNumber(value, 0);
  if (v < 0.25) return "낮음";
  if (v < 0.50) return "주의";
  if (v < 0.75) return "불안";
  return "공포";
}

export function behavioralLabel(value) {
  const v = safeNumber(value, 0);
  if (v < 0.25) return "낮음";
  if (v < 0.52) return "보통";
  if (v < 0.72) return "높음";
  if (v < 0.92) return "과열";
  return "위험";
}

export function classStatusLabel(confidence, stress = 0) {
  const c = safeNumber(confidence, 0.75);
  const s = safeNumber(stress, 0);
  if (s > 0.72 || c < 0.34) return "위험";
  if (s > 0.52 || c < 0.52) return "약함";
  if (c > 0.78 && s < 0.34) return "좋음";
  return "보통";
}

export function accuracyLabel(value) {
  const v = safeNumber(value, 0.75);
  if (v >= 0.78) return "강함";
  if (v >= 0.58) return "보통";
  if (v >= 0.38) return "약함";
  return "위험";
}

export function perceptionGapLabel(perceivedValue, actualValue) {
  const gap = Math.abs(safeNumber(perceivedValue, actualValue) - safeNumber(actualValue, perceivedValue));
  if (gap < 0.10) return "보통";
  if (gap < 0.28) return "주의";
  return "불안";
}

export function expectationMoodLabel(value) {
  const v = safeNumber(value, 0);
  if (v > 2.5) return "낙관";
  if (v < -2.5) return "비관";
  return "중립";
}
