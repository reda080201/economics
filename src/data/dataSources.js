export const dataSources = {
  localSample: { label: "로컬 샘플 데이터", requiresApiKey: false },
  fred: { label: "FRED", requiresApiKey: true, status: "live" },
  ecos: { label: "한국은행 ECOS", requiresApiKey: true, status: "partial" },
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

export const macroSeriesLabels = {
  gdp: "GDP",
  cpi: "소비자물가지수",
  unemployment: "실업률",
  policyRate: "정책금리",
  governmentDebt: "정부부채",
  householdDebt: "가계부채",
  housePriceIndex: "주택가격",
  stockIndex: "주가지수",
  exchangeRate: "환율",
  exports: "수출",
  imports: "수입"
};
