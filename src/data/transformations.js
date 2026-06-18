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

export function buildMonthlyDateRange(startDate, endDate) {
  const start = parseMonth(startDate);
  const end = parseMonth(endDate);
  if (!start || !end || start > end) return [];
  const dates = [];
  const cursor = new Date(Date.UTC(start.year, start.month - 1, 1));
  const last = new Date(Date.UTC(end.year, end.month - 1, 1));
  while (cursor <= last) {
    dates.push(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return dates;
}

export function forwardFillSeriesToDates(series = [], dates = []) {
  const sorted = [...series]
    .filter((point) => point && /^\d{4}-\d{2}$/.test(String(point.date || "")) && Number.isFinite(Number(point.value)))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (!dates.length || !sorted.length) return [];
  let index = 0;
  let lastPoint = null;
  return dates.map((date) => {
    while (index < sorted.length && sorted[index].date <= date) {
      lastPoint = sorted[index];
      index += 1;
    }
    const sourcePoint = lastPoint || sorted[0];
    return {
      ...sourcePoint,
      date,
      value: Number(sourcePoint.value)
    };
  });
}

export function alignMacroDatasetMonthly(dataset, { startDate, endDate, keys = [] } = {}) {
  const dates = buildMonthlyDateRange(startDate, endDate);
  if (!dates.length) return { ...dataset, alignmentMethod: "none" };
  const aligned = { ...dataset, alignmentMethod: "monthly_forward_fill" };
  keys.forEach((key) => {
    aligned[key] = forwardFillSeriesToDates(dataset[key] || [], dates);
  });
  return aligned;
}

export function rmse(simulated, actual) {
  const pairs = simulated.map((value, index) => [Number(value), Number(actual[index])]).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  if (!pairs.length) return 0;
  const mse = pairs.reduce((total, [a, b]) => total + (a - b) ** 2, 0) / pairs.length;
  return Math.sqrt(mse);
}

function parseMonth(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return { year, month };
}
