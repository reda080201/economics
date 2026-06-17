import { macroSeriesKeys } from "./dataSources.js";
import { fetchFredSeries, fredSeriesMap } from "./fredAdapter.js";
import { fetchEcosSeries } from "./ecosAdapter.js";
import { fetchOecdSeries } from "./oecdAdapter.js";

export async function buildLiveMacroDataset({ country = "us", provider = "local", apiKeys = {}, startDate = "2015-01", endDate = "2024-12", fallbackDataset }) {
  const fallback = normalizeFallbackDataset(fallbackDataset);
  if (provider === "fred") {
    return buildFredDataset({ country, apiKey: apiKeys.fred, startDate, endDate, fallbackDataset: fallback });
  }
  if (provider === "ecos") {
    return buildStubFallbackDataset({ provider: "ECOS", fallbackDataset: fallback, loader: fetchEcosSeries });
  }
  if (provider === "oecd") {
    return buildStubFallbackDataset({ provider: "OECD", fallbackDataset: fallback, loader: fetchOecdSeries });
  }
  return fallback;
}

async function buildFredDataset({ country, apiKey, startDate, endDate, fallbackDataset }) {
  const liveSeries = {};
  const warnings = [];
  if (country !== "us") {
    warnings.push("FRED 1차 연동은 미국 데이터 중심입니다. 선택 국가와 맞지 않는 지표는 로컬 샘플로 보완했습니다.");
  }

  await Promise.all(Object.entries(fredSeriesMap).map(async ([key, config]) => {
    try {
      liveSeries[key] = await fetchFredSeries({
        apiKey,
        seriesId: config.seriesId,
        startDate,
        endDate,
        label: config.label
      });
      if (!liveSeries[key].length) {
        delete liveSeries[key];
        warnings.push(`FRED ${key} 데이터가 비어 있어 로컬 샘플로 보완했습니다.`);
      }
    } catch (error) {
      warnings.push(`${config.label}: ${error?.message || String(error)}`);
    }
  }));

  return mergeWithFallback({
    providerLabel: "FRED",
    country,
    liveSeries,
    fallbackDataset,
    warnings
  });
}

async function buildStubFallbackDataset({ provider, fallbackDataset, loader }) {
  const warnings = [];
  try {
    await loader({});
  } catch (error) {
    warnings.push(`${provider} 데이터를 불러오지 못해 로컬 샘플 데이터로 전환했습니다. 원인: ${error?.message || String(error)}`);
  }
  return mergeWithFallback({
    providerLabel: provider,
    country: fallbackDataset.country,
    liveSeries: {},
    fallbackDataset,
    warnings
  });
}

function mergeWithFallback({ providerLabel, country, liveSeries, fallbackDataset, warnings }) {
  const dataset = {
    ...fallbackDataset,
    country,
    label: `${fallbackDataset.label || country || "sample"} · ${providerLabel} live/fallback`,
    source: providerLabel,
    updatedAt: new Date().toISOString(),
    warnings: [...warnings],
    loadedSeries: [],
    missingSeries: [],
    fallbackUsed: false
  };

  macroSeriesKeys.forEach((key) => {
    const series = Array.isArray(liveSeries[key]) ? liveSeries[key] : [];
    if (series.length) {
      dataset[key] = series;
      dataset.loadedSeries.push(key);
    } else {
      dataset[key] = Array.isArray(fallbackDataset[key]) ? fallbackDataset[key] : [];
      dataset.missingSeries.push(key);
      dataset.fallbackUsed = true;
    }
  });

  if (!dataset.loadedSeries.length) {
    dataset.warnings.push(`${providerLabel} live series를 불러오지 못해 전체 로컬 샘플을 사용했습니다.`);
  }
  return dataset;
}

function normalizeFallbackDataset(fallbackDataset = {}) {
  const dataset = { ...fallbackDataset };
  macroSeriesKeys.forEach((key) => {
    if (!Array.isArray(dataset[key])) dataset[key] = [];
  });
  return dataset;
}
