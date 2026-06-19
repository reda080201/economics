import { loadLocalJsonDataset } from "./localCsvAdapter.js";
import { buildLiveMacroDataset } from "./liveDatasetBuilder.js";
import { macroSeriesKeys } from "./dataSources.js";

export const calibrationDatasetOptions = {
  korea: { label: "한국 샘플", url: "./data/sample_korea_macro.json" },
  us: { label: "미국 샘플", url: "./data/sample_us_macro.json" }
};

export async function loadCalibrationDataset(country = "korea", options = {}) {
  const {
    provider = "local",
    startDate = "2015-01",
    endDate = "2024-12",
    apiKeys = {}
  } = options;
  const fallbackDataset = await loadLocalDataset(country);
  if (provider === "local") return fallbackDataset;

  return buildLiveMacroDataset({
    country,
    provider,
    apiKeys,
    startDate,
    endDate,
    fallbackDataset
  });
}

async function loadLocalDataset(country = "korea") {
  const option = calibrationDatasetOptions[country] || calibrationDatasetOptions.korea;
  const dataset = await loadLocalJsonDataset(option.url);
  const seriesObservationCounts = {};
  const seriesSourceMap = {};
  macroSeriesKeys.forEach((key) => {
    seriesObservationCounts[key] = Array.isArray(dataset[key]) ? dataset[key].length : 0;
    seriesSourceMap[key] = "로컬 샘플";
  });
  return {
    ...dataset,
    label: option.label,
    source: "local",
    loadedSeries: [],
    missingSeries: [...macroSeriesKeys],
    seriesSourceMap,
    seriesObservationCounts,
    officialSeriesCount: 0,
    fallbackSeriesCount: macroSeriesKeys.length,
    officialDataRatio: 0,
    fallbackUsed: true,
    alignmentMethod: "local_sample"
  };
}
