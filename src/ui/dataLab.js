import { clearApiKey, getApiKey, hasApiKey, setApiKey } from "../data/apiKeyStore.js";
import { macroSeriesLabels } from "../data/dataSources.js";

export async function runDataCalibrationMode(context) {
  const { els, state, services, helpers } = context;
  if (!els.dataLabResult) return;
  try {
    els.dataLabResult.classList.add("visible");
    helpers.setHtmlIfChanged(els.dataLabResult, "<strong>데이터 보정</strong><br>선택한 공식/샘플 보완 데이터를 불러오는 중...");
    const dataset = await loadSelectedCalibrationDataset(context);
    const result = services.calibrateParameters({
      historicalData: dataset,
      initialParameters: state.modelParameters || services.defaultModelParameters
    });
    state.modelParameters = result.parameters;
    state.modelReliability = {
      ...(state.modelReliability || helpers.createInitialModelReliability()),
      level: result.loss < 0.8 ? "높음" : result.loss < 1.8 ? "중간" : "낮음",
      calibrationLoss: result.loss,
      bestVariable: result.bestVariable || "확인 필요",
      weakestVariable: result.weakestVariable || "확인 필요",
      lastDataset: dataset.label || dataset.country || "샘플",
      officialDataRatio: dataset.officialDataRatio ?? 0,
      officialSeriesCount: dataset.officialSeriesCount ?? 0,
      fallbackSeriesCount: dataset.fallbackSeriesCount ?? 0,
      alignmentMethod: dataset.alignmentMethod || "원본"
    };
    const scaleSummary = formatSelectedScales(result.selectedParameterScales, helpers);
    const breakdownSummary = formatVariableBreakdown(result.variableBreakdown, helpers);
    const dataQualitySummary = formatDatasetQualitySummary(dataset, helpers);
    helpers.updateSfcAccountingLayer();
    helpers.setHtmlIfChanged(els.dataLabResult, `
      <strong>데이터 보정 완료</strong><br>
      데이터: ${helpers.escapeHtml(state.modelReliability.lastDataset)}<br>
      ${dataQualitySummary}<br>
      기본 손실: ${formatNumber(result.baselineLoss, helpers)} / 보정 후 손실: ${formatNumber(result.loss, helpers)}<br>
      개선률: ${helpers.percent((result.improvementRate || 0) * 100, 1)} / 후보 ${result.candidatesTested}개<br>
      가장 잘 맞는 변수: ${helpers.escapeHtml(result.bestVariable || "확인 필요")} / 가장 안 맞는 변수: ${helpers.escapeHtml(result.weakestVariable || "확인 필요")}<br>
      선택 배율: ${scaleSummary}<br>
      변수별 적합도: ${breakdownSummary}<br>
      신뢰도: ${helpers.escapeHtml(state.modelReliability.level)}<br>
      대상 지표: ${helpers.escapeHtml((result.targetSeries || []).join(", "))}<br>
      방식: ${helpers.escapeHtml(result.method || "recursive_model_path_search")}<br>
      이 보정은 공식/샘플 보완 데이터 기반의 교육용 계수 조정입니다.
    `);
    updateModelReliabilityPanel(context);
  } catch (error) {
    helpers.recordRuntimeError(error, "데이터 보정 오류", "데이터 보정 실행 중 오류가 감지되었습니다.");
    helpers.setHtmlIfChanged(els.dataLabResult, `<strong>데이터 보정 오류</strong><br>${helpers.escapeHtml(error?.message || String(error))}`);
  }
}

export async function runLiveDataLoadMode(context) {
  const { els, state, helpers } = context;
  if (!els.dataLabResult) return;
  try {
    const options = getDatasetOptionsFromUi(context);
    els.dataLabResult.classList.add("visible");
    helpers.setHtmlIfChanged(els.dataLabResult, "<strong>공식 데이터</strong><br>데이터를 불러오는 중...");
    const dataset = await loadSelectedCalibrationDataset(context, options);
    helpers.setHtmlIfChanged(els.dataLabResult, renderDatasetStatus(dataset, helpers));
    renderDataSourceStatus(context, dataset);
    state.modelReliability = {
      ...(state.modelReliability || helpers.createInitialModelReliability()),
      lastDataset: dataset.label || dataset.country || "샘플"
    };
  } catch (error) {
    helpers.recordRuntimeError(error, "공식 데이터 오류", "공식 데이터 로딩 중 오류가 감지되었습니다.");
    helpers.setHtmlIfChanged(els.dataLabResult, `<strong>공식 데이터 오류</strong><br>${helpers.escapeHtml(error?.message || String(error))}`);
  }
}

