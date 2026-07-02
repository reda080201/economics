// Internal experiment, scenario validation, and quick-test runtime.
// Formulas and rendering strings are preserved; dependencies are supplied by context.
export function createExperimentRuntime(context) {
  const {
    state,
    els,
    CALIBRATION,
    TARGET_INFLATION,
    TARGET_UNEMPLOYMENT,
    TICKS_PER_MONTH,
    average,
    clamp,
    clearLazyResultCache,
    compactMoney,
    compareCoreStateSignatureRuntime,
    createInitialHistoricalScenario,
    escapeHtml,
    formatIndexPoint,
    formatSigned,
    formatStockReturn,
    getAllScenarioPresets,
    getBalanceDiagnosticSnapshot,
    historicalScenarioKeys,
    isLargeEconomyMode,
    macroMoney,
    mostFrequent,
    percent,
    pushEvent,
    recordRuntimeError,
    repairSimulationState,
    restoreSimulationSnapshotRuntime,
    round,
    runSimulationStep,
    safeNumber,
    safeRenderBalanceQuickTestResult,
    safeRenderSimulation,
    safeUpdateAllDisplays,
    safeUpdateCharts,
    setHtmlIfChanged,
    showToast,
    signedPercent,
    syncHistoricalScenarioMetrics,
    syncLivePolicy,
    updateControlLabels,
    updateRunState,
    applyCalibrationState,
    applyShock,
    captureCoreStateSignatureRuntime,
    captureSimulationSnapshotRuntime
  } = context;

  function runBalanceQuickTest() {
    const snapshot = captureSimulationSnapshot();
    const coreSignature = captureCoreStateSignature();
    const previousSuppressVisualUpdates = state.debug.suppressVisualUpdates;
    const samples = [];
    clearLazyResultCache();
    state.running = false;
    state.game.activeEvent = null;
    state.game.nextEventTick = state.tick + TICKS_PER_MONTH * 120 + 9999;
    state.debug.suppressVisualUpdates = true;
    updateRunState();
    els.balanceQuickTestBtn.disabled = true;
    els.balanceQuickTestBtn.textContent = "테스트 실행 중...";

    try {
      for (let i = 0; i < TICKS_PER_MONTH * 120; i += 1) {
        runSimulationStep();
        if (state.tick % TICKS_PER_MONTH === 0) {
          samples.push(getBalanceDiagnosticSnapshot());
        }
      }
      safeRenderBalanceQuickTestResult(samples);
    } catch (error) {
      recordRuntimeError(error, "테스트 오류", "빠른 테스트 중 오류가 감지되었습니다.", { silentToast: true });
      state.running = false;
      repairSimulationState();
      els.balanceTestResult.classList.add("visible");
      els.balanceTestResult.innerHTML = "<strong>테스트 오류</strong><br>빠른 테스트 중 오류가 감지되어 중단했습니다.";
      showToast("테스트 오류", "빠른 테스트 중 오류가 감지되었습니다.");
    } finally {
      restoreSimulationSnapshot(snapshot);
      state.debug.suppressVisualUpdates = previousSuppressVisualUpdates;
      warnIfStateRestoreFailed("120개월 빠른 테스트", coreSignature, els.balanceTestResult);
      els.balanceQuickTestBtn.disabled = false;
      els.balanceQuickTestBtn.textContent = "120개월 빠른 테스트";
      safeUpdateAllDisplays();
      safeUpdateCharts(true);
      safeRenderSimulation(performance.now());
      updateRunState();
    }
  }



  async function runScenarioValidation() {
    const scenarioKeys = [
      "stableGrowth", "highRateTightening", "housingOverheat", "stockOverheat", "commodityShock", "financialStress", "lowRateLongRun", "stagflation",
      "creditExcessFailure", "supplyBottleneckFailure", "productivityExpansion", "foreignDemandBoom", "foreignCapitalOutflow", "agricultureShock", "energyPriceShock",
      "koreaImf1997", "usFinancialCrisis2007", "japanBubbleEconomy", "germanyReunification", "turkiyeInflation2018"
    ];
    const snapshot = captureSimulationSnapshot();
    const coreSignature = captureCoreStateSignature();
    const previousSuppressVisualUpdates = state.debug.suppressVisualUpdates;
    const previousRunning = state.running;
    const results = [];
    clearLazyResultCache();
    state.running = false;
    state.debug.suppressVisualUpdates = true;
    els.scenarioValidationBtn.disabled = true;
    els.scenarioValidationBtn.textContent = "검증 중...";
    els.scenarioValidationResult.classList.add("visible");
    els.scenarioValidationResult.innerHTML = `<strong>시나리오 검증</strong><br>0 / ${scenarioKeys.length} 실행 중...`;
    updateRunState();

    try {
      for (let index = 0; index < scenarioKeys.length; index += 1) {
        const key = scenarioKeys[index];
        prepareCalibrationScenario(key);
        const samples = [];
        for (let tick = 0; tick < TICKS_PER_MONTH * 120; tick += 1) {
          runSimulationStep();
          if (state.tick % TICKS_PER_MONTH === 0) samples.push(getBalanceDiagnosticSnapshot());
        }
        results.push(summarizeScenarioValidation(key, samples));
        els.scenarioValidationResult.innerHTML = `<strong>시나리오 검증</strong><br>${index + 1} / ${scenarioKeys.length} 실행 중...`;
        await waitForUiTurn();
      }
      renderScenarioValidationResults(results);
    } catch (error) {
      recordRuntimeError(error, "검증 오류", "시나리오 검증 중 오류가 감지되었습니다.", { silentToast: true });
      els.scenarioValidationResult.innerHTML = "<strong>검증 오류</strong><br>시나리오 검증 중 오류가 감지되어 중단했습니다.";
      showToast("검증 오류", "시나리오 검증 중 오류가 감지되었습니다.");
    } finally {
      restoreSimulationSnapshot(snapshot);
      state.debug.suppressVisualUpdates = previousSuppressVisualUpdates;
      state.running = previousRunning;
      warnIfStateRestoreFailed("시나리오 검증", coreSignature, els.scenarioValidationResult);
      els.scenarioValidationBtn.disabled = false;
      els.scenarioValidationBtn.textContent = "시나리오 검증";
      safeUpdateAllDisplays();
      safeUpdateCharts(true);
      safeRenderSimulation(performance.now());
      updateRunState();
    }
  }



  async function runPolicyComparison() {
    const snapshot = captureSimulationSnapshot();
    const coreSignature = captureCoreStateSignature();
    const previousSuppressVisualUpdates = state.debug.suppressVisualUpdates;
    const previousRunning = state.running;
    const horizonMonths = clamp(Number(els.policyComparisonHorizon?.value || 60), 24, 120);
    const variants = getPolicyComparisonVariants();
    const results = [];
    clearLazyResultCache();
    state.running = false;
    state.debug.suppressVisualUpdates = true;
    if (els.policyComparisonBtn) {
      els.policyComparisonBtn.disabled = true;
      els.policyComparisonBtn.textContent = "비교 실행 중...";
    }
    if (els.policyComparisonResult) {
      els.policyComparisonResult.classList.add("visible");
      els.policyComparisonResult.innerHTML = `<strong>정책 비교</strong><br>0 / ${variants.length} 실행 중...`;
    }
    updateRunState();

    try {
      for (let index = 0; index < variants.length; index += 1) {
        const variant = variants[index];
        restoreSimulationSnapshot(snapshot);
        state.running = false;
        state.debug.suppressVisualUpdates = true;
        state.game.activeEvent = null;
        state.game.nextEventTick = state.tick + TICKS_PER_MONTH * horizonMonths + 9999;
        applyPolicyComparisonVariant(variant);
        const samples = [];
        for (let tick = 0; tick < TICKS_PER_MONTH * horizonMonths; tick += 1) {
          runSimulationStep();
          if (state.tick % TICKS_PER_MONTH === 0) samples.push(getBalanceDiagnosticSnapshot());
        }
        results.push(summarizePolicyComparisonResult(variant, samples));
        if (els.policyComparisonResult) {
          els.policyComparisonResult.innerHTML = `<strong>정책 비교</strong><br>${index + 1} / ${variants.length} 실행 중...`;
        }
        await waitForUiTurn();
      }
      renderPolicyComparisonResults(results, horizonMonths);
    } catch (error) {
      recordRuntimeError(error, "정책 비교 오류", "정책 비교 실행 중 오류가 감지되었습니다.", { silentToast: true });
      if (els.policyComparisonResult) {
        els.policyComparisonResult.classList.add("visible");
        els.policyComparisonResult.innerHTML = "<strong>정책 비교 오류</strong><br>정책 비교 중 오류가 감지되어 중단했습니다.";
      }
      showToast("정책 비교 오류", "정책 비교 중 오류가 감지되었습니다.");
    } finally {
      restoreSimulationSnapshot(snapshot);
      state.debug.suppressVisualUpdates = previousSuppressVisualUpdates;
      state.running = previousRunning;
      warnIfStateRestoreFailed("정책 비교", coreSignature, els.policyComparisonResult);
      if (els.policyComparisonBtn) {
        els.policyComparisonBtn.disabled = false;
        els.policyComparisonBtn.textContent = "정책 비교 실행";
      }
      safeUpdateAllDisplays();
      safeUpdateCharts(true);
      safeRenderSimulation(performance.now());
      updateRunState();
    }
  }



  function getPolicyComparisonVariants() {
    return [
      { key: "rateUp", label: "금리 +1%p", interestDelta: 1 },
      { key: "rateDown", label: "금리 -1%p", interestDelta: -1 },
      { key: "spendingUp", label: "정부지출 확대", spendingDelta: 180 },
      { key: "incomeTaxCut", label: "소득세 인하", taxDelta: -2 },
      { key: "corporateTaxCut", label: "법인세 인하", corporateTaxDelta: -3 },
      { key: "vatUp", label: "부가세 인상", vatDelta: 2 },
      { key: "creditEasing", label: "신용완화", creditEasing: true },
      { key: "tighteningPackage", label: "긴축 패키지", interestDelta: 0.75, spendingDelta: -120, taxDelta: 1, corporateTaxDelta: 1, vatDelta: 1 }
    ];
  }



  function applyPolicyComparisonVariant(variant) {
    const setSlider = (element, nextValue, min = -Infinity, max = Infinity) => {
      if (!element) return;
      const value = clamp(safeNumber(nextValue, Number(element.value)), min, max);
      element.value = String(round(value, 2));
    };
    setSlider(els.interestSlider, Number(els.interestSlider.value) + safeNumber(variant.interestDelta, 0), 0, 25);
    setSlider(els.taxSlider, Number(els.taxSlider.value) + safeNumber(variant.taxDelta, 0), 0, 60);
    setSlider(els.corporateTaxSlider, Number(els.corporateTaxSlider.value) + safeNumber(variant.corporateTaxDelta, 0), 0, 60);
    setSlider(els.vatSlider, Number(els.vatSlider.value) + safeNumber(variant.vatDelta, 0), 0, 35);
    setSlider(els.spendingSlider, Number(els.spendingSlider.value) + safeNumber(variant.spendingDelta, 0), 0, 5000);
    syncLivePolicy();
    if (variant.creditEasing) {
      if (state.financialMarket) {
        state.financialMarket.creditSupplyIndex = clamp(safeNumber(state.financialMarket.creditSupplyIndex, 100) + 8, 60, 125);
        state.financialMarket.creditSpread = clamp(safeNumber(state.financialMarket.creditSpread, 0.02) - 0.006, 0.008, 0.12);
        state.financialMarket.creditOfficerCaution = clamp(safeNumber(state.financialMarket.creditOfficerCaution, 0.28) - 0.08, 0, 1);
        state.financialMarket.loanDemandIndex = clamp(safeNumber(state.financialMarket.loanDemandIndex, 100) + 6, 60, 135);
      }
      if (state.creditCycle) {
        state.creditCycle.underwritingQuality = clamp(safeNumber(state.creditCycle.underwritingQuality, 0.76) - 0.04, 0.35, 1);
        state.creditCycle.creditExcessRisk = clamp(safeNumber(state.creditCycle.creditExcessRisk, 0.12) + 0.08, 0, 1);
        state.creditCycle.phase = "신용완화";
      }
    }
    updateControlLabels();
  }



  function summarizePolicyComparisonResult(variant, samples) {
    const rows = samples.length ? samples : [getBalanceDiagnosticSnapshot()];
    const final = rows[rows.length - 1];
    const avg = (key, fallback = 0) => average(rows.map((row) => safeNumber(row[key], fallback)));
    const sideEffect = classifyPolicyComparisonSideEffect(rows, variant);
    return {
      label: variant.label,
      finalGdp: safeNumber(final.gdp, 0),
      finalUnemployment: safeNumber(final.unemploymentRate, 0),
      avgInflation: avg("inflation", TARGET_INFLATION),
      avgFinancialConditions: avg("financialConditionIndex", 0),
      avgDebtToGdp: avg("debtToGdpRatio", 0) * 100,
      avgClassStress: avg("socialStressIndex", 0) * 100,
      avgBankHealth: avg("bankHealthIndex", 100),
      sideEffect,
      recommendation: policyComparisonRecommendation(variant, sideEffect)
    };
  }



  function policyComparisonRecommendation(variant, sideEffect) {
    if (sideEffect === "관리 가능") return "부작용은 낮지만 효과 크기는 다른 지표와 함께 확인";
    if (variant.key === "rateUp") return "물가 안정에는 유리하나 부채·주택 경로를 점검";
    if (variant.key === "rateDown") return "수요 회복에는 유리하나 자산·신용 과열을 점검";
    if (variant.key === "spendingUp") return "수요 보강에는 유리하나 재정 여력을 점검";
    if (variant.key === "creditEasing") return "투자 회복에는 직접적이나 신용 과다를 점검";
    if (variant.key === "corporateTaxCut") return "투자 전환율이 낮으면 자사주·부채상환으로 샐 수 있음";
    if (variant.key === "vatUp") return "세수에는 유리하나 저소득층 체감물가 부담이 큼";
    return "긴축 효과와 민간 심리 둔화를 함께 점검";
  }



  function classifyPolicyComparisonSideEffect(rows, variant) {
    const avg = (key, fallback = 0) => average(rows.map((row) => safeNumber(row[key], fallback)));
    if (avg("middleClassMortgageStress", 0) > 0.58 || avg("mortgageRate", 0) > 7.0) return "주택담보 부담";
    if (avg("creditCrunchRisk", 0.12) > 0.50 || avg("creditSupplyIndex", 100) < 80) return "신용경색 위험";
    if (avg("assetBubbleRiskScore", 0) > 0.62 || avg("creditExcessRisk", 0.12) > 0.54) return "자산·신용 과열";
    if (avg("debtToGdpRatio", 0) > 1.35 || avg("fiscalSpaceScore", 0.7) < 0.32) return "재정 여력 약화";
    if (avg("lowIncomeStress", 0) > 0.58 || avg("consumptionTaxPain", 0) > 0.58) return "저소득층 부담";
    if (avg("investmentConversionRate", 0.25) < 0.22 && variant.corporateTaxDelta < 0) return "투자 전환 제한";
    if (avg("inflation", TARGET_INFLATION) > 4.0) return "물가 압력";
    if (avg("bankHealthIndex", 100) < 72) return "은행 건전성";
    return "관리 가능";
  }



  function renderPolicyComparisonResults(results, horizonMonths) {
    if (!els.policyComparisonResult) return;
    const rows = results.map((result) => `
      <tr>
        <td>${escapeHtml(result.label)}</td>
        <td>${macroMoney(result.finalGdp)}</td>
        <td>${percent(result.finalUnemployment, 1)}</td>
        <td>${signedPercent(result.avgInflation)}</td>
        <td>${round(result.avgFinancialConditions, 1).toFixed(1)}</td>
        <td>${percent(result.avgDebtToGdp, 1)}</td>
        <td>${percent(result.avgClassStress, 0)}</td>
        <td>${round(result.avgBankHealth, 1).toFixed(1)}</td>
        <td>${escapeHtml(result.sideEffect)}</td>
      </tr>
    `).join("");
    const bestGrowth = results.reduce((best, item) => item.finalGdp > best.finalGdp ? item : best, results[0]);
    const safest = results.reduce((best, item) => (item.avgFinancialConditions + Math.max(0, 80 - item.avgBankHealth)) < (best.avgFinancialConditions + Math.max(0, 80 - best.avgBankHealth)) ? item : best, results[0]);
    const leastClassStress = results.reduce((best, item) => item.avgClassStress < best.avgClassStress ? item : best, results[0]);
    const lowestFinancialRisk = results.reduce((best, item) => {
      const itemRisk = item.avgFinancialConditions + Math.max(0, 80 - item.avgBankHealth) + Math.max(0, item.avgDebtToGdp - 100) * 0.08;
      const bestRisk = best.avgFinancialConditions + Math.max(0, 80 - best.avgBankHealth) + Math.max(0, best.avgDebtToGdp - 100) * 0.08;
      return itemRisk < bestRisk ? item : best;
    }, results[0]);
    const winnerSummary = `성장 우위: ${escapeHtml(bestGrowth?.label || "없음")} / 안정 우위: ${escapeHtml(safest?.label || "없음")} / 계층 부담 최소: ${escapeHtml(leastClassStress?.label || "없음")} / 금융위험 최소: ${escapeHtml(lowestFinancialRisk?.label || "없음")}`;
    setHtmlIfChanged(els.policyComparisonSummaryValue, winnerSummary);
    els.policyComparisonResult.classList.add("visible");
    setHtmlIfChanged(els.policyComparisonResult, `
      <strong>정책 비교 결과 · ${horizonMonths}개월</strong><br>
      ${winnerSummary}
      <details open><summary>요약표 보기</summary>
        <table style="width:100%; margin-top:6px; border-collapse:collapse; font-size:11px;">
          <thead><tr><th>정책</th><th>GDP</th><th>실업</th><th>물가</th><th>금융</th><th>부채/GDP</th><th>계층</th><th>은행</th><th>부작용</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </details>
      <details><summary>해석</summary><div style="margin-top:6px;">${results.map((result) => `<strong>${escapeHtml(result.label)}</strong>: ${escapeHtml(result.recommendation)}`).join("<br>")}<br><br>이 비교는 현재 모형 상태에서 대안 정책을 내부적으로 실행한 교육용 반사실 실험입니다. 실제 예측이 아니라 정책 전달 경로의 상대적 방향을 보여줍니다.</div></details>
    `);
  }



  function waitForUiTurn() {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }



  function captureSimulationSnapshot() {
    return captureSimulationSnapshotRuntime(state, els);
  }



  function captureUiSafeSnapshot() {
    return captureSimulationSnapshot();
  }



  function captureCoreStateSignature() {
    return captureCoreStateSignatureRuntime(state, { round, safeNumber });
  }



  function compareCoreStateSignature(before, after) {
    return compareCoreStateSignatureRuntime(before, after, safeNumber);
  }



  function warnIfStateRestoreFailed(label, beforeSignature, targetElement = null) {
    const diffKeys = compareCoreStateSignature(beforeSignature, captureCoreStateSignature());
    if (!diffKeys.length) return false;
    const message = `${label} 후 상태 복원 차이가 감지되었습니다: ${diffKeys.join(", ")}`;
    recordRuntimeError(new Error(message), "상태 복원 경고", message, { silentToast: true });
    showToast("상태 복원 경고", "내부 비교 실행 후 일부 지표 복원 차이가 감지되었습니다.");
    if (targetElement) {
      targetElement.classList.add("visible");
      targetElement.insertAdjacentHTML("afterbegin", `<div class="balance-warnings">상태 복원 경고: ${escapeHtml(diffKeys.join(", "))}</div>`);
    }
    return true;
  }



  function restoreSimulationSnapshot(snapshot) {
    restoreSimulationSnapshotRuntime(state, els, snapshot, updateControlLabels);
  }



  function restoreUiSafeSnapshot(snapshot) {
    restoreSimulationSnapshot(snapshot);
  }



  function prepareCalibrationScenario(key) {
    const scenarios = getAllScenarioPresets();
    const scenario = scenarios[key] || scenarios.stableGrowth;
    els.interestSlider.value = scenario.interest;
    els.taxSlider.value = scenario.tax;
    els.corporateTaxSlider.value = scenario.corporateTax;
    els.vatSlider.value = scenario.vat ?? 10;
    els.spendingSlider.value = scenario.spending;
    els.wageSlider.value = scenario.wage;
    els.inflationSlider.value = scenario.inflation;
    resetSimulation();
    if (scenario.shock) applyShock(scenario.shock);
    applyCalibrationState(scenario);
    if (historicalScenarioKeys().includes(key)) {
      state.historicalScenario = {
        ...createInitialHistoricalScenario(),
        active: false,
        key,
        label: scenario.label,
        currentPhaseLabel: "즉시 프리셋",
        currentShock: scenario.message || "역사 시나리오 즉시 프리셋",
        intensity: 0.58
      };
      syncHistoricalScenarioMetrics();
    }
    state.game.scenarioName = scenario.label;
    state.running = false;
    state.game.activeEvent = null;
    state.game.nextEventTick = state.tick + TICKS_PER_MONTH * 120 + 9999;
    state.debug.suppressVisualUpdates = true;
  }



  function summarizeScenarioValidation(key, samples) {
    const rows = samples.length ? samples : [getBalanceDiagnosticSnapshot()];
    const preset = getAllScenarioPresets()[key] || { label: key };
    const final = rows[rows.length - 1];
    const avgUnemployment = average(rows.map((row) => row.unemploymentRate));
    const avgInflation = average(rows.map((row) => row.inflation));
    const avgFirmStress = average(rows.map((row) => row.firmStressRatio));
    const avgBankHealth = average(rows.map((row) => row.bankHealthIndex));
    const avgCreditSupply = average(rows.map((row) => row.creditSupplyIndex));
    const avgStockReturn = average(rows.map((row) => row.stockMonthlyReturn));
    const avgHousingReturn = average(rows.map((row) => row.housingReturn || row.residentialReturn));
    const avgDebtToGdp = average(rows.map((row) => row.debtToGdpRatio * 100));
    const judgement = judgeScenarioRows(rows, key);
    return {
      label: preset.label,
      judgement,
      finalUnemployment: final.unemploymentRate,
      avgUnemployment,
      avgInflation,
      finalGdp: final.gdp,
      avgFirmStress,
      avgBankHealth,
      avgCreditSupply,
      avgStockReturn,
      avgHousingReturn,
      avgDebtToGdp,
      keyRisk: scenarioKeyRisk(rows, judgement, key)
    };
  }



  function judgeScenarioRows(rows, key = "") {
    const avgUnemployment = average(rows.map((row) => row.unemploymentRate));
    const peakUnemployment = Math.max(...rows.map((row) => row.unemploymentRate));
    const avgInflation = average(rows.map((row) => row.inflation));
    const avgOutputGap = average(rows.map((row) => row.outputGap));
    const avgFirmStress = average(rows.map((row) => row.firmStressRatio));
    const avgBankHealth = average(rows.map((row) => row.bankHealthIndex));
    const avgCreditSupply = average(rows.map((row) => row.creditSupplyIndex));
    const avgHousingAffordability = average(rows.map((row) => row.housingAffordability));
    const avgDebtToGdp = average(rows.map((row) => row.debtToGdpRatio * 100));
    const avgBubble = average(rows.map((row) => row.assetBubbleRiskScore));
    const avgZombie = average(rows.map((row) => row.zombieFirmRatio));
    const avgCommodity = average(rows.map((row) => row.commodityCostPressure));
    const avgCreditCrunchRisk = average(rows.map((row) => safeNumber(row.creditCrunchRisk, 0.12)));
    const avgCreditExcessRisk = average(rows.map((row) => safeNumber(row.creditExcessRisk, 0.12)));
    const avgBondMarketStress = average(rows.map((row) => safeNumber(row.bondMarketStress, 0.10)));
    const avgDepositorConfidence = average(rows.map((row) => safeNumber(row.depositorConfidence, 0.88)));
    const avgInterbankTrust = average(rows.map((row) => safeNumber(row.interbankTrust, 0.84)));
    const avgVatBurden = average(rows.map((row) => safeNumber(row.consumptionTaxPain, 0)));
    const avgCorporateTaxPressure = average(rows.map((row) => safeNumber(row.corporateTaxPressure, 0)));
    const avgInvestmentConversion = average(rows.map((row) => safeNumber(row.investmentConversionRate, 0)));
    const avgBuybackPayout = average(rows.map((row) => safeNumber(row.buybackPayoutRatio, 0)));
    const avgMarketFailureRisk = average(rows.map((row) => safeNumber(row.marketFailureRisk, 0.22)));
    const avgMarketSuccessScore = average(rows.map((row) => safeNumber(row.marketSuccessScore, 0.50)));
    const failureType = mostFrequent(rows.map((row) => row.marketFailureType || "없음"));
    const successType = mostFrequent(rows.map((row) => row.marketSuccessType || "형성 중"));
    const avgForeignInvestorSentiment = average(rows.map((row) => safeNumber(row.foreignInvestorSentiment, 0.72)));
    const avgForeignBondDemand = average(rows.map((row) => safeNumber(row.foreignBondDemand, 0.74)));
    const avgAgricultureStress = average(rows.map((row) => safeNumber(row.agricultureStress, 0)));
    const avgEnergyStress = average(rows.map((row) => safeNumber(row.energyStress, 0)));
    const historicalKey = key || mostFrequent(rows.map((row) => row.historicalScenarioKey || ""));
    const avgHistoricalIntensity = average(rows.map((row) => safeNumber(row.historicalScenarioIntensity, 0)));
    if (peakUnemployment > 45 || avgUnemployment > 25) return "붕괴 위험";
    if (historicalKey && avgHistoricalIntensity > 0.25) return historicalScenarioJudgement(historicalKey);
    if (avgInflation > 3.5 && avgOutputGap < -2) return "스태그플레이션 위험";
    if (avgEnergyStress > 0.58) return "에너지 비용 충격";
    if (avgAgricultureStress > 0.58) return "농업 공급 충격";
    if (avgForeignInvestorSentiment < 0.45 || avgForeignBondDemand < 0.45) return "해외자본 유출 압력";
    if (avgMarketFailureRisk > 0.58) return failureType === "정보 비대칭" ? "정보 비대칭형 불안" : failureType === "신용 배분 실패" ? "신용 배분 실패" : failureType === "외부비용 충격" ? "외부비용 충격" : "시장 실패 위험";
    if (avgCommodity > 1.6 && avgInflation > 2.7) return "원자재 비용 충격";
    if (avgCreditCrunchRisk > 0.50 || avgCreditSupply < 70) return "신용경색 위험";
    if (avgCreditExcessRisk > 0.52 && avgBubble > 0.48) return "신용 과다 누적";
    if (avgBondMarketStress > 0.52) return "국채시장 스트레스";
    if (avgDepositorConfidence < 0.58 || avgInterbankTrust < 0.58) return "은행 심리 위축";
    if (avgVatBurden > 0.58 && avgUnemployment > 8) return "부가세 부담형 소비둔화";
    if (avgCorporateTaxPressure > 0.62 && avgInvestmentConversion < 0.24) return "법인세 부담형 투자둔화";
    if (avgBuybackPayout > 0.34 && avgInvestmentConversion < 0.24) return "자사주 우선 배분";
    if (avgBankHealth < 70 || avgCreditSupply < 72) return "금융여건 긴축";
    if (avgBubble > 0.65 || avgHousingAffordability > 1.65) return "자산시장 과열";
    if (avgZombie > 15) return "좀비기업 누적";
    if (avgDebtToGdp > 160) return "재정 여력 제한";
    if (avgFirmStress > 45) return "기업 금융 스트레스형 안정";
    const avgHiddenVulnerability = average(rows.map((row) => safeNumber(row.hiddenVulnerabilityIndex, 0)));
    if (avgHiddenVulnerability > 0.58) return "숨은 취약성 누적";
    if (avgMarketSuccessScore > 0.70 && avgMarketFailureRisk < 0.35 && avgOutputGap > -2) return successType === "생산성 개선" ? "생산성 기반 성장" : "시장 기능 개선";
    if (!historicalKey && avgUnemployment >= 4 && avgUnemployment <= 8 && avgInflation >= 1 && avgInflation <= 3 && avgOutputGap >= -3 && avgOutputGap <= 3 && avgFirmStress < 40 && avgBankHealth > 75 && avgCreditSupply > 78 && avgHiddenVulnerability < 0.45 && avgVatBurden < 0.55 && avgInvestmentConversion > 0.22 && avgBuybackPayout < 0.38 && avgMarketFailureRisk < 0.42) return "정상 성장";
    if (avgUnemployment > 10 || avgOutputGap < -4) return "수요 부족형 둔화";
    if (avgInflation > 3.2) return "과열 위험";
    return "겉보기 안정";
  }



  function scenarioKeyRisk(rows, judgement, key = "") {
    const avgDebtBurden = average(rows.map((row) => row.averageHouseholdDebtBurden));
    const avgCreditSpread = average(rows.map((row) => row.creditSpread));
    const avgHousingAffordability = average(rows.map((row) => row.housingAffordability));
    const avgBubble = average(rows.map((row) => row.assetBubbleRiskScore));
    const avgCommodity = average(rows.map((row) => row.commodityCostPressure));
    const avgZombie = average(rows.map((row) => row.zombieFirmRatio));
    const avgBankHealth = average(rows.map((row) => row.bankHealthIndex));
    const avgHiddenVulnerability = average(rows.map((row) => safeNumber(row.hiddenVulnerabilityIndex, 0)));
    const avgCreditCrunchRisk = average(rows.map((row) => safeNumber(row.creditCrunchRisk, 0.12)));
    const avgCreditExcessRisk = average(rows.map((row) => safeNumber(row.creditExcessRisk, 0.12)));
    const avgBondMarketStress = average(rows.map((row) => safeNumber(row.bondMarketStress, 0.10)));
    const avgDepositorConfidence = average(rows.map((row) => safeNumber(row.depositorConfidence, 0.88)));
    const avgVatBurden = average(rows.map((row) => safeNumber(row.consumptionTaxPain, 0)));
    const avgCorporateTaxPressure = average(rows.map((row) => safeNumber(row.corporateTaxPressure, 0)));
    const avgBuybackPayout = average(rows.map((row) => safeNumber(row.buybackPayoutRatio, 0)));
    const avgMarketFailureRisk = average(rows.map((row) => safeNumber(row.marketFailureRisk, 0.22)));
    const avgMarketSuccessScore = average(rows.map((row) => safeNumber(row.marketSuccessScore, 0.50)));
    const failureType = mostFrequent(rows.map((row) => row.marketFailureType || "없음"));
    const avgForeignInvestorSentiment = average(rows.map((row) => safeNumber(row.foreignInvestorSentiment, 0.72)));
    const avgForeignBondDemand = average(rows.map((row) => safeNumber(row.foreignBondDemand, 0.74)));
    const avgAgricultureStress = average(rows.map((row) => safeNumber(row.agricultureStress, 0)));
    const avgEnergyStress = average(rows.map((row) => safeNumber(row.energyStress, 0)));
    const historicalKey = key || mostFrequent(rows.map((row) => row.historicalScenarioKey || ""));
    if (historicalKey) return historicalScenarioKeyRisk(historicalKey);
    if (judgement === "정상 성장") return "없음";
    if (avgMarketSuccessScore > 0.70 && avgMarketFailureRisk < 0.35) return "시장기능";
    if (avgMarketFailureRisk > 0.55) return failureType;
    if (avgForeignInvestorSentiment < 0.45 || avgForeignBondDemand < 0.45) return "해외자본";
    if (avgAgricultureStress > 0.55) return "농업공급";
    if (avgEnergyStress > 0.55) return "에너지비용";
    if (avgCreditCrunchRisk > 0.48) return "신용경색";
    if (avgCreditExcessRisk > 0.50) return "신용과다";
    if (avgBondMarketStress > 0.50) return "국채변동성";
    if (avgDepositorConfidence < 0.60) return "예금자신뢰";
    if (avgVatBurden > 0.55) return "부가세부담";
    if (avgCorporateTaxPressure > 0.60) return "법인세부담";
    if (avgBuybackPayout > 0.34) return "자사주우선";
    if (avgHiddenVulnerability > 0.55) return "숨은취약성";
    if (avgDebtBurden > 16) return "부채부담";
    if (avgCreditSpread > 5 || avgBankHealth < 72) return "신용위축";
    if (avgHousingAffordability > 1.55) return "주거부담";
    if (avgBubble > 0.60) return "버블";
    if (avgCommodity > 1.5) return "비용충격";
    if (avgZombie > 12) return "좀비기업";
    return "수요둔화";
  }



  function historicalScenarioJudgement(key) {
    const map = {
      koreaImf1997: "외환위기형 긴축",
      usFinancialCrisis2007: "주택담보 신용위기",
      japanBubbleEconomy: "자산버블 붕괴 위험",
      germanyReunification: "재정이전형 성장",
      turkiyeInflation2018: "고물가·환율 불안"
    };
    return map[key] || "역사 시나리오 진행 중";
  }



  function historicalScenarioKeyRisk(key) {
    const map = {
      koreaImf1997: "외환·신용경색",
      usFinancialCrisis2007: "주택담보",
      japanBubbleEconomy: "자산버블",
      germanyReunification: "재정이전",
      turkiyeInflation2018: "환율·고물가"
    };
    return map[key] || "역사충격";
  }



  function renderScenarioValidationResults(results) {
    const rows = results.map((result) => `
      <tr>
        <td>${escapeHtml(result.label)}</td>
        <td>${escapeHtml(result.judgement)}</td>
        <td>${percent(result.avgUnemployment, 1)}</td>
        <td>${signedPercent(result.avgInflation)}</td>
        <td>${macroMoney(result.finalGdp)}</td>
        <td>${escapeHtml(result.keyRisk)}</td>
      </tr>
    `).join("");
    els.scenarioValidationResult.classList.add("visible");
    els.scenarioValidationResult.innerHTML = `
      <strong>시나리오 검증 결과</strong>
      <table style="width:100%; margin-top:6px; border-collapse:collapse; font-size:11px;">
        <thead><tr><th>시나리오</th><th>판정</th><th>실업률</th><th>물가</th><th>GDP</th><th>핵심 위험</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }



  function renderBalanceQuickTestResult(samples) {
    const rows = samples.length ? samples : [getBalanceDiagnosticSnapshot()];
    const unemploymentSeries = rows.map((row) => row.unemploymentRate);
    const inflationSeries = rows.map((row) => row.inflation);
    const gdpSeries = rows.map((row) => row.gdp);
    const avgUnemployment = average(unemploymentSeries);
    const peakUnemployment = unemploymentSeries.length ? Math.max(...unemploymentSeries) : 0;
    const avgInflation = average(inflationSeries);
    const peakInflation = inflationSeries.length ? Math.max(...inflationSeries) : 0;
    const final = rows[rows.length - 1];
    const lowestGdp = gdpSeries.length ? Math.min(...gdpSeries) : 0;
    const monthsOver20 = unemploymentSeries.filter((value) => value > 20).length;
    const monthsOver40 = unemploymentSeries.filter((value) => value > 40).length;
    const avgHiringFreezeRatio = average(rows.map((row) => row.hiringFreezeRatio));
    const avgFirmStressRatio = average(rows.map((row) => row.firmStressRatio));
    const avgInventoryDemandRatio = average(rows.map((row) => row.inventoryDemandRatio));
    const avgConsumption = average(rows.map((row) => row.consumption));
    const avgOutputGap = average(rows.map((row) => safeNumber(row.outputGap, 0)));
    const avgUnemploymentGap = average(rows.map((row) => safeNumber(row.unemploymentGap, row.unemploymentRate - TARGET_UNEMPLOYMENT)));
    const avgInflationGap = average(rows.map((row) => safeNumber(row.inflationGap, row.inflation - TARGET_INFLATION)));
    const avgPolicyGap = average(rows.map((row) => safeNumber(row.policyGap, state.metrics.policyGap)));
    const avgCapacityUtilization = average(rows.map((row) => safeNumber(row.capacityUtilization, 0)));
    const avgRealWageGrowth = average(rows.map((row) => safeNumber(row.realWageGrowth, 0)));
    const avgFinancialConditionIndex = average(rows.map((row) => safeNumber(row.financialConditionIndex, 0)));
    const avgConsumerConfidence = average(rows.map((row) => safeNumber(row.averageConfidence, 0)));
    const avgFirmConfidence = average(rows.map((row) => safeNumber(row.averageBusinessOutlook, 0)));
    const avgConsumerSentiment = average(rows.map((row) => safeNumber(row.consumerSentiment, row.averageConfidence || 0.8)));
    const avgBusinessSentiment = average(rows.map((row) => safeNumber(row.businessSentiment, row.averageBusinessOutlook || 0.8)));
    const avgBankRiskAppetite = average(rows.map((row) => safeNumber(row.bankRiskAppetite, 0.7)));
    const avgMarketRiskSentiment = average(rows.map((row) => safeNumber(row.marketRiskSentiment, 0.7)));
    const avgFearGreedIndex = average(rows.map((row) => safeNumber(row.fearGreedIndex, 50)));
    const avgStockVolatilityIndex = average(rows.map((row) => safeNumber(row.stockVolatilityIndex, 18)));
    const extremeFearMonths = rows.filter((row) => safeNumber(row.fearGreedIndex, 50) < 20).length;
    const extremeGreedMonths = rows.filter((row) => safeNumber(row.fearGreedIndex, 50) > 80).length;
    const avgInformationUncertainty = average(rows.map((row) => safeNumber(row.informationUncertainty, 0.16)));
    const avgRumorIntensity = average(rows.map((row) => safeNumber(row.rumorIntensity, 0)));
    const avgMisperceptionIndex = average(rows.map((row) => safeNumber(row.misperceptionIndex, 0.12)));
    const avgPolicyClarity = average(rows.map((row) => safeNumber(row.policyClarity, 0.78)));
    const avgExpectationError = average(rows.map((row) => safeNumber(row.expectationError, 0)));
    const avgRealEstateBelief = average(rows.map((row) => safeNumber(row.realEstateNeverFallsBelief, 0.46)));
    const avgStockBelief = average(rows.map((row) => safeNumber(row.stockMarketNeverFailsBelief, 0.46)));
    const avgHerdIntensity = average(rows.map((row) => safeNumber(row.herdIntensity, 0.18)));
    const avgFomoIntensity = average(rows.map((row) => safeNumber(row.fomoIntensity, 0.12)));
    const avgConfirmationBias = average(rows.map((row) => safeNumber(row.confirmationBias, 0.35)));
    const avgBehaviorMispricing = average(rows.map((row) => safeNumber(row.behavioralMispricingIndex, 0)));
    const highHousingMispricingMonths = rows.filter((row) => safeNumber(row.housingMispricing, 0) > 20).length;
    const highStockMispricingMonths = rows.filter((row) => safeNumber(row.stockMispricing, 0) > 24).length;
    const beliefBreakdownMonths = rows.filter((row) => safeNumber(row.beliefBreakRisk, 0) > 0.62 || safeNumber(row.panicSellingPressure, 0) > 0.62).length;
    const marketOverreactionMonths = rows.filter((row) => safeNumber(row.marketOverreaction, 0.1) > 0.55).length;
    const avgSentimentInflationExpectations = average(rows.map((row) => safeNumber(row.sentimentInflationExpectations, TARGET_INFLATION)));
    const avgRecessionFear = average(rows.map((row) => safeNumber(row.recessionFear, 0.2)));
    const avgFiscalCredibilitySentiment = average(rows.map((row) => safeNumber(row.fiscalCredibility, 0.75)));
    const weakConsumerSentimentMonths = rows.filter((row) => safeNumber(row.consumerSentiment, 0.8) < 0.45).length;
    const weakBusinessSentimentMonths = rows.filter((row) => safeNumber(row.businessSentiment, 0.8) < 0.45).length;
    const highRecessionFearMonths = rows.filter((row) => safeNumber(row.recessionFear, 0.2) > 0.60).length;
    const debtToGdpSeries = rows.map((row) => safeNumber(row.debtToGdpRatio, 0) * 100);
    const avgDebtToGdp = average(debtToGdpSeries);
    const peakDebtToGdp = debtToGdpSeries.length ? Math.max(...debtToGdpSeries) : 0;
    const avgHouseholdDebtBurden = average(rows.map((row) => safeNumber(row.averageHouseholdDebtBurden, 0)));
    const avgFirmDSCR = average(rows.map((row) => safeNumber(row.averageFirmDSCR, 99)));
    const avgFiscalSpace = average(rows.map((row) => safeNumber(row.fiscalSpaceScore, 1)));
    const debtStressWarningMonths = rows.filter((row) => safeNumber(row.averageHouseholdDebtBurden, 0) > 18 || safeNumber(row.averageFirmDSCR, 99) < 1.2 || safeNumber(row.fiscalSpaceScore, 1) < 0.25).length;
    const stockPointSeries = rows.map((row) => safeNumber(row.stockIndexPoints, safeNumber(row.stockIndex, 100) * 25));
    const finalStockIndexPoints = safeNumber(final.stockIndexPoints, state.metrics.stockIndexPoints || 2500);
    const lowestStockIndexPoints = stockPointSeries.length ? Math.min(...stockPointSeries) : finalStockIndexPoints;
    const highestStockIndexPoints = stockPointSeries.length ? Math.max(...stockPointSeries) : finalStockIndexPoints;
    const stockDrawdown = stockPointSeries.reduce((maxDrawdown, value, index) => {
      const priorPeak = Math.max(...stockPointSeries.slice(0, index + 1));
      return Math.max(maxDrawdown, (priorPeak - value) / Math.max(1, priorPeak) * 100);
    }, 0);
    const stockCorrectionMonths = rows.filter((row) => safeNumber(row.stockMonthlyReturn, 0) < -10 || safeNumber(row.stockDrawdown, 0) > 10).length;
    const highValuationMonths = rows.filter((row) => safeNumber(row.stockValuationPressure, 0) > 0.58).length;
    const avgValuationPressure = average(rows.map((row) => safeNumber(row.stockValuationPressure, 0)));
    const finalStockIndex = safeNumber(final.stockIndex, state.metrics.stockIndex);
    const finalHousingIndex = safeNumber(final.housingIndex, state.metrics.housingIndex);
    const avgStockReturn = average(rows.map((row) => safeNumber(row.stockMonthlyReturn, safeNumber(row.stockReturn, 0) * TICKS_PER_MONTH)));
    const avgHousingReturn = average(rows.map((row) => safeNumber(row.housingReturn, 0)));
    const avgWealthEffect = average(rows.map((row) => safeNumber(row.wealthEffect, 0)));
    const peakBubbleRisk = rows.length ? Math.max(...rows.map((row) => safeNumber(row.assetBubbleRiskScore, 0))) : 0;
    const avgHousingAffordability = average(rows.map((row) => safeNumber(row.housingAffordability, 1)));
    const housingStressMonths = rows.filter((row) => safeNumber(row.housingAffordability, 1) > 1.65 || safeNumber(row.averageMortgageBurden, 0) > 12).length;
    const highBubbleMonths = rows.filter((row) => safeNumber(row.assetBubbleRiskScore, 0) > 0.65).length;
    const avgFirmStockReturn = average(rows.map((row) => safeNumber(row.averageFirmStockReturn, 0)));
    const avgResidentialReturn = average(rows.map((row) => safeNumber(row.residentialReturn, row.housingReturn || 0)));
    const avgCommercialReturn = average(rows.map((row) => safeNumber(row.commercialReturn, 0)));
    const peakNegativeEquityRatio = rows.length ? Math.max(...rows.map((row) => safeNumber(row.negativeEquityRatio, 0))) : 0;
    const avgCommercialVacancy = average(rows.map((row) => safeNumber(row.commercialVacancy, 8)));
    const avgCollateralValueIndex = average(rows.map((row) => safeNumber(row.collateralValueIndex, 100)));
    const stockPanicMonths = rows.filter((row) => safeNumber(row.stockVolatilityIndex, 18) > 45 || safeNumber(row.fearGreedIndex, 50) < 22).length;
    const realEstateStressMonths = rows.filter((row) => safeNumber(row.realEstateStress, 0) > 0.55 || safeNumber(row.collateralValueIndex, 100) < 88 || safeNumber(row.commercialVacancy, 8) > 20).length;
    const highOpacityMonths = rows.filter((row) => safeNumber(row.opaqueFirmRatio, 0) > 35).length;
    const averageFirmStockVolatility = average(rows.map((row) => safeNumber(row.firmStockVolatility, 0)));
    const avgPolicyRate = average(rows.map((row) => safeNumber(row.interestRatePercent, 0)));
    const avgLoanRate = average(rows.map((row) => safeNumber(row.loanRate, 0)));
    const avgMortgageRate = average(rows.map((row) => safeNumber(row.mortgageRate, 0)));
    const avgDepositRate = average(rows.map((row) => safeNumber(row.depositRate, 0)));
    const avgRealPolicyRate = average(rows.map((row) => safeNumber(row.realPolicyRate, 0)));
    const avgBondYield10Y = average(rows.map((row) => safeNumber(row.bondYield10Y, safeNumber(row.bondYield, 0))));
    const avgTermSpread = average(rows.map((row) => safeNumber(row.termSpread, 0)));
    const invertedCurveMonths = rows.filter((row) => safeNumber(row.termSpread, 0) < -0.25).length;
    const avgDebtServiceBurdenRate = average(rows.map((row) => safeNumber(row.debtServiceBurden, 0)));
    const avgGovernmentFundingRate = average(rows.map((row) => safeNumber(row.governmentAverageFundingRate, safeNumber(row.bondYield, 0))));
    const highRateUncertaintyMonths = rows.filter((row) => safeNumber(row.rateUncertainty, 0) > 0.55).length;
    const policySurpriseCount = rows.filter((row) => Math.abs(safeNumber(row.policySurpriseRate, safeNumber(row.policySurprise, 0))) > 0.35).length;
    const avgBondYield = average(rows.map((row) => safeNumber(row.bondYield, 0)));
    const avgTreasuryBill3M = average(rows.map((row) => safeNumber(row.treasuryBill3M, row.shortTermRate || 0)));
    const avgBondYield5Y = average(rows.map((row) => safeNumber(row.bondYield5Y, row.bondYield10Y || row.bondYield || 0)));
    const avgBondYield30Y = average(rows.map((row) => safeNumber(row.bondYield30Y, row.bondYield10Y || row.bondYield || 0)));
    const avgLongBondPriceIndex = average(rows.map((row) => safeNumber(row.longBondPriceIndex, 100)));
    const avgBondMarketStress = average(rows.map((row) => safeNumber(row.bondMarketStress, 0.10)));
    const avgDepositorConfidence = average(rows.map((row) => safeNumber(row.depositorConfidence, 0.88)));
    const avgInterbankTrust = average(rows.map((row) => safeNumber(row.interbankTrust, 0.84)));
    const avgCreditOfficerCaution = average(rows.map((row) => safeNumber(row.creditOfficerCaution, 0.28)));
    const avgLoanDemandIndex = average(rows.map((row) => safeNumber(row.loanDemandIndex, 100)));
    const avgCreditGap = average(rows.map((row) => safeNumber(row.creditGap, 0)));
    const avgUnderwritingQuality = average(rows.map((row) => safeNumber(row.underwritingQuality, 0.76)));
    const avgCreditCrunchRisk = average(rows.map((row) => safeNumber(row.creditCrunchRisk, 0.12)));
    const avgCreditExcessRisk = average(rows.map((row) => safeNumber(row.creditExcessRisk, 0.12)));
    const creditCrunchMonths = rows.filter((row) => safeNumber(row.creditCrunchRisk, 0.12) > 0.55 || row.creditCyclePhase === "신용경색").length;
    const creditExcessMonths = rows.filter((row) => safeNumber(row.creditExcessRisk, 0.12) > 0.55 || row.creditCyclePhase === "신용 과다").length;
    const longRateShockMonths = rows.filter((row) => safeNumber(row.bondMarketStress, 0.10) > 0.55 || safeNumber(row.longBondPriceIndex, 100) < 82 || safeNumber(row.bondYield30Y, 0) > safeNumber(row.bondYield10Y, 0) + 1.8).length;
    const avgCreditSpread = average(rows.map((row) => safeNumber(row.creditSpread, 0)));
    const avgBankHealth = average(rows.map((row) => safeNumber(row.bankHealthIndex, 100)));
    const avgCreditSupply = average(rows.map((row) => safeNumber(row.creditSupplyIndex, 100)));
    const peakBankStress = rows.length ? Math.max(...rows.map((row) => safeNumber(row.bankStress, 0))) : 0;
    const bankingCrisisMonths = rows.filter((row) => safeNumber(row.bankingCrisisRiskScore, 0) > 0.60).length;
    const avgSafeHavenDemand = average(rows.map((row) => safeNumber(row.safeHavenDemand, 0)));
    const finalGoldIndex = safeNumber(final.goldIndex, state.metrics.goldIndex);
    const finalSilverIndex = safeNumber(final.silverIndex, state.metrics.silverIndex);
    const avgLowIncomeConsumptionCapacity = average(rows.map((row) => safeNumber(row.lowIncomeConsumptionCapacity, 1)));
    const avgMiddleClassHousingBurden = average(rows.map((row) => safeNumber(row.middleClassHousingBurden, 0)));
    const avgHighIncomeAssetEffect = average(rows.map((row) => safeNumber(row.highIncomeWealthEffect, 0)));
    const avgWealthInequality = average(rows.map((row) => safeNumber(row.wealthInequality, 0)));
    const avgWealthyAssetEffect = average(rows.map((row) => safeNumber(row.wealthyAssetEffect, 0)));
    const avgClassSentimentGap = average(rows.map((row) => safeNumber(row.classSentimentGap, 0)));
    const avgHiddenVulnerability = average(rows.map((row) => safeNumber(row.hiddenVulnerabilityIndex, 0)));
    const avgHouseholdVulnerability = average(rows.map((row) => safeNumber(row.householdVulnerability, 0)));
    const avgFirmVulnerability = average(rows.map((row) => safeNumber(row.firmVulnerability, 0)));
    const avgBankVulnerability = average(rows.map((row) => safeNumber(row.bankVulnerability, 0)));
    const avgHousingVulnerability = average(rows.map((row) => safeNumber(row.housingVulnerability, 0)));
    const avgExternalVulnerability = average(rows.map((row) => safeNumber(row.externalVulnerability, 0)));
    const hiddenVulnerabilityMonths = rows.filter((row) => safeNumber(row.hiddenVulnerabilityIndex, 0) > 0.58).length;
    const lowIncomeStressMonths = rows.filter((row) => safeNumber(row.lowIncomeStress, 0) > 0.62 || safeNumber(row.lowIncomeConsumptionCapacity, 1) < 0.70).length;
    const middleMortgageStressMonths = rows.filter((row) => safeNumber(row.middleClassMortgageStress, 0) > 0.62 || safeNumber(row.middleClassHousingBurden, 0) > 16).length;
    const wealthInequalityRisingMonths = rows.filter((row, index) => index > 0 && safeNumber(row.wealthInequality, 0) > safeNumber(rows[index - 1].wealthInequality, 0) + 0.002).length;
    const avgExchangeRateIndex = average(rows.map((row) => safeNumber(row.exchangeRateIndex, 100)));
    const avgImportPriceInflation = average(rows.map((row) => safeNumber(row.importPriceIndex, 100) - 100));
    const avgCommodityPressure = average(rows.map((row) => safeNumber(row.commodityCostPressure, 0)));
    const avgCentralBankCredibility = average(rows.map((row) => safeNumber(row.centralBankCredibility, 0.78)));
    const deAnchoredInflationMonths = rows.filter((row) => Math.abs(safeNumber(row.sentimentInflationExpectations, TARGET_INFLATION) - TARGET_INFLATION) > 1.3 || safeNumber(row.inflationTargetCredibility, 0.8) < 0.45).length;
    const avgZombieFirmRatio = average(rows.map((row) => safeNumber(row.zombieFirmRatio, 0)));
    const avgDistressedFirmRatio = average(rows.map((row) => safeNumber(row.distressedFirmRatio, 0)));
    const avgSocialStressIndex = average(rows.map((row) => safeNumber(row.socialStressIndex, 0)));
    const avgVatBurden = average(rows.map((row) => safeNumber(row.consumptionTaxPain, 0)));
    const avgHouseholdTaxPressure = average(rows.map((row) => safeNumber(row.householdTaxPressure, 0)));
    const avgCorporateTaxPressure = average(rows.map((row) => safeNumber(row.corporateTaxPressure, 0)));
    const avgTaxSentimentScore = average(rows.map((row) => safeNumber(row.taxSentimentScore, 0)));
    const totalHouseholdTax = sum(rows.map((row) => safeNumber(row.householdIncomeTaxCollected, 0)));
    const totalCorporateTax = sum(rows.map((row) => safeNumber(row.corporateTaxCollected, 0)));
    const totalVat = sum(rows.map((row) => safeNumber(row.valueAddedTaxCollected, 0)));
    const totalTax = Math.max(1, totalHouseholdTax + totalCorporateTax + totalVat);
    const householdTaxShare = totalHouseholdTax / totalTax * 100;
    const corporateTaxShare = totalCorporateTax / totalTax * 100;
    const vatTaxShare = totalVat / totalTax * 100;
    const avgBuybackDividendSpending = average(rows.map((row) => safeNumber(row.buybackDividendSpending, 0)));
    const avgDebtRepaymentAllocation = average(rows.map((row) => safeNumber(row.debtRepaymentAllocation, 0)));
    const avgRetainedEarningsAllocation = average(rows.map((row) => safeNumber(row.retainedEarningsAllocation, 0)));
    const avgInvestmentConversionRate = average(rows.map((row) => safeNumber(row.investmentConversionRate, 0)));
    const avgBuybackPayoutRatio = average(rows.map((row) => safeNumber(row.buybackPayoutRatio, 0)));
    const lowIncomeTaxPainMonths = rows.filter((row) => safeNumber(row.consumptionTaxPain, 0) > 0.58 && safeNumber(row.lowIncomeStress, 0) > 0.48).length;
    const corporateTaxDragMonths = rows.filter((row) => safeNumber(row.corporateTaxPressure, 0) > 0.62 && safeNumber(row.investmentConversionRate, 0) < 0.24).length;
    const buybackPriorityMonths = rows.filter((row) => safeNumber(row.buybackPayoutRatio, 0) > 0.34 && safeNumber(row.investmentConversionRate, 0) < 0.24).length;
    const mostStressedSector = mostFrequent(rows.map((row) => row.mostStressedSector || "없음"));
    const avgConstructionStress = average(rows.map((row) => safeNumber(row.constructionStress, 0)));
    const avgManufacturingStress = average(rows.map((row) => safeNumber(row.manufacturingStress, 0)));
    const avgTechnologyStress = average(rows.map((row) => safeNumber(row.technologyStress, 0)));
    const avgAgricultureStress = average(rows.map((row) => safeNumber(row.agricultureStress, 0)));
    const avgEnergyStress = average(rows.map((row) => safeNumber(row.energyStress, 0)));
    const avgMarketFailureRisk = average(rows.map((row) => safeNumber(row.marketFailureRisk, 0.22)));
    const avgMarketSuccessScore = average(rows.map((row) => safeNumber(row.marketSuccessScore, 0.50)));
    const mostFrequentFailureType = mostFrequent(rows.map((row) => row.marketFailureType || "없음"));
    const mostFrequentSuccessType = mostFrequent(rows.map((row) => row.marketSuccessType || "형성 중"));
    const avgForeignInvestorSentiment = average(rows.map((row) => safeNumber(row.foreignInvestorSentiment, 0.72)));
    const avgForeignBondDemand = average(rows.map((row) => safeNumber(row.foreignBondDemand, 0.74)));
    const avgExportConsumerDemand = average(rows.map((row) => safeNumber(row.exportConsumerDemand, row.exportDemand || 100)));
    const marketFailureWarningMonths = rows.filter((row) => safeNumber(row.marketFailureRisk, 0.22) > 0.58).length;
    const marketSuccessMonths = rows.filter((row) => safeNumber(row.marketSuccessScore, 0.50) > 0.68).length;
    const avgHistoricalScenarioIntensity = average(rows.map((row) => safeNumber(row.historicalScenarioIntensity, 0)));
    const historicalActiveMonths = rows.filter((row) => safeNumber(row.historicalScenarioActive, 0) > 0 || safeNumber(row.historicalScenarioIntensity, 0) > 0.25).length;
    const historicalScenarioKey = mostFrequent(rows.map((row) => row.historicalScenarioKey || ""));
    const historicalScenarioLabel = mostFrequent(rows.map((row) => row.historicalScenarioLabel || "비활성"));
    const historicalScenarioPhase = mostFrequent(rows.map((row) => row.historicalScenarioPhase || "비활성"));
    const modelWarnings = getModelHealthWarnings(rows);

    let judgement = "겉보기 안정";
    if (avgUnemployment >= 12 || peakUnemployment >= 25 || avgOutputGap < -8) judgement = "수요 부족형 침체";
    if (historicalScenarioKey && avgHistoricalScenarioIntensity > 0.25) judgement = historicalScenarioJudgement(historicalScenarioKey);
    if (avgHouseholdDebtBurden > 20) judgement = "가계 부채 부담형 둔화";
    if (avgFirmDSCR < 1.2) judgement = "기업 부채 부담형 둔화";
    if (avgFiscalSpace < 0.25 || avgDebtToGdp > 160) judgement = "재정 여력 제한";
    if (Math.max(safeNumber(state.policy?.taxEffective, 0), safeNumber(state.policy?.corporateTaxEffective, 0)) > 0.30 && avgOutputGap < -2) judgement = "세금 부담형 둔화";
    if (avgUnemployment < 3 && avgInflation < 0.8) judgement = "재고 과잉형 안정";
    if (avgInventoryDemandRatio > 2.7 && avgHiringFreezeRatio < 40) judgement = "재고 과잉형 안정";
    if (avgFirmStressRatio >= 45 || avgHiringFreezeRatio >= 40) judgement = "기업 금융 스트레스형 안정";
    if (avgInflation > 3.5 && avgOutputGap > 2) judgement = "과열 위험";
    if (avgInflation > 3.2 && avgOutputGap < -3) judgement = "스태그플레이션 위험";
    if (avgPolicyGap > 3 && avgOutputGap < -2) judgement = "정책 긴축 과다";
    if (avgPolicyGap < -2.5 && avgInflation > 2.8) judgement = "정책 완화 과다";
    if (avgRealPolicyRate > 3.2 && avgOutputGap < -1.5) judgement = "실질금리 부담";
    if (avgMortgageRate > 7.2 && (housingStressMonths > 12 || avgHousingAffordability > 1.55)) judgement = "주택담보 부담형 둔화";
    if (invertedCurveMonths > 12 && avgBusinessSentiment < 0.65) judgement = "장단기 금리차 역전 위험";
    if (highRateUncertaintyMonths > 12 || policySurpriseCount > 8) judgement = "정책 불확실성 상승";
    if (avgGovernmentFundingRate > 6.2 && avgDebtToGdp > 110) judgement = "재정 이자비용 부담";
    if (avgRealPolicyRate < -1.2 && peakBubbleRisk > 0.55) judgement = "저금리 과열";
    if (creditExcessMonths > 18 || (avgCreditExcessRisk > 0.52 && avgCreditGap > 0.18)) judgement = "신용 과다 누적";
    if (avgBondMarketStress > 0.52 || longRateShockMonths > 12 || avgLongBondPriceIndex < 84) judgement = "국채시장 스트레스";
    if (avgBondYield30Y > avgBondYield10Y + 1.4 && avgMortgageRate > 6.5) judgement = "장기금리 충격";
    if (avgDepositorConfidence < 0.58 || avgInterbankTrust < 0.58 || avgCreditOfficerCaution > 0.62) judgement = "은행 심리 위축";
    if (creditCrunchMonths > 12 || avgCreditCrunchRisk > 0.50) judgement = "신용경색 위험";
    if (avgFinancialConditionIndex > 24 || (avgStockReturn < -0.2 && avgHousingReturn < -0.08)) judgement = "금융여건 긴축";
    if (avgBondYield > state.metrics.interestRatePercent + 3.0 && avgDebtToGdp > 100) judgement = "재정금리 부담";
    if (avgCreditSupply < 72 || avgCreditSpread > 5.5) judgement = "신용위축형 침체";
    if (avgBankHealth < 70 || peakBankStress > 0.62 || bankingCrisisMonths > 8) judgement = "은행 스트레스 위험";
    if (avgSafeHavenDemand > 55) judgement = "안전자산 선호 급등";
    if (avgSafeHavenDemand > 48 && safeNumber(average(rows.map((row) => safeNumber(row.flightToQualityDemand, 0))), 0) > 0.38) judgement = "안전자산 선호형 긴축";
    if (avgConsumerSentiment < 0.48 || weakConsumerSentimentMonths > 18) judgement = "소비심리 위축";
    if (avgBusinessSentiment < 0.48 || weakBusinessSentimentMonths > 18) judgement = "기업심리 위축";
    if (avgRecessionFear > 0.55 || highRecessionFearMonths > 18) judgement = "심리 위축형 둔화";
    if (avgMarketRiskSentiment < 0.45 || avgBankRiskAppetite < 0.45) judgement = "위험회피 심화";
    if (avgFearGreedIndex < 25 || extremeFearMonths > 12) judgement = "공포심리 주도 둔화";
    if (avgFearGreedIndex > 76 || extremeGreedMonths > 12) judgement = "탐욕 과열";
    if (avgRealEstateBelief > 0.68 && highHousingMispricingMonths > 12) judgement = "부동산 불패 과열";
    if (avgStockBelief > 0.68 && highStockMispricingMonths > 12) judgement = "주식 불패 과열";
    if (avgBehaviorMispricing > 0.65 || highHousingMispricingMonths + highStockMispricingMonths > 24) judgement = "가치-가격 괴리 위험";
    if (avgHerdIntensity > 0.62 || avgFomoIntensity > 0.65) judgement = "군중심리형 과열";
    if (avgConfirmationBias > 0.62 && avgInformationUncertainty > 0.42) judgement = "정보 격차형 버블";
    if (beliefBreakdownMonths > 8) judgement = "믿음 붕괴 위험";
    if (avgInformationUncertainty > 0.50 || avgMisperceptionIndex > 0.45 || marketOverreactionMonths > 12) judgement = "정보 격차형 불안";
    if (avgRumorIntensity > 0.28 && avgCreditSupply < 82) judgement = "루머 주도 신용위축";
    if (avgSentimentInflationExpectations > TARGET_INFLATION + 1.4) judgement = "기대인플레이션 불안";
    if (avgFiscalCredibilitySentiment < 0.45) judgement = "재정 신뢰도 약화";
    if (avgLowIncomeConsumptionCapacity < 0.72 && avgWealthInequality > 0.50) judgement = "계층별 소비 양극화";
    if (lowIncomeStressMonths > 12 || avgLowIncomeConsumptionCapacity < 0.68) judgement = "저소득층 물가 부담";
    if (middleMortgageStressMonths > 12 || avgMiddleClassHousingBurden > 16) judgement = "중산층 주거비 부담";
    if (avgWealthyAssetEffect > 1.2 && avgWealthInequality > 0.52 && wealthInequalityRisingMonths > 12) judgement = "자산효과 편중";
    if (avgClassSentimentGap > 0.34 && avgSocialStressIndex > 0.50) judgement = "계층별 소비 양극화";
    if (avgHiddenVulnerability > 0.58 || hiddenVulnerabilityMonths > 18) judgement = "숨은 취약성 누적";
    if (avgBankVulnerability > 0.58 && avgCreditSupply < 84) judgement = "은행 스트레스 위험";
    if (avgHousingVulnerability > 0.58) judgement = "주거비 부담형 둔화";
    if (avgExternalVulnerability > 0.58 && avgInflation > 2.5) judgement = "수입물가 충격";
    if (avgMiddleClassHousingBurden > 14 || avgHousingAffordability > 1.65) judgement = "주거비 부담형 둔화";
    if (avgImportPriceInflation > 12 && avgInflation > 2.8) judgement = "수입물가 충격";
    if (avgCommodityPressure > 1.7 && avgInflation > 2.5) judgement = "원자재 비용 충격";
    if (avgCentralBankCredibility < 0.45 || deAnchoredInflationMonths > 18) judgement = "중앙은행 신뢰도 약화";
    if (avgZombieFirmRatio > 18) judgement = "좀비기업 누적";
    if (Math.max(avgConstructionStress, avgManufacturingStress, avgTechnologyStress) > 0.58) judgement = "산업별 불균형";
    if (avgSocialStressIndex > 0.62) judgement = "사회적 압력 상승";
    if (lowIncomeTaxPainMonths > 12 || (avgVatBurden > 0.58 && avgLowIncomeConsumptionCapacity < 0.82)) judgement = "부가세 부담형 소비둔화";
    if (corporateTaxDragMonths > 12 || (avgCorporateTaxPressure > 0.62 && avgInvestmentConversionRate < 0.24)) judgement = "법인세 부담형 투자둔화";
    if (buybackPriorityMonths > 12 || (avgBuybackPayoutRatio > 0.34 && avgInvestmentConversionRate < 0.24)) judgement = "자사주 우선 배분";
    if (avgTaxSentimentScore > 0.62 && avgClassSentimentGap > 0.30) judgement = "세금 체감 격차 확대";
    if (avgMarketFailureRisk > 0.58 || marketFailureWarningMonths > 18) judgement = "시장 실패 위험";
    if (mostFrequentFailureType === "정보 비대칭" && avgMarketFailureRisk > 0.42) judgement = "정보 비대칭형 불안";
    if (mostFrequentFailureType === "신용 배분 실패" && avgMarketFailureRisk > 0.42) judgement = "신용 배분 실패";
    if (mostFrequentFailureType === "외부비용 충격" && avgInflation > 2.5) judgement = "외부비용 충격";
    if (avgForeignInvestorSentiment < 0.45 || avgForeignBondDemand < 0.45) judgement = "해외자본 유출 압력";
    if (avgAgricultureStress > 0.58) judgement = "농업 공급 충격";
    if (avgEnergyStress > 0.58) judgement = "에너지 비용 충격";
    if (avgMarketSuccessScore > 0.70 && marketSuccessMonths > 18 && avgMarketFailureRisk < 0.38) judgement = mostFrequentSuccessType === "생산성 개선" ? "생산성 기반 성장" : "시장 기능 개선";
    if (avgHousingAffordability > 1.65 || housingStressMonths > 18) judgement = "부동산 부담형 둔화";
    if (avgCommercialVacancy > 18 || avgCommercialReturn < -0.35) judgement = "상업용 부동산 스트레스";
    if (avgCollateralValueIndex < 90 && avgCreditSupply < 82) judgement = "담보가치 하락형 신용위축";
    if (stockPanicMonths > 12 || avgFearGreedIndex < 25) judgement = "주식시장 공포형 둔화";
    if (averageFirmStockVolatility > 10 || stockCorrectionMonths > 18) judgement = "기업 주가 조정 위험";
    if (highOpacityMonths > 18 || avgInformationUncertainty > 0.50) judgement = "정보 격차형 불안";
    if (avgValuationPressure > 0.58 || highValuationMonths > 18) judgement = "밸류에이션 부담";
    if (stockDrawdown > 35 && avgBankHealth < 75) judgement = "주식시장 조정 위험";
    if (peakBubbleRisk > 0.70 || highBubbleMonths > 18 || ((finalStockIndex > 200 || finalHousingIndex > 200) && average(gdpSeries) < 350)) judgement = "자산시장 과열";
    if (finalStockIndexPoints > 5000 && avgValuationPressure > 0.45 && average(gdpSeries) < 450) judgement = "주식시장 과열";
    if (!historicalScenarioKey && avgUnemployment >= 4 && avgUnemployment <= 8 && avgInflation >= 1 && avgInflation <= 3 && avgOutputGap >= -3 && avgOutputGap <= 3 && avgCapacityUtilization >= 70 && avgCapacityUtilization <= 90 && avgFirmStressRatio < 40 && avgHiringFreezeRatio < 25 && avgInventoryDemandRatio < 2.6 && avgHousingAffordability < 1.55 && peakBubbleRisk < 0.60 && avgValuationPressure < 0.50 && stockDrawdown < 25 && avgFinancialConditionIndex < 24 && avgBankHealth > 75 && avgCreditSupply > 78 && avgCreditSpread < 5.5 && avgCreditCrunchRisk < 0.42 && avgCreditExcessRisk < 0.48 && creditCrunchMonths < 8 && creditExcessMonths < 10 && avgBondMarketStress < 0.42 && longRateShockMonths < 8 && avgDepositorConfidence > 0.62 && avgInterbankTrust > 0.62 && avgCreditOfficerCaution < 0.58 && avgConsumerSentiment > 0.52 && avgBusinessSentiment > 0.52 && avgFiscalCredibilitySentiment > 0.50 && avgRecessionFear < 0.52 && avgFearGreedIndex > 28 && avgFearGreedIndex < 74 && avgInformationUncertainty < 0.45 && avgMisperceptionIndex < 0.38 && avgPolicyClarity > 0.50 && avgHiddenVulnerability < 0.45 && avgVatBurden < 0.55 && avgTaxSentimentScore < 0.58 && avgInvestmentConversionRate > 0.22 && avgBuybackPayoutRatio < 0.38 && avgMarketFailureRisk < 0.42 && avgForeignInvestorSentiment > 0.50 && avgForeignBondDemand > 0.50 && avgAgricultureStress < 0.50 && avgEnergyStress < 0.50) judgement = "정상 성장";
    if (historicalScenarioKey && avgHistoricalScenarioIntensity > 0.25) judgement = historicalScenarioJudgement(historicalScenarioKey);
    if (peakUnemployment >= 45 || monthsOver40 > 12) judgement = "붕괴 위험";

    const causes = [];
    if (judgement !== "정상 성장") {
      if (avgHiringFreezeRatio > 40) causes.push("채용 동결 비율 높음");
      if (avgFirmStressRatio > 35) causes.push("기업 금융 스트레스 높음");
      if (avgInventoryDemandRatio > 2.7) causes.push("재고/수요 비율 과다");
      if (avgConsumption < average(gdpSeries) * 0.35) causes.push("민간 수요 약함");
      if (avgOutputGap < -5) causes.push("음의 산출갭");
      if (avgInflationGap < -1) causes.push("목표 이하 물가");
      if (avgDebtToGdp > 160) causes.push("정부 부채/GDP 높음");
      if (avgHouseholdDebtBurden > 18) causes.push("가계 부채상환 부담 높음");
      if (avgFirmDSCR < 1.2) causes.push("기업 DSCR 취약");
      if (avgFiscalSpace < 0.25) causes.push("재정 여력 제한");
      if (avgHousingAffordability > 1.65) causes.push("주택구입부담 높음");
      if (avgCommercialVacancy > 18) causes.push("상업용 공실률 높음");
      if (avgCollateralValueIndex < 90) causes.push("담보가치 하락");
      if (peakNegativeEquityRatio > 8) causes.push("음의 자산 가계 증가");
      if (highOpacityMonths > 12) causes.push("기업 정보 불투명성 높음");
      if (stockPanicMonths > 12) causes.push("주식시장 공포 확산");
      if (peakBubbleRisk > 0.65) causes.push("자산 버블 위험 높음");
      if (avgValuationPressure > 0.55) causes.push("주식 밸류에이션 부담");
      if (stockDrawdown > 25) causes.push("주가지수 조정폭 큼");
      if (avgFinancialConditionIndex > 24) causes.push("금융여건 긴축");
      if (avgCreditSpread > 5.5) causes.push("신용스프레드 확대");
      if (avgCreditSupply < 72) causes.push("신용공급 위축");
      if (avgBankHealth < 70) causes.push("은행건전성 약화");
      if (avgRealPolicyRate > 3) causes.push("실질금리 부담");
      if (avgMortgageRate > 7) causes.push("주택담보금리 부담");
      if (invertedCurveMonths > 12) causes.push("장단기 금리차 역전");
      if (highRateUncertaintyMonths > 12) causes.push("금리 경로 불확실성");
      if (policySurpriseCount > 8) causes.push("예상 밖 금리 변화");
      if (avgGovernmentFundingRate > 6) causes.push("정부 평균 조달금리 상승");
      if (avgBondYield > state.metrics.interestRatePercent + 3.0) causes.push("국채금리 부담");
      if (avgBondYield30Y > avgBondYield10Y + 1.2) causes.push("장기금리 압력");
      if (avgLongBondPriceIndex < 86) causes.push("장기채 가격 하락");
      if (avgBondMarketStress > 0.50) causes.push("국채시장 스트레스");
      if (avgMarketFailureRisk > 0.50) causes.push(`시장 실패 위험(${mostFrequentFailureType})`);
      if (historicalScenarioKey) causes.push(`역사 시나리오 충격(${historicalScenarioKeyRisk(historicalScenarioKey)})`);
      if (avgForeignInvestorSentiment < 0.50) causes.push("해외 투자심리 약화");
      if (avgForeignBondDemand < 0.50) causes.push("해외 채권수요 약화");
      if (avgAgricultureStress > 0.55) causes.push("농업 공급 스트레스");
      if (avgEnergyStress > 0.55) causes.push("에너지 비용 스트레스");
      if (avgDepositorConfidence < 0.62) causes.push("예금자 신뢰 약화");
      if (avgInterbankTrust < 0.62) causes.push("은행 간 신뢰 약화");
      if (avgCreditOfficerCaution > 0.58) causes.push("여신심사 보수화");
      if (avgCreditCrunchRisk > 0.48 || creditCrunchMonths > 8) causes.push("신용경색 위험 누적");
      if (avgCreditExcessRisk > 0.50 || creditExcessMonths > 12) causes.push("신용 과다 누적");
      if (avgUnderwritingQuality < 0.58) causes.push("인수심사 품질 약화");
      if (avgSafeHavenDemand > 55) causes.push("안전자산 선호 높음");
      if (avgConsumerSentiment < 0.48) causes.push("소비심리 위축");
      if (avgBusinessSentiment < 0.48) causes.push("기업심리 위축");
      if (avgRecessionFear > 0.55) causes.push("경기침체 우려 높음");
      if (avgFearGreedIndex < 30) causes.push("주식 공포심리 높음");
      if (avgFearGreedIndex > 75) causes.push("탐욕 심리 과열");
      if (avgInformationUncertainty > 0.45) causes.push("정보 불확실성 높음");
      if (avgRumorIntensity > 0.25) causes.push("루머 강도 높음");
      if (avgMisperceptionIndex > 0.40) causes.push("오인식 지수 높음");
      if (avgPolicyClarity < 0.50) causes.push("정책 명확성 낮음");
      if (avgRealEstateBelief > 0.68) causes.push("부동산 불패 믿음 강함");
      if (avgStockBelief > 0.68) causes.push("주식 불패 믿음 강함");
      if (avgHerdIntensity > 0.62) causes.push("군중심리 과열");
      if (avgFomoIntensity > 0.62) causes.push("FOMO 높음");
      if (avgBehaviorMispricing > 0.60) causes.push("가치-가격 괴리");
      if (beliefBreakdownMonths > 8) causes.push("믿음 붕괴 위험");
      if (avgFiscalCredibilitySentiment < 0.45) causes.push("재정 신뢰도 약화");
      if (avgSentimentInflationExpectations > TARGET_INFLATION + 1.4) causes.push("기대인플레이션 불안");
      if (avgLowIncomeConsumptionCapacity < 0.75) causes.push("저소득층 소비여력 약화");
      if (avgMiddleClassHousingBurden > 14) causes.push("중산층 주거부담 높음");
      if (lowIncomeStressMonths > 12) causes.push("저소득층 스트레스 지속");
      if (middleMortgageStressMonths > 12) causes.push("중산층 주담대 스트레스 지속");
      if (avgClassSentimentGap > 0.34) causes.push("계층별 심리 격차 확대");
      if (avgHiddenVulnerability > 0.55) causes.push("숨은 취약성 누적");
      if (avgHouseholdVulnerability > 0.55) causes.push("가계 취약성 높음");
      if (avgFirmVulnerability > 0.55) causes.push("기업 취약성 높음");
      if (avgBankVulnerability > 0.55) causes.push("은행 취약성 높음");
      if (avgHousingVulnerability > 0.55) causes.push("주택 취약성 높음");
      if (avgExternalVulnerability > 0.55) causes.push("대외 취약성 높음");
      if (wealthInequalityRisingMonths > 12) causes.push("자산불평등 상승 지속");
      if (avgWealthInequality > 0.55) causes.push("자산불평등 확대");
      if (avgImportPriceInflation > 10) causes.push("수입물가 상승");
      if (avgCommodityPressure > 1.5) causes.push("원자재·에너지 비용 압력");
      if (avgCentralBankCredibility < 0.50) causes.push("중앙은행 신뢰도 약화");
      if (avgZombieFirmRatio > 12) causes.push("좀비기업 비중 높음");
      if (avgDistressedFirmRatio > 18) causes.push("취약기업 비율 높음");
      if (avgSocialStressIndex > 0.55) causes.push("사회적 압력 상승");
      if (avgVatBurden > 0.55) causes.push("부가세 체감 부담 높음");
      if (avgCorporateTaxPressure > 0.60) causes.push("법인세 부담 높음");
      if (avgInvestmentConversionRate < 0.24) causes.push("세후현금 투자 전환율 낮음");
      if (avgBuybackPayoutRatio > 0.34) causes.push("자사주·배당 우선 배분");
      if (avgTaxSentimentScore > 0.62) causes.push("세금 체감 심리 악화");
    }
    const policyStance = avgPolicyGap > 2 ? "긴축 우위" : avgPolicyGap < -2 ? "완화 우위" : "중립 근처";
    const interpretation = judgement === "재고 과잉형 안정"
      ? "실업률은 낮지만 재고/수요 비율이 높아 기업 수익성이 압박받을 수 있습니다."
      : judgement === "기업 금융 스트레스형 안정"
        ? "거시지표는 안정적으로 보이나 기업 부채와 채용 제약이 회복력을 낮춥니다."
        : judgement === "재정 여력 제한"
          ? "정부 부채와 이자비용이 재정정책의 여지를 좁히고 있습니다."
        : judgement === "가계 부채 부담형 둔화"
          ? "가계 부채상환 부담이 소비 회복 속도를 낮추고 있습니다."
        : judgement === "기업 부채 부담형 둔화"
          ? "기업 현금흐름 대비 부채상환 부담이 투자와 고용을 제약합니다."
        : judgement === "세금 부담형 둔화"
          ? "세수는 늘지만 가처분소득과 순이익 감소가 민간 수요를 약화시킵니다."
        : judgement === "부동산 부담형 둔화"
          ? "부동산 가격과 금리 부담이 가계의 주거비 부담을 높이고 소비 여력을 낮춥니다."
        : judgement === "상업용 부동산 스트레스"
          ? "상업용 공실률과 가격 조정이 기업 담보가치와 은행 건전성을 압박하고 있습니다."
        : judgement === "담보가치 하락형 신용위축"
          ? "부동산 담보가치 하락이 은행 위험선호를 낮추고 신용공급을 위축시키고 있습니다."
        : judgement === "주식시장 공포형 둔화"
          ? "기업 주가와 광역 주가지수의 조정이 투자심리와 자금조달 여건을 약화시키고 있습니다."
        : judgement === "기업 주가 조정 위험"
          ? "개별 기업 주가 변동성이 높아져 투자와 고용 계획이 더 조심스러워질 수 있습니다."
        : judgement === "자산시장 과열"
          ? "자산가격이 실물 성장보다 빠르게 올라 금융취약성과 조정 위험이 커지고 있습니다."
        : judgement === "주식시장 과열"
          ? "주가지수가 기업 이익과 GDP보다 빠르게 상승해 향후 조정 위험이 커지고 있습니다."
        : judgement === "주식시장 조정 위험"
          ? "주가지수 하락폭이 커지고 은행 건전성도 약해져 위험회피가 확산될 수 있습니다."
        : judgement === "밸류에이션 부담"
          ? "주가가 기업 이익보다 빠르게 올라 밸류에이션 부담이 누적되고 있습니다."
        : judgement === "금융여건 긴축"
          ? "금리, 부채, 자산가격 조정이 결합되어 소비와 투자의 금융여건을 조이고 있습니다."
        : judgement === "실질금리 부담"
          ? "기대물가를 감안한 실질금리가 높아 기업 투자와 주택수요가 둔화되고 있습니다."
        : judgement === "주택담보 부담형 둔화"
          ? "10년 금리와 주택담보금리 상승이 중산층 주거부담과 주택수요를 압박합니다."
        : judgement === "장단기 금리차 역전 위험"
          ? "단기금리가 장기금리보다 높아 시장이 향후 경기 둔화를 반영하고 있습니다."
        : judgement === "정책 불확실성 상승"
          ? "예상보다 큰 금리 변화와 불명확한 경로가 변동성과 투자 지연을 키우고 있습니다."
        : judgement === "재정 이자비용 부담"
          ? "장기금리 상승이 정부 평균 조달금리와 이자비용을 높여 재정 여력을 제한합니다."
        : judgement === "저금리 과열"
          ? "낮은 실질금리가 자산가격과 차입 수요를 지지해 버블 위험을 키울 수 있습니다."
        : judgement === "신용경색 위험"
          ? "예금자 신뢰, 은행 간 신뢰, 여신심사가 함께 약해져 신용공급이 실물투자보다 먼저 위축되고 있습니다."
        : judgement === "신용 과다 누적"
          ? "대출태도가 느슨하고 위험이 과소평가되면서 단기 신용공급은 좋지만 부실과 버블 취약성이 누적되고 있습니다."
        : judgement === "국채시장 스트레스"
          ? "국채시장 유동성과 장기채 가격이 약해져 장기금리, 정부 조달비용, 주택담보금리에 압력이 생기고 있습니다."
        : judgement === "은행 심리 위축"
          ? "은행 건전성 수치보다 예금자 신뢰와 은행 간 신뢰가 먼저 약해져 대출태도가 보수화되고 있습니다."
        : judgement === "장기금리 충격"
          ? "30년물 중심의 장기금리 상승이 부동산, 성장기업 밸류에이션, 정부 이자비용을 동시에 압박합니다."
        : judgement === "안전자산 선호형 긴축"
          ? "안전자산 선호와 국채시장 변동성이 커지며 위험자산 심리와 신용공급이 함께 긴축되고 있습니다."
        : judgement === "은행 스트레스 위험"
          ? "은행 건전성 약화와 부실대출 부담이 신용공급을 위축시킬 수 있습니다."
        : judgement === "재정금리 부담"
          ? "국채금리 상승이 정부 이자비용을 높여 재정 여력을 제한하고 있습니다."
        : judgement === "안전자산 선호 급등"
          ? "위험회피가 높아져 금·은 등 안전자산 선호가 강해지고 위험투자 심리는 약합니다."
        : judgement === "신용위축형 침체"
          ? "신용스프레드와 대출태도 긴축이 기업 투자와 가계 차입을 제약합니다."
        : judgement === "소비심리 위축"
          ? "고용과 소득이 버텨도 부채·물가·자산손실 불안이 소비 회복을 늦춥니다."
        : judgement === "기업심리 위축"
          ? "기업의 매출 기대와 투자심리가 약해 생산 조절과 채용 지연이 나타날 수 있습니다."
        : judgement === "위험회피 심화"
          ? "은행과 시장의 위험선호가 낮아져 신용공급과 위험자산 심리가 동시에 약해졌습니다."
        : judgement === "공포심리 주도 둔화"
          ? "기초 지표보다 시장 공포와 변동성이 먼저 악화되어 투자와 소비심리를 누르고 있습니다."
        : judgement === "탐욕 과열"
          ? "낮은 금리와 강한 기대가 자산가격을 실물보다 빠르게 밀어 올릴 수 있습니다."
        : judgement === "부동산 불패 과열"
          ? "주거비 부담이 커졌지만 부동산 불패 믿음이 수요를 유지해 조정 취약성이 커지고 있습니다."
        : judgement === "주식 불패 과열"
          ? "기업 이익보다 주가지수가 빠르게 올라가지만 저가매수 믿음과 FOMO가 가격을 지지합니다."
        : judgement === "군중심리형 과열"
          ? "다수의 낙관적 행동이 가격과 수요를 동시에 밀어 올려 기초여건과의 괴리가 커질 수 있습니다."
        : judgement === "가치-가격 괴리 위험"
          ? "자산가격이 기초가치보다 높아 정상 지표 아래에서도 조정 위험이 누적됩니다."
        : judgement === "믿음 붕괴 위험"
          ? "손실회피와 패닉 압력이 커져 기존 불패 믿음이 빠르게 약해질 수 있습니다."
        : judgement === "정보 격차형 버블"
          ? "정보 불확실성과 확증편향이 위험 신호를 늦게 반영하게 만들어 버블이 오래 지속될 수 있습니다."
        : judgement === "정보 격차형 불안"
          ? "경제 주체의 인식과 실제 지표 사이의 차이가 커져 정책 전달과 시장 반응이 불안정합니다."
        : judgement === "루머 주도 신용위축"
          ? "루머와 불확실성이 실제 부실보다 먼저 신용스프레드와 대출태도를 긴축시키고 있습니다."
        : judgement === "기대인플레이션 불안"
          ? "기대물가가 목표보다 높아 임금·가격 결정에 상방 압력이 남아 있습니다."
        : judgement === "재정 신뢰도 약화"
          ? "부채와 금리 부담이 재정 신뢰를 낮춰 정책 효과를 약화시킬 수 있습니다."
        : judgement === "심리 위축형 둔화"
          ? "경기침체 우려가 소비와 투자 결정을 지연시키며 회복 속도를 낮춥니다."
        : judgement === "계층별 소비 양극화"
          ? "헤드라인 성장은 유지되어도 저소득층 소비여력과 자산불평등이 벌어져 수요 기반이 약해집니다."
        : judgement === "저소득층 물가 부담"
          ? "저소득층은 물가와 임대료 충격을 먼저 체감해 실질소비가 약해지고 있습니다."
        : judgement === "중산층 주거비 부담"
          ? "중산층은 주택담보금리와 주거비 부담에 민감해 내수 둔화 위험이 커지고 있습니다."
        : judgement === "자산효과 편중"
          ? "자산가격 상승의 심리 개선 효과가 자산가에 집중되어 계층별 체감경기 격차가 커지고 있습니다."
        : judgement === "주거비 부담형 둔화"
          ? "중산층 주택담보와 임대료 부담이 커져 소비가 금리 변화에 민감해지고 있습니다."
        : judgement === "수입물가 충격"
          ? "환율 약세와 수입물가 상승이 실질소득을 낮추고 비용발 물가 압력을 키웁니다."
        : judgement === "원자재 비용 충격"
          ? "원자재·에너지 가격 상승이 제조업 비용과 소비자 물가를 동시에 압박합니다."
        : judgement === "중앙은행 신뢰도 약화"
          ? "정책 신뢰도가 낮아 기대인플레이션이 목표에서 벗어나 물가 안정 비용이 커질 수 있습니다."
        : judgement === "좀비기업 누적"
          ? "취약기업이 낮은 금리와 신용완화로 생존하지만 투자와 생산성 회복은 약합니다."
        : judgement === "산업별 불균형"
          ? `${mostStressedSector} 스트레스가 높아 총량 지표보다 특정 산업의 조정 압력이 큽니다.`
        : judgement === "사회적 압력 상승"
          ? "주거비, 물가, 불평등, 소비심리 약화가 결합되어 정책 지원 요구가 커지고 있습니다."
        : judgement === "부가세 부담형 소비둔화"
          ? "부가세가 체감가격을 높여 저소득층 소비여력과 내수 회복력을 먼저 약화시키고 있습니다."
        : judgement === "법인세 부담형 투자둔화"
          ? "법인세 부담과 약한 세후이익이 투자 전환율을 낮춰 설비투자와 채용 회복을 제약합니다."
        : judgement === "자사주 우선 배분"
          ? "기업이 세후현금을 설비투자보다 자사주·배당·부채상환에 우선 배분해 주가 지지는 가능하지만 실물투자 효과는 제한적입니다."
        : judgement === "세금 체감 격차 확대"
          ? "부가세, 소득세, 법인세가 계층과 기업전략별로 다르게 작동해 체감경기 격차가 커지고 있습니다."
        : judgement === "시장 실패 위험"
          ? `시장 기능이 약해지는 주된 경로는 ${mostFrequentFailureType}이며, 자원배분과 신용·정보 경로가 실물경제를 왜곡하고 있습니다.`
        : judgement === "정보 비대칭형 불안"
          ? "정보 불확실성과 오인식이 커져 위험 신호가 늦게 반영되거나 과잉반응으로 번지고 있습니다."
        : judgement === "신용 배분 실패"
          ? "신용이 필요한 곳으로 안정적으로 흐르지 못하거나 위험을 과소평가해 부실 취약성이 누적되고 있습니다."
        : judgement === "외부비용 충격"
          ? "에너지·원자재·수입 비용이 가격에 충분히 반영되지 못하면서 물가와 마진 압력이 동시에 커지고 있습니다."
        : judgement === "해외자본 유출 압력"
          ? "해외 투자자와 채권자의 수요가 약해져 환율, 장기금리, 금융여건에 동시에 압력이 생기고 있습니다."
        : judgement === "농업 공급 충격"
          ? "농업 공급과 식품가격 압력이 저소득층 체감물가를 먼저 악화시키며 소비여력을 낮추고 있습니다."
        : judgement === "에너지 비용 충격"
          ? "에너지 가격 상승이 생산비와 수입물가를 높여 제조업 마진과 실질소비를 동시에 압박합니다."
        : judgement === "생산성 기반 성장"
          ? "투자 효율과 생산성이 개선되며 물가 안정 속 성장이 나타나는 비교적 건강한 확장 국면입니다."
        : judgement === "시장 기능 개선"
          ? `시장 성공 유형은 ${mostFrequentSuccessType}이며, 신용·투자·소비 경로가 비교적 넓게 작동하고 있습니다.`
        : judgement === "외환위기형 긴축"
          ? "해외 신뢰 약화와 환율 충격이 고금리·신용경색으로 전이되어 기업과 은행의 조정 압력이 커지는 역사 시나리오입니다."
        : judgement === "주택담보 신용위기"
          ? "주택가격과 담보가치 하락이 은행 신뢰와 신용공급을 약화시키며 투자 둔화가 고용보다 먼저 나타나는 역사 시나리오입니다."
        : judgement === "자산버블 붕괴 위험"
          ? "낮은 금리와 낙관적 자산 믿음이 신용 과다와 가격 괴리를 누적시켜 향후 조정 취약성이 커지는 역사 시나리오입니다."
        : judgement === "재정이전형 성장"
          ? "대규모 이전지출과 건설 수요가 단기 성장을 지지하지만 재정 부담과 생산성 격차를 함께 남기는 역사 시나리오입니다."
        : judgement === "고물가·환율 불안"
          ? "환율 약세와 수입물가 상승이 기대인플레이션과 고금리 부담으로 이어져 실질소비를 압박하는 역사 시나리오입니다."
        : judgement === "수요 부족형 침체"
          ? "산출갭과 실업갭이 약한 수요를 가리키며 정책 완충이 필요할 수 있습니다."
          : judgement === "과열 위험"
            ? "양의 산출갭과 물가 압력이 동시에 나타나 긴축 압력이 커질 수 있습니다."
            : judgement === "정상 성장"
              ? "실업, 물가, 기업 스트레스가 기준 범위 안에서 움직입니다."
              : "핵심 거시지표는 급격히 붕괴하지 않지만 내부 불균형을 계속 점검해야 합니다.";

    els.balanceTestResult.classList.add("visible");
    els.balanceTestResult.innerHTML = `
      <strong>판정: ${judgement}</strong>${causes.length ? `<br>주요 요인: ${causes.join(" · ")}` : ""}<br>
      해석: ${interpretation}<br>
      ${modelWarnings.length ? `보정 경고: ${modelWarnings.join(" · ")}<br>` : ""}
      핵심 지표: 최종 실업률 ${percent(final.unemploymentRate, 1)} / 평균 물가 ${signedPercent(avgInflation)} / 최종 GDP ${macroMoney(final.gdp)} / 금융여건 ${round(avgFinancialConditionIndex, 1)} / 신용공급 ${round(avgCreditSupply, 1).toFixed(1)} / 은행건전성 ${round(avgBankHealth, 1).toFixed(1)}<br>
      <details><summary>전체 결과 보기</summary><div style="margin-top:6px;">
      최종 실업률 ${percent(final.unemploymentRate, 1)} / 평균 ${percent(avgUnemployment, 1)} / 최고 ${percent(peakUnemployment, 1)}<br>
      평균 물가 ${signedPercent(avgInflation)} / 최고 물가 ${signedPercent(peakInflation)}<br>
      평균 산출갭 ${formatSigned(avgOutputGap, 1)}%p / 설비가동률 ${percent(avgCapacityUtilization, 1)} / 재고·수요 ${round(avgInventoryDemandRatio, 2).toFixed(2)}<br>
      평균 실업갭 ${formatSigned(avgUnemploymentGap, 1)}%p / 물가갭 ${formatSigned(avgInflationGap, 1)}%p / 실질임금증가 ${formatSigned(avgRealWageGrowth, 1)}%p<br>
      최종 GDP ${macroMoney(final.gdp)} / 최저 GDP ${macroMoney(lowestGdp)}<br>
      실업 20% 초과 ${monthsOver20}개월 / 40% 초과 ${monthsOver40}개월<br>
      금융여건지수 ${round(avgFinancialConditionIndex, 1)} / 소비심리 ${round(avgConsumerConfidence, 2)} / 기업전망 ${round(avgFirmConfidence, 2)}<br>
      심리평균: 소비 ${round(avgConsumerSentiment, 2)} / 기업 ${round(avgBusinessSentiment, 2)} / 은행 위험선호 ${round(avgBankRiskAppetite, 2)} / 시장심리 ${round(avgMarketRiskSentiment, 2)}<br>
      시장심리: 공포·탐욕 ${round(avgFearGreedIndex, 1)} / 공포지수 ${round(avgStockVolatilityIndex, 1)} / 극단 공포 ${extremeFearMonths}개월 / 극단 탐욕 ${extremeGreedMonths}개월<br>
      정보격차: 불확실성 ${percent(avgInformationUncertainty * 100, 0)} / 루머 ${percent(avgRumorIntensity * 100, 0)} / 오인식 ${percent(avgMisperceptionIndex * 100, 0)} / 정책명확성 ${percent(avgPolicyClarity * 100, 0)} / 기대오차 ${percent(avgExpectationError * 100, 0)}<br>
      행동경제: 부동산 불패 ${percent(avgRealEstateBelief * 100, 0)} / 주식 불패 ${percent(avgStockBelief * 100, 0)} / 군중심리 ${percent(avgHerdIntensity * 100, 0)} / FOMO ${percent(avgFomoIntensity * 100, 0)} / 확증편향 ${percent(avgConfirmationBias * 100, 0)}<br>
      괴리·믿음: 가치-가격 괴리 ${percent(avgBehaviorMispricing * 100, 0)} / 주택 괴리 ${highHousingMispricingMonths}개월 / 주식 괴리 ${highStockMispricingMonths}개월 / 믿음 붕괴 위험 ${beliefBreakdownMonths}개월<br>
      기대물가 ${signedPercent(avgSentimentInflationExpectations)} / 침체우려 ${percent(avgRecessionFear * 100, 0)} / 재정신뢰 ${percent(avgFiscalCredibilitySentiment * 100, 0)}<br>
      약한 소비심리 ${weakConsumerSentimentMonths}개월 / 약한 기업심리 ${weakBusinessSentimentMonths}개월 / 높은 침체우려 ${highRecessionFearMonths}개월<br>
      평균 기업 스트레스 ${percent(avgFirmStressRatio, 1)} / 평균 기업 DSCR ${round(avgFirmDSCR, 2).toFixed(2)} / 가계 부채부담 ${percent(avgHouseholdDebtBurden, 1)}<br>
      평균 정부 부채/GDP ${percent(avgDebtToGdp, 1)} / 최고 ${percent(peakDebtToGdp, 1)} / 재정 여력 ${percent(avgFiscalSpace * 100, 0)}<br>
      주가지수 ${formatIndexPoint(finalStockIndexPoints)} / 저점 ${formatIndexPoint(lowestStockIndexPoints)} / 고점 ${formatIndexPoint(highestStockIndexPoints)} / 월평균 ${formatStockReturn(avgStockReturn / 100)}<br>
      주식 최대낙폭 ${percent(stockDrawdown, 1)} / 기업주식 월평균 ${signedPercent(avgFirmStockReturn)} / 기업주식 변동성 ${percent(averageFirmStockVolatility, 1)} / 10% 이상 조정 ${stockCorrectionMonths}개월<br>
      주식 공포 ${stockPanicMonths}개월 / 밸류에이션 부담 ${highValuationMonths}개월 / 정보 불투명 ${highOpacityMonths}개월<br>
      주거용 부동산 ${round(finalHousingIndex, 1).toFixed(1)} / 평균 수익률 ${signedPercent(avgResidentialReturn)} / 상업용 수익률 ${signedPercent(avgCommercialReturn)} / 자산효과 ${signedPercent(avgWealthEffect)}<br>
      상업용 공실률 ${percent(avgCommercialVacancy, 1)} / 담보가치 ${round(avgCollateralValueIndex, 1).toFixed(1)} / 음의 자산 최고 ${percent(peakNegativeEquityRatio, 1)} / 부동산 스트레스 ${realEstateStressMonths}개월<br>
      버블위험 최고 ${percent(peakBubbleRisk * 100, 0)} / 주택부담 경고 ${housingStressMonths}개월 / 버블위험 경고 ${highBubbleMonths}개월<br>
      평균 국채금리 ${percent(avgBondYield, 2)} / 신용스프레드 ${round(avgCreditSpread, 2).toFixed(2)}%p / 은행건전성 ${round(avgBankHealth, 1).toFixed(1)}<br>
      금리 구조: 정책 ${percent(avgPolicyRate, 2)} / 대출 ${percent(avgLoanRate, 2)} / 주담대 ${percent(avgMortgageRate, 2)} / 예금 ${percent(avgDepositRate, 2)} / 실질정책 ${formatSigned(avgRealPolicyRate, 2)}%p<br>
      수익률곡선: 3개월 ${percent(avgTreasuryBill3M, 2)} / 5년 ${percent(avgBondYield5Y, 2)} / 10년 ${percent(avgBondYield10Y, 2)} / 30년 ${percent(avgBondYield30Y, 2)} / 장단기 금리차 ${formatSigned(avgTermSpread, 2)}%p<br>
      국채시장: 장기채 가격 ${round(avgLongBondPriceIndex, 1).toFixed(1)} / 스트레스 ${percent(avgBondMarketStress * 100, 0)} / 장기금리 충격 ${longRateShockMonths}개월 / 역전 ${invertedCurveMonths}개월 / 금리 불확실성 ${highRateUncertaintyMonths}개월 / 정책 서프라이즈 ${policySurpriseCount}회<br>
      부채·재정 금리: 부채상환 부담 ${percent(avgDebtServiceBurdenRate, 1)} / 정부 평균 조달금리 ${percent(avgGovernmentFundingRate, 2)}<br>
      신용공급 ${round(avgCreditSupply, 1).toFixed(1)} / 대출수요 ${round(avgLoanDemandIndex, 1).toFixed(1)} / 은행스트레스 최고 ${percent(peakBankStress * 100, 0)} / 은행위기 경고 ${bankingCrisisMonths}개월<br>
      은행 심리: 예금자 신뢰 ${percent(avgDepositorConfidence * 100, 0)} / 은행 간 신뢰 ${percent(avgInterbankTrust * 100, 0)} / 여신심사 보수성 ${percent(avgCreditOfficerCaution * 100, 0)}<br>
      신용 사이클: 신용갭 ${formatSigned(avgCreditGap * 100, 1)}%p / 심사품질 ${percent(avgUnderwritingQuality * 100, 0)} / 신용경색 ${creditCrunchMonths}개월 / 신용과다 ${creditExcessMonths}개월<br>
      안전자산 선호 ${percent(avgSafeHavenDemand, 1)} / 금 ${round(finalGoldIndex, 1).toFixed(1)} / 은 ${round(finalSilverIndex, 1).toFixed(1)}<br>
      계층: 저소득 소비여력 ${round(avgLowIncomeConsumptionCapacity, 2).toFixed(2)} / 중산층 주거부담 ${percent(avgMiddleClassHousingBurden, 1)} / 고소득 자산효과 ${signedPercent(avgHighIncomeAssetEffect)} / 자산가 자산효과 ${signedPercent(avgWealthyAssetEffect)}<br>
      계층 스트레스: 심리격차 ${percent(avgClassSentimentGap * 100, 0)} / 저소득 스트레스 ${lowIncomeStressMonths}개월 / 중산층 주담대 스트레스 ${middleMortgageStressMonths}개월 / 자산불평등 상승 ${wealthInequalityRisingMonths}개월<br>
      세금 체감: 부가세 부담 ${percent(avgVatBurden * 100, 0)} / 가계 세부담 ${percent(avgHouseholdTaxPressure * 100, 0)} / 법인세 압박 ${percent(avgCorporateTaxPressure * 100, 0)} / 세금심리 ${percent(avgTaxSentimentScore * 100, 0)}<br>
      세수 구성: 소득세 ${percent(householdTaxShare, 1)} / 법인세 ${percent(corporateTaxShare, 1)} / 부가세 ${percent(vatTaxShare, 1)}<br>
      세후현금 배분: 자사주·배당 ${macroMoney(avgBuybackDividendSpending)} / 부채상환 ${macroMoney(avgDebtRepaymentAllocation)} / 유보·투자재원 ${macroMoney(avgRetainedEarningsAllocation)} / 투자전환율 ${percent(avgInvestmentConversionRate * 100, 1)} / 주주환원비율 ${percent(avgBuybackPayoutRatio * 100, 1)}<br>
      숨은 취약성: 종합 ${percent(avgHiddenVulnerability * 100, 0)} / 가계 ${percent(avgHouseholdVulnerability * 100, 0)} / 기업 ${percent(avgFirmVulnerability * 100, 0)} / 은행 ${percent(avgBankVulnerability * 100, 0)} / 주택 ${percent(avgHousingVulnerability * 100, 0)} / 취약 경고 ${hiddenVulnerabilityMonths}개월<br>
      자산불평등 ${round(avgWealthInequality, 2).toFixed(2)} / 사회적 압력 ${percent(avgSocialStressIndex * 100, 0)}<br>
      대외: 환율지수 ${round(avgExchangeRateIndex, 1).toFixed(1)} / 수입물가 상승 ${formatSigned(avgImportPriceInflation, 1)}%p / 원자재 압력 ${formatSigned(avgCommodityPressure, 1)}%p<br>
      외국 주체: 해외 투자심리 ${percent(avgForeignInvestorSentiment * 100, 0)} / 해외 채권수요 ${percent(avgForeignBondDemand * 100, 0)} / 수출수요 ${round(avgExportConsumerDemand, 1).toFixed(1)}<br>
      시장 평가: 실패위험 ${percent(avgMarketFailureRisk * 100, 0)} / 성공점수 ${percent(avgMarketSuccessScore * 100, 0)} / 실패유형 ${mostFrequentFailureType} / 성공유형 ${mostFrequentSuccessType} / 실패경고 ${marketFailureWarningMonths}개월 / 성공 ${marketSuccessMonths}개월<br>
      역사 시나리오: ${escapeHtml(historicalScenarioLabel)} / 대표 단계 ${escapeHtml(historicalScenarioPhase)} / 충격강도 ${percent(avgHistoricalScenarioIntensity * 100, 0)} / 진행·잔류 ${historicalActiveMonths}개월<br>
      산업 세분화: 농업 스트레스 ${percent(avgAgricultureStress * 100, 0)} / 에너지산업 스트레스 ${percent(avgEnergyStress * 100, 0)}<br>
      정책 신뢰: 중앙은행 ${percent(avgCentralBankCredibility * 100, 0)} / 기대이탈 ${deAnchoredInflationMonths}개월 / 최대 스트레스 산업 ${mostStressedSector}<br>
      기업 신용: 좀비기업 ${percent(avgZombieFirmRatio, 1)} / 취약기업 ${percent(avgDistressedFirmRatio, 1)} / 건설 스트레스 ${percent(avgConstructionStress * 100, 0)} / 제조 스트레스 ${percent(avgManufacturingStress * 100, 0)}<br>
      부채 스트레스 경고 ${debtStressWarningMonths}개월 / 정책 기조 ${policyStance}
      </div></details>
    `;
  }



  return {
    runBalanceQuickTest,
    runScenarioValidation,
    runPolicyComparison,
    getPolicyComparisonVariants,
    applyPolicyComparisonVariant,
    summarizePolicyComparisonResult,
    policyComparisonRecommendation,
    classifyPolicyComparisonSideEffect,
    renderPolicyComparisonResults,
    waitForUiTurn,
    captureSimulationSnapshot,
    captureUiSafeSnapshot,
    captureCoreStateSignature,
    compareCoreStateSignature,
    warnIfStateRestoreFailed,
    restoreSimulationSnapshot,
    restoreUiSafeSnapshot,
    prepareCalibrationScenario,
    summarizeScenarioValidation,
    judgeScenarioRows,
    scenarioKeyRisk,
    renderScenarioValidationResults,
    renderBalanceQuickTestResult,
    historicalScenarioJudgement,
    historicalScenarioKeyRisk
  };
}
