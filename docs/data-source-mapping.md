# 공식 데이터 매핑 현황

이 문서는 데이터랩의 `macroSeriesKeys`가 어떤 공식 데이터 소스와 연결되어 있는지 추적합니다. 확실하지 않은 코드는 live 연결하지 않고 로컬 샘플 fallback으로 둡니다.

## 상태 라벨

- `live`: 실제 live 호출 가능
- `candidate_verified`: 1차 후보로 확인했지만 실제 API key 기반 live 검증 전
- `candidate_verified_no_item`: 항목코드 없이 호출하는 1차 후보
- `unmapped`: 통계코드 미확정
- `fallback`: 로컬 샘플 보완
- `stub`: adapter 자리만 있음

## FRED

| series key | label | FRED series | status | 검증 메모 |
|---|---|---:|---|---|
| gdp | GDP | GDPC1 | live | 미국 실질 GDP, 분기 관측은 월별 forward-fill |
| cpi | 소비자물가지수 | CPIAUCSL | live | 미국 CPI |
| unemployment | 실업률 | UNRATE | live | 미국 실업률 |
| policyRate | 정책금리 | FEDFUNDS | live | Federal Funds Rate |
| governmentDebt | 정부부채 | GFDEGDQ188S | live | GDP 대비 연방정부 부채 |
| housePriceIndex | 주택가격 | CSUSHPISA | live | Case-Shiller 지수 |
| stockIndex | 주가지수 | SP500 | live | S&P 500 |
| exchangeRate | 환율 | DTWEXBGS | live | Trade weighted dollar index |
| householdDebt | 가계부채 | - | fallback | FRED 매핑 미정 |
| exports | 수출 | - | fallback | FRED 매핑 미정 |
| imports | 수입 | - | fallback | FRED 매핑 미정 |

## ECOS

| series key | label | statCode | itemCode1 | status | 검증 메모 |
|---|---|---:|---:|---|---|
| cpi | 소비자물가지수 | 901Y009 | 0 | candidate_verified | 1차 매핑 후보, 실제 API key 기반 검증 필요 |
| policyRate | 한국은행 기준금리 | 060Y001 | - | candidate_verified_no_item | 항목코드 없이 호출하는 1차 후보, 실제 API key 기반 검증 필요 |
| gdp | 실질 GDP | TODO | TODO | unmapped | 공식 통계표/항목코드 확인 전까지 fallback |
| unemployment | 실업률 | TODO | TODO | unmapped | ECOS보다 KOSIS 성격이 강해 별도 검토 필요 |
| governmentDebt | 정부부채 | - | - | fallback | 미매핑 |
| householdDebt | 가계부채 | - | - | fallback | 미매핑 |
| housePriceIndex | 주택가격 | - | - | fallback | 미매핑 |
| stockIndex | 주가지수 | - | - | fallback | 미매핑 |
| exchangeRate | 환율 | - | - | fallback | 미매핑 |
| exports | 수출 | - | - | fallback | 미매핑 |
| imports | 수입 | - | - | fallback | 미매핑 |

## OECD

| series key | label | status | 검증 메모 |
|---|---|---|---|
| all | OECD SDMX | stub | SDMX 매핑 전 단계. 현재 호출 시 로컬 샘플 fallback |

## 다음 작업

1. FRED API key로 실제 브라우저 live 호출을 확인합니다.
2. ECOS API key로 CPI와 기준금리 후보를 검증합니다.
3. ECOS GDP, 환율, 수출입, 가계부채 후보 코드를 공식 문서 기준으로 추가합니다.
4. OECD SDMX 구조는 ECOS 안정화 이후 별도 adapter로 확장합니다.