export function saveDataApiKeys(context) {
  const { els, helpers } = context;
  const fredSaved = setApiKey("fred", els.fredApiKeyInput?.value || getApiKey("fred"));
  const ecosSaved = setApiKey("ecos", els.ecosApiKeyInput?.value || getApiKey("ecos"));
  if (els.fredApiKeyInput) els.fredApiKeyInput.value = "";
  if (els.ecosApiKeyInput) els.ecosApiKeyInput.value = "";
  helpers.setHtmlIfChanged(
    els.dataSourceStatusValue,
    `API 키 저장 상태: FRED ${fredSaved || hasApiKey("fred") ? "저장됨" : "없음"} / ECOS ${ecosSaved || hasApiKey("ecos") ? "저장됨" : "없음"}`
  );
}

export function clearDataApiKeys(context) {
  const { els, helpers } = context;
  const provider = els.dataSourceSelect?.value || "fred";
  if (provider === "ecos") {
    clearApiKey("ecos");
  } else if (provider === "fred") {
    clearApiKey("fred");
  } else {
    clearApiKey("fred");
    clearApiKey("ecos");
  }
  if (els.fredApiKeyInput) els.fredApiKeyInput.value = "";
  if (els.ecosApiKeyInput) els.ecosApiKeyInput.value = "";
  helpers.setHtmlIfChanged(els.dataSourceStatusValue, `${provider.toUpperCase()} API 키를 삭제했습니다.`);
}

export async function runBacktestMode(context) {
  const { els, state, services, helpers } = context;
  if (!els.dataLabResult) return;
  try {
    const dataset = await loadSelectedCalibrationDataset(context);
    const result = services.runBacktest(dataset, state.modelParameters || services.defaultModelParameters);
    const directionHit = (result.gdpDirectionHitRate + result.inflationDirectionHitRate + result.unemploymentDirectionHitRate) / 3;
    state.modelReliability = {
      ...(state.modelReliability || helpers.createInitialModelReliability()),
      backtestDirectionHitRate: directionHit,
      recentError: result.averageRmse,
      level: directionHit > 0.68 ? "높음" : directionHit > 0.55 ? "중간" : "낮음",
      lastDataset: dataset.label || dataset.country || "샘플",
      officialDataRatio: dataset.officialDataRatio ?? 0,
      officialSeriesCount: dataset.officialSeriesCount ?? 0,
      fallbackSeriesCount: dataset.fallbackSeriesCount ?? 0,
      alignmentMethod: dataset.alignmentMethod || "원본"
    };
    const dataQualitySummary = formatDatasetQualitySummary(dataset, helpers);
    helpers.updateSfcAccountingLayer();
    els.dataLabResult.classList.add("visible");
    helpers.setHtmlIfChanged(els.dataLabResult, `
      <strong>과거 구간 검증</strong><br>
      데이터: ${helpers.escapeHtml(state.modelReliability.lastDataset)}<br>
      ${dataQualitySummary}<br>
      GDP 방향 적중률: ${helpers.percent(result.gdpDirectionHitRate * 100, 0)}<br>
      물가 방향 적중률: ${helpers.percent(result.inflationDirectionHitRate * 100, 0)}<br>
      실업률 방향 적중률: ${helpers.percent(result.unemploymentDirectionHitRate * 100, 0)}<br>
      평균 RMSE: ${helpers.round(result.averageRmse, 3).toFixed(3)}<br>
      위기 반응 점수: ${helpers.percent(result.crisisReactionScore * 100, 0)} / 감지 구간 ${result.crisisWindows.length}개<br>
      복사 방지 검증: ${result.leakageCheckPassed ? "통과" : "확인 필요"}<br>
      가장 큰 오차 구간: ${helpers.escapeHtml(result.largestErrorWindow)}<br>
      방식: ${helpers.escapeHtml(result.method)}
    `);
    updateModelReliabilityPanel(context);
  } catch (error) {
    helpers.recordRuntimeError(error, "백테스트 오류", "과거 구간 검증 중 오류가 감지되었습니다.");
    helpers.setHtmlIfChanged(els.dataLabResult, `<strong>백테스트 오류</strong><br>${helpers.escapeHtml(error?.message || String(error))}`);
  }
}

