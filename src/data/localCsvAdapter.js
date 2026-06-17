export async function loadLocalJsonDataset(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`데이터를 불러오지 못했습니다: ${url}`);
  return response.json();
}
