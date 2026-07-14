import { evaluateDirectionalValidation, renderValidationReport } from "../core/validation.js";
import {
  BOND_PRICE_RETURN_LIMIT,
  CALIBRATION,
  FIRM_DEBT_SERVICE_SCALE,
  GOLD_RETURN_LIMIT,
  GOVERNMENT_DEBT_SERVICE_SCALE,
  HOUSEHOLD_DEBT_SERVICE_SCALE,
  HOUSING_RETURN_LIMIT,
  MAX_FLOWS,
  MAX_HISTORY,
  MAX_PRICE_CHANGE_PER_TICK,
  MAX_WAGE_CHANGE_PER_TICK,
  NEUTRAL_INTEREST_RATE,
  POLICY_META,
  SILVER_RETURN_LIMIT,
  STOCK_RETURN_LIMIT,
  TARGET_INFLATION,
  TARGET_UNEMPLOYMENT,
  TICKS_PER_MONTH
} from "../core/config.js";
import { defaultModelParameters } from "../core/modelParameters.js";
import {
  applyInertia,
  average,
  clamp,
  computeNonlinearStress,
  escapeHtml,
  lerp,
  quadraticPoint,
  rand,
  setRandomSource,
  round,
  roundedRect,
  safeNumber,
  safeValue,
  shuffle,
  smoothValue,
  sum,
  unique
} from "../core/mathUtils.js";
import {
  capacityLabel,
  accuracyLabel,
  behavioralLabel,
  classStatusLabel,
  compactMoney,
  creditRatingLabelFromScore,
  creditRatingScore,
  fearGreedLabel,
  formatIndexPoint,
  formatSigned,
  formatStockReturn,
  giniCoefficient,
  housingStatusLabel,
  intensityLabel,
  money,
  mostFrequent,
  percent,
  expectationMoodLabel,
  perceptionGapLabel,
  propertyExposureLabel,
  realEstateStressLabel,
  riskLabel,
  sectorLabel,
  sentimentLabel,
  signedPercent,
  stockRiskSentimentLabel,
  stockVolatilityIndexLabel,
  stockVolatilityLabel,
  translatePreference,
  valuationPressureLabel
} from "../core/formatUtils.js";
import { createInitialAppState } from "../core/stateFactory.js";
import { createSeededRandom } from "../core/seededRandom.js";
import {
  createInitialAssetMarket,
  createInitialBehavioralState,
  createInitialClassAnalysis,
  createInitialCreditCycle,
  createInitialExternalActors,
  createInitialExternalSector,
  createInitialFinancialMarket,
  createInitialHistoricalScenario,
  createInitialInformationSystem,
  createInitialMacroFinancialTransmission,
  createInitialModelReliability,
  createInitialPerceivedEconomy,
  createInitialPolicyCredibility,
  createInitialRateStructure,
  createInitialRealEstateMarket,
  createInitialScale,
  createInitialSentimentState,
  createInitialVulnerabilityState,
  householdClassOrder
} from "../core/domainStateFactory.js";
import {
  captureCoreStateSignature as captureCoreStateSignatureRuntime,
  captureSimulationSnapshot as captureSimulationSnapshotRuntime,
  compareCoreStateSignature as compareCoreStateSignatureRuntime,
  restoreSimulationSnapshot as restoreSimulationSnapshotRuntime
} from "../core/simulationRuntime.js";
import { resetSimulationState } from "../core/resetSimulation.js";
import {
  resetTickAccountingEngine,
  runSimulationStepEngine,
  safeStepSimulationEngine,
  stepSimulationEngine
} from "../core/simulationEngine.js";
import { createSimulationServices } from "../core/serviceRegistry.js";
import { createLegacyRuntime } from "../core/legacyRuntime.js";
import { calibrateParameters } from "../core/calibration.js";
import { runBacktest } from "../core/backtest.js";
import { runMonteCarloScenario } from "../core/monteCarlo.js";
import {
  createInitialCausalDecomposition,
  computeCausalPressureScores as computeCausalPressureScoresAnalysis,
  updateCausalDecomposition as updateCausalDecompositionAnalysis
} from "../analysis/causalDecomposition.js";
import { createDeveloperValidationRuntime } from "../analysis/developerValidation.js";
import { createExperimentRuntime } from "../analysis/experimentRuntime.js";
import {
  createInitialEarlyWarning,
  earlyWarningReasonLabel as earlyWarningReasonLabelAnalysis,
  updateEarlyWarningSystem as updateEarlyWarningSystemAnalysis
} from "../analysis/earlyWarning.js";
import {
  createInitialMarketOutcome,
  computeMarketOutcome as computeMarketOutcomeAnalysis
} from "../analysis/marketOutcome.js";
import { loadCalibrationDataset } from "../data/calibrationDataset.js";
import {
  recordLedgerFlowFromUiFlow,
  updateSfcAccountingLayer as updateSfcAccountingLayerAdapter
} from "../economy/accountingAdapter.js";
import {
  firmStrategyLabel,
  getSectorBehaviorMultiplier,
  getSectorProfile,
  weightedPick
} from "../economy/sectorProfiles.js";
import {
  calculateConsumption,
  calculateInflationPressure,
  calculateInvestment,
  calculateUnemploymentChange
} from "../economy/responseFunctions.js";
import { createAgentMacroRuntime } from "../agents/agentMacroRuntime.js";
import {
  fireConsumer as fireConsumerEngine,
  fireShareOfWorkers as fireShareOfWorkersEngine,
  hireConsumer as hireConsumerEngine,
  payWages as payWagesEngine,
  updateLaborMarket as updateLaborMarketEngine
} from "../economy/laborMarket.js";
import {
  adjustProducerPricesAndExpectations as adjustProducerPricesAndExpectationsEngine,
  computePriceChange as computePriceChangeEngine,
  produceGoods as produceGoodsEngine
} from "../economy/production.js";
import {
  chooseProducerForConsumer as chooseProducerForConsumerEngine,
  executeConsumerPurchases as executeConsumerPurchasesEngine
} from "../economy/consumption.js";
import {
  allocateAfterTaxCashFlow as allocateAfterTaxCashFlowEngine,
  collectProfitTaxes as collectProfitTaxesEngine,
  executeGovernmentSpending as executeGovernmentSpendingEngine,
  getDebtSpendingBrake as getDebtSpendingBrakeEngine
} from "../economy/government.js";
import {
  executeExternalTrade as executeExternalTradeEngine,
  syncExternalMetrics as syncExternalMetricsEngine,
  updateExternalSector as updateExternalSectorEngine
} from "../economy/externalTrade.js";
import {
  computeGDP as computeGDPEngine,
  updateMacroMetricsEngine
} from "../economy/macroMetrics.js";
import {
  computeBondMarket as computeBondMarketEngine,
  computeLoanAndDepositRates as computeLoanAndDepositRatesEngine,
  syncRateMetrics as syncRateMetricsEngine,
  updateInterestRateStructure as updateInterestRateStructureEngine
} from "../finance/interestRates.js";
import {
  computeBankingCrisisRisk as computeBankingCrisisRiskEngine,
  computeCreditSpread as computeCreditSpreadEngine,
  computeCreditSupply as computeCreditSupplyEngine,
  syncFinancialMarketMetrics as syncFinancialMarketMetricsEngine,
  updateBankingSector as updateBankingSectorEngine
} from "../finance/banking.js";
import {
  syncCreditCycleMetrics as syncCreditCycleMetricsEngine,
  triggerCreditCycleEvent as triggerCreditCycleEventEngine,
  updateCreditCycle as updateCreditCycleEngine
} from "../finance/creditCycle.js";
import {
  computeSafeAssetMarkets as computeSafeAssetMarketsEngine,
  computeSafeHavenDemand as computeSafeHavenDemandEngine
} from "../finance/safeAssets.js";
import { scenarioSelectGroups } from "../scenarios/presets.js";
import { hydrateScenarioSelect } from "../ui/controls.js";
import { cacheElements as cacheDomElements } from "../ui/domCache.js";
import { setupEvents as setupUiEvents } from "../ui/events.js";
import {
  clearCharts as clearChartsPanel,
  setupChartDatasetToggles as setupChartDatasetTogglesPanel,
  setupCharts as setupChartsPanel,
  updateCharts as updateChartsPanel
} from "../ui/charts.js";
import {
  handleCanvasClick as handleCanvasClickPanel,
  handleCanvasHover as handleCanvasHoverPanel,
  hideCanvasTooltip as hideCanvasTooltipPanel,
  renderSimulation as renderSimulationPanel,
  safeRenderSimulation as safeRenderSimulationPanel
} from "../ui/canvasRenderer.js";
import {
  clearDataApiKeys as clearDataApiKeysPanel,
  runLiveDataLoadMode as runLiveDataLoadModePanel,
  runBacktestMode as runBacktestModePanel,
  runDataCalibrationMode as runDataCalibrationModePanel,
  runMonteCarloMode as runMonteCarloModePanel,
  saveDataApiKeys as saveDataApiKeysPanel,
  updateModelReliabilityPanel as updateModelReliabilityPanelView
} from "../ui/dataLab.js";
import { runLiquidityRadarMode as runLiquidityRadarModePanel } from "../ui/liquidityRadar.js";
import { updateInspectorPanel } from "../ui/inspector.js";
import {
  runADASModel,
  runISLMModel,
  runKeynesianModel,
  runPhillipsModel,
  runSolowModel,
  runTaylorRuleModel
} from "../models/economicModels.js";
import { getModelDefinitions } from "../models/modelDefinitions.js";
import { createEventActions } from "./actionRegistry.js";
import { initializeAppShell } from "./appBootstrap.js";
import { createRuntimeRegistry } from "./runtimeRegistry.js";

"use strict";

