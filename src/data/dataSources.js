export const dataSources = {
  localSample: { label: "로컬 샘플 데이터", requiresApiKey: false },
  fred: { label: "FRED", requiresApiKey: true, status: "stub" },
  ecos: { label: "한국은행 ECOS", requiresApiKey: true, status: "stub" },
  oecd: { label: "OECD", requiresApiKey: false, status: "stub" }
};

export const macroSeriesKeys = [
  "gdp",
  "cpi",
  "unemployment",
  "policyRate",
  "governmentDebt",
  "householdDebt",
  "housePriceIndex",
  "stockIndex",
  "exchangeRate",
  "exports",
  "imports"
];
