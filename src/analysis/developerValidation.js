// Developer-facing directional validation runtime.
export function createDeveloperValidationRuntime(context) {
  const {
    state,
    els,
    TARGET_INFLATION,
    clamp,
    createInitialFinancialMarket,
    createInitialRateStructure,
    escapeHtml,
    evaluateDirectionalValidation,
    recordRuntimeError,
    repairSimulationState,
    renderValidationReport,
    restoreSimulationSnapshot,
    runSimulationStep,
    safeNumber,
    safeUpdateAllDisplays,
    safeUpdateCharts,
    setHtmlIfChanged,
    warnIfStateRestoreFailed,
    updateMacroMetrics
  } = context;

  async function runDeveloperValidationMode() {
    if (!els.developerValidationResult) return;
    const originalSnapshot = captureSimulationSnapshot();
    const beforeSignature = captureCoreStateSignature();
    let reportHtml = "";
    try {
      state.debug.suppressVisualUpdates = true;
      const cases = [
        runDeveloperValidationCase(originalSnapshot, "금리 상승 테스트", applyValidationRateHike, [
          { label: "소비 감소 압력", metric: "consumption", direction: "down", tolerance: 0.10 },
          { label: "투자 감소 압력", metric: "investment", direction: "down", tolerance: 0.10 },
          { label: "실업률 상승 압력", metric: "unemployment", direction: "up", tolerance: 0.01 },
          { label: "물가 하락 압력", metric: "inflation", direction: "down", tolerance: 0.005 }
        ]),
        runDeveloperValidationCase(originalSnapshot, "정부지출 증가 테스트", applyValidationSpendingBoost, [
          { label: "GDP 증가 압력", metric: "gdp", direction: "up", tolerance: 0.10 },
          { label: "재정수지 악화", metric: "governmentBalance", direction: "down", tolerance: 0.10 },
          { label: "실업률 하락 압력", metric: "unemployment", direction: "down", tolerance: 0.01 }
        ]),
        runDeveloperValidationCase(originalSnapshot, "공급 충격 테스트", applyValidationSupplyShock, [
          { label: "물가 상승", metric: "inflation", direction: "up", tolerance: 0.005 },
          { label: "생산량 감소", metric: "output", direction: "down", tolerance: 0.10 },
          { label: "실업률 상승", metric: "unemployment", direction: "up", tolerance: 0.01 }
        ]),
        runDeveloperValidationCase(originalSnapshot, "세율 상승 테스트", applyValidationTaxHike, [
          { label: "가계 가처분소득 감소", metric: "consumptionCapacity", direction: "down", tolerance: 0.001 },
          { label: "정부수입 증가", metric: "taxRevenue", direction: "up", tolerance: 0.10 },
          { label: "소비 둔화", metric: "consumption", direction: "down", tolerance: 0.10 }
        ])
      ];
      const evaluated = evaluateDirectionalValidation(cases);
      reportHtml = renderValidationReport(evaluated);
      evaluated.forEach((group) => {
        group.checks.forEach((check) => console.log(`[${check.status}] ${group.label} → ${check.label}`));
      });
    } catch (error) {
      recordRuntimeError(error, "검증 모드 오류", "방향성 검증 중 오류가 감지되었습니다.");
      reportHtml = `<strong>검증 실패</strong><br>${escapeHtml(error?.message || String(error))}`;
    } finally {
      restoreSimulationSnapshot(originalSnapshot);
      warnIfStateRestoreFailed("방향성 검증", beforeSignature, els.developerValidationResult);
      els.developerValidationResult.classList.add("visible");
      setHtmlIfChanged(els.developerValidationResult, reportHtml || "검증 결과가 없습니다.");
      safeUpdateAllDisplays();
      safeUpdateCharts(true);
    }
  }



  function runDeveloperValidationCase(baseSnapshot, label, mutator, checks) {
    restoreSimulationSnapshot(baseSnapshot);
    state.debug.suppressVisualUpdates = true;
    state.game.mode = "sandbox";
    state.game.status = "active";
    state.game.activeEvent = null;
    repairSimulationState();
    updateMacroMetrics();
    const before = getDeveloperValidationMetrics();
    mutator();
    for (let i = 0; i < 24; i += 1) runSimulationStep();
    const after = getDeveloperValidationMetrics();
    return {
      label,
      checks: checks.map((check) => ({
        label: check.label,
        direction: check.direction,
        before: before[check.metric],
        after: after[check.metric],
        tolerance: safeNumber(check.tolerance, 0.01)
      }))
    };
  }



  function getDeveloperValidationMetrics() {
    const m = state.metrics || {};
    return {
      gdp: safeNumber(m.gdp, 0),
      output: safeNumber(m.outputValue, safeNumber(m.gdp, 0)),
      consumption: safeNumber(m.consumption, 0),
      investment: safeNumber(m.investment, 0),
      unemployment: safeNumber(m.unemploymentRate, 0),
      inflation: safeNumber(m.inflation, 0),
      governmentBalance: safeNumber(m.governmentBalance, 0),
      taxRevenue: safeNumber(m.totalTaxCollected, 0),
      consumptionCapacity: safeNumber(m.lowIncomeConsumptionCapacity, 0) + safeNumber(m.middleClassConsumptionCapacity, 0)
    };
  }



  function applyValidationRateHike() {
    if (!state.rates) state.rates = createInitialRateStructure(state.config);
    if (!state.financialMarket) state.financialMarket = createInitialFinancialMarket(state.config);
    state.rates.policyRate = clamp(safeNumber(state.rates.policyRate, 0.045) + 0.030, 0, 0.30);
    state.rates.effectivePolicyRate = clamp(safeNumber(state.rates.effectivePolicyRate, state.rates.policyRate) + 0.018, 0, 0.30);
    state.government.interestRate = state.rates.effectivePolicyRate;
    state.financialMarket.creditSpread = clamp(safeNumber(state.financialMarket.creditSpread, 0.02) + 0.006, 0.01, 0.12);
    state.sentiment.recessionFear = clamp(safeNumber(state.sentiment.recessionFear, 0.25) + 0.08, 0, 1);
  }



  function applyValidationSpendingBoost() {
    state.government.effectiveSpending = safeNumber(state.government.effectiveSpending, state.config.governmentSpending) + 260;
    state.government.spending = safeNumber(state.government.spending, state.config.governmentSpending) + 260;
    state.shock.demandMultiplier = clamp(safeNumber(state.shock.demandMultiplier, 1) + 0.08, 0.5, 1.8);
    state.sentiment.consumerConfidence = clamp(safeNumber(state.sentiment.consumerConfidence, 0.7) + 0.06, 0, 1);
  }



  function applyValidationSupplyShock() {
    state.shock.productivityMultiplier = clamp(safeNumber(state.shock.productivityMultiplier, 1) * 0.82, 0.45, 1.4);
    state.shock.pricePressure = clamp(safeNumber(state.shock.pricePressure, 0) + 0.026, -0.05, 0.08);
    if (state.external) {
      state.external.commodityPriceIndex = clamp(safeNumber(state.external.commodityPriceIndex, 100) + 24, 40, 260);
      state.external.energyPriceIndex = clamp(safeNumber(state.external.energyPriceIndex, 100) + 28, 40, 280);
    }
  }



  function applyValidationTaxHike() {
    state.government.householdIncomeTaxRate = clamp(safeNumber(state.government.householdIncomeTaxRate, 0.16) + 0.05, 0, 0.50);
    state.government.corporateTaxRate = clamp(safeNumber(state.government.corporateTaxRate, 0.18) + 0.05, 0, 0.50);
    state.government.valueAddedTaxRate = clamp(safeNumber(state.government.valueAddedTaxRate, 0.10) + 0.03, 0, 0.35);
    state.sentiment.consumerConfidence = clamp(safeNumber(state.sentiment.consumerConfidence, 0.7) - 0.06, 0, 1);
    state.sentiment.businessConfidence = clamp(safeNumber(state.sentiment.businessConfidence, 0.7) - 0.04, 0, 1);
  }



  return {
    runDeveloperValidationMode,
    runDeveloperValidationCase,
    getDeveloperValidationMetrics,
    applyValidationRateHike,
    applyValidationSpendingBoost,
    applyValidationSupplyShock,
    applyValidationTaxHike
  };
}
