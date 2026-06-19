import http from "node:http";

const PORT = Number(process.env.PORT || 8789);
const FRED_API_KEY = process.env.FRED_API_KEY || "";
const FRED_OBSERVATIONS_URL = "https://api.stlouisfed.org/fred/series/observations";

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS"
  });
  response.end(JSON.stringify(payload));
}

function buildFredUrl(requestUrl) {
  if (!FRED_API_KEY) {
    throw new Error("FRED_API_KEY 환경변수가 없습니다.");
  }
  const seriesId = requestUrl.searchParams.get("series_id");
  if (!seriesId) {
    throw new Error("series_id query가 필요합니다.");
  }

  const fredUrl = new URL(FRED_OBSERVATIONS_URL);
  fredUrl.searchParams.set("series_id", seriesId);
  fredUrl.searchParams.set("api_key", FRED_API_KEY);
  fredUrl.searchParams.set("file_type", "json");
  fredUrl.searchParams.set("observation_start", requestUrl.searchParams.get("observation_start") || "2015-01-01");
  fredUrl.searchParams.set("observation_end", requestUrl.searchParams.get("observation_end") || "2024-12-01");
  fredUrl.searchParams.set("units", requestUrl.searchParams.get("units") || "lin");
  return fredUrl;
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 200, { ok: true });
    return;
  }

  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  if (request.method !== "GET" || requestUrl.pathname !== "/api/fred") {
    sendJson(response, 404, { error: "GET /api/fred endpoint만 지원합니다." });
    return;
  }

  try {
    const fredUrl = buildFredUrl(requestUrl);
    const fredResponse = await fetch(fredUrl);
    const payload = await fredResponse.json();
    sendJson(response, fredResponse.ok ? 200 : fredResponse.status, payload);
  } catch (error) {
    sendJson(response, 500, {
      error: error?.message || String(error),
      hint: "FRED_API_KEY, series_id, 서버 네트워크 상태를 확인하세요."
    });
  }
});

server.listen(PORT, () => {
  console.log(`FRED proxy listening on http://127.0.0.1:${PORT}/api/fred`);
});
