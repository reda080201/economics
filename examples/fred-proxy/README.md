# FRED Proxy Example

Agent Macro Lab은 정적 HTML 앱이라 기본적으로 브라우저에서 FRED API를 직접 호출합니다. 브라우저 CORS 정책이나 API key 노출이 걱정되는 배포 환경에서는 이 예시처럼 작은 backend proxy를 두는 편이 안전합니다.

## 실행

```powershell
$env:FRED_API_KEY="your-fred-api-key"
node examples/fred-proxy/server.js
```

기본 포트는 `8789`입니다. 다른 포트를 쓰려면 `PORT`를 지정합니다.

```powershell
$env:PORT="8790"
$env:FRED_API_KEY="your-fred-api-key"
node examples/fred-proxy/server.js
```

## 앱에서 사용

Agent Macro Lab의 데이터랩에서 `고급 API 설정`을 열고 `FRED proxy URL`에 다음 값을 넣습니다.

```text
http://127.0.0.1:8789/api/fred
```

이후 데이터 소스를 `FRED live data`로 선택하고 `공식 데이터 불러오기`를 누르면, 브라우저는 FRED 원본 API 대신 proxy endpoint를 호출합니다.

## Endpoint

```text
GET /api/fred?series_id=GDPC1&observation_start=2020-01-01&observation_end=2024-12-01&units=lin
```

서버는 `FRED_API_KEY`를 붙여 FRED API에 요청하고, FRED의 JSON 응답을 그대로 반환합니다. 현재 프론트의 `fredAdapter`는 `{ observations: [...] }` 형태를 바로 정규화할 수 있습니다.

## 주의

- 이 예시는 로컬 개발용 최소 구현입니다.
- 운영 배포에서는 origin 제한, rate limit, logging, secret 관리, HTTPS를 추가하세요.
- API key는 프론트 코드나 GitHub 저장소에 넣지 마세요.
