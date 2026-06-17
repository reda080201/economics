import { cloneModelParameters, defaultModelParameters } from "./modelParameters.js";
import { simulateBacktestPath } from "./backtest.js";
import { rmse, toGrowthRate } from "../data/transformations.js";

export function calibrateParameters({ historicalData, initialParameters = defaultModelParameters, targetSeries = ["gdp", "cpi", "unemployment"] }) {
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
  return {
    parameters: bestParams,
    loss: bestLoss,
    candidatesTested: candidates.length,
    targetSeries,
    method: "recursive_model_path_search"
  };
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
  const dates = (actual.gdp || []).map((point) => point.date);
  const weights = { gdp: 0.38, cpi: 0.32, unemployment: 0.30 };
  return targetSeries.reduce((loss, key) => {
    const sim = key === "gdp" || key === "cpi"
      ? toGrowthRate(toPointSeries(dates, simulated[key] || [])).map((p) => p.value)
      : simulated[key] || [];
    const act = key === "gdp" || key === "cpi"
      ? toGrowthRate(actual[key] || []).map((p) => p.value)
      : (actual[key] || []).map((p) => Number(p.value));
    return loss + rmse(sim, act) * (weights[key] || 0.10);
  }, 0);
}

export function simulateCalibrationPath(data, parameters) {
  return simulateBacktestPath(data, parameters);
}

function toPointSeries(dates, values) {
  return values.map((value, index) => ({ date: dates[index] || String(index), value }));
}
