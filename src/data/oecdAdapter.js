export async function fetchOecdSdmxSeries() {
  throw new Error("OECD adapter는 SDMX 매핑 전 단계입니다. 로컬 샘플 데이터로 전환합니다.");
}

export async function fetchOecdSeries(options) {
  return fetchOecdSdmxSeries(options);
}