export function createApp({ document: documentRef = globalThis.document, window: windowRef = globalThis.window, testMode = false } = {}) {
    const document = documentRef;
    const window = windowRef;
    const performance = window?.performance ?? globalThis.performance ?? { now: () => Date.now() };
    const requestAnimationFrame = window?.requestAnimationFrame?.bind(window) ?? globalThis.requestAnimationFrame?.bind(globalThis) ?? ((callback) => setTimeout(() => callback(performance.now()), 16));

    // ===== 설정과 전역 상태 =====
    const els = {};
    const state = createInitialAppState();

    // ===== 초기화 =====
    function init() {
      initializeAppShell({
        cacheElements,
        hydrateScenarioSelect,
        scenarioSelect: els.scenarioSelect,
        scenarioSelectGroups,
        setupCharts,
        enhanceControlPanel,
        enhanceDetailedMetricsPanel,
        enhanceInspectorHierarchy,
        setupEvents,
        updateControlLabels,
        resetSimulation,
        animationLoop,
        requestAnimationFrame
      });
      return api;
    }

    function cacheElements() {
      cacheDomElements(els, document);
    }

    function setupEvents() {
      setupUiEvents({
        els,
        safeOn,
        documentRef: document,
        windowRef: window,
        actions: createEventActions({
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
          performanceNow: () => performance.now()
        })
      });
    }

    function enhanceControlPanel() {
      const descriptions = {
        speedSlider: "화면과 차트가 갱신되는 체감 속도를 조절합니다.",
        interestSlider: "차입비용, 소비 예산, 기업 투자에 직접 영향을 줍니다.",
        taxSlider: "소득세는 가계의 가처분소득과 소비에 영향을 줍니다.",
        corporateTaxSlider: "법인세는 기업의 순이익, 투자 여력, 고용 계획에 영향을 줍니다.",
        vatSlider: "부가세는 소비자가 체감하는 가격과 저소득층 소비여력에 영향을 줍니다.",
        spendingSlider: "실업 지원과 공공 구매로 수요를 보강하지만 부채 부담이 생깁니다.",
        wageSlider: "가계소득과 기업 비용을 동시에 바꾸는 기준 임금입니다.",
        inflationSlider: "수요·비용 압력이 가격으로 전가되는 민감도입니다."
      };

      Object.entries(descriptions).forEach(([id, text]) => {
        const input = els[id];
        if (!input || input.dataset.hintAdded) return;
        const hint = document.createElement("p");
        hint.className = "hint";
        hint.textContent = text;
        input.insertAdjacentElement("afterend", hint);
        input.dataset.hintAdded = "true";
      });

      const panel = els.startBtn.closest(".controls");
      if (!panel || panel.dataset.collapsibleReady) return;
      panel.dataset.collapsibleReady = "true";

      const buttonGrid = els.startBtn.closest(".button-grid");
      const scenarioGroup = els.scenarioSelect.closest(".control-group");
      const title = panel.querySelector(":scope > .panel-title");
      const tabShell = document.createElement("div");
      tabShell.className = "control-tab-shell";
      const tabs = document.createElement("div");
      tabs.className = "control-tabs";
      tabs.setAttribute("role", "tablist");
      tabs.setAttribute("aria-label", "정책 패널 탭");
      const panels = document.createElement("div");
      panels.className = "control-tab-panels";

      const createDetails = (section) => {
        const details = document.createElement("details");
        details.className = "control-section";
        details.open = section.open;
        const summary = document.createElement("summary");
        summary.textContent = section.title;
        const body = document.createElement("div");
        body.className = "control-section-body";
        section.nodes.filter(Boolean).forEach((node) => body.appendChild(node));
        details.appendChild(summary);
        details.appendChild(body);
        return details;
      };

      const makeDataLabLauncher = () => {
        const launcher = document.createElement("div");
        launcher.className = "control-group datalab-launcher";
        launcher.innerHTML = `
          <strong>DataLab 바로가기</strong>
          <p class="hint">공식 데이터 불러오기, 데이터 보정, 백테스트, 몬테카를로, Liquidity Radar는 우측 전문가 패널에서 실행합니다.</p>
          <button type="button" class="btn secondary full" data-control-action="open-datalab">DataLab 열기</button>
          <button type="button" class="btn secondary full" data-control-action="open-liquidity">Liquidity Radar 열기</button>
        `;
        return launcher;
      };

      const tabConfigs = [
        {
          id: "base",
          label: "기본 정책",
          sections: [
            { title: "실행", open: true, nodes: [buttonGrid] },
            { title: "핵심 정책", open: true, nodes: [els.interestSlider.closest(".control-group"), els.spendingSlider.closest(".control-group"), els.taxSlider.closest(".control-group"), els.corporateTaxSlider.closest(".control-group"), els.vatSlider.closest(".control-group")] }
          ]
        },
        {
          id: "advanced",
          label: "고급 설정",
          sections: [
            { title: "실행 환경", open: true, nodes: [els.speedSlider.closest(".control-group"), els.performanceModeSelect.closest(".control-group"), els.shockBtn] },
            { title: "에이전트와 모형", open: false, nodes: [els.consumerSlider.closest(".control-group"), els.producerSlider.closest(".control-group"), els.wageSlider.closest(".control-group"), els.inflationSlider.closest(".control-group")] },
            { title: "자동화", open: false, nodes: [els.autoPolicyToggle?.closest(".toggle-row") || els.autoPolicyToggle, els.randomPolicyEventsToggle?.closest(".toggle-row") || els.randomPolicyEventsToggle, els.educationalStabilizersToggle?.closest(".toggle-row") || els.educationalStabilizersToggle] }
          ]
        },
        {
          id: "scenario",
          label: "시나리오",
          sections: [
            { title: "분석 모드", open: true, nodes: [els.gameModeSelect.closest(".control-group")] },
            { title: "프리셋과 역사 전개", open: true, nodes: [scenarioGroup] }
          ]
        },
        {
          id: "datalab",
          label: "DataLab",
          sections: [
            { title: "데이터 분석", open: true, nodes: [makeDataLabLauncher()] }
          ]
        }
      ];

      tabConfigs.forEach((tab, index) => {
        const tabButton = document.createElement("button");
        tabButton.type = "button";
        tabButton.className = `control-tab-button${index === 0 ? " active" : ""}`;
        tabButton.id = `control-tab-${tab.id}`;
        tabButton.dataset.controlTab = tab.id;
        tabButton.setAttribute("role", "tab");
        tabButton.setAttribute("aria-selected", index === 0 ? "true" : "false");
        tabButton.setAttribute("aria-controls", `control-panel-${tab.id}`);
        tabButton.textContent = tab.label;
        tabs.appendChild(tabButton);

        const tabPanel = document.createElement("div");
        tabPanel.className = "control-tab-panel";
        tabPanel.id = `control-panel-${tab.id}`;
        tabPanel.dataset.controlPanel = tab.id;
        tabPanel.setAttribute("role", "tabpanel");
        tabPanel.setAttribute("aria-labelledby", tabButton.id);
        tabPanel.hidden = index !== 0;
        tab.sections.forEach((section) => tabPanel.appendChild(createDetails(section)));
        panels.appendChild(tabPanel);
      });

      tabShell.appendChild(tabs);
      tabShell.appendChild(panels);
      panel.insertBefore(tabShell, title?.nextSibling || panel.firstChild);
    }

    function activateControlTab(tabId) {
      if (!tabId) return;
      document.querySelectorAll("[data-control-tab]").forEach((button) => {
        const active = button.dataset.controlTab === tabId;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", active ? "true" : "false");
      });
      document.querySelectorAll("[data-control-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.controlPanel !== tabId;
      });
    }

    function handleControlPanelAction(action) {
      if (action === "open-datalab") {
        openInspectorDetails("데이터 보정·검증", els.dataLabResult);
        return;
      }
      if (action === "open-liquidity") {
        openInspectorDetails("Liquidity Radar", els.liquidityRadarResult);
      }
    }

    function openInspectorDetails(summaryText, focusTarget) {
      const details = Array.from(document.querySelectorAll("aside details.section"))
        .find((node) => node.querySelector(":scope > summary")?.textContent.trim() === summaryText);
      if (details) {
        details.open = true;
        details.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      const target = focusTarget || details;
      if (target && typeof target.focus === "function") {
        target.setAttribute?.("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    }

    function enhanceDetailedMetricsPanel() {
      const details = Array.from(document.querySelectorAll("aside details.section"))
        .find((node) => node.querySelector("summary")?.textContent.trim() === "상세 지표");
      const list = details?.querySelector(":scope > ul.metric-list");
      if (!details || !list || details.dataset.groupedMetrics === "true") return;
      details.dataset.groupedMetrics = "true";

      const nodes = Array.from(list.children);
      const groups = [];
      let current = null;
      nodes.forEach((node) => {
        if (node.classList.contains("metric-group-label")) {
          current = { title: node.textContent.trim(), items: [] };
          groups.push(current);
          return;
        }
        if (!current) {
          current = { title: "기타", items: [] };
          groups.push(current);
        }
        current.items.push(node);
      });

      const wrapper = document.createElement("div");
      wrapper.className = "metric-detail-groups";
      groups.forEach((group, index) => {
        if (!group.items.length) return;
        const groupDetails = document.createElement("details");
        groupDetails.className = "section metric-detail-group";
        groupDetails.open = index < 2;
        const summary = document.createElement("summary");
        summary.textContent = group.title;
        const groupList = document.createElement("ul");
        groupList.className = "metric-list compact";
        const primaryItems = group.items.slice(0, 8);
        const secondaryItems = group.items.slice(8);
        primaryItems.forEach((item) => groupList.appendChild(item));
        groupDetails.appendChild(summary);
        groupDetails.appendChild(groupList);
        if (secondaryItems.length) {
          const moreDetails = document.createElement("details");
          moreDetails.className = "mini-details";
          const moreSummary = document.createElement("summary");
          moreSummary.textContent = `보조 지표 더 보기 (${secondaryItems.length})`;
          const moreList = document.createElement("ul");
          moreList.className = "metric-list compact";
          secondaryItems.forEach((item) => moreList.appendChild(item));
          moreDetails.appendChild(moreSummary);
          moreDetails.appendChild(moreList);
          groupDetails.appendChild(moreDetails);
        }
        wrapper.appendChild(groupDetails);
      });

      list.replaceWith(wrapper);
    }

    function enhanceInspectorHierarchy() {
      const inspector = document.querySelector(".inspector");
      if (!inspector || inspector.dataset.hierarchyReady === "true") return;
      inspector.dataset.hierarchyReady = "true";
      const title = inspector.querySelector(":scope > .panel-title");
      const sectionByHeading = (text) => Array.from(inspector.children)
        .find((node) => node.querySelector?.("h3")?.textContent.trim() === text);
      const detailsBySummary = (text) => Array.from(inspector.children)
        .find((node) => node.tagName === "DETAILS" && node.querySelector("summary")?.textContent.trim() === text);
      const ordered = [
        sectionByHeading("현재 진단"),
        sectionByHeading("전달 경로"),
        detailsBySummary("위기 조기경보등"),
        sectionByHeading("정책 해석"),
        detailsBySummary("균형 진단"),
        detailsBySummary("원인 분해")
      ].filter(Boolean);
      let anchor = title?.nextSibling || inspector.firstChild;
      ordered.forEach((node) => {
        inspector.insertBefore(node, anchor);
        anchor = node.nextSibling;
      });
    }

    function readConfigFromControls() {
      return {
        speed: safeNumber(Number(els.speedSlider.value), 8),
        performanceMode: els.performanceModeSelect ? els.performanceModeSelect.value : "normal",
        consumerCount: safeNumber(Number(els.consumerSlider.value), 260),
        producerCount: safeNumber(Number(els.producerSlider.value), 36),
        interestRate: safeNumber(Number(els.interestSlider.value), 4.5) / 100,
        householdIncomeTaxRate: safeNumber(Number(els.taxSlider.value), 16) / 100,
        corporateTaxRate: safeNumber(Number(els.corporateTaxSlider.value), 18) / 100,
        valueAddedTaxRate: safeNumber(Number(els.vatSlider.value), 10) / 100,
        educationalStabilizersEnabled: els.educationalStabilizersToggle ? els.educationalStabilizersToggle.checked : true,
        taxRate: safeNumber(Number(els.taxSlider.value), 16) / 100,
        governmentSpending: safeNumber(Number(els.spendingSlider.value), 640),
        baseWage: safeNumber(Number(els.wageSlider.value), 12),
        inflationSensitivity: safeNumber(Number(els.inflationSlider.value), 0.65)
      };
    }

    function getGameModeConfig(mode) {
      const modes = {
        sandbox: {
          name: "기본 실험",
          targetTicks: null,
          mission: "목표와 실패 조건 없이 정책 전달 경로와 거시 균형을 관찰합니다."
        },
        policy: {
          name: "정책 안정화",
          targetTicks: 100,
          mission: "100개월 동안 물가, 실업, 부채를 모두 안정적으로 관리하세요."
        },
        crisis: {
          name: "침체 회복",
          targetTicks: 120,
          mission: "침체 상태에서 출발합니다. 과잉 재고와 실업을 줄이고 회복을 유지하세요."
        },
        inflation: {
          name: "인플레이션 안정화",
          targetTicks: 100,
          mission: "높은 물가에서 출발합니다. 대량 실업 없이 물가상승률을 낮추세요."
        }
      };
      return modes[mode] || modes.sandbox;
    }

    // 게임 모드 로직: 경제 엔진은 그대로 두고 시작 조건, 목표, 승패 규칙만 모드별로 바꾼다.
    function initializeGameMode(mode) {
      const config = getGameModeConfig(mode);
      state.running = false;
      state.game.mode = mode;
      state.game.modeName = config.name;
      state.game.scenarioName = config.name;
      els.gameModeSelect.value = mode;
      els.modeStatusValue.textContent = config.name;
      els.endOverlay.classList.remove("visible");
      syncRandomPolicyEventToggle(mode);
      resetSimulation();
      showToast(`${config.name} 시나리오를 시작했습니다.`, config.mission);
    }

    function syncRandomPolicyEventToggle(mode) {
      if (!els.randomPolicyEventsToggle) return;
      els.randomPolicyEventsToggle.checked = mode !== "sandbox";
    }

    function resetGameStateForCurrentMode() {
      const config = getGameModeConfig(state.game.mode || "sandbox");
      state.game.modeName = config.name;
      state.game.scenarioName = config.name;
      state.game.status = "active";
      state.game.targetTicks = config.targetTicks;
      state.game.startTick = 0;
      state.game.score = 0;
      state.game.lastScore = 0;
      state.game.scoreTrend = 0;
      state.game.bestScore = 0;
      state.game.failReason = "";
      state.game.winReason = "";
      state.game.counters = {
        highInflation: 0,
        highUnemployment: 0,
        debtCrisis: 0,
        recession: 0
      };
      state.game.objectives = [];
      state.game.activeEvent = null;
      state.game.nextEventTick = state.game.mode === "sandbox" ? 30 : 14;
      state.game.wasRunningBeforeEvent = false;
      state.game.eventsSurvived = 0;
      state.game.summary = {
        bestGDP: 0,
        lowestUnemployment: 100,
        peakInflation: -100,
        debtPeak: 0
      };
      if (els.modeStatusValue) els.modeStatusValue.textContent = config.name;
      if (els.missionSummary) els.missionSummary.textContent = `${config.name}: ${config.mission}`;
      if (els.policyEventCard) els.policyEventCard.classList.remove("visible");
    }

    // ===== Legacy facade runtime =====
    function createLegacyRuntimeContext() {
      return {
        state,
        els,
        BOND_PRICE_RETURN_LIMIT,
        CALIBRATION,
        FIRM_DEBT_SERVICE_SCALE,
        GOLD_RETURN_LIMIT,
        GOVERNMENT_DEBT_SERVICE_SCALE,
        HOUSEHOLD_DEBT_SERVICE_SCALE,
        HOUSING_RETURN_LIMIT,
        MAX_FLOWS,
        MAX_HISTORY,
        MAX_PRICE_CHANGE_PER_TICK,
        MAX_WAGE_CHANGE_PER_TICK,
        NEUTRAL_INTEREST_RATE,
        POLICY_META,
        SILVER_RETURN_LIMIT,
        STOCK_RETURN_LIMIT,
        TARGET_INFLATION,
        TARGET_UNEMPLOYMENT,
        TICKS_PER_MONTH,
        rand,
        accuracyLabel,
        activateControlTab,
        addEventMarker,
        adjustProducerPricesAndExpectations,
        adjustProducerPricesAndExpectationsEngine,
        advanceHistoricalScenarioTimeline,
        advancePolicyTransmission,
        advanceShockClock,
        allocateAfterTaxCashFlow,
        allocateAfterTaxCashFlowEngine,
        animateKpiNumber,
        animationLoop,
        applyAutomaticPolicyIfEnabled,
        applyEquilibriumGravity,
        applyHistoricalScenarioPreset,
        applyInertia,
        applyKpiHierarchy,
        applyPolicyComparisonVariant,
        applyScenario,
        applyValidationRateHike,
        applyValidationSpendingBoost,
        applyValidationSupplyShock,
        applyValidationTaxHike,
        assignInitialEmployment,
        average,
        behavioralLabel,
        behavioralSmoothing,
        behavioralSmoothing,
        cacheDomElements,
        cacheElements,
        calculateConsumption,
        calculateInflationPressure,
        calculateInvestment,
        calculateUnemploymentChange,
        calculateUnemploymentRate,
        calibrateParameters,
        cancelKpiAnimation,
        capacityLabel,
        captureCoreStateSignature,
        captureCoreStateSignatureRuntime,
        captureSimulationSnapshot,
        captureSimulationSnapshotRuntime,
        captureUiSafeSnapshot,
        changePolicy,
        chooseProducerForConsumer,
        chooseProducerForConsumerEngine,
        clamp,
        classStatusLabel,
        classifyPolicyComparisonSideEffect,
        clearCharts,
        clearChartsPanel,
        clearDataApiKeys,
        clearDataApiKeysPanel,
        clearLazyResultCache,
        collectProfitTaxes,
        collectProfitTaxesEngine,
        compactMoney,
        compareCoreStateSignature,
        compareCoreStateSignatureRuntime,
        computeBankingCrisisRisk,
        computeBankingCrisisRiskEngine,
        computeBondMarket,
        computeBondMarketEngine,
        computeCausalPressureScores,
        computeCausalPressureScoresAnalysis,
        computeClassMainPressure,
        computeClassMetrics,
        computeClassPolicyDemand,
        computeClassSentiment,
        computeClassStress,
        computeConsumptionResponseSignal,
        computeCreditSpread,
        computeCreditSpreadEngine,
        computeCreditSupply,
        computeCreditSupplyEngine,
        computeGDP,
        computeGDPEngine,
        computeHerdBehavior,
        computeHousingAffordability,
        computeInequalityMetrics,
        computeInflationResponseSignal,
        computeInvestmentResponseSignal,
        computeLaborResponseSignal,
        computeLoanAndDepositRates,
        computeLoanAndDepositRatesEngine,
        computeMarketOutcome,
        computeMarketOutcomeAnalysis,
        computeNonlinearStress,
        computePriceChange,
        computePriceChangeEngine,
        computeRumorEffects,
        computeSafeAssetMarkets,
        computeSafeAssetMarketsEngine,
        computeSafeHavenDemand,
        computeSafeHavenDemandEngine,
        computeSocialStress,
        computeStockVolatilityIndex,
        createAgentMacroContext,
        createAgentMacroRuntime,
        createAgentMacroRuntimeContext,
        createBankingContext,
        createCanvasContext,
        createChartContext,
        createConsumptionContext,
        createCreditCycleContext,
        createDataLabContext,
        createDeveloperValidationContext,
        createDeveloperValidationRuntime,
        createDeveloperValidationRuntimeContext,
        createEconomyRuntimeContext,
        createExperimentContext,
        createExperimentRuntime,
        createExperimentRuntimeContext,
        createGovernmentContext,
        createInitialAppState,
        createInitialAssetMarket,
        createInitialBehavioralState,
        createInitialCausalDecomposition,
        createInitialClassAnalysis,
        createInitialCreditCycle,
        createInitialEarlyWarning,
        createInitialExternalActors,
        createInitialExternalSector,
        createInitialFinancialMarket,
        createInitialHistoricalScenario,
        createInitialInformationSystem,
        createInitialMacroFinancialTransmission,
        createInitialMarketOutcome,
        createInitialModelReliability,
        createInitialPerceivedEconomy,
        createInitialPolicyCredibility,
        createInitialRateStructure,
        createInitialRealEstateMarket,
        createInitialScale,
        createInitialSentimentState,
        createInitialUiState,
        createInitialVulnerabilityState,
        createInspectorContext,
        createInterestRateContext,
        createLaborMarketContext,
        createLiquidityRadarContext,
        createMacroMetricsContext,
        createProductionContext,
        createResetSimulationContext,
        createSafeAssetsContext,
        createSimulationEngineContext,
        createSimulationServices,
        creditRatingLabelFromScore,
        creditRatingScore,
        currentModelParameters,
        defaultModelParameters,
        earlyWarningReasonLabel,
        earlyWarningReasonLabelAnalysis,
        effectiveBaseWage,
        els,
        enhanceControlPanel,
        enhanceDetailedMetricsPanel,
        enhanceInspectorHierarchy,
        escapeHtml,
        evaluateDirectionalValidation,
        executeConsumerPurchases,
        executeConsumerPurchasesEngine,
        executeExternalTrade,
        executeExternalTradeEngine,
        executeGovernmentSpending,
        executeGovernmentSpendingEngine,
        expectationMoodLabel,
        explainAssetMarketState,
        explainBehavioralState,
        explainFinancialMarketState,
        explainInformationState,
        explainModelResult,
        explainSentimentState,
        explainTransmissionChain,
        fearGreedLabel,
        fireConsumer,
        fireConsumerEngine,
        fireShareOfWorkers,
        fireShareOfWorkersEngine,
        firmStrategyLabel,
        formatIndexPoint,
        formatSigned,
        formatStockReturn,
        getAllScenarioPresets,
        getAverageHistoryChange,
        getCanvasPositionCacheKey,
        getDebtSpendingBrake,
        getDebtSpendingBrakeEngine,
        getDeveloperValidationMetrics,
        getGDPGrowthWindow,
        getGameModeConfig,
        getHistoricalScenarioPresets,
        getLazyResultCache,
        getModelDefinitions,
        getModelInputs,
        getPolicyComparisonVariants,
        getRecentPolicyShock,
        getRecentUnemploymentTrend,
        getSectorBehaviorMultiplier,
        getSectorProfile,
        getToastCausalContext,
        getTrendDelta,
        giniCoefficient,
        handleCanvasClick,
        handleCanvasClickPanel,
        handleCanvasHover,
        handleCanvasHoverPanel,
        handleControlPanelAction,
        hideCanvasTooltip,
        hideCanvasTooltipPanel,
        hireConsumer,
        hireConsumerEngine,
        historicalScenarioJudgement,
        historicalScenarioKeyRisk,
        historicalScenarioKeys,
        historicalScenarioStatusLabel,
        householdClassOrder,
        housingStatusLabel,
        hydrateScenarioSelect,
        informationSmooth,
        initializeGameMode,
        initializePolicyState,
        intensityLabel,
        isChartAvailable,
        isElementInClosedDetails,
        isFirmActuallyStressed,
        isLargeEconomyMode,
        judgeScenarioRows,
        kpiValueWithTrend,
        lerp,
        loadCalibrationDataset,
        loadCurrentEconomyIntoModel,
        macroMoney,
        maybeTriggerPolicyEvent,
        money,
        mostFrequent,
        openInspectorDetails,
        payWages,
        payWagesEngine,
        percent,
        perceptionGapLabel,
        policyComparisonRecommendation,
        policyLabel,
        prepareCalibrationScenario,
        produceGoods,
        produceGoodsEngine,
        propertyExposureLabel,
        pushEvent,
        quadraticPoint,
        rand,
        readConfigFromControls,
        realEstateStressLabel,
        recordFlow,
        recordLedgerFlowFromUiFlow,
        recordRuntimeError,
        renderBalanceQuickTestResult,
        renderCausalDecompositionPanel,
        renderDebugLog,
        renderEarlyWarningPanel,
        renderEventLog,
        renderModelInputs,
        renderPolicyComparisonResults,
        renderScenarioValidationResults,
        renderSimulation,
        renderSimulationPanel,
        renderValidationReport,
        resetGameStateForCurrentMode,
        resetSimulation,
        resetSimulationState,
        resetTickAccounting,
        resetTickAccountingEngine,
        resolvePolicyEvent,
        restoreSimulationSnapshot,
        restoreSimulationSnapshotRuntime,
        restoreUiSafeSnapshot,
        riskLabel,
        round,
        roundedRect,
        runADASModel,
        runBacktest,
        runBacktestMode,
        runBacktestModePanel,
        runBalanceQuickTest,
        runDataCalibrationMode,
        runDataCalibrationModePanel,
        runDeveloperValidationCase,
        runDeveloperValidationMode,
        runISLMModel,
        runKeynesianModel,
        runLiquidityRadarMode,
        runLiquidityRadarModePanel,
        runLiveDataLoadMode,
        runLiveDataLoadModePanel,
        runMonteCarloMode,
        runMonteCarloModePanel,
        runMonteCarloScenario,
        runPhillipsModel,
        runPolicyComparison,
        runScenarioValidation,
        runSelectedEconomicModel,
        runSimulationStep,
        runSimulationStepEngine,
        runSolowModel,
        runTaylorRuleModel,
        safeNumber,
        safeOn,
        safeRenderBalanceQuickTestResult,
        safeRenderSimulation,
        safeRenderSimulationPanel,
        safeStepSimulation,
        safeStepSimulationEngine,
        safeUpdateAllDisplays,
        safeUpdateBalanceDiagnostics,
        safeUpdateCharts,
        safeValue,
        saveDataApiKeys,
        saveDataApiKeysPanel,
        scenarioKeyRisk,
        scenarioSelectGroups,
        schedulePolicyTarget,
        sectorCountSummaryLabel,
        sectorDemandLabel,
        sectorLabel,
        sectorStressValue,
        sentimentLabel,
        sentimentPillClass,
        sentimentSmoothing,
        setDeltaText,
        setHtmlIfChanged,
        setKpiMetric,
        setKpiStatus,
        setKpiTier,
        setLazyResultCache,
        setModelInput,
        setPolicyLevel,
        setSentimentPill,
        setSliderMarkerStyle,
        setTextIfChanged,
        setupChartDatasetToggles,
        setupChartDatasetTogglesPanel,
        setupCharts,
        setupChartsPanel,
        setupEvents,
        setupUiEvents,
        shouldUpdateChartData,
        shouldUpdateDomThisTick,
        shouldUpdateHeavyInspector,
        showEndSummary,
        showToast,
        shuffle,
        signedPercent,
        smoothValue,
        startHistoricalScenarioTimeline,
        state,
        stepSimulation,
        stepSimulationEngine,
        stockRiskSentimentLabel,
        stockVolatilityIndexLabel,
        stockVolatilityLabel,
        sum,
        summarizePolicyComparisonResult,
        summarizeScenarioValidation,
        syncBehaviorMetrics,
        syncCreditCycleMetrics,
        syncCreditCycleMetricsEngine,
        syncEffectivePolicyToGovernment,
        syncExternalMetrics,
        syncExternalMetricsEngine,
        syncFinancialMarketMetrics,
        syncFinancialMarketMetricsEngine,
        syncFirmStockMetrics,
        syncHistoricalScenarioMetrics,
        syncInformationMetrics,
        syncLivePolicy,
        syncPolicyCredibilityMetrics,
        syncRandomPolicyEventToggle,
        syncRateMetrics,
        syncRateMetricsEngine,
        syncSentimentMetrics,
        syncUiPerformanceState,
        taxCompositionLabel,
        translatePreference,
        triggerCreditCycleEvent,
        triggerCreditCycleEventEngine,
        triggerRandomShock,
        unique,
        updateAllDisplays,
        updateBankingSector,
        updateBankingSectorEngine,
        updateBehaviorPanel,
        updateBehavioralSystem,
        updateCausalDecomposition,
        updateCausalDecompositionAnalysis,
        updateCharts,
        updateChartsPanel,
        updateClassAnalysisPanel,
        updateControlLabels,
        updateCreditCycle,
        updateCreditCycleEngine,
        updateEarlyWarningSystem,
        updateEarlyWarningSystemAnalysis,
        updateExpectationsSystem,
        updateExternalSector,
        updateExternalSectorEngine,
        updateFinancialMarkets,
        updateGameSummaryStats,
        updateGameSystems,
        updateInflationExpectations,
        updateInformationGapPanel,
        updateInformationSystem,
        updateInspector,
        updateInspectorPanel,
        updateInterestRateStructure,
        updateInterestRateStructureEngine,
        updateKpiStatusClasses,
        updateKpis,
        updateLaborMarket,
        updateLaborMarketEngine,
        updateMacroFocusLine,
        updateMacroMetrics,
        updateMacroMetricsEngine,
        updateMarketPsychologyPanel,
        updateModelChart,
        updateModelComparison,
        updateModelReliabilityPanel,
        updateModelReliabilityPanelView,
        updatePerceivedEconomy,
        updatePerceivedValue,
        updatePolicyImpactPanel,
        updatePolicySliderMarkers,
        updateRunState,
        updateSentimentPanel,
        updateSentimentSystem,
        updateSfcAccountingLayer,
        updateSfcAccountingLayerAdapter,
        updateTransmissionMap,
        updateVulnerabilitySystem,
        updateWagePressure,
        updateZombieFirms,
        valuationPressureLabel,
        waitForUiTurn,
        warnIfStateRestoreFailed,
        weightedPick
      };
    }

    function createRuntimeRegistryInstance() {
      return createRuntimeRegistry({
        createLegacyRuntime,
        createLegacyRuntimeContext,
        createAgentMacroRuntime,
        createAgentMacroContext,
        createExperimentRuntime,
        createExperimentContext,
        createDeveloperValidationRuntime,
        createDeveloperValidationContext
      });
    }

    function createLegacyRuntimeContextInstance() {
      return createRuntimeRegistryInstance().createLegacyRuntimeInstance();
    }

    function repairSimulationState(...args) {
      return createLegacyRuntimeContextInstance().repairSimulationState(...args);
    }

    function sanitizeEconomy(...args) {
      return createLegacyRuntimeContextInstance().sanitizeEconomy(...args);
    }

    function classifyMacroState(...args) {
      return createLegacyRuntimeContextInstance().classifyMacroState(...args);
    }

    function getBalanceDiagnosticSnapshot(...args) {
      return createLegacyRuntimeContextInstance().getBalanceDiagnosticSnapshot(...args);
    }

    function appendHistory(...args) {
      return createLegacyRuntimeContextInstance().appendHistory(...args);
    }

    function getDominantTransmissionChain(...args) {
      return createLegacyRuntimeContextInstance().getDominantTransmissionChain(...args);
    }

    function updateMacroFinancialTransmission(...args) {
      return createLegacyRuntimeContextInstance().updateMacroFinancialTransmission(...args);
    }

    function createEmptyMetrics(...args) {
      return createLegacyRuntimeContextInstance().createEmptyMetrics(...args);
    }

    function executeProducerInvestment(...args) {
      return createLegacyRuntimeContextInstance().executeProducerInvestment(...args);
    }

    function updateBalanceDiagnostics(...args) {
      return createLegacyRuntimeContextInstance().updateBalanceDiagnostics(...args);
    }

    function updateRealEstateMarkets(...args) {
      return createLegacyRuntimeContextInstance().updateRealEstateMarkets(...args);
    }

    function renderPolicyRecommendations(...args) {
      return createLegacyRuntimeContextInstance().renderPolicyRecommendations(...args);
    }

    function applyHistoricalPhaseEffects(...args) {
      return createLegacyRuntimeContextInstance().applyHistoricalPhaseEffects(...args);
    }

    function getHistoricalScenarioTimeline(...args) {
      return createLegacyRuntimeContextInstance().getHistoricalScenarioTimeline(...args);
    }

    function getCalibrationPresets(...args) {
      return createLegacyRuntimeContextInstance().getCalibrationPresets(...args);
    }

    function getPolicyEvents(...args) {
      return createLegacyRuntimeContextInstance().getPolicyEvents(...args);
    }

    function computeStockReturn(...args) {
      return createLegacyRuntimeContextInstance().computeStockReturn(...args);
    }

    function computeDebtStress(...args) {
      return createLegacyRuntimeContextInstance().computeDebtStress(...args);
    }

    function updateFirmStocks(...args) {
      return createLegacyRuntimeContextInstance().updateFirmStocks(...args);
    }

    function renderSelectedAgent(...args) {
      return createLegacyRuntimeContextInstance().renderSelectedAgent(...args);
    }

    function applyCalibrationState(...args) {
      return createLegacyRuntimeContextInstance().applyCalibrationState(...args);
    }

    function createConsumers(...args) {
      return createLegacyRuntimeContextInstance().createConsumers(...args);
    }

    function createProducers(...args) {
      return createLegacyRuntimeContextInstance().createProducers(...args);
    }

    function applyInterestEffects(...args) {
      return createLegacyRuntimeContextInstance().applyInterestEffects(...args);
    }

    function updateFirmCreditRatings(...args) {
      return createLegacyRuntimeContextInstance().updateFirmCreditRatings(...args);
    }

    function updateAssetMarkets(...args) {
      return createLegacyRuntimeContextInstance().updateAssetMarkets(...args);
    }

    function applyWealthEffects(...args) {
      return createLegacyRuntimeContextInstance().applyWealthEffects(...args);
    }

    function applyShock(...args) {
      return createLegacyRuntimeContextInstance().applyShock(...args);
    }

    function updateFinancialConditionIndex(...args) {
      return createLegacyRuntimeContextInstance().updateFinancialConditionIndex(...args);
    }

    function stabilizeEconomy(...args) {
      return createLegacyRuntimeContextInstance().stabilizeEconomy(...args);
    }

    function getModelHealthWarnings(...args) {
      return createLegacyRuntimeContextInstance().getModelHealthWarnings(...args);
    }

    function applyGameModeStartingConditions(...args) {
      return createLegacyRuntimeContextInstance().applyGameModeStartingConditions(...args);
    }

    function computeAssetBubbleRisk(...args) {
      return createLegacyRuntimeContextInstance().computeAssetBubbleRisk(...args);
    }

    function checkFailureConditions(...args) {
      return createLegacyRuntimeContextInstance().checkFailureConditions(...args);
    }

    function syncAssetMetrics(...args) {
      return createLegacyRuntimeContextInstance().syncAssetMetrics(...args);
    }

    function applySentimentToFirms(...args) {
      return createLegacyRuntimeContextInstance().applySentimentToFirms(...args);
    }

    function updateBusinessOutlook(...args) {
      return createLegacyRuntimeContextInstance().updateBusinessOutlook(...args);
    }

    function updateObjectives(...args) {
      return createLegacyRuntimeContextInstance().updateObjectives(...args);
    }

    function triggerPolicyEvent(...args) {
      return createLegacyRuntimeContextInstance().triggerPolicyEvent(...args);
    }

    function updateWagePriceSpiral(...args) {
      return createLegacyRuntimeContextInstance().updateWagePriceSpiral(...args);
    }

    function computeFearGreedIndex(...args) {
      return createLegacyRuntimeContextInstance().computeFearGreedIndex(...args);
    }

    function applySentimentToConsumers(...args) {
      return createLegacyRuntimeContextInstance().applySentimentToConsumers(...args);
    }

    function updateConsumerConfidence(...args) {
      return createLegacyRuntimeContextInstance().updateConsumerConfidence(...args);
    }

    function computeScore(...args) {
      return createLegacyRuntimeContextInstance().computeScore(...args);
    }

    function syncRealEstateMetrics(...args) {
      return createLegacyRuntimeContextInstance().syncRealEstateMetrics(...args);
    }

    function updateMarketPsychology(...args) {
      return createLegacyRuntimeContextInstance().updateMarketPsychology(...args);
    }

    function computeHousingReturn(...args) {
      return createLegacyRuntimeContextInstance().computeHousingReturn(...args);
    }

    function updatePolicyCredibility(...args) {
      return createLegacyRuntimeContextInstance().updatePolicyCredibility(...args);
    }

    function getCurrentEconomySnapshot(...args) {
      return createLegacyRuntimeContextInstance().getCurrentEconomySnapshot(...args);
    }

    function explainMacroState(...args) {
      return createLegacyRuntimeContextInstance().explainMacroState(...args);
    }

    function propagateFinancialStress(...args) {
      return createLegacyRuntimeContextInstance().propagateFinancialStress(...args);
    }

    function renderFeedbackBanners(...args) {
      return createLegacyRuntimeContextInstance().renderFeedbackBanners(...args);
    }

    function handlePolicyChange(...args) {
      return createLegacyRuntimeContextInstance().handlePolicyChange(...args);
    }

    function updateGameDisplay(...args) {
      return createLegacyRuntimeContextInstance().updateGameDisplay(...args);
    }

    function getCalendarLabel(...args) {
      return createLegacyRuntimeContextInstance().getCalendarLabel(...args);
    }

    function getEconomyPhase(...args) {
      return createLegacyRuntimeContextInstance().getEconomyPhase(...args);
    }

    function renderObjectives(...args) {
      return createLegacyRuntimeContextInstance().renderObjectives(...args);
    }

    function fireShareOfWorkers(share) {
      return fireShareOfWorkersEngine(createLaborMarketContext(), share);
    }

    function syncLivePolicy() {
      const nextConfig = readConfigFromControls();
      state.config = nextConfig;

      if (!state.policy) {
        initializePolicyState(nextConfig);
      } else {
        schedulePolicyTarget("interest", nextConfig.interestRate);
        schedulePolicyTarget("tax", nextConfig.householdIncomeTaxRate);
        schedulePolicyTarget("corporateTax", nextConfig.corporateTaxRate);
        schedulePolicyTarget("vat", nextConfig.valueAddedTaxRate);
        schedulePolicyTarget("spending", nextConfig.governmentSpending);
        schedulePolicyTarget("wage", nextConfig.baseWage);
      }

      syncEffectivePolicyToGovernment();
    }

    function initializePolicyState(config) {
      state.policy = {
        interestTarget: config.interestRate,
        interestDelayedTarget: config.interestRate,
        interestEffective: config.interestRate,
        taxTarget: config.householdIncomeTaxRate ?? config.taxRate,
        taxDelayedTarget: config.householdIncomeTaxRate ?? config.taxRate,
        taxEffective: config.householdIncomeTaxRate ?? config.taxRate,
        corporateTaxTarget: config.corporateTaxRate ?? config.taxRate,
        corporateTaxDelayedTarget: config.corporateTaxRate ?? config.taxRate,
        corporateTaxEffective: config.corporateTaxRate ?? config.taxRate,
        vatTarget: config.valueAddedTaxRate ?? 0.10,
        vatDelayedTarget: config.valueAddedTaxRate ?? 0.10,
        vatEffective: config.valueAddedTaxRate ?? 0.10,
        spendingTarget: config.governmentSpending,
        spendingDelayedTarget: config.governmentSpending,
        spendingEffective: config.governmentSpending,
        wageTarget: config.baseWage,
        wageDelayedTarget: config.baseWage,
        wageEffective: config.baseWage
      };
      state.policyQueue = {
        interest: [],
        tax: [],
        corporateTax: [],
        vat: [],
        spending: [],
        wage: []
      };
      syncEffectivePolicyToGovernment();
    }

    function schedulePolicyTarget(key, value) {
      const meta = POLICY_META[key];
      if (!meta || !state.policy || !state.policyQueue) return;
      const previousTarget = safeNumber(state.policy[meta.target], value);
      state.policy[meta.target] = value;
      if (Math.abs(value - previousTarget) <= meta.tolerance) return;

      const queue = state.policyQueue[key] || [];
      if (queue.length) {
        queue[queue.length - 1].value = value;
        state.policyQueue[key] = queue;
        return;
      }

      state.policyQueue[key] = [{ value, delay: Math.round(rand(meta.delayMin, meta.delayMax)) }];
    }

    function advancePolicyTransmission() {
      if (!state.policy) initializePolicyState(state.config || readConfigFromControls());

      Object.entries(POLICY_META).forEach(([key, meta]) => {
        const queue = state.policyQueue[key] || [];
        queue.forEach((item) => {
          item.delay -= 1;
        });

        const readyItems = queue.filter((item) => item.delay <= 0);
        if (readyItems.length) {
          state.policy[meta.delayed] = readyItems[readyItems.length - 1].value;
        }

        state.policyQueue[key] = queue.filter((item) => item.delay > 0);
        state.policy[meta.effective] = smoothValue(state.policy[meta.effective], state.policy[meta.delayed], meta.speed);
      });

      syncEffectivePolicyToGovernment();
    }

    function syncEffectivePolicyToGovernment() {
      if (!state.government || !state.policy) return;
      state.government.householdIncomeTaxRate = state.policy.taxEffective;
      state.government.corporateTaxRate = state.policy.corporateTaxEffective;
      state.government.valueAddedTaxRate = state.policy.vatEffective;
      state.government.taxRate = state.policy.taxEffective;
      state.government.interestRate = state.policy.interestEffective;
      state.government.spending = state.policy.spendingEffective;
      state.government.effectiveSpending = state.policy.spendingEffective;
    }

    function effectiveBaseWage() {
      return state.policy ? state.policy.wageEffective : state.config.baseWage;
    }

    function createLaborMarketContext() {
      return {
        state,
        applyEquilibriumGravity,
        calculateUnemploymentRate,
        computeLaborResponseSignal,
        createInitialSentimentState,
        effectiveBaseWage,
        recordFlow
      };
    }

    function createProductionContext() {
      return {
        state,
        applyEquilibriumGravity,
        computeInflationResponseSignal,
        effectiveBaseWage,
        getGDPGrowthWindow
      };
    }

    function currentModelParameters() {
      return state.modelParameters || defaultModelParameters;
    }

    function computeConsumptionResponseSignal(consumer, context = {}) {
      const rates = state.rates || {};
      const transmission = state.macroFinancial || {};
      const disposableIncome = Math.max(0, safeNumber(context.disposableIncome, consumer.disposableIncomeTick || consumer.income || effectiveBaseWage()));
      const incomeReference = Math.max(1, safeNumber(consumer.income, effectiveBaseWage()));
      const debtBurden = safeNumber(consumer.debtBurden, 0) + safeNumber(consumer.mortgageBurden, 0) * 0.45;
      const response = calculateConsumption({
        disposableIncome: clamp(disposableIncome / incomeReference - 1, -0.45, 0.45),
        wealth: clamp(safeNumber(consumer.wealthEffect, safeNumber(transmission.wealthEffect, 0)), -0.08, 0.10),
        confidence: clamp((safeNumber(consumer.confidence, 1) - 1) * 0.012, -0.012, 0.012),
        interestRate: clamp(safeNumber(rates.realLoanRate, safeNumber(transmission.realLoanRate, 0)), -0.02, 0.08),
        debtBurden: clamp(debtBurden, 0, 0.70)
      }, currentModelParameters());
      return clamp(1 + clamp(response, -1, 1) * 0.06, 0.92, 1.06);
    }

    function computeInvestmentResponseSignal(producer) {
      const rates = state.rates || {};
      const transmission = state.macroFinancial || {};
      const info = state.information || {};
      const sentiment = state.sentiment || {};
      const demandBase = Math.max(1, safeNumber(producer.expectedDemand, 1));
      const uncertainty = clamp(
        safeNumber(info.informationUncertainty, 0.16)
          + safeNumber(sentiment.policyUncertainty, 0.12)
          + safeNumber(state.metrics?.recessionFear, 0.20) * 0.25,
        0,
        1.4
      );
      const response = calculateInvestment({
        expectedDemand: clamp(safeNumber(producer.investmentDemandMemory, producer.unitsSoldTick || demandBase) / demandBase - 1, -0.55, 0.55),
        profit: clamp(safeNumber(producer.profitTrend, producer.lastProfit) / 900, -0.70, 0.70),
        capacityUtilization: clamp((safeNumber(producer.productionUtilization, 0.78) - 0.78) * 0.010, -0.008, 0.008),
        interestRate: clamp(safeNumber(rates.realLoanRate, safeNumber(transmission.realLoanRate, 0)), -0.02, 0.08),
        uncertainty: clamp(uncertainty * 0.012, 0, 0.018)
      }, currentModelParameters());
      return clamp(1 + clamp(response, -1, 1) * 0.08, 0.90, 1.08);
    }

    function computeInflationResponseSignal(producer, observedDemand) {
      const expectedDemand = Math.max(1, safeNumber(producer.expectedDemand, observedDemand || 1));
      const response = calculateInflationPressure({
        demandGap: clamp((safeNumber(observedDemand, 0) - expectedDemand) / expectedDemand, -1, 1),
        wagePressure: clamp(safeNumber(state.smoothedWageGrowth, 0) / 10, -1, 1),
        importPriceShock: clamp(
          safeNumber(state.metrics?.importInflationPressure, 0) / 7
            + safeNumber(state.metrics?.commodityCostPressure, 0) / 9,
          -1,
          1
        ),
        inflationExpectation: clamp((safeNumber(producer.expectedInflation, TARGET_INFLATION) - TARGET_INFLATION) / 6, -1, 1)
      }, currentModelParameters());
      return clamp(response * 0.0035, -0.0045, 0.0065);
    }

    function computeLaborResponseSignal(producer, unemploymentRate) {
      const outputGap = clamp(safeNumber(state.metrics?.outputGap, getGDPGrowthWindow() / 3) / 8, -1, 1);
      const hiringMomentum = clamp(
        (safeNumber(producer.smoothedTargetEmployees, producer.employees.length) - producer.employees.length) / Math.max(1, producer.employees.length),
        -1,
        1
      );
      const response = calculateUnemploymentChange({
        outputGap,
        wageRigidity: clamp(safeNumber(state.smoothedWageGrowth, 0) / 10, 0, 1),
        firmStress: clamp(safeNumber(producer.stressMemory, producer.debtStress || 0) / 1.5 + Math.max(0, unemploymentRate - 0.08) * 0.25, 0, 1),
        hiringMomentum
      }, currentModelParameters());
      return clamp(1 - clamp(response, -1, 1) * 0.08, 0.92, 1.06);
    }

    // ===== 에이전트 생성과 리셋 =====
    // 인구 수나 기업 수가 바뀌면 에이전트를 새로 만들고 모든 누적 상태를 초기화한다.
    function resetSimulation() {
      setRandomSource(createSeededRandom(state.seed));
      resetSimulationState(createResetSimulationContext());
      clearCharts();
      pushEvent("새 경제가 생성되었습니다. 시작 버튼을 누르거나 1단계씩 진행해 보세요.");
      safeUpdateAllDisplays();
      if (els.modelSelector) runSelectedEconomicModel();
      updateRunState();
      safeRenderSimulation(performance.now());
    }

    function createResetSimulationContext() {
      return {
        state,
        io: {
          readConfig: readConfigFromControls
        },
        agents: {
          createConsumers,
          createProducers,
          assignInitialEmployment
        },
        lifecycle: {
          initializePolicyState,
          createEmptyMetrics,
          resetGameStateForCurrentMode,
          applyGameModeStartingConditions,
          updateMacroMetrics,
          updateMacroFinancialTransmission,
          updatePerceivedEconomy,
          updateExpectationsSystem,
          updateSentimentSystem,
          updateBehavioralSystem,
          updateGameSummaryStats,
          computeScore,
          updateObjectives
        },
        now: () => performance.now()
      };
    }

    // 소비자는 서로 다른 현금, 소비 성향, 금리 민감도, 선호를 갖는다.
    // 생산자는 서로 다른 가격, 재고, 임금, 생산능력, 투자 성향을 갖는다.
    function assignInitialEmployment() {
      const shuffledConsumers = shuffle([...state.consumers.keys()]);
      const targetJobs = Math.round(state.consumers.length * rand(0.82, 0.90));
      let cursor = 0;

      state.producers.forEach((producer) => {
        const baseJobs = Math.floor(targetJobs / state.producers.length);
        const target = clamp(baseJobs + Math.floor(rand(-2, 4)), 1, Math.ceil(producer.productionCapacity / 1.5));
        for (let i = 0; i < target && cursor < targetJobs && cursor < shuffledConsumers.length; i += 1) {
          hireConsumer(producer, state.consumers[shuffledConsumers[cursor]]);
          cursor += 1;
        }
      });
    }

    // ===== 시뮬레이션 틱 =====
    // 한 단계는 노동시장, 임금 지급, 생산, 정부 지출, 소비, 투자, 가격 조정 순서로 진행된다.
    // ===== 시뮬레이션 틱 =====
    // Core engine은 실행 순서만 담당하고, DOM/UI 의존성은 context callback으로 유지한다.
    function stepSimulation() {
      return stepSimulationEngine(createSimulationEngineContext());
    }

    function safeStepSimulation() {
      return safeStepSimulationEngine(createSimulationEngineContext());
    }

    function runSimulationStep() {
      return runSimulationStepEngine(createSimulationEngineContext());
    }

    function resetTickAccounting() {
      return resetTickAccountingEngine(createSimulationEngineContext());
    }

    function createSimulationEngineContext() {
      return {
        state,
        createEmptyMetrics,
        safeNumber,
        performanceNow: () => performance.now(),
        services: createSimulationServices({
          runtime: {
            policy: {
              syncLivePolicy,
              applyAutomaticPolicyIfEnabled,
              advanceShockClock,
              advancePolicyTransmission
            },
            rates: {
              updateInterestRateStructure,
              applyInterestEffects
            },
            expectations: {
              updateMacroFinancialTransmission,
              updatePerceivedEconomy,
              updateExpectationsSystem,
              updateSentimentSystem,
              updateBehavioralSystem,
              updateExternalSector,
              updatePolicyCredibility,
              updateInflationExpectations,
              updateBusinessOutlook,
              updateConsumerConfidence,
              applySentimentToConsumers,
              applySentimentToFirms
            },
            finance: {
              updateFinancialMarkets,
              computeDebtStress,
              propagateFinancialStress
            },
            realEconomy: {
              updateWagePriceSpiral,
              updateLaborMarket,
              payWages,
              produceGoods,
              executeGovernmentSpending,
              executeConsumerPurchases,
              executeExternalTrade,
              executeProducerInvestment,
              adjustProducerPricesAndExpectations,
              collectProfitTaxes,
              updateMacroMetrics
            },
            assets: {
              updateAssetMarkets,
              applyWealthEffects
            },
            diagnostics: {
              updateFirmCreditRatings,
              updateZombieFirms,
              computeInequalityMetrics,
              computeSocialStress,
              computeMarketOutcome,
              updateCausalDecomposition,
              updateEarlyWarningSystem,
              advanceHistoricalScenarioTimeline,
              syncHistoricalScenarioMetrics,
              updateVulnerabilitySystem,
              updateGameSystems
            },
            history: {
              updateSfcAccountingLayer,
              appendHistory
            }
          },
          ui: {
            shouldUpdateDomThisTick,
            safeUpdateAllDisplays,
            safeUpdateCharts,
            updateRunState,
            recordRuntimeError
          },
          safety: {
            stabilizeEconomy,
            sanitizeEconomy,
            repairSimulationState
          }
        })
      };
    }

    function shouldUpdateDomThisTick() {
      syncUiPerformanceState();
      const interval = isLargeEconomyMode() ? 12 : state.config.performanceMode === "light" ? 6 : 3;
      if (state.ui) state.ui.lastInspectorUpdateTick = state.tick;
      return state.tick <= 2 || state.tick % interval === 0;
    }

    function updateSfcAccountingLayer() {
      return updateSfcAccountingLayerAdapter(state);
    }

    function isLargeEconomyMode() {
      return safeNumber(state.config?.consumerCount, 0) > 360 || safeNumber(state.config?.producerCount, 0) > 60;
    }

    function applyAutomaticPolicyIfEnabled() {
      if (!els.autoPolicyToggle.checked || state.tick < 5) return;

      const currentRatePercent = Number(els.interestSlider.value);
      const inflationGap = state.metrics.inflation - TARGET_INFLATION;
      const unemploymentGap = state.metrics.unemploymentRate - 7.5;
      const adjustment = inflationGap * 0.08 - unemploymentGap * 0.025;
      const nextRate = clamp(currentRatePercent + adjustment, 0, 20);

      els.interestSlider.value = nextRate.toFixed(2);
      updateControlLabels();
    }

    function updateWagePressure() {
      updateWagePriceSpiral();
    }

    // ===== 노동시장 =====
    function updateLaborMarket() {
      return updateLaborMarketEngine(createLaborMarketContext());
    }

    // ===== 임금과 소득세 =====
    function payWages() {
      return payWagesEngine(createLaborMarketContext());
    }

    // ===== 생산 =====
    function produceGoods() {
      return produceGoodsEngine(createProductionContext());
    }

    // ===== 정부 지출 =====
    // 지출은 실업 지원, 공공 구매, 기업 보조 형태로 경제에 다시 주입된다.
    function executeGovernmentSpending() {
      return executeGovernmentSpendingEngine(createGovernmentContext());
    }

    function getDebtSpendingBrake() {
      return getDebtSpendingBrakeEngine(createGovernmentContext());
    }

    // ===== 소비자 구매 =====
    // 금리가 오르면 소비 예산이 줄고, 물가 상승과 실업도 소비 심리를 낮춘다.
    function executeConsumerPurchases() {
      return executeConsumerPurchasesEngine(createConsumptionContext());
    }

    function chooseProducerForConsumer(consumer, averagePrice) {
      return chooseProducerForConsumerEngine(createConsumptionContext(), consumer, averagePrice);
    }

    function createConsumptionContext() {
      return {
        state,
        calculateUnemploymentRate,
        computeConsumptionResponseSignal,
        effectiveBaseWage,
        getRecentUnemploymentTrend,
        recordFlow
      };
    }

    function createGovernmentContext() {
      return {
        state,
        calculateUnemploymentRate,
        effectiveBaseWage,
        recordFlow
      };
    }

    function createEconomyRuntimeContext() {
      return {
        state,
        calculateUnemploymentRate,
        computeConsumptionResponseSignal,
        createInitialBehavioralState,
        createInitialCreditCycle,
        createInitialExternalActors,
        createInitialExternalSector,
        createInitialFinancialMarket,
        createInitialInformationSystem,
        createInitialMacroFinancialTransmission,
        createInitialPerceivedEconomy,
        createInitialPolicyCredibility,
        createInitialRateStructure,
        effectiveBaseWage,
        getGDPGrowthWindow,
        getRecentUnemploymentTrend,
        recordFlow
      };
    }

    // ===== 기업 투자 =====
    // 수요가 강하고 현금이 충분할수록 투자하지만, 금리가 높으면 투자 계수가 낮아진다.
    function executeExternalTrade() {
      return executeExternalTradeEngine(createEconomyRuntimeContext());
    }

    // ===== 가격과 기대수요 =====
    function computePriceChange(producer, observedDemand) {
      return computePriceChangeEngine(createProductionContext(), producer, observedDemand);
    }

    function adjustProducerPricesAndExpectations() {
      return adjustProducerPricesAndExpectationsEngine(createProductionContext());
    }

    // ===== 이윤세 =====
    // 임금과 투자비를 반영한 양의 이윤에 대해 정부가 세금을 걷는다.
    function collectProfitTaxes() {
      return collectProfitTaxesEngine(createGovernmentContext());
    }

    function allocateAfterTaxCashFlow(producer, afterTaxProfit) {
      return allocateAfterTaxCashFlowEngine(createGovernmentContext(), producer, afterTaxProfit);
    }

    // ===== 거시지표 집계 =====
    // 개별 에이전트 행동을 GDP형 지출, 실업률, 평균 가격, 재정수지로 집계한다.
    function updateMacroMetrics() {
      return updateMacroMetricsEngine(createMacroMetricsContext());
    }

    function computeGDP() {
      return computeGDPEngine(state);
    }

    function createMacroMetricsContext() {
      return {
        state,
        calculateUnemploymentRate,
        getGDPGrowthWindow,
        updateFinancialConditionIndex,
        syncRateMetrics,
        createInitialAssetMarket,
        stockVolatilityLabel,
        valuationPressureLabel,
        stockRiskSentimentLabel,
        fearGreedLabel,
        stockVolatilityIndexLabel,
        syncFinancialMarketMetrics
      };
    }

    function createInterestRateContext() {
      return {
        state,
        createInitialFinancialMarket,
        createInitialPolicyCredibility,
        createInitialRateStructure,
        createInitialSentimentState,
        getGDPGrowthWindow
      };
    }

    function createBankingContext() {
      return {
        state,
        createInitialCreditCycle,
        createInitialMacroFinancialTransmission,
        createInitialRateStructure,
        getGDPGrowthWindow
      };
    }

    function createCreditCycleContext() {
      return {
        state,
        addEventMarker,
        createInitialCreditCycle,
        createInitialFinancialMarket,
        createInitialRateStructure,
        pushEvent
      };
    }

    function createSafeAssetsContext() {
      return {
        state,
        createInitialCreditCycle,
        createInitialMacroFinancialTransmission,
        getGDPGrowthWindow,
        getRecentUnemploymentTrend
      };
    }

    function updateGameSystems() {
      updateGameSummaryStats();
      computeScore();
      updateObjectives();
      checkFailureConditions();
      maybeTriggerPolicyEvent();
    }

    function updateGameSummaryStats() {
      state.game.summary.bestGDP = Math.max(state.game.summary.bestGDP || 0, state.metrics.gdp || 0);
      state.game.summary.lowestUnemployment = Math.min(state.game.summary.lowestUnemployment ?? 100, state.metrics.unemploymentRate || 100);
      state.game.summary.peakInflation = Math.max(state.game.summary.peakInflation ?? -100, state.metrics.inflation || 0);
      state.game.summary.debtPeak = Math.max(state.game.summary.debtPeak || 0, state.metrics.governmentDebt || 0);
    }

    function getGDPGrowthWindow() {
      const windowSize = TICKS_PER_MONTH * 3;
      if (state.history.length < windowSize + 1) return 0;
      const current = state.history[state.history.length - 1].gdp;
      const previous = state.history[state.history.length - windowSize - 1].gdp;
      return previous > 0 ? ((current - previous) / previous) * 100 : 0;
    }

    function getRecentUnemploymentTrend() {
      const windowSize = TICKS_PER_MONTH * 3;
      if (state.history.length < windowSize + 1) return 0;
      const current = state.metrics.unemploymentRate || state.history[state.history.length - 1].unemploymentRate;
      const previous = state.history[state.history.length - windowSize - 1].unemploymentRate;
      return safeNumber(current - previous, 0);
    }

    function maybeTriggerPolicyEvent() {
      if (els.randomPolicyEventsToggle && !els.randomPolicyEventsToggle.checked) return;
      if (state.game.status !== "active" || state.game.activeEvent) return;
      if (state.game.mode === "sandbox" && state.tick < TICKS_PER_MONTH * 24) return;
      if (state.tick < state.game.nextEventTick) return;
      if (state.game.mode === "sandbox" && rand(0, 1) > 0.32) {
        state.game.nextEventTick = state.tick + Math.floor(rand(18, 34));
        return;
      }
      triggerPolicyEvent();
    }

    // 이벤트 시스템: 선택지는 정책 변수나 에이전트 상태를 바꾸고, 각 선택의 거시경제 트레이드오프를 남긴다.
    function resolvePolicyEvent(optionIndex) {
      const event = state.game.activeEvent;
      if (!event || !event.options[optionIndex]) return;
      try {
        event.options[optionIndex].apply();
        state.game.eventsSurvived += 1;
        pushEvent(`정책 선택 완료: ${event.options[optionIndex].label}`);
      } catch (error) {
        recordRuntimeError(error, "이벤트 오류", "정책 선택 처리 중 오류가 감지되어 이벤트를 건너뜁니다.");
      } finally {
        state.game.activeEvent = null;
        state.game.nextEventTick = state.tick + Math.floor(rand(20, 36));
        if (els.policyEventCard) els.policyEventCard.classList.remove("visible");
        safeUpdateAllDisplays();
        safeUpdateCharts();
        if (state.game.wasRunningBeforeEvent && state.game.status === "active") {
          state.running = true;
          state.debug.lastSuccessfulTickTime = performance.now();
          updateRunState();
        }
      }
    }

    function showEndSummary(won) {
      state.running = false;
      updateRunState();
      const title = won ? "정책 운영 성공" : "정책 운영 실패";
      const reason = won ? state.game.winReason : state.game.failReason;
      els.endTitle.textContent = title;
      els.endReason.textContent = reason || "분석 실행이 종료되었습니다.";
      els.endSummaryGrid.innerHTML = [
        ["최종 안정성 지수", `${state.game.score.toLocaleString("ko-KR")}점`],
        ["최고 GDP", money(state.game.summary.bestGDP)],
        ["최저 실업률", percent(state.game.summary.lowestUnemployment)],
        ["최고 물가상승률", signedPercent(state.game.summary.peakInflation)],
        ["부채 최고치", money(state.game.summary.debtPeak)],
        ["대응한 이벤트", `${state.game.eventsSurvived}개`]
      ].map(([label, value]) => `<div class="summary-item"><span>${label}</span><strong>${value}</strong></div>`).join("");
      els.endOverlay.classList.add("visible");
      showToast(title, reason);
    }

    function changePolicy(delta, message) {
      if (delta.rate) els.interestSlider.value = clamp(Number(els.interestSlider.value) + delta.rate, 0, 20).toFixed(2);
      if (delta.tax) {
        els.taxSlider.value = clamp(Number(els.taxSlider.value) + delta.tax, 0, 45).toFixed(1);
        els.corporateTaxSlider.value = clamp(Number(els.corporateTaxSlider.value) + delta.tax, 0, 45).toFixed(1);
      }
      if (delta.incomeTax) els.taxSlider.value = clamp(Number(els.taxSlider.value) + delta.incomeTax, 0, 45).toFixed(1);
      if (delta.corporateTax) els.corporateTaxSlider.value = clamp(Number(els.corporateTaxSlider.value) + delta.corporateTax, 0, 45).toFixed(1);
      if (delta.spending) els.spendingSlider.value = clamp(Number(els.spendingSlider.value) + delta.spending, 0, 1600).toFixed(0);
      syncLivePolicy();
      updateControlLabels();
      showToast("정책 변경", `${message} 효과는 몇 개월에 걸쳐 점진적으로 반영됩니다.`);
    }

    function updateFinancialMarkets() {
      if (!state.financialMarket) state.financialMarket = createInitialFinancialMarket(state.config);
      updateInterestRateStructure();
      updateMacroFinancialTransmission();
      computeLoanAndDepositRates();
      computeBondMarket();
      updateBankingSector();
      updateCreditCycle();
      computeCreditSpread();
      computeCreditSupply();
      computeSafeHavenDemand();
      computeSafeAssetMarkets();
      computeBankingCrisisRisk();
      syncFinancialMarketMetrics();
      updateFinancialConditionIndex();
    }

    function updateInterestRateStructure() {
      return updateInterestRateStructureEngine(createInterestRateContext());
    }

    function syncRateMetrics() {
      return syncRateMetricsEngine(createInterestRateContext());
    }

    // ===== 심리·정보·행동·계층·취약성 런타임 =====
    function createAgentMacroContext() {
      return {
        state,
        CALIBRATION,
        NEUTRAL_INTEREST_RATE,
        TARGET_INFLATION,
        TARGET_UNEMPLOYMENT,
        TICKS_PER_MONTH,
        rand,
        applyInertia,
        average,
        behavioralLabel,
        behavioralSmoothing,
        classStatusLabel,
        clamp,
        computeNonlinearStress,
        createInitialAssetMarket,
        createInitialBehavioralState,
        createInitialClassAnalysis,
        createInitialInformationSystem,
        createInitialMacroFinancialTransmission,
        createInitialPerceivedEconomy,
        createInitialRealEstateMarket,
        createInitialSentimentState,
        createInitialVulnerabilityState,
        creditRatingScore,
        effectiveBaseWage,
        expectationMoodLabel,
        giniCoefficient,
        getGDPGrowthWindow,
        getAverageHistoryChange,
        getRecentPolicyShock,
        getRecentUnemploymentTrend,
        getTrendDelta,
        householdClassOrder,
        informationSmooth,
  perceptionGapLabel,
        riskLabel,
        pushEvent,
        safeNumber,
        safeValue,
        sectorLabel,
        sentimentLabel,
        sentimentSmoothing,
        smoothValue,
        sum,
        updatePerceivedValue
      };
    }

    function createAgentMacroRuntimeContext() {
      return createRuntimeRegistryInstance().createAgentMacroRuntimeInstance();
    }

    function updateSentimentSystem(...args) {
      return createAgentMacroRuntimeContext().updateSentimentSystem(...args);
    }

    function updatePerceivedEconomy(...args) {
      return createAgentMacroRuntimeContext().updatePerceivedEconomy(...args);
    }

    function updateInformationSystem(...args) {
      return createAgentMacroRuntimeContext().updateInformationSystem(...args);
    }

    function computeRumorEffects(...args) {
      return createAgentMacroRuntimeContext().computeRumorEffects(...args);
    }

    function updateExpectationsSystem(...args) {
      return createAgentMacroRuntimeContext().updateExpectationsSystem(...args);
    }

    function syncInformationMetrics(...args) {
      return createAgentMacroRuntimeContext().syncInformationMetrics(...args);
    }

    function syncSentimentMetrics(...args) {
      return createAgentMacroRuntimeContext().syncSentimentMetrics(...args);
    }

    function updateBehavioralSystem(...args) {
      return createAgentMacroRuntimeContext().updateBehavioralSystem(...args);
    }

    function computeHerdBehavior(...args) {
      return createAgentMacroRuntimeContext().computeHerdBehavior(...args);
    }

    function syncBehaviorMetrics(...args) {
      return createAgentMacroRuntimeContext().syncBehaviorMetrics(...args);
    }

    function computeInequalityMetrics(...args) {
      return createAgentMacroRuntimeContext().computeInequalityMetrics(...args);
    }

    function computeClassMetrics(...args) {
      return createAgentMacroRuntimeContext().computeClassMetrics(...args);
    }

    function computeClassSentiment(...args) {
      return createAgentMacroRuntimeContext().computeClassSentiment(...args);
    }

    function computeClassStress(...args) {
      return createAgentMacroRuntimeContext().computeClassStress(...args);
    }

    function computeClassMainPressure(...args) {
      return createAgentMacroRuntimeContext().computeClassMainPressure(...args);
    }

    function computeClassPolicyDemand(...args) {
      return createAgentMacroRuntimeContext().computeClassPolicyDemand(...args);
    }

    function computeSocialStress(...args) {
      return createAgentMacroRuntimeContext().computeSocialStress(...args);
    }

    function updateVulnerabilitySystem(...args) {
      return createAgentMacroRuntimeContext().updateVulnerabilitySystem(...args);
    }

    function updatePerceivedValue(oldValue, actualValue, badNews, accuracy) {
      const oldSafe = safeNumber(oldValue, actualValue);
      const info = state.information || createInitialInformationSystem();
      const accuracySafe = clamp(safeNumber(accuracy, 0.75), 0.2, 1);
      const rumorBias = safeNumber(info.rumorIntensity, 0) * safeNumber(info.rumorCredibility, 0) * (badNews ? 0.18 : -0.04);
      const noise = rand(-0.03, 0.03) * (1 - accuracySafe) * Math.max(1, Math.abs(actualValue));
      const perceivedTarget = actualValue * (1 + rumorBias) + noise;
      const alpha = (badNews ? 0.25 : 0.10) * accuracySafe * clamp(1 - safeNumber(info.informationDelay, 0.18), 0.45, 1);
      return safeNumber(oldSafe * (1 - alpha) + perceivedTarget * alpha, actualValue);
    }

    function informationSmooth(oldValue, targetValue) {
      const oldSafe = safeNumber(oldValue, targetValue);
      const alpha = targetValue < oldSafe ? 0.18 : 0.08;
      return clamp(oldSafe * (1 - alpha) + targetValue * alpha, 0, 1.2);
    }

    function sentimentSmoothing(oldValue, targetValue) {
      const oldSafe = safeNumber(oldValue, targetValue);
      const alpha = targetValue < oldSafe ? 0.18 : 0.08;
      return clamp(oldSafe * (1 - alpha) + targetValue * alpha, 0, 1.2);
    }

    function getRecentPolicyShock() {
      if (!state.policy) return 0;
      const rateGap = Math.abs(safeNumber(state.policy.interestTarget, 0) - safeNumber(state.policy.interestEffective, 0)) * 8;
      const taxGap = Math.abs(safeNumber(state.policy.taxTarget, 0) - safeNumber(state.policy.taxEffective, 0)) * 3;
      const corporateTaxGap = Math.abs(safeNumber(state.policy.corporateTaxTarget, 0) - safeNumber(state.policy.corporateTaxEffective, 0)) * 3;
      const spendingGap = Math.abs(safeNumber(state.policy.spendingTarget, 0) - safeNumber(state.policy.spendingEffective, 0)) / Math.max(500, safeNumber(state.policy.spendingEffective, 640));
      return clamp(rateGap + taxGap + corporateTaxGap + spendingGap, 0, 1);
    }

    function behavioralSmoothing(oldValue, targetValue) {
      const oldSafe = safeNumber(oldValue, targetValue);
      const targetSafe = clamp(safeNumber(targetValue, oldSafe), 0, 1.8);
      const fearWorsens = targetSafe > oldSafe && (targetSafe > 0.55 || state.behavior?.panicSellingPressure > 0.45);
      const alpha = fearWorsens ? 0.16 : 0.075;
      return clamp(oldSafe * (1 - alpha) + targetSafe * alpha, 0, 1.8);
    }

    function getAverageHistoryChange(key, windowSize = 12, fallback = 0) {
      if (!state.history.length) return 0;
      const current = safeNumber(state.history[state.history.length - 1]?.[key], fallback);
      const previous = safeNumber(state.history[Math.max(0, state.history.length - windowSize)]?.[key], current);
      return current - previous;
    }

    function updateExternalSector()  {
      return updateExternalSectorEngine(createEconomyRuntimeContext());
    }

    function updateZombieFirms() {
      state.producers.forEach((producer) => {
        const interestCoverageWeak = producer.dscr < 1.0 || producer.interestCostTick > Math.max(1, producer.revenueTick + producer.govRevenueTick) * 0.10;
        producer.lowCoverageMonths = interestCoverageWeak ? safeNumber(producer.lowCoverageMonths, 0) + 1 / TICKS_PER_MONTH : Math.max(0, safeNumber(producer.lowCoverageMonths, 0) - 0.25 / TICKS_PER_MONTH);
        const forbearance = state.metrics.loanRate < 5.2 || state.metrics.creditSupplyIndex > 92;
        producer.zombieFirm = producer.lowCoverageMonths > 5 && producer.debt > producer.cash * 1.4 && producer.profitTrend < 20 && forbearance;
        if (producer.zombieFirm) {
          producer.investmentAppetite = clamp(safeNumber(producer.investmentAppetite, 0.4) * 0.96, 0, 0.55);
          producer.productivity = clamp(producer.productivity * 0.9995, 0.25, 6);
        }
      });
      state.metrics.zombieFirmRatio = state.producers.filter((p) => p.zombieFirm).length / Math.max(1, state.producers.length) * 100;
    }

    function computeMarketOutcome() {
      return computeMarketOutcomeAnalysis(state);
    }

    function updateCausalDecomposition() {
      return updateCausalDecompositionAnalysis(state);
    }

    function computeCausalPressureScores() {
      return computeCausalPressureScoresAnalysis(state.metrics || {});
    }

    function updateEarlyWarningSystem() {
      return updateEarlyWarningSystemAnalysis(state, { formatSigned, percent, signedPercent });
    }

    function earlyWarningReasonLabel(label) {
      return earlyWarningReasonLabelAnalysis(label, state.metrics || {}, { formatSigned, percent, signedPercent });
    }

    function syncExternalMetrics()  {
      return syncExternalMetricsEngine(createEconomyRuntimeContext());
    }

    function syncPolicyCredibilityMetrics() {
      const p = state.policyCredibility || createInitialPolicyCredibility();
      state.metrics.centralBankCredibility = safeNumber(p.centralBankCredibility, 0.78);
      state.metrics.expectedRatePath = safeNumber(p.expectedRatePath, NEUTRAL_INTEREST_RATE / 100) * 100;
      state.metrics.forwardGuidanceClarity = safeNumber(p.forwardGuidanceClarity, 0.76);
      state.metrics.inflationTargetCredibility = safeNumber(p.inflationTargetCredibility, 0.80);
      state.metrics.policySurprise = safeNumber(p.policySurprise, 0);
      state.metrics.marketRateExpectation = safeNumber(p.marketRateExpectation, NEUTRAL_INTEREST_RATE / 100) * 100;
      state.metrics.ratePathLabel = p.ratePathLabel || "중립";
    }

    function sectorStressValue(sector) {
      return clamp(safeNumber(state.metrics.sectorStress?.[sector]?.stress, 0), 0, 1);
    }

    function sectorDemandLabel(sector) {
      const sectorData = state.metrics.sectorStress?.[sector];
      if (!sectorData) return "보통";
      const demand = safeNumber(sectorData.output, 0) / Math.max(1, safeNumber(sectorData.count, 1) * 8);
      if (demand > 1.2) return "강함";
      if (demand > 0.65) return "보통";
      if (demand > 0.35) return "약함";
      return "위험";
    }

    function sectorCountSummaryLabel() {
      const stats = state.metrics.sectorStress || {};
      const order = ["services", "manufacturing", "technology", "financial", "agriculture", "energy", "construction"];
      return order
        .map((sector) => `${sectorLabel(sector).replace("·부동산업", "")} ${Math.round(safeNumber(stats[sector]?.count, 0))}`)
        .filter((text) => !text.endsWith(" 0"))
        .slice(0, 5)
        .join(" · ") || "집계 중";
    }

    function taxCompositionLabel() {
      const total = Math.max(1, safeNumber(state.metrics.totalTaxCollected, 0));
      const income = safeNumber(state.metrics.householdIncomeTaxCollected, 0) / total * 100;
      const corporate = safeNumber(state.metrics.corporateTaxCollected, 0) / total * 100;
      const vat = safeNumber(state.metrics.valueAddedTaxCollected, 0) / total * 100;
      return `소득 ${round(income, 0)}% · 법인 ${round(corporate, 0)}% · 부가 ${round(vat, 0)}%`;
    }

    function computeLoanAndDepositRates() {
      return computeLoanAndDepositRatesEngine(createInterestRateContext());
    }

    function computeBondMarket() {
      return computeBondMarketEngine(createInterestRateContext());
    }

    function updateBankingSector() {
      return updateBankingSectorEngine(createBankingContext());
    }

    function computeCreditSpread() {
      return computeCreditSpreadEngine(createBankingContext());
    }

    function computeCreditSupply() {
      return computeCreditSupplyEngine(createBankingContext());
    }

    function computeBankingCrisisRisk() {
      return computeBankingCrisisRiskEngine(createBankingContext());
    }

    function syncFinancialMarketMetrics() {
      return syncFinancialMarketMetricsEngine(createBankingContext());
    }

    function updateCreditCycle() {
      return updateCreditCycleEngine(createCreditCycleContext());
    }

    function triggerCreditCycleEvent(type, intensity = 0.65, message = "") {
      return triggerCreditCycleEventEngine(createCreditCycleContext(), type, intensity, message);
    }

    function syncCreditCycleMetrics() {
      return syncCreditCycleMetricsEngine(createCreditCycleContext());
    }

    function computeSafeHavenDemand() {
      return computeSafeHavenDemandEngine(createSafeAssetsContext());
    }

    function computeSafeAssetMarkets() {
      return computeSafeAssetMarketsEngine(createSafeAssetsContext());
    }

    function explainFinancialMarketState() {
      const financial = state.financialMarket || createInitialFinancialMarket(state.config);
      const cycle = state.creditCycle || createInitialCreditCycle();
      if (cycle.creditCrunchRisk > 0.58) return "여신심사 보수화와 은행 자금조달 압력이 신용경색 위험을 높이고 있습니다.";
      if (cycle.creditExcessRisk > 0.58) return "신용 과다와 위험 과소평가가 단기 성장을 지지하지만 향후 부실 취약성을 누적시키고 있습니다.";
      if (financial.bondMarketStress > 0.55) return "국채시장 변동성과 장기채 가격 하락이 장기금리와 재정 조달비용을 높이고 있습니다.";
      if (financial.depositorConfidence < 0.58 || financial.interbankTrust < 0.58) return "예금자 신뢰와 은행 간 신뢰가 약해져 대출태도가 보수화되고 있습니다.";
      if (financial.bankingCrisisRisk > 0.65) return "은행 건전성이 약해져 신용공급 위축 위험이 커지고 있습니다.";
      if (financial.creditSpread > 0.055) return "신용스프레드 확대가 기업 투자와 가계 차입을 둔화시키고 있습니다.";
      if (financial.bondYield > state.government.interestRate + 0.035 && state.metrics.debtToGdpRatio > 0.9) return "정부 부채비율 상승으로 국채금리 압력이 커지고 있습니다.";
      if (financial.safeHavenDemand > 0.55) return "안전자산 선호가 높아져 위험자산 투자심리가 약해지고 있습니다.";
      if (financial.goldReturn > 0.004) return "금 가격 상승은 인플레이션 불안 또는 금융 스트레스를 반영할 수 있습니다.";
      return "";
    }

    function syncFirmStockMetrics() {
      if (!state.metrics || !state.producers.length) return;
      const prices = state.producers.map((producer) => safeNumber(producer.stockPrice, 100));
      const returns = state.producers.map((producer) => safeNumber(producer.stockReturn, 0) * 100 * TICKS_PER_MONTH);
      state.metrics.averageFirmStockPrice = average(prices);
      state.metrics.highestFirmStockPrice = prices.length ? Math.max(...prices) : 0;
      state.metrics.lowestFirmStockPrice = prices.length ? Math.min(...prices) : 0;
      state.metrics.averageFirmStockReturn = average(returns);
      state.metrics.firmStockVolatility = average(returns.map((value) => Math.abs(value - state.metrics.averageFirmStockReturn)));
      state.metrics.opaqueFirmRatio = state.producers.filter((producer) => safeNumber(producer.informationOpacity, 0) > 0.55).length / Math.max(1, state.producers.length) * 100;
      state.metrics.stockCrashFirmCount = state.producers.filter((producer) => safeNumber(producer.stockReturn, 0) * TICKS_PER_MONTH < -0.12).length;
      state.metrics.averageFirmValuationPressure = average(state.producers.map((producer) => safeNumber(producer.valuationPressure, 0)));
    }

    function computeStockVolatilityIndex() {
      const asset = state.assetMarket || createInitialAssetMarket();
      const info = state.information || createInitialInformationSystem();
      const financial = state.financialMarket || createInitialFinancialMarket(state.config);
      const surprise = Math.abs(safeNumber(state.metrics.inflation, TARGET_INFLATION) - safeNumber(state.perceived?.inflation, TARGET_INFLATION)) / 6;
      const target = clamp(
        12
          + safeNumber(asset.stockDrawdownFromPeak, 0) * 45
          + Math.max(0, 50 - safeNumber(asset.fearGreedIndex, 50)) * 0.22
          + safeNumber(financial.creditSpread, 0.02) * 190
          + safeNumber(financial.bankStress, 0.12) * 34
          + safeNumber(state.sentiment?.policyUncertainty, 0.12) * 18
          + safeNumber(info.rumorIntensity, 0) * 22
          + surprise * 18,
        8,
        88
      );
      return clamp(smoothValue(safeNumber(asset.stockVolatilityIndex, 18), target, target > asset.stockVolatilityIndex ? 0.12 : 0.08), 8, 70);
    }

    function computeHousingAffordability() {
      const asset = state.assetMarket || createInitialAssetMarket();
      const averageDisposableIncome = Math.max(1, average(state.consumers.map((consumer) => safeNumber(consumer.disposableIncomeTick, consumer.income || effectiveBaseWage() * 0.35))));
      const mortgageRate = safeNumber(state.financialMarket?.loanRate, safeNumber(state.government?.interestRate, 0.03) + 0.02) + safeNumber(asset.mortgageRateSpread, 0.02) * 0.45;
      const priceIncomeRatio = safeNumber(asset.housingIndex, 100) / 100 * (effectiveBaseWage() * 2.8) / averageDisposableIncome;
      return clamp(priceIncomeRatio * (1 + mortgageRate * 4.5), 0.45, 3.2);
    }

    function explainAssetMarketState() {
      const asset = state.assetMarket || createInitialAssetMarket();
      const realEstate = state.realEstate || createInitialRealEstateMarket();
      const stockPoints = formatIndexPoint(asset.stockIndexPoints || asset.stockIndex * 25);
      if (realEstate.commercialVacancy > 0.18 && realEstate.commercialReturn < -0.002) return "상업용 부동산 공실률 상승이 기업 담보가치와 은행 건전성을 압박하고 있습니다.";
      if (realEstate.collateralValueIndex < 88) return "부동산 담보가치 하락이 은행 위험선호와 기업 차입 여건을 약화시키고 있습니다.";
      if (asset.stockReturn < -0.006 && realEstate.residentialReturn < -0.003) return "주식과 주거용 부동산 가격이 동시에 하락해 금융여건이 긴축되고 있습니다.";
      if (safeNumber(asset.stockValuationPressure, 0) > 0.62) return `주가지수는 ${stockPoints}로 상승했지만 기업 이익 증가보다 빨라 밸류에이션 부담이 커지고 있습니다.`;
      if (asset.assetBubbleRisk > 0.65) return "자산가격 상승이 소비심리를 보강하지만 버블 위험도 높아지고 있습니다.";
      if (asset.housingAffordability > 1.55) return "주거용 부동산 가격과 금리 부담이 함께 나타나 주거비 부담이 커지고 있습니다.";
      if (asset.stockReturn < -0.006) return `주가지수 ${stockPoints} 하락으로 가계 자산효과와 기업 투자심리가 약해지고 있습니다.`;
      if (asset.wealthEffect > 0.010) return "자산시장 호조가 가계 소비심리를 소폭 지지하고 있습니다.";
      return "";
    }

    function updateInflationExpectations() {
      const observedInflation = clamp(state.metrics.inflation, -2.2, 4.8);
      state.producers.forEach((producer) => {
        const inventoryAnchor = producer.inventoryBurden > 1.8 ? -0.10 : producer.inventoryBurden < 0.75 ? 0.22 : 0;
        const sentimentExpectation = safeNumber(state.sentiment?.inflationExpectations, TARGET_INFLATION);
        const adaptiveTarget = clamp(observedInflation * 0.45 + sentimentExpectation * 0.24 + TARGET_INFLATION * 0.31 + inventoryAnchor + safeNumber(state.sentiment?.safeHavenSentiment, 0.1) * 0.18 - safeNumber(state.sentiment?.policyCredibility, 0.75) * 0.06, 0.15, 4.8);
        const anchoredTarget = adaptiveTarget * 0.98 + TARGET_INFLATION * 0.02;
        producer.expectedInflation = clamp(smoothValue(producer.expectedInflation, anchoredTarget, 0.052), 0, 4.2);
      });
    }

    // 인플레이션과 실업이 높으면 소비자는 다음 틱에서 더 조심스럽게 지출한다.
    function advanceShockClock() {
      if (state.shock.ticksRemaining > 0) {
        state.shock.ticksRemaining -= 1;
        if (state.shock.ticksRemaining === 0) {
          state.shock = {
            label: "충격 없음",
            ticksRemaining: 0,
            demandMultiplier: 1,
            productivityMultiplier: 1,
            pricePressure: 0
          };
          pushEvent("일시적 충격 효과가 사라졌습니다.");
        }
      }
    }

    function triggerRandomShock() {
      const shocks = ["recession", "supply", "inflation", "creditCrunch", "creditExcess", "bondVolatility", "depositorAnxiety", "longRateSpike", "safeHavenSurge"];
      applyShock(shocks[Math.floor(rand(0, shocks.length))]);
    }

    function applyScenario(name) {
      const scenarios = getAllScenarioPresets();
      const scenario = scenarios[name] || scenarios.baseline;

      els.interestSlider.value = scenario.interest;
      els.taxSlider.value = scenario.tax;
      els.corporateTaxSlider.value = scenario.corporateTax;
      els.vatSlider.value = scenario.vat ?? 10;
      els.spendingSlider.value = scenario.spending;
      els.wageSlider.value = scenario.wage;
      els.inflationSlider.value = scenario.inflation;
      updateControlLabels();
      state.running = false;
      resetSimulation();
      if (scenario.shock) applyShock(scenario.shock);
      applyCalibrationState(scenario);
      if (historicalScenarioKeys().includes(name)) {
        state.historicalScenario = {
          ...createInitialHistoricalScenario(),
          active: false,
          key: name,
          label: scenario.label,
          currentPhaseLabel: "즉시 프리셋",
          currentShock: scenario.message || "역사 시나리오 즉시 프리셋",
          intensity: 0.58
        };
        syncHistoricalScenarioMetrics();
      }
      state.game.scenarioName = scenario.label || "사용자 시나리오";
      addEventMarker("시나리오");
      pushEvent(scenario.message);
      safeUpdateAllDisplays();
    }

    function getAllScenarioPresets() {
      return { ...getCalibrationPresets(), ...getHistoricalScenarioPresets() };
    }

    function getHistoricalScenarioPresets() {
      return {
        koreaImf1997: { label: "한국 IMF 1997", interest: 18.0, tax: 17, corporateTax: 22, vat: 10, spending: 840, wage: 11.2, inflation: 1.05, shock: "recession", creditEvent: "creditCrunch", externalShock: 0.74, commodity: 128, bankStress: 0.68, assetSentiment: 0.18, householdConfidence: 0.48, businessConfidence: 0.38, cbCredibility: 0.50, foreignInvestorSentiment: 0.18, foreignBondDemand: 0.24, foreignSupplierPressure: 0.48, message: "역사 프리셋: 한국 IMF 1997형 외환·신용 긴축을 적용했습니다." },
        usFinancialCrisis2007: { label: "미국 금융위기 2007", interest: 5.25, tax: 15, corporateTax: 20, vat: 8, spending: 920, wage: 12.5, inflation: 0.72, shock: "recession", creditEvent: "creditCrunch", externalShock: 0.22, commodity: 110, bankStress: 0.72, assetSentiment: 0.16, householdConfidence: 0.52, businessConfidence: 0.46, cbCredibility: 0.78, housingBias: 0.18, stockBias: 0.24, foreignInvestorSentiment: 0.44, foreignBondDemand: 0.70, message: "역사 프리셋: 미국 2007형 주택담보 신용위기를 적용했습니다." },
        japanBubbleEconomy: { label: "일본 버블경제", interest: 1.25, tax: 14, corporateTax: 16, vat: 5, spending: 760, wage: 13.1, inflation: 0.48, shock: null, creditEvent: "creditExcess", externalShock: 0.08, commodity: 98, bankStress: 0.06, assetSentiment: 0.92, householdConfidence: 0.92, businessConfidence: 0.96, cbCredibility: 0.82, housingBias: 0.92, stockBias: 0.88, foreignInvestorSentiment: 0.86, foreignBondDemand: 0.82, message: "역사 프리셋: 일본 버블경제형 자산·신용 과열을 적용했습니다." },
        germanyReunification: { label: "통일 이후 독일", interest: 6.8, tax: 21, corporateTax: 24, vat: 14, spending: 1320, wage: 15.0, inflation: 0.82, shock: null, externalShock: 0.10, commodity: 104, bankStress: 0.18, assetSentiment: 0.58, householdConfidence: 0.78, businessConfidence: 0.62, cbCredibility: 0.84, productivityBoost: -0.04, foreignDemand: 104, foreignInvestorSentiment: 0.66, foreignBondDemand: 0.62, message: "역사 프리셋: 통일 이후 독일형 재정이전·생산성 격차를 적용했습니다." },
        turkiyeInflation2018: { label: "튀르키예 고물가 2018", interest: 20.0, tax: 16, corporateTax: 22, vat: 18, spending: 760, wage: 15.2, inflation: 1.35, shock: "inflation", creditEvent: "longRateSpike", externalShock: 0.82, commodity: 164, bankStress: 0.44, assetSentiment: 0.20, householdConfidence: 0.42, businessConfidence: 0.38, cbCredibility: 0.34, foreignInvestorSentiment: 0.22, foreignBondDemand: 0.30, foreignSupplierPressure: 0.78, message: "역사 프리셋: 튀르키예 2018형 환율·고물가 충격을 적용했습니다." }
      };
    }

    function historicalScenarioKeys() {
      return Object.keys(getHistoricalScenarioPresets());
    }

    function applyHistoricalScenarioPreset(key) {
      const scenario = getHistoricalScenarioPresets()[key];
      if (!scenario) return false;
      applyScenario(key);
      return true;
    }

    function startHistoricalScenarioTimeline(key) {
      const scenario = getHistoricalScenarioPresets()[key];
      if (!scenario) {
        showToast("역사 전개 없음", "선택한 항목은 단계형 역사 시나리오가 아닙니다.");
        return;
      }
      state.running = false;
      resetSimulation();
      if (scenario.shock) applyShock(scenario.shock);
      applyCalibrationState(scenario);
      const phases = getHistoricalScenarioTimeline(key);
      state.historicalScenario = {
        active: true,
        key,
        label: scenario.label,
        month: 0,
        phaseIndex: 0,
        phaseMonth: 0,
        phases,
        currentPhaseLabel: phases[0]?.label || "초기 충격",
        currentShock: phases[0]?.message || scenario.message,
        intensity: safeNumber(phases[0]?.effects?.historicalIntensity, 0.65)
      };
      state.game.scenarioName = `${scenario.label} · 단계형`;
      addEventMarker("역사 전개");
      pushEvent(`${scenario.label}: 단계형 역사 전개를 시작했습니다.`);
      applyHistoricalPhaseEffects(phases[0]?.effects || {}, true);
      safeUpdateAllDisplays();
      updateRunState();
    }

    function setPolicyLevel(levels = {}) {
      if (levels.interest !== undefined) els.interestSlider.value = clamp(levels.interest, 0, 20).toFixed(2);
      if (levels.tax !== undefined) els.taxSlider.value = clamp(levels.tax, 0, 45).toFixed(1);
      if (levels.corporateTax !== undefined) els.corporateTaxSlider.value = clamp(levels.corporateTax, 0, 45).toFixed(1);
      if (levels.vat !== undefined) els.vatSlider.value = clamp(levels.vat, 0, 25).toFixed(1);
      if (levels.spending !== undefined) els.spendingSlider.value = clamp(levels.spending, 0, 1600).toFixed(0);
      if (levels.wage !== undefined) els.wageSlider.value = clamp(levels.wage, 5, 30).toFixed(1);
      syncLivePolicy();
      updateControlLabels();
    }


    function advanceHistoricalScenarioTimeline() {
      const hs = state.historicalScenario;
      if (!hs || !hs.active || !hs.phases.length || state.tick % TICKS_PER_MONTH !== 0) return;
      hs.month += 1;
      hs.phaseMonth += 1;
      const current = hs.phases[hs.phaseIndex] || hs.phases[hs.phases.length - 1];
      applyHistoricalPhaseEffects(current.effects || {});
      hs.currentPhaseLabel = current.label;
      hs.currentShock = current.message;
      hs.intensity = smoothValue(safeNumber(hs.intensity, 0), safeNumber(current.effects?.historicalIntensity, 0.35), 0.28);
      if (hs.phaseMonth >= current.months) {
        hs.phaseIndex += 1;
        hs.phaseMonth = 0;
        if (hs.phaseIndex >= hs.phases.length) {
          hs.active = false;
          hs.currentPhaseLabel = "완료";
          hs.currentShock = "역사 시나리오 전개가 종료되었습니다.";
          hs.intensity = 0;
          pushEvent(`${hs.label}: 단계형 역사 전개가 종료되었습니다.`);
        } else {
          const next = hs.phases[hs.phaseIndex];
          hs.currentPhaseLabel = next.label;
          hs.currentShock = next.message;
          pushEvent(`${hs.label}: ${next.label} 단계로 이동했습니다.`);
          applyHistoricalPhaseEffects(next.effects || {});
        }
      }
      syncHistoricalScenarioMetrics();
    }

    function syncHistoricalScenarioMetrics() {
      const hs = state.historicalScenario || createInitialHistoricalScenario();
      state.metrics.historicalScenarioActive = hs.active ? 1 : 0;
      state.metrics.historicalScenarioIntensity = clamp(safeNumber(hs.intensity, 0), 0, 1);
      state.metrics.historicalScenarioKey = hs.key || "";
      state.metrics.historicalScenarioLabel = hs.label || "비활성";
      state.metrics.historicalScenarioPhase = hs.currentPhaseLabel || "비활성";
      state.metrics.historicalScenarioShock = hs.currentShock || "없음";
    }

    function historicalScenarioStatusLabel() {
      const hs = state.historicalScenario || createInitialHistoricalScenario();
      if (!hs.key) return "비활성";
      const phase = hs.currentPhaseLabel || "비활성";
      if (!hs.active) return phase === "완료" ? `${hs.label} · 완료` : `${hs.label} · 즉시 프리셋`;
      const current = hs.phases?.[hs.phaseIndex];
      const remaining = Math.max(0, safeNumber(current?.months, 0) - safeNumber(hs.phaseMonth, 0));
      return `${hs.label} · ${phase} · ${remaining}개월`;
    }

    function hireConsumer(producer, consumer) {
      return hireConsumerEngine(createLaborMarketContext(), producer, consumer);
    }

    function fireConsumer(producer, consumer) {
      return fireConsumerEngine(createLaborMarketContext(), producer, consumer);
    }

    function calculateUnemploymentRate() {
      const employed = state.consumers.filter((consumer) => consumer.employed).length;
      return (1 - employed / Math.max(1, state.consumers.length)) * 100;
    }

    // ===== 차트 =====
    function createChartContext() {
      return {
        state,
        els,
        documentRef: document,
        windowRef: window,
        helpers: {
          compactMoney,
          createInitialUiState,
          formatIndexPoint,
          isChartAvailable,
          isLargeEconomyMode,
          round,
          safeNumber,
          shouldUpdateChartData,
          syncUiPerformanceState
        },
        callbacks: {
          pushEvent
        }
      };
    }

    function setupCharts() {
      setupChartsPanel(createChartContext());
    }

    function setupChartDatasetToggles() {
      setupChartDatasetTogglesPanel(createChartContext());
    }

    function clearCharts() {
      clearChartsPanel(createChartContext());
    }

    function updateCharts(force = false) {
      updateChartsPanel(createChartContext(), force);
    }

    // ===== 경제 모형 분석실 =====
    // 무거운 계산을 피하고, 현재 에이전트 경제를 해석하는 작은 교육용 모형만 제공한다.
    function renderModelInputs() {
      const definitions = getModelDefinitions();
      const selected = els.modelSelector.value || "keynesian";
      els.modelInputs.innerHTML = definitions[selected].map((input) => `
        <label class="model-input">
          <span>${input.label}</span>
          <input id="modelInput_${input.key}" type="number" step="${input.step}" value="${input.value}">
          ${input.help ? `<small class="hint">${input.help}</small>` : ""}
        </label>
      `).join("");
      definitions[selected].forEach((input) => {
        const element = document.getElementById(`modelInput_${input.key}`);
        if (element) element.addEventListener("change", runSelectedEconomicModel);
      });
    }

    function getModelInputs() {
      const values = {};
      const definitions = getModelDefinitions()[els.modelSelector.value || "keynesian"];
      definitions.forEach((input) => {
        const element = document.getElementById(`modelInput_${input.key}`);
        values[input.key] = safeNumber(Number(element && element.value), input.value);
      });
      return values;
    }

    function setModelInput(key, value, digits = 2) {
      const element = document.getElementById(`modelInput_${key}`);
      if (!element) return;
      element.value = Number(safeNumber(value, 0).toFixed(digits));
    }

    function loadCurrentEconomyIntoModel() {
      const economy = getCurrentEconomySnapshot();
      const selected = els.modelSelector.value || "keynesian";
      if (selected === "keynesian") {
        setModelInput("mpc", clamp(0.62 + state.metrics.averageConfidence * 0.12, 0.45, 0.9), 2);
        setModelInput("deltaG", economy.governmentSpending * 0.10, 0);
        setModelInput("deltaIncomeTax", economy.householdIncomeTaxRate - 16, 1);
        setModelInput("deltaCorporateTax", economy.corporateTaxRate - 18, 1);
        setModelInput("autonomousInvestment", Math.max(10, economy.investment), 0);
        setModelInput("nx", 0, 0);
      }
      if (selected === "phillips") {
        setModelInput("unemployment", economy.unemployment, 2);
        setModelInput("naturalUnemployment", TARGET_UNEMPLOYMENT, 2);
        setModelInput("expectedInflation", clamp(economy.inflation * 0.6 + TARGET_INFLATION * 0.4, -2, 8), 2);
        setModelInput("beta", 0.45, 2);
        setModelInput("supplyShock", state.shock.pricePressure * 100, 2);
      }
      if (selected === "taylor") {
        setModelInput("currentInflation", economy.inflation, 2);
        setModelInput("targetInflation", TARGET_INFLATION, 2);
        setModelInput("neutralRate", NEUTRAL_INTEREST_RATE, 2);
        setModelInput("outputGap", economy.outputGap, 2);
        setModelInput("inflationWeight", 1.5, 2);
        setModelInput("outputWeight", 0.5, 2);
      }
      runSelectedEconomicModel();
    }

    function runSelectedEconomicModel() {
      const model = els.modelSelector.value || "keynesian";
      const inputs = getModelInputs();
      const economy = getCurrentEconomySnapshot();
      let result;
      if (model === "keynesian") result = runKeynesianModel(inputs, economy);
      if (model === "phillips") result = runPhillipsModel(inputs, economy);
      if (model === "taylor") result = runTaylorRuleModel(inputs, economy);
      if (!result) return;
      const policyLine = result.policyLine ? `<span class="model-policy-line">${result.policyLine}</span>` : "";
      els.modelResultSummary.innerHTML = `<strong>${result.title}</strong><br>${result.summary}${policyLine}`;
      els.modelInterpretation.textContent = explainModelResult(result);
      updateModelChart(result.chart);
      updateModelComparison(economy);
    }

    function updateModelChart(chartData) {
      const chart = state.charts.model;
      if (!chart || !chartData) return;
      if (isElementInClosedDetails(chart.canvas)) return;
      chart.data.labels = chartData.labels;
      chart.data.datasets[0].label = "모형";
      chart.data.datasets[0].data = chartData.series.map((value) => round(value, 2));
      chart.data.datasets[1].label = "기준선";
      chart.data.datasets[1].data = chartData.reference.map((value) => round(value, 2));
      chart.update("none");
    }

    function explainModelResult(result) {
      return result.interpretation;
    }

    function updateModelComparison(economy) {
      const keynesianView = economy.outputGap < -2 ? "케인즈: 총수요가 잠재 산출보다 약합니다." : "케인즈: 총수요는 잠재 산출 근처에서 유지됩니다.";
      const phillipsView = economy.unemploymentGap > 1 ? "필립스: 노동시장 여유가 물가 압력을 낮춥니다." : economy.unemploymentGap < -1 ? "필립스: 노동시장 타이트함이 물가 압력을 높입니다." : "필립스: 실업률은 자연실업률 근처입니다.";
      const taylorSuggested = NEUTRAL_INTEREST_RATE + 1.5 * (economy.inflation - TARGET_INFLATION) + 0.5 * economy.outputGap;
      const taylorView = economy.interestRate > taylorSuggested + 0.75 ? "테일러: 정책은 권고보다 긴축적입니다." : economy.interestRate < taylorSuggested - 0.75 ? "테일러: 정책은 권고보다 완화적입니다." : "테일러: 정책은 중립에 가깝습니다.";
      els.modelComparisonList.innerHTML = [keynesianView, phillipsView, taylorView]
        .map((text) => `<li>${text}</li>`)
        .join("");
    }

    function updateAllDisplays() {
      syncUiPerformanceState();
      updateControlLabels();
      updateRunState();
      updateKpis();
      updateInspector();
      updateGameDisplay();
      renderDebugLog();
    }

    function syncUiPerformanceState() {
      if (!state.ui) state.ui = createInitialUiState();
      state.ui.largeEconomyMode = isLargeEconomyMode();
    }

    function createInitialUiState() {
      return {
        detailMode: "summary",
        activeDetailGroup: "overview",
        largeEconomyMode: false,
        lastInspectorUpdateTick: -1,
        lastChartUpdateTick: -1,
        lastCanvasRenderTick: -1,
        lastHeavyInspectorTick: -1,
        compactResults: true,
        chartsAvailable: true,
        canvasPositionCacheKey: "",
        kpiAnimationFrameIds: {},
        lazyResultCache: {},
        openDetailGroups: {}
      };
    }

    function setTextIfChanged(element, nextText) {
      if (!element) return false;
      const text = String(nextText ?? "");
      if (element.textContent === text) return false;
      element.textContent = text;
      return true;
    }

    function setHtmlIfChanged(element, nextHtml) {
      if (!element) return false;
      const html = String(nextHtml ?? "");
      if (element.innerHTML === html) return false;
      element.innerHTML = html;
      return true;
    }

    function safeOn(element, eventName, handler, label = "") {
      if (!element || typeof element.addEventListener !== "function") {
        if (label) console.warn(`선택 UI 요소를 찾을 수 없습니다: ${label}`);
        return false;
      }
      element.addEventListener(eventName, handler);
      return true;
    }

    function clearLazyResultCache() {
      if (!state.ui) state.ui = createInitialUiState();
      state.ui.lazyResultCache = {};
    }

    function setLazyResultCache(key, html) {
      if (!state.ui) state.ui = createInitialUiState();
      if (!state.ui.lazyResultCache) state.ui.lazyResultCache = {};
      state.ui.lazyResultCache[key] = String(html || "");
    }

    function getLazyResultCache(key) {
      return state.ui?.lazyResultCache?.[key] || "";
    }

    function isChartAvailable() {
      return !!(window.Chart && state.ui && state.ui.chartsAvailable !== false);
    }

    function shouldUpdateChartData(chart) {
      if (!isChartAvailable() || !chart || !chart.canvas) return false;
      return !isElementInClosedDetails(chart.canvas);
    }

    function cancelKpiAnimation(element) {
      if (!element || !element.dataset || !element.dataset.kpiAnimationId) return;
      const id = Number(element.dataset.kpiAnimationId);
      if (Number.isFinite(id)) {
        const cancel = window.cancelAnimationFrame || window.clearTimeout;
        cancel(id);
      }
      delete element.dataset.kpiAnimationId;
    }

    function getCanvasPositionCacheKey(width, height, ratio) {
      return [
        Math.round(width),
        Math.round(height),
        round(safeNumber(ratio, 1), 2),
        state.consumers.length,
        state.producers.length,
        isLargeEconomyMode() ? "large" : state.config.performanceMode
      ].join("|");
    }

    function isElementInClosedDetails(element) {
      const details = element && element.closest && element.closest("details");
      return !!details && !details.open;
    }

    function shouldUpdateHeavyInspector() {
      if (!state.ui) state.ui = createInitialUiState();
      const interval = isLargeEconomyMode() ? 24 : state.config.performanceMode === "light" ? 12 : 6;
      if (state.tick <= 2) return true;
      if (state.tick - safeNumber(state.ui.lastHeavyInspectorTick, -9999) < interval) return false;
      state.ui.lastHeavyInspectorTick = state.tick;
      return true;
    }

    function updateControlLabels() {
      els.speedValue.textContent = `${Number(els.speedSlider.value)} 단계/초`;
      els.consumerValue.textContent = `${Number(els.consumerSlider.value)}명`;
      els.producerValue.textContent = `${Number(els.producerSlider.value)}개`;
      els.interestValue.textContent = policyLabel("interest", `${Number(els.interestSlider.value).toFixed(2)}%`, (value) => percent(value * 100, 2));
      els.taxValue.textContent = policyLabel("tax", `${Number(els.taxSlider.value).toFixed(1)}%`, (value) => percent(value * 100, 1));
      els.corporateTaxValue.textContent = policyLabel("corporateTax", `${Number(els.corporateTaxSlider.value).toFixed(1)}%`, (value) => percent(value * 100, 1));
      els.vatValue.textContent = policyLabel("vat", `${Number(els.vatSlider.value).toFixed(1)}%`, (value) => percent(value * 100, 1));
      els.spendingValue.textContent = policyLabel("spending", money(Number(els.spendingSlider.value)), (value) => money(value));
      els.wageValue.textContent = policyLabel("wage", money(Number(els.wageSlider.value), 1), (value) => money(value, 1));
      els.inflationSensitivityValue.textContent = Number(els.inflationSlider.value).toFixed(2);
      updatePolicySliderMarkers();
    }

    function policyLabel(key, fallbackTarget, formatter) {
      const meta = POLICY_META[key];
      if (!state.policy || !meta) return fallbackTarget;
      const target = formatter(state.policy[meta.target]);
      const effective = formatter(state.policy[meta.effective]);
      return `목표 ${target} / 유효 ${effective}`;
    }

    function updatePolicySliderMarkers() {
      [
        ["interest", els.interestSlider, 100],
        ["tax", els.taxSlider, 100],
        ["corporateTax", els.corporateTaxSlider, 100],
        ["vat", els.vatSlider, 100],
        ["spending", els.spendingSlider, 1],
        ["wage", els.wageSlider, 1]
      ].forEach(([key, input, multiplier]) => {
        const meta = POLICY_META[key];
        if (!input || !meta || !state.policy) {
          setSliderMarkerStyle(input);
          return;
        }
        setSliderMarkerStyle(
          input,
          safeNumber(state.policy[meta.target], Number(input.value) / multiplier) * multiplier,
          safeNumber(state.policy[meta.effective], Number(input.value) / multiplier) * multiplier
        );
      });
      setSliderMarkerStyle(els.inflationSlider);
    }

    function setSliderMarkerStyle(input, targetValue = null, effectiveValue = null) {
      if (!input) return;
      const min = safeNumber(Number(input.min), 0);
      const max = safeNumber(Number(input.max), 100);
      const current = safeNumber(Number(input.value), min);
      const toPercent = (value) => `${clamp((safeNumber(value, current) - min) / Math.max(0.0001, max - min) * 100, 0, 100).toFixed(2)}%`;
      input.style.setProperty("--range-fill", toPercent(current));
      input.style.setProperty("--target-pos", toPercent(targetValue ?? current));
      input.style.setProperty("--effective-pos", toPercent(effectiveValue ?? current));
      input.title = targetValue === null || effectiveValue === null
        ? `현재 ${current}`
        : `목표 ${round(targetValue, 2)} / 유효 ${round(effectiveValue, 2)}`;
    }

    function updateRunState() {
      els.runState.textContent = state.running ? "실행 중" : "일시정지";
      els.runPulse.classList.toggle("running", state.running);
      els.tickDisplay.textContent = String(state.tick);
    }

    function updateKpis() {
      applyKpiHierarchy();
      setKpiMetric(els.gdpValue, "gdp", state.metrics.gdp, macroMoney, { goodWhenUp: true, pulseThreshold: 120 });
      els.outputValue.textContent = `C+I+G 기준 총수요`;
      setKpiMetric(els.consumptionValue, "consumption", state.metrics.consumption, macroMoney, { goodWhenUp: true, pulseThreshold: 60 });
      setKpiMetric(els.investmentValue, "investment", state.metrics.investment, macroMoney, { goodWhenUp: true, pulseThreshold: 25 });
      setKpiMetric(els.unemploymentValue, "unemploymentRate", state.metrics.unemploymentRate, (value) => percent(value), { goodWhenUp: false, suffix: "p", pulseThreshold: 0.65 });
      els.employmentValue.textContent = `고용 ${state.metrics.employedCount || 0}명`;
      setKpiMetric(els.priceValue, "inflation", state.metrics.inflation, (value) => signedPercent(value), { goodRange: [1, 4], suffix: "p", pulseThreshold: 0.45 });
      els.inflationValue.textContent = `물가 상승률`;
      setKpiMetric(els.rateValue, "interestRatePercent", state.metrics.interestRatePercent, (value) => percent(value, 2), { neutral: true, suffix: "p", pulseThreshold: 0.25 });
      setKpiMetric(els.balanceValue, "governmentBalance", state.metrics.governmentBalance, macroMoney, { goodWhenUp: true, pulseThreshold: 80 });
      els.balanceValue.classList.toggle("negative", state.metrics.governmentBalance < 0);
      els.balanceValue.classList.toggle("positive", state.metrics.governmentBalance >= 0);
      els.debtValue.textContent = `누적 부채 ${macroMoney(state.metrics.governmentDebt)}`;
      setKpiMetric(els.householdCashValue, "averageHouseholdCash", state.metrics.averageHouseholdCash, macroMoney, { goodWhenUp: true, pulseThreshold: 35 });
      els.confidenceValue.textContent = `소비 심리 ${round(state.metrics.averageConfidence, 2).toFixed(2)}`;
      setKpiMetric(els.firmCashValue, "averageFirmCash", state.metrics.averageFirmCash, macroMoney, { goodWhenUp: true, pulseThreshold: 50 });
      els.inventoryValue.textContent = `재고 ${round(state.metrics.totalInventory, 1)} 단위`;
      updateKpiStatusClasses();
      const shockMonthsLeft = round(state.shock.ticksRemaining / TICKS_PER_MONTH, 1);
      const shockText = state.shock.ticksRemaining > 0
        ? `${state.shock.label} 약 ${shockMonthsLeft}개월 남음`
        : "충격 없음";
      els.shockBadge.textContent = shockText;
    }

    function applyKpiHierarchy() {
      const primary = [els.gdpValue, els.priceValue, els.unemploymentValue, els.rateValue];
      const secondary = [els.consumptionValue, els.investmentValue, els.balanceValue, els.householdCashValue, els.firmCashValue];
      const tertiary = [];
      primary.forEach((element) => setKpiTier(element, "primary"));
      secondary.forEach((element) => setKpiTier(element, "secondary"));
      tertiary.forEach((element) => setKpiTier(element, "tertiary"));
    }

    function setKpiTier(element, tier) {
      const card = element && element.closest(".kpi");
      if (!card) return;
      card.classList.remove("primary", "secondary", "tertiary");
      card.classList.add(tier);
    }

    function updateKpiStatusClasses() {
      setKpiStatus(els.gdpValue, getTrendDelta("gdp") >= 0 ? "good" : "bad");
      setKpiStatus(els.unemploymentValue, state.metrics.unemploymentRate < 7 ? "good" : state.metrics.unemploymentRate < 13 ? "warn" : "bad");
      setKpiStatus(els.priceValue, state.metrics.inflation >= 1 && state.metrics.inflation <= 4 ? "good" : state.metrics.inflation < 7 && state.metrics.inflation > -1 ? "warn" : "bad");
      setKpiStatus(els.rateValue, state.metrics.interestRatePercent < 8 ? "good" : state.metrics.interestRatePercent < 14 ? "warn" : "bad");
      setKpiStatus(els.investmentValue, getTrendDelta("investment") < -5 ? "warn" : "good");
      setKpiStatus(els.balanceValue, state.metrics.governmentBalance >= 0 ? "good" : "warn");
      setKpiStatus(els.consumptionValue, state.metrics.consumerSentiment < 0.45 || getTrendDelta("consumption") < -8 ? "bad" : state.metrics.consumerSentiment < 0.62 ? "warn" : "good");
      setKpiStatus(els.householdCashValue, state.metrics.lowIncomeStress > 0.62 || state.metrics.averageHouseholdCash < effectiveBaseWage() * 2.8 ? "bad" : state.metrics.averageHouseholdDebtBurden > 18 ? "warn" : "good");
      setKpiStatus(els.firmCashValue, state.metrics.averageFirmDSCR < 1.2 || state.metrics.firmVulnerability > 0.62 ? "bad" : state.metrics.averageFirmDSCR < 1.8 ? "warn" : "good");
    }

    function setKpiStatus(element, status) {
      const card = element && element.closest(".kpi");
      if (!card) return;
      card.classList.remove("status-good", "status-warn", "status-bad");
      card.classList.add(`status-${status}`);
    }

    function kpiValueWithTrend(key, value, formatter, options = {}) {
      return `<span class="kpi-value"><span class="kpi-main">${formatter(value)}</span></span>`;
    }

    function setKpiMetric(element, key, value, formatter, options = {}) {
      if (!element) return;
      const previous = Number(element.dataset.displayValue);
      const hasPrevious = Number.isFinite(previous);
      if (hasPrevious && Math.abs(previous - value) < 0.001 && element.querySelector(".kpi-main")) return;

      if (!element.querySelector(".kpi-main")) {
        setHtmlIfChanged(element, kpiValueWithTrend(key, value, formatter, options));
      } else {
        const main = element.querySelector(".kpi-main");
        if (isLargeEconomyMode() || state.config.performanceMode === "light" || state.debug.suppressVisualUpdates) {
          cancelKpiAnimation(main);
          setTextIfChanged(main, formatter(value));
        } else {
          animateKpiNumber(main, hasPrevious ? previous : value, value, formatter);
        }
      }
      element.dataset.displayValue = String(value);
    }

    function animateKpiNumber(element, fromValue, toValue, formatter) {
      cancelKpiAnimation(element);
      if (Math.abs(toValue - fromValue) < 0.001) {
        element.textContent = formatter(toValue);
        return;
      }
      const start = performance.now();
      const duration = 280;
      const raf = window.requestAnimationFrame || ((callback) => window.setTimeout(() => callback(performance.now()), 16));

      function frame(now) {
        const progress = clamp((now - start) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = formatter(fromValue + (toValue - fromValue) * eased);
        if (progress < 1) {
          element.dataset.kpiAnimationId = String(raf(frame));
        } else {
          delete element.dataset.kpiAnimationId;
        }
      }

      element.dataset.kpiAnimationId = String(raf(frame));
    }

    function getTrendDelta(key, windowSize = 8) {
      if (!state.history.length) return 0;
      const current = state.history[state.history.length - 1];
      const previous = state.history[Math.max(0, state.history.length - windowSize - 1)];
      if (!current || !previous || current === previous) return 0;
      return safeNumber(current[key], 0) - safeNumber(previous[key], 0);
    }

    function updateInspector() {
      return updateInspectorPanel(createInspectorContext());
    }

    function createInspectorContext() {
      return {
        els,
        state,
        macroMoney,
        money,
        percent,
        round,
        signedPercent,
        taxCompositionLabel,
        setSentimentPill,
        capacityLabel,
        riskLabel,
        sentimentLabel,
        sectorStressValue,
        sectorDemandLabel,
        valuationPressureLabel,
        clamp,
        sectorCountSummaryLabel,
        creditRatingLabelFromScore,
        formatIndexPoint,
        formatStockReturn,
        stockVolatilityLabel,
        stockRiskSentimentLabel,
        realEstateStressLabel,
        behavioralLabel,
        updateModelReliabilityPanel,
        historicalScenarioStatusLabel,
        updateSentimentPanel,
        updateClassAnalysisPanel,
        updateMarketPsychologyPanel,
        updateInformationGapPanel,
        updateBehaviorPanel,
        renderEarlyWarningPanel,
        renderCausalDecompositionPanel,
        updateTransmissionMap,
        updatePolicyImpactPanel,
        safeUpdateBalanceDiagnostics,
        explainMacroState,
        renderSelectedAgent,
        renderEventLog
      };
    }

    function updateSentimentPanel() {
      if (!state.sentiment || !els.sentConsumerConfidenceValue) return;
      setSentimentPill(els.sentConsumerConfidenceValue, state.sentiment.consumerLabel);
      setSentimentPill(els.sentBusinessConfidenceValue, state.sentiment.businessLabel);
      setSentimentPill(els.sentBankRiskAppetiteValue, state.sentiment.bankRiskLabel);
      setSentimentPill(els.sentMarketRiskValue, state.sentiment.marketRiskLabel);
      els.sentInflationExpectationValue.textContent = signedPercent(state.sentiment.inflationExpectations);
      setSentimentPill(els.sentRecessionFearValue, state.sentiment.recessionLabel, true);
      setSentimentPill(els.sentFiscalCredibilityValue, state.sentiment.fiscalCredibilityLabel);
      els.sentimentNarrativeValue.textContent = explainSentimentState();
    }

    function updateClassAnalysisPanel() {
      if (!els.classAnalysisPanelValue) return;
      if (isElementInClosedDetails(els.classAnalysisPanelValue) && !shouldUpdateHeavyInspector()) return;
      if (!state.classAnalysis || !state.classAnalysis.classes) computeClassMetrics();
      const classes = state.classAnalysis?.classes || {};
      const html = householdClassOrder().map((item) => {
        const c = classes[item.key] || createInitialClassAnalysis().classes[item.key];
        const riskStyle = c.status === "약함" || c.status === "위험";
        return `
          <div class="class-card">
            <div class="class-card-head">
              <span>${escapeHtml(c.label)}</span>
              <span>${percent(c.populationShare, 0)}</span>
            </div>
            소득 <strong>${money(c.averageIncome, 1)}</strong> / 자산 <strong>${money(c.averageAssets, 0)}</strong><br>
            부채부담 <strong>${percent(c.debtBurden, 1)}</strong> / 주거부담 <strong>${percent(c.housingBurden, 1)}</strong><br>
            소비심리 <span class="sentiment-meter ${sentimentPillClass(c.status, riskStyle)}">${c.status}</span>
            <br>압박: <strong>${escapeHtml(c.mainPressure)}</strong><br>
            요구: ${escapeHtml(c.policyDemand)}
          </div>
        `;
      }).join("");
      setHtmlIfChanged(els.classAnalysisPanelValue, html);
    }

    function setSentimentPill(element, label, riskStyle = false) {
      if (!element) return;
      const text = label || "보통";
      setHtmlIfChanged(element, `<span class="sentiment-meter ${sentimentPillClass(text, riskStyle)}">${text}</span>`);
    }

    function sentimentPillClass(label, riskStyle = false) {
      if (riskStyle) {
        if (label === "높음" || label === "위험" || label === "공포" || label === "극단적 공포" || label === "불안" || label === "비관") return "danger";
        if (label === "보통" || label === "주의" || label === "탐욕" || label === "극단적 탐욕") return "warning";
        return "";
      }
      if (label === "약함" || label === "주의" || label === "공포" || label === "탐욕") return "warning";
      if (label === "위험" || label === "극단적 공포" || label === "극단적 탐욕" || label === "불안") return "danger";
      return "";
    }

    function explainSentimentState() {
      if (!state.sentiment) return "심리 지표가 아직 형성되지 않았습니다.";
      const s = state.sentiment;
      if (s.consumerConfidence < 0.45) return "소비심리가 낮아 소득이 회복되어도 소비가 천천히 살아날 수 있습니다.";
      if (s.businessConfidence < 0.45) return "기업심리가 약해 현재 이익이 있어도 투자와 채용이 지연될 수 있습니다.";
      if (s.bankRiskAppetite < 0.45) return "은행 위험선호가 낮아 신용공급 회복이 느릴 수 있습니다.";
      if (s.recessionFear > 0.60) return "경기침체 우려가 높아 가계와 기업 모두 현금 보유를 선호합니다.";
      if (s.fiscalCredibility < 0.45) return "재정 신뢰도가 낮아 지출 확대 효과가 국채금리 상승으로 일부 상쇄될 수 있습니다.";
      if (s.assetBubblePsychology > 0.65) return "자산가격 기대가 강해 소비심리는 좋아지지만 버블 취약성도 커집니다.";
      return "심리와 기대는 대체로 보통 범위에서 움직이고 있습니다.";
    }

    function updateMarketPsychologyPanel() {
      if (!els.stockFearIndexValue) return;
      els.stockFearIndexValue.textContent = round(state.metrics.stockVolatilityIndex, 0).toFixed(0);
      setSentimentPill(els.fearGreedValue, state.metrics.fearGreedLabel || "중립", state.metrics.fearGreedIndex < 40);
      setSentimentPill(els.rumorIntensityValue, intensityLabel(state.metrics.rumorIntensity), true);
      setSentimentPill(els.informationUncertaintyValue, intensityLabel(state.metrics.informationUncertainty), true);
      setSentimentPill(els.safeHavenPsychologyValue, intensityLabel((state.metrics.safeHavenDemand || 0) / 100), true);
      setSentimentPill(els.stockExpectationValue, expectationMoodLabel(state.metrics.stockExpectation), state.metrics.stockExpectation < -2);
      setSentimentPill(els.stockVolatilityIndexValue, state.metrics.stockVolatilityIndexLabel || stockVolatilityIndexLabel(state.metrics.stockVolatilityIndex), state.metrics.stockVolatilityIndex > 35);
    }

    function updateInformationGapPanel() {
      if (!els.householdInfoAccuracyValue) return;
      setSentimentPill(els.householdInfoAccuracyValue, accuracyLabel(state.metrics.householdInformationAccuracy));
      setSentimentPill(els.firmDemandPerceptionValue, perceptionGapLabel(state.perceived?.expectedDemand, state.metrics.salesPressure));
      setSentimentPill(els.bankRiskPerceptionValue, perceptionGapLabel(state.perceived?.bankStress, state.metrics.bankStress));
      setSentimentPill(els.marketOverreactionValue, intensityLabel(state.metrics.marketOverreaction), true);
      setSentimentPill(els.policyClarityValue, accuracyLabel(state.metrics.policyClarity));
      setSentimentPill(els.misperceptionIndexValue, intensityLabel(state.metrics.misperceptionIndex), true);
      els.informationNarrativeValue.textContent = explainInformationState();
    }

    function updateBehaviorPanel() {
      if (!els.realEstateBeliefValue) return;
      setSentimentPill(els.realEstateBeliefValue, behavioralLabel(state.metrics.realEstateNeverFallsBelief), state.metrics.realEstateNeverFallsBelief > 0.70);
      setSentimentPill(els.stockBeliefValue, behavioralLabel(state.metrics.stockMarketNeverFailsBelief), state.metrics.stockMarketNeverFailsBelief > 0.70);
      setSentimentPill(els.herdIntensityValue, behavioralLabel(state.metrics.herdIntensity), state.metrics.herdIntensity > 0.62);
      setSentimentPill(els.fomoIntensityValue, behavioralLabel(state.metrics.fomoIntensity), state.metrics.fomoIntensity > 0.62);
      setSentimentPill(els.lossAversionValue, behavioralLabel(state.metrics.lossAversion), state.metrics.lossAversion > 0.72);
      setSentimentPill(els.confirmationBiasValue, behavioralLabel(state.metrics.confirmationBias), state.metrics.confirmationBias > 0.66);
      setSentimentPill(els.panicSellingValue, behavioralLabel(state.metrics.panicSellingPressure), state.metrics.panicSellingPressure > 0.55);
      setSentimentPill(els.behaviorMispricingValue, behavioralLabel(state.metrics.behavioralMispricingIndex), state.metrics.behavioralMispricingIndex > 0.65);
      els.behaviorNarrativeValue.textContent = explainBehavioralState();
    }

    function explainBehavioralState() {
      if (state.metrics.housingMispricing > 18 && state.metrics.realEstateNeverFallsBelief > 0.62) return "부동산 가격은 기초 여건보다 높지만 불패 믿음이 수요를 지지하고 있습니다.";
      if (state.metrics.stockMispricing > 22 && state.metrics.stockMarketNeverFailsBelief > 0.62) return "기업 이익 대비 주가지수 상승이 빠르지만 저가매수 믿음과 FOMO가 매수세를 유지합니다.";
      if (state.metrics.panicSellingPressure > 0.55) return "손실회피가 패닉 매도 압력으로 전환되어 자산가격과 신용여건이 동시에 흔들릴 수 있습니다.";
      if (state.metrics.herdIntensity > 0.62 && state.metrics.informationUncertainty > 0.40) return "정보 격차와 군중심리가 결합되어 기초여건보다 시장 반응이 커질 수 있습니다.";
      if (state.metrics.confirmationBias > 0.64) return "확증편향이 강해져 경제 주체가 현재 믿음과 다른 위험 신호를 늦게 반영합니다.";
      return "행동 편향은 현재 관리 가능한 범위이며 기초여건을 점진적으로 따라가고 있습니다.";
    }

    function explainInformationState() {
      if (state.metrics.rumorIntensity > 0.45) return "루머가 실제 지표보다 먼저 심리와 시장 가격에 반영되고 있습니다.";
      if (state.metrics.misperceptionIndex > 0.55) return "경제 주체의 인식과 실제 지표 사이의 차이가 커져 과잉반응 위험이 있습니다.";
      if (state.metrics.policyClarity < 0.45) return "정책 방향이 불명확해 금리 경로와 투자 판단이 지연될 수 있습니다.";
      if (state.metrics.householdInformationAccuracy < 0.45) return "가계는 물가와 고용 뉴스를 늦게 반영해 소비 회복이 느릴 수 있습니다.";
      return "정보 격차는 관리 가능한 범위이며, 심리는 실제 지표를 점진적으로 따라가고 있습니다.";
    }

    function updateTransmissionMap() {
      if (!els.transmissionMapValue) return;
      const chain = getDominantTransmissionChain();
      setHtmlIfChanged(els.transmissionMapValue, chain.map((node) => `<div class="chain-node">${escapeHtml(node)}</div>`).join(""));
    }

    function renderCausalDecompositionPanel() {
      if (!state.causalDecomposition || !state.causalDecomposition.categories?.length) updateCausalDecomposition();
      const rows = (state.causalDecomposition.categories || [])
        .slice()
        .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
        .slice(0, 4);
      const html = rows.length ? rows.map((item) => {
        const width = clamp(Math.abs(item.score), 6, 100);
        const tone = item.score >= 45 ? "#c8483f" : item.score >= 18 ? "#d88931" : item.score <= -18 ? "#247173" : "#6bb58e";
        return `
          <div style="margin:6px 0;">
            <div style="display:flex; justify-content:space-between; gap:8px;">
              <strong>${escapeHtml(item.label)}</strong><span>${formatSigned(item.score, 0)} · ${escapeHtml(item.target)}</span>
            </div>
            <div style="height:6px; background:rgba(22,48,46,0.08); border-radius:999px; overflow:hidden;">
              <div style="height:100%; width:${width}%; background:${tone}; border-radius:999px;"></div>
            </div>
          </div>
        `;
      }).join("") : "경제 신호가 누적되면 원인 분해가 표시됩니다.";
      setHtmlIfChanged(els.causalDecompositionValue, html);
    }

    function renderEarlyWarningPanel() {
      if (!state.earlyWarning || !state.earlyWarning.items?.length) updateEarlyWarningSystem();
      const top = state.earlyWarning.topRisks || [];
      const summary = top.length ? top.map((item) => {
        const cls = item.level === "위험" ? "danger" : item.level === "주의" ? "warning" : "";
        return `<span class="sentiment-meter ${cls}">${escapeHtml(item.label)} ${item.score}</span>`;
      }).join(" ") : "경보 없음";
      const reason = state.metrics.earlyWarningReason ? `<div class="subtle" style="margin-top:6px;">원인: ${escapeHtml(state.metrics.earlyWarningReason)}</div>` : "";
      setHtmlIfChanged(els.earlyWarningSummaryValue, `${summary}${reason}`);
      const detail = (state.earlyWarning.items || []).map((item) => `${item.label}: ${item.level} ${item.score}`).join(" · ");
      setTextIfChanged(els.earlyWarningDetailValue, detail || "안정");
    }

    function isFirmActuallyStressed(producer) {
      const payrollNeed = producer.wageOffered * Math.max(1, producer.employees.length);
      const debtServicePressure = producer.interestCostTick / Math.max(1, producer.revenueTick + producer.govRevenueTick + Math.max(0, producer.lastProfit) + producer.cash * 0.04);
      const healthyCashFlow = producer.lastProfit >= 0 && producer.cash > payrollNeed * 1.25 && debtServicePressure < 0.06;
      const weakProfit = producer.lastProfit < -45 || producer.profitTrend < -90;
      const cashTight = producer.cash < payrollNeed * 0.95;
      const leveraged = producer.debt > Math.max(payrollNeed * 3.2, producer.cash + producer.productionCapacity * producer.price * 1.15);
      return !healthyCashFlow && (producer.financiallyStressed || (producer.debtStress || 0) > 0.55 || (producer.stressMemory || 0) > 0.55 || debtServicePressure > 0.10) && (weakProfit || cashTight || leveraged);
    }

    // ===== 실험·검증 런타임 =====
    function createExperimentContext() {
      return {
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
        captureSimulationSnapshotRuntime,
        restoreControlSnapshot: updateControlLabels
      };
    }

    function createExperimentRuntimeContext() {
      return createRuntimeRegistryInstance().createExperimentRuntimeInstance();
    }

    function runBalanceQuickTest(...args) {
      return createExperimentRuntimeContext().runBalanceQuickTest(...args);
    }

    async function runScenarioValidation(...args) {
      return createExperimentRuntimeContext().runScenarioValidation(...args);
    }

    async function runPolicyComparison(...args) {
      return createExperimentRuntimeContext().runPolicyComparison(...args);
    }

    function getPolicyComparisonVariants(...args) {
      return createExperimentRuntimeContext().getPolicyComparisonVariants(...args);
    }

    function applyPolicyComparisonVariant(...args) {
      return createExperimentRuntimeContext().applyPolicyComparisonVariant(...args);
    }

    function summarizePolicyComparisonResult(...args) {
      return createExperimentRuntimeContext().summarizePolicyComparisonResult(...args);
    }

    function policyComparisonRecommendation(...args) {
      return createExperimentRuntimeContext().policyComparisonRecommendation(...args);
    }

    function classifyPolicyComparisonSideEffect(...args) {
      return createExperimentRuntimeContext().classifyPolicyComparisonSideEffect(...args);
    }

    function renderPolicyComparisonResults(...args) {
      return createExperimentRuntimeContext().renderPolicyComparisonResults(...args);
    }

    function waitForUiTurn(...args) {
      return createExperimentRuntimeContext().waitForUiTurn(...args);
    }

    function captureSimulationSnapshot(...args) {
      return createExperimentRuntimeContext().captureSimulationSnapshot(...args);
    }

    function captureUiSafeSnapshot(...args) {
      return createExperimentRuntimeContext().captureUiSafeSnapshot(...args);
    }

    function captureCoreStateSignature(...args) {
      return createExperimentRuntimeContext().captureCoreStateSignature(...args);
    }

    function compareCoreStateSignature(...args) {
      return createExperimentRuntimeContext().compareCoreStateSignature(...args);
    }

    function warnIfStateRestoreFailed(...args) {
      return createExperimentRuntimeContext().warnIfStateRestoreFailed(...args);
    }

    function restoreSimulationSnapshot(...args) {
      return createExperimentRuntimeContext().restoreSimulationSnapshot(...args);
    }

    function restoreUiSafeSnapshot(...args) {
      return createExperimentRuntimeContext().restoreUiSafeSnapshot(...args);
    }

    function prepareCalibrationScenario(...args) {
      return createExperimentRuntimeContext().prepareCalibrationScenario(...args);
    }

    function summarizeScenarioValidation(...args) {
      return createExperimentRuntimeContext().summarizeScenarioValidation(...args);
    }

    function judgeScenarioRows(...args) {
      return createExperimentRuntimeContext().judgeScenarioRows(...args);
    }

    function scenarioKeyRisk(...args) {
      return createExperimentRuntimeContext().scenarioKeyRisk(...args);
    }

    function renderScenarioValidationResults(...args) {
      return createExperimentRuntimeContext().renderScenarioValidationResults(...args);
    }

    function renderBalanceQuickTestResult(...args) {
      return createExperimentRuntimeContext().renderBalanceQuickTestResult(...args);
    }

    function historicalScenarioJudgement(...args) {
      return createExperimentRuntimeContext().historicalScenarioJudgement(...args);
    }

    function historicalScenarioKeyRisk(...args) {
      return createExperimentRuntimeContext().historicalScenarioKeyRisk(...args);
    }

    // ===== 개발자 방향성 검증 런타임 =====
    function createDeveloperValidationContext() {
      return {
        state,
        els,
        TARGET_INFLATION,
        clamp,
        createInitialFinancialMarket,
        createInitialRateStructure,
        escapeHtml,
        evaluateDirectionalValidation,
        getDeveloperValidationMetrics,
        recordRuntimeError,
        repairSimulationState,
        renderValidationReport,
        restoreSimulationSnapshot,
        round,
        runSimulationStep,
        safeNumber,
        safeUpdateAllDisplays,
        safeUpdateCharts,
        setHtmlIfChanged,
        warnIfStateRestoreFailed,
        updateMacroMetrics
      };
    }

    function createDeveloperValidationRuntimeContext() {
      return createRuntimeRegistryInstance().createDeveloperValidationRuntimeInstance();
    }

    async function runDeveloperValidationMode(...args) {
      return createDeveloperValidationRuntimeContext().runDeveloperValidationMode(...args);
    }

    function runDeveloperValidationCase(...args) {
      return createDeveloperValidationRuntimeContext().runDeveloperValidationCase(...args);
    }

    function getDeveloperValidationMetrics(...args) {
      return createDeveloperValidationRuntimeContext().getDeveloperValidationMetrics(...args);
    }

    function applyValidationRateHike(...args) {
      return createDeveloperValidationRuntimeContext().applyValidationRateHike(...args);
    }

    function applyValidationSpendingBoost(...args) {
      return createDeveloperValidationRuntimeContext().applyValidationSpendingBoost(...args);
    }

    function applyValidationSupplyShock(...args) {
      return createDeveloperValidationRuntimeContext().applyValidationSupplyShock(...args);
    }

    function applyValidationTaxHike(...args) {
      return createDeveloperValidationRuntimeContext().applyValidationTaxHike(...args);
    }

    async function runDataCalibrationMode() {
      return runDataCalibrationModePanel(createDataLabContext());
    }

    async function runLiveDataLoadMode() {
      return runLiveDataLoadModePanel(createDataLabContext());
    }

    function saveDataApiKeys() {
      return saveDataApiKeysPanel(createDataLabContext());
    }

    function clearDataApiKeys() {
      return clearDataApiKeysPanel(createDataLabContext());
    }

    async function runBacktestMode() {
      return runBacktestModePanel(createDataLabContext());
    }

    function runMonteCarloMode() {
      return runMonteCarloModePanel(createDataLabContext());
    }

    async function runLiquidityRadarMode() {
      return runLiquidityRadarModePanel(createLiquidityRadarContext());
    }

    function updateModelReliabilityPanel() {
      return updateModelReliabilityPanelView(createDataLabContext());
    }

    function createDataLabContext() {
      return {
        els,
        state,
        services: {
          calibrateParameters,
          defaultModelParameters,
          loadCalibrationDataset,
          runBacktest,
          runMonteCarloScenario
        },
        helpers: {
          createInitialModelReliability,
          escapeHtml,
          isLargeEconomyMode,
          macroMoney,
          percent,
          recordRuntimeError,
          round,
          setHtmlIfChanged,
          updateSfcAccountingLayer
        }
      };
    }

    function createLiquidityRadarContext() {
      return {
        els,
        state,
        helpers: {
          escapeHtml,
          recordRuntimeError,
          round,
          setHtmlIfChanged
        }
      };
    }

    function updatePolicyImpactPanel() {
      const current = state.history[state.history.length - 1];
      const baseline = state.history[Math.max(0, state.history.length - 11)];
      if (!current || !baseline || current === baseline) {
        els.consumptionDeltaValue.textContent = money(0);
        els.investmentDeltaValue.textContent = money(0);
        els.unemploymentDeltaValue.textContent = "0.00%p";
        els.priceDeltaValue.textContent = money(0, 2);
        return;
      }

      setDeltaText(els.consumptionDeltaValue, current.consumption - baseline.consumption, money);
      setDeltaText(els.investmentDeltaValue, current.investment - baseline.investment, money);
      setDeltaText(els.unemploymentDeltaValue, current.unemploymentRate - baseline.unemploymentRate, (value) => `${formatSigned(value, 2)}%p`);
      setDeltaText(els.priceDeltaValue, current.averagePrice - baseline.averagePrice, (value) => money(value, 2));
    }

    function setDeltaText(element, value, formatter) {
      element.textContent = formatter(value);
      element.classList.toggle("positive", value >= 0);
      element.classList.toggle("negative", value < 0);
    }

    function updateMacroFocusLine(macroState = null) {
      if (!els.macroFocusLineValue) return;
      const stateLabel = macroState?.state || state.metrics.macroStateLabel || getEconomyPhase();
      const topWarning = state.earlyWarning?.topRisks?.[0];
      const dominant = state.causalDecomposition?.dominant || state.metrics.causalDominant || "원인 신호 형성 중";
      const warningText = topWarning ? `${topWarning.label} ${topWarning.level}` : "조기경보 안정";
      setTextIfChanged(els.macroFocusLineValue, `${stateLabel} · 주된 압력: ${dominant} · 위험: ${warningText}`);
    }

    function explainTransmissionChain() {
      const transmission = state.macroFinancial || createInitialMacroFinancialTransmission(state.config);
      if (state.metrics.rumorIntensity > 0.45 && state.information?.rumorType === "bank") {
        return "은행 부실 루머가 실제 부실보다 먼저 신용스프레드를 확대시키고 있습니다. 루머가 확인되지 않으면 충격은 점차 약해질 수 있습니다.";
      }
      if (state.metrics.misperceptionIndex > 0.55) {
        return "정보 격차가 커져 경제 주체들이 실제 지표보다 늦거나 과하게 반응하고 있습니다. 정책 명확성이 낮으면 소비와 투자 회복이 지연될 수 있습니다.";
      }
      if (state.metrics.housingMispricing > 18 && state.metrics.realEstateNeverFallsBelief > 0.62) {
        return "부동산 가격은 소득과 대출 부담에 비해 높은 수준이지만, 부동산 불패 믿음이 수요를 지지하고 있습니다. 금리 부담이 더 커지면 믿음이 급격히 약해질 수 있습니다.";
      }
      if (state.metrics.stockMispricing > 22 && state.metrics.stockMarketNeverFailsBelief > 0.62) {
        return "기업 이익 증가보다 주가지수 상승이 빠르지만, 주식 불패 기대와 FOMO가 매수세를 유지하고 있습니다. 밸류에이션 부담이 커져 조정 위험이 높아지고 있습니다.";
      }
      if (state.metrics.panicSellingPressure > 0.55) {
        return "실제 지표보다 손실회피와 군중심리가 빠르게 악화되고 있습니다. 패닉 매도 압력이 커지면 신용스프레드와 투자심리가 함께 흔들릴 수 있습니다.";
      }
      if (state.metrics.stockVolatilityIndex > 45 && state.metrics.stockMonthlyReturn < -2) {
        return "주가지수 하락보다 공포지수 상승이 더 빠르게 나타나 기업 투자심리가 약화되고 있습니다.";
      }
      if (state.metrics.sentimentInflationExpectations > state.metrics.inflation + 1.2) {
        return "실제 물가보다 기대인플레이션이 높아 임금과 가격 결정이 선제적으로 올라갈 수 있습니다.";
      }
      if (Math.abs(state.metrics.policySurpriseRate) > 0.35 || state.metrics.rateUncertainty > 0.55) {
        return "예상보다 큰 금리 변화가 정책 불확실성을 키워 주가 변동성과 위험회피를 높이고 투자 결정을 지연시키고 있습니다.";
      }
      if (state.metrics.termSpread < -0.25) {
        return "장단기 금리차가 역전되어 시장이 경기 둔화를 반영하고 있습니다. 은행 대출태도와 기업 투자심리가 보수화될 수 있습니다.";
      }
      if (state.metrics.mortgageRate > 7 && state.metrics.housingAffordability > 1.45) {
        return "장기금리 상승이 주택담보금리를 통해 주택구입부담을 높이고 있습니다. 부동산 수요와 건설 투자가 먼저 둔화될 수 있습니다.";
      }
      if (state.metrics.realPolicyRate > 3 && state.metrics.outputGap < 0) {
        return "명목금리보다 실질금리 긴축 효과가 강해 기업 투자와 주택수요가 둔화되고 있습니다.";
      }
      if (transmission.loanRate > transmission.effectivePolicyRate + 0.055 && state.metrics.debtServiceBurden > 6) {
        return "금리 상승이 대출금리와 부채상환 부담을 높이면서 소비와 기업 투자가 둔화되고 있습니다.";
      }
      if (state.metrics.housingReturn < -0.35 && state.metrics.negativeEquityRatio > 4) {
        return "부동산 가격 하락이 가계 순자산과 은행 건전성을 동시에 압박해 신용공급이 약해지고 있습니다.";
      }
      if (state.metrics.corporateTaxCollected > 0 && transmission.creditSpread > 0.055 && state.metrics.investment < state.metrics.consumption * 0.05) {
        return "법인세 부담과 신용스프레드 확대가 기업의 세후이익과 투자 여력을 낮추고 있습니다.";
      }
      if (state.metrics.debtToGdpRatio > 1.1 && transmission.bondYield > transmission.effectivePolicyRate + 0.030) {
        return "정부 부채비율 상승으로 국채금리 압력이 커지고, 이자비용 증가가 재정 여력을 제한하고 있습니다.";
      }
      if (state.metrics.stockReturn < -0.5 && transmission.safeHavenDemand > 0.45) {
        return `주가지수 ${formatIndexPoint(state.metrics.stockIndexPoints)} 조정과 안전자산 선호 상승이 위험회피 심리를 키워 금융여건을 긴축시키고 있습니다.`;
      }
      if (state.metrics.stockValuationPressure > 0.62 && state.metrics.stockMonthlyReturn > 1.5) {
        return `주가지수는 ${formatIndexPoint(state.metrics.stockIndexPoints)}까지 상승했지만 기업 이익 증가보다 빨라 밸류에이션 부담이 커지고 있습니다.`;
      }
      if (transmission.aggregateDemandPressure > 1.10 && transmission.wealthEffect > 0.01) {
        return "자산가격 상승이 가계 순자산과 소비심리를 보강해 총수요를 지지하고 있습니다.";
      }
      return "";
    }

    function renderEventLog() {
      const entries = state.events.slice(0, 8);
      if (entries.length === 0) {
        els.eventLog.innerHTML = "<li>아직 이벤트가 없습니다.</li>";
        return;
      }
      els.eventLog.innerHTML = entries.map((event) => `<li><strong>${getCalendarLabel(event.tick)}</strong> - ${event.text}</li>`).join("");
    }

    function pushEvent(text) {
      state.events.unshift({ tick: state.tick, text });
      state.events = state.events.slice(0, 20);
    }

    function addEventMarker(label) {
      const markerTick = state.history.length > 0 ? state.tick : 1;
      state.markers.push({ tick: markerTick, label });
      state.markers = state.markers.slice(-18);
    }

    function showToast(title, body = "") {
      if (!els.toastStack) return;
      const toast = document.createElement("div");
      toast.className = "toast";
      const context = getToastCausalContext(title, body);
      const displayBody = [body, context].filter(Boolean).join("<br>");
      toast.innerHTML = `<strong>${title}</strong>${displayBody ? `<br>${displayBody}` : ""}`;
      els.toastStack.prepend(toast);
      window.setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(8px)";
      }, 2600);
      window.setTimeout(() => {
        toast.remove();
      }, 3200);
    }

    function getToastCausalContext(title = "", body = "") {
      const text = `${title} ${body}`;
      if (text.includes("→")) return "";
      if (/부가세|VAT/.test(text)) return "부가세 변화 → 체감물가 → 저소득층 소비여력";
      if (/법인세/.test(text)) return "법인세 변화 → 세후이익 → 투자·자사주 배분";
      if (/소득세/.test(text)) return "소득세 변화 → 가처분소득 → 소비 여력";
      if (/금리|이자|긴축/.test(text)) return "금리 변화 → 대출금리·자산가격 → 소비·투자 지연 반응";
      if (/정부|지출|재정/.test(text)) return "정부지출 변화 → 수요 보강 → 재정여력 변화";
      if (/신용|금융|은행/.test(text)) return "신용여건 변화 → 대출태도 → 투자·고용";
      if (/환율|대외|수입물가/.test(text)) return "대외 충격 → 환율·수입물가 → 실질소비 압박";
      if (/역사|IMF|2007|일본|독일|튀르키예/.test(text)) return "역사 충격 → 대외·신용 경로 → 실물경제 지연 반응";
      if (/정책/.test(text)) return "정책 선택 → 심리·신용 경로 → 몇 개월 뒤 실물 반응";
      return "";
    }

    function recordRuntimeError(error, title = "런타임 오류", body = "오류가 감지되어 시뮬레이션을 일시정지했습니다.", options = {}) {
      if (!state.debug) state.debug = { lastSuccessfulTickTime: 0, errors: [] };
      const message = error && error.message ? error.message : String(error || "알 수 없는 오류");
      const signature = `${title}:${message}`;
      const now = performance.now();
      const repeatedTooSoon = state.debug.lastErrorSignature === signature && now - safeNumber(state.debug.lastErrorAt, 0) < 1200;
      state.debug.lastErrorSignature = signature;
      state.debug.lastErrorAt = now;
      if (!options.skipConsole && !repeatedTooSoon) console.error(error);
      if (!repeatedTooSoon) {
        state.debug.errors.unshift({
          time: new Date().toLocaleTimeString("ko-KR", { hour12: false }),
          tick: state.tick,
          calendar: getCalendarLabel(state.tick),
          message
        });
        state.debug.errors = state.debug.errors.slice(0, 5);
      }
      try {
        renderDebugLog();
      } catch (_) {
        // 오류 로그 자체가 실패해도 시뮬레이션 루프는 계속 유지한다.
      }
      if (!options.silentToast && !repeatedTooSoon) {
        try {
          showToast(title, body);
        } catch (_) {
          // 토스트 DOM 오류도 런타임 루프를 멈추지 않는다.
        }
      }
    }

    function renderDebugLog() {
      if (!els.debugErrorLog) return;
      const errors = state.debug && Array.isArray(state.debug.errors) ? state.debug.errors.slice(0, 5) : [];
      if (!errors.length) {
        els.debugErrorLog.innerHTML = "<li>오류 기록이 없습니다.</li>";
        return;
      }
      els.debugErrorLog.innerHTML = errors.map((entry) => (
        `<li><strong>${escapeHtml(entry.time)} · ${escapeHtml(entry.calendar)}</strong><br>틱 ${safeNumber(entry.tick, 0)}: ${escapeHtml(entry.message)}</li>`
      )).join("");
    }

    function safeUpdateAllDisplays() {
      try {
        updateAllDisplays();
      } catch (error) {
        recordRuntimeError(error, "표시 오류", "화면 갱신 오류를 건너뛰었습니다.");
      }
    }

    function safeUpdateCharts(force = false) {
      try {
        updateCharts(force);
      } catch (error) {
        recordRuntimeError(error, "차트 오류", "차트 갱신 오류를 건너뛰었습니다.");
      }
    }

    function safeRenderSimulation(timestamp) {
      safeRenderSimulationPanel(createCanvasContext(), timestamp);
    }

    function safeUpdateBalanceDiagnostics() {
      try {
        updateBalanceDiagnostics();
      } catch (error) {
        recordRuntimeError(error, "진단 오류", "균형 진단 갱신 오류를 건너뛰었습니다.");
      }
    }

    function safeRenderBalanceQuickTestResult(samples) {
      try {
        renderBalanceQuickTestResult(samples);
      } catch (error) {
        recordRuntimeError(error, "테스트 오류", "빠른 테스트 결과 표시 오류를 건너뛰었습니다.");
      }
    }

    function recordFlow(fromType, fromId, toType, toId, amount, kind) {
      if (!Number.isFinite(amount) || amount <= 0) return;
      recordLedgerFlowFromUiFlow(state, { fromType, fromId, toType, toId, amount, kind });

      const flowThreshold = Math.max(36, state.metrics.averagePrice * 3.4, effectiveBaseWage() * 2.2);
      const shouldRecord = amount >= flowThreshold || (kind === "investment" && amount > 14);
      if (!shouldRecord) return;

      state.flows.push({
        fromType,
        fromId,
        toType,
        toId,
        amount,
        kind,
        born: performance.now(),
        life: state.config.performanceMode === "light" ? 300 : (kind === "investment" ? 560 : 380)
      });

      if (state.flows.length > MAX_FLOWS) {
        state.flows.sort((a, b) => b.amount - a.amount);
        state.flows.splice(MAX_FLOWS);
      }
    }

    function animationLoop(timestamp) {
      try {
        if (!state.lastFrameTime) state.lastFrameTime = timestamp;
        const delta = timestamp - state.lastFrameTime;
        state.lastFrameTime = timestamp;

        if (state.running) {
          const interval = 1000 / Math.max(1, state.config.speed || 8);
          state.accumulator += delta;
          let guard = 0;
          while (state.accumulator >= interval && guard < 5) {
            if (!safeStepSimulation()) break;
            state.accumulator -= interval;
            guard += 1;
          }

          if (state.running && state.debug.lastSuccessfulTickTime && performance.now() - state.debug.lastSuccessfulTickTime > 5000) {
            state.running = false;
            state.accumulator = 0;
            state.debug.lastSuccessfulTickTime = performance.now();
            updateRunState();
            recordRuntimeError(new Error("5초 이상 시뮬레이션 단계가 완료되지 않았습니다."), "멈춤 감지", "5초 이상 진행이 없어 일시정지했습니다.", { skipConsole: true });
          }
        }

        const renderInterval = isLargeEconomyMode() ? 160 : state.config.performanceMode === "light" ? 100 : 42;
        if (!state.lastRenderAt || timestamp - state.lastRenderAt >= renderInterval || !state.running) {
          safeRenderSimulation(timestamp);
          state.lastRenderAt = timestamp;
        }
      } catch (error) {
        state.running = false;
        try {
          repairSimulationState();
        } catch (_) {
          // 상태 보정 실패도 루프 예약을 막지 않는다.
        }
        try {
          updateRunState();
        } catch (_) {
          // 실행 상태 표시 실패는 다음 렌더에서 다시 시도한다.
        }
        try {
          recordRuntimeError(error, "런타임 오류", "오류가 감지되어 시뮬레이션을 일시정지했습니다.");
        } catch (loggingError) {
          console.error(loggingError);
        }
      } finally {
        requestAnimationFrame(animationLoop);
      }
    }

    // ===== 렌더링 =====
    function createCanvasContext() {
      return {
        state,
        els,
        windowRef: window,
        helpers: {
          clamp,
          compactMoney,
          getCanvasPositionCacheKey,
          isLargeEconomyMode,
          money,
          percent,
          quadraticPoint,
          round,
          roundedRect,
          safeNumber,
          syncUiPerformanceState
        },
        callbacks: {
          recordRuntimeError,
          updateInspector
        }
      };
    }

    function renderSimulation(timestamp) {
      renderSimulationPanel(createCanvasContext(), timestamp);
    }

    function handleCanvasClick(event) {
      handleCanvasClickPanel(createCanvasContext(), event);
    }

    function handleCanvasHover(event) {
      handleCanvasHoverPanel(createCanvasContext(), event);
    }

    function hideCanvasTooltip() {
      hideCanvasTooltipPanel(createCanvasContext());
    }
    function macroMoney(value, digits = 0) {
      const scale = safeNumber(state.scale?.currencyScale, 1000);
      return money(safeNumber(value, 0) * scale, digits);
    }

    function applyEquilibriumGravity() {
      if (state.config?.educationalStabilizersEnabled === false) {
        return { demandAdjustment: 1, priceAdjustment: 0 };
      }
      const inflationGap = Math.max(0, safeNumber(state.metrics.inflation, 0) - 4.0);
      const unemploymentGap = Math.max(0, safeNumber(state.metrics.unemploymentRate, 0) - 12.0);
      const gdpFloor = Math.max(1, state.consumers.length * effectiveBaseWage() * 0.16);
      const collapseGap = state.metrics.gdp > 0 ? Math.max(0, 1 - state.metrics.gdp / gdpFloor) : 0;
      return {
        demandAdjustment: clamp(1 - inflationGap * 0.0020 + unemploymentGap * 0.0018 + collapseGap * 0.016, 0.972, 1.036),
        priceAdjustment: clamp(-inflationGap * 0.00055, -0.003, 0)
      };
    }

    const api = testMode
      ? {
        init,
        testing: {
          getState: () => state,
          reset: resetSimulation,
          step: safeStepSimulation
        }
      }
      : { init };
    return api;
}
