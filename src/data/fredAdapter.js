export const fredSeriesMap = {
  gdp: { seriesId: "GDPC1", label: "Real GDP" },
  cpi: { seriesId: "CPIAUCSL", label: "Consumer Price Index" },
  unemployment: { seriesId: "UNRATE", label: "Unemployment Rate" },
  policyRate: { seriesId: "FEDFUNDS", label: "Federal Funds Rate" },
  governmentDebt: { seriesId: "GFDEGDQ188S", label: "Federal Debt to GDP" },
  housePriceIndex: { seriesId: "CSUSHPISA", label: "Case-Shiller Home Price Index" },
  stockIndex: { seriesId: "SP500", label: "S&P 500" },
  exchangeRate: { seriesId: "DTWEXBGS", label: "Trade Weighted Dollar Index" }
};

export async function fetchFredSeries({ apiKey, seriesId, startDate, endDate, units = "lin", label = "" }) {
  const key = String(apiKey || "").trim();
  if (!key) throw new Error("FRED API key가 없어 로컬 샘플 데이터로 전환합니다.");
  if (!seriesId) throw new Error("FRED seriesId가 없습니다.");

  const url = new URL("https://api.stlouisfed.org/fred/series/observations");
  url.searchParams.set("series_id", seriesId);
  url.searchParams.set("api_key", key);
  url.searchParams.set("file_type", "json");
  url.searchParams.set("observation_start", normalizeApiDate(startDate, "2015-01"));
  url.searchParams.set("observation_end", normalizeApiDate(endDate, "2024-12"));
  url.searchParams.set("units", units);

  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(`FRED 네트워크/CORS 가능 오류: ${error?.message || String(error)}. 브라우저 직접 호출이 막히면 backend proxy가 필요할 수 있습니다.`);
  }
  if (!response.ok) {
    throw new Error(`FRED request failed: ${response.status}. API key, series code, 요청 한도 또는 CORS 정책을 확인하세요.`);
  }

  const data = await response.json();
  return normalizeFredObservations(data, seriesId, label);
}

export function normalizeFredObservations(data, seriesId, label = "") {
  const monthlyLastValues = new Map();
  (data?.observations || []).forEach((point) => {
    if (!point || point.value === ".") return;
    const value = Number(point.value);
    if (!Number.isFinite(value)) return;
    const date = String(point.date || "").slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(date)) return;
    monthlyLastValues.set(date, {
      date,
      value,
      source: "FRED",
      seriesCode: seriesId,
      label
    });
  });
  return Array.from(monthlyLastValues.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function normalizeApiDate(value, fallback) {
  const raw = String(value || fallback);
  return /^\d{4}-\d{2}$/.test(raw) ? `${raw}-01` : raw;
}
