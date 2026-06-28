import { average, clamp, safeNumber } from "../core/mathUtils.js";
import { fetchFredSeries } from "../data/fredAdapter.js";
import { buildMonthlyDateRange, forwardFillSeriesToDates } from "../data/transformations.js";
import { liquiditySeriesKeys, liquiditySeriesMap } from "./liquiditySeriesMap.js";

export async function loadLiquidityRadarDataset({ apiKey = "", proxyUrl = "", startDate = "2019-01", endDate = "2024-12" } = {}) {
  const dates = buildMonthlyDateRange(startDate, endDate);
  const safeDates = dates.length ? dates : buildMonthlyDateRange("2019-01", "2024-12");
  const rawSeries = {};
  const sourceMap = {};
  const statusMap = {};
  const warnings = [];

  await Promise.all(liquiditySeriesKeys.map(async (key) => {
    const config = liquiditySeriesMap[key];
    try {
      const series = await fetchFredSeries({
        apiKey,
        seriesId: config.seriesId,
        startDate,
        endDate,
        label: config.label,
        proxyUrl
      });
      if (!series.length) throw new Error("빈 series");
      rawSeries[key] = series;
      sourceMap[key] = "FRED";
      statusMap[key] = proxyUrl ? "live_proxy" : "live";
    } catch (error) {
      rawSeries[key] = createFallbackLiquiditySeries(key, safeDates);
      sourceMap[key] = "로컬 샘플";
      statusMap[key] = String(error?.message || "").includes("CORS") ? "cors_failed" : "fallback";
      warnings.push(`${config.label}: ${error?.message || String(error)}`);
    }
  }));

  const series = {};
  liquiditySeriesKeys.forEach((key) => {
    series[key] = forwardFillSeriesToDates(rawSeries[key] || [], safeDates);
  });

  return {
    source: "FRED/liquidity",
    updatedAt: new Date().toISOString(),
    startDate: safeDates[0],
    endDate: safeDates[safeDates.length - 1],
    series,
    sourceMap,
    statusMap,
    warnings,
    proxyUsed: Boolean(String(proxyUrl || "").trim()),
    loadedSeries: liquiditySeriesKeys.filter((key) => sourceMap[key] === "FRED"),
    fallbackSeries: liquiditySeriesKeys.filter((key) => sourceMap[key] !== "FRED")
  };
}

export function computeLiquidityMetrics(dataset = {}) {
  const metrics = {
    updatedAt: dataset.updatedAt,
    startDate: dataset.startDate,
    endDate: dataset.endDate,
    sourceMap: dataset.sourceMap || {},
    statusMap: dataset.statusMap || {},
    loadedSeries: dataset.loadedSeries || [],
    fallbackSeries: dataset.fallbackSeries || [],
    proxyUsed: Boolean(dataset.proxyUsed),
    warnings: dataset.warnings || [],
    series: {}
  };

  liquiditySeriesKeys.forEach((key) => {
    metrics.series[key] = computeSeriesMetrics(dataset.series?.[key] || []);
  });

  const netSeries = computeFedNetLiquiditySeries(dataset.series || {});
  metrics.series.fedNetLiquidity = computeSeriesMetrics(netSeries);
  metrics.sourceMap.fedNetLiquidity = isDerivedFromLive(metrics.sourceMap) ? "FRED 파생" : "로컬 샘플 파생";
  metrics.statusMap.fedNetLiquidity = "derived";
  metrics.fedNetLiquidity = metrics.series.fedNetLiquidity.latest;

  return metrics;
}

function computeSeriesMetrics(series = []) {
  const clean = series
    .filter((point) => point && Number.isFinite(Number(point.value)))
    .map((point) => ({ ...point, value: Number(point.value) }))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const latestPoint = clean[clean.length - 1] || { date: "", value: 0 };
  const values = clean.map((point) => point.value);
  const latest = safeNumber(latestPoint.value, 0);
  const windowValues = values.slice(-36);
  const mean = average(windowValues);
  const variance = windowValues.length
    ? average(windowValues.map((value) => (value - mean) ** 2))
    : 0;
  const std = Math.sqrt(Math.max(variance, 0));
  const peak = values.length ? Math.max(...values) : latest;
  return {
    date: latestPoint.date || "",
    latest,
    changes: {
      m1: percentageChange(clean, 1),
      m3: percentageChange(clean, 3),
      m6: percentageChange(clean, 6)
    },
    zScore: std > 0.000001 ? clamp((latest - mean) / std, -5, 5) : 0,
    drawdown: peak > 0 ? clamp(latest / peak - 1, -1, 0) : 0,
    observations: clean.length
  };
}

function percentageChange(series, lag) {
  if (!series.length || series.length <= lag) return 0;
  const latest = safeNumber(series[series.length - 1].value, 0);
  const previous = safeNumber(series[series.length - 1 - lag].value, latest);
  if (Math.abs(previous) < 0.000001) return 0;
  return clamp((latest - previous) / Math.abs(previous), -5, 5);
}

function computeFedNetLiquiditySeries(seriesMap) {
  const walcl = seriesMap.walcl || [];
  const tga = seriesMap.tga || [];
  const rrp = seriesMap.rrp || [];
  return walcl.map((point, index) => ({
    date: point.date,
    value: safeNumber(point.value, 0) - safeNumber(tga[index]?.value, 0) - safeNumber(rrp[index]?.value, 0),
    source: "derived",
    seriesCode: "FED_NET_LIQUIDITY",
    label: "Fed 순유동성"
  }));
}

function createFallbackLiquiditySeries(key, dates) {
  const config = liquiditySeriesMap[key];
  return dates.map((date, index) => {
    const cycle = Math.sin(index / 5.5) * safeNumber(config.fallbackCycle, 0);
    const secondCycle = Math.cos(index / 11) * safeNumber(config.fallbackCycle, 0) * 0.32;
    const value = Math.max(0.0001, safeNumber(config.fallbackStart, 100) + safeNumber(config.fallbackMonthlyDrift, 0) * index + cycle + secondCycle);
    return {
      date,
      value,
      source: "sample",
      seriesCode: config.seriesId,
      label: config.label
    };
  });
}

function isDerivedFromLive(sourceMap = {}) {
  return ["walcl", "tga", "rrp"].some((key) => sourceMap[key] === "FRED");
}
