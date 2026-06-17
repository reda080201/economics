export async function runDataCalibrationMode(context) {
  const { els, state, services, helpers } = context;
  if (!els.dataLabResult) return;
  try {
    els.dataLabResult.classList.add("visible");
    helpers.setHtmlIfChanged(els.dataLabResult, "<strong>데이터 보정</strong><br>로컬 샘플 데이터를 불러오는 중...");
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
      lastDataset: dataset.label || dataset.country || "샘플"
    };
    const scaleSummary = formatSelectedScales(result.selectedParameterScales, helpers);
    const breakdownSummary = formatVariableBreakdown(result.variableBreakdown, helpers);
    helpers.updateSfcAccountingLayer();
    helpers.setHtmlIfChanged(els.dataLabResult, `
      <strong>데이터 보정 완료</strong><br>
      데이터: ${helpers.escapeHtml(state.modelReliability.lastDataset)}<br>
      기본 손실: ${formatNumber(result.baselineLoss, helpers)} / 보정 후 손실: ${formatNumber(result.loss, helpers)}<br>
      개선률: ${helpers.percent((result.improvementRate || 0) * 100, 1)} / 후보 ${result.candidatesTested}개<br>
      가장 잘 맞는 변수: ${helpers.escapeHtml(result.bestVariable || "확인 필요")} / 가장 안 맞는 변수: ${helpers.escapeHtml(result.weakestVariable || "확인 필요")}<br>
      선택 배율: ${scaleSummary}<br>
      변수별 적합도: ${breakdownSummary}<br>
      신뢰도: ${helpers.escapeHtml(state.modelReliability.level)}<br>
      대상 지표: ${helpers.escapeHtml((result.targetSeries || []).join(", "))}<br>
      방식: ${helpers.escapeHtml(result.method || "recursive_model_path_search")}<br>
      이 보정은 샘플 데이터 기반의 교육용 계수 조정입니다.
    `);
    updateModelReliabilityPanel(context);
  } catch (error) {
    helpers.recordRuntimeError(error, "데이터 보정 오류", "데이터 보정 실행 중 오류가 감지되었습니다.");
    helpers.setHtmlIfChanged(els.dataLabResult, `<strong>데이터 보정 오류</strong><br>${helpers.escapeHtml(error?.message || String(error))}`);
  }
}

export async function runBacktestMode(context) {
  const { els, state, services, helpers } = context;
  if (!els.dataLabResult) return;
  try {
    const dataset = state.calibrationDataset || await loadSelectedCalibrationDataset(context);
    const result = services.runBacktest(dataset, state.modelParameters || services.defaultModelParameters);
    const directionHit = (result.gdpDirectionHitRate + result.inflationDirectionHitRate + result.unemploymentDirectionHitRate) / 3;
    state.modelReliability = {
      ...(state.modelReliability || helpers.createInitialModelReliability()),
      backtestDirectionHitRate: directionHit,
      recentError: result.averageRmse,
      level: directionHit > 0.68 ? "높음" : directionHit > 0.55 ? "중간" : "낮음",
      lastDataset: dataset.label || dataset.country || "샘플"
    };
    helpers.updateSfcAccountingLayer();
    els.dataLabResult.classList.add("visible");
    helpers.setHtmlIfChanged(els.dataLabResult, `
      <strong>과거 구간 검증</strong><br>
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

async function loadSelectedCalibrationDataset(context) {
  const { els, state, services } = context;
  const country = els.calibrationCountrySelect?.value || "korea";
  const dataset = await services.loadCalibrationDataset(country);
  state.calibrationDataset = dataset;
  return dataset;
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
