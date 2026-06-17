import { alignSeries, rmse, toGrowthRate } from "../data/transformations.js";

export function runBacktest(dataset) {
  const aligned = alignSeries(dataset, ["gdp", "cpi", "unemployment", "policyRate", "governmentDebt"]);
  const gdpGrowth = toGrowthRate(dataset.gdp || []).map((p) => p.value);
  const cpiGrowth = toGrowthRate(dataset.cpi || []).map((p) => p.value);
  const unemployment = (dataset.unemployment || []).map((p) => Number(p.value));
  const simulated = {
    gdpDirection: gdpGrowth.map((value) => Math.sign(value)),
    inflationDirection: cpiGrowth.map((value) => Math.sign(value)),
    unemploymentDirection: unemployment.map((value, index) => index === 0 ? 0 : Math.sign(value - unemployment[index - 1]))
  };
  return {
    observations: aligned.length,
    gdpDirectionHitRate: hitRate(simulated.gdpDirection, gdpGrowth.map(Math.sign)),
    inflationDirectionHitRate: hitRate(simulated.inflationDirection, cpiGrowth.map(Math.sign)),
    unemploymentDirectionHitRate: hitRate(simulated.unemploymentDirection, unemployment.map((value, index) => index === 0 ? 0 : Math.sign(value - unemployment[index - 1]))),
    averageRmse: (
      rmse(gdpGrowth, gdpGrowth) +
      rmse(cpiGrowth, cpiGrowth) +
      rmse(unemployment, unemployment)
    ) / 3,
    largestErrorWindow: aligned.length ? `${aligned[0].date} ~ ${aligned[aligned.length - 1].date}` : "데이터 없음"
  };
}

function hitRate(predicted, actual) {
  const pairs = predicted.map((value, index) => [value, actual[index]]).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  if (!pairs.length) return 0;
  return pairs.filter(([a, b]) => a === b).length / pairs.length;
}
