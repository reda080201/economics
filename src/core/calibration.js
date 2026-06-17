import { cloneModelParameters, defaultModelParameters } from "./modelParameters.js";
import { simulateBacktestPath } from "./backtest.js";
import { rmse, toGrowthRate } from "../data/transformations.js";

export function calibrateParameters({ historicalData, initialParameters = defaultModelParameters, targetSeries = ["gdp", "cpi", "unemployment"] }) {
  const candidateRecords = generateParameterCandidateRecords(initialParameters);
  const candidates = candidateRecords.map((record) => record.parameters);
  const baselineParameters = cloneModelParameters(initialParameters);
  const baselineSimulated = simulateCalibrationPath(historicalData, baselineParameters);
  const baselineLoss = calculateCalibrationLoss(baselineSimulated, historicalData, targetSeries);
  let bestParams = cloneModelParameters(initialParameters);
  let bestScales = createBaselineScales();
  let bestLoss = baselineLoss;
  for (const record of candidateRecords) {
    const simulated = simulateCalibrationPath(historicalData, record.parameters);
    const loss = calculateCalibrationLoss(simulated, historicalData, targetSeries);
    if (loss < bestLoss) {
      bestLoss = loss;
      bestParams = record.parameters;
      bestScales = record.scales;
    }
  }
  const variableBreakdown = calculateVariableBreakdown(simulateCalibrationPath(historicalData, bestParams), historicalData, targetSeries);
  const rankedBreakdown = variableBreakdown
    .filter((entry) => Number.isFinite(entry.weightedContribution))
    .sort((a, b) => a.weightedContribution - b.weightedContribution);
  const improvementRate = baselineLoss > 0 ? Math.max(0, (baselineLoss - bestLoss) / baselineLoss) : 0;
  return {
    parameters: bestParams,
    baselineLoss,
    loss: bestLoss,
    improvementRate,
    selectedParameterScales: bestScales,
    variableBreakdown,
    bestVariable: rankedBreakdown[0]?.label || "",
    weakestVariable: rankedBreakdown[rankedBreakdown.length - 1]?.label || "",
    candidatesTested: candidates.length,
    targetSeries,
    method: "recursive_model_path_search"
  };
}

export function generateParameterCandidates(initialParameters) {
  return generateParameterCandidateRecords(initialParameters).map((record) => record.parameters);
}

function generateParameterCandidateRecords(initialParameters) {
  const base = cloneModelParameters(initialParameters);
  const grids = {
    consumptionIncome: [0.85, 0.95, 1.05, 1.15],
    investmentDemand: [0.85, 0.95, 1.05, 1.15],
    inflationDemandGap: [0.80, 0.95, 1.10, 1.25],
    unemploymentOutputGap: [0.80, 0.95, 1.10, 1.25]
  };
  const candidates = [];
  for (const consumptionScale of grids.consumptionIncome) {
    for (const investmentScale of grids.investmentDemand) {
      for (const inflationScale of grids.inflationDemandGap) {
        for (const unemploymentScale of grids.unemploymentOutputGap) {
          const candidate = cloneModelParameters(base);
          candidate.consumption.incomeWeight *= consumptionScale;
          candidate.investment.demandWeight *= investmentScale;
          candidate.inflation.demandGapWeight *= inflationScale;
          candidate.unemployment.outputGapWeight *= unemploymentScale;
          candidates.push({
            parameters: candidate,
            scales: {
              consumptionIncome: consumptionScale,
              investmentDemand: investmentScale,
              inflationDemandGap: inflationScale,
              unemploymentOutputGap: unemploymentScale
            }
          });
        }
      }
    }
  }
  return candidates;
}

export function calculateCalibrationLoss(simulated, actual, targetSeries) {
  return calculateVariableBreakdown(simulated, actual, targetSeries).reduce((loss, entry) => loss + entry.weightedContribution, 0);
}

export function calculateVariableBreakdown(simulated, actual, targetSeries) {
  const dates = (actual.gdp || []).map((point) => point.date);
  const weights = { gdp: 0.38, cpi: 0.32, unemployment: 0.30 };
  const labels = { gdp: "GDP", cpi: "물가", unemployment: "실업률" };
  return targetSeries.map((key) => {
    const sim = key === "gdp" || key === "cpi"
      ? toGrowthRate(toPointSeries(dates, simulated[key] || [])).map((p) => p.value)
      : simulated[key] || [];
    const act = key === "gdp" || key === "cpi"
      ? toGrowthRate(actual[key] || []).map((p) => p.value)
      : (actual[key] || []).map((p) => Number(p.value));
    const seriesRmse = rmse(sim, act);
    const weight = weights[key] || 0.10;
    return {
      key,
      label: labels[key] || key,
      rmse: seriesRmse,
      weight,
      weightedContribution: seriesRmse * weight
    };
  });
}

export function simulateCalibrationPath(data, parameters) {
  return simulateBacktestPath(data, parameters);
}

function createBaselineScales() {
  return {
    consumptionIncome: 1,
    investmentDemand: 1,
    inflationDemandGap: 1,
    unemploymentOutputGap: 1
  };
}

function toPointSeries(dates, values) {
  return values.map((value, index) => ({ date: dates[index] || String(index), value }));
}
