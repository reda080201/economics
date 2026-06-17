import { defaultModelParameters } from "./modelParameters.js";
import { rmse, toGrowthRate } from "../data/transformations.js";

export function runBacktest(dataset, parameters = defaultModelParameters, options = {}) {
  const dates = (dataset.gdp || []).map((point) => point.date);
  const actual = buildActualSeries(dataset);
  const simulated = simulateBacktestPath(dataset, parameters, options);
  const gdpActualGrowth = toGrowthRate(dataset.gdp || []).map((point) => point.value);
  const cpiActualGrowth = toGrowthRate(dataset.cpi || []).map((point) => point.value);
  const gdpSimGrowth = toGrowthRate(toPointSeries(dates, simulated.gdp)).map((point) => point.value);
  const cpiSimGrowth = toGrowthRate(toPointSeries(dates, simulated.cpi)).map((point) => point.value);
  const unemploymentActualDirection = directionOfChanges(actual.unemployment);
  const unemploymentSimDirection = directionOfChanges(simulated.unemployment);
  const rmseBySeries = {
    gdpGrowth: rmse(gdpSimGrowth, gdpActualGrowth),
    inflation: rmse(cpiSimGrowth, cpiActualGrowth),
    unemployment: rmse(simulated.unemployment, actual.unemployment)
  };

  return {
    observations: dates.length,
    gdpDirectionHitRate: hitRate(gdpSimGrowth.map(Math.sign), gdpActualGrowth.map(Math.sign)),
    inflationDirectionHitRate: hitRate(cpiSimGrowth.map(Math.sign), cpiActualGrowth.map(Math.sign)),
    unemploymentDirectionHitRate: hitRate(unemploymentSimDirection, unemploymentActualDirection),
    averageRmse: (rmseBySeries.gdpGrowth + rmseBySeries.inflation + rmseBySeries.unemployment) / 3,
    largestErrorWindow: largestErrorWindow(dates, simulated, actual),
    simulated,
    actual,
    rmseBySeries,
    method: "recursive_parameter_simulation"
  };
}

export function simulateBacktestPath(dataset, parameters = defaultModelParameters) {
  const dates = (dataset.gdp || []).map((point) => point.date);
  const actual = buildActualSeries(dataset);
  if (!dates.length) return { dates: [], gdp: [], cpi: [], unemployment: [] };
  const simulated = {
    dates,
    gdp: [actual.gdp[0]],
    cpi: [actual.cpi[0]],
    unemployment: [actual.unemployment[0]]
  };

  for (let i = 1; i < dates.length; i += 1) {
    const policyRate = valueAt(actual.policyRate, i - 1, 3);
    const debtPressure = valueAt(actual.governmentDebt, i - 1, 50) / 100;
    const householdDebtPressure = valueAt(actual.householdDebt, i - 1, 80) / 100;
    const exchangeShock = pctChange(valueAt(actual.exchangeRate, i, 100), valueAt(actual.exchangeRate, i - 1, 100));
    const exportGrowth = pctChange(valueAt(actual.exports, i, 100), valueAt(actual.exports, i - 1, 100));
    const importGrowth = pctChange(valueAt(actual.imports, i, 100), valueAt(actual.imports, i - 1, 100));
    const previousGdpGrowth = pctChange(simulated.gdp[i - 1], simulated.gdp[Math.max(0, i - 2)] || simulated.gdp[i - 1]);
    const previousInflation = pctChange(simulated.cpi[i - 1], simulated.cpi[Math.max(0, i - 2)] || simulated.cpi[i - 1]);
    const outputGapProxy = previousGdpGrowth - 2;
    const demandPulse = exportGrowth * 0.18 - policyRate * 0.08 - householdDebtPressure * 0.8 + parameters.consumption.incomeWeight;
    const gdpGrowth = clamp(previousGdpGrowth * 0.35 + demandPulse + parameters.investment.demandWeight * 2.2, -8, 8);
    const inflation = clamp(
      previousInflation * 0.35 +
      parameters.inflation.demandGapWeight * outputGapProxy +
      parameters.inflation.importPriceShockWeight * (exchangeShock + importGrowth) +
      policyRate * -0.05,
      -3,
      12
    );
    const unemploymentChange = clamp(
      parameters.unemployment.outputGapWeight * outputGapProxy +
      parameters.unemployment.firmStressWeight * Math.max(0, debtPressure - 0.7) +
      policyRate * 0.035,
      -2.5,
      3.5
    );
    simulated.gdp.push(Math.max(1, simulated.gdp[i - 1] * (1 + gdpGrowth / 100)));
    simulated.cpi.push(Math.max(1, simulated.cpi[i - 1] * (1 + inflation / 100)));
    simulated.unemployment.push(clamp(simulated.unemployment[i - 1] + unemploymentChange, 0.5, 25));
  }
  return simulated;
}

function buildActualSeries(dataset) {
  return {
    gdp: values(dataset.gdp),
    cpi: values(dataset.cpi),
    unemployment: values(dataset.unemployment),
    policyRate: values(dataset.policyRate),
    governmentDebt: values(dataset.governmentDebt),
    householdDebt: values(dataset.householdDebt),
    exchangeRate: values(dataset.exchangeRate),
    exports: values(dataset.exports),
    imports: values(dataset.imports)
  };
}

function values(series = []) {
  return series.map((point) => Number(point.value));
}

function toPointSeries(dates, valuesList) {
  return valuesList.map((value, index) => ({ date: dates[index] || String(index), value }));
}

function valueAt(valuesList, index, fallback) {
  const value = Number(valuesList[index]);
  return Number.isFinite(value) ? value : fallback;
}

function pctChange(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function directionOfChanges(valuesList) {
  return valuesList.map((value, index) => index === 0 ? 0 : Math.sign(value - valuesList[index - 1]));
}

function hitRate(predicted, actual) {
  const pairs = predicted.map((value, index) => [value, actual[index]]).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  if (!pairs.length) return 0;
  return pairs.filter(([a, b]) => a === b).length / pairs.length;
}

function largestErrorWindow(dates, simulated, actual) {
  if (!dates.length) return "데이터 없음";
  let worstIndex = 0;
  let worstError = -Infinity;
  dates.forEach((_, index) => {
    const error =
      Math.abs((simulated.gdp[index] || 0) - (actual.gdp[index] || 0)) +
      Math.abs((simulated.cpi[index] || 0) - (actual.cpi[index] || 0)) +
      Math.abs((simulated.unemployment[index] || 0) - (actual.unemployment[index] || 0));
    if (error > worstError) {
      worstError = error;
      worstIndex = index;
    }
  });
  return `${dates[Math.max(0, worstIndex - 1)] || dates[worstIndex]} ~ ${dates[worstIndex]}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}
