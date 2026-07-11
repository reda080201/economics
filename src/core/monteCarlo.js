import { random } from "./mathUtils.js";

export function runMonteCarloScenario(baseMetrics, runs = 30) {
  const paths = Array.from({ length: runs }, () => simulatePath(baseMetrics));
  return summarizeMonteCarloResults(paths);
}

export function summarizeMonteCarloResults(paths) {
  const finalGdp = paths.map((path) => path.gdp[path.gdp.length - 1]).sort((a, b) => a - b);
  const finalUnemployment = paths.map((path) => path.unemployment[path.unemployment.length - 1]).sort((a, b) => a - b);
  const debtRisk = paths.filter((path) => path.debtToGdp[path.debtToGdp.length - 1] > 90).length / Math.max(1, paths.length);
  return {
    runs: paths.length,
    gdpMedian: percentile(finalGdp, 0.50),
    gdpP10: percentile(finalGdp, 0.10),
    gdpP90: percentile(finalGdp, 0.90),
    unemploymentMedian: percentile(finalUnemployment, 0.50),
    recessionProbability: paths.filter((path) => path.gdp[path.gdp.length - 1] < path.gdp[0]).length / Math.max(1, paths.length),
    highUnemploymentProbability: paths.filter((path) => path.unemployment[path.unemployment.length - 1] > 8).length / Math.max(1, paths.length),
    fiscalRiskProbability: debtRisk
  };
}

function simulatePath(baseMetrics) {
  const gdp = [Number(baseMetrics.gdp) || 100];
  const unemployment = [Number(baseMetrics.unemploymentRate) || 5];
  const debtToGdp = [(Number(baseMetrics.debtToGdpRatio) || 0.5) * 100];
  for (let i = 0; i < 24; i += 1) {
    const shock = randomNormal() * 0.012;
    gdp.push(Math.max(1, gdp[gdp.length - 1] * (1 + 0.003 + shock)));
    unemployment.push(Math.max(0, unemployment[unemployment.length - 1] + randomNormal() * 0.10 - shock * 8));
    debtToGdp.push(Math.max(0, debtToGdp[debtToGdp.length - 1] + randomNormal() * 0.18 + (shock < 0 ? 0.25 : -0.05)));
  }
  return { gdp, unemployment, debtToGdp };
}

function percentile(values, p) {
  if (!values.length) return 0;
  const index = Math.min(values.length - 1, Math.max(0, Math.floor(p * (values.length - 1))));
  return values[index];
}

function randomNormal() {
  return (random() + random() + random() + random() - 2) / 2;
}