export function runMonteCarloMode(context) {
  const { els, state, services, helpers } = context;
  if (!els.dataLabResult) return;
  try {
    const result = services.runMonteCarloScenario(state.metrics || {}, helpers.isLargeEconomyMode() ? 30 : 60);
    state.metrics.monteCarloRecessionProbability = result.recessionProbability;
    els.dataLabResult.classList.add("visible");
    helpers.setHtmlIfChanged(els.dataLabResult, `
      <strong>불확실성 분석</strong><br>
      실행 횟수: ${result.runs}회<br>
      GDP 중앙값: ${helpers.macroMoney(result.gdpMedian)} / 하위 10%: ${helpers.macroMoney(result.gdpP10)} / 상위 10%: ${helpers.macroMoney(result.gdpP90)}<br>
      실업률 중앙값: ${helpers.percent(result.unemploymentMedian, 1)}<br>
      침체 확률: ${helpers.percent(result.recessionProbability * 100, 0)} / 고실업 확률: ${helpers.percent(result.highUnemploymentProbability * 100, 0)} / 재정위험 확률: ${helpers.percent(result.fiscalRiskProbability * 100, 0)}
    `);
  } catch (error) {
    helpers.recordRuntimeError(error, "몬테카를로 오류", "불확실성 분석 중 오류가 감지되었습니다.");
    helpers.setHtmlIfChanged(els.dataLabResult, `<strong>몬테카를로 오류</strong><br>${helpers.escapeHtml(error?.message || String(error))}`);
  }
}

export function updateModelReliabilityPanel(context) {
  const { els, state, helpers } = context;
  if (els.accountingValidationValue) {
    const validation = state.flowLedger?.lastValidation;
    els.accountingValidationValue.textContent = validation ? `${validation.status} · ${validation.summary}` : "대기";
  }
  if (els.modelConfidenceValue) {
    const reliability = state.modelReliability || helpers.createInitialModelReliability();
    const loss = reliability.calibrationLoss == null ? "" : ` / 손실 ${helpers.round(reliability.calibrationLoss, 2).toFixed(2)}`;
    els.modelConfidenceValue.textContent = `${reliability.level}${loss}`;
  }
}

async function loadSelectedCalibrationDataset(context, explicitOptions = null) {
  const { els, state, services } = context;
  const country = els.calibrationCountrySelect?.value || "korea";
  const dataset = await services.loadCalibrationDataset(country, explicitOptions || getDatasetOptionsFromUi(context));
  state.calibrationDataset = dataset;
  return dataset;
}

function getDatasetOptionsFromUi(context) {
  const { els } = context;
  const provider = els.dataSourceSelect?.value || "local";
  return {
    provider,
    startDate: els.dataStartDateInput?.value || "2015-01",
    endDate: els.dataEndDateInput?.value || "2024-12",
    apiKeys: {
      fred: (els.fredApiKeyInput?.value || getApiKey("fred") || "").trim(),
      ecos: (els.ecosApiKeyInput?.value || getApiKey("ecos") || "").trim()
    },
    proxyUrls: {
      fred: (els.fredProxyUrlInput?.value || "").trim()
    }
  };
}

function renderDatasetStatus(dataset, helpers) {
  const loaded = formatSeriesList(dataset.loadedSeries, dataset.seriesSourceMap, dataset.seriesStatusMap, dataset.seriesObservationCounts, helpers, dataset.source || "live data");
  const missing = formatSeriesList(dataset.missingSeries, dataset.seriesSourceMap, dataset.seriesStatusMap, dataset.seriesObservationCounts, helpers, "로컬 샘플");
  const totalSeries = (dataset.loadedSeries?.length || 0) + (dataset.missingSeries?.length || 0);
  const officialCount = dataset.officialSeriesCount ?? dataset.loadedSeries?.length ?? 0;
  const fallbackCount = dataset.fallbackSeriesCount ?? dataset.missingSeries?.length ?? 0;
  const corsHint = dataset.source === "FRED"
    ? `<br>도움말: FRED는 미국 데이터 중심입니다. API key 저장 후 Network 탭에서 ${dataset.proxyUsed ? "입력한 proxy 요청" : "fred/series/observations 요청"}을 확인하세요. 브라우저 직접 호출이 막히면 backend proxy를 고려하세요.`
    : "";
  const stubHint = dataset.source === "ECOS"
    ? "<br>도움말: ECOS는 현재 adapter 구조 준비 단계이며 통계코드 매핑 전까지 로컬 샘플로 보완됩니다."
    : dataset.source === "OECD"
      ? "<br>도움말: OECD는 현재 SDMX adapter stub 단계이며 로컬 샘플로 보완됩니다."
      : "";
  const warnings = dataset.warnings?.length
    ? `<br>경고: ${helpers.escapeHtml(dataset.warnings.slice(0, 3).join(" / "))}`
    : "";
  return `
    <strong>데이터 불러오기 완료</strong><br>
    데이터 소스: ${helpers.escapeHtml(dataset.source || "local")}<br>
    호출 방식: ${dataset.proxyUsed ? "backend proxy" : dataset.source === "FRED" ? "브라우저 직접 호출" : "기본 호출"}<br>
    공식 데이터 사용률: ${officialCount}/${totalSeries || 0}개 지표 (${helpers.percent((dataset.officialDataRatio || 0) * 100, 0)})<br>
    샘플 보완: ${fallbackCount}/${totalSeries || 0}개 지표<br>
    불러온 지표: ${loaded}<br>
    샘플로 보완된 지표: ${missing}<br>
    정렬 방식: ${helpers.escapeHtml(dataset.alignmentMethod || "원본")} / 보완 방식: ${dataset.fallbackUsed ? "로컬 샘플 fallback" : "live data"}<br>
    마지막 업데이트: ${helpers.escapeHtml(dataset.updatedAt || "로컬 샘플")}
    ${corsHint}
    ${stubHint}
    ${warnings}
  `;
}

