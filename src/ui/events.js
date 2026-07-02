import { flattenEventActions } from "../app/actionRegistry.js";

export function setupEvents({ els, safeOn, handlers, actions, documentRef = document, windowRef = window }) {
  handlers = handlers || flattenEventActions(actions);
  const {
    state,
    showToast,
    updateRunState,
    resetSimulation,
    safeStepSimulation,
    triggerRandomShock,
    safeUpdateAllDisplays,
    safeUpdateCharts,
    initializeGameMode,
    getGameModeConfig,
    syncLivePolicy,
    updateControlLabels,
    handlePolicyChange,
    applyScenario,
    startHistoricalScenarioTimeline,
    pushEvent,
    activateControlTab,
    handleControlPanelAction,
    safeRenderSimulation,
    handleCanvasClick,
    handleCanvasHover,
    hideCanvasTooltip,
    renderModelInputs,
    runSelectedEconomicModel,
    loadCurrentEconomyIntoModel,
    runBalanceQuickTest,
    runScenarioValidation,
    runPolicyComparison,
    saveDataApiKeys,
    clearDataApiKeys,
    runLiveDataLoadMode,
    runDataCalibrationMode,
    runBacktestMode,
    runMonteCarloMode,
    runLiquidityRadarMode,
    runDeveloperValidationMode,
    performanceNow = () => performance.now()
  } = handlers;

  safeOn(els.startBtn, "click", () => {
    if (state.game.activeEvent) {
      showToast("정책 선택 이벤트 대기 중", "선택지를 고른 뒤 시뮬레이션을 계속할 수 있습니다.");
      return;
    }
    if (state.game.status !== "active" && state.game.mode !== "sandbox") {
      showToast("분석 종료됨", "결과 화면에서 재시작하거나 기본 실험으로 돌아가세요.");
      return;
    }
    state.running = true;
    state.accumulator = 0;
    state.debug.lastSuccessfulTickTime = performanceNow();
    updateRunState();
  }, "startBtn");

  safeOn(els.pauseBtn, "click", () => {
    state.running = false;
    updateRunState();
  }, "pauseBtn");

  safeOn(els.resetBtn, "click", () => {
    state.running = false;
    resetSimulation();
  }, "resetBtn");

  safeOn(els.stepBtn, "click", () => {
    state.running = false;
    updateRunState();
    safeStepSimulation();
  }, "stepBtn");

  safeOn(els.shockBtn, "click", () => {
    triggerRandomShock();
    safeUpdateAllDisplays();
    safeUpdateCharts(true);
  }, "shockBtn");

  safeOn(els.startGameModeBtn, "click", () => {
    initializeGameMode(els.gameModeSelect.value);
  }, "startGameModeBtn");

  safeOn(els.gameModeSelect, "change", () => {
    els.modeStatusValue.textContent = getGameModeConfig(els.gameModeSelect.value).name;
  }, "gameModeSelect");

  [
    els.speedSlider, els.interestSlider, els.taxSlider, els.corporateTaxSlider, els.vatSlider,
    els.spendingSlider, els.wageSlider, els.inflationSlider
  ].forEach((input) => {
    safeOn(input, "input", () => {
      syncLivePolicy();
      updateControlLabels();
      handlePolicyChange(input);
    }, "policy slider");
  });

  [els.consumerSlider, els.producerSlider].forEach((input) => {
    safeOn(input, "input", updateControlLabels, "agent slider");
    safeOn(input, "change", () => {
      state.running = false;
      resetSimulation();
    }, "agent slider");
  });

  safeOn(els.applyScenarioBtn, "click", () => {
    applyScenario(els.scenarioSelect.value);
  }, "applyScenarioBtn");

  safeOn(els.historicalScenarioBtn, "click", () => {
    startHistoricalScenarioTimeline(els.scenarioSelect.value);
  }, "historicalScenarioBtn");

  safeOn(els.autoPolicyToggle, "change", () => {
    pushEvent(els.autoPolicyToggle.checked ? "자동 통화정책을 켰습니다." : "자동 통화정책을 껐습니다.");
  }, "autoPolicyToggle");

  safeOn(els.randomPolicyEventsToggle, "change", () => {
    pushEvent(els.randomPolicyEventsToggle.checked ? "정책 선택 이벤트를 켰습니다." : "정책 선택 이벤트를 껐습니다.");
  }, "randomPolicyEventsToggle");

  safeOn(els.performanceModeSelect, "change", () => {
    state.config.performanceMode = els.performanceModeSelect.value;
    showToast("성능 모드 변경", els.performanceModeSelect.value === "light" ? "가벼움 모드로 렌더링과 차트 갱신을 줄입니다." : "보통 모드로 실행합니다.");
  }, "performanceModeSelect");

  documentRef.querySelectorAll("[data-control-tab]").forEach((button) => {
    safeOn(button, "click", () => activateControlTab(button.dataset.controlTab), `control tab ${button.dataset.controlTab}`);
  });

  documentRef.querySelectorAll("[data-control-action]").forEach((button) => {
    safeOn(button, "click", () => handleControlPanelAction(button.dataset.controlAction), `control action ${button.dataset.controlAction}`);
  });

  documentRef.querySelectorAll(".more-charts, .model-lab").forEach((details) => {
    details.addEventListener("toggle", () => {
      if (details.open) {
        safeUpdateCharts(true);
        if (details.classList.contains("model-lab")) runSelectedEconomicModel();
      }
    });
  });

  [
    els.speedSlider, els.consumerSlider, els.producerSlider, els.interestSlider, els.taxSlider, els.corporateTaxSlider, els.vatSlider,
    els.spendingSlider, els.wageSlider, els.inflationSlider
  ].forEach((input) => {
    safeOn(input, "input", () => {
      input.classList.add("slider-active");
      windowRef.setTimeout(() => input.classList.remove("slider-active"), 520);
    }, "slider active indicator");
  });

  safeOn(windowRef, "resize", () => {
    if (state.ui) state.ui.canvasPositionCacheKey = "";
    safeRenderSimulation(performanceNow());
  }, "window resize");

  safeOn(els.simCanvas, "click", handleCanvasClick, "simCanvas");
  safeOn(els.simCanvas, "mousemove", handleCanvasHover, "simCanvas");
  safeOn(els.simCanvas, "mouseleave", () => {
    state.hovered = null;
    hideCanvasTooltip();
    safeRenderSimulation(performanceNow());
  }, "simCanvas");

  safeOn(els.endRestartBtn, "click", () => {
    els.endOverlay.classList.remove("visible");
    initializeGameMode(state.game.mode);
  }, "endRestartBtn");

  safeOn(els.endSandboxBtn, "click", () => {
    els.endOverlay.classList.remove("visible");
    els.gameModeSelect.value = "sandbox";
    initializeGameMode("sandbox");
  }, "endSandboxBtn");

  safeOn(els.modelSelector, "change", () => {
    renderModelInputs();
    runSelectedEconomicModel();
  }, "modelSelector");
  safeOn(els.useCurrentEconomyBtn, "click", () => {
    loadCurrentEconomyIntoModel();
  }, "useCurrentEconomyBtn");
  safeOn(els.runModelBtn, "click", () => {
    runSelectedEconomicModel();
  }, "runModelBtn");
  safeOn(els.balanceQuickTestBtn, "click", runBalanceQuickTest, "balanceQuickTestBtn");
  safeOn(els.scenarioValidationBtn, "click", runScenarioValidation, "scenarioValidationBtn");
  safeOn(els.policyComparisonBtn, "click", runPolicyComparison, "policyComparisonBtn");
  safeOn(els.saveApiKeyBtn, "click", saveDataApiKeys, "saveApiKeyBtn");
  safeOn(els.clearApiKeyBtn, "click", clearDataApiKeys, "clearApiKeyBtn");
  safeOn(els.loadLiveDataBtn, "click", runLiveDataLoadMode, "loadLiveDataBtn");
  safeOn(els.calibrationBtn, "click", runDataCalibrationMode, "calibrationBtn");
  safeOn(els.backtestBtn, "click", runBacktestMode, "backtestBtn");
  safeOn(els.monteCarloBtn, "click", runMonteCarloMode, "monteCarloBtn");
  safeOn(els.liquidityRadarBtn, "click", runLiquidityRadarMode, "liquidityRadarBtn");
  safeOn(els.developerValidationBtn, "click", runDeveloperValidationMode, "developerValidationBtn");

  renderModelInputs();
  runSelectedEconomicModel();
}
