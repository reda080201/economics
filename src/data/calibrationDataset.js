import { loadLocalJsonDataset } from "./localCsvAdapter.js";

export const calibrationDatasetOptions = {
  korea: { label: "한국 샘플", url: "./data/sample_korea_macro.json" },
  us: { label: "미국 샘플", url: "./data/sample_us_macro.json" }
};

export async function loadCalibrationDataset(country = "korea") {
  const option = calibrationDatasetOptions[country] || calibrationDatasetOptions.korea;
  const dataset = await loadLocalJsonDataset(option.url);
  return { ...dataset, label: option.label };
}
