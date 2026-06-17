export function toGrowthRate(series) {
  return series.map((point, index) => {
    if (index === 0) return { ...point, value: 0 };
    const previous = Number(series[index - 1].value) || 0;
    const current = Number(point.value) || 0;
    const value = previous === 0 ? 0 : ((current - previous) / Math.abs(previous)) * 100;
    return { ...point, value };
  });
}

export function alignSeries(dataset, keys) {
  const dates = new Set();
  keys.forEach((key) => (dataset[key] || []).forEach((point) => dates.add(point.date)));
  return Array.from(dates).sort().map((date) => {
    const row = { date };
    keys.forEach((key) => {
      const point = (dataset[key] || []).find((entry) => entry.date === date);
      row[key] = point ? Number(point.value) : null;
    });
    return row;
  });
}

export function rmse(simulated, actual) {
  const pairs = simulated.map((value, index) => [Number(value), Number(actual[index])]).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  if (!pairs.length) return 0;
  const mse = pairs.reduce((total, [a, b]) => total + (a - b) ** 2, 0) / pairs.length;
  return Math.sqrt(mse);
}
