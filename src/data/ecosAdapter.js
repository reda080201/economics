export const ecosSeriesMap = {
  gdp: { statCode: "TODO", cycle: "Q", itemCode1: "TODO", label: "실질 GDP" },
  cpi: { statCode: "TODO", cycle: "M", itemCode1: "TODO", label: "소비자물가지수" },
  unemployment: { statCode: "TODO", cycle: "M", itemCode1: "TODO", label: "실업률" },
  policyRate: { statCode: "TODO", cycle: "M", itemCode1: "TODO", label: "기준금리" }
};

export async function fetchEcosSeries() {
  throw new Error("ECOS adapter는 통계코드 매핑 전 단계입니다. 로컬 샘플 데이터로 전환합니다.");
}
