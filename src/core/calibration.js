import { cloneModelParameters, defaultModelParameters } from "./modelParameters.js";
import { rmse, toGrowthRate } from "../data/transformations.js";

export function calibrateParameters({ historicalData, initialParameters = defaultModelParameters, targetSeries = ["gdp", "cpi", "unemployment", "policyRate", "governmentDebt"] }) {
  const candidates = generateParameterCandidates(initialParameters);
  let bestParams = cloneModelParameters(initialParameters);
  let bestLoss = Infinity;
  for (const candidate of candidates) {
    const simulated = simulateCalibrationPath(historicalData, candidate);
    const loss = calculateCalibrationLoss(simulated, historicalData, targetSeries);
    if (loss < bestLoss) {
      bestLoss = loss;
      bestParams = candidate;
    }
  }
  return { parameters: bestParams, loss: bestLoss, candidatesTested: candidates.length };
}

export function generateParameterCandidates(initialParameters) {
  const base = cloneModelParameters(initialParameters);
  return [0.90, 1.00, 1.10].map((scale) => {
    const candidate = cloneModelParameters(base);
    candidate.consumption.incomeWeight *= scale;
    candidate.investment.demandWeight *= scale;
    candidate.inflation.demandGapWeight *= scale;
    candidate.unemployment.outputGapWeight *= scale;
    return candidate;
  });
}

export function calculateCalibrationLoss(simulated, actual, targetSeries) {
  const weights = { gdp: 0.30, cpi: 0.25, unemployment: 0.25, policyRate: 0.10, governmentDebt: 0.10 };
  return targetSeries.reduce((loss, key) => {
    const sim = simulated[key] || [];
    const act = key === "gdp" || key === "cpi" ? toGrowthRate(actual[key] || []).map((p) => p.value) : (actual[key] || []).map((p) => p.value);
    return loss + rmse(sim, act) * (weights[key] || 0.10);
  }, 0);
}

export function simulateCalibrationPath(data, parameters) {
  const gdpGrowth = toGrowthRate(data.gdp || []).map((p) => p.value);
  const cpiGrowth = toGrowthRate(data.cpi || []).map((p) => p.value);
  return {
    gdp: gdpGrowth.map((value) => value * parameters.consumption.incomeWeight / defaultModelParameters.consumption.incomeWeight),
    cpi: cpiGrowth.map((value) => value * parameters.inflation.demandGapWeight / defaultModelParameters.inflation.demandGapWeight),
    unemployment: (data.unemployment || []).map((p) => Number(p.value)),
    policyRate: (data.policyRate || []).map((p) => Number(p.value)),
    governmentDebt: (data.governmentDebt || []).map((p) => Number(p.value))
  };
}
