const clamp = (value, min, max) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

// These transforms keep response-function inputs on the same scale as the runtime.
export function normalizeRealRate(ratePercent) {
  return clamp(Number(ratePercent) / 100, -0.02, 0.08);
}

export function normalizeConsumptionConfidence(confidenceIndex) {
  return clamp((Number(confidenceIndex) - 1) * 0.012, -0.012, 0.012);
}

export function normalizeInvestmentCapacity(capacityUtilization) {
  return clamp((Number(capacityUtilization) - 0.78) * 0.010, -0.008, 0.008);
}

export function normalizeInvestmentUncertainty(uncertainty) {
  return clamp(Number(uncertainty) * 0.012, 0, 0.018);
}
