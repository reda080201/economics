import { clamp, safeNumber, sum } from "./mathUtils.js";

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
