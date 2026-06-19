export const ecosSeriesMap = {
  // ECOS 1차 매핑: 공개 ECOS 예시와 wrapper 문서에서 반복 확인되는 코드만 live 후보로 사용합니다.
  // 불확실한 지표는 TODO로 남겨 조용히 잘못된 공식 데이터가 섞이지 않게 합니다.
  gdp: { statCode: "TODO", cycle: "Q", itemCode1: "TODO", label: "실질 GDP", mappingStatus: "unmapped" },
  cpi: { statCode: "901Y009", cycle: "M", itemCode1: "0", label: "소비자물가지수", mappingStatus: "candidate_verified" },
  unemployment: { statCode: "TODO", cycle: "M", itemCode1: "TODO", label: "실업률" },
  policyRate: { statCode: "060Y001", cycle: "M", itemCode1: null, label: "한국은행 기준금리", mappingStatus: "candidate_verified_no_item" }
};

export async function fetchEcosSeries({ apiKey, statCode, cycle, startDate, endDate, itemCode1, label = "" } = {}) {
  const key = String(apiKey || "").trim();
  if (!key) throw new Error("ECOS API key가 없어 로컬 샘플 데이터로 전환합니다.");
  if (!statCode || statCode === "TODO" || itemCode1 === "TODO") {
    throw new Error("ECOS 통계코드 매핑이 아직 확정되지 않았습니다. 로컬 샘플 데이터로 전환합니다.");
  }

  const normalizedCycle = String(cycle || "M").toUpperCase();
  const start = normalizeEcosPeriod(startDate, normalizedCycle);
  const end = normalizeEcosPeriod(endDate, normalizedCycle);
  const urlParts = [
    "https://ecos.bok.or.kr/api/StatisticSearch",
    encodeURIComponent(key),
    "json",
    "kr",
    "1",
    "10000",
    encodeURIComponent(statCode),
    normalizedCycle,
    start,
    end
  ];
  if (itemCode1 != null && String(itemCode1).trim() !== "") {
    urlParts.push(encodeURIComponent(itemCode1));
  }
  const url = urlParts.join("/");

  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(`ECOS 네트워크/CORS 가능 오류: ${error?.message || String(error)}. 공개 배포에서는 backend proxy가 필요할 수 있습니다.`);
  }
  if (!response.ok) {
    throw new Error(`ECOS request failed: ${response.status}`);
  }

  const data = await response.json();
  return normalizeEcosObservations(data, { statCode, itemCode1, label });
}

export function normalizeEcosObservations(data, { statCode = "", itemCode1 = "", label = "" } = {}) {
  const rows = data?.StatisticSearch?.row || [];
  return rows
    .map((row) => {
      const period = String(row.TIME || "");
      const value = Number(row.DATA_VALUE);
      return {
        date: normalizeEcosDate(period),
        value,
        source: "ECOS",
        seriesCode: `${statCode}:${itemCode1}`,
        label: label || row.ITEM_NAME1 || row.STAT_NAME || ""
      };
    })
    .filter((point) => /^\d{4}-\d{2}$/.test(point.date) && Number.isFinite(point.value))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function normalizeEcosPeriod(value, cycle) {
  const raw = String(value || "");
  if (cycle === "Q") return raw.replace("-", "").replace("Q", "").slice(0, 6) || "201501";
  return raw.replace("-", "").slice(0, 6) || "201501";
}

function normalizeEcosDate(period) {
  const raw = String(period || "");
  if (/^\d{4}Q[1-4]$/.test(raw)) {
    const quarterMonth = { Q1: "03", Q2: "06", Q3: "09", Q4: "12" }[raw.slice(4)] || "01";
    return `${raw.slice(0, 4)}-${quarterMonth}`;
  }
  if (/^\d{6}$/.test(raw)) return `${raw.slice(0, 4)}-${raw.slice(4, 6)}`;
  if (/^\d{4}$/.test(raw)) return `${raw}-01`;
  return raw.slice(0, 7);
}