function renderDataSourceStatus(context, dataset) {
  const { els, helpers } = context;
  if (!els.dataSourceStatusValue) return;
  const source = dataset.source || "local";
  const loaded = dataset.loadedSeries?.length || 0;
  const missing = dataset.missingSeries?.length || 0;
  helpers.setHtmlIfChanged(
    els.dataSourceStatusValue,
    `${helpers.escapeHtml(source)} · 공식 데이터 ${loaded}/${loaded + missing}개 · 샘플 보완 ${missing}개${dataset.fallbackUsed ? " · fallback 사용" : ""}${dataset.proxyUsed ? " · proxy 사용" : ""}${source === "FRED" ? " · FRED는 미국 데이터 중심" : ""}${source === "ECOS" ? " · 통계코드 매핑 전 단계" : ""}${source === "OECD" ? " · SDMX stub" : ""}`
  );
}

function formatDatasetQualitySummary(dataset = {}, helpers) {
  const loaded = dataset.officialSeriesCount ?? dataset.loadedSeries?.length ?? 0;
  const fallback = dataset.fallbackSeriesCount ?? dataset.missingSeries?.length ?? 0;
  const total = loaded + fallback || dataset.loadedSeries?.length + dataset.missingSeries?.length || 0;
  const ratio = dataset.officialDataRatio ?? (total ? loaded / total : 0);
  const alignment = dataset.alignmentMethod || "원본";
  const fill = alignment.includes("forward") ? "forward-fill 사용" : dataset.fallbackUsed ? "샘플 fallback 사용" : "추가 보완 없음";
  return `공식 데이터 사용률: ${loaded}/${total || 0}개 지표 (${helpers.percent(ratio * 100, 0)}) / 샘플 보완 ${fallback}개 / 정렬: ${helpers.escapeHtml(alignment)} · ${helpers.escapeHtml(fill)}`;
}

function formatSeriesList(seriesKeys = [], sourceMap = {}, statusMap = {}, observationCounts = {}, helpers, fallbackSource = "") {
  if (!Array.isArray(seriesKeys) || !seriesKeys.length) return "없음";
  return seriesKeys
    .map((key) => {
      const label = macroSeriesLabels[key] || key;
      const source = sourceMap[key] || fallbackSource;
      const statusLabel = formatSeriesStatus(statusMap, key);
      const count = Number.isFinite(Number(observationCounts[key])) ? ` · ${Number(observationCounts[key])}개` : "";
      return `${helpers.escapeHtml(label)}(${helpers.escapeHtml(source)}${statusLabel}${count})`;
    })
    .join(", ");
}

function formatSeriesStatus(sourceMap = {}, key) {
  const status = sourceMap?.[key];
  const labels = {
    live: "",
    live_proxy: " · proxy",
    verified: " · 검증",
    candidate_verified: " · 1차 매핑 후보",
    candidate_verified_no_item: " · 1차 매핑 후보",
    unmapped: " · 통계코드 미확정",
    fallback: " · fallback",
    cors_failed: " · CORS 가능 실패"
  };
  return labels[status] || "";
}

function formatNumber(value, helpers) {
  return Number.isFinite(Number(value)) ? helpers.round(Number(value), 3).toFixed(3) : "확인 필요";
}

function formatSelectedScales(scales = {}, helpers) {
  const labels = {
    consumptionIncome: "소비소득",
    investmentDemand: "투자수요",
    inflationDemandGap: "물가수요갭",
    unemploymentOutputGap: "실업산출갭"
  };
  return Object.entries(labels)
    .map(([key, label]) => `${helpers.escapeHtml(label)} x${formatNumber(scales[key] ?? 1, helpers)}`)
    .join(" · ");
}

function formatVariableBreakdown(breakdown = [], helpers) {
  if (!Array.isArray(breakdown) || !breakdown.length) return "확인 필요";
  return breakdown
    .map((entry) => `${helpers.escapeHtml(entry.label || entry.key)} RMSE ${formatNumber(entry.rmse, helpers)}`)
    .join(" · ");
}
