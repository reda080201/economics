import { evaluateDirectionalValidation, renderValidationReport } from "./core/validation.js";
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
} from "./core/config.js";
import { defaultModelParameters } from "./core/modelParameters.js";
import {
  applyInertia,
  average,
  clamp,
  computeNonlinearStress,
  escapeHtml,
  lerp,
  quadraticPoint,
  rand,
  round,
  roundedRect,
  safeNumber,
  safeValue,
  shuffle,
  smoothValue,
  sum,
  unique
} from "./core/mathUtils.js";
import {
  capacityLabel,
  creditRatingLabelFromScore,
  creditRatingScore,
  giniCoefficient,
  mostFrequent,
  riskLabel,
  sectorLabel,
  sentimentLabel
} from "./core/formatUtils.js";
import { createInitialAppState } from "./core/stateFactory.js";
import {
  captureCoreStateSignature as captureCoreStateSignatureRuntime,
  captureSimulationSnapshot as captureSimulationSnapshotRuntime,
  compareCoreStateSignature as compareCoreStateSignatureRuntime,
  restoreSimulationSnapshot as restoreSimulationSnapshotRuntime
} from "./core/simulationRuntime.js";
import { resetSimulationState } from "./core/resetSimulation.js";
import { calibrateParameters } from "./core/calibration.js";
import { runBacktest } from "./core/backtest.js";
import { runMonteCarloScenario } from "./core/monteCarlo.js";
import {
  createInitialCausalDecomposition,
  computeCausalPressureScores as computeCausalPressureScoresAnalysis,
  updateCausalDecomposition as updateCausalDecompositionAnalysis
} from "./analysis/causalDecomposition.js";
import {
  createInitialEarlyWarning,
  earlyWarningReasonLabel as earlyWarningReasonLabelAnalysis,
  updateEarlyWarningSystem as updateEarlyWarningSystemAnalysis
} from "./analysis/earlyWarning.js";
import {
  createInitialMarketOutcome,
  computeMarketOutcome as computeMarketOutcomeAnalysis
} from "./analysis/marketOutcome.js";
import { loadCalibrationDataset } from "./data/calibrationDataset.js";
import {
  recordLedgerFlowFromUiFlow,
  updateSfcAccountingLayer as updateSfcAccountingLayerAdapter
} from "./economy/accountingAdapter.js";
import {
  firmStrategyLabel,
  getSectorBehaviorMultiplier,
  getSectorProfile,
  weightedPick
} from "./economy/sectorProfiles.js";
import {
  calculateConsumption,
  calculateInflationPressure,
  calculateInvestment,
  calculateUnemploymentChange
} from "./economy/responseFunctions.js";
import {
  fireConsumer as fireConsumerEngine,
  fireShareOfWorkers as fireShareOfWorkersEngine,
  hireConsumer as hireConsumerEngine,
  payWages as payWagesEngine,
  updateLaborMarket as updateLaborMarketEngine
} from "./economy/laborMarket.js";
import {
  adjustProducerPricesAndExpectations as adjustProducerPricesAndExpectationsEngine,
  computePriceChange as computePriceChangeEngine,
  produceGoods as produceGoodsEngine
} from "./economy/production.js";
import {
  chooseProducerForConsumer as chooseProducerForConsumerEngine,
  executeConsumerPurchases as executeConsumerPurchasesEngine
} from "./economy/consumption.js";
import {
  allocateAfterTaxCashFlow as allocateAfterTaxCashFlowEngine,
  collectProfitTaxes as collectProfitTaxesEngine,
  executeGovernmentSpending as executeGovernmentSpendingEngine,
  getDebtSpendingBrake as getDebtSpendingBrakeEngine
} from "./economy/government.js";
import {
  executeExternalTrade as executeExternalTradeEngine,
  syncExternalMetrics as syncExternalMetricsEngine,
  updateExternalSector as updateExternalSectorEngine
} from "./economy/externalTrade.js";
import {
  computeGDP as computeGDPEngine,
  updateMacroMetricsEngine
} from "./economy/macroMetrics.js";
import {
  computeBondMarket as computeBondMarketEngine,
  computeLoanAndDepositRates as computeLoanAndDepositRatesEngine,
  syncRateMetrics as syncRateMetricsEngine,
  updateInterestRateStructure as updateInterestRateStructureEngine
} from "./finance/interestRates.js";
import {
  computeBankingCrisisRisk as computeBankingCrisisRiskEngine,
  computeCreditSpread as computeCreditSpreadEngine,
  computeCreditSupply as computeCreditSupplyEngine,
  syncFinancialMarketMetrics as syncFinancialMarketMetricsEngine,
  updateBankingSector as updateBankingSectorEngine
} from "./finance/banking.js";
import {
  syncCreditCycleMetrics as syncCreditCycleMetricsEngine,
  triggerCreditCycleEvent as triggerCreditCycleEventEngine,
  updateCreditCycle as updateCreditCycleEngine
} from "./finance/creditCycle.js";
import {
  computeSafeAssetMarkets as computeSafeAssetMarketsEngine,
  computeSafeHavenDemand as computeSafeHavenDemandEngine
} from "./finance/safeAssets.js";
import { scenarioSelectGroups } from "./scenarios/presets.js";
import { hydrateScenarioSelect } from "./ui/controls.js";
import {
  clearDataApiKeys as clearDataApiKeysPanel,
  runLiveDataLoadMode as runLiveDataLoadModePanel,
  runBacktestMode as runBacktestModePanel,
  runDataCalibrationMode as runDataCalibrationModePanel,
  runMonteCarloMode as runMonteCarloModePanel,
  saveDataApiKeys as saveDataApiKeysPanel,
  updateModelReliabilityPanel as updateModelReliabilityPanelView
} from "./ui/dataLab.js";
import { runLiquidityRadarMode as runLiquidityRadarModePanel } from "./ui/liquidityRadar.js";
import { updateInspectorPanel } from "./ui/inspector.js";
import {
  runADASModel,
  runISLMModel,
  runKeynesianModel,
  runPhillipsModel,
  runSolowModel,
  runTaylorRuleModel
} from "./models/economicModels.js";
import { getModelDefinitions } from "./models/modelDefinitions.js";

"use strict";

    // ===== 설정과 전역 상태 =====
    // 모든 에이전트와 정책 변수는 이 state 객체에 보관한다.
    // 백엔드 없이 브라우저 메모리 안에서만 시뮬레이션이 진행된다.
    const els = {};
    const state = createInitialAppState();

    // ===== 초기화 =====
    // DOM이 준비되면 차트, 이벤트, 에이전트 상태를 한 번에 연결한다.
    document.addEventListener("DOMContentLoaded", () => {
      cacheElements();
      hydrateScenarioSelect(els.scenarioSelect, scenarioSelectGroups);
      setupCharts();
      enhanceControlPanel();
      enhanceDetailedMetricsPanel();
      enhanceInspectorHierarchy();
      setupEvents();
      updateControlLabels();
      resetSimulation();
      requestAnimationFrame(animationLoop);
    });

    function cacheElements() {
      cacheControlElements();
      cacheKpiElements();
      cacheChartElements();
      cacheInspectorElements();
      cacheDataLabElements();
      cacheModelLabElements();
      cacheOverlayElements();
    }

    function cacheElementIds(ids) {
      ids.forEach((id) => {
        els[id] = document.getElementById(id);
      });
    }

    function cacheControlElements() {
      cacheElementIds([
        "runPulse", "runState", "tickDisplay", "startBtn", "pauseBtn", "resetBtn", "stepBtn", "shockBtn",
        "modeStatusValue", "gameModeSelect", "startGameModeBtn", "speedValue", "speedSlider",
        "performanceModeSelect", "consumerValue", "consumerSlider", "producerValue", "producerSlider",
        "interestValue", "interestSlider", "taxValue", "taxSlider", "corporateTaxValue",
        "corporateTaxSlider", "vatValue", "vatSlider", "spendingValue", "spendingSlider",
        "wageValue", "wageSlider", "inflationSensitivityValue", "inflationSlider", "scenarioSelect",
        "applyScenarioBtn", "historicalScenarioBtn", "autoPolicyToggle", "randomPolicyEventsToggle"
      ]);
    }

    function cacheKpiElements() {
      cacheElementIds([
        "calendarValue", "phaseValue", "scoreValue", "bestScoreValue", "feedbackBanners",
        "macroFocusLineValue",
        "gdpValue", "outputValue", "consumptionValue", "investmentValue", "unemploymentValue",
        "employmentValue", "priceValue", "inflationValue", "rateValue", "balanceValue",
        "debtValue", "householdCashValue", "confidenceValue", "firmCashValue", "inventoryValue",
        "shockBadge", "consumptionDeltaValue", "investmentDeltaValue", "unemploymentDeltaValue",
        "priceDeltaValue"
      ]);
    }

    function cacheChartElements() {
      cacheElementIds([
        "simCanvas", "canvasTooltip", "gdpChart", "priceChart", "unemploymentChart", "demandChart",
        "governmentChart", "assetChart", "firmStockChart", "financialChart", "safeAssetChart",
        "sentimentChart", "modelChart"
      ]);
    }

    function cacheInspectorElements() {
      cacheElementIds([
        "macroNarrative", "transmissionMapValue", "policyRecommendationValue", "earlyWarningSummaryValue",
        "causalDecompositionValue", "missionSummary", "objectiveList", "policyEventCard",
        "policyEventTitle", "policyEventDescription", "policyEventOptions", "selectedAgent",
        "sentConsumerConfidenceValue", "sentBusinessConfidenceValue", "sentBankRiskAppetiteValue",
        "sentMarketRiskValue", "sentInflationExpectationValue", "sentRecessionFearValue",
        "sentFiscalCredibilityValue", "sentimentNarrativeValue", "classAnalysisPanelValue",
        "stockFearIndexValue", "fearGreedValue", "rumorIntensityValue", "informationUncertaintyValue",
        "safeHavenPsychologyValue", "stockExpectationValue", "stockVolatilityIndexValue",
        "householdInfoAccuracyValue", "firmDemandPerceptionValue", "bankRiskPerceptionValue",
        "marketOverreactionValue", "policyClarityValue", "misperceptionIndexValue",
        "informationNarrativeValue", "realEstateBeliefValue", "stockBeliefValue", "herdIntensityValue",
        "fomoIntensityValue", "lossAversionValue", "confirmationBiasValue", "panicSellingValue",
        "behaviorMispricingValue", "behaviorNarrativeValue", "diagBalanceSummaryValue",
        "diagAvgUnemploymentValue", "diagAvgInflationValue", "diagAvgGdpValue", "diagPotentialOutputValue",
        "diagOutputGapValue", "diagCapacityUtilizationValue", "diagUnemploymentGapValue",
        "diagInflationGapValue", "diagPolicyGapValue", "diagAvgFirmEmploymentValue",
        "diagHiringFreezeRatioValue", "diagFirmStressRatioValue", "diagInventoryDemandRatioValue",
        "diagInterestPolicyValue", "diagTaxPolicyValue", "diagCorporateTaxPolicyValue",
        "diagSpendingPolicyValue", "diagDebtToGdpValue", "diagGovernmentDebtServiceValue",
        "diagFiscalSpaceValue", "diagHouseholdDebtBurdenValue", "diagFirmDscrValue",
        "diagHouseholdDebtStressRatioValue", "diagFirmDebtStressRatioValue", "diagAssetBubbleRiskValue",
        "diagHousingAffordabilityValue", "diagWealthEffectValue", "diagFinancialMarketSummaryValue",
        "diagBondYieldValue", "diagCreditSpreadValue", "diagBankingCrisisRiskValue", "diagWarningsValue",
        "taxCollectedValue", "householdIncomeTaxValue", "corporateTaxCollectedValue", "vatRevenueValue",
        "taxCompositionValue", "taxSentimentValue", "spendingActualValue", "governmentDebtServiceValue",
        "debtToGdpValue", "fiscalSpaceValue", "wagesValue", "unitsSoldValue", "unitsProducedValue",
        "giniValue", "householdDebtValue", "debtBurdenValue", "mortgageBurdenValue",
        "negativeEquityRatioValue", "incomeInequalityValue", "wealthInequalityValue",
        "lowIncomeConsumptionCapacityValue", "middleClassHousingBurdenValue", "wealthyAssetEffectValue",
        "socialStressIndexValue", "mainPressureClassValue", "lowIncomeStressValue",
        "middleMortgageStressValue", "wealthyAssetStressValue", "hiddenVulnerabilityValue",
        "dominantVulnerabilityValue", "householdVulnerabilityValue", "firmVulnerabilityValue",
        "bankVulnerabilityValue", "housingVulnerabilityValue", "externalVulnerabilityValue",
        "marketSuccessValue", "marketFailureValue", "allocationQualityValue", "marketFailureTypeValue",
        "marketSuccessTypeValue", "historicalScenarioStatusValue", "earlyWarningDetailValue",
        "firmDebtValue", "firmDscrValue", "buybackShareValue", "investmentConversionValue",
        "cashDebtAllocationValue", "manufacturingStressValue", "servicesDemandValue",
        "agricultureStressValue", "energySectorStressValue", "constructionStressValue",
        "financialSectorStressValue", "technologyValuationPressureValue", "mostStressedSectorValue",
        "sectorCountSummaryValue", "sectorProfitInvestmentValue", "exchangeRateIndexValue",
        "importPriceIndexValue", "commodityPriceIndexValue", "energyPriceIndexValue",
        "tradeBalanceValue", "foreignConsumerDemandValue", "foreignInvestorSentimentValue",
        "foreignBondDemandValue", "foreignSupplierPressureValue", "foreignCapitalFlowValue",
        "centralBankCredibilityValue", "expectedRatePathValue", "forwardGuidanceClarityValue",
        "inflationTargetCredibilityValue", "policyRateDetailValue", "shortTermRateValue",
        "treasuryBill3MValue", "bondYield2YValue", "bondYield5YValue", "bondYield10YValue",
        "bondYield30YValue", "loanRateDetailValue", "mortgageRateDetailValue",
        "corporateLoanRateValue", "depositRateDetailValue", "realPolicyRateValue",
        "termSpreadValue", "longBondPriceIndexValue", "bondMarketStressValue", "rateUncertaintyValue",
        "averageCreditRatingValue", "distressedFirmRatioValue", "zombieFirmRatioValue",
        "averageDefaultRiskValue", "stockIndexValue", "housingIndexValue", "commercialIndexValue",
        "stockReturnValue", "stockVolatilityValue", "stockValuationPressureValue", "stockMispricingValue",
        "housingMispricingValue", "speculativeDemandValue", "stockRiskSentimentValue",
        "housingReturnValue", "wealthEffectValue", "housingAffordabilityValue", "assetBubbleRiskValue",
        "landIndexValue", "rentIndexValue", "commercialVacancyValue", "collateralValueIndexValue",
        "realEstateStressValue", "averageFirmStockPriceValue", "firmStockRangeValue",
        "firmStockVolatilityValue", "opaqueFirmRatioValue", "stockCrashFirmCountValue",
        "financialConditionIndexValue", "bondYieldValue", "bondPriceIndexValue", "creditSpreadValue",
        "bankHealthValue", "bankLendingStandardValue", "creditSupplyValue", "depositorConfidenceValue",
        "interbankTrustValue", "bankFundingPressureValue", "creditOfficerCautionValue",
        "loanDemandIndexValue", "creditCyclePhaseValue", "depositRateValue", "loanRateValue",
        "nplRatioValue", "goldIndexValue", "silverIndexValue", "safeHavenDemandValue",
        "bankingCrisisRiskValue"
      ]);
    }

    function cacheDataLabElements() {
      cacheElementIds([
        "balanceQuickTestBtn", "scenarioValidationBtn", "policyComparisonHorizon", "policyComparisonBtn",
        "policyComparisonSummaryValue", "policyComparisonResult", "calibrationCountrySelect",
        "dataSourceSelect", "dataStartDateInput", "dataEndDateInput", "fredApiKeyInput",
        "ecosApiKeyInput", "fredProxyUrlInput", "saveApiKeyBtn", "clearApiKeyBtn", "loadLiveDataBtn", "dataSourceStatusValue",
        "calibrationBtn", "backtestBtn", "monteCarloBtn", "accountingValidationValue",
        "modelConfidenceValue", "dataLabResult", "balanceTestResult", "scenarioValidationResult",
        "liquidityRadarBtn", "liquidityRadarStatusValue", "liquidityScoreValue", "liquidityRegimeValue",
        "fedNetLiquidityValue", "liquiditySubScoreValue", "liquiditySeriesTableValue", "liquidityRadarResult",
        "developerValidationBtn", "developerValidationResult", "debugErrorLog", "eventLog"
      ]);
    }

    function cacheModelLabElements() {
      cacheElementIds([
        "modelSelector", "useCurrentEconomyBtn", "runModelBtn", "modelInputs", "modelResultSummary",
        "modelInterpretation", "modelComparisonList"
      ]);
    }

    function cacheOverlayElements() {
      cacheElementIds([
        "toastStack", "endOverlay", "endTitle", "endReason", "endSummaryGrid", "endRestartBtn",
        "endSandboxBtn"
      ]);
    }

    function setupEvents() {
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
        state.debug.lastSuccessfulTickTime = performance.now();
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

      document.querySelectorAll("[data-control-tab]").forEach((button) => {
        safeOn(button, "click", () => activateControlTab(button.dataset.controlTab), `control tab ${button.dataset.controlTab}`);
      });

      document.querySelectorAll("[data-control-action]").forEach((button) => {
        safeOn(button, "click", () => handleControlPanelAction(button.dataset.controlAction), `control action ${button.dataset.controlAction}`);
      });

      document.querySelectorAll(".more-charts, .model-lab").forEach((details) => {
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
          window.setTimeout(() => input.classList.remove("slider-active"), 520);
        }, "slider active indicator");
      });

      safeOn(window, "resize", () => {
        if (state.ui) state.ui.canvasPositionCacheKey = "";
        safeRenderSimulation(performance.now());
      }, "window resize");

      safeOn(els.simCanvas, "click", handleCanvasClick, "simCanvas");
      safeOn(els.simCanvas, "mousemove", handleCanvasHover, "simCanvas");
      safeOn(els.simCanvas, "mouseleave", () => {
        state.hovered = null;
        hideCanvasTooltip();
        safeRenderSimulation(performance.now());
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
            { title: "자동화", open: false, nodes: [els.autoPolicyToggle?.closest(".toggle-row") || els.autoPolicyToggle, els.randomPolicyEventsToggle?.closest(".toggle-row") || els.randomPolicyEventsToggle] }
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

    function applyGameModeStartingConditions() {
      if (state.game.mode === "crisis") {
        state.game.scenarioName = "침체 회복";
        state.government.debt = 22000;
        state.government.spending = Math.max(state.government.spending, 940);
        els.spendingSlider.value = state.government.spending;
        state.consumers.forEach((consumer) => {
          consumer.confidence = clamp(consumer.confidence * rand(0.62, 0.78), 0.22, 1.05);
          consumer.debt += rand(40, 180);
        });
        state.producers.forEach((producer) => {
          producer.inventory *= rand(1.55, 2.25);
          producer.expectedDemand *= rand(0.55, 0.78);
          producer.cash *= rand(0.55, 0.82);
          producer.debt += rand(350, 1100);
          producer.businessOutlook = rand(0.42, 0.68);
          producer.profitTrend = rand(-180, -40);
        });
        fireShareOfWorkers(0.22);
        pushEvent("침체 회복: 과잉 재고, 약한 소비심리, 높은 부채로 시작합니다.");
      }

      if (state.game.mode === "inflation") {
        state.game.scenarioName = "인플레이션 안정화";
        state.government.interestRate = Math.max(state.government.interestRate, 0.075);
        els.interestSlider.value = (state.government.interestRate * 100).toFixed(2);
        state.producers.forEach((producer) => {
          producer.price *= rand(1.18, 1.38);
          producer.wageOffered *= rand(1.08, 1.18);
          producer.expectedInflation = rand(3.2, 5.2);
          producer.inventory *= rand(0.58, 0.86);
        });
        state.smoothedInflation = 5.2;
        state.shock = {
          label: "고물가 출발",
          ticksRemaining: 20,
          demandMultiplier: 0.94,
          productivityMultiplier: 0.96,
          pricePressure: 0.012
        };
        pushEvent("인플레이션 안정화: 높은 기대물가와 낮은 재고로 시작합니다.");
      }

      if (state.game.mode === "policy") {
        state.game.scenarioName = "정책 안정화";
        pushEvent("정책 안정화: 100개월 동안 안정성을 유지하세요.");
      }

      syncLivePolicy();
      updateControlLabels();
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
        average,
        readConfigFromControls,
        createConsumers,
        createProducers,
        createInitialAssetMarket,
        createInitialRealEstateMarket,
        createInitialFinancialMarket,
        createInitialCreditCycle,
        createInitialMacroFinancialTransmission,
        createInitialClassAnalysis,
        createInitialVulnerabilityState,
        createInitialSentimentState,
        createInitialInformationSystem,
        createInitialBehavioralState,
        createInitialExternalSector,
        createInitialExternalActors,
        createInitialMarketOutcome,
        createInitialCausalDecomposition,
        createInitialEarlyWarning,
        createInitialHistoricalScenario,
        createInitialPolicyCredibility,
        createInitialPerceivedEconomy,
        createInitialModelReliability,
        createInitialScale,
        initializePolicyState,
        createInitialRateStructure,
        createEmptyMetrics,
        resetGameStateForCurrentMode,
        assignInitialEmployment,
        applyGameModeStartingConditions,
        updateMacroMetrics,
        updateMacroFinancialTransmission,
        updatePerceivedEconomy,
        updateExpectationsSystem,
        updateSentimentSystem,
        updateBehavioralSystem,
        updateGameSummaryStats,
        computeScore,
        updateObjectives,
        now: () => performance.now()
      };
    }

    function createInitialScale(config = {}) {
      const householdWeight = clamp(9000 / Math.max(1, safeNumber(config.consumerCount, 260)), 12, 110);
      const firmWeight = clamp(3600 / Math.max(1, safeNumber(config.producerCount, 36)), 24, 180);
      const representativeWeight = householdWeight * 0.65 + firmWeight * 0.35;
      return {
        currencyScale: clamp(representativeWeight * 520, 9000, 52000),
        householdRepresentativeWeight: householdWeight,
        firmRepresentativeWeight: firmWeight,
        aggregateRepresentativeWeight: representativeWeight,
        label: "대표가중 경제"
      };
    }

    function createInitialAssetMarket() {
      return {
        stockIndex: 100,
        stockIndexPoints: 2500,
        previousStockIndexPoints: 2500,
        housingIndex: 100,
        stockReturn: 0,
        stockMonthlyReturn: 0,
        housingReturn: 0,
        smoothedStockReturn: 0,
        smoothedHousingReturn: 0,
        stockVolatility: 0.015,
        stockValuationPressure: 0,
        stockValuationPressureLabel: "낮음",
        stockRiskSentiment: 0.65,
        stockRiskSentimentLabel: "안정",
        fearGreedIndex: 50,
        fearGreedLabel: "중립",
        stockVolatilityIndex: 18,
        stockVolatilityIndexLabel: "보통",
        expectedEarningsGrowth: 0,
        expectedRatePath: 0,
        expectedRiskPremium: 0.04,
        stockExpectation: 0,
        expectationError: 0,
        stockPeakPoints: 2500,
        stockDrawdownFromPeak: 0,
        housingVolatility: 0.007,
        equityRiskPremium: 0.04,
        mortgageRateSpread: 0.02,
        wealthEffect: 0,
        financialConditions: 0,
        housingAffordability: 1,
        assetBubbleRisk: 0,
        assetBubbleRiskLabel: "낮음",
        equityFinancingCondition: 1,
        investorSentiment: 1,
        marketSentiment: 1,
        previousFirmProfit: 0,
        previousEarningsProxy: 1,
        previousHouseholdIncome: 0,
        averageMortgageBurden: 0,
        negativeEquityRatio: 0
      };
    }

    function createInitialRealEstateMarket() {
      return {
        residentialIndex: 100,
        commercialIndex: 100,
        landIndex: 100,
        rentIndex: 100,
        mortgageRate: 0.05,
        housingAffordability: 1,
        housingDemand: 1,
        housingSupplyConstraint: 0.42,
        commercialVacancy: 0.08,
        realEstateBubbleRisk: 0,
        realEstateStress: 0.10,
        collateralValueIndex: 100,
        residentialReturn: 0,
        commercialReturn: 0,
        landReturn: 0,
        perceivedHousingRisk: 0.15,
        perceivedCommercialRealEstateRisk: 0.15,
        realEstateRumorIntensity: 0,
        housingSpeculation: 0.12,
        housingFear: 0.12
      };
    }

    function createInitialFinancialMarket(config = {}) {
      const policyRate = safeNumber(config.interestRate, NEUTRAL_INTEREST_RATE / 100);
      return {
        bondYield: clamp(policyRate + 0.008, 0.005, 0.18),
        bondYield2Y: clamp(policyRate + 0.004, 0.002, 0.24),
        bondYield5Y: clamp(policyRate + 0.008, 0.003, 0.24),
        bondYield10Y: clamp(policyRate + 0.012, 0.004, 0.24),
        bondYield30Y: clamp(policyRate + 0.018, 0.006, 0.26),
        bondPriceIndex: 100,
        shortBondPriceIndex: 100,
        mediumBondPriceIndex: 100,
        longBondPriceIndex: 100,
        bondMarketStress: 0.10,
        flightToQualityDemand: 0.05,
        creditSpread: 0.02,
        bankHealthIndex: 100,
        bankLendingStandard: "정상",
        creditSupplyIndex: 100,
        depositorConfidence: 0.88,
        interbankTrust: 0.84,
        bankFundingPressure: 0.12,
        creditOfficerCaution: 0.28,
        bankCapitalConfidence: 0.82,
        loanDemandIndex: 100,
        riskUnderpricing: 0.12,
        depositRate: clamp(policyRate * 0.55, 0, 0.12),
        loanRate: clamp(policyRate + 0.02, 0.005, 0.24),
        bankStress: 0.12,
        nonPerformingLoanRatio: 0.025,
        goldIndex: 100,
        silverIndex: 100,
        goldReturn: 0,
        silverReturn: 0,
        safeHavenDemand: 0,
        riskAversion: 0.2,
        liquidityStress: 0.05,
        bankingCrisisRisk: 0,
        bankingCrisisRiskLabel: "낮음",
        financialMarketSummary: "정상",
        previousBondYield: clamp(policyRate + 0.008, 0.005, 0.18)
      };
    }

    function createInitialRateStructure(config = {}) {
      const policyRate = safeNumber(config.interestRate, NEUTRAL_INTEREST_RATE / 100);
      const expectedInflation = TARGET_INFLATION / 100;
      const creditSpread = 0.02;
      const mortgageSpread = 0.022;
      const treasuryBill3M = clamp(policyRate + 0.001, 0, 0.22);
      const bondYield2Y = clamp(policyRate + 0.004, 0.002, 0.24);
      const bondYield5Y = clamp(policyRate + 0.008, 0.003, 0.24);
      const bondYield10Y = clamp(policyRate + 0.012, 0.004, 0.24);
      const bondYield30Y = clamp(policyRate + 0.018, 0.006, 0.26);
      const loanRate = clamp(policyRate + creditSpread + 0.004, 0.005, 0.28);
      return {
        policyRate,
        effectivePolicyRate: policyRate,
        expectedPolicyRatePath: policyRate,
        expectedRateChangeNext12M: 0,
        ratePathLabel: "중립",
        shortTermRate: policyRate,
        treasuryBill3M,
        bondYield2Y,
        bondYield5Y,
        bondYield10Y,
        bondYield30Y,
        loanRate,
        mortgageRate: clamp(bondYield10Y + mortgageSpread, 0.006, 0.30),
        corporateLoanRate: clamp(loanRate + 0.006, 0.006, 0.32),
        depositRate: clamp(policyRate * 0.62, 0, 0.16),
        realPolicyRate: policyRate - expectedInflation,
        realLoanRate: loanRate - expectedInflation,
        realDepositRate: policyRate * 0.62 - expectedInflation,
        termSpread: bondYield10Y - policyRate,
        creditSpread,
        sovereignRiskPremium: 0.006,
        termPremium: 0.010,
        durationRiskPremium: 0.006,
        bondMarketLiquidity: 0.86,
        neutralRate: NEUTRAL_INTEREST_RATE / 100,
        rateShock: 0,
        rateUncertainty: 0.08,
        policySurprise: 0,
        mortgageSpread,
        bankNetInterestMargin: loanRate - policyRate * 0.62,
        governmentAverageFundingRate: bondYield10Y,
        interestRateDifferential: 0,
        globalPolicyRate: 0.032
      };
    }

    function createInitialMacroFinancialTransmission(config = {}) {
      const policyRate = safeNumber(config.interestRate, NEUTRAL_INTEREST_RATE / 100);
      const spending = safeNumber(config.governmentSpending, 640);
      return {
        effectivePolicyRate: policyRate,
        bondYield: policyRate + 0.008,
        treasuryBill3M: policyRate + 0.001,
        bondYield2Y: policyRate + 0.004,
        bondYield5Y: policyRate + 0.008,
        bondYield10Y: policyRate + 0.012,
        bondYield30Y: policyRate + 0.018,
        loanRate: policyRate + 0.02,
        depositRate: policyRate * 0.62,
        creditSpread: 0.02,
        financialConditionsIndex: policyRate * 100,
        riskAversion: 0.2,
        creditSupplyIndex: 100,
        wealthEffect: 0,
        fiscalSpace: 1,
        aggregateDemandPressure: 1,
        aggregateSupplyPressure: 1,
        outputGap: 0,
        inflationGap: 0,
        unemploymentGap: 0,
        governmentSpending: spending,
        householdIncomeTaxRate: safeNumber(config.householdIncomeTaxRate, 0.16),
        corporateTaxRate: safeNumber(config.corporateTaxRate, 0.18),
        valueAddedTaxRate: safeNumber(config.valueAddedTaxRate, 0.10),
        bankStress: 0.12,
        bondMarketStress: 0.10,
        bankFundingPressure: 0.12,
        interbankTrust: 0.84,
        depositorConfidence: 0.88,
        creditOfficerCaution: 0.28,
        loanDemandIndex: 100,
        creditCyclePhase: "정상",
        safeHavenDemand: 0,
        assetBubbleRisk: 0,
        housingAffordability: 1
      };
    }

    function createInitialCreditCycle() {
      return {
        phase: "정상",
        creditGap: 0,
        privateLeveragePressure: 0.18,
        underwritingQuality: 0.76,
        creditExcessRisk: 0.12,
        creditCrunchRisk: 0.12,
        eventType: "none",
        eventIntensity: 0,
        eventHalfLife: 0.93,
        monthsInPhase: 0
      };
    }

    function createInitialSentimentState() {
      return {
        consumerConfidence: 0.86,
        businessConfidence: 0.88,
        bankRiskAppetite: 0.72,
        marketRiskSentiment: 0.74,
        fiscalCredibility: 0.78,
        policyCredibility: 0.76,
        debtConcern: 0.18,
        inflationExpectations: TARGET_INFLATION,
        wageExpectationPressure: 0.10,
        priceSettingConfidence: 0.58,
        recessionFear: 0.20,
        assetBubblePsychology: 0.12,
        safeHavenSentiment: 0.16,
        policyUncertainty: 0.12,
        consumerLabel: "보통",
        businessLabel: "보통",
        bankRiskLabel: "보통",
        marketRiskLabel: "보통",
        recessionLabel: "낮음",
        fiscalCredibilityLabel: "보통"
      };
    }

    function createInitialInformationSystem() {
      return {
        publicInformationQuality: 0.82,
        householdInformationAccuracy: 0.70,
        firmInformationAccuracy: 0.78,
        bankInformationAccuracy: 0.86,
        marketInformationAccuracy: 0.74,
        policyClarity: 0.78,
        rumorIntensity: 0,
        rumorCredibility: 0,
        rumorHalfLife: 18,
        rumorType: "",
        newsShockIntensity: 0,
        informationDelay: 0.18,
        misperceptionIndex: 0.12,
        marketOverreaction: 0.10,
        informationUncertainty: 0.16,
        expectationError: 0,
        lastRumorTick: -999,
        label: "안정"
      };
    }

    function createInitialBehavioralState() {
      return {
        realEstateNeverFallsBelief: 0.46,
        stockMarketNeverFailsBelief: 0.46,
        herdIntensity: 0.18,
        fomoIntensity: 0.12,
        lossAversion: 0.55,
        confirmationBias: 0.35,
        overconfidence: 0.22,
        panicSellingPressure: 0.05,
        dipBuyingBelief: 0.32,
        narrativeStrength: 0.28,
        fundamentalPriceGap: 0,
        behavioralMispricingIndex: 0,
        housingFundamentalValue: 100,
        stockFundamentalValue: 2500,
        housingMispricing: 0,
        stockMispricing: 0,
        beliefBreakRisk: 0,
        beliefBreakdownMonths: 0,
        speculativeDemandPressure: 0.12,
        label: "보통"
      };
    }

    function createInitialExternalSector() {
      return {
        exchangeRateIndex: 100,
        exportDemand: 100,
        importPriceIndex: 100,
        commodityPriceIndex: 100,
        energyPriceIndex: 100,
        tradeBalance: 0,
        exportSales: 0,
        foreignInvestorSentiment: 0.72,
        globalRiskSentiment: 0.28,
        globalDemand: 100,
        externalShockPressure: 0,
        importInflationPressure: 0,
        exportBoost: 1,
        commodityCostPressure: 0
      };
    }

    function createInitialExternalActors() {
      return {
        foreignConsumers: { demandIndex: 100, confidence: 0.72, exportPull: 1 },
        foreignInvestors: { sentiment: 0.72, capitalFlow: 0, equityFlow: 0 },
        foreignBondholders: { demand: 0.74, fundingPressure: 0.12 },
        foreignSuppliers: { pressure: 0.18, deliveryStress: 0.12 }
      };
    }

    function createInitialModelReliability() {
      return {
        level: "보정 전",
        calibrationLoss: null,
        backtestDirectionHitRate: null,
        recentError: null,
        bestVariable: "데이터 보정 전",
        weakestVariable: "데이터 보정 전",
        lastDataset: "없음"
      };
    }

    function createInitialHistoricalScenario() {
      return {
        active: false,
        key: "",
        label: "비활성",
        month: 0,
        phaseIndex: 0,
        phaseMonth: 0,
        phases: [],
        currentPhaseLabel: "비활성",
        currentShock: "없음",
        intensity: 0
      };
    }

    function createInitialPolicyCredibility() {
      return {
        centralBankCredibility: 0.78,
        expectedRatePath: NEUTRAL_INTEREST_RATE / 100,
        forwardGuidanceClarity: 0.76,
        inflationTargetCredibility: 0.80,
        policySurprise: 0,
        marketRateExpectation: NEUTRAL_INTEREST_RATE / 100,
        ratePathLabel: "중립"
      };
    }

    function createInitialPerceivedEconomy() {
      return {
        unemployment: TARGET_UNEMPLOYMENT,
        inflation: TARGET_INFLATION,
        gdpGrowth: 0,
        firmProfitability: 0,
        bankStress: 0.12,
        assetMarketRisk: 0.15,
        fiscalRisk: 0.15,
        recessionRisk: 0.20,
        housingRisk: 0.15,
        stockMarketRisk: 0.20,
        jobSecurity: 0.75,
        housingBurden: 0.35,
        financialStress: 0.20,
        policyCredibility: 0.78,
        expectedDemand: 1,
        expectedInflation: TARGET_INFLATION,
        expectedRatePath: NEUTRAL_INTEREST_RATE / 100,
        expectedEarningsGrowth: 0,
        expectedHousingTrend: 0
      };
    }

    function createInitialClassAnalysis() {
      const base = {};
      householdClassOrder().forEach((item) => {
        base[item.key] = {
          key: item.key,
          label: item.label,
          populationShare: item.defaultShare,
          averageIncome: 0,
          averageAssets: 0,
          debtBurden: 0,
          housingBurden: 0,
          consumptionCapacity: 1,
          confidence: 0.82,
          status: "보통",
          mainPressure: "형성 중",
          policyDemand: "경제 여건 관찰",
          stress: 0.2,
          sentiment: {
            confidence: 0.82,
            inflationAnxiety: 0.2,
            jobSecurity: 0.75,
            debtAnxiety: 0.18,
            housingAnxiety: 0.18,
            assetMood: 0.5,
            policySatisfaction: 0.6
          },
          consumptionMultiplier: 1
        };
      });
      return { classes: base, mainPressureClass: "없음", sentimentGap: 0 };
    }

    function householdClassOrder() {
      return [
        { key: "low", label: "저소득층", defaultShare: 35 },
        { key: "middle", label: "중산층", defaultShare: 40 },
        { key: "high", label: "고소득층", defaultShare: 18 },
        { key: "wealthy", label: "자산가", defaultShare: 7 }
      ];
    }

    function createInitialVulnerabilityState() {
      return {
        householdVulnerability: 0.15,
        firmVulnerability: 0.15,
        bankVulnerability: 0.15,
        housingVulnerability: 0.15,
        stockVulnerability: 0.15,
        fiscalVulnerability: 0.15,
        externalVulnerability: 0.15,
        hiddenVulnerabilityIndex: 0.15,
        label: "낮음",
        dominant: "없음"
      };
    }

    // 소비자는 서로 다른 현금, 소비 성향, 금리 민감도, 선호를 갖는다.
    function createConsumers(count) {
      const preferences = ["budget", "balanced", "quality"];
      return Array.from({ length: count }, (_, id) => {
        const segmentRoll = Math.random();
        const incomeSegment = segmentRoll < 0.35 ? "low" : segmentRoll < 0.75 ? "middle" : segmentRoll < 0.93 ? "high" : "wealthy";
        const incomeClass = incomeSegment === "low" ? "저소득층" : incomeSegment === "middle" ? "중산층" : incomeSegment === "high" ? "고소득층" : "자산가";
        const consumptionPropensity = incomeSegment === "low"
          ? rand(0.72, 0.90)
          : incomeSegment === "middle"
            ? rand(0.56, 0.76)
            : incomeSegment === "high" ? rand(0.38, 0.62) : rand(0.22, 0.44);
        const initialCash = incomeSegment === "low"
          ? rand(120, 520)
          : incomeSegment === "middle"
            ? rand(360, 980)
            : incomeSegment === "high" ? rand(900, 2200) : rand(2200, 5600);
        const creditLimit = incomeSegment === "low"
          ? rand(80, 220)
          : incomeSegment === "middle"
            ? rand(170, 420)
            : incomeSegment === "high" ? rand(360, 820) : rand(700, 1600);
        const homeownerProbability = incomeSegment === "low" ? 0.22 : incomeSegment === "middle" ? 0.58 : incomeSegment === "high" ? 0.78 : 0.92;
        const ownsHome = Math.random() < homeownerProbability;
        const stockHoldings = incomeSegment === "low"
          ? rand(0, 90)
          : incomeSegment === "middle"
            ? rand(60, 460)
            : incomeSegment === "high" ? rand(520, 2800) : rand(2600, 9000);
        const housingWealth = ownsHome
          ? incomeSegment === "low"
            ? rand(260, 820)
            : incomeSegment === "middle"
              ? rand(900, 2600)
              : incomeSegment === "high" ? rand(2200, 5800) : rand(5200, 14000)
          : 0;
        const mortgageDebt = ownsHome
          ? housingWealth * (incomeSegment === "low" ? rand(0.35, 0.78) : incomeSegment === "middle" ? rand(0.28, 0.70) : rand(0.12, 0.48))
          : 0;
        const housingStatus = !ownsHome
          ? "renter"
          : mortgageDebt / Math.max(1, housingWealth) > 0.58
            ? "highMortgageOwner"
            : incomeSegment === "high"
              ? "highAssetOwner"
              : "lowMortgageOwner";
        return {
          id,
          incomeSegment,
          incomeClass,
          className: incomeClass,
          baseIncomeLevel: incomeSegment === "low" ? 0.72 : incomeSegment === "middle" ? 1 : incomeSegment === "high" ? 1.75 : 2.35,
          currentIncome: 0,
          disposableIncome: 0,
          consumptionCapacity: 1,
          classConfidence: 0.85,
          mainPressure: "형성 중",
          policyDemand: "경제 여건 관찰",
          wealthClass: incomeSegment === "wealthy" ? "자산가" : incomeSegment === "high" ? "고소득층" : ownsHome ? "주택보유층" : "비보유층",
          mpc: consumptionPropensity,
          assetExposure: incomeSegment === "low" ? 0.08 : incomeSegment === "middle" ? 0.22 : incomeSegment === "high" ? 0.52 : 0.86,
          housingExposure: ownsHome ? (incomeSegment === "middle" ? 0.62 : incomeSegment === "wealthy" ? 0.74 : 0.48) : 0.10,
          debtSensitivity: incomeSegment === "low" ? 1.25 : incomeSegment === "middle" ? 1.15 : incomeSegment === "high" ? 0.82 : 0.58,
          inflationSensitivity: incomeSegment === "low" ? 1.35 : incomeSegment === "middle" ? 1.0 : incomeSegment === "high" ? 0.72 : 0.55,
          jobRiskSensitivity: incomeSegment === "low" ? 1.35 : incomeSegment === "middle" ? 1.0 : incomeSegment === "high" ? 0.62 : 0.38,
          cash: initialCash,
          income: 0,
          consumptionPropensity,
          savingsPropensity: clamp(1 - consumptionPropensity + rand(-0.06, 0.06), 0.08, 0.55),
          debt: Math.random() < (incomeSegment === "low" ? 0.46 : incomeSegment === "middle" ? 0.34 : 0.22) ? rand(40, creditLimit * 1.25) : 0,
          interestSensitivity: rand(0.75, 2.25),
          employed: false,
          employerId: null,
          demandPreference: preferences[Math.floor(rand(0, preferences.length))],
          confidence: rand(0.82, 1.10),
          creditLimit,
          inflationExpectation: rand(1.4, 2.4),
          debtServiceTick: 0,
          mortgageDebt,
          housingStatus,
          homeValue: housingWealth,
          mortgageDebtServiceTick: 0,
          stockHoldings,
          housingWealth,
          rentBurden: ownsHome ? 0 : rand(0.10, 0.24),
          assetWealth: stockHoldings + housingWealth - mortgageDebt,
          wealthEffectSensitivity: incomeSegment === "low" ? rand(0.12, 0.24) : incomeSegment === "middle" ? rand(0.18, 0.34) : rand(0.24, 0.44),
          wealthEffect: 0,
          negativeEquity: false,
          debtStress: 0,
          stressMemory: 0,
          financiallyStressed: false,
          lastSpent: 0,
          lastTax: 0,
          smoothedConsumptionBudget: 0
        };
      });
    }

    // 생산자는 서로 다른 가격, 재고, 임금, 생산능력, 투자 성향을 갖는다.
    function createProducers(count) {
      const propertyTypes = ["assetLight", "renter", "propertyOwner", "leveragedProperty"];
      const sectorWeights = [
        ["services", 0.26],
        ["manufacturing", 0.18],
        ["technology", 0.14],
        ["financial", 0.12],
        ["agriculture", 0.10],
        ["energy", 0.10],
        ["construction", 0.10]
      ];
      const strategyWeights = [
        ["투자형", 0.28],
        ["현금보수형", 0.22],
        ["배당·자사주형", 0.20],
        ["부채축소형", 0.18],
        ["고성장형", 0.12]
      ];
      return Array.from({ length: count }, (_, id) => {
        const stockPrice = rand(50, 150);
        const sharesOutstanding = rand(0.8, 2.4);
        const propertyExposure = propertyTypes[Math.floor(rand(0, propertyTypes.length))];
        const sector = weightedPick(sectorWeights);
        let firmStrategy = weightedPick(strategyWeights);
        if (sector === "technology" && Math.random() < 0.45) firmStrategy = "고성장형";
        if (sector === "financial" && Math.random() < 0.42) firmStrategy = "현금보수형";
        if ((sector === "agriculture" || sector === "energy" || sector === "staples") && Math.random() < 0.35) firmStrategy = "배당·자사주형";
        const commercialPropertyValue = propertyExposure === "propertyOwner" || propertyExposure === "leveragedProperty" ? rand(500, 2200) : 0;
        const sectorProfile = getSectorProfile(sector);
        return {
          id,
          sector,
          firmStrategy,
          exportExposure: sectorProfile.exportExposure,
          importCostExposure: sectorProfile.importCostExposure,
          energyCostExposure: sectorProfile.energyCostExposure,
          wageCostShare: sectorProfile.wageCostShare,
          interestSensitivity: sectorProfile.interestSensitivity,
          demandSensitivity: sectorProfile.demandSensitivity,
          assetSensitivity: sectorProfile.assetSensitivity,
          creditSensitivity: sectorProfile.creditSensitivity,
          productivityTrend: sectorProfile.productivityTrend,
          sectorStress: 0,
          buybackAndDividendTick: 0,
          debtRepaymentAllocationTick: 0,
          retainedEarningsTick: 0,
          investmentConversionRate: 0,
          shareholderPayoutPreference: firmStrategy === "배당·자사주형" ? rand(0.55, 0.82) : firmStrategy === "고성장형" ? rand(0.08, 0.24) : rand(0.18, 0.44),
          creditRating: "BBB",
          ratingOutlook: "안정",
          defaultRisk: 0.04,
          zombieFirm: false,
          lowCoverageMonths: 0,
          cash: rand(900, 1900),
          inventory: rand(28, 86),
          price: rand(8.2, 14.2),
          wageOffered: state.config.baseWage * rand(0.92, 1.14),
          productionCapacity: rand(18, 38),
          investmentPropensity: rand(0.035, 0.115),
          productivity: rand(1.0, 1.9),
          debt: Math.random() < 0.28 ? rand(120, 760) : 0,
          employees: [],
          expectedDemand: rand(10, 26),
          expectedInflation: rand(0.00, 0.18),
          businessOutlook: rand(0.86, 1.08),
          inventoryBurden: 1,
          lastProfit: rand(-20, 80),
          profitTrend: rand(-8, 18),
          debtStress: 0,
          stressMemory: 0,
          financiallyStressed: false,
          activityDrag: 1,
          stockPrice,
          previousStockPrice: stockPrice,
          sharesOutstanding,
          marketCap: stockPrice * sharesOutstanding,
          initialMarketCap: stockPrice * sharesOutstanding,
          stockReturn: 0,
          expectedEarnings: 0,
          valuationPressure: 0,
          investorSentiment: rand(0.78, 1.06),
          equityFinancingCondition: 1,
          perceivedProfitability: 0,
          perceivedDebtRisk: 0.12,
          perceivedGrowth: 0,
          informationOpacity: 0.18,
          rumorSensitivity: rand(0.6, 1.5),
          propertyExposure,
          commercialPropertyValue,
          rentCost: propertyExposure === "renter" ? rand(4, 16) : 0,
          collateralValue: commercialPropertyValue,
          propertyDebt: propertyExposure === "leveragedProperty" ? commercialPropertyValue * rand(0.35, 0.72) : 0,
          hiringFreezeTicks: 0,
          firingCooldownTicks: 0,
          excessInventoryMonths: 0,
          weakDemandMonths: 0,
          negativeProfitMonths: 0,
          deepLossMonths: 0,
          positiveProfitTicks: 0,
          desiredProduction: 0,
          smoothedTargetEmployees: 0,
          longRunPrice: 10,
          lastPriceChange: 0,
          priceInertia: rand(0.04, 0.13),
          layoutJitterX: rand(-7, 7),
          layoutJitterY: rand(-7, 7),
          revenueTick: 0,
          govRevenueTick: 0,
          wageCostTick: 0,
          interestCostTick: 0,
          investmentTick: 0,
          productionTick: 0,
          unitsSoldTick: 0
        };
      });
    }

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

    function createEmptyMetrics() {
      return {
        gdp: 0,
        outputValue: 0,
        consumption: 0,
        investment: 0,
        unemploymentRate: 0,
        employedCount: 0,
        averagePrice: 0,
        inflation: 0,
        governmentBalance: 0,
        governmentDebt: 0,
        averageHouseholdCash: 0,
        averageFirmCash: 0,
        averageConfidence: 0,
        totalInventory: 0,
        productionUnits: 0,
        unitsSold: 0,
        wages: 0,
        taxCollected: 0,
        householdIncomeTaxCollected: 0,
        corporateTaxCollected: 0,
        valueAddedTaxCollected: 0,
        totalTaxCollected: 0,
        householdTaxPressure: 0,
        consumptionTaxPain: 0,
        corporateTaxPressure: 0,
        taxPolicyCredibility: 0.75,
        taxSentimentScore: 0.25,
        taxSentimentLabel: "보통",
        buybackDividendSpending: 0,
        debtRepaymentAllocation: 0,
        retainedEarningsAllocation: 0,
        investmentConversionRate: 0,
        buybackPayoutRatio: 0,
        governmentSpendingActual: 0,
        governmentDebtService: 0,
        debtToGdpRatio: 0,
        fiscalSpaceScore: 1,
        fiscalSpaceLabel: "충분함",
        governmentGDPSpending: 0,
        governmentTransfers: 0,
        governmentProcurement: 0,
        governmentSubsidies: 0,
        averageWage: 0,
        wageGrowth: 0,
        averageFirmProfit: 0,
        householdDebt: 0,
        firmDebt: 0,
        debtServiceBurden: 0,
        householdDebtStress: 0,
        firmDebtStress: 0,
        averageHouseholdDebtBurden: 0,
        averageFirmDSCR: 99,
        debtStressedHouseholdRatio: 0,
        debtStressedFirmRatio: 0,
        financiallyStressedConsumers: 0,
        financiallyStressedFirms: 0,
        averageBusinessOutlook: 0,
        sectorTotalProfit: 0,
        sectorTotalInvestment: 0,
        marketEfficiency: 0.62,
        marketFailureRisk: 0.22,
        marketSuccessScore: 0.50,
        allocationQuality: 0.62,
        competitionPressure: 0.50,
        externalityPressure: 0.12,
        informationFailure: 0.12,
        creditMisallocation: 0.12,
        inequalityDrag: 0.12,
        publicGoodsGap: 0.10,
        marketFailureType: "없음",
        marketSuccessType: "형성 중",
        accountingStatus: "PASS",
        accountingSummary: "회계 검증 대기",
        calibrationLoss: null,
        backtestDirectionHitRate: null,
        modelReliabilityLevel: "보정 전",
        monteCarloRecessionProbability: 0,
        historicalScenarioActive: 0,
        historicalScenarioIntensity: 0,
        historicalScenarioLabel: "비활성",
        historicalScenarioPhase: "비활성",
        demandPullPressure: 0,
        costPushPressure: 0,
        shortagePressure: 0,
        inflationExpectationPressure: 0,
        salesPressure: 0,
        inventoryToDemand: 0,
        interestRatePercent: 0,
        shortTermRate: 0,
        treasuryBill3M: 0,
        bondYield2Y: 0,
        bondYield5Y: 0,
        bondYield10Y: 0,
        bondYield30Y: 0,
        mortgageRate: 0,
        corporateLoanRate: 0,
        realPolicyRate: 0,
        realLoanRate: 0,
        realDepositRate: 0,
        termSpread: 0,
        rateShock: 0,
        rateUncertainty: 0,
        policySurpriseRate: 0,
        bankNetInterestMargin: 0,
        governmentAverageFundingRate: 0,
        interestRateDifferential: 0,
        globalPolicyRate: 0,
        sovereignRiskPremium: 0,
        termPremium: 0,
        durationRiskPremium: 0,
        bondMarketLiquidity: 0.86,
        shortBondPriceIndex: 100,
        mediumBondPriceIndex: 100,
        longBondPriceIndex: 100,
        bondMarketStress: 0.10,
        flightToQualityDemand: 0.05,
        depositorConfidence: 0.88,
        interbankTrust: 0.84,
        bankFundingPressure: 0.12,
        creditOfficerCaution: 0.28,
        bankCapitalConfidence: 0.82,
        loanDemandIndex: 100,
        riskUnderpricing: 0.12,
        creditCyclePhase: "정상",
        creditGap: 0,
        privateLeveragePressure: 0.18,
        underwritingQuality: 0.76,
        creditExcessRisk: 0.12,
        creditCrunchRisk: 0.12,
        potentialOutput: 0,
        outputGap: 0,
        capacityUtilization: 0,
        unemploymentGap: 0,
        inflationGap: 0,
        policyGap: 0,
        financialConditionIndex: 0,
        aggregateDemandPressure: 1,
        aggregateSupplyPressure: 1,
        consumerSentiment: 0.86,
        businessSentiment: 0.88,
        bankRiskAppetite: 0.72,
        marketRiskSentiment: 0.74,
        fiscalCredibility: 0.78,
        policyCredibility: 0.76,
        policyUncertainty: 0.12,
        publicInformationQuality: 0.82,
        householdInformationAccuracy: 0.70,
        firmInformationAccuracy: 0.78,
        bankInformationAccuracy: 0.86,
        marketInformationAccuracy: 0.74,
        policyClarity: 0.78,
        rumorIntensity: 0,
        newsShockIntensity: 0,
        informationDelay: 0.18,
        misperceptionIndex: 0.12,
        informationUncertainty: 0.16,
        marketOverreaction: 0.10,
        expectationError: 0,
        perceivedUnemployment: TARGET_UNEMPLOYMENT,
        perceivedInflation: TARGET_INFLATION,
        perceivedRecessionRisk: 0.20,
        perceivedBankStress: 0.12,
        perceivedJobSecurity: 0.75,
        perceivedHousingBurden: 0.35,
        perceivedFinancialStress: 0.20,
        perceivedPolicyCredibility: 0.78,
        sentimentInflationExpectations: TARGET_INFLATION,
        recessionFear: 0.20,
        assetBubblePsychology: 0.12,
        safeHavenSentiment: 0.16,
        debtConcern: 0.18,
        incomeInequality: 0,
        wealthInequality: 0,
        lowIncomeConsumptionCapacity: 1,
        middleClassHousingBurden: 0,
        highIncomeWealthEffect: 0,
        wealthyAssetEffect: 0,
        socialStressIndex: 0,
        lowIncomeStress: 0,
        middleClassMortgageStress: 0,
        highIncomeTaxStress: 0,
        wealthyAssetStress: 0,
        renterStress: 0,
        homeownerDebtStress: 0,
        classSentimentGap: 0,
        mainPressureClass: "없음",
        householdVulnerability: 0.15,
        firmVulnerability: 0.15,
        bankVulnerability: 0.15,
        housingVulnerability: 0.15,
        stockVulnerability: 0.15,
        fiscalVulnerability: 0.15,
        externalVulnerability: 0.15,
        hiddenVulnerabilityIndex: 0.15,
        vulnerabilityLabel: "낮음",
        stockIndex: 100,
        stockIndexPoints: 2500,
        housingIndex: 100,
        stockReturn: 0,
        stockMonthlyReturn: 0,
        stockVolatility: 0,
        stockVolatilityLabel: "보통",
        stockValuationPressure: 0,
        stockValuationPressureLabel: "낮음",
        stockRiskSentiment: 0.65,
        stockRiskSentimentLabel: "안정",
        fearGreedIndex: 50,
        fearGreedLabel: "중립",
        stockVolatilityIndex: 18,
        stockVolatilityIndexLabel: "보통",
        expectedEarningsGrowth: 0,
        expectedRatePath: 0,
        expectedRiskPremium: 0.04,
        stockExpectation: 0,
        expectationError: 0,
        stockDrawdown: 0,
        realEstateNeverFallsBelief: 0.46,
        stockMarketNeverFailsBelief: 0.46,
        herdIntensity: 0.18,
        fomoIntensity: 0.12,
        lossAversion: 0.55,
        confirmationBias: 0.35,
        overconfidence: 0.22,
        panicSellingPressure: 0.05,
        dipBuyingBelief: 0.32,
        narrativeStrength: 0.28,
        fundamentalPriceGap: 0,
        behavioralMispricingIndex: 0,
        housingFundamentalValue: 100,
        stockFundamentalValue: 2500,
        housingMispricing: 0,
        stockMispricing: 0,
        beliefBreakRisk: 0,
        beliefBreakdownMonths: 0,
        speculativeDemandPressure: 0.12,
        behaviorLabel: "보통",
        exchangeRateIndex: 100,
        exportDemand: 100,
        importPriceIndex: 100,
        commodityPriceIndex: 100,
        energyPriceIndex: 100,
        tradeBalance: 0,
        foreignInvestorSentiment: 0.72,
        foreignConsumerDemand: 100,
        foreignBondDemand: 0.74,
        foreignSupplierPressure: 0.18,
        foreignCapitalFlow: 0,
        exportConsumerDemand: 100,
        globalRiskSentiment: 0.28,
        globalDemand: 100,
        externalShockPressure: 0,
        importInflationPressure: 0,
        commodityCostPressure: 0,
        centralBankCredibility: 0.78,
        expectedRatePath: NEUTRAL_INTEREST_RATE / 100,
        forwardGuidanceClarity: 0.76,
        inflationTargetCredibility: 0.80,
        policySurprise: 0,
        marketRateExpectation: NEUTRAL_INTEREST_RATE / 100,
        ratePathLabel: "중립",
        averageCreditRatingScore: 2.6,
        distressedFirmRatio: 0,
        zombieFirmRatio: 0,
        averageDefaultRisk: 0,
        sectorStress: {},
        mostStressedSector: "없음",
        agricultureStress: 0,
        energyStress: 0,
        residentialIndex: 100,
        commercialIndex: 100,
        landIndex: 100,
        rentIndex: 100,
        residentialReturn: 0,
        commercialReturn: 0,
        commercialVacancy: 0.08,
        realEstateBubbleRisk: 0,
        realEstateStress: 0.10,
        collateralValueIndex: 100,
        averageFirmStockPrice: 100,
        highestFirmStockPrice: 150,
        lowestFirmStockPrice: 50,
        firmStockVolatility: 0,
        opaqueFirmRatio: 0,
        stockCrashFirmCount: 0,
        housingReturn: 0,
        wealthEffect: 0,
        housingAffordability: 1,
        averageMortgageBurden: 0,
        negativeEquityRatio: 0,
        assetBubbleRiskScore: 0,
        assetBubbleRiskLabel: "낮음",
        bondYield: 0,
        bondPriceIndex: 100,
        creditSpread: 0.02,
        bankHealthIndex: 100,
        creditSupplyIndex: 100,
        depositRate: 0,
        loanRate: 0,
        bankStress: 0,
        nonPerformingLoanRatio: 0,
        goldIndex: 100,
        silverIndex: 100,
        safeHavenDemand: 0,
        riskAversion: 0.2,
        liquidityStress: 0,
        bankingCrisisRiskScore: 0,
        bankingCrisisRiskLabel: "낮음",
        bankLendingStandard: "정상",
        realWageGrowth: 0,
        governmentDemand: 0,
        gini: 0
      };
    }

    // ===== 시뮬레이션 틱 =====
    // 한 단계는 노동시장, 임금 지급, 생산, 정부 지출, 소비, 투자, 가격 조정 순서로 진행된다.
    function stepSimulation() {
      try {
        runSimulationStep();
        return true;
      } catch (error) {
        state.running = false;
        repairSimulationState();
        safeUpdateAllDisplays();
        updateRunState();
        recordRuntimeError(error, "시뮬레이션 오류", "오류가 감지되어 일시정지했습니다.");
        return false;
      }
    }

    function safeStepSimulation() {
      try {
        return stepSimulation();
      } catch (error) {
        state.running = false;
        repairSimulationState();
        safeUpdateAllDisplays();
        updateRunState();
        recordRuntimeError(error, "시뮬레이션 오류", "오류가 감지되어 일시정지했습니다.");
        return false;
      }
    }

    function runSimulationStep() {
      if (state.game.status !== "active" && state.game.mode !== "sandbox") return;
      if (state.game.activeEvent) return;
      syncLivePolicy();
      applyAutomaticPolicyIfEnabled();
      syncLivePolicy();
      state.tick += 1;
      resetTickAccounting();
      advanceShockClock();
      advancePolicyTransmission();
      updateInterestRateStructure();

      updateMacroFinancialTransmission();
      updatePerceivedEconomy();
      updateExpectationsSystem();
      updateSentimentSystem();
      updateBehavioralSystem();
      updateExternalSector();
      updatePolicyCredibility();
      updateInterestRateStructure();
      updateFinancialMarkets();
      updateMacroFinancialTransmission();
      updatePerceivedEconomy();
      updateExpectationsSystem();
      updateSentimentSystem();
      updateBehavioralSystem();
      updateExternalSector();
      updatePolicyCredibility();
      updateInterestRateStructure();
      applyInterestEffects();
      computeDebtStress();
      propagateFinancialStress();
      updateWagePriceSpiral();
      updateLaborMarket();
      payWages();
      produceGoods();
      executeGovernmentSpending();
      executeConsumerPurchases();
      executeExternalTrade();
      executeProducerInvestment();
      adjustProducerPricesAndExpectations();
      collectProfitTaxes();
      updateMacroMetrics();
      updateExternalSector();
      updateAssetMarkets();
      updateFinancialMarkets();
      updateInterestRateStructure();
      updateMacroFinancialTransmission();
      updatePerceivedEconomy();
      updateExpectationsSystem();
      updateSentimentSystem();
      updateBehavioralSystem();
      updateFirmCreditRatings();
      updateZombieFirms();
      computeInequalityMetrics();
      computeSocialStress();
      computeMarketOutcome();
      updateCausalDecomposition();
      updateEarlyWarningSystem();
      advanceHistoricalScenarioTimeline();
      syncHistoricalScenarioMetrics();
      updateTaxSentimentMetrics();
      updateVulnerabilitySystem();
      applyWealthEffects();
      updateInflationExpectations();
      updateBusinessOutlook();
      updateConsumerConfidence();
      applySentimentToConsumers();
      applySentimentToFirms();
      stabilizeEconomy();
      sanitizeEconomy();
      repairSimulationState();
      updateSfcAccountingLayer();
      appendHistory();
      updateGameSystems();
      if (!state.debug.suppressVisualUpdates) {
        if (shouldUpdateDomThisTick()) safeUpdateAllDisplays();
        safeUpdateCharts();
      }
      state.debug.lastSuccessfulTickTime = performance.now();
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

    function resetTickAccounting() {
      state.metrics = createEmptyMetrics();
      state.government.taxCollectedTick = 0;
      state.government.householdIncomeTaxCollectedTick = 0;
      state.government.corporateTaxCollectedTick = 0;
      state.government.valueAddedTaxCollectedTick = 0;
      state.government.spendingActualTick = 0;
      state.government.debtServiceTick = 0;
      state.government.supportTick = 0;
      state.government.procurementTick = 0;
      state.government.subsidyTick = 0;
      state.government.publicServicesTick = 0;

      state.consumers.forEach((consumer) => {
        consumer.income = 0;
        consumer.grossIncomeTick = 0;
        consumer.disposableIncomeTick = 0;
        consumer.lastSpent = 0;
        consumer.lastTax = 0;
        consumer.debtServiceTick = 0;
        consumer.mortgageDebtServiceTick = 0;
        consumer.scheduledMortgageService = 0;
        consumer.debtBurden = 0;
      });

      state.producers.forEach((producer) => {
        producer.revenueTick = 0;
        producer.govRevenueTick = 0;
        producer.wageCostTick = 0;
        producer.interestCostTick = 0;
        producer.investmentTick = 0;
        producer.operatingCostTick = 0;
        producer.preTaxProfit = 0;
        producer.afterTaxProfit = 0;
        producer.buybackAndDividendTick = 0;
        producer.debtRepaymentAllocationTick = 0;
        producer.retainedEarningsTick = 0;
        producer.investmentConversionRate = safeNumber(producer.investmentConversionRate, 0);
        producer.dscr = safeNumber(producer.dscr, 99);
        producer.productionTick = 0;
        producer.unitsSoldTick = 0;
      });
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

    function applyInterestEffects() {
      if (!state.rates) state.rates = createInitialRateStructure(state.config || {});
      const rates = state.rates;
      const rate = safeNumber(rates.effectivePolicyRate, state.government.interestRate);
      const transmission = state.macroFinancial || createInitialMacroFinancialTransmission(state.config);
      const loanRate = safeNumber(transmission.loanRate, safeNumber(rates.loanRate, rate + 0.02));
      const corporateLoanRate = safeNumber(transmission.corporateLoanRate, safeNumber(rates.corporateLoanRate, loanRate + 0.006));
      const mortgageRate = safeNumber(transmission.mortgageRate, safeNumber(rates.mortgageRate, loanRate + 0.012));
      const depositRate = safeNumber(transmission.depositRate, safeNumber(rates.depositRate, rate * 0.65));
      const financialConditionIndex = updateFinancialConditionIndex();

      // 금리 전달 경로 1: 가계 부채 이자가 늘고, 높은 금리는 소비 심리를 직접 낮춘다.
      state.consumers.forEach((consumer) => {
        if (consumer.cash > effectiveBaseWage() * 1.4) {
          consumer.cash = clamp(consumer.cash * (1 + depositRate * 0.0025), 0, 1000000);
        }
        if (consumer.mortgageDebt > 0) {
          consumer.mortgageDebt = clamp(consumer.mortgageDebt * (1 + mortgageRate * 0.006), 0, Math.max(0, consumer.housingWealth || 0) * 1.65 + consumer.creditLimit);
          consumer.scheduledMortgageService = consumer.mortgageDebt * mortgageRate * HOUSEHOLD_DEBT_SERVICE_SCALE;
          consumer.mortgageDebtServiceTick += consumer.scheduledMortgageService * 0.15;
        }
        if (consumer.debt > 0) {
          consumer.debt = clamp(consumer.debt * (1 + loanRate * 0.018), 0, consumer.creditLimit * 3.5);
          consumer.scheduledDebtService = consumer.debt * loanRate * HOUSEHOLD_DEBT_SERVICE_SCALE;
          consumer.debtServiceTick += consumer.scheduledDebtService * 0.35;
        }

        const cashFloor = state.metrics.averagePrice > 0 ? state.metrics.averagePrice * 1.8 : 18;
        const creditAvailability = clamp(safeNumber(transmission.creditSupplyIndex, safeNumber(state.financialMarket?.creditSupplyIndex, 100)) / 100, 0.45, 1.08);
        const canBorrow = consumer.debt < consumer.creditLimit * creditAvailability && (consumer.employed || consumer.confidence > 0.74);
        if (consumer.cash < cashFloor && canBorrow) {
        const borrowAmount = Math.min(consumer.creditLimit * creditAvailability - consumer.debt, cashFloor - consumer.cash, effectiveBaseWage() * 1.4);
          if (borrowAmount > 1) {
            consumer.cash += borrowAmount;
            consumer.debt += borrowAmount;
          }
        }

        consumer.confidence = clamp(consumer.confidence - financialConditionIndex * consumer.interestSensitivity * 0.0014, 0.22, 1.28);
      });

      // 금리 전달 경로 2: 기업 차입 비용이 현금을 갉아먹고, 현금 부족 기업은 더 비싼 비용으로 차입한다.
      state.producers.forEach((producer) => {
        if (producer.debt > 0) {
          const interestCost = Math.min(producer.cash * 0.18, producer.debt * corporateLoanRate * FIRM_DEBT_SERVICE_SCALE);
          producer.cash -= interestCost;
          producer.interestCostTick = interestCost;
          producer.debt = clamp(producer.debt + producer.debt * corporateLoanRate * 0.006, 0, 12000);
        }

        const payrollNeed = producer.wageOffered * Math.max(1, producer.employees.length) * 1.15;
        const liquidityFloor = payrollNeed + producer.price * 8;
        const creditAvailability = clamp(safeNumber(transmission.creditSupplyIndex, safeNumber(state.financialMarket?.creditSupplyIndex, 100)) / 100, 0.45, 1.08);
        if (producer.cash < liquidityFloor && producer.lastProfit > -90 && producer.debt < (producer.cash * 1.8 + 1200) * creditAvailability) {
          const borrowAmount = Math.min(liquidityFloor - producer.cash, 520 + producer.expectedDemand * 4);
          if (borrowAmount > 5) {
            producer.cash += borrowAmount;
            producer.debt += borrowAmount * (1 + corporateLoanRate * 0.08);
          }
        }
      });

      state.government.debtServiceTick = clamp(
        safeNumber(state.government.debt, 0) * safeNumber(rates.governmentAverageFundingRate, safeNumber(rates.bondYield10Y, rate)) * GOVERNMENT_DEBT_SERVICE_SCALE,
        0,
        Math.max(0, safeNumber(state.government.debt, 0) * 0.025)
      );
    }

    function updateFinancialConditionIndex() {
      const householdStress = average(state.consumers.map((consumer) => consumer.debtStress || 0));
      const firmStressRatio = state.producers.length
        ? state.producers.filter(isFirmActuallyStressed).length / state.producers.length
        : 0;
      const debtServiceProxy = safeNumber(state.metrics.debtServiceBurden, 0) / 100;
      const dscrPressure = Math.max(0, 1.6 - safeNumber(state.metrics.averageFirmDSCR, 1.6)) * 0.9;
      const fiscalPressure = Math.max(0, 0.35 - safeNumber(state.metrics.fiscalSpaceScore, 1)) * 1.4;
      const financial = state.financialMarket || createInitialFinancialMarket(state.config);
      const rates = state.rates || createInitialRateStructure(state.config || {});
      const rate = safeNumber(rates.effectivePolicyRate, state.government.interestRate);
      const asset = state.assetMarket || createInitialAssetMarket();
      const stockDeclinePressure = Math.max(0, -safeNumber(asset.stockReturn, 0)) * 42;
      const housingDeclinePressure = Math.max(0, -safeNumber(asset.housingReturn, 0)) * 30;
      const affordabilityPressure = Math.max(0, safeNumber(asset.housingAffordability, 1) - 1) * 1.2;
      const bubbleFragility = safeNumber(asset.assetBubbleRisk, 0) * 0.9;
      const loanRatePressure = safeNumber(rates.loanRate, financial.loanRate || state.government.interestRate + 0.02) * 72;
      const mortgageRatePressure = Math.max(0, safeNumber(rates.mortgageRate, loanRatePressure / 72) - 0.055) * 38;
      const realRatePressure = Math.max(0, safeNumber(rates.realPolicyRate, 0)) * 48;
      const creditSpreadPressure = safeNumber(rates.creditSpread, financial.creditSpread || 0.02) * 45;
      const bankStressPressure = safeNumber(financial.bankStress, 0) * 3.4;
      const creditSupplyPressure = Math.max(0, 100 - safeNumber(financial.creditSupplyIndex, 100)) * 0.030;
      const bondPressure = Math.max(0, safeNumber(rates.bondYield10Y, financial.bondYield || state.government.interestRate) - NEUTRAL_INTEREST_RATE / 100) * 35;
      const curvePressure = Math.max(0, -safeNumber(rates.termSpread, 0)) * 18;
      const safeHavenPressure = safeNumber(financial.safeHavenDemand, 0) * 1.2;
      const liquidityPressure = safeNumber(financial.liquidityStress, 0) * 2.0;
      const bankPsychPressure = safeNumber(financial.bankFundingPressure, 0.12) * 1.3 + Math.max(0, 0.70 - safeNumber(financial.interbankTrust, 0.84)) * 1.5 + safeNumber(financial.creditOfficerCaution, 0.28) * 0.7;
      const bondMarketPressure = safeNumber(financial.bondMarketStress, 0.10) * 1.2 + Math.max(0, 100 - safeNumber(financial.longBondPriceIndex, 100)) / 100 * 1.0;
      const creditCyclePressure = safeNumber(state.creditCycle?.creditCrunchRisk, 0.12) * 1.5 - safeNumber(state.creditCycle?.creditExcessRisk, 0.12) * 0.35;
      const rawIndex = rate * 62 + loanRatePressure + mortgageRatePressure + realRatePressure + debtServiceProxy * 7 + firmStressRatio * 2.8 + householdStress * 1.2 + dscrPressure + fiscalPressure + stockDeclinePressure + housingDeclinePressure + affordabilityPressure + bubbleFragility + creditSpreadPressure + bankStressPressure + creditSupplyPressure + bondPressure + curvePressure + safeHavenPressure + liquidityPressure + bankPsychPressure + bondMarketPressure + creditCyclePressure;
      state.financialConditionIndex = clamp(smoothValue(safeNumber(state.financialConditionIndex, rawIndex), rawIndex, 0.08), 0, 35);
      if (state.assetMarket) state.assetMarket.financialConditions = clamp(state.financialConditionIndex, 0, 30);
      return clamp(state.financialConditionIndex, 0, 30);
    }

    function computeDebtStress() {
      // 부채 스트레스 로직: 이자상환 부담이 소득/현금흐름보다 커질수록 지출, 고용, 투자를 완만하게 억제한다.
      state.consumers.forEach((consumer) => {
        const debtRatio = consumer.debt / Math.max(1, consumer.creditLimit);
        const incomeBase = Math.max(1, safeNumber(consumer.disposableIncomeTick, consumer.income) + (consumer.employed ? 0 : effectiveBaseWage() * 0.20));
        const mortgageBurden = safeNumber(consumer.mortgageDebtServiceTick, 0) / incomeBase;
        consumer.mortgageBurden = smoothValue(safeNumber(consumer.mortgageBurden, mortgageBurden), mortgageBurden, 0.16);
        const debtServiceBurden = (consumer.debtServiceTick + safeNumber(consumer.mortgageDebtServiceTick, 0) * 0.65) / incomeBase;
        consumer.debtBurden = smoothValue(safeNumber(consumer.debtBurden, debtServiceBurden), debtServiceBurden, 0.18);
        const cashBufferMonths = consumer.cash / Math.max(1, effectiveBaseWage());

        // 비선형 스트레스: 부채비율을 제곱해 낮은 부채는 완만하게, 높은 부채는 급격하게 악화시킨다.
        let stress = Math.pow(debtRatio, 2) + Math.pow(Math.max(0, debtServiceBurden - 0.05), 1.35) * 2.4;
        if (cashBufferMonths < 0.8) stress += (0.8 - cashBufferMonths) * 0.24;
        if (consumer.negativeEquity) stress += 0.10 + Math.min(0.18, consumer.mortgageBurden || 0);

        // 임계점: 80%를 넘으면 신용 여력이 빠르게 줄어든 것으로 보고 스트레스를 두 배로 증폭한다.
        if (debtRatio > 0.8) stress *= 2;

        // 붕괴 구간: 120%를 넘으면 소비 여력이 급격히 무너지고 금융 스트레스 상태로 고정된다.
        if (debtRatio > 1.2) {
          stress *= 3;
          consumer.financiallyStressed = true;
          consumer.confidence = clamp(consumer.confidence * 0.94, 0.16, 1.05);
          consumer.consumptionPropensity = clamp(consumer.consumptionPropensity * 0.985, 0.32, 0.88);
        } else {
          consumer.financiallyStressed = false;
        }

        // 회복 지연: 부채비율이 내려가도 과거 스트레스가 서서히만 사라져 현실적인 회복 마찰을 만든다.
        consumer.stressMemory = safeNumber(consumer.stressMemory, 0) * 0.9 + stress * 0.1;
        consumer.debtStress = clamp(consumer.stressMemory, 0, 5);
        consumer.financialStressState = consumer.debtStress > 1.2 ? "distressed" : consumer.debtStress > 0.75 ? "stressed" : consumer.debtStress > 0.35 ? "cautious" : "normal";
      });

      state.producers.forEach((producer) => {
        const cashFlowBeforeDebtService = Math.max(0, producer.revenueTick + producer.govRevenueTick - producer.wageCostTick - safeNumber(producer.operatingCostTick, 0) + Math.max(0, producer.lastProfit) * 0.35 + producer.cash * 0.020);
        const firmDebtService = Math.max(0.01, producer.interestCostTick);
        const dscr = firmDebtService > 0 ? cashFlowBeforeDebtService / Math.max(1, firmDebtService) : 99;
        producer.dscr = smoothValue(safeNumber(producer.dscr, dscr), dscr, 0.18);
        const cashFlowBase = Math.max(1, cashFlowBeforeDebtService + producer.cash * 0.045);
        const leverage = producer.debt / Math.max(1, producer.cash + producer.productionCapacity * producer.price * 1.25);
        const serviceBurden = producer.interestCostTick / cashFlowBase;
        const payrollNeed = producer.wageOffered * Math.max(1, producer.employees.length);
        const liquidityStress = producer.cash < payrollNeed * 0.75 ? 0.14 : producer.cash < payrollNeed * 1.15 ? 0.05 : 0;
        const dscrStress = producer.dscr > 2 ? 0 : producer.dscr > 1.2 ? 0.05 : producer.dscr > 0.8 ? 0.16 : 0.34;
        const rawStress = computeNonlinearStress(leverage, serviceBurden + dscrStress + leverage * state.government.interestRate * 0.75 + liquidityStress);
        const stressWasHigh = safeNumber(producer.stressMemory, 0) > 1.25;
        const stressAlpha = rawStress > producer.debtStress ? 0.11 : (stressWasHigh ? 0.045 : 0.075);
        producer.debtStress = clamp(smoothValue(producer.debtStress, rawStress, stressAlpha), 0, 1.5);
        producer.stressMemory = clamp(smoothValue(safeNumber(producer.stressMemory, producer.debtStress), producer.debtStress, rawStress > producer.stressMemory ? 0.08 : 0.045), 0, 1.5);
        if (producer.lastProfit > 0) {
          producer.positiveProfitTicks = (producer.positiveProfitTicks || 0) + 1;
          producer.stressMemory *= producer.positiveProfitTicks >= TICKS_PER_MONTH ? 0.92 : 0.95;
          producer.debtStress *= producer.cash > payrollNeed ? 0.94 : 0.97;
        } else {
          producer.positiveProfitTicks = 0;
        }
        const recentProfitWeak = producer.lastProfit < -80 || producer.profitTrend < -140;
        const cashCritical = producer.cash < payrollNeed * 0.70;
        const serviceHigh = serviceBurden > 0.075 || producer.dscr <= 1.2;
        const persistentInventoryStress = (producer.excessInventoryMonths || 0) >= 4 && producer.inventory > producer.expectedDemand * 3.4;
        const healthyCashFlow = producer.lastProfit > 0 && producer.cash > payrollNeed * 1.15;
        producer.financiallyStressed = !healthyCashFlow && (producer.stressMemory > 0.82 || rawStress > 0.92) && (serviceHigh || recentProfitWeak || cashCritical);
        producer.financialStressCategory = producer.dscr > 2.0 && !producer.financiallyStressed
          ? "normal"
          : producer.dscr > 1.2 && !producer.financiallyStressed
            ? "cautious"
            : producer.dscr > 0.8 && !cashCritical
              ? "stressed"
              : "distressed";
        if (healthyCashFlow) {
          producer.financiallyStressed = false;
          producer.hiringFreezeTicks = Math.max(0, safeNumber(producer.hiringFreezeTicks, 0) - 2);
        }
        if ((producer.stressMemory > 0.95 || rawStress > 1.05 || producer.financiallyStressed) && (cashCritical || producer.lastProfit < -120 || persistentInventoryStress)) {
          producer.hiringFreezeTicks = Math.max(producer.hiringFreezeTicks || 0, Math.floor(TICKS_PER_MONTH * 0.35));
        }
        if (leverage > 1.75 && producer.stressMemory > 1.35 && (cashCritical || recentProfitWeak)) {
          producer.financiallyStressed = true;
          producer.hiringFreezeTicks = Math.max(producer.hiringFreezeTicks || 0, Math.floor(TICKS_PER_MONTH * 0.55));
          producer.activityDrag = clamp((producer.activityDrag || 1) * 0.985, 0.48, 0.98);
        }
      });
    }

    function propagateFinancialStress() {
      // 금융 스트레스 전파: 높은 부채상환 부담은 지출과 심리를 줄이고, 기업에는 고용/투자 동결과 약한 생산능력 손상을 만든다.
      state.consumers.forEach((consumer) => {
        const stress = clamp(consumer.stressMemory || consumer.debtStress, 0, 1);
        if (stress > 0.38) {
          const confidenceLoss = Math.pow(stress, 1.55) * 0.030;
          consumer.confidence = clamp(consumer.confidence - confidenceLoss, 0.18, 1.24);
        }
        if (!consumer.employed && consumer.cash < effectiveBaseWage() * 0.45 && consumer.debt > effectiveBaseWage()) {
          consumer.stressMemory = clamp(consumer.stressMemory + 0.012, 0, 5);
        }
        if (stress > 0.90) {
          consumer.confidence = clamp(consumer.confidence * 0.965, 0.16, 1.10);
          consumer.creditLimit = clamp(consumer.creditLimit * 0.998, 40, 900);
          consumer.debt = clamp(consumer.debt * 0.999, 0, consumer.creditLimit * 3.4);
        }
      });

      state.producers.forEach((producer) => {
        const stress = clamp(producer.stressMemory || producer.debtStress, 0, 1.5);
        const payrollNeed = producer.wageOffered * Math.max(1, producer.employees.length);
        const healthyCashFlow = producer.lastProfit > 0 && producer.cash > payrollNeed;
        producer.activityDrag = clamp(smoothValue(producer.activityDrag || 1, 1 - Math.pow(stress, 1.18) * 0.18, 0.08), 0.62, 1.05);
        if (stress > 1.05 && !healthyCashFlow) {
          producer.businessOutlook = clamp(producer.businessOutlook - Math.pow(stress, 1.20) * 0.006, 0.25, 1.40);
        }
        if (stress > 1.25 && !healthyCashFlow && (producer.cash < payrollNeed * 0.85 || producer.lastProfit < -130 || (producer.excessInventoryMonths || 0) >= 4)) {
          producer.hiringFreezeTicks = Math.max(producer.hiringFreezeTicks || 0, Math.floor(TICKS_PER_MONTH * 0.30));
          producer.desiredProduction = clamp((producer.desiredProduction || producer.expectedDemand) * 0.985, 0, producer.productionCapacity);
        }
        if (stress > 1.45 && producer.lastProfit < -120) {
          producer.productionCapacity = clamp(producer.productionCapacity * 0.9998, 2, 500);
          producer.investmentPropensity = clamp(producer.investmentPropensity * 0.9995, 0.015, 0.16);
        }
        if (healthyCashFlow) {
          producer.hiringFreezeTicks = Math.max(0, (producer.hiringFreezeTicks || 0) - 2);
          producer.activityDrag = clamp(smoothValue(producer.activityDrag || 1, 1.02, 0.08), 0.62, 1.06);
        }
      });
    }

    function updateWagePriceSpiral() {
      const unemploymentRate = calculateUnemploymentRate() / 100;
      const targetUnemployment = TARGET_UNEMPLOYMENT / 100;
      const laggedInflation = clamp(state.smoothedInflation, -2.0, 6.0) / 100;
      const laborTightnessEffect = unemploymentRate < targetUnemployment
        ? (targetUnemployment - unemploymentRate) * 0.13
        : 0;
      const unemploymentPressure = unemploymentRate > targetUnemployment
        ? (unemploymentRate - targetUnemployment) * 0.075
        : 0;
      const expectationPressure = safeNumber(state.sentiment?.wageExpectationPressure, 0.10) * 0.012;

      state.producers.forEach((producer) => {
        // 임금-가격 나선: 임금은 현재가 아니라 지연/평활화된 인플레이션에 반응하고, 낮은 실업은 협상력을 높인다.
        const passThrough = 0.28;
        const outlookPressure = clamp((producer.businessOutlook - 1) * 0.0022, -0.0024, 0.0028);
        const stressDiscount = clamp((producer.stressMemory || 0) * 0.0024, 0, 0.0032);
        const tightLaborWagePressure = unemploymentRate < 0.06 ? clamp((0.06 - unemploymentRate) * 0.026, 0.00025, 0.00135) : 0;
        const normalWageDrift = unemploymentRate < 0.10 ? clamp((0.10 - unemploymentRate) * 0.014, 0.00020, 0.00105) : 0;
        let wageChange = laggedInflation * passThrough + laborTightnessEffect + expectationPressure - unemploymentPressure + outlookPressure + normalWageDrift + tightLaborWagePressure - stressDiscount;
        wageChange = Math.tanh(wageChange * 44) / 44;
        // 임금 하방경직성: 임금은 오를 때보다 훨씬 천천히 내려가므로 실업 충격이 즉시 임금 붕괴로 이어지지 않는다.
        wageChange = clamp(wageChange, -MAX_WAGE_CHANGE_PER_TICK * 0.38, MAX_WAGE_CHANGE_PER_TICK);
        producer.wageOffered = clamp(
          producer.wageOffered * (1 + wageChange),
          effectiveBaseWage() * 0.60,
          effectiveBaseWage() * 1.88
        );
      });
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
      return executeGovernmentSpendingEngine(createEconomyRuntimeContext());
    }

    function getDebtSpendingBrake() {
      return getDebtSpendingBrakeEngine(createEconomyRuntimeContext());
    }

    // ===== 소비자 구매 =====
    // 금리가 오르면 소비 예산이 줄고, 물가 상승과 실업도 소비 심리를 낮춘다.
    function executeConsumerPurchases() {
      return executeConsumerPurchasesEngine(createEconomyRuntimeContext());
    }

    function chooseProducerForConsumer(consumer, averagePrice) {
      return chooseProducerForConsumerEngine(createEconomyRuntimeContext(), consumer, averagePrice);
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
        getRecentUnemploymentTrend,
        recordFlow
      };
    }

    // ===== 기업 투자 =====
    // 수요가 강하고 현금이 충분할수록 투자하지만, 금리가 높으면 투자 계수가 낮아진다.
    function executeProducerInvestment() {
      state.producers.forEach((producer) => {
        producer.pendingInvestments = Array.isArray(producer.pendingInvestments) ? producer.pendingInvestments : [];
        producer.pendingInvestments = producer.pendingInvestments.filter((project) => {
          project.delay -= 1;
          if (project.delay > 0) return true;
          producer.productionCapacity = clamp(producer.productionCapacity + project.capacityGain, 5, 420);
          producer.productivity = clamp(producer.productivity + project.productivityGain, 0.45, 5.2);
          return false;
        });

        const payrollBuffer = producer.wageOffered * Math.max(1, producer.employees.length) * 3.0;
        const excessCash = Math.max(0, producer.cash - payrollBuffer - 220);
        if (excessCash <= 0) return;

        // 투자 결정 관성: 설비투자는 즉시 꺾이지 않고, 집행 후에도 3~5틱 뒤 생산능력에 반영되어 경기 진동을 줄인다.
        producer.investmentDemandMemory = applyInertia(safeNumber(producer.investmentDemandMemory, producer.expectedDemand), producer.unitsSoldTick);
        const demandStrength = clamp(producer.investmentDemandMemory / Math.max(1, producer.expectedDemand), 0.15, 1.75);
        const interestFactor = 4.35;
        const inventoryRatio = producer.inventory / Math.max(1, producer.expectedDemand * 1.2);
        const inventoryInvestmentDrag = inventoryRatio > 1.4 ? clamp(1.45 / inventoryRatio, 0.35, 0.92) : inventoryRatio < 0.75 ? 1.08 : 1;
        const utilizationSignal = clamp(safeNumber(producer.productionUtilization, 0.8), 0.20, 1.08);
        const financialConditionDrag = clamp(1 - safeNumber(state.financialConditionIndex, state.government.interestRate * 100) * 0.018 * CALIBRATION.creditChannelWeight, 0.50, 1.02);
        const financingConditionMultiplier = clamp(
          safeNumber(state.assetMarket?.equityFinancingCondition, 1) * 0.55 + safeNumber(producer.equityFinancingCondition, 1) * 0.45,
          0.72,
          1.12
        );
        const transmission = state.macroFinancial || createInitialMacroFinancialTransmission(state.config);
        const info = state.information || createInitialInformationSystem();
        const perceived = state.perceived || createInitialPerceivedEconomy();
        const behavior = state.behavior || createInitialBehavioralState();
        const rates = state.rates || createInitialRateStructure(state.config || {});
        const loanRate = safeNumber(transmission.corporateLoanRate, safeNumber(rates.corporateLoanRate, state.financialMarket?.loanRate || state.government.interestRate + 0.02));
        const mortgageRate = safeNumber(transmission.mortgageRate, safeNumber(rates.mortgageRate, loanRate + 0.01));
        const longYield = safeNumber(transmission.bondYield10Y, safeNumber(rates.bondYield10Y, state.metrics.bondYield / 100));
        const ultraLongYield = safeNumber(rates.bondYield30Y, longYield);
        const realLoanRate = Math.max(0, safeNumber(transmission.realLoanRate, safeNumber(rates.realLoanRate, 0)));
        const creditSupplyMultiplier = clamp(1 + (safeNumber(transmission.creditSupplyIndex, safeNumber(state.financialMarket?.creditSupplyIndex, 100)) / 100 - 1) * CALIBRATION.creditChannelWeight, 0.58, 1.07);
        const creditSpreadDrag = clamp(1 - safeNumber(transmission.creditSpread, 0.02) * 1.8 * CALIBRATION.creditChannelWeight, 0.82, 1.02);
        const borrowingCostDrag = clamp(1 - (producer.debt / Math.max(1200, producer.cash + 1)) * loanRate * 0.9 * CALIBRATION.creditChannelWeight - realLoanRate * 0.32, 0.54, 1);
        const sectorRateDrag = clamp(1 - loanRate * safeNumber(producer.interestSensitivity, 1) * 0.28 - realLoanRate * safeNumber(producer.interestSensitivity, 1) * 0.22, 0.68, 1.03);
        const sectorExternalDrag = producer.sector === "manufacturing"
          ? clamp(1 - Math.max(0, state.metrics.importInflationPressure) * safeNumber(producer.importCostExposure, 0) * 0.045 + Math.max(0, state.metrics.exportDemand - 100) * safeNumber(producer.exportExposure, 0) * 0.0014, 0.70, 1.08)
          : producer.sector === "construction"
            ? clamp(1 - Math.max(0, state.metrics.housingAffordability - 1.25) * 0.11, 0.70, 1.02)
            : producer.sector === "technology"
              ? clamp(1 - Math.max(0, longYield * 100 - NEUTRAL_INTEREST_RATE) * 0.040, 0.70, 1.05)
              : 1;
        const sectorBehaviorMultiplier = getSectorBehaviorMultiplier(producer, state);
        const creditCycle = state.creditCycle || createInitialCreditCycle();
        const financial = state.financialMarket || createInitialFinancialMarket(state.config);
        const creditPsychMultiplier = clamp(
          1
            - safeNumber(financial.creditOfficerCaution, 0.28) * 0.080 * safeNumber(producer.creditSensitivity, 1)
            - Math.max(0, 0.62 - safeNumber(creditCycle.underwritingQuality, 0.76)) * 0.14
            - safeNumber(creditCycle.creditCrunchRisk, 0.12) * 0.13
            + safeNumber(creditCycle.creditExcessRisk, 0.12) * 0.045
            + clamp((safeNumber(financial.loanDemandIndex, 100) - 100) / 100, -0.10, 0.06)
            - Math.max(0, ultraLongYield - longYield - 0.012) * 1.2,
          0.58,
          1.06
        );
        const vulnerabilityInvestmentDrag = clamp(
          1
            - safeNumber(state.metrics.firmVulnerability, 0) * 0.08
            - safeNumber(state.metrics.bankVulnerability, 0) * 0.07
            - safeNumber(state.metrics.hiddenVulnerabilityIndex, 0) * 0.04,
          0.72,
          1.02
        );
        const constructionMortgageDrag = producer.sector === "construction"
          ? clamp(1 - Math.max(0, mortgageRate - 0.055) * 2.4, 0.62, 1.02)
          : 1;
        const ratingInvestmentDrag = producer.creditRating === "A" ? 1.04 : producer.creditRating === "BBB" ? 1 : producer.creditRating === "BB" ? 0.82 : 0.55;
        const zombieDrag = producer.zombieFirm ? 0.38 : 1;
        const strategyInvestmentMultiplier = producer.firmStrategy === "고성장형" ? 1.16
          : producer.firmStrategy === "투자형" ? 1.10
            : producer.firmStrategy === "부채축소형" ? 0.84
              : producer.firmStrategy === "배당·자사주형" ? 0.78
                : 0.92;
        const shareholderAllocationDrag = clamp(1 - safeNumber(producer.shareholderPayoutPreference, 0.2) * Math.max(0, 0.74 - safeNumber(producer.businessConfidence, producer.businessOutlook)) * 0.28, 0.80, 1.02);
        const taxReliefInvestmentGate = safeNumber(state.government?.corporateTaxRate, 0.18) < 0.15 && (safeNumber(state.metrics.aggregateDemandPressure, 1) < 0.96 || safeNumber(state.metrics.creditSupplyIndex, 100) < 82)
          ? 0.88
          : 1.02;
        const stressMemory = clamp(producer.stressMemory || producer.debtStress, 0, 1.5);
        if (stressMemory > 1.75) {
          producer.investmentDecision = applyInertia(safeNumber(producer.investmentDecision, 0), 0);
          return;
        }
        const collapseDrag = stressMemory > 1.25 ? clamp(1 - (stressMemory - 1.25) * 1.15, 0.24, 1) : 1;
        const stressInvestmentDrag = stressMemory > 1.25 ? clamp(0.72 - Math.max(0, stressMemory - 1.25) * 0.34, 0.24, 0.72) : clamp(1 - Math.pow(producer.debtStress, 1.20) * 0.25, 0.68, 1);
        const outlookInvestmentSignal = clamp(producer.businessOutlook, 0.45, 1.22);
        const responseInvestmentMultiplier = computeInvestmentResponseSignal(producer);
        const sentimentInvestmentSignal = clamp(
          0.72
            + safeNumber(producer.investmentAppetite, 0.5) * 0.34
            + safeNumber(behavior.overconfidence, 0.22) * 0.040
            - safeNumber(state.sentiment?.recessionFear, 0.2) * 0.18
            - safeNumber(behavior.herdIntensity, 0.18) * safeNumber(state.sentiment?.recessionFear, 0.2) * 0.065
            - safeNumber(behavior.panicSellingPressure, 0.05) * 0.070
            - safeNumber(perceived.recessionRisk, 0.2) * 0.08
            - safeNumber(producer.policyUncertainty, 0.1) * 0.10
            - safeNumber(info.informationUncertainty, 0.16) * 0.08
            - safeNumber(info.expectationError, 0) * 0.06,
          0.38,
          1.08
        );
        const profitMood = producer.profitTrend > 0 ? 1.10 : 0.78;
        const baseInvestment = Math.min(
          producer.cash * 0.18,
          excessCash * producer.investmentPropensity * demandStrength * profitMood * inventoryInvestmentDrag * utilizationSignal * financialConditionDrag * financingConditionMultiplier * creditSupplyMultiplier * creditSpreadDrag * borrowingCostDrag * sectorRateDrag * constructionMortgageDrag * sectorExternalDrag * sectorBehaviorMultiplier * creditPsychMultiplier * vulnerabilityInvestmentDrag * ratingInvestmentDrag * zombieDrag * strategyInvestmentMultiplier * shareholderAllocationDrag * taxReliefInvestmentGate * stressInvestmentDrag * collapseDrag * outlookInvestmentSignal * sentimentInvestmentSignal * responseInvestmentMultiplier * clamp(producer.activityDrag || 1, 0.35, 1)
        );
        // 명시적 투자 공식: investment = base * (1 - interestRate * factor)
        const maintenanceInvestment = producer.lastProfit > -35 && producer.cash > payrollBuffer * 1.15 && stressMemory < 1.20
          ? Math.min(excessCash * 0.018, producer.cash * 0.018, 6)
          : 0;
        const targetInvestment = Math.max(maintenanceInvestment, baseInvestment * clamp(1 - loanRate * interestFactor, 0.12, 1.04));
        producer.investmentDecision = smoothValue(safeNumber(producer.investmentDecision, 0), targetInvestment, 1 / Math.max(1, CALIBRATION.investmentFriction));
        const investment = clamp(producer.investmentDecision, 0, producer.cash * 0.18);

        if (investment < 1.2) return;

        producer.cash -= investment;
        producer.investmentTick += investment;
        producer.pendingInvestments.push({
          delay: Math.round(rand(3, 5)),
          capacityGain: investment / Math.max(45, producer.price * 7.5),
          productivityGain: investment / 6800 * rand(0.65, 1.25)
        });
        state.metrics.investment += investment;
        recordFlow("producer", producer.id, "producer", producer.id, investment, "investment");
      });
    }

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
      return collectProfitTaxesEngine(createEconomyRuntimeContext());
    }

    function allocateAfterTaxCashFlow(producer, afterTaxProfit) {
      return allocateAfterTaxCashFlowEngine(createEconomyRuntimeContext(), producer, afterTaxProfit);
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

    function computeScore() {
      // 점수 계산: 안정적 물가, 낮은 실업, 성장, 낮은 부채, 가계/기업 건강을 단순 가중치로 합산한다.
      const previousScore = state.game.score;
      const inflationScore = clamp(24 - Math.abs(state.metrics.inflation - 2.5) * 5.2, -12, 24);
      const unemploymentScore = clamp(24 - Math.max(0, state.metrics.unemploymentRate - 4.5) * 2.0, -18, 24);
      const gdpGrowthScore = clamp(getGDPGrowthWindow() * 1.8, -14, 18);
      const debtRatio = state.metrics.governmentDebt / Math.max(1, state.consumers.length * effectiveBaseWage() * 42);
      const debtScore = clamp(16 - debtRatio * 10, -18, 16);
      const welfareScore = clamp((state.metrics.averageConfidence - 0.72) * 24, -12, 12);
      const firmHealthScore = clamp((state.metrics.averageBusinessOutlook - 0.76) * 20 + state.metrics.averageFirmProfit / 55, -14, 14);
      const tickScore = inflationScore + unemploymentScore + gdpGrowthScore + debtScore + welfareScore + firmHealthScore;

      if (state.game.mode === "sandbox") {
        state.game.score = Math.round(tickScore);
      } else if (state.game.status === "active") {
        const elapsed = Math.max(0, state.tick - state.game.startTick);
        if (elapsed === 0) {
          state.game.score = Math.round(tickScore);
        } else {
          state.game.score = Math.round(state.game.score + clamp(tickScore / 18, -8, 9));
        }
      }

      state.game.scoreTrend = state.game.score - previousScore;
      state.game.bestScore = Math.max(state.game.bestScore, state.game.score);
    }

    function updateObjectives() {
      const mode = state.game.mode;
      const elapsed = Math.floor((state.tick - state.game.startTick) / TICKS_PER_MONTH);
      const gdpGrowth = getGDPGrowthWindow();
      const debtLimit = mode === "crisis" ? 52000 : mode === "inflation" ? 46000 : 42000;
      const objectives = [];

      if (mode === "sandbox") {
        objectives.push({ label: "기본 실험", value: "목표 없음", pass: true });
      } else {
        objectives.push({ label: "남은 기간", value: `${Math.max(0, state.game.targetTicks - elapsed)}개월`, pass: elapsed <= state.game.targetTicks });
        objectives.push({ label: "물가 안정성", value: `${signedPercent(state.metrics.inflation)}`, pass: state.metrics.inflation >= 1 && state.metrics.inflation <= (mode === "inflation" ? 4.5 : 4) });
        objectives.push({ label: "실업 관리", value: percent(state.metrics.unemploymentRate), pass: state.metrics.unemploymentRate < (mode === "inflation" ? 12 : mode === "crisis" ? 11 : 8) });
        objectives.push({ label: "정부 부채", value: money(state.metrics.governmentDebt), pass: state.metrics.governmentDebt < debtLimit });
        objectives.push({ label: "성장 흐름", value: `${formatSigned(gdpGrowth, 1)}%`, pass: mode === "crisis" ? gdpGrowth > -2 : gdpGrowth > -4 });
      }

      state.game.objectives = objectives;

      if (mode !== "sandbox" && state.game.status === "active" && elapsed >= state.game.targetTicks) {
        const passedCore = objectives.slice(1).every((objective) => objective.pass);
        if (passedCore) {
          state.game.status = "won";
          state.game.winReason = `${state.game.modeName} 목표를 달성했습니다. 안정성과 성장의 균형을 유지했습니다.`;
          showEndSummary(true);
        } else {
          state.game.status = "lost";
          state.game.failReason = "목표 기간은 버텼지만 핵심 안정 조건을 충족하지 못했습니다.";
          showEndSummary(false);
        }
      }
    }

    function checkFailureConditions() {
      // 승패 규칙: 일시적 충격은 허용하지만, 높은 물가/실업/부채/침체가 지속되면 실패한다.
      if (state.game.mode === "sandbox" || state.game.status !== "active") return;
      const elapsed = Math.floor((state.tick - state.game.startTick) / TICKS_PER_MONTH);
      const monthlyCheck = state.tick % TICKS_PER_MONTH === 0;

      if (monthlyCheck) {
        state.game.counters.highInflation = elapsed > 2 && state.metrics.inflation > 9 ? state.game.counters.highInflation + 1 : Math.max(0, state.game.counters.highInflation - 1);
        state.game.counters.highUnemployment = elapsed > 3 && state.metrics.unemploymentRate > 28 ? state.game.counters.highUnemployment + 1 : Math.max(0, state.game.counters.highUnemployment - 1);
        state.game.counters.debtCrisis = elapsed > 3 && state.metrics.governmentDebt > 72000 ? state.game.counters.debtCrisis + 1 : Math.max(0, state.game.counters.debtCrisis - 1);
        state.game.counters.recession = elapsed > 3 && getGDPGrowthWindow() < -8 ? state.game.counters.recession + 1 : Math.max(0, state.game.counters.recession - 1);
      }

      let reason = "";
      if ((elapsed > 3 && state.metrics.inflation > 18) || state.game.counters.highInflation >= 6) reason = "초고물가: 높은 물가가 너무 오래 지속되었습니다.";
      if (!reason && ((elapsed > 8 && state.metrics.unemploymentRate > 45) || state.game.counters.highUnemployment >= 8)) reason = "대량 실업: 기업 고용이 무너지고 가계 소득이 급감했습니다.";
      if (!reason && ((elapsed > 4 && state.metrics.governmentDebt > 98000) || state.game.counters.debtCrisis >= 8)) reason = "부채 위기: 정부 부채가 정책 여력을 압도했습니다.";
      if (!reason && elapsed > 8 && state.game.counters.recession >= 10) reason = "장기 침체: GDP 흐름이 너무 오래 위축되었습니다.";
      if (!reason && state.metrics.gdp < 35 && elapsed > 4) reason = "경제 붕괴: 거래와 생산이 거의 멈췄습니다.";

      if (reason) {
        state.game.status = "lost";
        state.game.failReason = reason;
        showEndSummary(false);
      }
    }

    function maybeTriggerPolicyEvent() {
      if (els.randomPolicyEventsToggle && !els.randomPolicyEventsToggle.checked) return;
      if (state.game.status !== "active" || state.game.activeEvent) return;
      if (state.game.mode === "sandbox" && state.tick < TICKS_PER_MONTH * 24) return;
      if (state.tick < state.game.nextEventTick) return;
      if (state.game.mode === "sandbox" && Math.random() > 0.32) {
        state.game.nextEventTick = state.tick + Math.floor(rand(18, 34));
        return;
      }
      triggerPolicyEvent();
    }

    // 이벤트 시스템: 선택지는 정책 변수나 에이전트 상태를 바꾸고, 각 선택의 거시경제 트레이드오프를 남긴다.
    function triggerPolicyEvent(forcedId = null) {
      const events = getPolicyEvents();
      const event = forcedId ? events.find((item) => item.id === forcedId) : events[Math.floor(rand(0, events.length))];
      if (!event) return;

      if (!els.policyEventCard || !els.policyEventTitle || !els.policyEventDescription || !els.policyEventOptions) {
        state.game.activeEvent = null;
        state.game.nextEventTick = state.tick + TICKS_PER_MONTH * 12;
        showToast("이벤트 오류", "정책 이벤트 UI를 건너뛰었습니다.");
        return;
      }

      try {
        state.game.activeEvent = event;
        state.game.wasRunningBeforeEvent = state.running;
        state.running = false;
        els.policyEventTitle.textContent = event.title;
        els.policyEventDescription.textContent = event.description;
        els.policyEventOptions.innerHTML = event.options.map((option, index) => (
          `<button type="button" data-option="${index}">${option.label}<br><span class="hint">${option.hint}</span></button>`
        )).join("");
        els.policyEventCard.classList.add("visible");
        Array.from(els.policyEventOptions.querySelectorAll("button")).forEach((button) => {
          button.addEventListener("click", () => resolvePolicyEvent(Number(button.dataset.option)));
        });
        pushEvent(`정책 선택 이벤트 발생: ${event.title}`);
        addEventMarker("이벤트");
        updateRunState();
        showToast("정책 선택 이벤트", "정책 선택 이벤트가 발생했습니다. 선택지를 고르면 계속 진행됩니다.");
      } catch (error) {
        recordRuntimeError(error, "이벤트 오류", "정책 이벤트를 건너뛰고 시뮬레이션을 계속합니다.", { silentToast: true });
        state.game.activeEvent = null;
        state.running = state.game.wasRunningBeforeEvent;
        state.game.nextEventTick = state.tick + 40;
        updateRunState();
        showToast("이벤트 오류", "정책 이벤트를 건너뛰고 시뮬레이션을 계속합니다.");
      }
    }

    function getPolicyEvents() {
      return [
        {
          id: "energy",
          title: "에너지 가격 충격",
          description: "수입 에너지 가격이 급등해 비용상승 물가 압력과 소비 위축 위험이 커졌습니다.",
          options: [
            { label: "A. 금리를 강하게 올린다", hint: "물가 기대를 낮추지만 투자와 고용이 약해집니다.", apply: () => changePolicy({ rate: 1.5, spending: -80 }, "긴축 대응: 물가 기대는 낮아지지만 투자 부담이 커졌습니다.") },
            { label: "B. 생산자 보조금을 지급한다", hint: "공급을 완충하지만 정부 부채가 늘어납니다.", apply: () => { state.government.debt += 1800; state.producers.forEach((p) => { p.cash += 90; p.businessOutlook += 0.04; }); changePolicy({ spending: 160 }, "보조금 대응: 공급 충격은 완화됐지만 부채 부담이 늘었습니다."); } },
            { label: "C. 충격을 흡수하게 둔다", hint: "재정 부담은 없지만 단기 물가가 오릅니다.", apply: () => applyShock("supply") }
          ]
        },
        {
          id: "creditBoom",
          title: "주택·신용 붐",
          description: "가계 신용이 빠르게 늘고 소비가 과열될 조짐입니다.",
          options: [
            { label: "A. 금리를 조금 올린다", hint: "부채 증가를 억제하지만 소비가 둔화됩니다.", apply: () => changePolicy({ rate: 0.75 }, "신용 붐에 대응해 금리를 올렸습니다.") },
            { label: "B. 세율을 올려 과열을 식힌다", hint: "수요는 줄지만 가처분소득도 감소합니다.", apply: () => changePolicy({ tax: 2.0 }, "세율 인상으로 과열 수요를 일부 식혔습니다.") },
            { label: "C. 소비 붐을 허용한다", hint: "성장은 좋아지지만 부채와 물가 압력이 커집니다.", apply: () => { state.consumers.forEach((c) => { c.confidence += 0.08; c.creditLimit *= 1.08; }); state.shock.demandMultiplier = 1.08; showToast("소비 붐 허용", "단기 성장은 좋아졌지만 부채와 물가 압력이 커졌습니다."); } }
          ]
        },
        {
          id: "supplyChain",
          title: "공급망 차질",
          description: "부품 조달 지연으로 기업 재고와 생산성이 흔들립니다.",
          options: [
            { label: "A. 공공 조달을 늦춘다", hint: "물가 압력은 낮아지지만 GDP 지출이 줄어듭니다.", apply: () => changePolicy({ spending: -180 }, "공공 조달을 늦춰 수요 압력을 낮췄습니다.") },
            { label: "B. 물류 투자를 지원한다", hint: "부채는 늘지만 생산성이 회복됩니다.", apply: () => { state.government.debt += 1400; state.producers.forEach((p) => { p.productivity *= 1.025; p.inventory += 4; }); changePolicy({ spending: 120 }, "물류 지원으로 생산 차질을 일부 완화했습니다."); } },
            { label: "C. 시장 조정을 기다린다", hint: "단기 재고 부족과 가격 상승이 나타납니다.", apply: () => applyShock("supply") }
          ]
        },
        {
          id: "taxProtest",
          title: "세금 저항",
          description: "가계와 기업이 높은 세율에 반발해 심리가 위축되고 있습니다.",
          options: [
            { label: "A. 세율을 낮춘다", hint: "심리는 회복되지만 재정수지가 나빠질 수 있습니다.", apply: () => changePolicy({ tax: -2.5 }, "세율 인하로 민간 심리를 달랬습니다.") },
            { label: "B. 지출 효율화를 약속한다", hint: "부채 부담을 줄이지만 단기 지원은 약해집니다.", apply: () => changePolicy({ spending: -120 }, "지출 효율화로 재정 리스크를 낮췄습니다.") },
            { label: "C. 정책을 유지한다", hint: "재정은 안정되지만 심리는 약해집니다.", apply: () => { state.consumers.forEach((c) => c.confidence *= 0.96); state.producers.forEach((p) => p.businessOutlook *= 0.96); showToast("정책 유지", "재정 안정은 유지됐지만 민간 심리는 약해졌습니다."); } }
          ]
        },
        {
          id: "productivity",
          title: "생산성 돌파",
          description: "기업들이 새로운 자동화 기술을 빠르게 도입할 기회를 잡았습니다.",
          options: [
            { label: "A. 투자 세액공제를 제공한다", hint: "부채는 늘지만 투자와 생산성이 개선됩니다.", apply: () => { state.government.debt += 1200; state.producers.forEach((p) => { p.productivity *= 1.04; p.businessOutlook += 0.08; }); changePolicy({ tax: -1.0 }, "투자 세액공제로 생산성 개선을 앞당겼습니다."); } },
            { label: "B. 민간이 알아서 투자하게 둔다", hint: "부채 부담 없이 완만한 개선이 일어납니다.", apply: () => { state.producers.forEach((p) => { p.productivity *= 1.018; p.expectedDemand *= 1.02; }); showToast("민간 투자 유도", "생산성이 완만히 개선됐습니다."); } },
            { label: "C. 노동 재교육에 지출한다", hint: "고용 안정에 좋지만 재정 지출이 늘어납니다.", apply: () => { state.consumers.forEach((c) => c.confidence += 0.025); changePolicy({ spending: 140 }, "재교육 지출로 고용 불안을 낮췄습니다."); } }
          ]
        },
        {
          id: "creditCycleStress",
          title: "신용경색 조짐",
          description: "은행 심사역이 대출 기준을 강화하고 은행 간 신뢰가 낮아지고 있습니다.",
          options: [
            { label: "A. 유동성 창구를 연다", hint: "은행 간 불안을 낮추지만 도덕적 해이 위험이 남습니다.", apply: () => { triggerCreditCycleEvent("interbankDistrust", 0.35, "유동성 창구: 은행 간 신뢰 하락을 완충했습니다."); state.financialMarket.interbankTrust = clamp(state.financialMarket.interbankTrust + 0.10, 0, 1.05); state.financialMarket.bankFundingPressure *= 0.88; } },
            { label: "B. 금리를 소폭 인하한다", hint: "차입비용은 낮아지지만 물가 기대가 흔들릴 수 있습니다.", apply: () => { triggerCreditCycleEvent("creditCrunch", 0.42, "금리 인하로 신용경색 압력을 완화했습니다."); changePolicy({ rate: -0.75 }, "신용경색 대응으로 금리를 낮췄습니다."); } },
            { label: "C. 시장 정화를 기다린다", hint: "재정 부담은 없지만 투자 둔화가 커질 수 있습니다.", apply: () => triggerCreditCycleEvent("creditCrunch", 0.76, "정책 대응 지연: 신용경색 압력이 더 오래 남습니다.") }
          ]
        },
        {
          id: "creditExcessEvent",
          title: "신용 과다 경고",
          description: "대출수요가 강하고 위험이 과소평가되며 자산가격 취약성이 누적되고 있습니다.",
          options: [
            { label: "A. 대출태도를 정상화한다", hint: "버블 위험은 낮지만 단기 성장세가 둔화됩니다.", apply: () => { state.financialMarket.creditOfficerCaution = clamp(state.financialMarket.creditOfficerCaution + 0.12, 0, 1); state.financialMarket.riskUnderpricing *= 0.78; triggerCreditCycleEvent("creditExcess", 0.32, "대출태도 정상화: 신용 과다를 완만히 낮췄습니다."); } },
            { label: "B. 금리를 조금 올린다", hint: "차입 수요를 낮추지만 주거비 부담이 커집니다.", apply: () => { triggerCreditCycleEvent("creditExcess", 0.45, "금리 인상으로 신용 과다를 견제했습니다."); changePolicy({ rate: 0.75 }, "신용 과다 대응으로 금리를 올렸습니다."); } },
            { label: "C. 호황을 용인한다", hint: "단기 GDP는 좋아지지만 나중의 조정 위험이 커집니다.", apply: () => triggerCreditCycleEvent("creditExcess", 0.82, "신용 과다 용인: 단기 호황과 장기 취약성이 함께 커졌습니다.") }
          ]
        },
        {
          id: "bondMarketEvent",
          title: "국채시장 변동성",
          description: "장기 국채금리가 흔들리며 정부 조달비용과 은행 보유채권 평가가 압박받고 있습니다.",
          options: [
            { label: "A. 정책 경로를 명확히 한다", hint: "금리 불확실성을 낮추지만 즉각적인 부양은 아닙니다.", apply: () => { state.policyCredibility.forwardGuidanceClarity = clamp(state.policyCredibility.forwardGuidanceClarity + 0.12, 0, 1); triggerCreditCycleEvent("bondVolatility", 0.36, "정책 경로 명확화로 국채 변동성을 완충했습니다."); } },
            { label: "B. 재정 경로를 조정한다", hint: "장기금리 압력은 낮지만 단기 지출 여력은 줄어듭니다.", apply: () => { triggerCreditCycleEvent("bondVolatility", 0.40, "재정 경로 조정으로 국채 위험프리미엄을 낮췄습니다."); changePolicy({ spending: -120 }, "재정 경로를 보수적으로 조정했습니다."); } },
            { label: "C. 변동성을 방치한다", hint: "시장 조정은 빠르지만 은행과 주택시장에 부담이 갑니다.", apply: () => triggerCreditCycleEvent("longRateSpike", 0.78, "장기금리 급등: 국채시장 스트레스가 실물로 전이될 수 있습니다.") }
          ]
        },
        {
          id: "banking",
          title: "은행권 스트레스",
          description: "부채상환 부담이 커지며 신용 경색 위험이 나타납니다.",
          options: [
            { label: "A. 금리를 인하한다", hint: "부채 부담을 낮추지만 물가 압력이 남을 수 있습니다.", apply: () => changePolicy({ rate: -1.25 }, "금리 인하로 신용 경색을 완화했습니다.") },
            { label: "B. 한시적 유동성 지원", hint: "기업 파산 위험은 낮아지지만 정부 부채가 늘어납니다.", apply: () => { state.government.debt += 2200; state.producers.forEach((p) => { p.cash += 120; p.debtStress *= 0.82; }); showToast("유동성 지원", "기업 현금흐름은 개선됐지만 부채가 늘었습니다."); } },
            { label: "C. 구조조정을 허용한다", hint: "부채는 정리되지만 실업이 늘 수 있습니다.", apply: () => { state.producers.forEach((p) => { p.debt *= 0.92; p.businessOutlook *= 0.92; }); fireShareOfWorkers(0.04); showToast("구조조정 허용", "부채는 줄었지만 고용 충격이 발생했습니다."); } }
          ]
        }
      ];
    }

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

    function updateMacroFinancialTransmission() {
      // 공통 거시-금융 전달 레이어: 금리, 신용, 자산, 재정, 실물 압력을 한 곳에서 정리한다.
      // 각 부문은 이 신호판을 참조해 같은 금융여건을 공유하므로, 시스템이 따로 놀지 않는다.
      if (!state.macroFinancial) state.macroFinancial = createInitialMacroFinancialTransmission(state.config);
      const previous = state.macroFinancial;
      const financial = state.financialMarket || createInitialFinancialMarket(state.config);
      const asset = state.assetMarket || createInitialAssetMarket();
      const rates = state.rates || createInitialRateStructure(state.config);
      const expectedDemand = sum(state.producers.map((producer) => safeNumber(producer.expectedDemand, 0)));
      const productiveCapacity = sum(state.producers.map((producer) => safeNumber(producer.productionCapacity, 0) * safeNumber(producer.productivity, 1)));
      const demandPressure = clamp(
        (safeNumber(state.metrics.consumption, 0) + safeNumber(state.metrics.investment, 0) + safeNumber(state.metrics.governmentGDPSpending, 0)) / Math.max(1, safeNumber(state.metrics.outputValue, 0) || expectedDemand * Math.max(1, state.metrics.averagePrice || 10)),
        0.35,
        2.4
      );
      const supplyPressure = clamp((safeNumber(state.metrics.productionUnits, 0) + expectedDemand * 0.25) / Math.max(1, productiveCapacity * 0.62), 0.35, 2.4);
      const raw = {
        effectivePolicyRate: safeNumber(rates.effectivePolicyRate, state.government?.interestRate || NEUTRAL_INTEREST_RATE / 100),
        shortTermRate: safeNumber(rates.shortTermRate, state.government?.interestRate || NEUTRAL_INTEREST_RATE / 100),
        treasuryBill3M: safeNumber(rates.treasuryBill3M, rates.shortTermRate || NEUTRAL_INTEREST_RATE / 100),
        bondYield: safeNumber(rates.bondYield10Y, financial.bondYield || NEUTRAL_INTEREST_RATE / 100),
        bondYield2Y: safeNumber(rates.bondYield2Y, NEUTRAL_INTEREST_RATE / 100),
        bondYield5Y: safeNumber(rates.bondYield5Y, NEUTRAL_INTEREST_RATE / 100),
        bondYield10Y: safeNumber(rates.bondYield10Y, NEUTRAL_INTEREST_RATE / 100),
        bondYield30Y: safeNumber(rates.bondYield30Y, rates.bondYield10Y || NEUTRAL_INTEREST_RATE / 100),
        loanRate: safeNumber(rates.loanRate, financial.loanRate || NEUTRAL_INTEREST_RATE / 100 + 0.02),
        mortgageRate: safeNumber(rates.mortgageRate, financial.loanRate || NEUTRAL_INTEREST_RATE / 100 + 0.035),
        corporateLoanRate: safeNumber(rates.corporateLoanRate, financial.loanRate || NEUTRAL_INTEREST_RATE / 100 + 0.025),
        depositRate: safeNumber(rates.depositRate, (state.government?.interestRate || NEUTRAL_INTEREST_RATE / 100) * 0.62),
        realPolicyRate: safeNumber(rates.realPolicyRate, 0),
        realLoanRate: safeNumber(rates.realLoanRate, 0),
        termSpread: safeNumber(rates.termSpread, 0),
        rateUncertainty: safeNumber(rates.rateUncertainty, 0),
        creditSpread: safeNumber(rates.creditSpread, financial.creditSpread || 0.02),
        bondMarketStress: safeNumber(financial.bondMarketStress, 0.10),
        bankFundingPressure: safeNumber(financial.bankFundingPressure, 0.12),
        interbankTrust: safeNumber(financial.interbankTrust, 0.84),
        depositorConfidence: safeNumber(financial.depositorConfidence, 0.88),
        creditOfficerCaution: safeNumber(financial.creditOfficerCaution, 0.28),
        loanDemandIndex: safeNumber(financial.loanDemandIndex, 100),
        creditCyclePhase: state.creditCycle?.phase || "정상",
        creditCrunchRisk: safeNumber(state.creditCycle?.creditCrunchRisk, 0.12),
        creditExcessRisk: safeNumber(state.creditCycle?.creditExcessRisk, 0.12),
        financialConditionsIndex: safeNumber(state.financialConditionIndex, state.metrics.financialConditionIndex || 0)
          + safeNumber(state.vulnerabilities?.hiddenVulnerabilityIndex, state.metrics.hiddenVulnerabilityIndex || 0) * 1.8
          + safeNumber(state.vulnerabilities?.bankVulnerability, state.metrics.bankVulnerability || 0) * 1.2,
        riskAversion: safeNumber(financial.riskAversion, 0.2),
        creditSupplyIndex: safeNumber(financial.creditSupplyIndex, 100),
        wealthEffect: clamp(safeNumber(asset.wealthEffect, 0), -0.10, 0.10),
        fiscalSpace: safeNumber(state.government?.fiscalSpaceScore, state.metrics.fiscalSpaceScore || 1),
        aggregateDemandPressure: demandPressure,
        aggregateSupplyPressure: supplyPressure,
        outputGap: safeNumber(state.metrics.outputGap, 0),
        inflationGap: safeNumber(state.metrics.inflationGap, safeNumber(state.metrics.inflation, TARGET_INFLATION) - TARGET_INFLATION),
        unemploymentGap: safeNumber(state.metrics.unemploymentGap, safeNumber(state.metrics.unemploymentRate, TARGET_UNEMPLOYMENT) - TARGET_UNEMPLOYMENT),
        governmentSpending: safeNumber(state.government?.effectiveSpending, state.policy ? state.policy.spendingEffective : state.config.governmentSpending),
        householdIncomeTaxRate: safeNumber(state.government?.householdIncomeTaxRate, state.policy ? state.policy.taxEffective : state.config.householdIncomeTaxRate),
        corporateTaxRate: safeNumber(state.government?.corporateTaxRate, state.policy ? state.policy.corporateTaxEffective : state.config.corporateTaxRate),
        valueAddedTaxRate: safeNumber(state.government?.valueAddedTaxRate, state.policy ? state.policy.vatEffective : state.config.valueAddedTaxRate),
        bankStress: safeNumber(financial.bankStress, 0),
        safeHavenDemand: safeNumber(financial.safeHavenDemand, 0),
        assetBubbleRisk: safeNumber(asset.assetBubbleRisk, 0),
        housingAffordability: safeNumber(state.realEstate?.housingAffordability, asset.housingAffordability || 1),
        collateralValueIndex: safeNumber(state.realEstate?.collateralValueIndex, 100),
        realEstateStress: safeNumber(state.realEstate?.realEstateStress, 0.10),
        commercialVacancy: safeNumber(state.realEstate?.commercialVacancy, 0.08)
        ,
        exchangeRateIndex: safeNumber(state.external?.exchangeRateIndex, 100),
        importPriceIndex: safeNumber(state.external?.importPriceIndex, 100),
        commodityPriceIndex: safeNumber(state.external?.commodityPriceIndex, 100),
        centralBankCredibility: safeNumber(state.policyCredibility?.centralBankCredibility, state.metrics.centralBankCredibility || 0.78),
        expectedRatePath: safeNumber(rates.expectedPolicyRatePath, state.policyCredibility?.marketRateExpectation || NEUTRAL_INTEREST_RATE / 100)
      };
      const alpha = 0.15;
      Object.entries(raw).forEach(([key, value]) => {
        previous[key] = smoothValue(safeNumber(previous[key], value), value, alpha);
      });
      previous.effectivePolicyRate = clamp(previous.effectivePolicyRate, 0, 0.35);
      previous.shortTermRate = clamp(safeNumber(previous.shortTermRate, previous.effectivePolicyRate), 0, 0.35);
      previous.treasuryBill3M = clamp(safeNumber(previous.treasuryBill3M, previous.shortTermRate), 0, 0.22);
      previous.bondYield = clamp(previous.bondYield, 0.004, 0.22);
      previous.bondYield2Y = clamp(safeNumber(previous.bondYield2Y, previous.bondYield), 0.002, 0.24);
      previous.bondYield5Y = clamp(safeNumber(previous.bondYield5Y, previous.bondYield), 0.003, 0.24);
      previous.bondYield10Y = clamp(safeNumber(previous.bondYield10Y, previous.bondYield), 0.004, 0.24);
      previous.bondYield30Y = clamp(safeNumber(previous.bondYield30Y, previous.bondYield10Y), 0.006, 0.26);
      previous.loanRate = clamp(previous.loanRate, 0.005, 0.28);
      previous.mortgageRate = clamp(safeNumber(previous.mortgageRate, previous.loanRate + 0.01), 0.006, 0.30);
      previous.corporateLoanRate = clamp(safeNumber(previous.corporateLoanRate, previous.loanRate + 0.006), 0.006, 0.32);
      previous.depositRate = clamp(previous.depositRate, 0, 0.16);
      previous.realPolicyRate = clamp(safeNumber(previous.realPolicyRate, 0), -0.08, 0.18);
      previous.realLoanRate = clamp(safeNumber(previous.realLoanRate, 0), -0.08, 0.22);
      previous.termSpread = clamp(safeNumber(previous.termSpread, previous.bondYield - previous.shortTermRate), -0.10, 0.12);
      previous.rateUncertainty = clamp(safeNumber(previous.rateUncertainty, 0), 0, 1);
      previous.creditSpread = clamp(previous.creditSpread, 0.01, 0.12);
      previous.bondMarketStress = clamp(safeNumber(previous.bondMarketStress, 0.10), 0, 1);
      previous.bankFundingPressure = clamp(safeNumber(previous.bankFundingPressure, 0.12), 0, 1);
      previous.interbankTrust = clamp(safeNumber(previous.interbankTrust, 0.84), 0, 1.05);
      previous.depositorConfidence = clamp(safeNumber(previous.depositorConfidence, 0.88), 0, 1.05);
      previous.creditOfficerCaution = clamp(safeNumber(previous.creditOfficerCaution, 0.28), 0, 1);
      previous.loanDemandIndex = clamp(safeNumber(previous.loanDemandIndex, 100), 45, 122);
      previous.creditCrunchRisk = clamp(safeNumber(previous.creditCrunchRisk, 0.12), 0, 1);
      previous.creditExcessRisk = clamp(safeNumber(previous.creditExcessRisk, 0.12), 0, 1);
      previous.financialConditionsIndex = clamp(previous.financialConditionsIndex, 0, 35);
      previous.riskAversion = clamp(previous.riskAversion, 0.05, 1);
      previous.creditSupplyIndex = clamp(previous.creditSupplyIndex, 35, 112);
      previous.wealthEffect = clamp(previous.wealthEffect, -0.10, 0.10);
      previous.fiscalSpace = clamp(previous.fiscalSpace, 0, 1);
      previous.aggregateDemandPressure = clamp(previous.aggregateDemandPressure, 0.35, 2.4);
      previous.aggregateSupplyPressure = clamp(previous.aggregateSupplyPressure, 0.35, 2.4);
      previous.bankStress = clamp(previous.bankStress, 0, 1);
      previous.safeHavenDemand = clamp(previous.safeHavenDemand, 0, 1);
      previous.assetBubbleRisk = clamp(previous.assetBubbleRisk, 0, 1);
      previous.housingAffordability = clamp(previous.housingAffordability, 0.45, 3.2);
      previous.collateralValueIndex = clamp(safeNumber(previous.collateralValueIndex, 100), 45, 260);
      previous.realEstateStress = clamp(safeNumber(previous.realEstateStress, 0.10), 0, 1);
      previous.commercialVacancy = clamp(safeNumber(previous.commercialVacancy, 0.08), 0.03, 0.35);
      previous.exchangeRateIndex = clamp(safeNumber(previous.exchangeRateIndex, 100), 70, 160);
      previous.importPriceIndex = clamp(safeNumber(previous.importPriceIndex, 100), 70, 190);
      previous.commodityPriceIndex = clamp(safeNumber(previous.commodityPriceIndex, 100), 65, 210);
      previous.centralBankCredibility = clamp(safeNumber(previous.centralBankCredibility, 0.78), 0, 1);
      previous.expectedRatePath = clamp(safeNumber(previous.expectedRatePath, NEUTRAL_INTEREST_RATE / 100), 0, 0.28);
      state.macroFinancial = previous;
      state.metrics.aggregateDemandPressure = previous.aggregateDemandPressure;
      state.metrics.aggregateSupplyPressure = previous.aggregateSupplyPressure;
    }

    function updateSentimentSystem() {
      if (!state.sentiment) state.sentiment = createInitialSentimentState();
      const sentiment = state.sentiment;
      const transmission = state.macroFinancial || createInitialMacroFinancialTransmission(state.config);
      const info = state.information || createInitialInformationSystem();
      const perceived = state.perceived || createInitialPerceivedEconomy();
      const unemploymentTrend = getRecentUnemploymentTrend();
      const gdpGrowth = getGDPGrowthWindow();
      const stockLoss = Math.max(0, -safeNumber(state.metrics.stockReturn, 0)) / 8;
      const housingLoss = Math.max(0, -safeNumber(state.metrics.housingReturn, 0)) / 4;
      const debtBurden = clamp(safeNumber(state.metrics.averageHouseholdDebtBurden, 0) / 28, 0, 1);
      const mortgageBurden = clamp(safeNumber(state.metrics.averageMortgageBurden, 0) / 18, 0, 1);
      const realIncomePressure = clamp(Math.max(0, state.metrics.inflation - state.metrics.wageGrowth) / 7, 0, 1);
      const inventoryBurden = clamp(Math.max(0, safeNumber(state.metrics.inventoryToDemand, 1) - 1.6) / 2.8, 0, 1);
      const bankStress = safeNumber(state.metrics.bankStress, safeNumber(state.financialMarket?.bankStress, 0));
      const fiscalStress = clamp(1 - safeNumber(transmission.fiscalSpace, 1), 0, 1);
      const policyShock = getRecentPolicyShock();
      const mixedMandate = state.metrics.inflationGap > 1.2 && state.metrics.unemploymentGap > 1.2 ? 0.16 : 0;

      const recessionTarget = clamp(
        Math.max(0, unemploymentTrend) * 0.040 + Math.max(0, -gdpGrowth) * 0.035 + stockLoss * 0.16 + housingLoss * 0.18 + bankStress * 0.28 + Math.max(0, state.metrics.outputGap * -0.018) + safeNumber(perceived.recessionRisk, 0.2) * 0.12 + safeNumber(info.rumorIntensity, 0) * 0.10,
        0,
        1
      );
      const inflationExpectationTarget = clamp(
        TARGET_INFLATION * 0.46 + state.metrics.inflation * 0.20 + safeNumber(perceived.expectedInflation, state.metrics.inflation) * 0.18 + state.metrics.wageGrowth * 0.08 + safeNumber(state.metrics.safeHavenDemand, 0) * 0.010 + fiscalStress * 1.15 - Math.max(0, state.metrics.unemploymentGap) * 0.045,
        -1,
        7
      );
      const debtCredibilityPressure = Math.max(0, safeNumber(state.metrics.debtToGdpRatio, 0) - 1.60);
      const fiscalCredibilityTarget = clamp(
        0.86 - debtCredibilityPressure * 0.07 - Math.max(0, -state.metrics.governmentBalance) / Math.max(700, state.metrics.gdp * 5.0) * 0.10 - Math.max(0, state.metrics.bondYield - state.metrics.interestRatePercent) * 0.010 - Math.max(0, state.metrics.inflationGap) * 0.025 + Math.max(0, gdpGrowth) * 0.012,
        0,
        1
      );
      const consumerTarget = clamp(
        0.92 - debtBurden * 0.22 - mortgageBurden * 0.16 - realIncomePressure * 0.22 - Math.max(0, unemploymentTrend) * 0.025 - recessionTarget * 0.25 - safeNumber(info.rumorIntensity, 0) * 0.06 - safeNumber(info.misperceptionIndex, 0.12) * 0.05 + transmission.wealthEffect * 1.25 + Math.max(0, state.metrics.averageConfidence - 0.9) * 0.06,
        0,
        1.2
      );
      const businessTarget = clamp(
        0.90 + clamp(state.metrics.averageFirmProfit / 900, -0.20, 0.18) + clamp(gdpGrowth * 0.010, -0.12, 0.12) - inventoryBurden * 0.23 - safeNumber(transmission.creditSpread, 0.02) * 1.45 - recessionTarget * 0.22 - policyShock * 0.14 - safeNumber(info.informationUncertainty, 0.16) * 0.08 + safeNumber(perceived.expectedEarningsGrowth, 0) * 0.70 + (safeNumber(state.metrics.stockReturn, 0) / 100) * 0.45,
        0,
        1.2
      );
      const bankRiskTarget = clamp(
        0.86 - bankStress * 0.62 - safeNumber(perceived.bankStress, bankStress) * 0.10 - safeNumber(state.metrics.nonPerformingLoanRatio, 0) * 0.018 - stockLoss * 0.16 - housingLoss * 0.22 - safeNumber(info.rumorType === "bank" ? info.rumorIntensity * 0.16 : 0, 0) - Math.max(0, unemploymentTrend) * 0.018 + Math.max(0, gdpGrowth) * 0.008,
        0,
        1.1
      );
      const marketRiskTarget = clamp(
        0.80 + safeNumber(state.metrics.stockReturn, 0) * 0.018 + safeNumber(state.metrics.housingReturn, 0) * 0.012 - safeNumber(transmission.riskAversion, 0.2) * 0.35 - recessionTarget * 0.18 - policyShock * 0.12 - safeNumber(info.marketOverreaction, 0.1) * 0.10,
        0,
        1.1
      );
      const bubbleTarget = clamp(safeNumber(state.metrics.assetBubbleRiskScore, 0) * 0.62 + Math.max(0, transmission.wealthEffect) * 2.1 + Math.max(0, TARGET_UNEMPLOYMENT - state.metrics.unemploymentRate) * 0.025 - transmission.effectivePolicyRate * 1.2, 0, 1);
      const safeHavenTarget = clamp(safeNumber(state.metrics.safeHavenDemand, 0) / 100 * 0.62 + recessionTarget * 0.25 + bankStress * 0.20 + fiscalStress * 0.18 + Math.max(0, state.metrics.inflationGap) * 0.035, 0, 1);
      const policyCredibilityTarget = clamp((fiscalCredibilityTarget * 0.55) + (Math.abs(state.metrics.inflationGap) < 1 ? 0.24 : 0.10) + (Math.abs(state.metrics.unemploymentGap) < 2 ? 0.16 : 0.05) - policyShock * 0.18 - mixedMandate, 0, 1);
      const policyUncertaintyTarget = clamp(policyShock * 0.55 + mixedMandate + (1 - fiscalCredibilityTarget) * 0.18 + Math.abs(state.metrics.policyGap) * 0.012, 0, 1);

      sentiment.consumerConfidence = sentimentSmoothing(sentiment.consumerConfidence, consumerTarget);
      sentiment.businessConfidence = sentimentSmoothing(sentiment.businessConfidence, businessTarget);
      sentiment.bankRiskAppetite = sentimentSmoothing(sentiment.bankRiskAppetite, bankRiskTarget);
      sentiment.marketRiskSentiment = sentimentSmoothing(sentiment.marketRiskSentiment, marketRiskTarget);
      sentiment.fiscalCredibility = sentimentSmoothing(sentiment.fiscalCredibility, fiscalCredibilityTarget);
      sentiment.policyCredibility = sentimentSmoothing(sentiment.policyCredibility, policyCredibilityTarget);
      sentiment.policyUncertainty = sentimentSmoothing(sentiment.policyUncertainty, policyUncertaintyTarget);
      sentiment.recessionFear = sentimentSmoothing(sentiment.recessionFear, recessionTarget);
      sentiment.inflationExpectations = smoothValue(safeNumber(sentiment.inflationExpectations, TARGET_INFLATION), inflationExpectationTarget, inflationExpectationTarget > sentiment.inflationExpectations ? 0.10 : 0.055);
      sentiment.wageExpectationPressure = clamp(smoothValue(safeNumber(sentiment.wageExpectationPressure, 0.1), Math.max(0, sentiment.inflationExpectations - TARGET_INFLATION) / 5 + Math.max(0, -state.metrics.unemploymentGap) * 0.025, 0.08), 0, 1);
      sentiment.priceSettingConfidence = clamp(smoothValue(safeNumber(sentiment.priceSettingConfidence, 0.58), 0.50 + Math.max(0, sentiment.inflationExpectations - TARGET_INFLATION) * 0.08 + Math.max(0, transmission.aggregateDemandPressure - 1) * 0.15 - inventoryBurden * 0.16, 0.08), 0, 1);
      sentiment.assetBubblePsychology = sentimentSmoothing(sentiment.assetBubblePsychology, bubbleTarget);
      sentiment.safeHavenSentiment = sentimentSmoothing(sentiment.safeHavenSentiment, safeHavenTarget);
      sentiment.debtConcern = sentimentSmoothing(sentiment.debtConcern, clamp(debtBurden * 0.38 + mortgageBurden * 0.28 + fiscalStress * 0.18 + state.metrics.creditSpread * 0.018, 0, 1));
      sentiment.consumerLabel = sentimentLabel(sentiment.consumerConfidence, true);
      sentiment.businessLabel = sentimentLabel(sentiment.businessConfidence, true);
      sentiment.bankRiskLabel = sentimentLabel(sentiment.bankRiskAppetite, true);
      sentiment.marketRiskLabel = sentimentLabel(sentiment.marketRiskSentiment, true);
      sentiment.recessionLabel = riskLabel(sentiment.recessionFear);
      sentiment.fiscalCredibilityLabel = sentimentLabel(sentiment.fiscalCredibility, true);
      syncSentimentMetrics();
    }

    function updatePerceivedEconomy() {
      updateInformationSystem();
    }

    function updateInformationSystem() {
      if (!state.information) state.information = createInitialInformationSystem();
      if (!state.perceived) state.perceived = createInitialPerceivedEconomy();
      const info = state.information;
      const perceived = state.perceived;
      const transmission = state.macroFinancial || createInitialMacroFinancialTransmission(state.config);
      computeRumorEffects();

      const volatilityPressure = clamp(safeNumber(state.assetMarket?.stockVolatilityIndex, 18) / 60, 0, 1);
      const crisisPressure = clamp(
        safeNumber(state.metrics.bankStress, 0) * 0.28
          + safeNumber(state.metrics.recessionFear, 0.2) * 0.20
          + volatilityPressure * 0.20
          + safeNumber(info.rumorIntensity, 0) * 0.18
          + safeNumber(state.metrics.policyUncertainty, 0.12) * 0.14,
        0,
        1
      );
      const clarityTarget = clamp(0.86 - getRecentPolicyShock() * 0.30 - Math.max(0, Math.abs(state.metrics.inflationGap) - 1.0) * 0.035 - Math.max(0, 0.45 - state.metrics.fiscalCredibility) * 0.18, 0.25, 0.95);
      info.policyClarity = informationSmooth(info.policyClarity, clarityTarget, true);
      info.publicInformationQuality = informationSmooth(info.publicInformationQuality, clamp(0.86 - crisisPressure * 0.32 + info.policyClarity * 0.10, 0.35, 0.95), true);
      info.householdInformationAccuracy = informationSmooth(info.householdInformationAccuracy, clamp(info.publicInformationQuality - 0.10 - info.rumorIntensity * 0.12 + info.policyClarity * 0.04, 0.25, 0.92), true);
      info.firmInformationAccuracy = informationSmooth(info.firmInformationAccuracy, clamp(info.publicInformationQuality - 0.03 - info.rumorIntensity * 0.07 + Math.max(0, state.metrics.salesPressure - 1) * 0.03, 0.35, 0.95), true);
      info.bankInformationAccuracy = informationSmooth(info.bankInformationAccuracy, clamp(0.88 - volatilityPressure * 0.10 - info.rumorIntensity * 0.06, 0.45, 0.97), true);
      info.marketInformationAccuracy = informationSmooth(info.marketInformationAccuracy, clamp(info.publicInformationQuality - volatilityPressure * 0.18 - info.rumorIntensity * 0.15, 0.25, 0.93), true);
      info.informationDelay = clamp(smoothValue(info.informationDelay, 0.08 + (1 - info.publicInformationQuality) * 0.30 + info.rumorIntensity * 0.12, 0.08), 0.05, 0.55);
      info.informationUncertainty = clamp(smoothValue(info.informationUncertainty, (1 - info.publicInformationQuality) * 0.55 + info.rumorIntensity * 0.30 + volatilityPressure * 0.20, 0.10), 0, 1);

      const actual = {
        unemployment: safeNumber(state.metrics.unemploymentRate, TARGET_UNEMPLOYMENT),
        inflation: safeNumber(state.metrics.inflation, TARGET_INFLATION),
        gdpGrowth: getGDPGrowthWindow(),
        firmProfitability: clamp(safeNumber(state.metrics.averageFirmProfit, 0) / 800, -1, 1),
        bankStress: safeNumber(state.metrics.bankStress, 0.12),
        assetMarketRisk: clamp(safeNumber(state.metrics.assetBubbleRiskScore, 0) * 0.45 + safeNumber(state.metrics.stockDrawdown, 0) / 100 * 0.35 + volatilityPressure * 0.20, 0, 1),
        fiscalRisk: clamp((1 - safeNumber(transmission.fiscalSpace, 1)) * 0.60 + Math.max(0, state.metrics.debtToGdpRatio - 1) * 0.16, 0, 1),
        recessionRisk: clamp(safeNumber(state.metrics.recessionFear, 0.2) * 0.55 + Math.max(0, -getGDPGrowthWindow()) * 0.035 + Math.max(0, state.metrics.unemploymentGap) * 0.035, 0, 1),
        housingRisk: clamp(Math.max(0, state.metrics.housingAffordability - 1.2) * 0.35 + Math.max(0, -state.metrics.housingReturn) * 0.08 + state.metrics.negativeEquityRatio / 100 * 0.25, 0, 1),
        stockMarketRisk: clamp(safeNumber(state.metrics.stockDrawdown, 0) / 100 * 0.40 + volatilityPressure * 0.35 + Math.max(0, 0.50 - safeNumber(state.metrics.marketRiskSentiment, 0.7)) * 0.25, 0, 1),
        jobSecurity: clamp(1 - safeNumber(state.metrics.unemploymentRate, TARGET_UNEMPLOYMENT) / 24 - Math.max(0, getRecentUnemploymentTrend()) * 0.030 - safeNumber(state.metrics.recessionFear, 0.2) * 0.18, 0, 1),
        housingBurden: clamp(safeNumber(state.metrics.housingAffordability, 1) / 2.6 + safeNumber(state.metrics.averageMortgageBurden, 0) / 42, 0, 1),
        financialStress: clamp(safeNumber(state.metrics.financialConditionIndex, 0) / 12 + safeNumber(state.metrics.averageHouseholdDebtBurden, 0) / 45 + safeNumber(state.metrics.bankStress, 0) * 0.28, 0, 1),
        policyCredibility: clamp((safeNumber(state.metrics.centralBankCredibility, 0.78) + safeNumber(state.metrics.fiscalCredibility, 0.78)) / 2, 0, 1)
      };

      perceived.unemployment = updatePerceivedValue(perceived.unemployment, actual.unemployment, actual.unemployment > perceived.unemployment, info.householdInformationAccuracy);
      perceived.inflation = updatePerceivedValue(perceived.inflation, actual.inflation, actual.inflation > perceived.inflation, info.householdInformationAccuracy);
      perceived.gdpGrowth = updatePerceivedValue(perceived.gdpGrowth, actual.gdpGrowth, actual.gdpGrowth < perceived.gdpGrowth, info.publicInformationQuality);
      perceived.firmProfitability = updatePerceivedValue(perceived.firmProfitability, actual.firmProfitability, actual.firmProfitability < perceived.firmProfitability, info.firmInformationAccuracy);
      perceived.bankStress = updatePerceivedValue(perceived.bankStress, actual.bankStress, actual.bankStress > perceived.bankStress, info.bankInformationAccuracy);
      perceived.assetMarketRisk = updatePerceivedValue(perceived.assetMarketRisk, actual.assetMarketRisk, actual.assetMarketRisk > perceived.assetMarketRisk, info.marketInformationAccuracy);
      perceived.fiscalRisk = updatePerceivedValue(perceived.fiscalRisk, actual.fiscalRisk, actual.fiscalRisk > perceived.fiscalRisk, info.publicInformationQuality);
      perceived.recessionRisk = updatePerceivedValue(perceived.recessionRisk, actual.recessionRisk, actual.recessionRisk > perceived.recessionRisk, info.householdInformationAccuracy);
      perceived.housingRisk = updatePerceivedValue(perceived.housingRisk, actual.housingRisk, actual.housingRisk > perceived.housingRisk, info.householdInformationAccuracy);
      perceived.stockMarketRisk = updatePerceivedValue(perceived.stockMarketRisk, actual.stockMarketRisk, actual.stockMarketRisk > perceived.stockMarketRisk, info.marketInformationAccuracy);
      perceived.jobSecurity = updatePerceivedValue(safeNumber(perceived.jobSecurity, 0.75), actual.jobSecurity, actual.jobSecurity < safeNumber(perceived.jobSecurity, 0.75), info.householdInformationAccuracy);
      perceived.housingBurden = updatePerceivedValue(safeNumber(perceived.housingBurden, 0.35), actual.housingBurden, actual.housingBurden > safeNumber(perceived.housingBurden, 0.35), info.householdInformationAccuracy);
      perceived.financialStress = updatePerceivedValue(safeNumber(perceived.financialStress, 0.20), actual.financialStress, actual.financialStress > safeNumber(perceived.financialStress, 0.20), info.publicInformationQuality);
      perceived.policyCredibility = updatePerceivedValue(safeNumber(perceived.policyCredibility, 0.78), actual.policyCredibility, actual.policyCredibility < safeNumber(perceived.policyCredibility, 0.78), info.publicInformationQuality);

      const riskGap = Math.abs(perceived.recessionRisk - actual.recessionRisk) + Math.abs(perceived.bankStress - actual.bankStress) + Math.abs(perceived.assetMarketRisk - actual.assetMarketRisk);
      info.misperceptionIndex = clamp(smoothValue(info.misperceptionIndex, riskGap / 3 + info.rumorIntensity * 0.30 + info.newsShockIntensity * 0.15, 0.10), 0, 1);
      info.marketOverreaction = clamp(smoothValue(info.marketOverreaction, Math.max(0, perceived.stockMarketRisk - actual.stockMarketRisk) * 0.55 + info.rumorIntensity * 0.22 + volatilityPressure * 0.18, 0.10), 0, 1);
      info.expectationError = clamp(smoothValue(info.expectationError, Math.abs(safeNumber(state.sentiment?.inflationExpectations, TARGET_INFLATION) - actual.inflation) / 6 + Math.abs(safeNumber(state.assetMarket?.stockExpectation, 0) - safeNumber(state.assetMarket?.stockMonthlyReturn, 0) / 100) * 2.0, 0.08), 0, 1);
      info.label = info.misperceptionIndex > 0.65 ? "불안" : info.misperceptionIndex > 0.38 ? "주의" : "안정";
      syncInformationMetrics();
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

    function computeRumorEffects() {
      const info = state.information;
      if (!info) return;
      const decay = Math.pow(0.5, 1 / Math.max(4, safeNumber(info.rumorHalfLife, 18)));
      info.rumorIntensity = clamp(safeNumber(info.rumorIntensity, 0) * decay, 0, 1);
      info.newsShockIntensity = clamp(safeNumber(info.newsShockIntensity, 0) * 0.92, 0, 1);
      if (state.tick > TICKS_PER_MONTH * 6 && state.tick - safeNumber(info.lastRumorTick, -999) > TICKS_PER_MONTH * 10 && Math.random() < 0.0025) {
        const candidates = [
          { type: "recession", label: "경기침체 우려 확산", credibility: 0.48 },
          { type: "bank", label: "은행 부실 루머", credibility: 0.42 },
          { type: "housing", label: "부동산 가격 하락 우려", credibility: 0.44 },
          { type: "rateCut", label: "금리 인하 기대 확대", credibility: 0.38 },
          { type: "earnings", label: "기업 실적 개선 기대", credibility: 0.34 },
          { type: "fiscal", label: "정부 재정 신뢰도 논란", credibility: 0.40 },
          { type: "inflation", label: "인플레이션 재가속 우려", credibility: 0.45 }
        ];
        const rumor = candidates[Math.floor(Math.random() * candidates.length)];
        info.rumorType = rumor.type;
        info.rumorIntensity = clamp(info.rumorIntensity + rand(0.18, 0.36), 0, 1);
        info.rumorCredibility = clamp(rumor.credibility + safeNumber(state.financialMarket?.bankStress, 0) * 0.15 + safeNumber(state.sentiment?.policyUncertainty, 0.1) * 0.10, 0.15, 0.85);
        info.newsShockIntensity = clamp(info.newsShockIntensity + info.rumorIntensity * 0.35, 0, 1);
        info.lastRumorTick = state.tick;
        pushEvent(`${rumor.label}: 시장 인식과 심리에 먼저 반영됩니다.`);
      }
    }

    function updateExpectationsSystem() {
      if (!state.perceived) state.perceived = createInitialPerceivedEconomy();
      if (!state.assetMarket) state.assetMarket = createInitialAssetMarket();
      const perceived = state.perceived;
      const asset = state.assetMarket;
      const info = state.information || createInitialInformationSystem();
      const sentiment = state.sentiment || createInitialSentimentState();
      perceived.expectedInflation = clamp(
        safeNumber(perceived.expectedInflation, TARGET_INFLATION) * 0.85
          + safeNumber(perceived.inflation, TARGET_INFLATION) * 0.10
          + TARGET_INFLATION * 0.05
          + safeNumber(info.rumorType === "inflation" ? info.rumorIntensity * 0.45 : 0, 0)
          - Math.max(0, safeNumber(perceived.recessionRisk, 0.2) - 0.5) * 0.08,
        -1,
        7
      );
      perceived.expectedDemand = clamp(
        safeNumber(perceived.expectedDemand, 1) * 0.75
          + clamp(safeNumber(state.metrics.salesPressure, 1), 0.4, 1.8) * 0.15
          + clamp(safeNumber(sentiment.businessConfidence, 0.8), 0.2, 1.2) * 0.10,
        0.35,
        1.9
      );
      perceived.expectedRatePath = clamp(
        safeNumber(perceived.expectedRatePath, state.government?.interestRate || 0.03) * 0.84
          + safeNumber(state.macroFinancial?.effectivePolicyRate, 0.03) * 0.10
          + (info.rumorType === "rateCut" ? -info.rumorIntensity * 0.010 : 0)
          + Math.max(0, state.metrics.inflationGap) * 0.0015,
        0,
        0.25
      );
      perceived.expectedEarningsGrowth = clamp(
        safeNumber(perceived.expectedEarningsGrowth, 0) * 0.78
          + clamp(safeNumber(state.metrics.averageFirmProfit, 0) / 1000, -0.10, 0.10) * 0.12
          + safeNumber(perceived.gdpGrowth, 0) / 100 * 0.10
          - safeNumber(perceived.recessionRisk, 0.2) * 0.025
          + (info.rumorType === "earnings" ? info.rumorIntensity * 0.025 : 0),
        -0.12,
        0.14
      );
      perceived.expectedHousingTrend = clamp(safeNumber(perceived.expectedHousingTrend, 0) * 0.82 + safeNumber(state.metrics.housingReturn, 0) / 100 * 0.10 - safeNumber(perceived.housingRisk, 0.15) * 0.015, -0.08, 0.08);
      asset.expectedEarningsGrowth = perceived.expectedEarningsGrowth;
      asset.expectedRatePath = perceived.expectedRatePath;
      asset.expectedRiskPremium = clamp(0.035 + safeNumber(perceived.stockMarketRisk, 0.2) * 0.035 + safeNumber(info.informationUncertainty, 0.16) * 0.020 - safeNumber(sentiment.marketRiskSentiment, 0.7) * 0.010, 0.015, 0.14);
      asset.stockExpectation = clamp(asset.expectedEarningsGrowth - Math.max(0, asset.expectedRatePath - NEUTRAL_INTEREST_RATE / 100) * 0.35 - asset.expectedRiskPremium * 0.18 + (safeNumber(asset.fearGreedIndex, 50) - 50) / 1000, -0.14, 0.16);
      asset.expectationError = clamp(smoothValue(safeNumber(asset.expectationError, 0), safeNumber(asset.stockMonthlyReturn, 0) / 100 - asset.stockExpectation, 0.08), -0.35, 0.35);
    }

    function syncInformationMetrics() {
      if (!state.metrics || !state.information || !state.perceived) return;
      const i = state.information;
      const p = state.perceived;
      state.metrics.publicInformationQuality = safeNumber(i.publicInformationQuality, 0.82);
      state.metrics.householdInformationAccuracy = safeNumber(i.householdInformationAccuracy, 0.70);
      state.metrics.firmInformationAccuracy = safeNumber(i.firmInformationAccuracy, 0.78);
      state.metrics.bankInformationAccuracy = safeNumber(i.bankInformationAccuracy, 0.86);
      state.metrics.marketInformationAccuracy = safeNumber(i.marketInformationAccuracy, 0.74);
      state.metrics.policyClarity = safeNumber(i.policyClarity, 0.78);
      state.metrics.rumorIntensity = safeNumber(i.rumorIntensity, 0);
      state.metrics.newsShockIntensity = safeNumber(i.newsShockIntensity, 0);
      state.metrics.informationDelay = safeNumber(i.informationDelay, 0.18);
      state.metrics.misperceptionIndex = safeNumber(i.misperceptionIndex, 0.12);
      state.metrics.informationUncertainty = safeNumber(i.informationUncertainty, 0.16);
      state.metrics.marketOverreaction = safeNumber(i.marketOverreaction, 0.10);
      state.metrics.expectationError = safeNumber(i.expectationError, 0);
      state.metrics.perceivedUnemployment = safeNumber(p.unemployment, TARGET_UNEMPLOYMENT);
      state.metrics.perceivedInflation = safeNumber(p.inflation, TARGET_INFLATION);
      state.metrics.perceivedRecessionRisk = safeNumber(p.recessionRisk, 0.2);
      state.metrics.perceivedBankStress = safeNumber(p.bankStress, 0.12);
      state.metrics.perceivedJobSecurity = safeNumber(p.jobSecurity, 0.75);
      state.metrics.perceivedHousingBurden = safeNumber(p.housingBurden, 0.35);
      state.metrics.perceivedFinancialStress = safeNumber(p.financialStress, 0.20);
      state.metrics.perceivedPolicyCredibility = safeNumber(p.policyCredibility, 0.78);
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

    function syncSentimentMetrics() {
      if (!state.metrics || !state.sentiment) return;
      const s = state.sentiment;
      state.metrics.consumerSentiment = safeNumber(s.consumerConfidence, 0.8);
      state.metrics.businessSentiment = safeNumber(s.businessConfidence, 0.8);
      state.metrics.bankRiskAppetite = safeNumber(s.bankRiskAppetite, 0.7);
      state.metrics.marketRiskSentiment = safeNumber(s.marketRiskSentiment, 0.7);
      state.metrics.fiscalCredibility = safeNumber(s.fiscalCredibility, 0.75);
      state.metrics.policyCredibility = safeNumber(s.policyCredibility, 0.75);
      state.metrics.policyUncertainty = safeNumber(s.policyUncertainty, 0.1);
      state.metrics.sentimentInflationExpectations = safeNumber(s.inflationExpectations, TARGET_INFLATION);
      state.metrics.recessionFear = safeNumber(s.recessionFear, 0.2);
      state.metrics.assetBubblePsychology = safeNumber(s.assetBubblePsychology, 0.1);
      state.metrics.safeHavenSentiment = safeNumber(s.safeHavenSentiment, 0.1);
      state.metrics.debtConcern = safeNumber(s.debtConcern, 0.1);
    }

    function updateBehavioralSystem() {
      // 행동경제 레이어: 가격과 기초여건 사이의 괴리, 군중심리, 불패 믿음이 실제 의사결정에 작은 편향으로 반영된다.
      if (!state.behavior) state.behavior = createInitialBehavioralState();
      const b = state.behavior;
      const info = state.information || createInitialInformationSystem();
      const sentiment = state.sentiment || createInitialSentimentState();
      const asset = state.assetMarket || createInitialAssetMarket();
      const realEstate = state.realEstate || createInitialRealEstateMarket();
      const financial = state.financialMarket || createInitialFinancialMarket(state.config);
      const avgDisposableIncome = Math.max(1, average(state.consumers.map((consumer) => safeNumber(consumer.disposableIncomeTick, consumer.income || effectiveBaseWage() * 0.55))));
      const employmentStability = clamp(1 - safeNumber(state.metrics.unemploymentRate, TARGET_UNEMPLOYMENT) / 100, 0.35, 1);
      const creditEase = clamp(safeNumber(financial.creditSupplyIndex, 100) / 100, 0.35, 1.15);
      const affordabilityRelief = clamp(1 / Math.max(0.55, safeNumber(realEstate.housingAffordability, 1)), 0.55, 1.25);
      const rentSupport = clamp(safeNumber(realEstate.rentIndex, 100) / 100, 0.70, 1.90);
      const housingFundamental = clamp(
        100
          * clamp(avgDisposableIncome / Math.max(1, effectiveBaseWage() * 0.65), 0.45, 1.75)
          * affordabilityRelief
          * clamp(0.72 + employmentStability * 0.32 + creditEase * 0.12 + rentSupport * 0.10 - Math.max(0, realEstate.mortgageRate - 0.055) * 2.4, 0.45, 1.65),
        72,
        240
      );
      const earningsProxy = Math.max(1, sum(state.producers.map((producer) => Math.max(0, safeNumber(producer.afterTaxProfit, producer.lastProfit)))));
      const growthSupport = clamp(1 + safeNumber(state.perceived?.expectedEarningsGrowth, 0) * 2.8 + getGDPGrowthWindow() / 100 * 0.55, 0.50, 1.75);
      const discountDrag = clamp(1 + Math.max(0, safeNumber(financial.bondYield, 0.04) - 0.03) * 7.5 + safeNumber(financial.creditSpread, 0.02) * 2.8 + safeNumber(asset.expectedRiskPremium, 0.04) * 1.6, 0.65, 2.4);
      const stockFundamental = clamp((2550 + earningsProxy * 13.5 + Math.max(0, state.metrics.gdp) * 2.2) * growthSupport / Math.max(0.85, discountDrag * 0.82), 1900, 8200);
      const housingMispricing = clamp(safeNumber(realEstate.residentialIndex, 100) / Math.max(1, housingFundamental) - 1, -0.55, 1.60);
      const stockMispricing = clamp(safeNumber(asset.stockIndexPoints, 2500) / Math.max(1, stockFundamental) - 1, -0.65, 1.80);
      const housingMomentum = getAverageHistoryChange("residentialIndex", 16, safeNumber(realEstate.residentialIndex, 100)) / 100;
      const stockMomentum = getAverageHistoryChange("stockIndexPoints", 16, safeNumber(asset.stockIndexPoints, 2500)) / 2500;
      const beliefBreakRisk = clamp(
        Math.max(0, -housingMomentum) * 10
          + safeNumber(state.metrics.negativeEquityRatio, 0) / 22
          + safeNumber(financial.bankStress, 0) * 0.42
          + Math.max(0, safeNumber(state.metrics.averageMortgageBurden, 0) - 10) / 24
          + Math.max(0, getRecentUnemploymentTrend()) * 0.055
          + safeNumber(realEstate.realEstateStress, 0.1) * 0.24,
        0,
        1
      );
      const realEstateBeliefTarget = clamp(
        0.38
          + Math.max(0, housingMomentum) * 7.0
          + Math.max(0, TARGET_UNEMPLOYMENT - state.metrics.unemploymentRate) * 0.035
          + Math.max(0, creditEase - 0.95) * 0.30
          + safeNumber(realEstate.housingSupplyConstraint, 0.42) * 0.24
          + safeNumber(info.rumorType === "housing" && info.rumorIntensity > 0 ? -info.rumorIntensity * 0.18 : 0, 0)
          - beliefBreakRisk * 0.70
          - Math.max(0, realEstate.housingAffordability - 1.75) * 0.10,
        0,
        1
      );
      const stockBeliefBreak = clamp(
        safeNumber(asset.stockDrawdownFromPeak, 0) * 1.10
          + Math.max(0, -safeNumber(state.metrics.averageFirmProfit, 0)) / 900
          + Math.max(0, safeNumber(financial.creditSpread, 0.02) - 0.04) * 6
          + safeNumber(financial.bankStress, 0) * 0.32
          + Math.max(0, safeNumber(state.macroFinancial?.effectivePolicyRate, 0.03) - 0.06) * 4.2
          + safeNumber(sentiment.recessionFear, 0.2) * 0.34,
        0,
        1
      );
      const stockBeliefTarget = clamp(
        0.36
          + Math.max(0, stockMomentum) * 8.2
          + Math.max(0, 0.055 - safeNumber(state.macroFinancial?.effectivePolicyRate, 0.03)) * 4.0
          + Math.max(0, safeNumber(financial.creditSupplyIndex, 100) - 95) * 0.006
          + safeNumber(sentiment.businessConfidence, 0.8) * 0.16
          + Math.max(0, safeNumber(asset.fearGreedIndex, 50) - 55) * 0.006
          - stockBeliefBreak * 0.68,
        0,
        1
      );
      const narrativeTarget = clamp(
        Math.max(realEstateBeliefTarget, stockBeliefTarget) * 0.48
          + safeNumber(info.rumorIntensity, 0) * 0.18
          + (1 - safeNumber(info.publicInformationQuality, 0.82)) * 0.24
          + safeNumber(sentiment.assetBubblePsychology, 0.12) * 0.24,
        0,
        1
      );
      const fomoTarget = clamp(Math.max(0, housingMomentum) * 5.8 + Math.max(0, stockMomentum) * 7.0 + Math.max(0, 50 - state.metrics.unemploymentRate) * 0.003 + Math.max(0, asset.fearGreedIndex - 60) * 0.010 + Math.max(0, creditEase - 0.95) * 0.22, 0, 1);
      const herdTarget = computeHerdBehavior(housingMomentum, stockMomentum);
      const confirmationTarget = clamp(narrativeTarget * 0.48 + safeNumber(info.informationUncertainty, 0.16) * 0.24 + Math.max(realEstateBeliefTarget, stockBeliefTarget) * 0.28 + safeNumber(sentiment.recessionFear, 0.2) * 0.10, 0, 1);
      const lossTarget = clamp(0.46 + safeNumber(asset.stockDrawdownFromPeak, 0) * 0.32 + Math.max(0, -housingMomentum) * 2.8 + safeNumber(state.metrics.negativeEquityRatio, 0) / 120 + safeNumber(info.misperceptionIndex, 0.12) * 0.15, 0.2, 1);
      const dipTarget = clamp(stockBeliefTarget * 0.52 + safeNumber(sentiment.policyCredibility, 0.76) * 0.18 + Math.max(0, -safeNumber(asset.stockReturn, 0)) * 10 - stockBeliefBreak * 0.35, 0, 1);
      const panicTarget = clamp(stockBeliefBreak * 0.46 + beliefBreakRisk * 0.30 + safeNumber(asset.stockVolatilityIndex, 18) / 100 * 0.20 + safeNumber(info.rumorIntensity, 0) * 0.16 + Math.max(0, -stockMomentum) * 4.5 - dipTarget * 0.18, 0, 1);
      b.housingFundamentalValue = smoothValue(safeNumber(b.housingFundamentalValue, housingFundamental), housingFundamental, 0.10);
      b.stockFundamentalValue = smoothValue(safeNumber(b.stockFundamentalValue, stockFundamental), stockFundamental, 0.10);
      b.housingMispricing = smoothValue(safeNumber(b.housingMispricing, 0), housingMispricing, 0.10);
      b.stockMispricing = smoothValue(safeNumber(b.stockMispricing, 0), stockMispricing, 0.10);
      b.fundamentalPriceGap = clamp(Math.max(Math.abs(b.housingMispricing), Math.abs(b.stockMispricing)), 0, 2);
      b.behavioralMispricingIndex = clamp(smoothValue(safeNumber(b.behavioralMispricingIndex, 0), Math.max(0, b.housingMispricing) * 0.34 + Math.max(0, b.stockMispricing) * 0.38 + confirmationTarget * 0.08, 0.10), 0, 1.5);
      b.beliefBreakRisk = smoothValue(safeNumber(b.beliefBreakRisk, 0), Math.max(beliefBreakRisk, stockBeliefBreak), 0.12);
      b.realEstateNeverFallsBelief = behavioralSmoothing(b.realEstateNeverFallsBelief, realEstateBeliefTarget);
      b.stockMarketNeverFailsBelief = behavioralSmoothing(b.stockMarketNeverFailsBelief, stockBeliefTarget);
      b.herdIntensity = behavioralSmoothing(b.herdIntensity, herdTarget);
      b.fomoIntensity = behavioralSmoothing(b.fomoIntensity, fomoTarget);
      b.lossAversion = behavioralSmoothing(b.lossAversion, lossTarget);
      b.confirmationBias = behavioralSmoothing(b.confirmationBias, confirmationTarget);
      b.overconfidence = behavioralSmoothing(b.overconfidence, clamp((b.realEstateNeverFallsBelief + b.stockMarketNeverFailsBelief) * 0.32 + b.fomoIntensity * 0.22 + Math.max(0, asset.fearGreedIndex - 55) * 0.006, 0, 1));
      b.dipBuyingBelief = behavioralSmoothing(b.dipBuyingBelief, dipTarget);
      b.panicSellingPressure = behavioralSmoothing(b.panicSellingPressure, panicTarget);
      b.narrativeStrength = behavioralSmoothing(b.narrativeStrength, narrativeTarget);
      b.speculativeDemandPressure = clamp(smoothValue(safeNumber(b.speculativeDemandPressure, 0.12), b.fomoIntensity * 0.28 + b.realEstateNeverFallsBelief * 0.24 + b.stockMarketNeverFailsBelief * 0.18 + Math.max(0, b.housingMispricing) * 0.12, 0.10), 0, 1);
      b.beliefBreakdownMonths = b.beliefBreakRisk > 0.62 ? safeNumber(b.beliefBreakdownMonths, 0) + 1 / TICKS_PER_MONTH : Math.max(0, safeNumber(b.beliefBreakdownMonths, 0) - 0.15 / TICKS_PER_MONTH);
      b.label = b.behavioralMispricingIndex > 0.85 || b.panicSellingPressure > 0.70 ? "위험" : b.behavioralMispricingIndex > 0.55 || b.fomoIntensity > 0.65 ? "과열" : b.herdIntensity > 0.42 ? "높음" : "보통";
      syncBehaviorMetrics();
    }

    function behavioralSmoothing(oldValue, targetValue) {
      const oldSafe = safeNumber(oldValue, targetValue);
      const targetSafe = clamp(safeNumber(targetValue, oldSafe), 0, 1.8);
      const fearWorsens = targetSafe > oldSafe && (targetSafe > 0.55 || state.behavior?.panicSellingPressure > 0.45);
      const alpha = fearWorsens ? 0.16 : 0.075;
      return clamp(oldSafe * (1 - alpha) + targetSafe * alpha, 0, 1.8);
    }

    function computeHerdBehavior(housingMomentum = 0, stockMomentum = 0) {
      const info = state.information || createInitialInformationSystem();
      const asset = state.assetMarket || createInitialAssetMarket();
      const extremeFearGreed = Math.abs(safeNumber(asset.fearGreedIndex, 50) - 50) / 50;
      const broadConsumptionCut = state.history.length > 8 && getTrendDelta("consumption", 8) < -12 ? 0.16 : 0;
      const broadInvestmentCut = state.history.length > 8 && getTrendDelta("investment", 8) < -6 ? 0.14 : 0;
      return clamp(
        Math.abs(housingMomentum) * 5.0
          + Math.abs(stockMomentum) * 6.4
          + extremeFearGreed * 0.34
          + safeNumber(info.rumorIntensity, 0) * 0.24
          + (1 - safeNumber(info.publicInformationQuality, 0.82)) * 0.20
          + broadConsumptionCut
          + broadInvestmentCut,
        0,
        1
      );
    }

    function getAverageHistoryChange(key, windowSize = 12, fallback = 0) {
      if (!state.history.length) return 0;
      const current = safeNumber(state.history[state.history.length - 1]?.[key], fallback);
      const previous = safeNumber(state.history[Math.max(0, state.history.length - windowSize)]?.[key], current);
      return current - previous;
    }

    function syncBehaviorMetrics() {
      if (!state.metrics || !state.behavior) return;
      const b = state.behavior;
      state.metrics.realEstateNeverFallsBelief = safeNumber(b.realEstateNeverFallsBelief, 0.46);
      state.metrics.stockMarketNeverFailsBelief = safeNumber(b.stockMarketNeverFailsBelief, 0.46);
      state.metrics.herdIntensity = safeNumber(b.herdIntensity, 0.18);
      state.metrics.fomoIntensity = safeNumber(b.fomoIntensity, 0.12);
      state.metrics.lossAversion = safeNumber(b.lossAversion, 0.55);
      state.metrics.confirmationBias = safeNumber(b.confirmationBias, 0.35);
      state.metrics.overconfidence = safeNumber(b.overconfidence, 0.22);
      state.metrics.panicSellingPressure = safeNumber(b.panicSellingPressure, 0.05);
      state.metrics.dipBuyingBelief = safeNumber(b.dipBuyingBelief, 0.32);
      state.metrics.narrativeStrength = safeNumber(b.narrativeStrength, 0.28);
      state.metrics.fundamentalPriceGap = safeNumber(b.fundamentalPriceGap, 0);
      state.metrics.behavioralMispricingIndex = safeNumber(b.behavioralMispricingIndex, 0);
      state.metrics.housingFundamentalValue = safeNumber(b.housingFundamentalValue, 100);
      state.metrics.stockFundamentalValue = safeNumber(b.stockFundamentalValue, 2500);
      state.metrics.housingMispricing = safeNumber(b.housingMispricing, 0) * 100;
      state.metrics.stockMispricing = safeNumber(b.stockMispricing, 0) * 100;
      state.metrics.beliefBreakRisk = safeNumber(b.beliefBreakRisk, 0);
      state.metrics.beliefBreakdownMonths = safeNumber(b.beliefBreakdownMonths, 0);
      state.metrics.speculativeDemandPressure = safeNumber(b.speculativeDemandPressure, 0.12);
      state.metrics.behaviorLabel = b.label || "보통";
    }

    function updateExternalSector()  {
      return updateExternalSectorEngine(createEconomyRuntimeContext());
    }

    function updatePolicyCredibility() {
      if (!state.policyCredibility) state.policyCredibility = createInitialPolicyCredibility();
      const p = state.policyCredibility;
      const policyShock = getRecentPolicyShock();
      const inflationStability = clamp(1 - Math.abs(state.metrics.inflationGap) / 5.5, 0, 1);
      const laborStability = clamp(1 - Math.abs(state.metrics.unemploymentGap) / 18, 0, 1);
      const clarity = safeNumber(state.information?.policyClarity, 0.78);
      const credibilityTarget = clamp(0.32 + inflationStability * 0.34 + laborStability * 0.16 + clarity * 0.18 - policyShock * 0.18 - Math.max(0, state.metrics.bondYield - state.metrics.interestRatePercent) * 0.010, 0, 1);
      p.centralBankCredibility = smoothValue(p.centralBankCredibility, credibilityTarget, credibilityTarget < p.centralBankCredibility ? 0.13 : 0.06);
      p.forwardGuidanceClarity = smoothValue(p.forwardGuidanceClarity, clamp(clarity - policyShock * 0.12 + p.centralBankCredibility * 0.10, 0, 1), 0.08);
      p.inflationTargetCredibility = smoothValue(p.inflationTargetCredibility, clamp(p.centralBankCredibility - Math.max(0, state.metrics.sentimentInflationExpectations - TARGET_INFLATION) * 0.08, 0, 1), 0.08);
      const desiredRate = (NEUTRAL_INTEREST_RATE + state.metrics.inflationGap * 0.45 + state.metrics.outputGap * 0.08) / 100;
      p.expectedRatePath = clamp(smoothValue(p.expectedRatePath, desiredRate, 0.06), 0, 0.24);
      p.marketRateExpectation = clamp(smoothValue(p.marketRateExpectation, p.expectedRatePath + (1 - p.centralBankCredibility) * Math.max(0, state.metrics.inflationGap) * 0.004, 0.08), 0, 0.28);
      p.policySurprise = clamp(smoothValue(p.policySurprise, policyShock, 0.12), 0, 1);
      p.ratePathLabel = p.marketRateExpectation > state.government.interestRate + 0.012 ? "긴축 기대" : p.marketRateExpectation < state.government.interestRate - 0.010 ? "완화 기대" : "중립";
      if (state.sentiment) {
        state.sentiment.inflationExpectations = clamp(smoothValue(state.sentiment.inflationExpectations, state.sentiment.inflationExpectations * (1 - p.inflationTargetCredibility * 0.025) + TARGET_INFLATION * p.inflationTargetCredibility * 0.025, 0.08), -1, 7);
      }
      syncPolicyCredibilityMetrics();
    }

    function updateFirmCreditRatings() {
      const sectorStats = {};
      state.producers.forEach((producer) => {
        const sector = producer.sector || "services";
        const debtRatio = safeNumber(producer.debt + producer.propertyDebt, 0) / Math.max(200, producer.cash + producer.collateralValue + producer.productionCapacity * producer.price);
        const cashBuffer = producer.cash / Math.max(1, producer.wageOffered * Math.max(1, producer.employees.length));
        const sectorExternal = sector === "manufacturing"
          ? state.metrics.importInflationPressure * 0.06 - Math.max(0, state.metrics.exportDemand - 100) * 0.002
          : sector === "agriculture"
            ? safeNumber(state.metrics.commodityCostPressure, 0) * 0.050 + Math.max(0, safeNumber(state.metrics.energyPriceIndex, 100) - 100) * 0.0012 - Math.max(0, state.metrics.inflation - TARGET_INFLATION) * 0.006
            : sector === "energy"
              ? -Math.max(0, safeNumber(state.metrics.energyPriceIndex, 100) - 100) * 0.0035 + safeNumber(state.metrics.creditCrunchRisk, 0) * 0.10 + Math.max(0, safeNumber(state.metrics.bondYield10Y, 0) - 5) * 0.010
              : 0;
        const sectorStress = clamp(safeNumber(producer.debtStress, 0) * 0.28 + Math.max(0, 1.2 - producer.dscr) * 0.20 + debtRatio * 0.18 + Math.max(0, -producer.profitTrend) / 900 + sectorExternal + (sector === "construction" ? Math.max(0, state.metrics.housingAffordability - 1.3) * 0.08 : 0), 0, 1);
        producer.sectorStress = smoothValue(safeNumber(producer.sectorStress, 0), sectorStress, 0.12);
        producer.defaultRisk = clamp(smoothValue(safeNumber(producer.defaultRisk, 0.04), 0.02 + producer.sectorStress * 0.22 + Math.max(0, 1 - cashBuffer) * 0.06, 0.10), 0.01, 0.65);
        const score = producer.dscr > 2 && producer.defaultRisk < 0.06 && producer.profitTrend > -30 ? 4 : producer.dscr > 1.2 && producer.defaultRisk < 0.14 ? 3 : producer.dscr > 0.75 && producer.defaultRisk < 0.30 ? 2 : 1;
        producer.creditRating = score >= 4 ? "A" : score >= 3 ? "BBB" : score >= 2 ? "BB" : "distressed";
        producer.ratingOutlook = producer.profitTrend > 60 && producer.defaultRisk < 0.10 ? "개선" : producer.profitTrend < -80 || producer.defaultRisk > 0.24 ? "악화" : "안정";
        sectorStats[sector] = sectorStats[sector] || { stress: 0, profit: 0, employment: 0, output: 0, investment: 0, count: 0 };
        sectorStats[sector].stress += producer.sectorStress;
        sectorStats[sector].profit += producer.lastProfit;
        sectorStats[sector].employment += producer.employees.length;
        sectorStats[sector].output += producer.productionTick;
        sectorStats[sector].investment += producer.investmentTick;
        sectorStats[sector].count += 1;
      });
      Object.values(sectorStats).forEach((s) => { s.stress /= Math.max(1, s.count); });
      state.metrics.sectorStress = sectorStats;
      state.metrics.sectorTotalProfit = sum(Object.values(sectorStats).map((s) => safeNumber(s.profit, 0)));
      state.metrics.sectorTotalInvestment = sum(Object.values(sectorStats).map((s) => safeNumber(s.investment, 0)));
      const entries = Object.entries(sectorStats).sort((a, b) => b[1].stress - a[1].stress);
      state.metrics.mostStressedSector = entries.length ? sectorLabel(entries[0][0]) : "없음";
      state.metrics.agricultureStress = sectorStats.agriculture ? safeNumber(sectorStats.agriculture.stress, 0) : 0;
      state.metrics.energyStress = sectorStats.energy ? safeNumber(sectorStats.energy.stress, 0) : 0;
      state.metrics.averageCreditRatingScore = average(state.producers.map((p) => creditRatingScore(p.creditRating)));
      state.metrics.distressedFirmRatio = state.producers.filter((p) => p.creditRating === "distressed").length / Math.max(1, state.producers.length) * 100;
      state.metrics.averageDefaultRisk = average(state.producers.map((p) => p.defaultRisk)) * 100;
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

    function computeInequalityMetrics() {
      const incomes = state.consumers.map((c) => safeNumber(c.disposableIncomeTick, 0) + (c.employed ? 0 : safeNumber(c.cash, 0) * 0.01));
      const wealth = state.consumers.map((c) => safeNumber(c.assetWealth, 0) + safeNumber(c.cash, 0));
      state.metrics.incomeInequality = giniCoefficient(incomes);
      state.metrics.wealthInequality = giniCoefficient(wealth);
      const low = state.consumers.filter((c) => c.incomeSegment === "low");
      const middle = state.consumers.filter((c) => c.incomeSegment === "middle");
      const high = state.consumers.filter((c) => c.incomeSegment === "high");
      const wealthy = state.consumers.filter((c) => c.incomeSegment === "wealthy");
      state.metrics.lowIncomeConsumptionCapacity = average(low.map((c) => clamp((safeNumber(c.disposableIncomeTick, 0) + c.cash * 0.04) / Math.max(1, effectiveBaseWage() * 0.65), 0, 3)));
      state.metrics.middleClassHousingBurden = average(middle.map((c) => safeNumber(c.mortgageBurden, 0) + safeNumber(c.rentBurden, 0))) * 100;
      state.metrics.highIncomeWealthEffect = average(high.map((c) => safeNumber(c.wealthEffect, 0))) * 100;
      state.metrics.wealthyAssetEffect = average(wealthy.map((c) => safeNumber(c.wealthEffect, 0))) * 100;
      computeClassMetrics();
    }

    function computeClassMetrics() {
      if (!state.classAnalysis) state.classAnalysis = createInitialClassAnalysis();
      const analysis = state.classAnalysis;
      const total = Math.max(1, state.consumers.length);
      let strongest = { label: "없음", stress: -1 };
      const confidenceValues = [];

      householdClassOrder().forEach((item) => {
        const members = state.consumers.filter((consumer) => consumer.incomeSegment === item.key);
        const previous = analysis.classes[item.key] || createInitialClassAnalysis().classes[item.key];
        const count = members.length;
        const avgIncome = average(members.map((consumer) => safeNumber(consumer.disposableIncomeTick, consumer.income)));
        const avgAssets = average(members.map((consumer) => safeNumber(consumer.assetWealth, 0) + safeNumber(consumer.cash, 0)));
        const debtBurden = average(members.map((consumer) => safeNumber(consumer.debtBurden, 0))) * 100;
        const housingBurden = average(members.map((consumer) => safeNumber(consumer.mortgageBurden, 0) + safeNumber(consumer.rentBurden, 0))) * 100;
        const baseIncome = average(members.map((consumer) => safeNumber(consumer.baseIncomeLevel, 1))) || 1;
        const consumptionCapacity = average(members.map((consumer) => clamp((safeNumber(consumer.disposableIncomeTick, 0) + safeNumber(consumer.cash, 0) * 0.035 + safeNumber(consumer.lastSpent, 0) * 0.25) / Math.max(1, effectiveBaseWage() * (item.key === "low" ? 0.55 : item.key === "middle" ? 0.82 : item.key === "high" ? 1.25 : 1.55)), 0, 3.5))) || 1;
        const sentiment = computeClassSentiment(item.key, members, { avgIncome, avgAssets, debtBurden, housingBurden, consumptionCapacity, baseIncome });
        const stress = computeClassStress(item.key, sentiment, { debtBurden, housingBurden, consumptionCapacity });
        const mainPressure = computeClassMainPressure(item.key, sentiment, { debtBurden, housingBurden, consumptionCapacity });
        const policyDemand = computeClassPolicyDemand(item.key, sentiment, { debtBurden, housingBurden, consumptionCapacity });
        const confidence = smoothValue(safeNumber(previous.confidence, sentiment.confidence), sentiment.confidence, 0.16);
        const profile = {
          key: item.key,
          label: item.label,
          populationShare: count / total * 100,
          averageIncome: smoothValue(safeNumber(previous.averageIncome, avgIncome), avgIncome, 0.20),
          averageAssets: smoothValue(safeNumber(previous.averageAssets, avgAssets), avgAssets, 0.14),
          debtBurden: smoothValue(safeNumber(previous.debtBurden, debtBurden), debtBurden, 0.18),
          housingBurden: smoothValue(safeNumber(previous.housingBurden, housingBurden), housingBurden, 0.18),
          consumptionCapacity: smoothValue(safeNumber(previous.consumptionCapacity, consumptionCapacity), consumptionCapacity, 0.18),
          confidence,
          status: classStatusLabel(confidence, stress),
          mainPressure,
          policyDemand,
          stress: smoothValue(safeNumber(previous.stress, stress), stress, 0.18),
          sentiment,
          consumptionMultiplier: clamp(0.86 + confidence * 0.18 - stress * 0.08 + Math.max(0, consumptionCapacity - 1) * 0.025, 0.82, 1.08)
        };
        analysis.classes[item.key] = profile;
        confidenceValues.push(confidence);
        if (profile.stress > strongest.stress) strongest = { label: item.label, stress: profile.stress };
        members.forEach((consumer) => {
          consumer.className = item.label;
          consumer.currentIncome = safeNumber(consumer.income, 0);
          consumer.disposableIncome = safeNumber(consumer.disposableIncomeTick, 0);
          consumer.assetWealth = safeNumber(consumer.assetWealth, safeNumber(consumer.stockHoldings, 0) + safeNumber(consumer.housingWealth, 0) - safeNumber(consumer.mortgageDebt, 0));
          consumer.consumptionCapacity = profile.consumptionCapacity;
          consumer.classConfidence = profile.confidence;
          consumer.mainPressure = profile.mainPressure;
          consumer.policyDemand = profile.policyDemand;
        });
      });

      analysis.mainPressureClass = strongest.label;
      analysis.sentimentGap = confidenceValues.length ? Math.max(...confidenceValues) - Math.min(...confidenceValues) : 0;
      state.metrics.lowIncomeStress = safeNumber(analysis.classes.low?.stress, 0);
      state.metrics.middleClassMortgageStress = safeNumber(analysis.classes.middle?.stress, 0);
      state.metrics.highIncomeTaxStress = safeNumber(analysis.classes.high?.stress, 0);
      state.metrics.wealthyAssetStress = safeNumber(analysis.classes.wealthy?.stress, 0);
      state.metrics.renterStress = average(state.consumers.filter((consumer) => consumer.housingStatus === "renter").map((consumer) => safeNumber(consumer.rentBurden, 0))) * 100;
      state.metrics.homeownerDebtStress = average(state.consumers.filter((consumer) => consumer.housingStatus !== "renter").map((consumer) => safeNumber(consumer.mortgageBurden, 0))) * 100;
      state.metrics.classSentimentGap = analysis.sentimentGap;
      state.metrics.mainPressureClass = analysis.mainPressureClass;
    }

    function computeClassSentiment(key, members, stats) {
      const avgConfidence = average(members.map((consumer) => safeNumber(consumer.confidence, 0.82))) || 0.82;
      const unemployment = state.metrics.unemploymentRate || TARGET_UNEMPLOYMENT;
      const inflationPressure = Math.max(0, state.metrics.inflation - TARGET_INFLATION);
      const importPressure = Math.max(0, safeNumber(state.metrics.importInflationPressure, 0) + safeNumber(state.metrics.commodityCostPressure, 0) * 0.5);
      const transferSupport = clamp(safeNumber(state.government?.supportTick, 0) / Math.max(1, members.length * effectiveBaseWage()), 0, 0.35);
      const assetReturnMood = clamp((safeNumber(state.metrics.stockMonthlyReturn, 0) + safeNumber(state.metrics.residentialReturn, 0) * 0.6 + safeNumber(state.metrics.wealthEffect, 0)) / 18, -0.45, 0.45);
      const taxRate = safeNumber(state.policy?.taxEffective, state.config.householdIncomeTaxRate || 0.16);
      const vatRate = safeNumber(state.government?.valueAddedTaxRate, state.policy?.vatEffective || state.config.valueAddedTaxRate || 0.10);
      const consumptionTaxPain = clamp(vatRate / (key === "low" ? 0.22 : key === "middle" ? 0.28 : 0.36) + Math.max(0, state.metrics.inflation - TARGET_INFLATION) * (key === "low" ? 0.030 : 0.014), 0, 1);
      const mortgagePressure = Math.max(0, safeNumber(state.metrics.mortgageRate, 0) - 5.5) / 12 + Math.max(0, safeNumber(state.metrics.housingAffordability, 1) - 1.25) * 0.24;
      const jobSecurity = clamp(1 - unemployment / (key === "low" ? 24 : key === "middle" ? 30 : 42) - Math.max(0, getRecentUnemploymentTrend()) * (key === "low" ? 0.035 : 0.020), 0, 1);
      const inflationAnxiety = clamp(inflationPressure / (key === "low" ? 5.5 : key === "middle" ? 7 : 11) + importPressure / (key === "low" ? 10 : 16) + consumptionTaxPain * (key === "low" ? 0.30 : key === "middle" ? 0.18 : 0.07), 0, 1);
      const debtAnxiety = clamp(safeNumber(stats.debtBurden, 0) / (key === "middle" ? 22 : key === "low" ? 18 : 30), 0, 1);
      const housingAnxiety = clamp(safeNumber(stats.housingBurden, 0) / (key === "middle" ? 18 : key === "low" ? 16 : 28) + mortgagePressure, 0, 1);
      const assetMood = clamp(0.52 + assetReturnMood + (key === "wealthy" ? 0.10 : key === "high" ? 0.04 : -0.02), 0, 1.2);
      const policySatisfaction = clamp(0.62 + transferSupport * (key === "low" ? 0.80 : 0.18) - taxRate * (key === "high" ? 0.85 : key === "wealthy" ? 0.75 : key === "middle" ? 0.38 : 0.20) - consumptionTaxPain * (key === "low" ? 0.24 : key === "middle" ? 0.14 : 0.05) - mortgagePressure * (key === "middle" ? 0.25 : 0.08) - Math.max(0, 0.45 - state.metrics.fiscalCredibility) * 0.10, 0, 1);
      const confidence = clamp(
        avgConfidence * 0.36
          + jobSecurity * (key === "low" ? 0.18 : key === "middle" ? 0.22 : 0.13)
          + assetMood * (key === "wealthy" ? 0.24 : key === "high" ? 0.18 : 0.05)
          + policySatisfaction * 0.12
          + clamp(stats.consumptionCapacity / 1.6, 0, 1) * (key === "low" ? 0.20 : 0.12)
          - inflationAnxiety * (key === "low" ? 0.25 : 0.12)
          - debtAnxiety * (key === "middle" ? 0.18 : 0.10)
          - housingAnxiety * (key === "middle" ? 0.20 : key === "low" ? 0.12 : 0.05),
        0,
        1.2
      );
      return { confidence, inflationAnxiety, jobSecurity, debtAnxiety, housingAnxiety, assetMood, policySatisfaction, consumptionTaxPain };
    }

    function computeClassStress(key, sentiment, stats) {
      if (key === "low") return clamp(sentiment.inflationAnxiety * 0.30 + safeNumber(sentiment.consumptionTaxPain, 0) * 0.14 + (1 - sentiment.jobSecurity) * 0.26 + Math.max(0, 1 - stats.consumptionCapacity) * 0.22 + sentiment.housingAnxiety * 0.08, 0, 1);
      if (key === "middle") return clamp(sentiment.housingAnxiety * 0.36 + sentiment.debtAnxiety * 0.30 + (1 - sentiment.jobSecurity) * 0.20 + Math.max(0, 0.85 - stats.consumptionCapacity) * 0.14, 0, 1);
      if (key === "high") return clamp(Math.max(0, safeNumber(state.policy?.taxEffective, 0.16) - 0.22) * 1.5 + Math.max(0, 0.55 - sentiment.assetMood) * 0.30 + Math.max(0, 0.55 - sentiment.policySatisfaction) * 0.25 + state.metrics.recessionFear * 0.15, 0, 1);
      return clamp(Math.max(0, 0.58 - sentiment.assetMood) * 0.34 + Math.max(0, 0.58 - state.metrics.marketRiskSentiment) * 0.24 + Math.max(0, safeNumber(state.policy?.taxEffective, 0.16) - 0.24) * 1.0 + state.metrics.safeHavenDemand / 100 * 0.18, 0, 1);
    }

    function computeClassMainPressure(key, sentiment, stats) {
      if (key === "low") {
        if (sentiment.consumptionTaxPain > 0.55) return "부가세·체감물가";
        if (sentiment.inflationAnxiety > 0.48) return "물가·생계비";
        if (sentiment.housingAnxiety > 0.45) return "임대료";
        if (sentiment.jobSecurity < 0.50) return "고용 불안";
        return "소비여력";
      }
      if (key === "middle") {
        if (sentiment.housingAnxiety > 0.45) return "주택담보금리";
        if (sentiment.debtAnxiety > 0.45) return "부채상환";
        if (sentiment.jobSecurity < 0.55) return "고용 안정";
        return "가처분소득";
      }
      if (key === "high") {
        if (sentiment.assetMood < 0.46) return "자산시장";
        if (sentiment.policySatisfaction < 0.48) return "세후소득";
        return "투자환경";
      }
      if (sentiment.assetMood < 0.46) return "자산가격";
      if (state.metrics.safeHavenDemand > 45) return "금융시장 안정";
      if (sentiment.policySatisfaction < 0.48) return "세제 예측";
      return "자산시장";
    }

    function computeClassPolicyDemand(key, sentiment, stats) {
      if (key === "low") {
        if (sentiment.consumptionTaxPain > 0.55) return "체감물가 완화와 생계 지원 필요";
        if (sentiment.inflationAnxiety > 0.48) return "물가 안정과 생계 지원 필요";
        if (sentiment.housingAnxiety > 0.45) return "임대료 부담 완화 필요";
        if (sentiment.jobSecurity < 0.50) return "고용 안정과 이전지출 확대 요구";
        return "생활비 안정과 일자리 유지 요구";
      }
      if (key === "middle") {
        if (sentiment.housingAnxiety > 0.45) return "주택담보 부담 완화 필요";
        if (sentiment.debtAnxiety > 0.45) return "세금·대출 부담 완화 요구";
        return "주거비와 가처분소득 안정 요구";
      }
      if (key === "high") {
        if (sentiment.policySatisfaction < 0.48) return "세후소득 안정과 정책 예측 가능성 요구";
        if (sentiment.assetMood < 0.48) return "자산시장 안정과 투자환경 개선 요구";
        return "투자환경과 정책 예측 가능성 요구";
      }
      if (sentiment.assetMood < 0.48 || state.metrics.safeHavenDemand > 45) return "금융시장 안정과 신뢰 회복 요구";
      return "자산시장 안정과 세제 예측 가능성 요구";
    }

    function computeSocialStress() {
      const socialStress = clamp(
        state.metrics.unemploymentRate / 40
          + Math.max(0, state.metrics.inflation - TARGET_INFLATION) / 12
          + Math.max(0, state.metrics.housingAffordability - 1.3) * 0.18
          + state.metrics.incomeInequality * 0.22
          + state.metrics.wealthInequality * 0.18
          + Math.max(0, 0.65 - state.metrics.consumerSentiment) * 0.34
          + Math.max(0, 1 - state.metrics.lowIncomeConsumptionCapacity) * 0.18,
        0,
        1
      );
      const classStress = clamp(
        safeNumber(state.metrics.lowIncomeStress, 0) * 0.30
          + safeNumber(state.metrics.middleClassMortgageStress, 0) * 0.24
          + safeNumber(state.metrics.renterStress, 0) / 100 * 0.18
          + safeNumber(state.metrics.homeownerDebtStress, 0) / 100 * 0.14
          + safeNumber(state.metrics.classSentimentGap, 0) * 0.12,
        0,
        1
      );
      state.metrics.socialStressIndex = smoothValue(safeNumber(state.metrics.socialStressIndex, socialStress), clamp(socialStress * 0.72 + classStress * 0.28, 0, 1), 0.12);
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

    function updateVulnerabilitySystem() {
      if (!state.vulnerabilities) state.vulnerabilities = createInitialVulnerabilityState();
      const v = state.vulnerabilities;
      const m = state.metrics;
      const positiveStockGap = Math.max(0, safeNumber(m.stockMispricing, 0)) / 100;
      const positiveHousingGap = Math.max(0, safeNumber(m.housingMispricing, 0)) / 100;
      const creditTightness = clamp((100 - safeNumber(m.creditSupplyIndex, 100)) / 70, 0, 1);
      const collateralStress = clamp((100 - safeNumber(m.collateralValueIndex, 100)) / 60, 0, 1);
      const fiscalInterestBurden = clamp(safeNumber(m.governmentDebtService, 0) / Math.max(1, safeNumber(m.totalTaxCollected, 1)) / 1.8, 0, 1);

      // 취약성은 즉시 위기가 아니라, 충격이 왔을 때 더 크게 흔들릴 수 있는 누적 압력이다.
      const targets = {
        householdVulnerability: clamp(
          safeNumber(m.averageHouseholdDebtBurden, 0) / 34 * 0.28
            + safeNumber(m.middleClassMortgageStress, 0) * 0.24
            + safeNumber(m.lowIncomeStress, 0) * 0.20
            + safeNumber(m.negativeEquityRatio, 0) / 45 * 0.14
            + Math.max(0, 0.58 - safeNumber(m.consumerSentiment, 0.8)) * 0.30,
          0,
          1
        ),
        firmVulnerability: clamp(
          Math.max(0, 1.7 - safeNumber(m.averageFirmDSCR, 2.5)) / 1.7 * 0.28
            + safeNumber(m.distressedFirmRatio, 0) / 55 * 0.22
            + safeNumber(m.zombieFirmRatio, 0) / 40 * 0.20
            + safeNumber(m.debtStressedFirmRatio, 0) / 100 * 0.16
            + Math.max(0, 0.58 - safeNumber(m.businessSentiment, 0.8)) * 0.20,
          0,
          1
        ),
        bankVulnerability: clamp(
          safeNumber(m.bankStress, 0) * 0.30
            + (100 - safeNumber(m.bankHealthIndex, 100)) / 100 * 0.24
            + creditTightness * 0.18
            + collateralStress * 0.14
            + safeNumber(m.nonPerformingLoanRatio, 0) / 16 * 0.14,
          0,
          1
        ),
        housingVulnerability: clamp(
          Math.max(0, safeNumber(m.housingAffordability, 1) - 1.2) * 0.24
            + positiveHousingGap * 0.35
            + safeNumber(m.averageMortgageBurden, 0) / 30 * 0.18
            + Math.max(0, safeNumber(m.mortgageRate, 0) - 5.2) / 9 * 0.12
            + safeNumber(m.realEstateNeverFallsBelief, 0.46) * safeNumber(m.fomoIntensity, 0.12) * 0.18,
          0,
          1
        ),
        stockVulnerability: clamp(
          positiveStockGap * 0.34
            + safeNumber(m.stockValuationPressure, 0) * 0.24
            + Math.abs(safeNumber(m.fearGreedIndex, 50) - 50) / 50 * 0.16
            + safeNumber(m.stockVolatilityIndex, 18) / 70 * 0.14
            + safeNumber(m.stockMarketNeverFailsBelief, 0.46) * safeNumber(m.fomoIntensity, 0.12) * 0.16,
          0,
          1
        ),
        fiscalVulnerability: clamp(
          Math.max(0, safeNumber(m.debtToGdpRatio, 0) - 0.65) * 0.34
            + fiscalInterestBurden * 0.26
            + Math.max(0, 0.55 - safeNumber(m.fiscalCredibility, 0.78)) * 0.40
            + Math.max(0, safeNumber(m.bondYield10Y, 0) - 5) / 12 * 0.16,
          0,
          1
        ),
        externalVulnerability: clamp(
          Math.abs(safeNumber(m.exchangeRateIndex, 100) - 100) / 65 * 0.24
            + safeNumber(m.importInflationPressure, 0) / 4.5 * 0.24
            + safeNumber(m.commodityCostPressure, 0) / 5.5 * 0.24
            + safeNumber(m.externalShockPressure, 0) * 0.18
            + Math.max(0, 0.52 - safeNumber(m.foreignInvestorSentiment, 0.72)) * 0.22,
          0,
          1
        )
      };

      Object.keys(targets).forEach((key) => {
        const oldValue = safeNumber(v[key], 0.15);
        const target = targets[key];
        v[key] = clamp(smoothValue(oldValue, target, target > oldValue ? 0.12 : 0.06), 0, 1);
        m[key] = v[key];
      });

      const entries = [
        ["가계", v.householdVulnerability],
        ["기업", v.firmVulnerability],
        ["은행", v.bankVulnerability],
        ["주택", v.housingVulnerability],
        ["주식", v.stockVulnerability],
        ["재정", v.fiscalVulnerability],
        ["대외", v.externalVulnerability]
      ];
      const dominant = entries.reduce((max, item) => item[1] > max[1] ? item : max, entries[0]);
      v.hiddenVulnerabilityIndex = clamp(smoothValue(safeNumber(v.hiddenVulnerabilityIndex, 0.15), average(entries.map((item) => item[1])) * 0.62 + dominant[1] * 0.38, 0.10), 0, 1);
      v.dominant = dominant[0];
      v.label = v.hiddenVulnerabilityIndex > 0.70 ? "위험" : v.hiddenVulnerabilityIndex > 0.52 ? "높음" : v.hiddenVulnerabilityIndex > 0.32 ? "주의" : "낮음";
      m.hiddenVulnerabilityIndex = v.hiddenVulnerabilityIndex;
      m.vulnerabilityLabel = v.label;
      m.dominantVulnerability = v.dominant;
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

    function applySentimentToConsumers() {
      if (!state.sentiment) return;
      const s = state.sentiment;
      state.consumers.forEach((consumer) => {
        const jobSecurityTarget = clamp((consumer.employed ? 0.82 : 0.34) - Math.max(0, getRecentUnemploymentTrend()) * 0.018 - s.recessionFear * 0.18, 0.05, 1);
        consumer.jobSecurity = smoothValue(safeNumber(consumer.jobSecurity, jobSecurityTarget), jobSecurityTarget, 0.12);
        consumer.inflationAnxiety = smoothValue(safeNumber(consumer.inflationAnxiety, 0), clamp((s.inflationExpectations - TARGET_INFLATION) / 5 + Math.max(0, state.metrics.inflation - state.metrics.wageGrowth) / 7, 0, 1), 0.10);
        consumer.wealthMood = smoothValue(safeNumber(consumer.wealthMood, 0), clamp(safeNumber(consumer.wealthEffect, 0) * 3 + (consumer.negativeEquity ? -0.25 : 0), -0.6, 0.6), 0.10);
        consumer.debtAnxiety = smoothValue(safeNumber(consumer.debtAnxiety, 0), clamp(safeNumber(consumer.debtBurden, 0) * 1.8 + safeNumber(consumer.mortgageBurden, 0) * 1.2 + (consumer.negativeEquity ? 0.18 : 0), 0, 1), 0.12);
        consumer.precautionarySavingRate = clamp(smoothValue(safeNumber(consumer.precautionarySavingRate, 0.12), 0.10 + s.recessionFear * 0.16 + consumer.debtAnxiety * 0.14 + (1 - consumer.jobSecurity) * 0.10 + s.policyUncertainty * 0.04, 0.10), 0.05, 0.45);
        const targetConfidence = clamp(s.consumerConfidence + consumer.wealthMood * 0.12 - consumer.debtAnxiety * 0.12 - consumer.inflationAnxiety * 0.08 + (consumer.jobSecurity - 0.6) * 0.10, 0.18, 1.28);
        consumer.confidence = clamp(smoothValue(consumer.confidence, targetConfidence, targetConfidence < consumer.confidence ? 0.11 : 0.045), 0.18, 1.30);
      });
    }

    function applySentimentToFirms() {
      if (!state.sentiment) return;
      const s = state.sentiment;
      state.producers.forEach((producer) => {
        const salesSignal = clamp(producer.unitsSoldTick / Math.max(1, producer.expectedDemand) - 0.75, -0.6, 0.6);
        const inventoryBurden = clamp((producer.inventory / Math.max(1, producer.expectedDemand * 2)) - 1, -0.5, 1.5);
        producer.businessConfidence = smoothValue(safeNumber(producer.businessConfidence, producer.businessOutlook), clamp(s.businessConfidence + salesSignal * 0.12 - Math.max(0, inventoryBurden) * 0.13 - s.recessionFear * 0.12 - s.policyUncertainty * 0.08, 0.20, 1.25), 0.09);
        producer.demandExpectation = smoothValue(safeNumber(producer.demandExpectation, producer.expectedDemand), producer.expectedDemand * clamp(0.86 + producer.businessConfidence * 0.22 - s.recessionFear * 0.10, 0.65, 1.16), 0.08);
        producer.investmentAppetite = clamp(smoothValue(safeNumber(producer.investmentAppetite, 0.5), 0.38 + producer.businessConfidence * 0.42 + Math.max(0, producer.profitTrend) / 1800 - state.metrics.creditSpread * 0.018 - s.recessionFear * 0.18, 0.08), 0, 1.2);
        producer.hiringCaution = clamp(smoothValue(safeNumber(producer.hiringCaution, 0.25), 0.18 + Math.max(0, inventoryBurden) * 0.22 + s.recessionFear * 0.25 + s.policyUncertainty * 0.12 + Math.max(0, 0.75 - producer.businessConfidence) * 0.20, 0.08), 0, 1);
        producer.policyUncertainty = smoothValue(safeNumber(producer.policyUncertainty, 0.1), s.policyUncertainty, 0.08);
        producer.recessionConcern = smoothValue(safeNumber(producer.recessionConcern, 0.1), s.recessionFear, 0.08);
        producer.capacityUtilization = safeNumber(producer.productionUtilization, safeNumber(producer.capacityUtilization, 0.75));
        producer.businessOutlook = clamp(smoothValue(producer.businessOutlook, producer.businessConfidence, 0.07), 0.25, 1.45);
      });
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

    function updateAssetMarkets() {
      if (!state.assetMarket) state.assetMarket = createInitialAssetMarket();
      if (!state.realEstate) state.realEstate = createInitialRealEstateMarket();
      const asset = state.assetMarket;
      updateMarketPsychology();
      updateRealEstateMarkets();
      const stockRawReturn = computeStockReturn();
      const previousStockPoints = safeNumber(asset.stockIndexPoints, 2500);
      updateFirmStocks(stockRawReturn);
      const housingRawReturn = computeHousingReturn();
      const crisisStockLimit = safeNumber(state.financialMarket?.bankStress, 0) > 0.55 || safeNumber(state.sentiment?.recessionFear, 0.2) > 0.62;
      const stockDownLimit = crisisStockLimit ? 0.15 / TICKS_PER_MONTH : STOCK_RETURN_LIMIT;
      const stockUpLimit = crisisStockLimit ? 0.10 / TICKS_PER_MONTH : STOCK_RETURN_LIMIT;
      asset.stockReturn = clamp((safeNumber(asset.stockIndexPoints, previousStockPoints) / Math.max(1, previousStockPoints)) - 1, -stockDownLimit, stockUpLimit);
      asset.housingReturn = clamp(smoothValue(safeNumber(asset.housingReturn, 0), safeNumber(state.realEstate.residentialReturn, housingRawReturn), 0.24), -HOUSING_RETURN_LIMIT, HOUSING_RETURN_LIMIT);
      asset.previousStockIndexPoints = previousStockPoints;
      asset.stockIndexPoints = clamp(asset.previousStockIndexPoints * (1 + asset.stockReturn), 1200, 9000);
      asset.stockIndex = clamp(asset.stockIndexPoints / 25, 35, 360);
      asset.stockMonthlyReturn = clamp(asset.stockReturn * TICKS_PER_MONTH, -0.15, 0.10);
      asset.stockPeakPoints = Math.max(asset.stockIndexPoints, smoothValue(safeNumber(asset.stockPeakPoints, 2500), asset.stockIndexPoints, 0.010));
      asset.stockDrawdownFromPeak = clamp((asset.stockPeakPoints - asset.stockIndexPoints) / Math.max(1, asset.stockPeakPoints), 0, 1);
      asset.housingIndex = clamp(safeNumber(state.realEstate.residentialIndex, safeNumber(asset.housingIndex, 100) * (1 + asset.housingReturn)), 55, 285);
      asset.stockVolatility = smoothValue(safeNumber(asset.stockVolatility, 0.015), Math.abs(asset.stockMonthlyReturn) * 0.65 + 0.010, 0.05);
      asset.stockVolatilityIndex = computeStockVolatilityIndex();
      asset.stockVolatilityIndexLabel = stockVolatilityIndexLabel(asset.stockVolatilityIndex);
      asset.housingVolatility = smoothValue(safeNumber(asset.housingVolatility, 0.007), Math.abs(asset.housingReturn) * 1.4 + 0.003, 0.04);
      asset.housingAffordability = safeNumber(state.realEstate.housingAffordability, computeHousingAffordability());
      asset.assetBubbleRisk = computeAssetBubbleRisk();
      asset.assetBubbleRiskLabel = asset.assetBubbleRisk < 0.28 ? "낮음" : asset.assetBubbleRisk < 0.52 ? "주의" : asset.assetBubbleRisk < 0.76 ? "높음" : "위험";
      asset.wealthEffect = clamp(asset.stockReturn * 2.0 + state.realEstate.residentialReturn * 1.25 + state.realEstate.commercialReturn * 0.20, -0.10, 0.10);
      asset.equityFinancingCondition = clamp(
        1 + (asset.stockIndex - 100) * 0.00045 + asset.stockReturn * 2.4 + Math.max(0, state.realEstate.collateralValueIndex - 100) * 0.00055 - safeNumber(state.metrics.debtStressedFirmRatio, 0) * 0.0012 - Math.max(0, 100 - state.realEstate.collateralValueIndex) * 0.00075 - safeNumber(asset.equityRiskPremium, 0.04) * 0.18,
        0.84,
        1.08
      );
      asset.marketSentiment = clamp(smoothValue(safeNumber(asset.marketSentiment, 1), 1 + asset.stockReturn * 10 + asset.housingReturn * 4 - asset.assetBubbleRisk * 0.05, 0.08), 0.72, 1.20);
      asset.investorSentiment = clamp(smoothValue(safeNumber(asset.investorSentiment, 1), asset.marketSentiment, 0.06), 0.70, 1.18);
      updateFinancialConditionIndex();
      syncRealEstateMetrics();
      syncFirmStockMetrics();
      syncAssetMetrics();
    }

    function updateRealEstateMarkets() {
      if (!state.realEstate) state.realEstate = createInitialRealEstateMarket();
      const realEstate = state.realEstate;
      const transmission = state.macroFinancial || createInitialMacroFinancialTransmission(state.config);
      const info = state.information || createInitialInformationSystem();
      const sentiment = state.sentiment || createInitialSentimentState();
      const financial = state.financialMarket || createInitialFinancialMarket(state.config);
      const behavior = state.behavior || createInitialBehavioralState();
      const avgDisposableIncome = average(state.consumers.map((consumer) => Math.max(1, safeNumber(consumer.disposableIncomeTick, consumer.income || effectiveBaseWage() * 0.6))));
      const employmentStability = clamp(1 - safeNumber(state.metrics.unemploymentRate, TARGET_UNEMPLOYMENT) / 100, 0.45, 1);
      realEstate.mortgageRate = clamp(smoothValue(safeNumber(realEstate.mortgageRate, 0.05), safeNumber(transmission.mortgageRate, safeNumber(state.rates?.mortgageRate, 0.05)), 0.08), 0.01, 0.30);
      const creditEase = clamp(safeNumber(transmission.creditSupplyIndex, 100) / 100, 0.35, 1.12);
      const affordability = clamp((safeNumber(realEstate.residentialIndex, 100) / 100) * (1 + realEstate.mortgageRate * 3.2 * CALIBRATION.housingChannelWeight) / Math.max(0.45, avgDisposableIncome / Math.max(1, effectiveBaseWage() * 0.45)), 0.45, 3.4);
      realEstate.housingAffordability = smoothValue(safeNumber(realEstate.housingAffordability, 1), affordability, 0.08);
      const beliefAffordabilityDiscount = safeNumber(behavior.realEstateNeverFallsBelief, 0.46) * safeNumber(behavior.confirmationBias, 0.35) * 0.11;
      realEstate.housingDemand = clamp(smoothValue(safeNumber(realEstate.housingDemand, 1), 0.68 + employmentStability * 0.28 + safeNumber(sentiment.consumerConfidence, 0.8) * 0.18 + creditEase * 0.16 + safeNumber(behavior.fomoIntensity, 0) * 0.10 + safeNumber(behavior.realEstateNeverFallsBelief, 0.46) * 0.08 - realEstate.housingAffordability * (0.16 - beliefAffordabilityDiscount) - safeNumber(state.metrics.averageHouseholdDebtBurden, 0) / 100 * 0.18 - safeNumber(state.perceived?.housingRisk, 0.15) * (0.15 - beliefAffordabilityDiscount * 0.4), 0.08), 0.35, 1.75);
      realEstate.housingSupplyConstraint = clamp(smoothValue(safeNumber(realEstate.housingSupplyConstraint, 0.42), 0.36 + safeNumber(state.metrics.inflationGap, 0) * 0.025 + Math.max(0, state.metrics.capacityUtilization - 82) * 0.003, 0.03), 0.15, 0.75);
      const speculativePressure = clamp(safeNumber(sentiment.assetBubblePsychology, 0.12) * 0.32 + safeNumber(behavior.speculativeDemandPressure, 0.12) * 0.34 + safeNumber(behavior.realEstateNeverFallsBelief, 0.46) * 0.12 + Math.max(0, TARGET_INFLATION - state.metrics.interestRatePercent) * 0.018 + safeNumber(info.rumorType === "housing" ? info.rumorIntensity * -0.20 : 0, 0), -0.25, 0.75);
      realEstate.housingSpeculation = clamp(smoothValue(safeNumber(realEstate.housingSpeculation, 0.12), Math.max(0, speculativePressure), 0.06), 0, 1);
      realEstate.housingFear = clamp(smoothValue(safeNumber(realEstate.housingFear, 0.12), safeNumber(state.perceived?.housingRisk, 0.15) + Math.max(0, realEstate.housingAffordability - 1.8) * 0.12 + safeNumber(behavior.beliefBreakRisk, 0) * 0.20 - safeNumber(behavior.realEstateNeverFallsBelief, 0.46) * safeNumber(behavior.confirmationBias, 0.35) * 0.08 + safeNumber(info.rumorType === "housing" ? info.rumorIntensity * 0.22 : 0, 0), 0.08), 0, 1);
      const residentialAnchor = clamp((100 - safeNumber(realEstate.residentialIndex, 100)) / 100 * 0.0025, -0.0010, 0.0032);
      const residentialRecovery = realEstate.residentialIndex < 90 && state.metrics.unemploymentRate < 14
        ? clamp((90 - realEstate.residentialIndex) / 90 * 0.0090, 0, 0.0070)
        : 0;
      const beliefBreakCorrection = safeNumber(behavior.beliefBreakRisk, 0) > 0.58 ? safeNumber(behavior.beliefBreakRisk, 0) * 0.0018 : 0;
      const residentialRaw = 0.00025 + residentialAnchor + residentialRecovery + (realEstate.housingDemand - 1) * 0.0011 * CALIBRATION.housingChannelWeight + realEstate.housingSupplyConstraint * 0.0008 + safeNumber(state.perceived?.expectedInflation, TARGET_INFLATION) / 100 * 0.007 + realEstate.housingSpeculation * 0.0007 + safeNumber(behavior.realEstateNeverFallsBelief, 0.46) * 0.0005 + safeNumber(behavior.fomoIntensity, 0) * 0.0005 - Math.max(0, realEstate.mortgageRate - 0.055) * 0.014 - realEstate.housingFear * 0.0010 - Math.max(0, realEstate.housingAffordability - 1.90) * 0.0008 - beliefBreakCorrection;
      const residentialLimitDown = realEstate.housingFear > 0.55 || financial.bankStress > 0.6 ? 0.06 / TICKS_PER_MONTH : 0.03 / TICKS_PER_MONTH;
      const residentialLimitUp = realEstate.housingFear > 0.55 || financial.bankStress > 0.6 ? 0.04 / TICKS_PER_MONTH : 0.03 / TICKS_PER_MONTH;
      realEstate.residentialReturn = clamp(smoothValue(safeNumber(realEstate.residentialReturn, 0), residentialRaw, 0.22), -residentialLimitDown, residentialLimitUp);
      realEstate.residentialIndex = clamp(safeNumber(realEstate.residentialIndex, 100) * (1 + realEstate.residentialReturn), 55, 260);

      const firmStress = safeNumber(state.metrics.debtStressedFirmRatio, 0) / 100;
      const vacancyTarget = clamp(0.07 + Math.max(0, 0.72 - safeNumber(sentiment.businessConfidence, 0.8)) * 0.12 + firmStress * 0.10 + Math.max(0, -getGDPGrowthWindow()) * 0.006 + Math.max(0, 8 - state.metrics.investment) * 0.002, 0.03, 0.32);
      realEstate.commercialVacancy = clamp(smoothValue(safeNumber(realEstate.commercialVacancy, 0.08), vacancyTarget, 0.055), 0.03, 0.32);
      const commercialAnchor = clamp((100 - safeNumber(realEstate.commercialIndex, 100)) / 100 * 0.0022, -0.0010, 0.0030);
      const commercialRecovery = realEstate.commercialIndex < 85 && safeNumber(financial.bankStress, 0.12) < 0.70
        ? clamp((85 - realEstate.commercialIndex) / 85 * 0.0070, 0, 0.0055)
        : 0;
      const commercialRaw = 0.00038 + commercialAnchor + commercialRecovery + clamp(state.metrics.averageFirmProfit / 1500, -0.0013, 0.002) + safeNumber(sentiment.businessConfidence, 0.8) * 0.0007 + getGDPGrowthWindow() / 100 * 0.005 - Math.max(0, realEstate.commercialVacancy - 0.10) * 0.0045 - safeNumber(transmission.corporateLoanRate, transmission.loanRate || 0.05) * 0.004 - safeNumber(transmission.creditSpread, 0.02) * 0.008 - firmStress * 0.0009;
      realEstate.commercialReturn = clamp(smoothValue(safeNumber(realEstate.commercialReturn, 0), commercialRaw, 0.20), -0.05 / TICKS_PER_MONTH, 0.035 / TICKS_PER_MONTH);
      realEstate.commercialIndex = clamp(safeNumber(realEstate.commercialIndex, 100) * (1 + realEstate.commercialReturn), 45, 240);
      realEstate.landReturn = clamp(smoothValue(safeNumber(realEstate.landReturn, 0), realEstate.residentialReturn * 0.42 + realEstate.commercialReturn * 0.34 + safeNumber(state.metrics.inflation, TARGET_INFLATION) / 100 * 0.006, 0.16), -0.035 / TICKS_PER_MONTH, 0.035 / TICKS_PER_MONTH);
      realEstate.landIndex = clamp(safeNumber(realEstate.landIndex, 100) * (1 + realEstate.landReturn), 55, 240);
      const rentTarget = 100 + Math.max(0, realEstate.housingAffordability - 1) * 10 + Math.max(0, state.metrics.inflation) * 0.9 + realEstate.commercialVacancy * -8;
      realEstate.rentIndex = clamp(smoothValue(safeNumber(realEstate.rentIndex, 100), rentTarget, 0.018), 70, 190);
      realEstate.collateralValueIndex = clamp(realEstate.residentialIndex * 0.48 + realEstate.commercialIndex * 0.34 + realEstate.landIndex * 0.18, 45, 260);
      realEstate.realEstateBubbleRisk = clamp(smoothValue(safeNumber(realEstate.realEstateBubbleRisk, 0), Math.max(0, realEstate.residentialIndex - 115) / 130 + realEstate.housingSpeculation * 0.28 + Math.max(0, 1.35 - realEstate.housingAffordability) * 0.08, 0.06), 0, 1);
      realEstate.realEstateStress = clamp(smoothValue(safeNumber(realEstate.realEstateStress, 0.10), Math.max(0, 100 - realEstate.collateralValueIndex) / 80 + realEstate.commercialVacancy * 0.9 + realEstate.housingFear * 0.25, 0.07), 0, 1);
      realEstate.realEstateRumorIntensity = clamp(smoothValue(safeNumber(realEstate.realEstateRumorIntensity, 0), info.rumorType === "housing" ? info.rumorIntensity : 0, 0.10), 0, 1);
      realEstate.perceivedHousingRisk = updatePerceivedValue(safeNumber(realEstate.perceivedHousingRisk, 0.15), realEstate.housingFear, realEstate.housingFear > safeNumber(realEstate.perceivedHousingRisk, 0.15), safeNumber(info.householdInformationAccuracy, 0.7));
      realEstate.perceivedCommercialRealEstateRisk = updatePerceivedValue(safeNumber(realEstate.perceivedCommercialRealEstateRisk, 0.15), realEstate.realEstateStress, realEstate.realEstateStress > safeNumber(realEstate.perceivedCommercialRealEstateRisk, 0.15), safeNumber(info.bankInformationAccuracy, 0.86));
    }

    function updateFirmStocks(marketSignal = 0) {
      const asset = state.assetMarket || createInitialAssetMarket();
      const info = state.information || createInitialInformationSystem();
      const realEstate = state.realEstate || createInitialRealEstateMarket();
      const behavior = state.behavior || createInitialBehavioralState();
      const fearGreed = safeNumber(asset.fearGreedIndex, 50);
      let totalInitialMarketCap = 0;
      let totalMarketCap = 0;
      state.producers.forEach((producer) => {
        producer.previousStockPrice = safeNumber(producer.stockPrice, 100);
        const profitSignal = clamp(safeNumber(producer.afterTaxProfit, producer.lastProfit) / 500, -0.18, 0.18);
        const debtRisk = clamp(1 / Math.max(0.25, safeNumber(producer.dscr, state.metrics.averageFirmDSCR || 2)) - 0.35, 0, 1);
        const inventoryOpacity = clamp((producer.inventory / Math.max(1, producer.expectedDemand) - 1.5) / 3, 0, 1);
        producer.informationOpacity = clamp(smoothValue(safeNumber(producer.informationOpacity, 0.18), 0.14 + debtRisk * 0.20 + Math.abs(producer.profitTrend) / 220 * 0.10 + inventoryOpacity * 0.16 + safeNumber(asset.stockVolatilityIndex, 18) / 100 * 0.20 + safeNumber(state.financialMarket?.bankStress, 0.12) * 0.15, 0.08), 0.05, 0.86);
        producer.perceivedProfitability = smoothValue(safeNumber(producer.perceivedProfitability, profitSignal), profitSignal + rand(-0.04, 0.04) * producer.informationOpacity, 0.10);
        producer.perceivedDebtRisk = smoothValue(safeNumber(producer.perceivedDebtRisk, debtRisk), debtRisk + producer.informationOpacity * 0.08, 0.10);
        producer.perceivedGrowth = smoothValue(safeNumber(producer.perceivedGrowth, 0), clamp(producer.expectedDemand / Math.max(1, producer.inventory + 1) - 0.6, -0.2, 0.2), 0.08);
        const propertySupport = producer.propertyExposure === "propertyOwner" || producer.propertyExposure === "leveragedProperty"
          ? (realEstate.commercialReturn * 0.45 + (realEstate.collateralValueIndex - 100) / 100 * 0.001)
          : producer.propertyExposure === "renter"
            ? -(realEstate.rentIndex - 100) / 100 * 0.0012
            : 0;
        const rumorDrag = safeNumber(info.rumorIntensity, 0) * safeNumber(info.rumorCredibility, 0) * safeNumber(producer.rumorSensitivity, 1) * producer.informationOpacity * (0.006 + safeNumber(behavior.confirmationBias, 0.35) * 0.003);
        const greedEffect = clamp((fearGreed - 50) / 50 * 0.004, -0.006, 0.005);
        const crisis = safeNumber(state.financialMarket?.bankStress, 0) > 0.6 || safeNumber(state.sentiment?.recessionFear, 0.2) > 0.65;
        const downLimit = crisis ? 0.25 / TICKS_PER_MONTH : 0.12 / TICKS_PER_MONTH;
        const upLimit = crisis ? 0.18 / TICKS_PER_MONTH : 0.12 / TICKS_PER_MONTH;
        const stockAnchor = clamp((100 - safeNumber(producer.stockPrice, 100)) / 100 * 0.0035, -0.0025, 0.0048);
        const stockRecovery = producer.stockPrice < 45 && producer.lastProfit > -120
          ? clamp((45 - producer.stockPrice) / 45 * 0.0080, 0, 0.0062)
          : 0;
        const behavioralReturn = safeNumber(behavior.stockMarketNeverFailsBelief, 0.46) * 0.0006 + safeNumber(behavior.fomoIntensity, 0.12) * 0.0008 + safeNumber(behavior.dipBuyingBelief, 0.32) * Math.max(0, -safeNumber(producer.stockReturn, 0)) * 0.34 - safeNumber(behavior.panicSellingPressure, 0.05) * 0.0018 - Math.max(0, safeNumber(producer.valuationPressure, 0) - 0.55) * safeNumber(behavior.confirmationBias, 0.35) * 0.0009;
        const rawReturn = 0.00035 + stockAnchor + stockRecovery + behavioralReturn + marketSignal * 0.22 + producer.perceivedProfitability * 0.007 + producer.perceivedGrowth * 0.006 + (safeNumber(producer.businessConfidence, producer.businessOutlook) - 0.75) * 0.003 + propertySupport + greedEffect - producer.perceivedDebtRisk * 0.0022 - safeNumber(state.metrics.creditSpread, 2) / 100 * 0.0032 - rumorDrag;
        producer.stockReturn = clamp(smoothValue(safeNumber(producer.stockReturn, 0), rawReturn, 0.32), -downLimit, upLimit);
        producer.stockPrice = clamp(producer.previousStockPrice * (1 + producer.stockReturn), 8, 600);
        producer.marketCap = producer.stockPrice * safeNumber(producer.sharesOutstanding, 1);
        producer.expectedEarnings = smoothValue(safeNumber(producer.expectedEarnings, 0), Math.max(0, safeNumber(producer.afterTaxProfit, producer.lastProfit)) * (1 + producer.perceivedGrowth), 0.08);
        producer.valuationPressure = clamp(smoothValue(safeNumber(producer.valuationPressure, 0), (producer.marketCap / Math.max(1, producer.expectedEarnings + 12) - 14) / 24, 0.08), 0, 1);
        producer.investorSentiment = clamp(smoothValue(safeNumber(producer.investorSentiment, 1), 0.84 + producer.stockReturn * 8 - producer.valuationPressure * 0.12 - producer.informationOpacity * 0.10, 0.10), 0.35, 1.28);
        producer.equityFinancingCondition = clamp(0.82 + producer.investorSentiment * 0.20 + producer.stockReturn * 2.0 - producer.informationOpacity * 0.08, 0.55, 1.16);
        producer.investmentAppetite = clamp(safeNumber(producer.investmentAppetite, 0.5) + (producer.equityFinancingCondition - 1) * 0.015 + safeNumber(behavior.overconfidence, 0.22) * 0.002 - safeNumber(behavior.panicSellingPressure, 0.05) * 0.004, 0, 1.2);
        producer.hiringCaution = clamp(safeNumber(producer.hiringCaution, 0.25) + Math.max(0, -producer.stockReturn) * 0.35 + safeNumber(behavior.herdIntensity, 0.18) * safeNumber(state.sentiment?.recessionFear, 0.2) * 0.010, 0, 1);
        totalInitialMarketCap += safeNumber(producer.initialMarketCap, producer.marketCap);
        totalMarketCap += producer.marketCap;
      });
      const marketCapRatio = totalMarketCap / Math.max(1, totalInitialMarketCap);
      asset.stockIndexPoints = clamp(2500 * marketCapRatio, 1200, 9000);
      asset.stockIndex = clamp(asset.stockIndexPoints / 25, 35, 360);
    }

    function syncAssetMetrics() {
      if (!state.metrics || !state.assetMarket) return;
      const asset = state.assetMarket;
      state.metrics.stockIndex = safeNumber(asset.stockIndex, 100);
      state.metrics.stockIndexPoints = safeNumber(asset.stockIndexPoints, 2500);
      state.metrics.housingIndex = safeNumber(asset.housingIndex, 100);
      state.metrics.stockReturn = safeNumber(asset.stockReturn, 0) * 100;
      state.metrics.stockMonthlyReturn = safeNumber(asset.stockMonthlyReturn, safeNumber(asset.stockReturn, 0) * TICKS_PER_MONTH) * 100;
      state.metrics.stockVolatility = safeNumber(asset.stockVolatility, 0.015) * 100;
      state.metrics.stockVolatilityLabel = stockVolatilityLabel(asset.stockVolatility);
      state.metrics.stockValuationPressure = safeNumber(asset.stockValuationPressure, 0);
      state.metrics.stockValuationPressureLabel = asset.stockValuationPressureLabel || valuationPressureLabel(asset.stockValuationPressure);
      state.metrics.stockRiskSentiment = safeNumber(asset.stockRiskSentiment, 0.65);
      state.metrics.stockRiskSentimentLabel = asset.stockRiskSentimentLabel || stockRiskSentimentLabel(asset.stockRiskSentiment);
      state.metrics.stockDrawdown = safeNumber(asset.stockDrawdownFromPeak, 0) * 100;
      state.metrics.housingReturn = safeNumber(asset.housingReturn, 0) * 100;
      state.metrics.wealthEffect = safeNumber(asset.wealthEffect, 0) * 100;
      state.metrics.housingAffordability = safeNumber(asset.housingAffordability, 1);
      state.metrics.averageMortgageBurden = safeNumber(asset.averageMortgageBurden, 0);
      state.metrics.negativeEquityRatio = safeNumber(asset.negativeEquityRatio, 0);
      state.metrics.assetBubbleRiskScore = safeNumber(asset.assetBubbleRisk, 0);
      state.metrics.assetBubbleRiskLabel = asset.assetBubbleRiskLabel || "낮음";
      state.metrics.financialConditionIndex = safeNumber(state.financialConditionIndex, 0);
    }

    function syncRealEstateMetrics() {
      if (!state.metrics || !state.realEstate) return;
      const realEstate = state.realEstate;
      state.metrics.residentialIndex = safeNumber(realEstate.residentialIndex, 100);
      state.metrics.commercialIndex = safeNumber(realEstate.commercialIndex, 100);
      state.metrics.landIndex = safeNumber(realEstate.landIndex, 100);
      state.metrics.rentIndex = safeNumber(realEstate.rentIndex, 100);
      state.metrics.residentialReturn = safeNumber(realEstate.residentialReturn, 0) * 100;
      state.metrics.commercialReturn = safeNumber(realEstate.commercialReturn, 0) * 100;
      state.metrics.commercialVacancy = safeNumber(realEstate.commercialVacancy, 0.08) * 100;
      state.metrics.realEstateBubbleRisk = safeNumber(realEstate.realEstateBubbleRisk, 0);
      state.metrics.realEstateStress = safeNumber(realEstate.realEstateStress, 0.10);
      state.metrics.collateralValueIndex = safeNumber(realEstate.collateralValueIndex, 100);
      state.metrics.housingAffordability = safeNumber(realEstate.housingAffordability, state.metrics.housingAffordability || 1);
      state.metrics.housingDemand = safeNumber(realEstate.housingDemand, 1);
      state.metrics.mortgageRate = safeNumber(realEstate.mortgageRate, 0.05) * 100;
      state.metrics.perceivedHousingRisk = safeNumber(realEstate.perceivedHousingRisk, 0.15);
      state.metrics.perceivedCommercialRealEstateRisk = safeNumber(realEstate.perceivedCommercialRealEstateRisk, 0.15);
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

    function updateMarketPsychology() {
      const asset = state.assetMarket || createInitialAssetMarket();
      const info = state.information || createInitialInformationSystem();
      const sentiment = state.sentiment || createInitialSentimentState();
      const financial = state.financialMarket || createInitialFinancialMarket(state.config);
      const target = computeFearGreedIndex();
      const old = safeNumber(asset.fearGreedIndex, 50);
      const alpha = target < old ? 0.18 : 0.06;
      asset.fearGreedIndex = clamp(old * (1 - alpha) + target * alpha, 0, 100);
      asset.fearGreedLabel = fearGreedLabel(asset.fearGreedIndex);
      asset.stockVolatilityIndex = computeStockVolatilityIndex();
      asset.stockVolatilityIndexLabel = stockVolatilityIndexLabel(asset.stockVolatilityIndex);
      if (asset.fearGreedIndex < 35) {
        financial.safeHavenDemand = clamp(safeNumber(financial.safeHavenDemand, 0) + (35 - asset.fearGreedIndex) / 600, 0, 1);
      }
      if (asset.fearGreedIndex > 72) {
        asset.stockValuationPressure = clamp(safeNumber(asset.stockValuationPressure, 0) + (asset.fearGreedIndex - 72) / 1200, 0, 1);
      }
      asset.marketSentiment = clamp(smoothValue(safeNumber(asset.marketSentiment, 1), 0.74 + asset.fearGreedIndex / 100 * 0.36 - safeNumber(info.informationUncertainty, 0.16) * 0.12 + safeNumber(sentiment.marketRiskSentiment, 0.7) * 0.12, 0.06), 0.65, 1.24);
    }

    function computeFearGreedIndex() {
      const asset = state.assetMarket || createInitialAssetMarket();
      const info = state.information || createInitialInformationSystem();
      const sentiment = state.sentiment || createInitialSentimentState();
      const financial = state.financialMarket || createInitialFinancialMarket(state.config);
      const momentum = clamp(safeNumber(asset.stockMonthlyReturn, 0) * 2.6, -22, 22);
      const volatilityDrag = clamp((safeNumber(asset.stockVolatilityIndex, 18) - 18) * 0.8, -8, 24);
      const spreadDrag = clamp((safeNumber(financial.creditSpread, 0.02) - 0.025) * 360, -8, 28);
      const safeHavenDrag = safeNumber(financial.safeHavenDemand, 0) * 24;
      const bankDrag = safeNumber(financial.bankStress, 0.12) * 22;
      const recessionDrag = safeNumber(sentiment.recessionFear, 0.2) * 22;
      const confidenceBoost = (safeNumber(sentiment.businessConfidence, 0.8) - 0.65) * 24 + (safeNumber(sentiment.marketRiskSentiment, 0.7) - 0.62) * 20;
      const valuationDrag = safeNumber(asset.stockValuationPressure, 0) * 12;
      const rumorDrag = safeNumber(info.rumorIntensity, 0) * safeNumber(info.rumorCredibility, 0) * 18;
      const liquidityBoost = Math.max(0, safeNumber(financial.creditSupplyIndex, 100) - 92) * 0.25;
      const rawScore = 50 + momentum + confidenceBoost + liquidityBoost - volatilityDrag - spreadDrag - safeHavenDrag - bankDrag - recessionDrag - valuationDrag - rumorDrag;
      const stabilizerFloor = safeNumber(info.rumorIntensity, 0) < 0.20 && safeNumber(financial.bankStress, 0) < 0.65 && safeNumber(state.metrics.unemploymentRate, TARGET_UNEMPLOYMENT) < 12
        ? 24
        : 0;
      return clamp(Math.max(rawScore, stabilizerFloor), 0, 100);
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

    function computeStockReturn() {
      const asset = state.assetMarket || createInitialAssetMarket();
      const transmission = state.macroFinancial || createInitialMacroFinancialTransmission(state.config);
      const info = state.information || createInitialInformationSystem();
      const perceived = state.perceived || createInitialPerceivedEconomy();
      const behavior = state.behavior || createInitialBehavioralState();
      const firmCount = Math.max(1, state.producers.length);
      const afterTaxProfitTotal = state.producers.reduce((sum, producer) => {
        const afterTaxProfit = safeNumber(producer.afterTaxProfit, safeNumber(producer.lastProfit, 0));
        return sum + Math.max(0, afterTaxProfit);
      }, 0);
      const earningsProxy = Math.max(1, afterTaxProfitTotal + Math.max(0, safeNumber(state.metrics.averageFirmProfit, 0)) * firmCount * 0.35);
      const previousProfit = safeNumber(asset.previousFirmProfit, earningsProxy);
      const profitGrowth = clamp((earningsProxy - previousProfit) / Math.max(40, Math.abs(previousProfit)), -1.2, 1.2);
      asset.previousFirmProfit = smoothValue(previousProfit, earningsProxy, 0.10);
      const averageEarningsProxy = earningsProxy / firmCount;
      const profitSupportPoints = clamp(2300 + averageEarningsProxy * 10 + getGDPGrowthWindow() * 12, 1800, 5200);
      const valuationPressure = clamp((safeNumber(asset.stockIndexPoints, 2500) - profitSupportPoints) / Math.max(1, profitSupportPoints * 1.4), 0, 1);
      const supportGap = clamp((profitSupportPoints - safeNumber(asset.stockIndexPoints, 2500)) / Math.max(1, profitSupportPoints), -0.45, 0.75);
      const valuationSupportEffect = supportGap > 0 ? supportGap * 0.0080 : supportGap * 0.0020;
      asset.stockValuationPressure = clamp(smoothValue(safeNumber(asset.stockValuationPressure, 0), valuationPressure, 0.08), 0, 1);
      asset.stockValuationPressureLabel = valuationPressureLabel(asset.stockValuationPressure);
      const expectedGrowth = clamp((getGDPGrowthWindow() / 100) * 0.45 + safeNumber(asset.expectedEarningsGrowth, perceived.expectedEarningsGrowth || 0) * 0.55, -0.08, 0.08);
      const rate = safeNumber(transmission.corporateLoanRate, safeNumber(state.rates?.corporateLoanRate, state.financialMarket?.loanRate || state.government?.interestRate || 0.03));
      const bondYield = safeNumber(transmission.bondYield10Y, safeNumber(state.rates?.bondYield10Y, state.financialMarket?.bondYield || rate));
      const inflationRisk = Math.max(0, safeNumber(state.sentiment?.inflationExpectations, state.metrics.inflation || TARGET_INFLATION) - TARGET_INFLATION) / 100;
      const creditSpread = safeNumber(transmission.creditSpread, state.financialMarket?.creditSpread || 0.02);
      const bankRiskAppetite = safeNumber(state.sentiment?.bankRiskAppetite, 0.72);
      const businessConfidence = safeNumber(state.sentiment?.businessConfidence, 0.82);
      const recessionFear = clamp(safeNumber(state.sentiment?.recessionFear, 0.2) * 0.65 + safeNumber(perceived.recessionRisk, 0.2) * 0.35, 0, 1);
      const marketRiskSentiment = safeNumber(state.sentiment?.marketRiskSentiment, 0.72);
      const stockRiskTarget = clamp(
        0.64 + businessConfidence * 0.14 + marketRiskSentiment * 0.10 + bankRiskAppetite * 0.06 - recessionFear * 0.30 - creditSpread * 1.1 - asset.stockValuationPressure * 0.08,
        0.08,
        1.05
      );
      asset.stockRiskSentiment = clamp(smoothValue(safeNumber(asset.stockRiskSentiment, 0.65), stockRiskTarget, 0.08), 0, 1);
      asset.stockRiskSentimentLabel = stockRiskSentimentLabel(asset.stockRiskSentiment);
      const excessRate = Math.max(0, Math.max(rate, bondYield) - NEUTRAL_INTEREST_RATE / 100);
      const creditConditionDrag = Math.max(0, 90 - safeNumber(transmission.creditSupplyIndex, 100)) * 0.000025 + safeNumber(transmission.riskAversion, 0.2) * 0.0012;
      const sentimentDrag = recessionFear * 0.0037 + safeNumber(state.sentiment?.policyUncertainty, 0.1) * 0.0010 + safeNumber(info.marketOverreaction, 0.1) * 0.0014 + safeNumber(behavior.panicSellingPressure, 0.05) * 0.0032;
      const businessConfidenceEffect = (businessConfidence - 0.75) * 0.0040;
      const fearGreedEffect = clamp((safeNumber(asset.fearGreedIndex, 50) - 50) / 50 * 0.0022, -0.0032, 0.0026);
      const expectedRateSupport = clamp((NEUTRAL_INTEREST_RATE / 100 - safeNumber(transmission.expectedRatePath, safeNumber(asset.expectedRatePath, rate))) * 0.025, -0.0025, 0.0025);
      const dipBuyingSupport = safeNumber(behavior.dipBuyingBelief, 0.32) * Math.max(0, -safeNumber(asset.stockReturn, 0)) * 0.55;
      const beliefSupport = safeNumber(behavior.stockMarketNeverFailsBelief, 0.46) * 0.0014 + safeNumber(behavior.fomoIntensity, 0.12) * 0.0013;
      const mispricingDrag = Math.max(0, safeNumber(behavior.stockMispricing, 0)) * 0.0016;
      const marketSentimentEffect = (asset.stockRiskSentiment - 0.60) * 0.0060 + fearGreedEffect + expectedRateSupport + dipBuyingSupport + beliefSupport - mispricingDrag;
      const corporateTaxEffect = safeNumber(state.policy?.corporateTaxEffective, state.config?.corporateTaxRate || 0.16) * 0.0030;
      const valuationDrag = safeNumber(asset.stockValuationPressure, 0) * 0.0025;
      const baselineEquityDrift = 0.00070;
      const randomNoise = rand(-asset.stockVolatility, asset.stockVolatility) / TICKS_PER_MONTH * clamp(1 + safeNumber(info.informationUncertainty, 0.16) * 0.9, 1, 1.9);
      const crisisStockLimit = safeNumber(state.financialMarket?.bankStress, 0) > 0.55 || recessionFear > 0.62;
      const downLimit = crisisStockLimit ? 0.15 / TICKS_PER_MONTH : STOCK_RETURN_LIMIT;
      const upLimit = crisisStockLimit ? 0.10 / TICKS_PER_MONTH : STOCK_RETURN_LIMIT;
      const raw = clamp(
        baselineEquityDrift
          + profitGrowth * 0.0040
          + expectedGrowth * 0.018
          + businessConfidenceEffect
          - excessRate * 0.018
          - Math.max(0, bondYield - 0.035) * 0.006
          - creditSpread * 0.012
          - inflationRisk * 0.020
          - sentimentDrag
          - corporateTaxEffect
          - valuationDrag
          - safeNumber(asset.expectedRiskPremium, 0.04) * 0.004
          + valuationSupportEffect
          + marketSentimentEffect
          + randomNoise,
        -downLimit,
        upLimit
      );
      return raw;
    }

    function computeHousingReturn() {
      const asset = state.assetMarket || createInitialAssetMarket();
      const transmission = state.macroFinancial || createInitialMacroFinancialTransmission(state.config);
      const householdIncome = average(state.consumers.map((consumer) => safeNumber(consumer.disposableIncomeTick, consumer.income || 0)));
      const previousIncome = safeNumber(asset.previousHouseholdIncome, householdIncome || effectiveBaseWage());
      const incomeGrowth = (householdIncome - previousIncome) / Math.max(1, Math.abs(previousIncome));
      asset.previousHouseholdIncome = smoothValue(previousIncome, householdIncome, 0.07);
      const employmentEffect = (TARGET_UNEMPLOYMENT - safeNumber(state.metrics.unemploymentRate, TARGET_UNEMPLOYMENT)) / 100;
      const mortgageRate = safeNumber(transmission.mortgageRate, safeNumber(state.rates?.mortgageRate, safeNumber(state.financialMarket?.loanRate, safeNumber(state.government?.interestRate, 0.03) + 0.02)));
      const excessMortgageRate = Math.max(0, mortgageRate - 0.065);
      const debtBurden = safeNumber(state.metrics.averageHouseholdDebtBurden, 0) / 100;
      const creditSupplyEffect = clamp((safeNumber(transmission.creditSupplyIndex, 100) - 100) * 0.000035, -0.0020, 0.0015);
      const consumerMoodEffect = (safeNumber(state.sentiment?.consumerConfidence, 0.8) - 0.8) * 0.0020 + safeNumber(state.sentiment?.assetBubblePsychology, 0.1) * 0.0009;
      const supplyConstraint = clamp(1.6 - safeNumber(state.metrics.inventoryToDemand, 1.4), -1.0, 1.0);
      const inflationHedge = clamp(safeNumber(state.smoothedInflation, TARGET_INFLATION) / 100, -0.01, 0.04);
      const housingAnchor = clamp((100 - safeNumber(asset.housingIndex, 100)) / 100 * 0.0024, -0.0010, 0.0030);
      const baselineHousingDrift = 0.00030;
      const randomNoise = rand(-asset.housingVolatility, asset.housingVolatility) / TICKS_PER_MONTH;
      return clamp(
        baselineHousingDrift + incomeGrowth * 0.0045 + employmentEffect * 0.0065 + housingAnchor + creditSupplyEffect + consumerMoodEffect - excessMortgageRate * 0.006 - debtBurden * 0.006 + supplyConstraint * 0.0012 + inflationHedge * 0.020 + randomNoise,
        -HOUSING_RETURN_LIMIT,
        HOUSING_RETURN_LIMIT
      );
    }

    function applyWealthEffects() {
      if (!state.assetMarket) return;
      const asset = state.assetMarket;
      const realEstate = state.realEstate || createInitialRealEstateMarket();
      let mortgageBurdenTotal = 0;
      let negativeEquityCount = 0;
      state.consumers.forEach((consumer) => {
        consumer.stockHoldings = clamp(safeNumber(consumer.stockHoldings, 0) * (1 + asset.stockReturn), 0, 25000);
        if (consumer.housingStatus === "renter") {
          const rentPressure = clamp((safeNumber(realEstate.rentIndex, 100) - 100) / 120, -0.12, 0.42);
          consumer.rentBurden = clamp(smoothValue(safeNumber(consumer.rentBurden, 0.16), 0.14 + rentPressure, 0.08), 0.06, 0.52);
          consumer.housingWealth = 0;
          consumer.homeValue = 0;
        } else {
          consumer.homeValue = clamp(safeNumber(consumer.homeValue, consumer.housingWealth) * (1 + realEstate.residentialReturn), 0, 60000);
          consumer.housingWealth = consumer.homeValue;
        }
        consumer.mortgageDebt = clamp(safeNumber(consumer.mortgageDebt, 0), 0, Math.max(0, consumer.housingWealth) * 1.8 + consumer.creditLimit);
        consumer.assetWealth = safeNumber(consumer.stockHoldings, 0) + safeNumber(consumer.housingWealth, 0) - safeNumber(consumer.mortgageDebt, 0);
        const grossAssets = Math.max(1, safeNumber(consumer.stockHoldings, 0) + safeNumber(consumer.housingWealth, 0));
        const weightedAssetReturn = (safeNumber(consumer.stockHoldings, 0) * asset.stockReturn + safeNumber(consumer.housingWealth, 0) * realEstate.residentialReturn * 0.75) / grossAssets;
        consumer.wealthEffect = clamp(weightedAssetReturn * 2.4, -0.10, 0.10);
        consumer.negativeEquity = consumer.housingWealth > 0 && consumer.housingWealth < consumer.mortgageDebt * 0.96;
        if (consumer.negativeEquity) {
          negativeEquityCount += 1;
          consumer.confidence = clamp(consumer.confidence - 0.0035, 0.20, 1.24);
        } else {
          consumer.confidence = clamp(consumer.confidence + consumer.wealthEffect * safeNumber(consumer.wealthEffectSensitivity, 0.24) * 0.018, 0.20, 1.26);
        }
        mortgageBurdenTotal += safeNumber(consumer.mortgageBurden, 0);
      });
      asset.averageMortgageBurden = state.consumers.length ? mortgageBurdenTotal / state.consumers.length * 100 : 0;
      asset.negativeEquityRatio = state.consumers.length ? negativeEquityCount / state.consumers.length * 100 : 0;
      syncAssetMetrics();
      state.producers.forEach((producer) => {
        if (producer.propertyExposure === "propertyOwner" || producer.propertyExposure === "leveragedProperty") {
          producer.commercialPropertyValue = clamp(safeNumber(producer.commercialPropertyValue, 0) * (1 + realEstate.commercialReturn), 0, 80000);
          producer.collateralValue = clamp(producer.commercialPropertyValue * safeNumber(realEstate.collateralValueIndex, 100) / 100, 0, 90000);
          producer.propertyDebt = clamp(safeNumber(producer.propertyDebt, 0), 0, producer.collateralValue * 1.7 + 4000);
        } else if (producer.propertyExposure === "renter") {
          producer.rentCost = clamp(safeNumber(producer.rentCost, 0) * (1 + (safeNumber(realEstate.rentIndex, 100) - 100) / 1000), 0, 1200);
        }
        const marketBoost = clamp(asset.stockReturn * 0.70 + (asset.equityFinancingCondition - 1) * 0.12, -0.010, 0.012);
        const collateralMood = clamp((safeNumber(producer.collateralValue, 0) / Math.max(1, safeNumber(producer.commercialPropertyValue, 1)) - 0.85) * 0.003, -0.006, 0.006);
        producer.businessOutlook = clamp(producer.businessOutlook + marketBoost + collateralMood, 0.28, 1.42);
      });
    }

    function computeHousingAffordability() {
      const asset = state.assetMarket || createInitialAssetMarket();
      const averageDisposableIncome = Math.max(1, average(state.consumers.map((consumer) => safeNumber(consumer.disposableIncomeTick, consumer.income || effectiveBaseWage() * 0.35))));
      const mortgageRate = safeNumber(state.financialMarket?.loanRate, safeNumber(state.government?.interestRate, 0.03) + 0.02) + safeNumber(asset.mortgageRateSpread, 0.02) * 0.45;
      const priceIncomeRatio = safeNumber(asset.housingIndex, 100) / 100 * (effectiveBaseWage() * 2.8) / averageDisposableIncome;
      return clamp(priceIncomeRatio * (1 + mortgageRate * 4.5), 0.45, 3.2);
    }

    function computeAssetBubbleRisk() {
      const asset = state.assetMarket || createInitialAssetMarket();
      const realEstate = state.realEstate || createInitialRealEstateMarket();
      const gdpGrowth = getGDPGrowthWindow() / 100;
      const stockOverGrowth = Math.max(0, (safeNumber(asset.stockIndex, 100) - 100) / 100 - Math.max(0, gdpGrowth) * 2.5);
      const housingOverIncome = Math.max(0, (safeNumber(realEstate.residentialIndex, asset.housingIndex || 100) - 100) / 100 - Math.max(0, safeNumber(state.metrics.realWageGrowth, 0)) / 100);
      const landSpeculation = Math.max(0, (safeNumber(realEstate.landIndex, 100) - safeNumber(realEstate.commercialIndex, 100)) / 180);
      const lowRate = Math.max(0, (NEUTRAL_INTEREST_RATE / 100) - safeNumber(state.government?.interestRate, 0.03));
      const debtPressure = clamp((safeNumber(state.metrics.averageHouseholdDebtBurden, 0) - 8) / 28, 0, 1);
      const lowUnemployment = Math.max(0, TARGET_UNEMPLOYMENT - safeNumber(state.metrics.unemploymentRate, TARGET_UNEMPLOYMENT)) / 8;
      const fallingAssetRelief = Math.max(0, -asset.stockReturn * 8 - asset.housingReturn * 10);
      const valuationPressure = safeNumber(asset.stockValuationPressure, 0);
      const behavioralRisk = safeNumber(state.behavior?.behavioralMispricingIndex, 0) * 0.18 + safeNumber(state.behavior?.fomoIntensity, 0) * 0.10 + safeNumber(state.behavior?.realEstateNeverFallsBelief, 0.46) * Math.max(0, housingOverIncome) * 0.10 + safeNumber(state.behavior?.stockMarketNeverFailsBelief, 0.46) * Math.max(0, stockOverGrowth) * 0.08;
      const rawRisk = stockOverGrowth * 0.22 + valuationPressure * 0.18 + housingOverIncome * 0.34 + landSpeculation * 0.10 + safeNumber(realEstate.housingSpeculation, 0) * 0.10 + behavioralRisk + lowRate * 3.2 + debtPressure * 0.22 + lowUnemployment * 0.16 - fallingAssetRelief * 0.12;
      return clamp(smoothValue(safeNumber(asset.assetBubbleRisk, 0), rawRisk, 0.06), 0, 1);
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

    function updateBusinessOutlook() {
      state.producers.forEach((producer) => {
        const salesMomentum = producer.unitsSoldTick / Math.max(1, producer.expectedDemand);
        const inventoryBurden = producer.inventory / Math.max(1, producer.expectedDemand * 2.0);
        producer.inventoryBurden = clamp(inventoryBurden, 0, 4);

        // 경기순환 루프: 판매와 이윤이 약해지면 전망이 나빠지고, 전망 악화는 다음 틱의 고용과 투자를 낮춘다.
        const profitSignal = clamp(producer.profitTrend / 520, -0.45, 0.45);
        const salesSignal = clamp((salesMomentum - 0.75) * 0.42, -0.34, 0.32);
        const inventorySignal = inventoryBurden > 1.45 ? -clamp((inventoryBurden - 1.45) * 0.24, 0, 0.38) : clamp((1.0 - inventoryBurden) * 0.10, -0.06, 0.10);
        const utilizationSignal = clamp((safeNumber(producer.productionUtilization, 0.8) - 0.72) * 0.16, -0.08, 0.10);
        const rateSignal = -safeNumber(state.financialConditionIndex, state.government.interestRate * 100) * 0.010;
        const debtSignal = -Math.pow(Math.max(0, (producer.stressMemory || producer.debtStress) - 0.55), 1.20) * 0.18;
        const creditSignal = (safeNumber(state.financialMarket?.creditSupplyIndex, 100) - 100) * 0.0022 - safeNumber(state.financialMarket?.safeHavenDemand, 0) * 0.040;
        const bankPsychSignal = -safeNumber(state.financialMarket?.creditOfficerCaution, 0.28) * 0.060 - Math.max(0, 0.66 - safeNumber(state.financialMarket?.interbankTrust, 0.84)) * 0.18 - safeNumber(state.creditCycle?.creditCrunchRisk, 0.12) * 0.11 + safeNumber(state.creditCycle?.creditExcessRisk, 0.12) * 0.035;
        const targetOutlook = clamp(1 + profitSignal + salesSignal + inventorySignal + utilizationSignal + rateSignal + debtSignal + creditSignal + bankPsychSignal, 0.34, 1.34);
        producer.businessOutlook = clamp(smoothValue(producer.businessOutlook, targetOutlook, 0.060), 0.28, 1.42);
      });
    }

    // 인플레이션과 실업이 높으면 소비자는 다음 틱에서 더 조심스럽게 지출한다.
    function updateConsumerConfidence() {
      const unemployment = state.metrics.unemploymentRate / 100;
      const inflation = Math.max(0, state.metrics.inflation);
      const fiscalSupport = clamp((state.government.supportTick + state.government.procurementTick * 0.35) / Math.max(1, state.consumers.length * effectiveBaseWage()), 0, 0.18);

      state.consumers.forEach((consumer) => {
        let targetConfidence = 1.05 - unemployment * 0.72 - inflation * state.config.inflationSensitivity * 0.11 - safeNumber(state.financialMarket?.loanRate, state.government.interestRate) * consumer.interestSensitivity * 0.45 + fiscalSupport;
        targetConfidence -= safeNumber(state.financialMarket?.safeHavenDemand, 0) * 0.035 + Math.max(0, 82 - safeNumber(state.financialMarket?.bankHealthIndex, 100)) * 0.0012;
        targetConfidence -= Math.max(0, 0.66 - safeNumber(state.financialMarket?.depositorConfidence, 0.88)) * 0.18 + safeNumber(state.financialMarket?.bankFundingPressure, 0.12) * 0.055 + safeNumber(state.creditCycle?.creditCrunchRisk, 0.12) * 0.060;
        targetConfidence += consumer.employed ? 0.08 : -0.18;
        if (consumer.cash < state.metrics.averagePrice * 4) targetConfidence -= 0.10;
        if (consumer.debt > consumer.cash) targetConfidence -= state.government.interestRate * 0.9;
        if (consumer.financiallyStressed) targetConfidence -= 0.18 + consumer.debtStress * 0.16;
        const recoveryBuffer = unemployment > 0.20 ? clamp((unemployment - 0.20) * 0.20, 0, 0.055) : 0;
        consumer.confidence = clamp(smoothValue(consumer.confidence, targetConfidence + recoveryBuffer, 0.022) + rand(-0.004, 0.004), 0.24, 1.24);
      });
    }

    function stabilizeEconomy() {
      // 균형 안정화: 목표 물가와 자연실업률을 향한 약한 복원력만 부여해 하드 클램프 없이 진동을 줄인다.
      const inflationGap = state.metrics.inflation - TARGET_INFLATION;
      const unemploymentGap = state.metrics.unemploymentRate - TARGET_UNEMPLOYMENT;
      const weakEconomy = unemploymentGap > 5 || state.metrics.gdp < state.consumers.length * effectiveBaseWage() * 0.18;
      const recoveryUnemployment = state.metrics.unemploymentRate > 6;
      const highUnemployment = state.metrics.unemploymentRate > 20;
      const severeUnemployment = state.metrics.unemploymentRate > 35;
      const overheatedEconomy = inflationGap > 4 && state.metrics.unemploymentRate < TARGET_UNEMPLOYMENT + 1;

      state.consumers.forEach((consumer) => {
        if (weakEconomy) {
          consumer.confidence = clamp(consumer.confidence + 0.004 + Math.max(0, unemploymentGap) * 0.00035, 0.18, 1.28);
        }
        if (consumer.cash < state.metrics.averagePrice * 1.1 && consumer.debt < consumer.creditLimit * 1.6) {
          consumer.cash += Math.min(state.metrics.averagePrice * 0.08, effectiveBaseWage() * 0.035);
        }
        if (consumer.debt > consumer.creditLimit * 2.9) {
          consumer.debt = smoothValue(consumer.debt, consumer.creditLimit * 2.9, 0.025);
          consumer.stressMemory = clamp(consumer.stressMemory + 0.01, 0, 5);
        }
      });

      state.producers.forEach((producer) => {
        const minimumDemand = Math.max(1.2, producer.productionCapacity * 0.075);
        producer.expectedDemand = Math.max(producer.expectedDemand, minimumDemand);
        if (weakEconomy) {
          producer.businessOutlook = clamp(producer.businessOutlook + 0.0035 + (highUnemployment ? 0.003 : 0) + (severeUnemployment ? 0.004 : 0), 0.25, 1.42);
          producer.expectedInflation = clamp(smoothValue(producer.expectedInflation, TARGET_INFLATION, 0.018), 0, 4.2);
        }
        if (recoveryUnemployment && producer.cash > producer.wageOffered * Math.max(1, producer.employees.length) * 1.05 && producer.inventory < producer.expectedDemand * 2.3) {
          producer.hiringFreezeTicks = Math.max(0, (producer.hiringFreezeTicks || 0) - (severeUnemployment ? 2 : 1));
          producer.smoothedTargetEmployees = Math.max(producer.smoothedTargetEmployees || 0, Math.min(10, Math.floor(producer.productionCapacity / 3.8)));
        }
        if (producer.lastProfit > 0 && producer.cash > producer.wageOffered * Math.max(1, producer.employees.length)) {
          producer.stressMemory *= 0.96;
          producer.debtStress *= 0.97;
          producer.hiringFreezeTicks = Math.max(0, (producer.hiringFreezeTicks || 0) - 1);
        }
        if (overheatedEconomy) {
          producer.expectedInflation = clamp(smoothValue(producer.expectedInflation, TARGET_INFLATION, 0.018), -1.5, 4.2);
          producer.lastPriceChange = clamp((producer.lastPriceChange || 0) * 0.82, -MAX_PRICE_CHANGE_PER_TICK, MAX_PRICE_CHANGE_PER_TICK);
        }
        if (producer.productionCapacity < 3) {
          producer.productionCapacity = smoothValue(producer.productionCapacity, 4.5, 0.04);
        }
        const debtSoftCap = Math.max(2600, producer.productionCapacity * producer.price * 2.4);
        if (producer.debt > debtSoftCap) {
          producer.debt = smoothValue(producer.debt, debtSoftCap, 0.015);
          producer.activityDrag = clamp((producer.activityDrag || 1) * 0.998, 0.32, 1);
        }
      });
    }

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

    function applyShock(type) {
      if (type === "recession") {
        state.shock = {
          label: "수요 침체 충격",
          ticksRemaining: 28,
          demandMultiplier: 0.72,
          productivityMultiplier: 0.96,
          pricePressure: -0.002
        };
        state.consumers.forEach((consumer) => {
          consumer.confidence = clamp(consumer.confidence * rand(0.78, 0.90), 0.24, 1.2);
        });
        state.producers.forEach((producer) => {
          producer.expectedDemand *= rand(0.68, 0.83);
        });
        addEventMarker("충격");
        pushEvent("수요 침체 충격: 소비 심리와 예상 수요가 하락했습니다.");
      } else if (type === "supply") {
        state.shock = {
          label: "공급 차질 충격",
          ticksRemaining: 30,
          demandMultiplier: 0.96,
          productivityMultiplier: 0.72,
          pricePressure: 0.014
        };
        state.producers.forEach((producer) => {
          producer.inventory *= rand(0.84, 0.94);
        });
        addEventMarker("충격");
        pushEvent("공급 차질 충격: 생산성이 일시적으로 낮아지고 가격 압력이 커졌습니다.");
      } else if (type === "creditCrunch") {
        state.shock = {
          label: "신용경색 충격",
          ticksRemaining: 22,
          demandMultiplier: 0.90,
          productivityMultiplier: 0.98,
          pricePressure: -0.003
        };
        triggerCreditCycleEvent("creditCrunch", 0.72, "신용경색 충격: 은행 심리와 신용공급이 먼저 위축됩니다.");
      } else if (type === "creditExcess") {
        state.shock = {
          label: "신용 과다 충격",
          ticksRemaining: 28,
          demandMultiplier: 1.08,
          productivityMultiplier: 1.01,
          pricePressure: 0.004
        };
        triggerCreditCycleEvent("creditExcess", 0.68, "신용 과다 충격: 대출수요와 위험 과소평가가 함께 높아집니다.");
      } else if (type === "bondVolatility") {
        state.shock = {
          label: "국채시장 변동성",
          ticksRemaining: 18,
          demandMultiplier: 0.96,
          productivityMultiplier: 1,
          pricePressure: 0.002
        };
        triggerCreditCycleEvent("bondVolatility", 0.70, "국채시장 변동성: 장기채 가격과 은행 보유채권 평가가 흔들립니다.");
      } else if (type === "depositorAnxiety") {
        state.shock = {
          label: "예금자 불안",
          ticksRemaining: 20,
          demandMultiplier: 0.94,
          productivityMultiplier: 1,
          pricePressure: -0.001
        };
        triggerCreditCycleEvent("depositorAnxiety", 0.66, "예금자 불안: 은행 자금조달 압력이 높아집니다.");
      } else if (type === "longRateSpike") {
        state.shock = {
          label: "장기금리 급등",
          ticksRemaining: 20,
          demandMultiplier: 0.93,
          productivityMultiplier: 1,
          pricePressure: -0.001
        };
        triggerCreditCycleEvent("longRateSpike", 0.70, "장기금리 급등: 주택담보와 장기투자 비용이 먼저 올라갑니다.");
      } else if (type === "safeHavenSurge") {
        state.shock = {
          label: "안전자산 선호 급등",
          ticksRemaining: 20,
          demandMultiplier: 0.95,
          productivityMultiplier: 1,
          pricePressure: 0
        };
        triggerCreditCycleEvent("safeHavenSurge", 0.68, "안전자산 선호 급등: 위험자산 심리와 신용여건이 보수화됩니다.");
      } else {
        state.shock = {
          label: "물가 급등 충격",
          ticksRemaining: 24,
          demandMultiplier: 0.90,
          productivityMultiplier: 1,
          pricePressure: 0.020
        };
        state.producers.forEach((producer) => {
          producer.price *= rand(1.035, 1.075);
        });
        state.consumers.forEach((consumer) => {
          consumer.confidence = clamp(consumer.confidence * rand(0.86, 0.96), 0.24, 1.2);
        });
        addEventMarker("충격");
        pushEvent("물가 급등 충격: 가격 수준이 뛰고 소비자가 더 조심스러워졌습니다.");
      }
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

    function getCalibrationPresets() {
      return {
        baseline: { label: "균형 성장", interest: 4.5, tax: 16, corporateTax: 18, vat: 10, spending: 640, wage: 12, inflation: 0.65, shock: null, externalShock: 0.10, commodity: 100, bankStress: 0.10, assetSentiment: 0.55, householdConfidence: 0.84, businessConfidence: 0.86, cbCredibility: 0.86, message: "균형 성장 기본값을 적용했습니다." },
        boom: { label: "저금리 투자 붐", interest: 1.5, tax: 13, corporateTax: 15, vat: 9, spending: 700, wage: 12.5, inflation: 0.62, shock: null, externalShock: 0.08, commodity: 104, bankStress: 0.08, assetSentiment: 0.72, householdConfidence: 0.90, businessConfidence: 0.92, cbCredibility: 0.80, message: "저금리 투자 붐 시나리오를 적용했습니다." },
        inflation: { label: "고물가 긴축", interest: 9.5, tax: 18, corporateTax: 20, vat: 11, spending: 760, wage: 14, inflation: 1.05, shock: "inflation", externalShock: 0.24, commodity: 122, bankStress: 0.18, assetSentiment: 0.42, householdConfidence: 0.72, businessConfidence: 0.70, cbCredibility: 0.72, message: "고물가 긴축 압박 시나리오를 적용했습니다." },
        recovery: { label: "침체 회복", interest: 2.25, tax: 10, corporateTax: 12, vat: 7, spending: 1120, wage: 11.5, inflation: 0.72, shock: "recession", externalShock: 0.18, commodity: 96, bankStress: 0.22, assetSentiment: 0.42, householdConfidence: 0.64, businessConfidence: 0.62, cbCredibility: 0.78, message: "침체 회복 정책 시나리오를 적용했습니다." },
        welfare: { label: "고세율 고지출", interest: 4.0, tax: 28, corporateTax: 30, vat: 14, spending: 1280, wage: 13.5, inflation: 0.68, shock: null, externalShock: 0.12, commodity: 103, bankStress: 0.12, assetSentiment: 0.50, householdConfidence: 0.82, businessConfidence: 0.76, cbCredibility: 0.82, message: "고세율 고지출 국가 시나리오를 적용했습니다." },
        stableGrowth: { label: "안정 성장", interest: 4.2, tax: 15, corporateTax: 17, vat: 10, spending: 680, wage: 12, inflation: 0.65, shock: null, externalShock: 0.08, commodity: 100, bankStress: 0.08, assetSentiment: 0.46, householdConfidence: 0.84, businessConfidence: 0.86, cbCredibility: 0.90, housingBias: 0.28, stockBias: 0.30, message: "캘리브레이션 프리셋: 안정 성장을 적용했습니다." },
        highRateTightening: { label: "고금리 긴축", interest: 9.0, tax: 17, corporateTax: 19, vat: 10.5, spending: 620, wage: 12, inflation: 0.72, shock: null, creditEvent: "longRateSpike", externalShock: 0.12, commodity: 104, bankStress: 0.20, assetSentiment: 0.36, householdConfidence: 0.70, businessConfidence: 0.66, cbCredibility: 0.84, message: "캘리브레이션 프리셋: 고금리 긴축을 적용했습니다." },
        housingOverheat: { label: "부동산 과열", interest: 1.6, tax: 14, corporateTax: 17, vat: 9, spending: 760, wage: 12.6, inflation: 0.68, shock: null, creditEvent: "creditExcess", externalShock: 0.08, commodity: 104, bankStress: 0.08, assetSentiment: 0.78, householdConfidence: 0.92, businessConfidence: 0.86, cbCredibility: 0.76, housingBias: 0.78, message: "캘리브레이션 프리셋: 부동산 과열을 적용했습니다." },
        stockOverheat: { label: "주식시장 과열", interest: 1.8, tax: 13, corporateTax: 13, vat: 9, spending: 720, wage: 12.4, inflation: 0.62, shock: null, creditEvent: "creditExcess", externalShock: 0.06, commodity: 101, bankStress: 0.07, assetSentiment: 0.84, householdConfidence: 0.90, businessConfidence: 0.92, cbCredibility: 0.78, stockBias: 0.82, message: "캘리브레이션 프리셋: 주식시장 과열을 적용했습니다." },
        commodityShock: { label: "원자재 충격", interest: 5.2, tax: 15, corporateTax: 18, vat: 11, spending: 780, wage: 12.8, inflation: 1.00, shock: "inflation", externalShock: 0.42, commodity: 150, bankStress: 0.18, assetSentiment: 0.38, householdConfidence: 0.66, businessConfidence: 0.58, cbCredibility: 0.70, message: "캘리브레이션 프리셋: 원자재 충격을 적용했습니다." },
        financialStress: { label: "금융불안", interest: 5.8, tax: 16, corporateTax: 18, vat: 10, spending: 760, wage: 12, inflation: 0.72, shock: "recession", creditEvent: "creditCrunch", externalShock: 0.26, commodity: 105, bankStress: 0.52, assetSentiment: 0.24, householdConfidence: 0.58, businessConfidence: 0.52, cbCredibility: 0.72, message: "캘리브레이션 프리셋: 금융불안을 적용했습니다." },
        lowRateLongRun: { label: "저금리 장기화", interest: 0.75, tax: 14, corporateTax: 16, vat: 9.5, spending: 780, wage: 12.8, inflation: 0.70, shock: null, creditEvent: "creditExcess", externalShock: 0.10, commodity: 108, bankStress: 0.08, assetSentiment: 0.80, householdConfidence: 0.90, businessConfidence: 0.88, cbCredibility: 0.64, stockBias: 0.70, housingBias: 0.72, message: "캘리브레이션 프리셋: 저금리 장기화를 적용했습니다." },
        stagflation: { label: "스태그플레이션", interest: 6.8, tax: 18, corporateTax: 21, vat: 12, spending: 720, wage: 13.8, inflation: 1.10, shock: "inflation", externalShock: 0.46, commodity: 162, bankStress: 0.32, assetSentiment: 0.28, householdConfidence: 0.54, businessConfidence: 0.46, cbCredibility: 0.56, message: "캘리브레이션 프리셋: 스태그플레이션을 적용했습니다." },
        creditExcessFailure: { label: "시장 실패: 신용 과다", interest: 1.4, tax: 14, corporateTax: 15, vat: 9, spending: 760, wage: 12.5, inflation: 0.64, shock: null, creditEvent: "creditExcess", externalShock: 0.08, commodity: 103, bankStress: 0.05, assetSentiment: 0.86, householdConfidence: 0.92, businessConfidence: 0.94, cbCredibility: 0.72, stockBias: 0.80, housingBias: 0.82, message: "시장 실패 시나리오: 신용 과다를 적용했습니다." },
        supplyBottleneckFailure: { label: "시장 실패: 공급 병목", interest: 5.4, tax: 16, corporateTax: 18, vat: 11, spending: 820, wage: 13.2, inflation: 0.96, shock: "inflation", externalShock: 0.38, commodity: 142, bankStress: 0.20, assetSentiment: 0.38, householdConfidence: 0.62, businessConfidence: 0.56, cbCredibility: 0.68, foreignSupplierPressure: 0.68, message: "시장 실패 시나리오: 공급 병목을 적용했습니다." },
        productivityExpansion: { label: "시장 성공: 생산성 확장", interest: 3.6, tax: 14, corporateTax: 14, vat: 9.5, spending: 760, wage: 12.8, inflation: 0.55, shock: null, externalShock: 0.06, commodity: 98, bankStress: 0.06, assetSentiment: 0.66, householdConfidence: 0.88, businessConfidence: 0.94, cbCredibility: 0.90, productivityBoost: 0.10, message: "시장 성공 시나리오: 생산성 확장을 적용했습니다." },
        foreignDemandBoom: { label: "해외수요 호조", interest: 4.0, tax: 15, corporateTax: 17, vat: 10, spending: 700, wage: 12.4, inflation: 0.66, shock: null, externalShock: 0.06, commodity: 106, bankStress: 0.08, assetSentiment: 0.62, householdConfidence: 0.84, businessConfidence: 0.88, cbCredibility: 0.86, foreignDemand: 132, foreignInvestorSentiment: 0.82, message: "해외수요 호조 시나리오를 적용했습니다." },
        foreignCapitalOutflow: { label: "해외 자본유출", interest: 6.2, tax: 16, corporateTax: 19, vat: 10.5, spending: 720, wage: 12.3, inflation: 0.82, shock: null, creditEvent: "bondVolatility", externalShock: 0.34, commodity: 112, bankStress: 0.26, assetSentiment: 0.30, householdConfidence: 0.64, businessConfidence: 0.58, cbCredibility: 0.58, foreignInvestorSentiment: 0.28, foreignBondDemand: 0.32, message: "해외 자본유출 시나리오를 적용했습니다." },
        agricultureShock: { label: "농업 공급 충격", interest: 4.8, tax: 15, corporateTax: 17, vat: 11, spending: 780, wage: 12.7, inflation: 0.90, shock: "inflation", externalShock: 0.30, commodity: 134, bankStress: 0.14, assetSentiment: 0.44, householdConfidence: 0.60, businessConfidence: 0.62, cbCredibility: 0.72, agricultureStressBias: 0.62, foreignSupplierPressure: 0.52, message: "농업 공급 충격 시나리오를 적용했습니다." },
        energyPriceShock: { label: "에너지 가격 충격", interest: 5.6, tax: 15, corporateTax: 18, vat: 11.5, spending: 760, wage: 13, inflation: 1.02, shock: "inflation", externalShock: 0.42, commodity: 168, bankStress: 0.18, assetSentiment: 0.36, householdConfidence: 0.58, businessConfidence: 0.54, cbCredibility: 0.68, energyStressBias: 0.64, foreignSupplierPressure: 0.72, message: "에너지 가격 충격 시나리오를 적용했습니다." }
      };
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

    function applyCalibrationState(scenario) {
      if (!scenario) return;
      if (!state.external) state.external = createInitialExternalSector();
      if (!state.financialMarket) state.financialMarket = createInitialFinancialMarket(state.config);
      if (!state.assetMarket) state.assetMarket = createInitialAssetMarket();
      if (!state.realEstate) state.realEstate = createInitialRealEstateMarket();
      if (!state.sentiment) state.sentiment = createInitialSentimentState();
      if (!state.policyCredibility) state.policyCredibility = createInitialPolicyCredibility();
      if (!state.behavior) state.behavior = createInitialBehavioralState();
      if (!state.externalActors) state.externalActors = createInitialExternalActors();

      state.external.externalShockPressure = clamp(safeNumber(scenario.externalShock, 0.1), 0, 1);
      state.external.commodityPriceIndex = clamp(safeNumber(scenario.commodity, 100), 65, 210);
      state.external.energyPriceIndex = clamp(100 + (state.external.commodityPriceIndex - 100) * 0.72, 60, 230);
      if (scenario.foreignDemand) {
        state.externalActors.foreignConsumers.demandIndex = clamp(scenario.foreignDemand, 55, 170);
        state.externalActors.foreignConsumers.confidence = clamp(0.45 + scenario.foreignDemand / 170 * 0.55, 0.25, 1.05);
        state.externalActors.foreignConsumers.exportPull = clamp(scenario.foreignDemand / 100, 0.55, 1.70);
      }
      if (scenario.foreignInvestorSentiment !== undefined) {
        state.externalActors.foreignInvestors.sentiment = clamp(scenario.foreignInvestorSentiment, 0.15, 1.10);
        state.external.foreignInvestorSentiment = state.externalActors.foreignInvestors.sentiment;
      }
      if (scenario.foreignBondDemand !== undefined) {
        state.externalActors.foreignBondholders.demand = clamp(scenario.foreignBondDemand, 0.18, 1.05);
        state.externalActors.foreignBondholders.fundingPressure = clamp(0.72 - state.externalActors.foreignBondholders.demand, 0, 1);
      }
      if (scenario.foreignSupplierPressure !== undefined) {
        state.externalActors.foreignSuppliers.pressure = clamp(scenario.foreignSupplierPressure, 0, 1);
        state.externalActors.foreignSuppliers.deliveryStress = clamp(scenario.foreignSupplierPressure * 0.8, 0, 1);
      }
      state.financialMarket.bankStress = clamp(safeNumber(scenario.bankStress, 0.1), 0, 1);
      state.financialMarket.creditSpread = clamp(0.015 + state.financialMarket.bankStress * 0.055, 0.01, 0.12);
      state.financialMarket.creditSupplyIndex = clamp(104 - state.financialMarket.bankStress * 45, 35, 112);
      state.financialMarket.depositorConfidence = clamp(0.90 - state.financialMarket.bankStress * 0.36, 0.24, 1.05);
      state.financialMarket.interbankTrust = clamp(0.88 - state.financialMarket.bankStress * 0.42, 0.22, 1.02);
      state.financialMarket.bankFundingPressure = clamp(0.10 + state.financialMarket.bankStress * 0.45, 0, 1);
      state.financialMarket.creditOfficerCaution = clamp(0.22 + state.financialMarket.bankStress * 0.48, 0.05, 0.92);
      state.assetMarket.marketSentiment = clamp(safeNumber(scenario.assetSentiment, 0.55), 0, 1);
      state.assetMarket.stockRiskSentiment = clamp(safeNumber(scenario.assetSentiment, 0.55), 0, 1);
      state.sentiment.consumerConfidence = clamp(safeNumber(scenario.householdConfidence, 0.84), 0, 1.2);
      state.sentiment.businessConfidence = clamp(safeNumber(scenario.businessConfidence, 0.86), 0, 1.2);
      state.sentiment.marketRiskSentiment = clamp(safeNumber(scenario.assetSentiment, 0.55), 0, 1.2);
      state.sentiment.bankRiskAppetite = clamp(0.82 - state.financialMarket.bankStress * 0.45, 0, 1.2);
      state.policyCredibility.centralBankCredibility = clamp(safeNumber(scenario.cbCredibility, 0.82), 0, 1);
      state.policyCredibility.inflationTargetCredibility = clamp(safeNumber(scenario.cbCredibility, 0.82), 0, 1);
      state.policyCredibility.forwardGuidanceClarity = clamp(safeNumber(scenario.cbCredibility, 0.82) + 0.04, 0, 1);
      if (scenario.creditEvent) {
        triggerCreditCycleEvent(scenario.creditEvent, scenario.creditEvent === "creditExcess" ? 0.52 : 0.58, `시나리오 신용사건: ${scenario.label}`);
      }
      if (scenario.housingBias) state.behavior.realEstateNeverFallsBelief = clamp(scenario.housingBias, 0, 1);
      if (scenario.stockBias) state.behavior.stockMarketNeverFailsBelief = clamp(scenario.stockBias, 0, 1);
      state.consumers.forEach((consumer) => {
        consumer.confidence = clamp(consumer.confidence * (0.65 + safeNumber(scenario.householdConfidence, 0.84) * 0.40), 0.18, 1.35);
      });
      state.producers.forEach((producer) => {
        producer.businessConfidence = clamp(safeNumber(producer.businessConfidence, 0.8) * (0.65 + safeNumber(scenario.businessConfidence, 0.86) * 0.42), 0, 1.3);
        producer.businessOutlook = clamp(safeNumber(producer.businessOutlook, 0.8) * (0.70 + safeNumber(scenario.businessConfidence, 0.86) * 0.36), 0.2, 1.4);
        if (scenario.productivityBoost) producer.productivity = clamp(safeNumber(producer.productivity, 1) * (1 + scenario.productivityBoost), 0.25, 6);
        if (scenario.agricultureStressBias && producer.sector === "agriculture") producer.sectorStress = clamp(safeNumber(producer.sectorStress, 0) + scenario.agricultureStressBias, 0, 1);
        if (scenario.energyStressBias && producer.sector === "energy") producer.sectorStress = clamp(safeNumber(producer.sectorStress, 0) + scenario.energyStressBias, 0, 1);
      });
      syncExternalMetrics();
      syncPolicyCredibilityMetrics();
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

    function getHistoricalScenarioTimeline(key) {
      const timelines = {
        koreaImf1997: [
          { months: 6, label: "외환 유동성 경색", message: "해외자금 이탈과 외화 유동성 경색이 환율과 단기금리를 흔듭니다.", effects: { historicalIntensity: 0.85, interest: 18, externalShock: 0.86, exchangeRate: 148, importPrice: 142, bankStress: 0.72, creditEvent: "creditCrunch", foreignInvestorSentiment: 0.14, foreignBondDemand: 0.20, assetSentiment: 0.14, householdConfidence: 0.42, businessConfidence: 0.32, cbCredibility: 0.42 } },
          { months: 10, label: "IMF 긴축·고금리", message: "고금리와 구조조정 압력이 기업 현금흐름과 고용을 압박합니다.", effects: { historicalIntensity: 0.78, interest: 16, spending: 780, externalShock: 0.68, bankStress: 0.64, creditEvent: "creditCrunch", foreignInvestorSentiment: 0.24, foreignBondDemand: 0.34, corporateStressBias: 0.18, businessConfidence: 0.40, householdConfidence: 0.48 } },
          { months: 12, label: "기업·은행 구조조정", message: "취약기업 정리와 은행 신뢰 회복이 느리게 진행됩니다.", effects: { historicalIntensity: 0.55, interest: 10, spending: 900, externalShock: 0.42, bankStress: 0.48, creditEvent: "interbankDistrust", foreignInvestorSentiment: 0.44, foreignBondDemand: 0.48, businessConfidence: 0.50, cbCredibility: 0.56 } },
          { months: 12, label: "수출 회복·신뢰 회복", message: "약한 통화와 신뢰 회복이 제조업 수출을 일부 살립니다.", effects: { historicalIntensity: 0.32, interest: 6.2, externalShock: 0.24, exportDemand: 132, foreignDemand: 132, foreignInvestorSentiment: 0.62, foreignBondDemand: 0.62, bankStress: 0.30, householdConfidence: 0.62, businessConfidence: 0.66, cbCredibility: 0.70 } }
        ],
        usFinancialCrisis2007: [
          { months: 8, label: "주택 둔화", message: "주택가격과 담보가치가 약해지며 가계·은행 위험인식이 먼저 흔들립니다.", effects: { historicalIntensity: 0.62, interest: 5.0, residentialShock: -0.10, commercialShock: -0.05, housingBias: 0.22, bankStress: 0.38, assetSentiment: 0.34, householdConfidence: 0.60, businessConfidence: 0.58 } },
          { months: 8, label: "비우량 mortgage 부실", message: "주택담보 부담과 부실대출이 은행 신뢰를 약화시킵니다.", effects: { historicalIntensity: 0.78, interest: 4.0, residentialShock: -0.16, collateralShock: -0.14, bankStress: 0.70, creditEvent: "creditCrunch", interbankTrust: 0.42, depositorConfidence: 0.58, assetSentiment: 0.20, householdConfidence: 0.50, businessConfidence: 0.46 } },
          { months: 10, label: "유동성 경색", message: "은행 간 신뢰 하락과 신용스프레드 확대가 투자보다 먼저 반응합니다.", effects: { historicalIntensity: 0.82, interest: 2.5, bankStress: 0.76, creditEvent: "interbankDistrust", creditSupply: 62, creditSpread: 0.085, stockShock: -0.14, safeHaven: 0.58, householdConfidence: 0.44, businessConfidence: 0.38 } },
          { months: 12, label: "금리인하·정책 유동성", message: "정책 완화가 시작되지만 신용경로 회복은 늦게 나타납니다.", effects: { historicalIntensity: 0.55, interest: 1.2, spending: 1120, bankStress: 0.52, creditEvent: "creditCrunch", creditSupply: 72, assetSentiment: 0.36, cbCredibility: 0.76, householdConfidence: 0.50, businessConfidence: 0.48 } },
          { months: 10, label: "실물투자 둔화", message: "주택과 신용 충격이 뒤늦게 고용과 투자로 전이됩니다.", effects: { historicalIntensity: 0.42, interest: 0.75, spending: 1180, bankStress: 0.42, businessConfidence: 0.52, householdConfidence: 0.56, assetSentiment: 0.42, foreignInvestorSentiment: 0.58 } }
        ],
        japanBubbleEconomy: [
          { months: 12, label: "저금리·자산 낙관", message: "낮은 금리와 불패 믿음이 주식·부동산 수요를 밀어 올립니다.", effects: { historicalIntensity: 0.55, interest: 1.2, creditEvent: "creditExcess", assetSentiment: 0.90, housingBias: 0.92, stockBias: 0.88, creditSupply: 110, bankStress: 0.06, householdConfidence: 0.92, businessConfidence: 0.94 } },
          { months: 12, label: "담보대출 확대", message: "부동산 담보가치 상승이 은행 대출심리를 더 느슨하게 만듭니다.", effects: { historicalIntensity: 0.68, interest: 1.5, creditEvent: "creditExcess", residentialShock: 0.16, commercialShock: 0.14, collateralShock: 0.18, riskUnderpricing: 0.72, assetSentiment: 0.94, businessConfidence: 0.96 } },
          { months: 12, label: "주식·토지 동반 과열", message: "자산가격과 신용이 기초여건보다 빠르게 올라갑니다.", effects: { historicalIntensity: 0.78, interest: 2.0, creditEvent: "creditExcess", stockShock: 0.16, residentialShock: 0.14, commercialShock: 0.12, housingBias: 0.96, stockBias: 0.94, assetSentiment: 0.96 } },
          { months: 8, label: "금리 상승·규제 압력", message: "정책 정상화가 시작되며 장기금리와 valuation 압력이 높아집니다.", effects: { historicalIntensity: 0.62, interest: 5.5, creditEvent: "longRateSpike", assetSentiment: 0.54, bankStress: 0.22, stockShock: -0.08, residentialShock: -0.04, businessConfidence: 0.66 } },
          { months: 12, label: "자산 조정 취약성", message: "불패 믿음이 약해지고 좀비기업·담보가치 취약성이 드러납니다.", effects: { historicalIntensity: 0.58, interest: 4.2, creditEvent: "creditCrunch", assetSentiment: 0.34, bankStress: 0.42, stockShock: -0.12, residentialShock: -0.10, housingBias: 0.34, stockBias: 0.36 } }
        ],
        germanyReunification: [
          { months: 8, label: "통합 충격", message: "제도 통합과 생산성 격차가 단기 불확실성을 키웁니다.", effects: { historicalIntensity: 0.40, interest: 6.0, spending: 1200, wage: 14.2, businessConfidence: 0.58, householdConfidence: 0.74, cbCredibility: 0.82, constructionStressBias: -0.06 } },
          { months: 12, label: "재정이전·건설붐", message: "대규모 이전과 건설 수요가 내수를 지지하지만 재정 부담을 키웁니다.", effects: { historicalIntensity: 0.56, interest: 6.8, tax: 21, corporateTax: 24, spending: 1450, wage: 15.2, residentialShock: 0.06, commercialShock: 0.08, businessConfidence: 0.66, householdConfidence: 0.80, constructionStressBias: -0.12 } },
          { months: 12, label: "임금-생산성 괴리", message: "임금 상승이 생산성보다 빨라 일부 산업의 마진과 고용이 압박받습니다.", effects: { historicalIntensity: 0.62, interest: 7.2, spending: 1320, wage: 16.2, productivityBoost: -0.05, manufacturingStressBias: 0.18, businessConfidence: 0.54, externalShock: 0.18 } },
          { months: 10, label: "재정·실업 부담", message: "재정 이전의 지속성이 시험받고 산업별 불균형이 남습니다.", effects: { historicalIntensity: 0.52, interest: 5.8, spending: 1180, tax: 22, bankStress: 0.24, foreignBondDemand: 0.56, householdConfidence: 0.66, businessConfidence: 0.56 } },
          { months: 12, label: "생산성 적응", message: "투자와 구조 적응이 진행되며 시장 기능이 일부 회복됩니다.", effects: { historicalIntensity: 0.30, interest: 4.2, spending: 980, productivityBoost: 0.06, businessConfidence: 0.68, householdConfidence: 0.72, cbCredibility: 0.86 } }
        ],
        turkiyeInflation2018: [
          { months: 6, label: "환율 불안", message: "해외자본 이탈과 환율 약세가 수입물가를 빠르게 밀어 올립니다.", effects: { historicalIntensity: 0.86, interest: 12, externalShock: 0.86, exchangeRate: 158, importPrice: 168, commodity: 164, foreignInvestorSentiment: 0.18, foreignBondDemand: 0.26, foreignSupplierPressure: 0.82, cbCredibility: 0.28, householdConfidence: 0.42, businessConfidence: 0.36 } },
          { months: 8, label: "수입물가·기대물가 상승", message: "환율 전가와 기대인플레이션이 임금·가격 결정에 남습니다.", effects: { historicalIntensity: 0.82, interest: 18, externalShock: 0.78, commodity: 172, foreignSupplierPressure: 0.76, cbCredibility: 0.32, wage: 15.8, householdConfidence: 0.38, businessConfidence: 0.34 } },
          { months: 8, label: "급격한 금리 인상", message: "명목금리 인상은 환율 안정에 도움을 주지만 부채와 실질소비를 압박합니다.", effects: { historicalIntensity: 0.76, interest: 20, creditEvent: "longRateSpike", bankStress: 0.48, externalShock: 0.62, exchangeRate: 142, importPrice: 150, cbCredibility: 0.42, householdConfidence: 0.40, businessConfidence: 0.38 } },
          { months: 10, label: "실질소비 둔화", message: "고물가와 대출금리 부담이 저소득층 소비여력을 낮춥니다.", effects: { historicalIntensity: 0.62, interest: 18, externalShock: 0.52, commodity: 150, bankStress: 0.42, householdConfidence: 0.44, businessConfidence: 0.42, foreignInvestorSentiment: 0.34 } },
          { months: 12, label: "부분 안정·신뢰 회복 지연", message: "금융 안정은 일부 회복되지만 기대물가와 정책신뢰 회복은 느립니다.", effects: { historicalIntensity: 0.42, interest: 14, externalShock: 0.36, exchangeRate: 126, importPrice: 132, cbCredibility: 0.52, foreignInvestorSentiment: 0.44, foreignBondDemand: 0.46, householdConfidence: 0.52, businessConfidence: 0.50 } }
        ]
      };
      return timelines[key] || [];
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

    function applyHistoricalPhaseEffects(effects = {}, immediate = false) {
      if (!effects) return;
      setPolicyLevel(effects);
      if (!state.external) state.external = createInitialExternalSector();
      if (!state.financialMarket) state.financialMarket = createInitialFinancialMarket(state.config);
      if (!state.assetMarket) state.assetMarket = createInitialAssetMarket();
      if (!state.realEstate) state.realEstate = createInitialRealEstateMarket();
      if (!state.sentiment) state.sentiment = createInitialSentimentState();
      if (!state.policyCredibility) state.policyCredibility = createInitialPolicyCredibility();
      if (!state.behavior) state.behavior = createInitialBehavioralState();
      if (!state.externalActors) state.externalActors = createInitialExternalActors();
      const alpha = immediate ? 1 : 0.35;
      if (effects.externalShock !== undefined) state.external.externalShockPressure = clamp(smoothValue(state.external.externalShockPressure, effects.externalShock, alpha), 0, 1);
      if (effects.exchangeRate !== undefined) state.external.exchangeRateIndex = clamp(smoothValue(state.external.exchangeRateIndex, effects.exchangeRate, alpha), 70, 180);
      if (effects.importPrice !== undefined) state.external.importPriceIndex = clamp(smoothValue(state.external.importPriceIndex, effects.importPrice, alpha), 70, 220);
      if (effects.commodity !== undefined) {
        state.external.commodityPriceIndex = clamp(smoothValue(state.external.commodityPriceIndex, effects.commodity, alpha), 65, 240);
        state.external.energyPriceIndex = clamp(smoothValue(state.external.energyPriceIndex, 100 + (effects.commodity - 100) * 0.72, alpha), 60, 260);
      }
      if (effects.exportDemand !== undefined) state.external.exportDemand = clamp(smoothValue(state.external.exportDemand, effects.exportDemand, alpha), 60, 180);
      if (effects.foreignDemand !== undefined) {
        state.externalActors.foreignConsumers.demandIndex = clamp(smoothValue(state.externalActors.foreignConsumers.demandIndex, effects.foreignDemand, alpha), 55, 170);
        state.externalActors.foreignConsumers.exportPull = clamp(state.externalActors.foreignConsumers.demandIndex / 100, 0.55, 1.70);
      }
      if (effects.foreignInvestorSentiment !== undefined) {
        state.externalActors.foreignInvestors.sentiment = clamp(smoothValue(state.externalActors.foreignInvestors.sentiment, effects.foreignInvestorSentiment, alpha), 0.12, 1.10);
        state.external.foreignInvestorSentiment = state.externalActors.foreignInvestors.sentiment;
      }
      if (effects.foreignBondDemand !== undefined) {
        state.externalActors.foreignBondholders.demand = clamp(smoothValue(state.externalActors.foreignBondholders.demand, effects.foreignBondDemand, alpha), 0.16, 1.05);
        state.externalActors.foreignBondholders.fundingPressure = clamp(0.72 - state.externalActors.foreignBondholders.demand, 0, 1);
      }
      if (effects.foreignSupplierPressure !== undefined) {
        state.externalActors.foreignSuppliers.pressure = clamp(smoothValue(state.externalActors.foreignSuppliers.pressure, effects.foreignSupplierPressure, alpha), 0, 1);
        state.externalActors.foreignSuppliers.deliveryStress = clamp(smoothValue(state.externalActors.foreignSuppliers.deliveryStress, effects.foreignSupplierPressure * 0.8, alpha), 0, 1);
      }
      if (effects.bankStress !== undefined) state.financialMarket.bankStress = clamp(smoothValue(state.financialMarket.bankStress, effects.bankStress, alpha), 0, 1);
      if (effects.creditSupply !== undefined) state.financialMarket.creditSupplyIndex = clamp(smoothValue(state.financialMarket.creditSupplyIndex, effects.creditSupply, alpha), 35, 112);
      if (effects.creditSpread !== undefined) state.financialMarket.creditSpread = clamp(smoothValue(state.financialMarket.creditSpread, effects.creditSpread, alpha), 0.01, 0.12);
      if (effects.interbankTrust !== undefined) state.financialMarket.interbankTrust = clamp(smoothValue(state.financialMarket.interbankTrust, effects.interbankTrust, alpha), 0.18, 1.05);
      if (effects.depositorConfidence !== undefined) state.financialMarket.depositorConfidence = clamp(smoothValue(state.financialMarket.depositorConfidence, effects.depositorConfidence, alpha), 0.18, 1.05);
      if (effects.riskUnderpricing !== undefined) state.financialMarket.riskUnderpricing = clamp(smoothValue(state.financialMarket.riskUnderpricing, effects.riskUnderpricing, alpha), 0, 1);
      if (effects.safeHaven !== undefined) state.financialMarket.safeHavenDemand = clamp(smoothValue(state.financialMarket.safeHavenDemand, effects.safeHaven, alpha), 0, 1);
      if (effects.assetSentiment !== undefined) {
        state.assetMarket.marketSentiment = clamp(smoothValue(state.assetMarket.marketSentiment, effects.assetSentiment, alpha), 0, 1);
        state.assetMarket.stockRiskSentiment = clamp(smoothValue(state.assetMarket.stockRiskSentiment, effects.assetSentiment, alpha), 0, 1);
        state.sentiment.marketRiskSentiment = clamp(smoothValue(state.sentiment.marketRiskSentiment, effects.assetSentiment, alpha), 0, 1.2);
      }
      if (effects.stockShock !== undefined) state.assetMarket.stockIndexPoints = clamp(state.assetMarket.stockIndexPoints * (1 + effects.stockShock), 900, 12000);
      if (effects.residentialShock !== undefined) state.realEstate.residentialIndex = clamp(state.realEstate.residentialIndex * (1 + effects.residentialShock), 40, 280);
      if (effects.commercialShock !== undefined) state.realEstate.commercialIndex = clamp(state.realEstate.commercialIndex * (1 + effects.commercialShock), 35, 260);
      if (effects.collateralShock !== undefined) state.realEstate.collateralValueIndex = clamp(state.realEstate.collateralValueIndex * (1 + effects.collateralShock), 35, 280);
      if (effects.housingBias !== undefined) state.behavior.realEstateNeverFallsBelief = clamp(smoothValue(state.behavior.realEstateNeverFallsBelief, effects.housingBias, alpha), 0, 1);
      if (effects.stockBias !== undefined) state.behavior.stockMarketNeverFailsBelief = clamp(smoothValue(state.behavior.stockMarketNeverFailsBelief, effects.stockBias, alpha), 0, 1);
      if (effects.householdConfidence !== undefined) state.sentiment.consumerConfidence = clamp(smoothValue(state.sentiment.consumerConfidence, effects.householdConfidence, alpha), 0, 1.2);
      if (effects.businessConfidence !== undefined) state.sentiment.businessConfidence = clamp(smoothValue(state.sentiment.businessConfidence, effects.businessConfidence, alpha), 0, 1.2);
      if (effects.cbCredibility !== undefined) {
        state.policyCredibility.centralBankCredibility = clamp(smoothValue(state.policyCredibility.centralBankCredibility, effects.cbCredibility, alpha), 0, 1);
        state.policyCredibility.inflationTargetCredibility = clamp(smoothValue(state.policyCredibility.inflationTargetCredibility, effects.cbCredibility, alpha), 0, 1);
        state.policyCredibility.forwardGuidanceClarity = clamp(smoothValue(state.policyCredibility.forwardGuidanceClarity, effects.cbCredibility + 0.04, alpha), 0, 1);
      }
      const phaseStart = safeNumber(state.historicalScenario?.phaseMonth, 0) <= 1;
      if (effects.creditEvent && (immediate || phaseStart)) {
        triggerCreditCycleEvent(effects.creditEvent, effects.historicalIntensity || 0.58, `역사 시나리오 사건: ${effects.creditEvent}`);
      }
      state.producers.forEach((producer) => {
        if (effects.productivityBoost) producer.productivity = clamp(safeNumber(producer.productivity, 1) * (1 + effects.productivityBoost * 0.25), 0.25, 6);
        if (effects.corporateStressBias) producer.sectorStress = clamp(safeNumber(producer.sectorStress, 0) + effects.corporateStressBias * 0.20, 0, 1);
        if (effects.manufacturingStressBias && producer.sector === "manufacturing") producer.sectorStress = clamp(safeNumber(producer.sectorStress, 0) + effects.manufacturingStressBias * 0.35, 0, 1);
        if (effects.constructionStressBias && producer.sector === "construction") producer.sectorStress = clamp(safeNumber(producer.sectorStress, 0) + effects.constructionStressBias * 0.35, 0, 1);
      });
      syncExternalMetrics();
      syncFinancialMarketMetrics();
      syncPolicyCredibilityMetrics();
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

    function sanitizeEconomy() {
      if (!state.ui) state.ui = createInitialUiState();
      state.ui.largeEconomyMode = isLargeEconomyMode();
      state.ui.lastInspectorUpdateTick = clamp(Math.round(safeNumber(state.ui.lastInspectorUpdateTick, -1)), -1, Math.max(state.tick, 0));
      state.ui.lastChartUpdateTick = clamp(Math.round(safeNumber(state.ui.lastChartUpdateTick, -1)), -1, Math.max(state.tick, 0));
      state.ui.lastCanvasRenderTick = clamp(Math.round(safeNumber(state.ui.lastCanvasRenderTick, -1)), -1, Math.max(state.tick, 0));
      state.ui.lastHeavyInspectorTick = clamp(Math.round(safeNumber(state.ui.lastHeavyInspectorTick, -1)), -1, Math.max(state.tick, 0));
      if (!state.historicalScenario) state.historicalScenario = createInitialHistoricalScenario();
      state.historicalScenario.month = clamp(Math.round(safeNumber(state.historicalScenario.month, 0)), 0, 240);
      state.historicalScenario.phaseIndex = clamp(Math.round(safeNumber(state.historicalScenario.phaseIndex, 0)), 0, Math.max(0, (state.historicalScenario.phases || []).length));
      state.historicalScenario.phaseMonth = clamp(Math.round(safeNumber(state.historicalScenario.phaseMonth, 0)), 0, 120);
      state.historicalScenario.intensity = clamp(safeNumber(state.historicalScenario.intensity, 0), 0, 1);
      state.consumers.forEach((consumer) => {
        consumer.cash = clamp(safeNumber(consumer.cash, 0), 0, 1000000);
        consumer.income = clamp(safeNumber(consumer.income, 0), 0, 100000);
        consumer.debt = clamp(safeNumber(consumer.debt, 0), 0, 1000000);
        consumer.creditLimit = clamp(safeNumber(consumer.creditLimit, 180), 40, 900);
        consumer.stockHoldings = clamp(safeNumber(consumer.stockHoldings, 0), 0, 25000);
        consumer.homeValue = clamp(safeNumber(consumer.homeValue, consumer.housingWealth || 0), 0, 60000);
        consumer.housingWealth = clamp(safeNumber(consumer.housingWealth, 0), 0, 50000);
        consumer.mortgageDebt = clamp(safeNumber(consumer.mortgageDebt, 0), 0, Math.max(0, consumer.housingWealth) * 1.8 + consumer.creditLimit);
        consumer.assetWealth = clamp(safeNumber(consumer.stockHoldings, 0) + safeNumber(consumer.housingWealth, 0) - safeNumber(consumer.mortgageDebt, 0), -25000, 75000);
        consumer.wealthEffect = clamp(safeNumber(consumer.wealthEffect, 0), -0.10, 0.10);
        consumer.rentBurden = clamp(safeNumber(consumer.rentBurden, consumer.housingStatus === "renter" ? 0.16 : 0), 0, 0.6);
        consumer.mortgageBurden = clamp(safeNumber(consumer.mortgageBurden, 0), 0, 3);
        consumer.debtStress = clamp(safeNumber(consumer.debtStress, 0), 0, 5);
        consumer.stressMemory = clamp(safeNumber(consumer.stressMemory, consumer.debtStress), 0, 5);
        consumer.confidence = clamp(safeNumber(consumer.confidence, 0.8), 0.18, 1.35);
      });

      state.producers.forEach((producer) => {
        producer.cash = clamp(safeNumber(producer.cash, 0), 0, 3500000);
        producer.inventory = clamp(safeNumber(producer.inventory, 0), 0, 50000);
        producer.price = clamp(safeNumber(producer.price, 10), 2.2, 65);
        producer.wageOffered = clamp(safeNumber(producer.wageOffered, effectiveBaseWage()), 1, 80);
        producer.productionCapacity = clamp(safeNumber(producer.productionCapacity, 10), 2, 500);
        producer.productivity = clamp(safeNumber(producer.productivity, 1), 0.25, 6);
        producer.debt = clamp(safeNumber(producer.debt, 0), 0, 25000);
        producer.profitTrend = clamp(safeNumber(producer.profitTrend, 0), -1000, 1500);
        producer.debtStress = clamp(safeNumber(producer.debtStress, 0), 0, 1.5);
        producer.stressMemory = clamp(safeNumber(producer.stressMemory, producer.debtStress), 0, 1.5);
        producer.activityDrag = clamp(safeNumber(producer.activityDrag, 1), 0.30, 1.08);
        producer.hiringFreezeTicks = clamp(Math.round(safeNumber(producer.hiringFreezeTicks, 0)), 0, TICKS_PER_MONTH * 2);
        producer.firingCooldownTicks = clamp(Math.round(safeNumber(producer.firingCooldownTicks, 0)), 0, TICKS_PER_MONTH * 2);
        producer.excessInventoryMonths = clamp(Math.round(safeNumber(producer.excessInventoryMonths, 0)), 0, 12);
        producer.deepLossMonths = clamp(Math.round(safeNumber(producer.deepLossMonths, 0)), 0, 12);
        producer.positiveProfitTicks = clamp(Math.round(safeNumber(producer.positiveProfitTicks, 0)), 0, TICKS_PER_MONTH * 6);
        producer.expectedInflation = clamp(safeNumber(producer.expectedInflation, 0), -2, 5);
        producer.businessOutlook = clamp(safeNumber(producer.businessOutlook, 1), 0.25, 1.5);
        producer.inventoryBurden = clamp(safeNumber(producer.inventoryBurden, 1), 0, 5);
        producer.desiredProduction = clamp(safeNumber(producer.desiredProduction, producer.expectedDemand), 0, 1000);
        producer.expectedDemand = clamp(safeNumber(producer.expectedDemand, 5), 0.5, 1000);
        producer.dscr = clamp(safeNumber(producer.dscr, 99), 0, 99);
        producer.smoothedTargetEmployees = clamp(safeNumber(producer.smoothedTargetEmployees, producer.employees.length), 0, 40);
        producer.longRunPrice = clamp(safeNumber(producer.longRunPrice, producer.price), 2.2, 65);
        producer.lastPriceChange = clamp(safeNumber(producer.lastPriceChange, 0), -MAX_PRICE_CHANGE_PER_TICK, MAX_PRICE_CHANGE_PER_TICK);
        producer.priceInertia = clamp(safeNumber(producer.priceInertia, 0.08), 0.02, 0.18);
        producer.stockPrice = clamp(safeNumber(producer.stockPrice, 100), 8, 600);
        producer.previousStockPrice = clamp(safeNumber(producer.previousStockPrice, producer.stockPrice), 8, 600);
        producer.sharesOutstanding = clamp(safeNumber(producer.sharesOutstanding, 80), 10, 220);
        producer.marketCap = clamp(safeNumber(producer.marketCap, producer.stockPrice * producer.sharesOutstanding), 50, 150000);
        producer.initialMarketCap = clamp(safeNumber(producer.initialMarketCap, producer.marketCap), 50, 150000);
        producer.stockReturn = clamp(safeNumber(producer.stockReturn, 0), -0.04, 0.03);
        producer.valuationPressure = clamp(safeNumber(producer.valuationPressure, 0), 0, 1);
        producer.informationOpacity = clamp(safeNumber(producer.informationOpacity, 0.18), 0.05, 0.86);
        producer.equityFinancingCondition = clamp(safeNumber(producer.equityFinancingCondition, 1), 0.55, 1.16);
        producer.commercialPropertyValue = clamp(safeNumber(producer.commercialPropertyValue, 0), 0, 90000);
        producer.collateralValue = clamp(safeNumber(producer.collateralValue, producer.commercialPropertyValue), 0, 90000);
        producer.propertyDebt = clamp(safeNumber(producer.propertyDebt, 0), 0, 140000);
        producer.rentCost = clamp(safeNumber(producer.rentCost, 0), 0, 1500);
        producer.employees = unique(producer.employees.filter((id) => state.consumers[id] && state.consumers[id].employerId === producer.id));
      });

      if (!state.assetMarket) state.assetMarket = createInitialAssetMarket();
      state.assetMarket.stockIndex = clamp(safeNumber(state.assetMarket.stockIndex, 100), 35, 360);
      state.assetMarket.stockIndexPoints = clamp(safeNumber(state.assetMarket.stockIndexPoints, state.assetMarket.stockIndex * 25), 1200, 9000);
      state.assetMarket.previousStockIndexPoints = clamp(safeNumber(state.assetMarket.previousStockIndexPoints, state.assetMarket.stockIndexPoints), 1200, 9000);
      state.assetMarket.stockMonthlyReturn = clamp(safeNumber(state.assetMarket.stockMonthlyReturn, state.assetMarket.stockReturn * TICKS_PER_MONTH), -0.15, 0.10);
      state.assetMarket.stockValuationPressure = clamp(safeNumber(state.assetMarket.stockValuationPressure, 0), 0, 1);
      state.assetMarket.stockRiskSentiment = clamp(safeNumber(state.assetMarket.stockRiskSentiment, 0.65), 0, 1);
      state.assetMarket.fearGreedIndex = clamp(safeNumber(state.assetMarket.fearGreedIndex, 50), 0, 100);
      state.assetMarket.stockVolatilityIndex = clamp(safeNumber(state.assetMarket.stockVolatilityIndex, 18), 8, 70);
      state.assetMarket.expectedRiskPremium = clamp(safeNumber(state.assetMarket.expectedRiskPremium, 0.04), 0.015, 0.14);
      state.assetMarket.stockExpectation = clamp(safeNumber(state.assetMarket.stockExpectation, 0), -0.14, 0.16);
      state.assetMarket.stockDrawdownFromPeak = clamp(safeNumber(state.assetMarket.stockDrawdownFromPeak, 0), 0, 1);
      state.assetMarket.stockPeakPoints = clamp(safeNumber(state.assetMarket.stockPeakPoints, Math.max(2500, state.assetMarket.stockIndexPoints)), 1200, 12000);
      state.assetMarket.housingIndex = clamp(safeNumber(state.assetMarket.housingIndex, 100), 55, 285);
      state.assetMarket.stockReturn = clamp(safeNumber(state.assetMarket.stockReturn, 0), -STOCK_RETURN_LIMIT, STOCK_RETURN_LIMIT);
      state.assetMarket.housingReturn = clamp(safeNumber(state.assetMarket.housingReturn, 0), -HOUSING_RETURN_LIMIT, HOUSING_RETURN_LIMIT);
      state.assetMarket.wealthEffect = clamp(safeNumber(state.assetMarket.wealthEffect, 0), -0.10, 0.10);
      state.assetMarket.housingAffordability = clamp(safeNumber(state.assetMarket.housingAffordability, 1), 0.45, 3.2);
      state.assetMarket.assetBubbleRisk = clamp(safeNumber(state.assetMarket.assetBubbleRisk, 0), 0, 1);
      state.assetMarket.equityFinancingCondition = clamp(safeNumber(state.assetMarket.equityFinancingCondition, 1), 0.84, 1.08);
      if (!state.realEstate) state.realEstate = createInitialRealEstateMarket();
      state.realEstate.residentialIndex = clamp(safeNumber(state.realEstate.residentialIndex, 100), 55, 260);
      state.realEstate.commercialIndex = clamp(safeNumber(state.realEstate.commercialIndex, 100), 45, 240);
      state.realEstate.landIndex = clamp(safeNumber(state.realEstate.landIndex, 100), 55, 240);
      state.realEstate.rentIndex = clamp(safeNumber(state.realEstate.rentIndex, 100), 70, 190);
      state.realEstate.commercialVacancy = clamp(safeNumber(state.realEstate.commercialVacancy, 0.08), 0.03, 0.35);
      state.realEstate.collateralValueIndex = clamp(safeNumber(state.realEstate.collateralValueIndex, 100), 45, 260);
      state.realEstate.realEstateBubbleRisk = clamp(safeNumber(state.realEstate.realEstateBubbleRisk, 0), 0, 1);
      state.realEstate.realEstateStress = clamp(safeNumber(state.realEstate.realEstateStress, 0.10), 0, 1);
      if (!state.macroFinancial) state.macroFinancial = createInitialMacroFinancialTransmission(state.config);
      updateMacroFinancialTransmission();
      if (!state.sentiment) state.sentiment = createInitialSentimentState();
      state.sentiment.consumerConfidence = clamp(safeNumber(state.sentiment.consumerConfidence, 0.86), 0, 1.2);
      state.sentiment.businessConfidence = clamp(safeNumber(state.sentiment.businessConfidence, 0.88), 0, 1.2);
      state.sentiment.bankRiskAppetite = clamp(safeNumber(state.sentiment.bankRiskAppetite, 0.72), 0, 1.2);
      state.sentiment.marketRiskSentiment = clamp(safeNumber(state.sentiment.marketRiskSentiment, 0.74), 0, 1.2);
      state.sentiment.fiscalCredibility = clamp(safeNumber(state.sentiment.fiscalCredibility, 0.78), 0, 1.2);
      state.sentiment.inflationExpectations = clamp(safeNumber(state.sentiment.inflationExpectations, TARGET_INFLATION), -2, 8);
      state.sentiment.recessionFear = clamp(safeNumber(state.sentiment.recessionFear, 0.2), 0, 1);
      state.sentiment.policyUncertainty = clamp(safeNumber(state.sentiment.policyUncertainty, 0.12), 0, 1);
      if (!state.information) state.information = createInitialInformationSystem();
      state.information.publicInformationQuality = clamp(safeNumber(state.information.publicInformationQuality, 0.82), 0, 1);
      state.information.householdInformationAccuracy = clamp(safeNumber(state.information.householdInformationAccuracy, 0.70), 0, 1);
      state.information.firmInformationAccuracy = clamp(safeNumber(state.information.firmInformationAccuracy, 0.78), 0, 1);
      state.information.bankInformationAccuracy = clamp(safeNumber(state.information.bankInformationAccuracy, 0.86), 0, 1);
      state.information.marketInformationAccuracy = clamp(safeNumber(state.information.marketInformationAccuracy, 0.74), 0, 1);
      state.information.policyClarity = clamp(safeNumber(state.information.policyClarity, 0.78), 0, 1);
      state.information.rumorIntensity = clamp(safeNumber(state.information.rumorIntensity, 0), 0, 1);
      state.information.newsShockIntensity = clamp(safeNumber(state.information.newsShockIntensity, 0), 0, 1);
      state.information.misperceptionIndex = clamp(safeNumber(state.information.misperceptionIndex, 0.12), 0, 1);
      state.information.informationUncertainty = clamp(safeNumber(state.information.informationUncertainty, 0.16), 0, 1);
      if (!state.behavior) state.behavior = createInitialBehavioralState();
      state.behavior.realEstateNeverFallsBelief = clamp(safeNumber(state.behavior.realEstateNeverFallsBelief, 0.46), 0, 1);
      state.behavior.stockMarketNeverFailsBelief = clamp(safeNumber(state.behavior.stockMarketNeverFailsBelief, 0.46), 0, 1);
      state.behavior.herdIntensity = clamp(safeNumber(state.behavior.herdIntensity, 0.18), 0, 1);
      state.behavior.fomoIntensity = clamp(safeNumber(state.behavior.fomoIntensity, 0.12), 0, 1);
      state.behavior.lossAversion = clamp(safeNumber(state.behavior.lossAversion, 0.55), 0, 1);
      state.behavior.confirmationBias = clamp(safeNumber(state.behavior.confirmationBias, 0.35), 0, 1);
      state.behavior.panicSellingPressure = clamp(safeNumber(state.behavior.panicSellingPressure, 0.05), 0, 1);
      state.behavior.behavioralMispricingIndex = clamp(safeNumber(state.behavior.behavioralMispricingIndex, 0), 0, 1.5);
      if (!state.external) state.external = createInitialExternalSector();
      state.external.exchangeRateIndex = clamp(safeNumber(state.external.exchangeRateIndex, 100), 70, 160);
      state.external.exportDemand = clamp(safeNumber(state.external.exportDemand, 100), 60, 160);
      state.external.importPriceIndex = clamp(safeNumber(state.external.importPriceIndex, 100), 70, 190);
      state.external.commodityPriceIndex = clamp(safeNumber(state.external.commodityPriceIndex, 100), 65, 210);
      state.external.energyPriceIndex = clamp(safeNumber(state.external.energyPriceIndex, 100), 60, 230);
      state.external.tradeBalance = clamp(safeNumber(state.external.tradeBalance, 0), -1000000, 1000000);
      if (!state.externalActors) state.externalActors = createInitialExternalActors();
      const repairExternalActors = createInitialExternalActors();
      state.externalActors.foreignConsumers = state.externalActors.foreignConsumers || repairExternalActors.foreignConsumers;
      state.externalActors.foreignInvestors = state.externalActors.foreignInvestors || repairExternalActors.foreignInvestors;
      state.externalActors.foreignBondholders = state.externalActors.foreignBondholders || repairExternalActors.foreignBondholders;
      state.externalActors.foreignSuppliers = state.externalActors.foreignSuppliers || repairExternalActors.foreignSuppliers;
      state.externalActors.foreignConsumers.demandIndex = clamp(safeNumber(state.externalActors.foreignConsumers.demandIndex, 100), 55, 170);
      state.externalActors.foreignInvestors.sentiment = clamp(safeNumber(state.externalActors.foreignInvestors.sentiment, 0.72), 0.15, 1.10);
      state.externalActors.foreignBondholders.demand = clamp(safeNumber(state.externalActors.foreignBondholders.demand, 0.74), 0.18, 1.05);
      state.externalActors.foreignSuppliers.pressure = clamp(safeNumber(state.externalActors.foreignSuppliers.pressure, 0.18), 0, 1);
      if (!state.marketOutcome) state.marketOutcome = createInitialMarketOutcome();
      state.marketOutcome.marketEfficiency = clamp(safeNumber(state.marketOutcome.marketEfficiency, 0.62), 0, 1);
      state.marketOutcome.marketFailureRisk = clamp(safeNumber(state.marketOutcome.marketFailureRisk, 0.22), 0, 1);
      state.marketOutcome.marketSuccessScore = clamp(safeNumber(state.marketOutcome.marketSuccessScore, 0.50), 0, 1);
      state.marketOutcome.allocationQuality = clamp(safeNumber(state.marketOutcome.allocationQuality, 0.62), 0, 1);
      if (!state.policyCredibility) state.policyCredibility = createInitialPolicyCredibility();
      state.policyCredibility.centralBankCredibility = clamp(safeNumber(state.policyCredibility.centralBankCredibility, 0.78), 0, 1);
      state.policyCredibility.expectedRatePath = clamp(safeNumber(state.policyCredibility.expectedRatePath, NEUTRAL_INTEREST_RATE / 100), 0, 0.24);
      state.policyCredibility.forwardGuidanceClarity = clamp(safeNumber(state.policyCredibility.forwardGuidanceClarity, 0.76), 0, 1);
      state.policyCredibility.inflationTargetCredibility = clamp(safeNumber(state.policyCredibility.inflationTargetCredibility, 0.80), 0, 1);
      state.policyCredibility.policySurprise = clamp(safeNumber(state.policyCredibility.policySurprise, 0), 0, 1);
      state.policyCredibility.marketRateExpectation = clamp(safeNumber(state.policyCredibility.marketRateExpectation, NEUTRAL_INTEREST_RATE / 100), 0, 0.28);
      if (!state.perceived) state.perceived = createInitialPerceivedEconomy();
      state.perceived.unemployment = clamp(safeNumber(state.perceived.unemployment, TARGET_UNEMPLOYMENT), 0, 100);
      state.perceived.inflation = clamp(safeNumber(state.perceived.inflation, TARGET_INFLATION), -30, 40);
      state.perceived.recessionRisk = clamp(safeNumber(state.perceived.recessionRisk, 0.2), 0, 1);
      state.perceived.bankStress = clamp(safeNumber(state.perceived.bankStress, 0.12), 0, 1);
      state.perceived.jobSecurity = clamp(safeNumber(state.perceived.jobSecurity, 0.75), 0, 1);
      state.perceived.housingBurden = clamp(safeNumber(state.perceived.housingBurden, 0.35), 0, 1);
      state.perceived.financialStress = clamp(safeNumber(state.perceived.financialStress, 0.20), 0, 1);
      state.perceived.policyCredibility = clamp(safeNumber(state.perceived.policyCredibility, 0.78), 0, 1);
      if (!state.vulnerabilities) state.vulnerabilities = createInitialVulnerabilityState();
      Object.keys(createInitialVulnerabilityState()).forEach((key) => {
        if (typeof state.vulnerabilities[key] === "number") state.vulnerabilities[key] = clamp(safeNumber(state.vulnerabilities[key], 0.15), 0, 1);
      });
      if (!state.financialMarket) state.financialMarket = createInitialFinancialMarket(state.config);
      if (!state.rates) state.rates = createInitialRateStructure(state.config);
      state.rates.policyRate = clamp(safeNumber(state.rates.policyRate, state.config?.interestRate || NEUTRAL_INTEREST_RATE / 100), 0, 0.35);
      state.rates.effectivePolicyRate = clamp(safeNumber(state.rates.effectivePolicyRate, state.government?.interestRate || state.rates.policyRate), 0, 0.35);
      state.rates.shortTermRate = clamp(safeNumber(state.rates.shortTermRate, state.rates.effectivePolicyRate), 0, 0.35);
      state.rates.treasuryBill3M = clamp(safeNumber(state.rates.treasuryBill3M, state.rates.shortTermRate), 0, 0.22);
      state.rates.bondYield2Y = clamp(safeNumber(state.rates.bondYield2Y, state.rates.effectivePolicyRate), 0.002, 0.24);
      state.rates.bondYield5Y = clamp(safeNumber(state.rates.bondYield5Y, state.rates.bondYield2Y), 0.003, 0.24);
      state.rates.bondYield10Y = clamp(safeNumber(state.rates.bondYield10Y, state.rates.bondYield2Y), 0.004, 0.24);
      state.rates.bondYield30Y = clamp(safeNumber(state.rates.bondYield30Y, state.rates.bondYield10Y), 0.006, 0.26);
      state.rates.loanRate = clamp(safeNumber(state.rates.loanRate, state.rates.effectivePolicyRate + 0.02), 0.005, 0.28);
      state.rates.mortgageRate = clamp(safeNumber(state.rates.mortgageRate, state.rates.bondYield10Y + 0.022), 0.006, 0.30);
      state.rates.corporateLoanRate = clamp(safeNumber(state.rates.corporateLoanRate, state.rates.loanRate + 0.006), 0.006, 0.32);
      state.rates.depositRate = clamp(safeNumber(state.rates.depositRate, state.rates.effectivePolicyRate * 0.65), 0, 0.16);
      state.rates.realPolicyRate = clamp(safeNumber(state.rates.realPolicyRate, state.rates.effectivePolicyRate - TARGET_INFLATION / 100), -0.08, 0.18);
      state.rates.termSpread = clamp(safeNumber(state.rates.termSpread, state.rates.bondYield10Y - state.rates.shortTermRate), -0.10, 0.12);
      state.rates.rateUncertainty = clamp(safeNumber(state.rates.rateUncertainty, 0.08), 0, 1);
      state.rates.sovereignRiskPremium = clamp(safeNumber(state.rates.sovereignRiskPremium, 0.006), 0, 0.08);
      state.rates.termPremium = clamp(safeNumber(state.rates.termPremium, 0.010), 0.002, 0.060);
      state.rates.durationRiskPremium = clamp(safeNumber(state.rates.durationRiskPremium, 0.006), 0.001, 0.045);
      state.rates.bondMarketLiquidity = clamp(safeNumber(state.rates.bondMarketLiquidity, 0.86), 0.35, 1.05);
      state.financialMarket.bondYield = clamp(safeNumber(state.financialMarket.bondYield, state.government?.interestRate || 0.03), 0.004, 0.22);
      state.financialMarket.bondYield2Y = clamp(safeNumber(state.financialMarket.bondYield2Y, state.rates.bondYield2Y), 0.002, 0.24);
      state.financialMarket.bondYield5Y = clamp(safeNumber(state.financialMarket.bondYield5Y, state.rates.bondYield5Y), 0.003, 0.24);
      state.financialMarket.bondYield10Y = clamp(safeNumber(state.financialMarket.bondYield10Y, state.rates.bondYield10Y), 0.004, 0.24);
      state.financialMarket.bondYield30Y = clamp(safeNumber(state.financialMarket.bondYield30Y, state.rates.bondYield30Y), 0.006, 0.26);
      state.financialMarket.bondPriceIndex = clamp(safeNumber(state.financialMarket.bondPriceIndex, 100), 55, 145);
      state.financialMarket.shortBondPriceIndex = clamp(safeNumber(state.financialMarket.shortBondPriceIndex, 100), 70, 135);
      state.financialMarket.mediumBondPriceIndex = clamp(safeNumber(state.financialMarket.mediumBondPriceIndex, 100), 58, 145);
      state.financialMarket.longBondPriceIndex = clamp(safeNumber(state.financialMarket.longBondPriceIndex, 100), 42, 160);
      state.financialMarket.bondMarketStress = clamp(safeNumber(state.financialMarket.bondMarketStress, 0.10), 0, 1);
      state.financialMarket.flightToQualityDemand = clamp(safeNumber(state.financialMarket.flightToQualityDemand, 0.05), 0, 1);
      state.financialMarket.creditSpread = clamp(safeNumber(state.financialMarket.creditSpread, 0.02), 0.01, 0.12);
      state.financialMarket.bankHealthIndex = clamp(safeNumber(state.financialMarket.bankHealthIndex, 100), 0, 120);
      state.financialMarket.creditSupplyIndex = clamp(safeNumber(state.financialMarket.creditSupplyIndex, 100), 35, 112);
      state.financialMarket.depositorConfidence = clamp(safeNumber(state.financialMarket.depositorConfidence, 0.88), 0.18, 1.05);
      state.financialMarket.interbankTrust = clamp(safeNumber(state.financialMarket.interbankTrust, 0.84), 0.18, 1.05);
      state.financialMarket.bankFundingPressure = clamp(safeNumber(state.financialMarket.bankFundingPressure, 0.12), 0, 1);
      state.financialMarket.creditOfficerCaution = clamp(safeNumber(state.financialMarket.creditOfficerCaution, 0.28), 0, 1);
      state.financialMarket.bankCapitalConfidence = clamp(safeNumber(state.financialMarket.bankCapitalConfidence, 0.82), 0.15, 1.05);
      state.financialMarket.loanDemandIndex = clamp(safeNumber(state.financialMarket.loanDemandIndex, 100), 45, 122);
      state.financialMarket.riskUnderpricing = clamp(safeNumber(state.financialMarket.riskUnderpricing, 0.12), 0, 1);
      state.financialMarket.depositRate = clamp(safeNumber(state.financialMarket.depositRate, 0), 0, 0.14);
      state.financialMarket.loanRate = clamp(safeNumber(state.financialMarket.loanRate, state.government?.interestRate || 0.03), 0.005, 0.26);
      state.financialMarket.bankStress = clamp(safeNumber(state.financialMarket.bankStress, 0), 0, 1);
      state.financialMarket.nonPerformingLoanRatio = clamp(safeNumber(state.financialMarket.nonPerformingLoanRatio, 0.025), 0.005, 0.24);
      state.financialMarket.goldIndex = clamp(safeNumber(state.financialMarket.goldIndex, 100), 55, 220);
      state.financialMarket.silverIndex = clamp(safeNumber(state.financialMarket.silverIndex, 100), 40, 260);
      state.financialMarket.safeHavenDemand = clamp(safeNumber(state.financialMarket.safeHavenDemand, 0), 0, 1);
      state.financialMarket.riskAversion = clamp(safeNumber(state.financialMarket.riskAversion, 0.2), 0.05, 1);
      state.financialMarket.liquidityStress = clamp(safeNumber(state.financialMarket.liquidityStress, 0), 0, 1);
      if (!state.creditCycle) state.creditCycle = createInitialCreditCycle();
      state.creditCycle.creditGap = clamp(safeNumber(state.creditCycle.creditGap, 0), -1, 1);
      state.creditCycle.privateLeveragePressure = clamp(safeNumber(state.creditCycle.privateLeveragePressure, 0.18), 0, 1);
      state.creditCycle.underwritingQuality = clamp(safeNumber(state.creditCycle.underwritingQuality, 0.76), 0, 1);
      state.creditCycle.creditExcessRisk = clamp(safeNumber(state.creditCycle.creditExcessRisk, 0.12), 0, 1);
      state.creditCycle.creditCrunchRisk = clamp(safeNumber(state.creditCycle.creditCrunchRisk, 0.12), 0, 1);
      state.creditCycle.eventIntensity = clamp(safeNumber(state.creditCycle.eventIntensity, 0), 0, 1);
    }

    function repairSimulationState() {
      // 전역 안전 점검: NaN/Infinity가 한 번 생겨도 차트나 렌더링 루프가 멈추지 않도록 즉시 보정한다.
      if (!state.historicalScenario) state.historicalScenario = createInitialHistoricalScenario();
      if (!state.metrics) state.metrics = createEmptyMetrics();
      state.metrics.gdp = clamp(safeValue(state.metrics.gdp, 0), 0, 10000000);
      state.metrics.outputValue = clamp(safeValue(state.metrics.outputValue, 0), 0, 10000000);
      state.metrics.consumption = clamp(safeValue(state.metrics.consumption, 0), 0, 10000000);
      state.metrics.investment = clamp(safeValue(state.metrics.investment, 0), 0, 10000000);
      state.metrics.unemploymentRate = clamp(safeValue(state.metrics.unemploymentRate, TARGET_UNEMPLOYMENT), 0, 100);
      state.metrics.averagePrice = clamp(safeValue(state.metrics.averagePrice, 10), 1, 100);
      state.metrics.inflation = clamp(safeValue(state.metrics.inflation, 0), -30, 40);
      state.metrics.potentialOutput = clamp(safeValue(state.metrics.potentialOutput, state.metrics.gdp || 1), 1, 10000000);
      state.metrics.outputGap = clamp(safeValue(state.metrics.outputGap, 0), -100, 100);
      state.metrics.capacityUtilization = clamp(safeValue(state.metrics.capacityUtilization, 0), 0, 180);
      state.metrics.unemploymentGap = clamp(safeValue(state.metrics.unemploymentGap, 0), -100, 100);
      state.metrics.inflationGap = clamp(safeValue(state.metrics.inflationGap, 0), -100, 100);
      state.metrics.policyGap = clamp(safeValue(state.metrics.policyGap, 0), -100, 100);
      state.metrics.averageWage = clamp(safeValue(state.metrics.averageWage, effectiveBaseWage()), 1, 100);
      state.metrics.householdDebt = clamp(safeValue(state.metrics.householdDebt, 0), 0, 10000000);
      state.metrics.firmDebt = clamp(safeValue(state.metrics.firmDebt, 0), 0, 10000000);
      state.metrics.debtToGdpRatio = clamp(safeValue(state.metrics.debtToGdpRatio, 0), 0, 10000);
      state.metrics.fiscalSpaceScore = clamp(safeValue(state.metrics.fiscalSpaceScore, 1), 0, 1);
      state.metrics.averageHouseholdDebtBurden = clamp(safeValue(state.metrics.averageHouseholdDebtBurden, 0), 0, 500);
      state.metrics.averageFirmDSCR = clamp(safeValue(state.metrics.averageFirmDSCR, 99), 0, 99);
      state.metrics.stockIndex = clamp(safeValue(state.metrics.stockIndex, 100), 35, 360);
      state.metrics.stockIndexPoints = clamp(safeValue(state.metrics.stockIndexPoints, state.metrics.stockIndex * 25), 1200, 9000);
      state.metrics.stockMonthlyReturn = clamp(safeValue(state.metrics.stockMonthlyReturn, state.metrics.stockReturn * TICKS_PER_MONTH), -15, 10);
      state.metrics.stockVolatility = clamp(safeValue(state.metrics.stockVolatility, 1.5), 0, 30);
      state.metrics.stockValuationPressure = clamp(safeValue(state.metrics.stockValuationPressure, 0), 0, 1);
      state.metrics.stockRiskSentiment = clamp(safeValue(state.metrics.stockRiskSentiment, 0.65), 0, 1);
      state.metrics.fearGreedIndex = clamp(safeValue(state.metrics.fearGreedIndex, 50), 0, 100);
      state.metrics.stockVolatilityIndex = clamp(safeValue(state.metrics.stockVolatilityIndex, 18), 8, 70);
      state.metrics.stockDrawdown = clamp(safeValue(state.metrics.stockDrawdown, 0), 0, 100);
      state.metrics.rumorIntensity = clamp(safeValue(state.metrics.rumorIntensity, 0), 0, 1);
      state.metrics.informationUncertainty = clamp(safeValue(state.metrics.informationUncertainty, 0.16), 0, 1);
      state.metrics.misperceptionIndex = clamp(safeValue(state.metrics.misperceptionIndex, 0.12), 0, 1);
      state.metrics.policyClarity = clamp(safeValue(state.metrics.policyClarity, 0.78), 0, 1);
      state.metrics.incomeInequality = clamp(safeValue(state.metrics.incomeInequality, 0), 0, 1);
      state.metrics.wealthInequality = clamp(safeValue(state.metrics.wealthInequality, 0), 0, 1);
      state.metrics.lowIncomeConsumptionCapacity = clamp(safeValue(state.metrics.lowIncomeConsumptionCapacity, 1), 0, 4);
      state.metrics.middleClassHousingBurden = clamp(safeValue(state.metrics.middleClassHousingBurden, 0), 0, 100);
      state.metrics.socialStressIndex = clamp(safeValue(state.metrics.socialStressIndex, 0), 0, 1);
      state.metrics.lowIncomeStress = clamp(safeValue(state.metrics.lowIncomeStress, 0), 0, 1);
      state.metrics.middleClassMortgageStress = clamp(safeValue(state.metrics.middleClassMortgageStress, 0), 0, 1);
      state.metrics.highIncomeTaxStress = clamp(safeValue(state.metrics.highIncomeTaxStress, 0), 0, 1);
      state.metrics.wealthyAssetStress = clamp(safeValue(state.metrics.wealthyAssetStress, 0), 0, 1);
      state.metrics.renterStress = clamp(safeValue(state.metrics.renterStress, 0), 0, 100);
      state.metrics.homeownerDebtStress = clamp(safeValue(state.metrics.homeownerDebtStress, 0), 0, 100);
      state.metrics.classSentimentGap = clamp(safeValue(state.metrics.classSentimentGap, 0), 0, 1.2);
      state.metrics.exchangeRateIndex = clamp(safeValue(state.metrics.exchangeRateIndex, 100), 70, 160);
      state.metrics.importPriceIndex = clamp(safeValue(state.metrics.importPriceIndex, 100), 70, 190);
      state.metrics.commodityPriceIndex = clamp(safeValue(state.metrics.commodityPriceIndex, 100), 65, 210);
      state.metrics.energyPriceIndex = clamp(safeValue(state.metrics.energyPriceIndex, 100), 60, 230);
      state.metrics.centralBankCredibility = clamp(safeValue(state.metrics.centralBankCredibility, 0.78), 0, 1);
      state.metrics.forwardGuidanceClarity = clamp(safeValue(state.metrics.forwardGuidanceClarity, 0.76), 0, 1);
      state.metrics.inflationTargetCredibility = clamp(safeValue(state.metrics.inflationTargetCredibility, 0.80), 0, 1);
      state.metrics.averageCreditRatingScore = clamp(safeValue(state.metrics.averageCreditRatingScore, 3), 1, 4);
      state.metrics.distressedFirmRatio = clamp(safeValue(state.metrics.distressedFirmRatio, 0), 0, 100);
      state.metrics.zombieFirmRatio = clamp(safeValue(state.metrics.zombieFirmRatio, 0), 0, 100);
      state.metrics.averageDefaultRisk = clamp(safeValue(state.metrics.averageDefaultRisk, 0), 0, 100);
      state.metrics.expectationError = clamp(safeValue(state.metrics.expectationError, 0), 0, 1);
      state.metrics.realEstateNeverFallsBelief = clamp(safeValue(state.metrics.realEstateNeverFallsBelief, 0.46), 0, 1);
      state.metrics.stockMarketNeverFailsBelief = clamp(safeValue(state.metrics.stockMarketNeverFailsBelief, 0.46), 0, 1);
      state.metrics.herdIntensity = clamp(safeValue(state.metrics.herdIntensity, 0.18), 0, 1);
      state.metrics.fomoIntensity = clamp(safeValue(state.metrics.fomoIntensity, 0.12), 0, 1);
      state.metrics.lossAversion = clamp(safeValue(state.metrics.lossAversion, 0.55), 0, 1);
      state.metrics.confirmationBias = clamp(safeValue(state.metrics.confirmationBias, 0.35), 0, 1);
      state.metrics.panicSellingPressure = clamp(safeValue(state.metrics.panicSellingPressure, 0.05), 0, 1);
      state.metrics.behavioralMispricingIndex = clamp(safeValue(state.metrics.behavioralMispricingIndex, 0), 0, 1.5);
      state.metrics.housingMispricing = clamp(safeValue(state.metrics.housingMispricing, 0), -100, 200);
      state.metrics.stockMispricing = clamp(safeValue(state.metrics.stockMispricing, 0), -100, 220);
      state.metrics.housingIndex = clamp(safeValue(state.metrics.housingIndex, 100), 55, 285);
      state.metrics.residentialIndex = clamp(safeValue(state.metrics.residentialIndex, state.metrics.housingIndex), 55, 260);
      state.metrics.commercialIndex = clamp(safeValue(state.metrics.commercialIndex, 100), 45, 240);
      state.metrics.landIndex = clamp(safeValue(state.metrics.landIndex, 100), 55, 240);
      state.metrics.rentIndex = clamp(safeValue(state.metrics.rentIndex, 100), 70, 190);
      state.metrics.residentialReturn = clamp(safeValue(state.metrics.residentialReturn, state.metrics.housingReturn || 0), -8, 8);
      state.metrics.commercialReturn = clamp(safeValue(state.metrics.commercialReturn, 0), -8, 8);
      state.metrics.commercialVacancy = clamp(safeValue(state.metrics.commercialVacancy, 8), 3, 35);
      state.metrics.collateralValueIndex = clamp(safeValue(state.metrics.collateralValueIndex, 100), 45, 260);
      state.metrics.realEstateStress = clamp(safeValue(state.metrics.realEstateStress, 0.1), 0, 1);
      state.metrics.averageFirmStockPrice = clamp(safeValue(state.metrics.averageFirmStockPrice, 100), 8, 600);
      state.metrics.highestFirmStockPrice = clamp(safeValue(state.metrics.highestFirmStockPrice, 150), 8, 600);
      state.metrics.lowestFirmStockPrice = clamp(safeValue(state.metrics.lowestFirmStockPrice, 50), 8, 600);
      state.metrics.averageFirmStockReturn = clamp(safeValue(state.metrics.averageFirmStockReturn, 0), -40, 35);
      state.metrics.firmStockVolatility = clamp(safeValue(state.metrics.firmStockVolatility, 0), 0, 80);
      state.metrics.opaqueFirmRatio = clamp(safeValue(state.metrics.opaqueFirmRatio, 0), 0, 100);
      state.metrics.stockCrashFirmCount = clamp(safeValue(state.metrics.stockCrashFirmCount, 0), 0, state.producers ? state.producers.length : 999);
      state.metrics.stockReturn = clamp(safeValue(state.metrics.stockReturn, 0), -8, 8);
      state.metrics.housingReturn = clamp(safeValue(state.metrics.housingReturn, 0), -4, 4);
      state.metrics.wealthEffect = clamp(safeValue(state.metrics.wealthEffect, 0), -10, 10);
      state.metrics.housingAffordability = clamp(safeValue(state.metrics.housingAffordability, 1), 0.45, 3.2);
      state.metrics.averageMortgageBurden = clamp(safeValue(state.metrics.averageMortgageBurden, 0), 0, 300);
      state.metrics.negativeEquityRatio = clamp(safeValue(state.metrics.negativeEquityRatio, 0), 0, 100);
      state.metrics.assetBubbleRiskScore = clamp(safeValue(state.metrics.assetBubbleRiskScore, 0), 0, 1);
      state.metrics.aggregateDemandPressure = clamp(safeValue(state.metrics.aggregateDemandPressure, 1), 0.35, 2.4);
      state.metrics.aggregateSupplyPressure = clamp(safeValue(state.metrics.aggregateSupplyPressure, 1), 0.35, 2.4);
      state.metrics.bondYield = clamp(safeValue(state.metrics.bondYield, 0), 0, 30);
      state.metrics.bondPriceIndex = clamp(safeValue(state.metrics.bondPriceIndex, 100), 55, 145);
      state.metrics.creditSpread = clamp(safeValue(state.metrics.creditSpread, 2), 1, 12);
      state.metrics.bankHealthIndex = clamp(safeValue(state.metrics.bankHealthIndex, 100), 0, 120);
      state.metrics.creditSupplyIndex = clamp(safeValue(state.metrics.creditSupplyIndex, 100), 35, 112);
      state.metrics.depositRate = clamp(safeValue(state.metrics.depositRate, 0), 0, 14);
      state.metrics.loanRate = clamp(safeValue(state.metrics.loanRate, 0), 0, 26);
      state.metrics.nonPerformingLoanRatio = clamp(safeValue(state.metrics.nonPerformingLoanRatio, 0), 0, 24);
      state.metrics.goldIndex = clamp(safeValue(state.metrics.goldIndex, 100), 55, 220);
      state.metrics.silverIndex = clamp(safeValue(state.metrics.silverIndex, 100), 40, 260);
      state.metrics.safeHavenDemand = clamp(safeValue(state.metrics.safeHavenDemand, 0), 0, 100);
      state.metrics.bankingCrisisRiskScore = clamp(safeValue(state.metrics.bankingCrisisRiskScore, 0), 0, 1);
      state.metrics.valueAddedTaxCollected = clamp(safeValue(state.metrics.valueAddedTaxCollected, 0), 0, 10000000);
      state.metrics.householdTaxPressure = clamp(safeValue(state.metrics.householdTaxPressure, 0), 0, 1);
      state.metrics.consumptionTaxPain = clamp(safeValue(state.metrics.consumptionTaxPain, 0), 0, 1);
      state.metrics.corporateTaxPressure = clamp(safeValue(state.metrics.corporateTaxPressure, 0), 0, 1);
      state.metrics.taxPolicyCredibility = clamp(safeValue(state.metrics.taxPolicyCredibility, 0.75), 0, 1);
      state.metrics.taxSentimentScore = clamp(safeValue(state.metrics.taxSentimentScore, 0.25), 0, 1);
      state.metrics.buybackDividendSpending = clamp(safeValue(state.metrics.buybackDividendSpending, 0), 0, 10000000);
      state.metrics.debtRepaymentAllocation = clamp(safeValue(state.metrics.debtRepaymentAllocation, 0), 0, 10000000);
      state.metrics.retainedEarningsAllocation = clamp(safeValue(state.metrics.retainedEarningsAllocation, 0), 0, 10000000);
      state.metrics.investmentConversionRate = clamp(safeValue(state.metrics.investmentConversionRate, 0), 0, 1);
      state.metrics.buybackPayoutRatio = clamp(safeValue(state.metrics.buybackPayoutRatio, 0), 0, 1);
      state.metrics.sectorTotalProfit = clamp(safeValue(state.metrics.sectorTotalProfit, 0), -10000000, 10000000);
      state.metrics.sectorTotalInvestment = clamp(safeValue(state.metrics.sectorTotalInvestment, 0), 0, 10000000);
      state.metrics.marketEfficiency = clamp(safeValue(state.metrics.marketEfficiency, 0.62), 0, 1);
      state.metrics.marketFailureRisk = clamp(safeValue(state.metrics.marketFailureRisk, 0.22), 0, 1);
      state.metrics.marketSuccessScore = clamp(safeValue(state.metrics.marketSuccessScore, 0.50), 0, 1);
      state.metrics.allocationQuality = clamp(safeValue(state.metrics.allocationQuality, 0.62), 0, 1);
      state.metrics.agricultureStress = clamp(safeValue(state.metrics.agricultureStress, 0), 0, 1);
      state.metrics.energyStress = clamp(safeValue(state.metrics.energyStress, 0), 0, 1);
      state.metrics.foreignConsumerDemand = clamp(safeValue(state.metrics.foreignConsumerDemand, 100), 40, 190);
      state.metrics.foreignBondDemand = clamp(safeValue(state.metrics.foreignBondDemand, 0.74), 0, 1.1);
      state.metrics.foreignSupplierPressure = clamp(safeValue(state.metrics.foreignSupplierPressure, 0.18), 0, 1);
      state.metrics.foreignCapitalFlow = clamp(safeValue(state.metrics.foreignCapitalFlow, 0), -1000000, 1000000);

      if (state.government) {
        state.government.balance = clamp(safeValue(state.government.balance, 0), -10000000, 10000000);
        state.government.debt = clamp(safeValue(state.government.debt, 8500), 0, 10000000);
        state.government.householdIncomeTaxRate = clamp(safeValue(state.government.householdIncomeTaxRate, state.policy ? state.policy.taxEffective : 0.16), 0, 0.6);
        state.government.corporateTaxRate = clamp(safeValue(state.government.corporateTaxRate, state.policy ? state.policy.corporateTaxEffective : 0.18), 0, 0.6);
        state.government.valueAddedTaxRate = clamp(safeValue(state.government.valueAddedTaxRate, state.policy ? state.policy.vatEffective : 0.10), 0, 0.35);
        state.government.taxRate = state.government.householdIncomeTaxRate;
        state.government.interestRate = clamp(safeValue(state.government.interestRate, state.policy ? state.policy.interestEffective : 0.045), 0, 0.4);
        state.government.spending = clamp(safeValue(state.government.spending, state.policy ? state.policy.spendingEffective : 640), 0, 6000);
        state.government.effectiveSpending = clamp(safeValue(state.government.effectiveSpending, state.government.spending), 0, 6000);
        state.government.debtServiceTick = clamp(safeValue(state.government.debtServiceTick, 0), 0, 1000000);
        state.government.fiscalSpaceScore = clamp(safeValue(state.government.fiscalSpaceScore, 1), 0, 1);
      }

      state.consumers.forEach((consumer) => {
        consumer.cash = clamp(safeValue(consumer.cash, 0), 0, 1000000);
        consumer.income = clamp(safeValue(consumer.income, 0), 0, 100000);
        consumer.debt = clamp(safeValue(consumer.debt, 0), 0, 1000000);
        consumer.stockHoldings = clamp(safeValue(consumer.stockHoldings, 0), 0, 25000);
        consumer.housingWealth = clamp(safeValue(consumer.housingWealth, 0), 0, 50000);
        consumer.mortgageDebt = clamp(safeValue(consumer.mortgageDebt, 0), 0, Math.max(0, consumer.housingWealth) * 1.8 + consumer.creditLimit);
        consumer.assetWealth = clamp(safeValue(consumer.assetWealth, consumer.stockHoldings + consumer.housingWealth - consumer.mortgageDebt), -25000, 75000);
        consumer.confidence = clamp(safeValue(consumer.confidence, 0.8), 0.18, 1.35);
        consumer.debtStress = clamp(safeValue(consumer.debtStress, 0), 0, 5);
        consumer.debtBurden = clamp(safeValue(consumer.debtBurden, 0), 0, 5);
      });

      state.producers.forEach((producer) => {
        producer.cash = clamp(safeValue(producer.cash, 0), 0, 3500000);
        producer.debt = clamp(safeValue(producer.debt, 0), 0, 25000);
        producer.inventory = clamp(safeValue(producer.inventory, 0), 0, 50000);
        producer.price = clamp(safeValue(producer.price, 10), 2.2, 65);
        producer.wageOffered = clamp(safeValue(producer.wageOffered, effectiveBaseWage()), 1, 80);
        producer.productionCapacity = clamp(safeValue(producer.productionCapacity, 10), 2, 500);
        producer.productivity = clamp(safeValue(producer.productivity, 1), 0.25, 6);
        producer.expectedDemand = clamp(safeValue(producer.expectedDemand, 5), 0.5, 1000);
        producer.businessOutlook = clamp(safeValue(producer.businessOutlook, 1), 0.25, 1.5);
        producer.dscr = clamp(safeValue(producer.dscr, 99), 0, 99);
      });

      if (!state.assetMarket) state.assetMarket = createInitialAssetMarket();
      if (!state.externalActors) state.externalActors = createInitialExternalActors();
      const defaultExternalActors = createInitialExternalActors();
      state.externalActors.foreignConsumers = state.externalActors.foreignConsumers || defaultExternalActors.foreignConsumers;
      state.externalActors.foreignInvestors = state.externalActors.foreignInvestors || defaultExternalActors.foreignInvestors;
      state.externalActors.foreignBondholders = state.externalActors.foreignBondholders || defaultExternalActors.foreignBondholders;
      state.externalActors.foreignSuppliers = state.externalActors.foreignSuppliers || defaultExternalActors.foreignSuppliers;
      state.externalActors.foreignConsumers.demandIndex = clamp(safeValue(state.externalActors.foreignConsumers?.demandIndex, 100), 55, 170);
      state.externalActors.foreignConsumers.confidence = clamp(safeValue(state.externalActors.foreignConsumers?.confidence, 0.72), 0.25, 1.05);
      state.externalActors.foreignConsumers.exportPull = clamp(safeValue(state.externalActors.foreignConsumers?.exportPull, 1), 0.55, 1.70);
      state.externalActors.foreignInvestors.sentiment = clamp(safeValue(state.externalActors.foreignInvestors?.sentiment, 0.72), 0.15, 1.10);
      state.externalActors.foreignInvestors.capitalFlow = clamp(safeValue(state.externalActors.foreignInvestors?.capitalFlow, 0), -1000000, 1000000);
      state.externalActors.foreignBondholders.demand = clamp(safeValue(state.externalActors.foreignBondholders?.demand, 0.74), 0.18, 1.05);
      state.externalActors.foreignBondholders.fundingPressure = clamp(safeValue(state.externalActors.foreignBondholders?.fundingPressure, 0.12), 0, 1);
      state.externalActors.foreignSuppliers.pressure = clamp(safeValue(state.externalActors.foreignSuppliers?.pressure, 0.18), 0, 1);
      state.externalActors.foreignSuppliers.deliveryStress = clamp(safeValue(state.externalActors.foreignSuppliers?.deliveryStress, 0.12), 0, 1);
      if (!state.marketOutcome) state.marketOutcome = createInitialMarketOutcome();
      state.marketOutcome.marketEfficiency = clamp(safeValue(state.marketOutcome.marketEfficiency, 0.62), 0, 1);
      state.marketOutcome.marketFailureRisk = clamp(safeValue(state.marketOutcome.marketFailureRisk, 0.22), 0, 1);
      state.marketOutcome.marketSuccessScore = clamp(safeValue(state.marketOutcome.marketSuccessScore, 0.50), 0, 1);
      state.marketOutcome.allocationQuality = clamp(safeValue(state.marketOutcome.allocationQuality, 0.62), 0, 1);
      state.assetMarket.stockIndex = clamp(safeValue(state.assetMarket.stockIndex, 100), 35, 360);
      state.assetMarket.housingIndex = clamp(safeValue(state.assetMarket.housingIndex, 100), 55, 285);
      state.assetMarket.stockReturn = clamp(safeValue(state.assetMarket.stockReturn, 0), -STOCK_RETURN_LIMIT, STOCK_RETURN_LIMIT);
      state.assetMarket.housingReturn = clamp(safeValue(state.assetMarket.housingReturn, 0), -HOUSING_RETURN_LIMIT, HOUSING_RETURN_LIMIT);
      state.assetMarket.housingAffordability = clamp(safeValue(state.assetMarket.housingAffordability, 1), 0.45, 3.2);
      state.assetMarket.assetBubbleRisk = clamp(safeValue(state.assetMarket.assetBubbleRisk, 0), 0, 1);
      state.assetMarket.equityFinancingCondition = clamp(safeValue(state.assetMarket.equityFinancingCondition, 1), 0.84, 1.08);
      syncAssetMetrics();
      if (!state.financialMarket) state.financialMarket = createInitialFinancialMarket(state.config);
      if (!state.rates) state.rates = createInitialRateStructure(state.config);
      state.rates.policyRate = clamp(safeValue(state.rates.policyRate, state.config?.interestRate || NEUTRAL_INTEREST_RATE / 100), 0, 0.35);
      state.rates.effectivePolicyRate = clamp(safeValue(state.rates.effectivePolicyRate, state.government?.interestRate || state.rates.policyRate), 0, 0.35);
      state.rates.shortTermRate = clamp(safeValue(state.rates.shortTermRate, state.rates.effectivePolicyRate), 0, 0.35);
      state.rates.treasuryBill3M = clamp(safeValue(state.rates.treasuryBill3M, state.rates.shortTermRate), 0, 0.22);
      state.rates.bondYield2Y = clamp(safeValue(state.rates.bondYield2Y, state.rates.effectivePolicyRate), 0.002, 0.24);
      state.rates.bondYield5Y = clamp(safeValue(state.rates.bondYield5Y, state.rates.bondYield2Y), 0.003, 0.24);
      state.rates.bondYield10Y = clamp(safeValue(state.rates.bondYield10Y, state.rates.bondYield2Y), 0.004, 0.24);
      state.rates.bondYield30Y = clamp(safeValue(state.rates.bondYield30Y, state.rates.bondYield10Y), 0.006, 0.26);
      state.rates.loanRate = clamp(safeValue(state.rates.loanRate, state.rates.effectivePolicyRate + 0.02), 0.005, 0.28);
      state.rates.mortgageRate = clamp(safeValue(state.rates.mortgageRate, state.rates.bondYield10Y + 0.022), 0.006, 0.30);
      state.rates.corporateLoanRate = clamp(safeValue(state.rates.corporateLoanRate, state.rates.loanRate + 0.006), 0.006, 0.32);
      state.rates.depositRate = clamp(safeValue(state.rates.depositRate, state.rates.effectivePolicyRate * 0.65), 0, 0.16);
      state.rates.realPolicyRate = clamp(safeValue(state.rates.realPolicyRate, state.rates.effectivePolicyRate - TARGET_INFLATION / 100), -0.08, 0.18);
      state.rates.termSpread = clamp(safeValue(state.rates.termSpread, state.rates.bondYield10Y - state.rates.shortTermRate), -0.10, 0.12);
      state.rates.rateUncertainty = clamp(safeValue(state.rates.rateUncertainty, 0.08), 0, 1);
      state.rates.sovereignRiskPremium = clamp(safeValue(state.rates.sovereignRiskPremium, 0.006), 0, 0.08);
      state.rates.termPremium = clamp(safeValue(state.rates.termPremium, 0.010), 0.002, 0.060);
      state.rates.durationRiskPremium = clamp(safeValue(state.rates.durationRiskPremium, 0.006), 0.001, 0.045);
      state.rates.bondMarketLiquidity = clamp(safeValue(state.rates.bondMarketLiquidity, 0.86), 0.35, 1.05);
      state.financialMarket.bondYield = clamp(safeValue(state.financialMarket.bondYield, state.government?.interestRate || 0.03), 0.004, 0.22);
      state.financialMarket.bondYield2Y = clamp(safeValue(state.financialMarket.bondYield2Y, state.rates.bondYield2Y), 0.002, 0.24);
      state.financialMarket.bondYield5Y = clamp(safeValue(state.financialMarket.bondYield5Y, state.rates.bondYield5Y), 0.003, 0.24);
      state.financialMarket.bondYield10Y = clamp(safeValue(state.financialMarket.bondYield10Y, state.rates.bondYield10Y), 0.004, 0.24);
      state.financialMarket.bondYield30Y = clamp(safeValue(state.financialMarket.bondYield30Y, state.rates.bondYield30Y), 0.006, 0.26);
      state.financialMarket.bondPriceIndex = clamp(safeValue(state.financialMarket.bondPriceIndex, 100), 55, 145);
      state.financialMarket.shortBondPriceIndex = clamp(safeValue(state.financialMarket.shortBondPriceIndex, 100), 70, 135);
      state.financialMarket.mediumBondPriceIndex = clamp(safeValue(state.financialMarket.mediumBondPriceIndex, 100), 58, 145);
      state.financialMarket.longBondPriceIndex = clamp(safeValue(state.financialMarket.longBondPriceIndex, 100), 42, 160);
      state.financialMarket.bondMarketStress = clamp(safeValue(state.financialMarket.bondMarketStress, 0.10), 0, 1);
      state.financialMarket.flightToQualityDemand = clamp(safeValue(state.financialMarket.flightToQualityDemand, 0.05), 0, 1);
      state.financialMarket.creditSpread = clamp(safeValue(state.financialMarket.creditSpread, 0.02), 0.01, 0.12);
      state.financialMarket.bankHealthIndex = clamp(safeValue(state.financialMarket.bankHealthIndex, 100), 0, 120);
      state.financialMarket.creditSupplyIndex = clamp(safeValue(state.financialMarket.creditSupplyIndex, 100), 35, 112);
      state.financialMarket.depositorConfidence = clamp(safeValue(state.financialMarket.depositorConfidence, 0.88), 0.18, 1.05);
      state.financialMarket.interbankTrust = clamp(safeValue(state.financialMarket.interbankTrust, 0.84), 0.18, 1.05);
      state.financialMarket.bankFundingPressure = clamp(safeValue(state.financialMarket.bankFundingPressure, 0.12), 0, 1);
      state.financialMarket.creditOfficerCaution = clamp(safeValue(state.financialMarket.creditOfficerCaution, 0.28), 0, 1);
      state.financialMarket.bankCapitalConfidence = clamp(safeValue(state.financialMarket.bankCapitalConfidence, 0.82), 0.15, 1.05);
      state.financialMarket.loanDemandIndex = clamp(safeValue(state.financialMarket.loanDemandIndex, 100), 45, 122);
      state.financialMarket.riskUnderpricing = clamp(safeValue(state.financialMarket.riskUnderpricing, 0.12), 0, 1);
      state.financialMarket.depositRate = clamp(safeValue(state.financialMarket.depositRate, 0), 0, 0.14);
      state.financialMarket.loanRate = clamp(safeValue(state.financialMarket.loanRate, state.government?.interestRate || 0.03), 0.005, 0.26);
      state.financialMarket.bankStress = clamp(safeValue(state.financialMarket.bankStress, 0), 0, 1);
      state.financialMarket.nonPerformingLoanRatio = clamp(safeValue(state.financialMarket.nonPerformingLoanRatio, 0.025), 0.005, 0.24);
      state.financialMarket.goldIndex = clamp(safeValue(state.financialMarket.goldIndex, 100), 55, 220);
      state.financialMarket.silverIndex = clamp(safeValue(state.financialMarket.silverIndex, 100), 40, 260);
      state.financialMarket.safeHavenDemand = clamp(safeValue(state.financialMarket.safeHavenDemand, 0), 0, 1);
      state.financialMarket.bankingCrisisRisk = clamp(safeValue(state.financialMarket.bankingCrisisRisk, 0), 0, 1);
      if (!state.creditCycle) state.creditCycle = createInitialCreditCycle();
      state.creditCycle.creditGap = clamp(safeValue(state.creditCycle.creditGap, 0), -1, 1);
      state.creditCycle.privateLeveragePressure = clamp(safeValue(state.creditCycle.privateLeveragePressure, 0.18), 0, 1);
      state.creditCycle.underwritingQuality = clamp(safeValue(state.creditCycle.underwritingQuality, 0.76), 0, 1);
      state.creditCycle.creditExcessRisk = clamp(safeValue(state.creditCycle.creditExcessRisk, 0.12), 0, 1);
      state.creditCycle.creditCrunchRisk = clamp(safeValue(state.creditCycle.creditCrunchRisk, 0.12), 0, 1);
      state.creditCycle.eventIntensity = clamp(safeValue(state.creditCycle.eventIntensity, 0), 0, 1);
      syncFinancialMarketMetrics();
      syncCreditCycleMetrics();
      updateMacroFinancialTransmission();
      if (!state.sentiment) state.sentiment = createInitialSentimentState();
      state.sentiment.consumerConfidence = clamp(safeValue(state.sentiment.consumerConfidence, 0.86), 0, 1.2);
      state.sentiment.businessConfidence = clamp(safeValue(state.sentiment.businessConfidence, 0.88), 0, 1.2);
      state.sentiment.bankRiskAppetite = clamp(safeValue(state.sentiment.bankRiskAppetite, 0.72), 0, 1.2);
      state.sentiment.marketRiskSentiment = clamp(safeValue(state.sentiment.marketRiskSentiment, 0.74), 0, 1.2);
      state.sentiment.fiscalCredibility = clamp(safeValue(state.sentiment.fiscalCredibility, 0.78), 0, 1.2);
      state.sentiment.inflationExpectations = clamp(safeValue(state.sentiment.inflationExpectations, TARGET_INFLATION), -2, 8);
      state.sentiment.recessionFear = clamp(safeValue(state.sentiment.recessionFear, 0.2), 0, 1);
      state.sentiment.policyUncertainty = clamp(safeValue(state.sentiment.policyUncertainty, 0.12), 0, 1);
      syncSentimentMetrics();

      state.flows = state.flows
        .filter((flow) => Number.isFinite(flow.amount) && Number.isFinite(flow.born) && Number.isFinite(flow.life))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, MAX_FLOWS);
      if (state.history.length > MAX_HISTORY) state.history.splice(0, state.history.length - MAX_HISTORY);
      if (state.events.length > 20) state.events = state.events.slice(0, 20);
    }

    function appendHistory() {
      state.history.push({
        tick: state.tick,
        gdp: state.metrics.gdp,
        outputValue: state.metrics.outputValue,
        consumption: state.metrics.consumption,
        investment: state.metrics.investment,
        unemploymentRate: state.metrics.unemploymentRate,
        averagePrice: state.metrics.averagePrice,
        inflation: state.metrics.inflation,
        governmentBalance: state.metrics.governmentBalance,
        taxCollected: state.metrics.taxCollected,
        householdIncomeTaxCollected: state.metrics.householdIncomeTaxCollected,
        corporateTaxCollected: state.metrics.corporateTaxCollected,
        valueAddedTaxCollected: state.metrics.valueAddedTaxCollected,
        householdTaxPressure: state.metrics.householdTaxPressure,
        consumptionTaxPain: state.metrics.consumptionTaxPain,
        corporateTaxPressure: state.metrics.corporateTaxPressure,
        taxPolicyCredibility: state.metrics.taxPolicyCredibility,
        taxSentimentScore: state.metrics.taxSentimentScore,
        buybackDividendSpending: state.metrics.buybackDividendSpending,
        debtRepaymentAllocation: state.metrics.debtRepaymentAllocation,
        retainedEarningsAllocation: state.metrics.retainedEarningsAllocation,
        investmentConversionRate: state.metrics.investmentConversionRate,
        buybackPayoutRatio: state.metrics.buybackPayoutRatio,
        sectorTotalProfit: state.metrics.sectorTotalProfit,
        sectorTotalInvestment: state.metrics.sectorTotalInvestment,
        marketEfficiency: state.metrics.marketEfficiency,
        marketFailureRisk: state.metrics.marketFailureRisk,
        marketSuccessScore: state.metrics.marketSuccessScore,
        allocationQuality: state.metrics.allocationQuality,
        marketFailureType: state.metrics.marketFailureType,
        marketSuccessType: state.metrics.marketSuccessType,
        historicalScenarioActive: state.metrics.historicalScenarioActive,
        historicalScenarioIntensity: state.metrics.historicalScenarioIntensity,
        historicalScenarioKey: state.metrics.historicalScenarioKey,
        historicalScenarioLabel: state.metrics.historicalScenarioLabel,
        historicalScenarioPhase: state.metrics.historicalScenarioPhase,
        historicalScenarioShock: state.metrics.historicalScenarioShock,
        spendingActual: state.metrics.governmentSpendingActual,
        governmentDebtService: state.metrics.governmentDebtService,
        debtToGdpRatio: state.metrics.debtToGdpRatio,
        fiscalSpaceScore: state.metrics.fiscalSpaceScore,
        governmentGDPSpending: state.metrics.governmentGDPSpending,
        interestRatePercent: state.metrics.interestRatePercent,
        shortTermRate: state.metrics.shortTermRate,
        treasuryBill3M: state.metrics.treasuryBill3M,
        bondYield2Y: state.metrics.bondYield2Y,
        bondYield5Y: state.metrics.bondYield5Y,
        bondYield10Y: state.metrics.bondYield10Y,
        bondYield30Y: state.metrics.bondYield30Y,
        mortgageRate: state.metrics.mortgageRate,
        corporateLoanRate: state.metrics.corporateLoanRate,
        realPolicyRate: state.metrics.realPolicyRate,
        realLoanRate: state.metrics.realLoanRate,
        termSpread: state.metrics.termSpread,
        sovereignRiskPremium: state.metrics.sovereignRiskPremium,
        termPremium: state.metrics.termPremium,
        durationRiskPremium: state.metrics.durationRiskPremium,
        bondMarketLiquidity: state.metrics.bondMarketLiquidity,
        rateUncertainty: state.metrics.rateUncertainty,
        policySurpriseRate: state.metrics.policySurpriseRate,
        bankNetInterestMargin: state.metrics.bankNetInterestMargin,
        governmentAverageFundingRate: state.metrics.governmentAverageFundingRate,
        averageWage: state.metrics.averageWage,
        wageGrowth: state.metrics.wageGrowth,
        averageFirmProfit: state.metrics.averageFirmProfit,
        householdDebt: state.metrics.householdDebt,
        firmDebt: state.metrics.firmDebt,
        averageHouseholdDebtBurden: state.metrics.averageHouseholdDebtBurden,
        debtServiceBurden: state.metrics.debtServiceBurden,
        averageFirmDSCR: state.metrics.averageFirmDSCR,
        debtStressedHouseholdRatio: state.metrics.debtStressedHouseholdRatio,
        debtStressedFirmRatio: state.metrics.debtStressedFirmRatio,
        salesPressure: state.metrics.salesPressure,
        inventoryToDemand: state.metrics.inventoryToDemand,
        potentialOutput: state.metrics.potentialOutput,
        outputGap: state.metrics.outputGap,
        capacityUtilization: state.metrics.capacityUtilization,
        unemploymentGap: state.metrics.unemploymentGap,
        inflationGap: state.metrics.inflationGap,
        policyGap: state.metrics.policyGap,
        financialConditionIndex: state.metrics.financialConditionIndex,
        stockIndex: state.metrics.stockIndex,
        stockIndexPoints: state.metrics.stockIndexPoints,
        housingIndex: state.metrics.housingIndex,
        stockReturn: state.metrics.stockReturn,
        stockMonthlyReturn: state.metrics.stockMonthlyReturn,
        stockVolatility: state.metrics.stockVolatility,
        stockValuationPressure: state.metrics.stockValuationPressure,
        stockRiskSentiment: state.metrics.stockRiskSentiment,
        stockDrawdown: state.metrics.stockDrawdown,
        residentialIndex: state.metrics.residentialIndex,
        commercialIndex: state.metrics.commercialIndex,
        landIndex: state.metrics.landIndex,
        rentIndex: state.metrics.rentIndex,
        residentialReturn: state.metrics.residentialReturn,
        commercialReturn: state.metrics.commercialReturn,
        commercialVacancy: state.metrics.commercialVacancy,
        realEstateBubbleRisk: state.metrics.realEstateBubbleRisk,
        realEstateStress: state.metrics.realEstateStress,
        collateralValueIndex: state.metrics.collateralValueIndex,
        averageFirmStockPrice: state.metrics.averageFirmStockPrice,
        highestFirmStockPrice: state.metrics.highestFirmStockPrice,
        lowestFirmStockPrice: state.metrics.lowestFirmStockPrice,
        averageFirmStockReturn: state.metrics.averageFirmStockReturn,
        firmStockVolatility: state.metrics.firmStockVolatility,
        opaqueFirmRatio: state.metrics.opaqueFirmRatio,
        stockCrashFirmCount: state.metrics.stockCrashFirmCount,
        averageFirmValuationPressure: state.metrics.averageFirmValuationPressure,
        housingReturn: state.metrics.housingReturn,
        wealthEffect: state.metrics.wealthEffect,
        housingAffordability: state.metrics.housingAffordability,
        averageMortgageBurden: state.metrics.averageMortgageBurden,
        negativeEquityRatio: state.metrics.negativeEquityRatio,
        assetBubbleRiskScore: state.metrics.assetBubbleRiskScore,
        bondYield: state.metrics.bondYield,
        bondPriceIndex: state.metrics.bondPriceIndex,
        shortBondPriceIndex: state.metrics.shortBondPriceIndex,
        mediumBondPriceIndex: state.metrics.mediumBondPriceIndex,
        longBondPriceIndex: state.metrics.longBondPriceIndex,
        bondMarketStress: state.metrics.bondMarketStress,
        flightToQualityDemand: state.metrics.flightToQualityDemand,
        creditSpread: state.metrics.creditSpread,
        bankHealthIndex: state.metrics.bankHealthIndex,
        creditSupplyIndex: state.metrics.creditSupplyIndex,
        depositorConfidence: state.metrics.depositorConfidence,
        interbankTrust: state.metrics.interbankTrust,
        bankFundingPressure: state.metrics.bankFundingPressure,
        creditOfficerCaution: state.metrics.creditOfficerCaution,
        bankCapitalConfidence: state.metrics.bankCapitalConfidence,
        loanDemandIndex: state.metrics.loanDemandIndex,
        riskUnderpricing: state.metrics.riskUnderpricing,
        creditCyclePhase: state.metrics.creditCyclePhase,
        creditGap: state.metrics.creditGap,
        privateLeveragePressure: state.metrics.privateLeveragePressure,
        underwritingQuality: state.metrics.underwritingQuality,
        creditExcessRisk: state.metrics.creditExcessRisk,
        creditCrunchRisk: state.metrics.creditCrunchRisk,
        creditEventIntensity: safeNumber(state.creditCycle?.eventIntensity, 0),
        depositRate: state.metrics.depositRate,
        loanRate: state.metrics.loanRate,
        bankStress: state.metrics.bankStress,
        nonPerformingLoanRatio: state.metrics.nonPerformingLoanRatio,
        goldIndex: state.metrics.goldIndex,
        silverIndex: state.metrics.silverIndex,
        safeHavenDemand: state.metrics.safeHavenDemand,
        bankingCrisisRiskScore: state.metrics.bankingCrisisRiskScore,
        realWageGrowth: state.metrics.realWageGrowth,
        averageConfidence: state.metrics.averageConfidence,
        averageBusinessOutlook: state.metrics.averageBusinessOutlook
        ,
        consumerSentiment: state.metrics.consumerSentiment,
        businessSentiment: state.metrics.businessSentiment,
        bankRiskAppetite: state.metrics.bankRiskAppetite,
        marketRiskSentiment: state.metrics.marketRiskSentiment,
        fearGreedIndex: state.metrics.fearGreedIndex,
        stockVolatilityIndex: state.metrics.stockVolatilityIndex,
        rumorIntensity: state.metrics.rumorIntensity,
        informationUncertainty: state.metrics.informationUncertainty,
        misperceptionIndex: state.metrics.misperceptionIndex,
        policyClarity: state.metrics.policyClarity,
        expectationError: state.metrics.expectationError,
        marketOverreaction: state.metrics.marketOverreaction,
        realEstateNeverFallsBelief: state.metrics.realEstateNeverFallsBelief,
        stockMarketNeverFailsBelief: state.metrics.stockMarketNeverFailsBelief,
        herdIntensity: state.metrics.herdIntensity,
        fomoIntensity: state.metrics.fomoIntensity,
        lossAversion: state.metrics.lossAversion,
        confirmationBias: state.metrics.confirmationBias,
        panicSellingPressure: state.metrics.panicSellingPressure,
        behavioralMispricingIndex: state.metrics.behavioralMispricingIndex,
        housingMispricing: state.metrics.housingMispricing,
        stockMispricing: state.metrics.stockMispricing,
        beliefBreakRisk: state.metrics.beliefBreakRisk,
        beliefBreakdownMonths: state.metrics.beliefBreakdownMonths,
        sentimentInflationExpectations: state.metrics.sentimentInflationExpectations,
        recessionFear: state.metrics.recessionFear,
        fiscalCredibility: state.metrics.fiscalCredibility,
        policyUncertainty: state.metrics.policyUncertainty,
        safeHavenSentiment: state.metrics.safeHavenSentiment,
        assetBubblePsychology: state.metrics.assetBubblePsychology
        ,
        incomeInequality: state.metrics.incomeInequality,
        wealthInequality: state.metrics.wealthInequality,
        lowIncomeConsumptionCapacity: state.metrics.lowIncomeConsumptionCapacity,
        middleClassHousingBurden: state.metrics.middleClassHousingBurden,
        highIncomeWealthEffect: state.metrics.highIncomeWealthEffect,
        wealthyAssetEffect: state.metrics.wealthyAssetEffect,
        socialStressIndex: state.metrics.socialStressIndex,
        lowIncomeStress: state.metrics.lowIncomeStress,
        middleClassMortgageStress: state.metrics.middleClassMortgageStress,
        highIncomeTaxStress: state.metrics.highIncomeTaxStress,
        wealthyAssetStress: state.metrics.wealthyAssetStress,
        renterStress: state.metrics.renterStress,
        homeownerDebtStress: state.metrics.homeownerDebtStress,
        classSentimentGap: state.metrics.classSentimentGap,
        mainPressureClass: state.metrics.mainPressureClass,
        householdVulnerability: state.metrics.householdVulnerability,
        firmVulnerability: state.metrics.firmVulnerability,
        bankVulnerability: state.metrics.bankVulnerability,
        housingVulnerability: state.metrics.housingVulnerability,
        stockVulnerability: state.metrics.stockVulnerability,
        fiscalVulnerability: state.metrics.fiscalVulnerability,
        externalVulnerability: state.metrics.externalVulnerability,
        hiddenVulnerabilityIndex: state.metrics.hiddenVulnerabilityIndex,
        dominantVulnerability: state.metrics.dominantVulnerability,
        agricultureStress: state.metrics.agricultureStress,
        energyStress: state.metrics.energyStress,
        exchangeRateIndex: state.metrics.exchangeRateIndex,
        exportDemand: state.metrics.exportDemand,
        importPriceIndex: state.metrics.importPriceIndex,
        commodityPriceIndex: state.metrics.commodityPriceIndex,
        energyPriceIndex: state.metrics.energyPriceIndex,
        tradeBalance: state.metrics.tradeBalance,
        foreignConsumerDemand: state.metrics.foreignConsumerDemand,
        foreignInvestorSentiment: state.metrics.foreignInvestorSentiment,
        foreignBondDemand: state.metrics.foreignBondDemand,
        foreignSupplierPressure: state.metrics.foreignSupplierPressure,
        foreignCapitalFlow: state.metrics.foreignCapitalFlow,
        exportConsumerDemand: state.metrics.exportConsumerDemand,
        importInflationPressure: state.metrics.importInflationPressure,
        commodityCostPressure: state.metrics.commodityCostPressure,
        centralBankCredibility: state.metrics.centralBankCredibility,
        expectedRatePath: state.metrics.expectedRatePath,
        forwardGuidanceClarity: state.metrics.forwardGuidanceClarity,
        inflationTargetCredibility: state.metrics.inflationTargetCredibility,
        policySurprise: state.metrics.policySurprise,
        marketRateExpectation: state.metrics.marketRateExpectation,
        averageCreditRatingScore: state.metrics.averageCreditRatingScore,
        distressedFirmRatio: state.metrics.distressedFirmRatio,
        zombieFirmRatio: state.metrics.zombieFirmRatio,
        averageDefaultRisk: state.metrics.averageDefaultRisk,
        mostStressedSector: state.metrics.mostStressedSector,
        manufacturingStress: safeNumber(state.metrics.sectorStress?.manufacturing?.stress, 0),
        servicesStress: safeNumber(state.metrics.sectorStress?.services?.stress, 0),
        constructionStress: safeNumber(state.metrics.sectorStress?.construction?.stress, 0),
        financialSectorStress: safeNumber(state.metrics.sectorStress?.financial?.stress, 0),
        technologyStress: safeNumber(state.metrics.sectorStress?.technology?.stress, 0),
        staplesStress: safeNumber(state.metrics.sectorStress?.staples?.stress, 0)
      });

      if (state.history.length > MAX_HISTORY) {
        state.history.splice(0, state.history.length - MAX_HISTORY);
      }
    }

    // ===== 차트 =====
    // Chart.js는 CDN으로 불러오며, 최근 MAX_HISTORY개의 틱만 유지한다.
    function setupCharts() {
      if (!window.Chart) {
        if (!state.ui) state.ui = createInitialUiState();
        state.ui.chartsAvailable = false;
        state.charts = {};
        showChartFallback("Chart.js를 불러오지 못해 차트가 비활성화되었습니다.");
        pushEvent("Chart.js를 불러오지 못해 차트 없이 시뮬레이션을 실행합니다.");
        return;
      }
      state.ui.chartsAvailable = true;
      registerEventMarkerPlugin();
      const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 180, easing: "easeOutQuart" },
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            labels: {
              color: "#16302e",
              boxWidth: 10,
              usePointStyle: true,
              font: { size: 11, weight: "700" }
            }
          },
          tooltip: {
            backgroundColor: "rgba(22, 48, 46, 0.92)",
            padding: 10,
            displayColors: true,
            callbacks: {
              label(context) {
                const label = context.dataset.label || "";
                const value = Number(context.parsed.y || 0);
                const isPercent = label.includes("%") || label.includes("금리") || label.includes("실업") || label.includes("물가");
                const formatted = label.includes("(pt)") ? formatIndexPoint(value) : isPercent ? `${value.toFixed(2)}%` : compactMoney(value);
                return `${label}: ${formatted}`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: "#63706b", maxTicksLimit: 8 },
            grid: { color: "rgba(22, 48, 46, 0.045)" }
          },
          y: {
            ticks: { color: "#63706b" },
            grid: { color: "rgba(22, 48, 46, 0.065)" },
            beginAtZero: true
          },
          y1: {
            position: "right",
            ticks: { color: "#c8483f" },
            grid: { drawOnChartArea: false },
            beginAtZero: true
          }
        }
      };

      state.charts.gdp = new Chart(document.getElementById("gdpChart"), {
        type: "line",
        data: {
          labels: [],
          datasets: [
            makeDataset("GDP형 지출", "#247173"),
            makeDataset("생산가치", "#d88931"),
            makeDataset("정부지출(G)", "#6bb58e")
          ]
        },
        options: cloneOptions(baseOptions, "GDP와 생산")
      });

      state.charts.demand = new Chart(document.getElementById("demandChart"), {
        type: "line",
        data: {
          labels: [],
          datasets: [
            makeDataset("소비", "#407ca8"),
            makeDataset("투자", "#c85f32"),
            makeDataset("정책 금리 %", "#c8483f", "y1", [6, 4])
          ]
        },
        options: cloneOptions(baseOptions, "소비와 투자")
      });

      state.charts.unemployment = new Chart(document.getElementById("unemploymentChart"), {
        type: "line",
        data: {
          labels: [],
          datasets: [
            makeDataset("실업률 %", "#c8483f"),
            makeDataset("정책 금리 %", "#247173", "y1", [6, 4])
          ]
        },
        options: cloneOptions(baseOptions, "실업률")
      });

      state.charts.price = new Chart(document.getElementById("priceChart"), {
        type: "line",
        data: {
          labels: [],
          datasets: [
            makeDataset("평균 가격", "#247173"),
            makeDataset("물가상승률 %", "#d88931"),
            makeDataset("평균 임금", "#407ca8"),
            makeDataset("임금상승률 %", "#c8483f", "y1", [4, 3])
          ]
        },
        options: cloneOptions(baseOptions, "가격과 물가")
      });

      state.charts.government = new Chart(document.getElementById("governmentChart"), {
        type: "line",
        data: {
          labels: [],
          datasets: [
            makeDataset("재정수지", "#247173"),
            makeDataset("세금 수입", "#407ca8"),
            makeDataset("정부 지출", "#c85f32"),
            makeDataset("평균 기업이윤", "#d88931"),
            makeDataset("가계부채", "#6bb58e", "y1", [5, 3]),
            makeDataset("기업부채", "#8b6f47", "y1", [2, 3])
          ]
        },
        options: cloneOptions(baseOptions, "정부 재정")
      });

      state.charts.asset = new Chart(document.getElementById("assetChart"), {
        type: "line",
        data: {
          labels: [],
          datasets: [
            makeDataset("주가지수(pt)", "#247173"),
            makeDataset("주거용 부동산", "#d88931"),
            makeDataset("상업용 부동산", "#407ca8")
          ]
        },
        options: cloneOptions(baseOptions, "자산시장")
      });

      state.charts.firmStock = new Chart(document.getElementById("firmStockChart"), {
        type: "line",
        data: {
          labels: [],
          datasets: [
            makeDataset("평균 기업 주가", "#247173"),
            makeDataset("기업 주가 변동성 %", "#c85f32", "y1")
          ]
        },
        options: cloneOptions(baseOptions, "기업 주식")
      });

      state.charts.financial = new Chart(document.getElementById("financialChart"), {
        type: "line",
        data: {
          labels: [],
          datasets: [
            makeDataset("국채금리 %", "#247173"),
            makeDataset("신용스프레드 %p", "#c85f32"),
            makeDataset("은행건전성지수", "#407ca8", "y1")
          ]
        },
        options: cloneOptions(baseOptions, "금융시장")
      });

      state.charts.safeAsset = new Chart(document.getElementById("safeAssetChart"), {
        type: "line",
        data: {
          labels: [],
          datasets: [
            makeDataset("금 가격지수", "#d88931"),
            makeDataset("은 가격지수", "#8b6f47")
          ]
        },
        options: cloneOptions(baseOptions, "안전자산")
      });

      state.charts.sentiment = new Chart(document.getElementById("sentimentChart"), {
        type: "line",
        data: {
          labels: [],
          datasets: [
            makeDataset("소비심리", "#247173"),
            makeDataset("기업심리", "#407ca8"),
            makeDataset("침체우려", "#c85f32")
          ]
        },
        options: cloneOptions(baseOptions, "심리 및 기대")
      });

      state.charts.model = new Chart(document.getElementById("modelChart"), {
        type: "line",
        data: {
          labels: [],
          datasets: [
            makeDataset("모형 결과", "#247173"),
            makeDataset("기준선", "#d88931", "y", [5, 4])
          ]
        },
        options: cloneOptions(baseOptions, "모형 결과")
      });

    }

    function showChartFallback(message) {
      document.querySelectorAll(".chart-box canvas, .model-chart-box canvas").forEach((canvas) => {
        const box = canvas.closest(".chart-box, .model-chart-box");
        if (!box || box.querySelector(".chart-fallback")) return;
        canvas.style.display = "none";
        const fallback = document.createElement("div");
        fallback.className = "chart-fallback";
        fallback.textContent = message;
        box.appendChild(fallback);
      });
    }

    function registerEventMarkerPlugin() {
      if (!window.Chart) return;
      if (window.__agentMacroEventMarkersRegistered) return;
      window.__agentMacroEventMarkersRegistered = true;
      Chart.register({
        id: "eventMarkers",
        afterDatasetsDraw(chart) {
          const active = chart.tooltip && chart.tooltip.getActiveElements ? chart.tooltip.getActiveElements() : [];
          if (!active.length) return;
          const area = chart.chartArea;
          const x = active[0].element.x;
          const ctx = chart.ctx;
          ctx.save();
          ctx.strokeStyle = "rgba(22, 48, 46, 0.24)";
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.moveTo(x, area.top);
          ctx.lineTo(x, area.bottom);
          ctx.stroke();
          ctx.restore();
        },
        afterDraw(chart) {
          if (!state.markers.length || !chart.data.labels.length) return;
          const xScale = chart.scales.x;
          const area = chart.chartArea;
          const visibleTicks = chart.data.labels.map(Number);
          const ctx = chart.ctx;

          state.markers.forEach((marker) => {
            const index = visibleTicks.indexOf(marker.tick);
            if (index < 0) return;
            const x = xScale.getPixelForValue(index);
            ctx.save();
            ctx.strokeStyle = marker.label === "충격" ? "rgba(200, 72, 63, 0.55)" : "rgba(36, 113, 115, 0.48)";
            ctx.lineWidth = 1.2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(x, area.top);
            ctx.lineTo(x, area.bottom);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = ctx.strokeStyle;
            ctx.font = "700 10px sans-serif";
            ctx.fillText(marker.label, x + 4, area.top + 12);
            ctx.restore();
          });
        }
      });
    }

    function makeDataset(label, color, yAxisID = "y", dash = []) {
      return {
        label,
        data: [],
        borderColor: color,
        backgroundColor: color + "22",
        borderWidth: 2.2,
        yAxisID,
        borderDash: dash,
        pointRadius: 0,
        pointHoverRadius: 3,
        tension: 0.32,
        fill: false
      };
    }

    function cloneOptions(baseOptions, title) {
      const options = JSON.parse(JSON.stringify(baseOptions));
      options.plugins.tooltip.callbacks = baseOptions.plugins.tooltip.callbacks;
      options.plugins.title = {
        display: true,
        text: title,
        color: "#16302e",
        align: "start",
        font: { size: 13, weight: "800" }
      };
      return options;
    }

    function setupChartDatasetToggles() {
      if (!isChartAvailable()) return;
      Object.values(state.charts).forEach((chart) => {
        const canvas = chart.canvas;
        const box = canvas && canvas.parentElement;
        if (!box || box.querySelector(".chart-toggles")) return;
        const toolbar = document.createElement("div");
        toolbar.className = "chart-toggles";
        chart.data.datasets.forEach((dataset, index) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "chart-toggle";
          button.textContent = dataset.label;
          button.style.borderColor = dataset.borderColor;
          button.addEventListener("click", () => {
            const currentlyVisible = chart.isDatasetVisible(index);
            chart.setDatasetVisibility(index, !currentlyVisible);
            button.classList.toggle("off", currentlyVisible);
            chart.update();
          });
          toolbar.appendChild(button);
        });
        box.insertBefore(toolbar, canvas);
      });
    }

    function clearCharts() {
      if (!isChartAvailable()) return;
      Object.values(state.charts).forEach((chart) => {
        if (!chart || !chart.data) return;
        chart.data.labels = [];
        chart.data.datasets.forEach((dataset) => {
          dataset.data = [];
        });
        chart.update("none");
      });
    }

    function updateCharts(force = false) {
      if (!isChartAvailable()) return;
      syncUiPerformanceState();
      const interval = isLargeEconomyMode() ? 24 : state.config.performanceMode === "light" ? 10 : 4;
      if (!force && state.tick > 0 && state.tick % interval !== 0 && state.history.length > 2) return;
      if (state.ui) state.ui.lastChartUpdateTick = state.tick;
      const labels = state.history.map((row) => row.tick);
      updateChartFromHistory(state.charts.gdp, labels, [
        (row) => round(row.gdp, 1),
        (row) => round(row.outputValue, 1),
        (row) => round(row.governmentGDPSpending, 1)
      ]);
      updateChartFromHistory(state.charts.demand, labels, [
        (row) => round(row.consumption, 1),
        (row) => round(row.investment, 1),
        (row) => round(row.interestRatePercent, 2)
      ]);
      updateChartFromHistory(state.charts.unemployment, labels, [
        (row) => round(row.unemploymentRate, 2),
        (row) => round(row.interestRatePercent, 2)
      ]);
      updateChartFromHistory(state.charts.price, labels, [
        (row) => round(row.averagePrice, 2),
        (row) => round(row.inflation, 2),
        (row) => round(row.averageWage, 2),
        (row) => round(row.wageGrowth, 2)
      ]);
      updateChartFromHistory(state.charts.government, labels, [
        (row) => round(row.governmentBalance, 1),
        (row) => round(row.taxCollected, 1),
        (row) => round(row.spendingActual, 1),
        (row) => round(row.averageFirmProfit, 1),
        (row) => round(row.householdDebt, 1),
        (row) => round(row.firmDebt, 1)
      ]);
      updateChartFromHistory(state.charts.asset, labels, [
        (row) => round(row.stockIndexPoints || row.stockIndex * 25, 0),
        (row) => round(safeNumber(row.residentialIndex, row.housingIndex), 1),
        (row) => round(safeNumber(row.commercialIndex, 100), 1)
      ]);
      updateChartFromHistory(state.charts.firmStock, labels, [
        (row) => round(safeNumber(row.averageFirmStockPrice, 100), 1),
        (row) => round(safeNumber(row.firmStockVolatility, 0), 2)
      ]);
      updateChartFromHistory(state.charts.financial, labels, [
        (row) => round(row.bondYield, 2),
        (row) => round(row.creditSpread, 2),
        (row) => round(row.bankHealthIndex, 1)
      ]);
      updateChartFromHistory(state.charts.safeAsset, labels, [
        (row) => round(row.goldIndex, 1),
        (row) => round(row.silverIndex, 1)
      ]);
      updateChartFromHistory(state.charts.sentiment, labels, [
        (row) => round(safeNumber(row.consumerSentiment, 0.8), 2),
        (row) => round(safeNumber(row.businessSentiment, 0.8), 2),
        (row) => round(safeNumber(row.recessionFear, 0.2), 2)
      ]);
    }

    function updateChartFromHistory(chart, labels, accessors) {
      if (!shouldUpdateChartData(chart)) return;
      updateChart(chart, labels, accessors.map((accessor) => state.history.map(accessor)));
    }

    function updateChart(chart, labels, dataSeries) {
      if (!shouldUpdateChartData(chart)) return;
      const canvas = chart.canvas;
      if (!canvas) return;
      chart.data.labels = labels;
      dataSeries.forEach((series, index) => {
        chart.data.datasets[index].data = series;
      });
      chart.update("none");
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

    function getCurrentEconomySnapshot() {
      const producerProductivity = average(state.producers.map((producer) => producer.productivity));
      const capital = sum(state.producers.map((producer) => producer.productionCapacity)) + state.metrics.investment * 0.15;
      const labor = state.metrics.employedCount || state.consumers.filter((consumer) => consumer.employed).length || 1;
      const demandBase = Math.max(1, state.metrics.outputValue || state.metrics.gdp || 1);
      return {
        gdp: safeNumber(state.metrics.gdp, 0),
        consumption: safeNumber(state.metrics.consumption, 0),
        investment: safeNumber(state.metrics.investment, 0),
        unemployment: safeNumber(state.metrics.unemploymentRate, 6),
        inflation: safeNumber(state.metrics.inflation, 2),
        interestRate: safeNumber(state.metrics.interestRatePercent, state.policy ? state.policy.interestEffective * 100 : 4.5),
        governmentSpending: safeNumber(state.metrics.governmentSpendingActual || (state.government && state.government.effectiveSpending), 640),
        taxRate: state.government ? state.government.householdIncomeTaxRate * 100 : 16,
        householdIncomeTaxRate: state.government ? state.government.householdIncomeTaxRate * 100 : 16,
        corporateTaxRate: state.government ? state.government.corporateTaxRate * 100 : 18,
        averageWage: safeNumber(state.metrics.averageWage, effectiveBaseWage()),
        firmInvestment: safeNumber(state.metrics.investment, 0),
        governmentDebt: safeNumber(state.metrics.governmentDebt, state.government ? state.government.debt : 0),
        debtToGdpRatio: safeNumber(state.metrics.debtToGdpRatio, 0),
        averageHouseholdDebtBurden: safeNumber(state.metrics.averageHouseholdDebtBurden, 0),
        averageFirmDSCR: safeNumber(state.metrics.averageFirmDSCR, 99),
        productivity: safeNumber(producerProductivity, 1),
        capital,
        labor,
        demandPressure: clamp((state.metrics.consumption + state.metrics.investment + state.metrics.governmentGDPSpending) / demandBase, 0.4, 2.5),
        supplyCapacity: clamp((state.metrics.outputValue || demandBase) / demandBase, 0.4, 2.5),
        wagePressure: clamp(safeNumber(state.metrics.averageWage, effectiveBaseWage()) / Math.max(1, effectiveBaseWage()), 0.5, 2.2),
        potentialOutput: safeNumber(state.metrics.potentialOutput, state.metrics.gdp || 1),
        outputGap: clamp(safeNumber(state.metrics.outputGap, 0), -30, 30),
        unemploymentGap: safeNumber(state.metrics.unemploymentGap, 0),
        inflationGap: safeNumber(state.metrics.inflationGap, 0),
        policyGap: safeNumber(state.metrics.policyGap, 0),
        creditSpread: safeNumber(state.metrics.creditSpread, 2),
        bankHealthIndex: safeNumber(state.metrics.bankHealthIndex, 100),
        creditSupplyIndex: safeNumber(state.metrics.creditSupplyIndex, 100),
        bankingCrisisRiskScore: safeNumber(state.metrics.bankingCrisisRiskScore, 0),
        loanRate: safeNumber(state.metrics.loanRate, state.metrics.interestRatePercent + 2)
      };
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

    function updateGameDisplay() {
      els.calendarValue.textContent = getCalendarLabel(state.tick);
      els.phaseValue.textContent = `${getEconomyPhase()} · ${state.game.scenarioName}`;
      els.scoreValue.textContent = `${state.game.score.toLocaleString("ko-KR")}점`;
      els.bestScoreValue.textContent = `${state.game.bestScore.toLocaleString("ko-KR")} / ${formatSigned(state.game.scoreTrend, 0)}`;
      els.modeStatusValue.textContent = state.game.modeName;
      els.missionSummary.textContent = `${state.game.modeName}: ${getGameModeConfig(state.game.mode).mission}`;
      renderObjectives();
      renderFeedbackBanners();
    }

    function getCalendarLabel(tick) {
      const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
      const month = Math.floor(safeNumber(tick, 0) / TICKS_PER_MONTH) + 1;
      const year = Math.floor((month - 1) / 12) + 1;
      const monthInYear = ((month - 1) % 12) + 1;
      return `${year}년 ${monthNames[monthInYear - 1]}`;
    }

    function getEconomyPhase() {
      const growth = getGDPGrowthWindow();
      if (state.metrics.inflation > TARGET_INFLATION + 2 && state.metrics.outputGap < -1) return "스태그플레이션 위험";
      if (state.metrics.inflation > TARGET_INFLATION + 1.2 && state.metrics.outputGap > 1.5) return "과열";
      if (state.metrics.inventoryToDemand > 2.5 && growth < 2) return "둔화";
      if (state.metrics.unemploymentRate > 14 && growth < -2) return "침체";
      if (growth > 3 && state.metrics.averageBusinessOutlook > 0.94 && state.metrics.capacityUtilization > 65) return "확장";
      if (growth > 0 && state.metrics.unemploymentRate < 12 && state.metrics.inventoryToDemand < 2.4) return "회복";
      if (state.metrics.debtServiceBurden > 8 || state.metrics.financialConditionIndex > 9) return "신용 스트레스";
      return "안정 탐색";
    }

    function renderObjectives() {
      els.objectiveList.innerHTML = state.game.objectives.map((objective) => {
        const status = objective.pass ? "달성" : "위험";
        const className = objective.pass ? "pass" : "fail";
        return `<li><span>${objective.label}</span><strong class="${className}">${objective.value} · ${status}</strong></li>`;
      }).join("");
    }

    function renderFeedbackBanners() {
      const current = state.history[state.history.length - 1];
      const previous = state.history[Math.max(0, state.history.length - 7)];
      const banners = [];
      if (current && previous && current !== previous) {
        if (current.inflation < previous.inflation - 0.25) banners.push({ text: "📉 물가 둔화", type: "good", priority: 1 });
        if (current.inflation > previous.inflation + 0.35) banners.push({ text: "⚠ 물가 상승", type: "warn", priority: 2 });
        if (current.unemploymentRate < previous.unemploymentRate - 0.6) banners.push({ text: "📈 고용 회복", type: "good", priority: 1 });
        if (current.unemploymentRate > previous.unemploymentRate + 0.8) banners.push({ text: "⚠ 침체 위험", type: "danger", priority: 3 });
        if (state.metrics.debtServiceBurden > 7.5) banners.push({ text: "⚠ 부채 부담 상승", type: "warn", priority: 2 });
        if (state.metrics.investment < previous.investment - 8) banners.push({ text: "📉 투자 감소", type: "warn", priority: 2 });
        if (getGDPGrowthWindow() > 3) banners.push({ text: "📈 회복 진행", type: "good", priority: 1 });
      }
      if (!banners.length && (state.tick < 5 || state.tick % 18 < 5)) {
        banners.push({ text: `${state.game.scenarioName} · ${getEconomyPhase()}`, type: "good", priority: 0 });
      }
      els.feedbackBanners.innerHTML = banners.sort((a, b) => b.priority - a.priority).slice(0, 3).map((banner) => (
        `<span class="feedback-banner ${banner.type === "danger" ? "danger" : banner.type === "warn" ? "warn" : ""}">${banner.text}</span>`
      )).join("");
    }

    function handlePolicyChange(input) {
      const now = performance.now();
      if (now - state.game.policyToastAt < 850) return;
      state.game.policyToastAt = now;
      const messages = {
        interestSlider: ["금리 조정", "높은 금리는 물가와 신용을 식히지만 투자와 고용을 압박합니다."],
        taxSlider: ["소득세 조정", "소득세는 가계의 가처분소득과 소비를 낮출 수 있습니다."],
        corporateTaxSlider: ["법인세 조정", "법인세는 기업 순이익과 투자 여력을 낮출 수 있습니다."],
        vatSlider: ["부가세 조정", "부가세는 체감물가와 저소득층 소비여력에 빠르게 전달됩니다."],
        spendingSlider: ["정부 지출 조정", "지출은 수요와 고용을 지지하지만 부채 위험을 키울 수 있습니다."],
        wageSlider: ["기준 임금 조정", "임금은 가계소득을 높이지만 비용상승 물가 압력도 만들 수 있습니다."],
        inflationSlider: ["물가 민감도 조정", "가격 조정이 얼마나 빠르게 경제 압력에 반응하는지 바꿉니다."]
      };
      const message = messages[input.id];
      if (message) showToast(message[0], `${message[1]} 정책 효과는 몇 개월에 걸쳐 반영됩니다.`);
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

    function intensityLabel(value) {
      const v = safeNumber(value, 0);
      if (v < 0.25) return "낮음";
      if (v < 0.50) return "주의";
      if (v < 0.75) return "불안";
      return "공포";
    }

    function behavioralLabel(value) {
      const v = safeNumber(value, 0);
      if (v < 0.25) return "낮음";
      if (v < 0.52) return "보통";
      if (v < 0.72) return "높음";
      if (v < 0.92) return "과열";
      return "위험";
    }

    function classStatusLabel(confidence, stress = 0) {
      const c = safeNumber(confidence, 0.75);
      const s = safeNumber(stress, 0);
      if (s > 0.72 || c < 0.34) return "위험";
      if (s > 0.52 || c < 0.52) return "약함";
      if (c > 0.78 && s < 0.34) return "좋음";
      return "보통";
    }

    function accuracyLabel(value) {
      const v = safeNumber(value, 0.75);
      if (v >= 0.78) return "강함";
      if (v >= 0.58) return "보통";
      if (v >= 0.38) return "약함";
      return "위험";
    }

    function perceptionGapLabel(perceivedValue, actualValue) {
      const gap = Math.abs(safeNumber(perceivedValue, actualValue) - safeNumber(actualValue, perceivedValue));
      if (gap < 0.10) return "보통";
      if (gap < 0.28) return "주의";
      return "불안";
    }

    function expectationMoodLabel(value) {
      const v = safeNumber(value, 0);
      if (v > 2.5) return "낙관";
      if (v < -2.5) return "비관";
      return "중립";
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

    function getDominantTransmissionChain() {
      const transmission = state.macroFinancial || createInitialMacroFinancialTransmission(state.config);
      const sentiment = state.sentiment || createInitialSentimentState();
      const info = state.information || createInitialInformationSystem();
      const historical = state.historicalScenario || createInitialHistoricalScenario();
      const topWarning = state.earlyWarning?.topRisks?.[0];
      const dominantCause = state.causalDecomposition?.dominant;
      if (!historical.key && topWarning && topWarning.score >= 70) {
        const chains = {
          "신용경색": ["신용경색 경보", "여신심사 보수화", "신용스프레드 확대", "투자심리 약화", "투자 둔화"],
          "신용 과다": ["신용 과다 경보", "위험 과소평가", "차입 확대", "자산가격 괴리", "조정 취약성"],
          "자산버블": ["자산버블 경보", "FOMO와 불패 믿음", "가격-기초가치 괴리", "레버리지 취약성", "조정 위험"],
          "은행불안": ["은행불안 경보", "예금자·은행 간 신뢰 약화", "자금조달 압력", "대출태도 강화", "신용공급 위축"],
          "외환불안": ["외환불안 경보", "환율 약세", "수입물가 상승", "실질소비 약화", "내수 둔화"],
          "재정압박": ["재정압박 경보", "국채금리 부담", "이자비용 증가", "재정여력 약화", "정책 효과 제한"],
          "인플레이션 기대불안": ["기대물가 불안", "임금·가격 선제 조정", "실질금리 효과 약화", "물가 둔화 지연"],
          "계층 스트레스": ["계층 스트레스", "저소득·중산층 소비여력 약화", "소비심리 둔화", "내수 둔화"],
          "시장 실패": ["시장 실패 위험", "정보·신용 배분 왜곡", "투자효율 저하", "성장 품질 약화"]
        };
        return chains[topWarning.label] || ["조기경보 상승", "심리·신용 경로 악화", "실물경제 지연 반응"];
      }
      if (dominantCause === "금리·부채") return ["금리·부채 압력", "대출·주담대 비용 상승", "부채상환 부담 증가", "소비·투자 둔화"];
      if (dominantCause === "대외·환율") return ["대외·환율 압력", "수입물가 상승", "체감물가 악화", "저소득층 소비 둔화"];
      if (dominantCause === "공급비용") return ["공급비용 상승", "기업 마진 압박", "가격 전가", "실질소비 둔화"];
      if (historical.key && safeNumber(state.metrics.historicalScenarioIntensity, historical.intensity) > 0.30) {
        const chains = {
          koreaImf1997: ["외환 유동성 경색", "환율 급등", "고금리·신용경색", "기업 구조조정", "수출 회복 모색"],
          usFinancialCrisis2007: ["주택가격 둔화", "담보가치 하락", "은행 간 신뢰 약화", "신용공급 위축", "투자·고용 둔화"],
          japanBubbleEconomy: ["저금리·자산 낙관", "담보대출 확대", "주식·토지 과열", "금리 정상화 압력", "조정 취약성"],
          germanyReunification: ["통합 충격", "재정이전·건설붐", "임금-생산성 괴리", "재정 부담", "생산성 적응"],
          turkiyeInflation2018: ["환율 불안", "수입물가 상승", "기대인플레이션 확대", "급격한 금리 인상", "실질소비 둔화"]
        };
        return chains[historical.key] || ["역사 충격", "심리·신용 경로 변화", "실물경제 지연 반응"];
      }
      if (info.rumorIntensity > 0.42 && info.rumorType === "bank") {
        return ["은행 부실 루머", "공포지수 상승", "신용스프레드 확대", "기업 투자심리 약화", "투자 둔화"];
      }
      if (info.rumorIntensity > 0.38 && info.rumorType === "rateCut") {
        return ["금리 인하 기대", "주가지수 상승 기대", "자산효과 개선", "소비심리 회복", "소비 증가"];
      }
      if (info.rumorIntensity > 0.38 && info.rumorType === "housing") {
        return ["부동산 하락 우려", "가계 순자산 불안", "소비심리 약화", "은행 위험선호 하락", "신용공급 위축"];
      }
      if (info.rumorIntensity > 0.38 && info.rumorType === "inflation") {
        return ["인플레이션 재가속 우려", "기대인플레이션 상승", "임금 요구 압력", "기업 가격 인상 심리", "물가 압력 확대"];
      }
      if (state.metrics.creditCrunchRisk > 0.58 || state.metrics.creditCyclePhase === "신용경색") {
        return ["신용경색", "여신심사 보수화", "신용스프레드 확대", "기업 투자심리 약화", "투자 둔화"];
      }
      if (state.metrics.creditExcessRisk > 0.58 || state.metrics.creditCyclePhase === "신용 과다") {
        return ["신용 과다", "위험 과소평가", "차입과 자산수요 확대", "버블 취약성 누적", "향후 조정 위험"];
      }
      if (state.metrics.bondMarketStress > 0.55 || state.metrics.longBondPriceIndex < 84) {
        return ["국채시장 변동성", "장기채 가격 하락", "장기금리 상승", "주담대·조달비용 상승", "투자 둔화"];
      }
      if (state.metrics.depositorConfidence < 0.56) {
        return ["예금자 불안", "은행 자금조달 압력", "은행 간 신뢰 약화", "대출태도 강화", "신용공급 위축"];
      }
      if (state.metrics.interbankTrust < 0.58) {
        return ["은행 간 신뢰 하락", "자금시장 경색", "신용스프레드 확대", "기업 차입비용 상승", "투자 지연"];
      }
      if (state.metrics.flightToQualityDemand > 0.42 && state.metrics.safeHavenDemand > 45) {
        return ["안전자산 선호 급등", "위험회피 심리 강화", "주식·신용시장 압박", "금융여건 긴축", "소비·투자 둔화"];
      }
      if (state.metrics.marketFailureRisk > 0.58 && state.metrics.marketFailureType === "정보 비대칭") {
        return ["시장 정보 실패", "위험 과소평가", "신용 과다", "자산가격 괴리", "조정 취약성"];
      }
      if (state.metrics.foreignInvestorSentiment < 0.45) {
        return ["해외 투자심리 악화", "환율 약세", "수입물가 상승", "저소득층 소비 둔화"];
      }
      if (state.metrics.foreignBondDemand < 0.45) {
        return ["해외 채권수요 약화", "장기금리 상승", "정부 이자비용 증가", "재정여력 약화"];
      }
      if (state.metrics.energyStress > 0.58 || state.metrics.energyPriceIndex > 138) {
        return ["에너지 가격 상승", "생산비 상승", "비용발 물가", "실질소비 둔화"];
      }
      if (state.metrics.agricultureStress > 0.58) {
        return ["농업 공급 충격", "식품가격 상승", "저소득층 체감물가 악화", "소비여력 약화"];
      }
      if (state.metrics.marketSuccessScore > 0.70 && state.metrics.marketSuccessType === "생산성 개선") {
        return ["생산성 개선", "투자 효율 상승", "물가 안정 속 성장", "시장 기능 개선"];
      }
      if (state.metrics.consumptionTaxPain > 0.56 && state.metrics.lowIncomeStress > 0.46) {
        return ["부가세 상승", "체감물가 상승", "저소득층 소비여력 약화", "내수 둔화"];
      }
      if (state.metrics.buybackPayoutRatio > 0.34 && state.metrics.investmentConversionRate < 0.24) {
        return ["법인세 인하", "세후현금 증가", "자사주·부채상환 우선", "투자 회복 제한"];
      }
      if (safeNumber(state.government?.corporateTaxRate, 0.18) < 0.15 && state.metrics.aggregateDemandPressure > 1.02 && state.metrics.investmentConversionRate > 0.32) {
        return ["법인세 인하", "강한 수요 전망", "투자여력 개선", "기술·제조업 투자 확대"];
      }
      if (state.metrics.lowIncomeStress > 0.58 && state.metrics.inflation > TARGET_INFLATION + 0.8) {
        return ["물가 상승", "저소득층 실질소비 감소", "필수소비 중심 지출 압박", "총수요 둔화"];
      }
      if (state.metrics.middleClassMortgageStress > 0.58 || (state.metrics.mortgageRate > 7 && state.metrics.middleClassHousingBurden > 12)) {
        return ["금리 상승", "중산층 주택담보 부담 증가", "소비심리 약화", "내수 둔화"];
      }
      if (state.metrics.stockMonthlyReturn < -3 && (state.metrics.highIncomeWealthEffect < -0.5 || state.metrics.wealthyAssetEffect < -0.5)) {
        return ["주가지수 하락", "고소득층·자산가 자산효과 약화", "고가소비 둔화", "기업 매출 기대 약화"];
      }
      if (state.metrics.residentialReturn > 0.6 && state.metrics.wealthyAssetEffect > 0.8 && state.metrics.housingAffordability > 1.45) {
        return ["부동산 상승", "자산가 자산효과 개선", "무주택층 주거부담 증가", "계층별 체감경기 격차 확대"];
      }
      if (state.metrics.hiddenVulnerabilityIndex > 0.58 && state.metrics.dominantVulnerability === "은행") {
        return ["겉보기 안정", "은행 취약성 누적", "신용공급 선제 위축", "기업 투자 지연", "고용 둔화 위험"];
      }
      if (state.metrics.hiddenVulnerabilityIndex > 0.58 && state.metrics.dominantVulnerability === "주택") {
        return ["헤드라인 GDP 안정", "주택 취약성 누적", "중산층 주거부담 확대", "소비심리 약화", "내수 둔화 위험"];
      }
      if (state.metrics.hiddenVulnerabilityIndex > 0.58 && state.metrics.dominantVulnerability === "기업") {
        return ["낮은 실업률", "기업 현금흐름 취약", "투자심리 약화", "채용 계획 보수화", "생산성 둔화"];
      }
      if (state.metrics.exchangeRateIndex > 112 && state.metrics.importInflationPressure > 1.0) {
        return ["환율 약세", "수입물가 상승", "저소득층 실질소비 약화", "소비 둔화"];
      }
      if (state.metrics.commodityCostPressure > 1.6) {
        return ["원자재 가격 상승", "제조업 비용 상승", "마진 압박", "고용 둔화"];
      }
      if (state.metrics.policyGap > 2 && state.metrics.middleClassHousingBurden > 12) {
        return ["금리 인상", "주택담보 부담 증가", "중산층 소비심리 약화", "건설업 투자 둔화"];
      }
      if (Math.abs(state.metrics.policySurpriseRate) > 0.35 || state.metrics.rateUncertainty > 0.55) {
        return ["예상 밖 금리 변화", "정책 불확실성 증가", "주가 변동성 확대", "위험회피 심리 강화", "투자 지연"];
      }
      if (state.metrics.termSpread < -0.25) {
        return ["장단기 금리차 축소", "경기둔화 기대", "기업 투자심리 약화", "은행 대출태도 보수화", "투자 지연"];
      }
      if (state.metrics.mortgageRate > 7 && state.metrics.housingAffordability > 1.45) {
        return ["10년 금리 상승", "주택담보금리 상승", "주택구입부담 증가", "부동산 수요 둔화", "건설업 투자 둔화"];
      }
      if (state.metrics.realPolicyRate > 3 && state.metrics.investment < average(state.history.slice(-8).map((row) => row.investment || 0))) {
        return ["실질금리 상승", "투자 수익률 기준 강화", "기업 설비투자 지연", "생산능력 확장 둔화", "고용 둔화"];
      }
      if (state.metrics.zombieFirmRatio > 16) {
        return ["저금리 장기화", "좀비기업 생존", "단기 실업 안정", "장기 생산성 둔화"];
      }
      if (state.metrics.wealthInequality > 0.58 && state.metrics.wealthEffect > 2) {
        return ["주식·부동산 상승", "자산가 소비심리 개선", "자산불평등 확대", "주거비 부담 증가"];
      }
      if (state.metrics.realEstateNeverFallsBelief > 0.70 && state.metrics.housingMispricing > 18) {
        return ["부동산 불패 믿음", "투기 수요 증가", "주택담보대출 증가", "가격-기초가치 괴리 확대", "조정 취약성 증가"];
      }
      if (state.metrics.stockMarketNeverFailsBelief > 0.70 && state.metrics.stockMispricing > 22) {
        return ["주식 불패 믿음", "저가매수 심리", "주가지수 방어", "밸류에이션 부담 증가", "악재 발생 시 패닉 위험"];
      }
      if (state.metrics.confirmationBias > 0.65 && state.metrics.behavioralMispricingIndex > 0.55) {
        return ["정보 격차", "확증편향 강화", "위험 신호 무시", "버블 지속", "뒤늦은 급격한 조정"];
      }
      if (state.metrics.panicSellingPressure > 0.55 || (state.metrics.herdIntensity > 0.62 && state.metrics.safeHavenDemand > 35)) {
        return ["공포 확산", "군중심리 강화", "안전자산 선호", "신용스프레드 확대", "투자 둔화"];
      }
      if (state.metrics.stockVolatilityIndex > 45 && state.metrics.stockMonthlyReturn < -2) {
        return ["공포지수 상승", "시장 과잉반응", "안전자산 선호 확대", "기업 투자심리 약화", "투자 지연"];
      }
      if (state.metrics.commercialVacancy > 18 && state.metrics.commercialReturn < -0.25) {
        return ["상업용 공실률 상승", "기업 부동산 가치 하락", "은행 스트레스 증가", "대출태도 강화", "투자 둔화"];
      }
      if (state.metrics.collateralValueIndex < 90) {
        return ["부동산 가격 하락", "담보가치 하락", "은행 위험선호 약화", "신용공급 위축", "투자 둔화"];
      }
      if (state.metrics.stockCrashFirmCount > Math.max(1, state.producers.length * 0.2)) {
        return ["기업 실적 악화", "개별 기업 주가 하락", "자금조달 여건 악화", "투자심리 약화", "고용 둔화"];
      }
      if (transmission.loanRate > transmission.effectivePolicyRate + 0.055 && state.metrics.debtServiceBurden > 6) {
        return ["금리 상승", "대출금리 상승", "부채상환 부담 증가", "소비심리 약화", "소비 둔화"];
      }
      if (state.metrics.inventoryToDemand > 2.5) {
        return ["재고 과잉", "기업심리 약화", "생산 가동률 하락", "투자 둔화", "고용 둔화"];
      }
      if (state.metrics.housingReturn < -0.35 || state.metrics.negativeEquityRatio > 4) {
        return ["부동산 가격 조정", "가계 순자산 감소", "은행 위험선호 약화", "신용공급 위축", "소비·투자 둔화"];
      }
      if (state.metrics.creditSpread > 5.5 || state.metrics.creditSupplyIndex < 72) {
        return ["은행 스트레스", "신용스프레드 확대", "대출금리 상승", "기업 투자 둔화", "고용 회복 지연"];
      }
      if (state.metrics.debtToGdpRatio > 1.15 && state.metrics.bondYield > state.metrics.interestRatePercent + 3.0) {
        return ["재정 악화", "국채금리 압력", "정부 이자비용 증가", "재정여력 약화", "정책 효과 제한"];
      }
      if (state.metrics.stockMonthlyReturn < -3 || sentiment.safeHavenSentiment > 0.55) {
        return ["주가지수 조정", "위험회피 심리 상승", "안전자산 선호 확대", "금융여건 긴축", "투자심리 약화"];
      }
      if (sentiment.consumerConfidence > 0.75 && transmission.wealthEffect > 0.008) {
        return ["자산효과 개선", "소비심리 강화", "소비 지출 증가", "기업 매출 기대 개선", "투자 회복"];
      }
      return ["현재 상태", "정책·신용·심리 신호 관찰", "수요와 재고 조정", "투자와 고용에 지연 반영"];
    }

    function updateBalanceDiagnostics() {
      const recentWindow = state.history.slice(-TICKS_PER_MONTH * 20);
      const recentRows = recentWindow.length ? recentWindow : [{
        unemploymentRate: state.metrics.unemploymentRate,
        inflation: state.metrics.inflation,
        gdp: state.metrics.gdp
      }];
      const avgUnemployment = average(recentRows.map((row) => row.unemploymentRate));
      const avgInflation = average(recentRows.map((row) => row.inflation));
      const avgGdp = average(recentRows.map((row) => row.gdp));
      const producerCount = Math.max(1, state.producers.length);
      const avgFirmEmployment = average(state.producers.map((producer) => producer.employees.length));
      const hiringFreezeRatio = state.producers.filter((producer) => (producer.hiringFreezeTicks || 0) > 0).length / producerCount * 100;
      const firmStressRatio = state.producers.filter(isFirmActuallyStressed).length / producerCount * 100;
      const inventoryDemandRatio = average(state.producers.map((producer) => producer.inventory / Math.max(1, producer.expectedDemand)));

      els.diagAvgUnemploymentValue.textContent = percent(avgUnemployment, 1);
      els.diagAvgInflationValue.textContent = signedPercent(avgInflation);
      els.diagAvgGdpValue.textContent = money(avgGdp);
      els.diagPotentialOutputValue.textContent = money(state.metrics.potentialOutput);
      els.diagOutputGapValue.textContent = `${formatSigned(state.metrics.outputGap, 1)}%p`;
      els.diagCapacityUtilizationValue.textContent = percent(state.metrics.capacityUtilization, 1);
      els.diagUnemploymentGapValue.textContent = `${formatSigned(state.metrics.unemploymentGap, 1)}%p`;
      els.diagInflationGapValue.textContent = `${formatSigned(state.metrics.inflationGap, 1)}%p`;
      els.diagPolicyGapValue.textContent = `${formatSigned(state.metrics.policyGap, 1)}%p`;
      els.diagAvgFirmEmploymentValue.textContent = `${round(avgFirmEmployment, 1).toFixed(1)}명`;
      els.diagHiringFreezeRatioValue.textContent = percent(hiringFreezeRatio, 1);
      els.diagFirmStressRatioValue.textContent = percent(firmStressRatio, 1);
      els.diagInventoryDemandRatioValue.textContent = round(inventoryDemandRatio, 2).toFixed(2);

      if (state.policy) {
        els.diagInterestPolicyValue.textContent = `${percent(state.policy.interestTarget * 100, 2)} / ${percent(state.policy.interestEffective * 100, 2)}`;
        els.diagTaxPolicyValue.textContent = `${percent(state.policy.taxTarget * 100, 1)} / ${percent(state.policy.taxEffective * 100, 1)}`;
        els.diagCorporateTaxPolicyValue.textContent = `${percent(state.policy.corporateTaxTarget * 100, 1)} / ${percent(state.policy.corporateTaxEffective * 100, 1)}`;
        els.diagSpendingPolicyValue.textContent = `${money(state.policy.spendingTarget)} / ${money(state.policy.spendingEffective)}`;
      }
      els.diagDebtToGdpValue.textContent = percent(state.metrics.debtToGdpRatio * 100, 1);
      els.diagGovernmentDebtServiceValue.textContent = money(state.metrics.governmentDebtService);
      els.diagFiscalSpaceValue.textContent = state.metrics.fiscalSpaceLabel;
      els.diagHouseholdDebtBurdenValue.textContent = percent(state.metrics.averageHouseholdDebtBurden, 1);
      els.diagFirmDscrValue.textContent = round(state.metrics.averageFirmDSCR, 2).toFixed(2);
      els.diagHouseholdDebtStressRatioValue.textContent = percent(state.metrics.debtStressedHouseholdRatio, 1);
      els.diagFirmDebtStressRatioValue.textContent = percent(state.metrics.debtStressedFirmRatio, 1);
      els.diagAssetBubbleRiskValue.textContent = state.metrics.assetBubbleRiskLabel;
      els.diagHousingAffordabilityValue.textContent = round(state.metrics.housingAffordability, 2).toFixed(2);
      els.diagWealthEffectValue.textContent = signedPercent(state.metrics.wealthEffect);
      els.diagFinancialMarketSummaryValue.textContent = state.financialMarket?.financialMarketSummary || "정상";
      els.diagBondYieldValue.textContent = percent(state.metrics.bondYield, 2);
      els.diagCreditSpreadValue.textContent = `${round(state.metrics.creditSpread, 2).toFixed(2)}%p`;
      els.diagBankingCrisisRiskValue.textContent = state.metrics.bankingCrisisRiskLabel;

      const warnings = [];
      if (avgUnemployment > 20) warnings.push("실업 고착 위험");
      if (hiringFreezeRatio > 40) warnings.push("기업 채용 동결 과다");
      if (inventoryDemandRatio > 3) warnings.push("재고 과잉");
      if (firmStressRatio > 35) warnings.push("금융 스트레스 과다");
      if (state.metrics.fiscalSpaceScore < 0.25) warnings.push("재정 여력 위험");
      if (state.metrics.averageHouseholdDebtBurden > 18) warnings.push("가계 부채부담 높음");
      if (state.metrics.averageFirmDSCR < 1.2) warnings.push("기업 상환능력 약함");
      if (state.metrics.housingAffordability > 1.65) warnings.push("주택구입부담 높음");
      if (state.metrics.assetBubbleRiskScore > 0.65) warnings.push("자산 버블 위험");
      if (state.metrics.creditSpread > 5.5) warnings.push("신용스프레드 확대");
      if (state.metrics.bankingCrisisRiskScore > 0.55) warnings.push("은행 스트레스 위험");
      if (state.metrics.creditCrunchRisk > 0.55) warnings.push("신용경색 위험");
      if (state.metrics.creditExcessRisk > 0.58) warnings.push("신용 과다 누적");
      if (state.metrics.bondMarketStress > 0.55) warnings.push("국채시장 스트레스");
      if (state.metrics.depositorConfidence < 0.58 || state.metrics.interbankTrust < 0.58) warnings.push("은행 심리 위축");
      if (state.metrics.bondYield > state.metrics.interestRatePercent + 3.5 && state.metrics.debtToGdpRatio > 0.9) warnings.push("국채금리 부담");
      if (state.metrics.commercialVacancy > 18) warnings.push("상업용 공실률 상승");
      if (state.metrics.collateralValueIndex < 90) warnings.push("담보가치 하락");
      if (state.metrics.opaqueFirmRatio > 35) warnings.push("기업 정보 불투명성 높음");
      if (state.metrics.stockCrashFirmCount > Math.max(1, state.producers.length * 0.2)) warnings.push("기업 주가 급락 확산");
      if (state.metrics.lowIncomeStress > 0.62) warnings.push("저소득층 물가 부담");
      if (state.metrics.middleClassMortgageStress > 0.62) warnings.push("중산층 주거비 부담");
      if (state.metrics.classSentimentGap > 0.34) warnings.push("계층별 심리 격차");
      if (state.metrics.hiddenVulnerabilityIndex > 0.58) warnings.push(`${state.metrics.dominantVulnerability || "경제"} 취약성 누적`);
      warnings.push(...getModelHealthWarnings().slice(0, Math.max(0, 3 - warnings.length)));
      const macroState = classifyMacroState({
        unemployment: avgUnemployment,
        inflation: avgInflation,
        outputGap: state.metrics.outputGap,
        inventoryDemandRatio,
        firmStressRatio,
        hiringFreezeRatio,
        policyGap: state.metrics.policyGap,
        gdpGrowth: getGDPGrowthWindow()
      });
      let summary = `${macroState.state}: ${macroState.cause}`;
      if (avgUnemployment > 20 && hiringFreezeRatio > 40) {
        summary = "실업 고착 위험: 채용 동결 기업 비율이 높습니다.";
      } else if (avgUnemployment > 20) {
        summary = "실업 고착 위험: 평균 실업률이 높습니다.";
      } else if (inventoryDemandRatio > 3) {
        summary = "재고 과잉으로 기업 고용이 약해질 수 있습니다.";
      } else if (firmStressRatio > 35) {
        summary = "금융 스트레스가 높아 투자 회복이 느립니다.";
      } else if (hiringFreezeRatio > 40) {
        summary = "기업 채용 동결 비율이 높아 고용 회복이 느립니다.";
      } else if (state.metrics.fiscalSpaceScore < 0.25) {
        summary = "정부 부채비율이 높아 재정 여력이 제한적입니다.";
      } else if (state.metrics.averageHouseholdDebtBurden > 18) {
        summary = "금리 상승이 가계 부채상환 부담을 키워 소비를 압박합니다.";
      } else if (state.metrics.averageFirmDSCR < 1.2) {
        summary = "법인세와 부채상환 부담으로 기업 투자 여력이 낮습니다.";
      } else if (state.metrics.hiddenVulnerabilityIndex > 0.58) {
        summary = `GDP는 안정적일 수 있지만 ${state.metrics.dominantVulnerability || "일부 부문"} 취약성이 누적되어 충격 민감도가 높습니다.`;
      } else if (state.metrics.lowIncomeStress > 0.62) {
        summary = "저소득층 물가·임대료 부담이 총수요 회복을 제한할 수 있습니다.";
      } else if (state.metrics.middleClassMortgageStress > 0.62) {
        summary = "중산층 주택담보 부담이 높아 소비 둔화 위험이 있습니다.";
      } else if (state.metrics.assetBubbleRiskScore > 0.65) {
        summary = "자산가격 상승이 소비심리를 보강하지만 버블 위험도 커지고 있습니다.";
      } else if (state.metrics.housingAffordability > 1.65) {
        summary = "부동산 가격과 금리 부담이 주거비 부담을 높이고 있습니다.";
      } else if (state.metrics.bankingCrisisRiskScore > 0.55) {
        summary = "은행 건전성이 약해져 신용공급이 위축될 수 있습니다.";
      } else if (state.metrics.creditSpread > 5.5) {
        summary = "신용스프레드 확대가 투자와 차입을 둔화시키고 있습니다.";
      } else if (state.metrics.collateralValueIndex < 90) {
        summary = "담보가치 하락이 은행 위험선호와 신용공급을 압박하고 있습니다.";
      } else if (state.metrics.commercialVacancy > 18) {
        summary = "상업용 공실률 상승이 기업 담보가치와 은행 건전성을 압박합니다.";
      } else if (state.metrics.stockCrashFirmCount > Math.max(1, state.producers.length * 0.2)) {
        summary = "개별 기업 주가 조정이 투자심리와 자금조달 여건을 약화시키고 있습니다.";
      }
      els.diagBalanceSummaryValue.textContent = summary;
      els.diagWarningsValue.textContent = warnings.length ? warnings.join(" · ") : "경고 없음";
      els.diagWarningsValue.classList.toggle("has-warning", warnings.length > 0);
    }

    function getModelHealthWarnings(rows = null) {
      const data = rows && rows.length ? rows : state.history.slice(-TICKS_PER_MONTH * 36);
      const warnings = [];
      if (!data.length) {
        if (state.metrics.unemploymentRate < 8 && state.metrics.firmStressRatio > 55) warnings.push("모델 경고: 실업률은 낮지만 기업 스트레스가 과도합니다.");
        return warnings;
      }
      const avgUnemployment = average(data.map((row) => safeNumber(row.unemploymentRate, 0)));
      const avgFirmStress = average(data.map((row) => safeNumber(row.firmStressRatio, safeNumber(row.debtStressedFirmRatio, 0))));
      const avgBankStress = average(data.map((row) => safeNumber(row.bankStress, 0)));
      const avgCreditSupply = average(data.map((row) => safeNumber(row.creditSupplyIndex, 100)));
      const creditSupplyRange = Math.max(...data.map((row) => safeNumber(row.creditSupplyIndex, 100))) - Math.min(...data.map((row) => safeNumber(row.creditSupplyIndex, 100)));
      const avgInflationAbs = average(data.map((row) => Math.abs(safeNumber(row.inflation, 0))));
      const stockGrowth = data.length > 1 ? safeNumber(data[data.length - 1].stockIndexPoints, 2500) / Math.max(1, safeNumber(data[0].stockIndexPoints, 2500)) : 1;
      const gdpGrowth = data.length > 1 ? safeNumber(data[data.length - 1].gdp, 1) / Math.max(1, safeNumber(data[0].gdp, 1)) : 1;
      if (avgUnemployment < 8 && avgFirmStress > 55) warnings.push("모델 경고: 실업률은 낮지만 기업 스트레스가 과도합니다.");
      if (stockGrowth > Math.max(1.8, gdpGrowth * 1.7)) warnings.push("모델 경고: 자산가격이 GDP보다 지나치게 빠르게 상승합니다.");
      if (avgBankStress > 0.90) warnings.push("모델 경고: 은행 스트레스가 장기간 90% 이상입니다.");
      if (creditSupplyRange < 2 && avgCreditSupply < 82) warnings.push("모델 경고: 신용공급이 장기간 고정되어 있습니다.");
      if (avgInflationAbs < 0.25 && data.length >= TICKS_PER_MONTH * 12) warnings.push("모델 경고: 물가가 장기간 0% 근처에 고정되어 있습니다.");
      const avgHiddenVulnerability = average(data.map((row) => safeNumber(row.hiddenVulnerabilityIndex, 0)));
      if (avgHiddenVulnerability > 0.65 && avgUnemployment < 9) warnings.push("모델 경고: 헤드라인은 안정적이지만 숨은 취약성이 과도합니다.");
      return warnings.slice(0, 3);
    }

    function getBalanceDiagnosticSnapshot() {
      const producerCount = Math.max(1, state.producers.length);
      const hiringFreezeRatio = state.producers.filter((producer) => (producer.hiringFreezeTicks || 0) > 0).length / producerCount * 100;
      const firmStressRatio = state.producers.filter(isFirmActuallyStressed).length / producerCount * 100;
      const inventoryDemandRatio = average(state.producers.map((producer) => producer.inventory / Math.max(1, producer.expectedDemand)));
      return {
        unemploymentRate: safeNumber(state.metrics.unemploymentRate, 0),
        inflation: safeNumber(state.metrics.inflation, 0),
        gdp: safeNumber(state.metrics.gdp, 0),
        consumption: safeNumber(state.metrics.consumption, 0),
        valueAddedTaxCollected: safeNumber(state.metrics.valueAddedTaxCollected, 0),
        householdIncomeTaxCollected: safeNumber(state.metrics.householdIncomeTaxCollected, 0),
        corporateTaxCollected: safeNumber(state.metrics.corporateTaxCollected, 0),
        taxCollected: safeNumber(state.metrics.taxCollected, 0),
        householdTaxPressure: safeNumber(state.metrics.householdTaxPressure, 0),
        consumptionTaxPain: safeNumber(state.metrics.consumptionTaxPain, 0),
        corporateTaxPressure: safeNumber(state.metrics.corporateTaxPressure, 0),
        taxPolicyCredibility: safeNumber(state.metrics.taxPolicyCredibility, 0.75),
        taxSentimentScore: safeNumber(state.metrics.taxSentimentScore, 0.25),
        buybackDividendSpending: safeNumber(state.metrics.buybackDividendSpending, 0),
        debtRepaymentAllocation: safeNumber(state.metrics.debtRepaymentAllocation, 0),
        retainedEarningsAllocation: safeNumber(state.metrics.retainedEarningsAllocation, 0),
        investmentConversionRate: safeNumber(state.metrics.investmentConversionRate, 0),
        buybackPayoutRatio: safeNumber(state.metrics.buybackPayoutRatio, 0),
        sectorTotalProfit: safeNumber(state.metrics.sectorTotalProfit, 0),
        sectorTotalInvestment: safeNumber(state.metrics.sectorTotalInvestment, 0),
        marketEfficiency: safeNumber(state.metrics.marketEfficiency, 0.62),
        marketFailureRisk: safeNumber(state.metrics.marketFailureRisk, 0.22),
        marketSuccessScore: safeNumber(state.metrics.marketSuccessScore, 0.50),
        allocationQuality: safeNumber(state.metrics.allocationQuality, 0.62),
        marketFailureType: state.metrics.marketFailureType || "없음",
        marketSuccessType: state.metrics.marketSuccessType || "형성 중",
        historicalScenarioActive: safeNumber(state.metrics.historicalScenarioActive, 0),
        historicalScenarioIntensity: safeNumber(state.metrics.historicalScenarioIntensity, 0),
        historicalScenarioKey: state.metrics.historicalScenarioKey || "",
        historicalScenarioLabel: state.metrics.historicalScenarioLabel || "비활성",
        historicalScenarioPhase: state.metrics.historicalScenarioPhase || "비활성",
        historicalScenarioShock: state.metrics.historicalScenarioShock || "없음",
        outputGap: safeNumber(state.metrics.outputGap, 0),
        unemploymentGap: safeNumber(state.metrics.unemploymentGap, 0),
        inflationGap: safeNumber(state.metrics.inflationGap, 0),
        capacityUtilization: safeNumber(state.metrics.capacityUtilization, 0),
        policyGap: safeNumber(state.metrics.policyGap, 0),
        realWageGrowth: safeNumber(state.metrics.realWageGrowth, 0),
        financialConditionIndex: safeNumber(state.metrics.financialConditionIndex, 0),
        averageConfidence: safeNumber(state.metrics.averageConfidence, 0),
        averageBusinessOutlook: safeNumber(state.metrics.averageBusinessOutlook, 0),
        debtToGdpRatio: safeNumber(state.metrics.debtToGdpRatio, 0),
        fiscalSpaceScore: safeNumber(state.metrics.fiscalSpaceScore, 1),
        averageHouseholdDebtBurden: safeNumber(state.metrics.averageHouseholdDebtBurden, 0),
        debtServiceBurden: safeNumber(state.metrics.debtServiceBurden, 0),
        averageFirmDSCR: safeNumber(state.metrics.averageFirmDSCR, 99),
        debtStressedHouseholdRatio: safeNumber(state.metrics.debtStressedHouseholdRatio, 0),
        debtStressedFirmRatio: safeNumber(state.metrics.debtStressedFirmRatio, 0),
        stockIndex: safeNumber(state.metrics.stockIndex, 100),
        stockIndexPoints: safeNumber(state.metrics.stockIndexPoints, 2500),
        housingIndex: safeNumber(state.metrics.housingIndex, 100),
        stockReturn: safeNumber(state.metrics.stockReturn, 0),
        stockMonthlyReturn: safeNumber(state.metrics.stockMonthlyReturn, 0),
        stockVolatility: safeNumber(state.metrics.stockVolatility, 0),
        stockValuationPressure: safeNumber(state.metrics.stockValuationPressure, 0),
        stockRiskSentiment: safeNumber(state.metrics.stockRiskSentiment, 0.65),
        stockDrawdown: safeNumber(state.metrics.stockDrawdown, 0),
        residentialIndex: safeNumber(state.metrics.residentialIndex, state.metrics.housingIndex || 100),
        commercialIndex: safeNumber(state.metrics.commercialIndex, 100),
        residentialReturn: safeNumber(state.metrics.residentialReturn, state.metrics.housingReturn || 0),
        commercialReturn: safeNumber(state.metrics.commercialReturn, 0),
        commercialVacancy: safeNumber(state.metrics.commercialVacancy, 8),
        collateralValueIndex: safeNumber(state.metrics.collateralValueIndex, 100),
        realEstateStress: safeNumber(state.metrics.realEstateStress, 0),
        averageFirmStockPrice: safeNumber(state.metrics.averageFirmStockPrice, 100),
        averageFirmStockReturn: safeNumber(state.metrics.averageFirmStockReturn, 0),
        firmStockVolatility: safeNumber(state.metrics.firmStockVolatility, 0),
        opaqueFirmRatio: safeNumber(state.metrics.opaqueFirmRatio, 0),
        stockCrashFirmCount: safeNumber(state.metrics.stockCrashFirmCount, 0),
        averageFirmValuationPressure: safeNumber(state.metrics.averageFirmValuationPressure, state.metrics.stockValuationPressure || 0),
        housingReturn: safeNumber(state.metrics.housingReturn, 0),
        wealthEffect: safeNumber(state.metrics.wealthEffect, 0),
        housingAffordability: safeNumber(state.metrics.housingAffordability, 1),
        averageMortgageBurden: safeNumber(state.metrics.averageMortgageBurden, 0),
        negativeEquityRatio: safeNumber(state.metrics.negativeEquityRatio, 0),
        assetBubbleRiskScore: safeNumber(state.metrics.assetBubbleRiskScore, 0),
        interestRatePercent: safeNumber(state.metrics.interestRatePercent, 0),
        shortTermRate: safeNumber(state.metrics.shortTermRate, 0),
        treasuryBill3M: safeNumber(state.metrics.treasuryBill3M, state.metrics.shortTermRate || 0),
        bondYield2Y: safeNumber(state.metrics.bondYield2Y, 0),
        bondYield5Y: safeNumber(state.metrics.bondYield5Y, state.metrics.bondYield10Y || 0),
        bondYield10Y: safeNumber(state.metrics.bondYield10Y, state.metrics.bondYield || 0),
        bondYield30Y: safeNumber(state.metrics.bondYield30Y, state.metrics.bondYield10Y || state.metrics.bondYield || 0),
        loanRate: safeNumber(state.metrics.loanRate, 0),
        mortgageRate: safeNumber(state.metrics.mortgageRate, 0),
        corporateLoanRate: safeNumber(state.metrics.corporateLoanRate, 0),
        depositRate: safeNumber(state.metrics.depositRate, 0),
        realPolicyRate: safeNumber(state.metrics.realPolicyRate, 0),
        realLoanRate: safeNumber(state.metrics.realLoanRate, 0),
        termSpread: safeNumber(state.metrics.termSpread, 0),
        sovereignRiskPremium: safeNumber(state.metrics.sovereignRiskPremium, 0),
        termPremium: safeNumber(state.metrics.termPremium, 0),
        durationRiskPremium: safeNumber(state.metrics.durationRiskPremium, 0),
        bondMarketLiquidity: safeNumber(state.metrics.bondMarketLiquidity, 0.86),
        rateUncertainty: safeNumber(state.metrics.rateUncertainty, 0),
        policySurpriseRate: safeNumber(state.metrics.policySurpriseRate, 0),
        bankNetInterestMargin: safeNumber(state.metrics.bankNetInterestMargin, 0),
        governmentAverageFundingRate: safeNumber(state.metrics.governmentAverageFundingRate, 0),
        bondYield: safeNumber(state.metrics.bondYield, 0),
        shortBondPriceIndex: safeNumber(state.metrics.shortBondPriceIndex, 100),
        mediumBondPriceIndex: safeNumber(state.metrics.mediumBondPriceIndex, 100),
        longBondPriceIndex: safeNumber(state.metrics.longBondPriceIndex, 100),
        bondMarketStress: safeNumber(state.metrics.bondMarketStress, 0.10),
        flightToQualityDemand: safeNumber(state.metrics.flightToQualityDemand, 0),
        creditSpread: safeNumber(state.metrics.creditSpread, 0),
        bankHealthIndex: safeNumber(state.metrics.bankHealthIndex, 100),
        creditSupplyIndex: safeNumber(state.metrics.creditSupplyIndex, 100),
        depositorConfidence: safeNumber(state.metrics.depositorConfidence, 0.88),
        interbankTrust: safeNumber(state.metrics.interbankTrust, 0.84),
        bankFundingPressure: safeNumber(state.metrics.bankFundingPressure, 0.12),
        creditOfficerCaution: safeNumber(state.metrics.creditOfficerCaution, 0.28),
        bankCapitalConfidence: safeNumber(state.metrics.bankCapitalConfidence, 0.82),
        loanDemandIndex: safeNumber(state.metrics.loanDemandIndex, 100),
        riskUnderpricing: safeNumber(state.metrics.riskUnderpricing, 0.12),
        creditCyclePhase: state.metrics.creditCyclePhase || "정상",
        creditGap: safeNumber(state.metrics.creditGap, 0),
        privateLeveragePressure: safeNumber(state.metrics.privateLeveragePressure, 0.18),
        underwritingQuality: safeNumber(state.metrics.underwritingQuality, 0.76),
        creditExcessRisk: safeNumber(state.metrics.creditExcessRisk, 0.12),
        creditCrunchRisk: safeNumber(state.metrics.creditCrunchRisk, 0.12),
        creditEventIntensity: safeNumber(state.creditCycle?.eventIntensity, 0),
        bankStress: safeNumber(state.metrics.bankStress, 0),
        bankingCrisisRiskScore: safeNumber(state.metrics.bankingCrisisRiskScore, 0),
        safeHavenDemand: safeNumber(state.metrics.safeHavenDemand, 0),
        goldIndex: safeNumber(state.metrics.goldIndex, 100),
        silverIndex: safeNumber(state.metrics.silverIndex, 100),
        consumerSentiment: safeNumber(state.metrics.consumerSentiment, 0.8),
        businessSentiment: safeNumber(state.metrics.businessSentiment, 0.8),
        bankRiskAppetite: safeNumber(state.metrics.bankRiskAppetite, 0.7),
        marketRiskSentiment: safeNumber(state.metrics.marketRiskSentiment, 0.7),
        fearGreedIndex: safeNumber(state.metrics.fearGreedIndex, 50),
        stockVolatilityIndex: safeNumber(state.metrics.stockVolatilityIndex, 18),
        rumorIntensity: safeNumber(state.metrics.rumorIntensity, 0),
        informationUncertainty: safeNumber(state.metrics.informationUncertainty, 0.16),
        misperceptionIndex: safeNumber(state.metrics.misperceptionIndex, 0.12),
        policyClarity: safeNumber(state.metrics.policyClarity, 0.78),
        expectationError: safeNumber(state.metrics.expectationError, 0),
        marketOverreaction: safeNumber(state.metrics.marketOverreaction, 0.1),
        realEstateNeverFallsBelief: safeNumber(state.metrics.realEstateNeverFallsBelief, 0.46),
        stockMarketNeverFailsBelief: safeNumber(state.metrics.stockMarketNeverFailsBelief, 0.46),
        herdIntensity: safeNumber(state.metrics.herdIntensity, 0.18),
        fomoIntensity: safeNumber(state.metrics.fomoIntensity, 0.12),
        lossAversion: safeNumber(state.metrics.lossAversion, 0.55),
        confirmationBias: safeNumber(state.metrics.confirmationBias, 0.35),
        panicSellingPressure: safeNumber(state.metrics.panicSellingPressure, 0.05),
        behavioralMispricingIndex: safeNumber(state.metrics.behavioralMispricingIndex, 0),
        housingMispricing: safeNumber(state.metrics.housingMispricing, 0),
        stockMispricing: safeNumber(state.metrics.stockMispricing, 0),
        beliefBreakRisk: safeNumber(state.metrics.beliefBreakRisk, 0),
        beliefBreakdownMonths: safeNumber(state.metrics.beliefBreakdownMonths, 0),
        sentimentInflationExpectations: safeNumber(state.metrics.sentimentInflationExpectations, TARGET_INFLATION),
        recessionFear: safeNumber(state.metrics.recessionFear, 0.2),
        fiscalCredibility: safeNumber(state.metrics.fiscalCredibility, 0.75),
        incomeInequality: safeNumber(state.metrics.incomeInequality, 0),
        wealthInequality: safeNumber(state.metrics.wealthInequality, 0),
        lowIncomeConsumptionCapacity: safeNumber(state.metrics.lowIncomeConsumptionCapacity, 1),
        middleClassHousingBurden: safeNumber(state.metrics.middleClassHousingBurden, 0),
        highIncomeWealthEffect: safeNumber(state.metrics.highIncomeWealthEffect, 0),
        wealthyAssetEffect: safeNumber(state.metrics.wealthyAssetEffect, 0),
        socialStressIndex: safeNumber(state.metrics.socialStressIndex, 0),
        lowIncomeStress: safeNumber(state.metrics.lowIncomeStress, 0),
        middleClassMortgageStress: safeNumber(state.metrics.middleClassMortgageStress, 0),
        highIncomeTaxStress: safeNumber(state.metrics.highIncomeTaxStress, 0),
        wealthyAssetStress: safeNumber(state.metrics.wealthyAssetStress, 0),
        renterStress: safeNumber(state.metrics.renterStress, 0),
        homeownerDebtStress: safeNumber(state.metrics.homeownerDebtStress, 0),
        classSentimentGap: safeNumber(state.metrics.classSentimentGap, 0),
        mainPressureClass: state.metrics.mainPressureClass || "없음",
        householdVulnerability: safeNumber(state.metrics.householdVulnerability, 0),
        firmVulnerability: safeNumber(state.metrics.firmVulnerability, 0),
        bankVulnerability: safeNumber(state.metrics.bankVulnerability, 0),
        housingVulnerability: safeNumber(state.metrics.housingVulnerability, 0),
        stockVulnerability: safeNumber(state.metrics.stockVulnerability, 0),
        fiscalVulnerability: safeNumber(state.metrics.fiscalVulnerability, 0),
        externalVulnerability: safeNumber(state.metrics.externalVulnerability, 0),
        hiddenVulnerabilityIndex: safeNumber(state.metrics.hiddenVulnerabilityIndex, 0),
        dominantVulnerability: state.metrics.dominantVulnerability || "없음",
        agricultureStress: safeNumber(state.metrics.agricultureStress, sectorStressValue("agriculture")),
        energyStress: safeNumber(state.metrics.energyStress, sectorStressValue("energy")),
        exchangeRateIndex: safeNumber(state.metrics.exchangeRateIndex, 100),
        foreignConsumerDemand: safeNumber(state.metrics.foreignConsumerDemand, 100),
        foreignInvestorSentiment: safeNumber(state.metrics.foreignInvestorSentiment, 0.72),
        foreignBondDemand: safeNumber(state.metrics.foreignBondDemand, 0.74),
        foreignSupplierPressure: safeNumber(state.metrics.foreignSupplierPressure, 0.18),
        foreignCapitalFlow: safeNumber(state.metrics.foreignCapitalFlow, 0),
        exportConsumerDemand: safeNumber(state.metrics.exportConsumerDemand, state.metrics.exportDemand || 100),
        importPriceIndex: safeNumber(state.metrics.importPriceIndex, 100),
        commodityPriceIndex: safeNumber(state.metrics.commodityPriceIndex, 100),
        energyPriceIndex: safeNumber(state.metrics.energyPriceIndex, 100),
        tradeBalance: safeNumber(state.metrics.tradeBalance, 0),
        importInflationPressure: safeNumber(state.metrics.importInflationPressure, 0),
        commodityCostPressure: safeNumber(state.metrics.commodityCostPressure, 0),
        centralBankCredibility: safeNumber(state.metrics.centralBankCredibility, 0.78),
        expectedRatePath: safeNumber(state.metrics.expectedRatePath, NEUTRAL_INTEREST_RATE),
        forwardGuidanceClarity: safeNumber(state.metrics.forwardGuidanceClarity, 0.76),
        inflationTargetCredibility: safeNumber(state.metrics.inflationTargetCredibility, 0.80),
        policySurprise: safeNumber(state.metrics.policySurprise, 0),
        averageCreditRatingScore: safeNumber(state.metrics.averageCreditRatingScore, 3),
        distressedFirmRatio: safeNumber(state.metrics.distressedFirmRatio, 0),
        zombieFirmRatio: safeNumber(state.metrics.zombieFirmRatio, 0),
        averageDefaultRisk: safeNumber(state.metrics.averageDefaultRisk, 0),
        mostStressedSector: state.metrics.mostStressedSector || "없음",
        manufacturingStress: sectorStressValue("manufacturing"),
        servicesStress: sectorStressValue("services"),
        constructionStress: sectorStressValue("construction"),
        financialSectorStress: sectorStressValue("financial"),
        technologyStress: sectorStressValue("technology"),
        hiringFreezeRatio,
        firmStressRatio,
        inventoryDemandRatio
      };
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
        taxRevenue: safeNumber(m.taxCollected, 0) + safeNumber(m.corporateTaxCollected, 0) + safeNumber(m.vatRevenue, 0),
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

    function classifyMacroState(input = {}) {
      const unemployment = safeNumber(input.unemployment, state.metrics.unemploymentRate || TARGET_UNEMPLOYMENT);
      const inflation = safeNumber(input.inflation, state.metrics.inflation || TARGET_INFLATION);
      const outputGap = safeNumber(input.outputGap, state.metrics.outputGap || 0);
      const inventoryDemandRatio = safeNumber(input.inventoryDemandRatio, state.metrics.inventoryToDemand || 1);
      const firmStressRatio = safeNumber(input.firmStressRatio, state.producers.length ? state.producers.filter(isFirmActuallyStressed).length / state.producers.length * 100 : 0);
      const hiringFreezeRatio = safeNumber(input.hiringFreezeRatio, state.producers.length ? state.producers.filter((producer) => (producer.hiringFreezeTicks || 0) > 0).length / state.producers.length * 100 : 0);
      const policyGap = safeNumber(input.policyGap, state.metrics.policyGap || 0);
      const gdpGrowth = safeNumber(input.gdpGrowth, getGDPGrowthWindow());
      const unemploymentGap = unemployment - TARGET_UNEMPLOYMENT;
      const inflationGap = inflation - TARGET_INFLATION;
      const historical = state.historicalScenario || createInitialHistoricalScenario();

      if (historical.key && safeNumber(state.metrics.historicalScenarioIntensity, historical.intensity) > 0.30) {
        const historicalMessages = {
          koreaImf1997: {
            state: "외환위기형 긴축",
            cause: "해외 자금 신뢰 약화와 환율 급등이 고금리·신용경색으로 이어지는 역사 시나리오가 작동 중입니다.",
            risk: "기업 DSCR과 은행 신뢰가 먼저 악화되고, 고용은 몇 개월 지연되어 둔화될 수 있습니다.",
            hint: "환율, 해외 채권수요, 은행 간 신뢰, 수출 제조업 회복 여부를 같이 보세요."
          },
          usFinancialCrisis2007: {
            state: "주택담보 신용위기",
            cause: "주택가격 하락과 담보가치 약화가 은행 간 신뢰와 신용공급을 동시에 압박하고 있습니다.",
            risk: "투자 둔화가 고용 악화보다 먼저 나타나고, 부동산 손실이 은행 심리로 전이될 수 있습니다.",
            hint: "담보가치, 상업·주거용 부동산 수익률, 신용스프레드를 함께 확인하세요."
          },
          japanBubbleEconomy: {
            state: "자산버블 붕괴 위험",
            cause: "저금리와 자산 불패 믿음이 신용 과다와 부동산·주식 가격 괴리를 누적시키고 있습니다.",
            risk: "단기 GDP는 안정적으로 보여도 금리 정상화나 신용심사 강화 시 조정 취약성이 커질 수 있습니다.",
            hint: "신용갭, 위험 과소평가, 주식·부동산 mispricing을 중심으로 보세요."
          },
          germanyReunification: {
            state: "재정이전형 성장",
            cause: "대규모 정부지출과 건설 수요가 단기 총수요를 지지하지만 임금-생산성 괴리와 재정 부담이 동반됩니다.",
            risk: "건설·서비스는 좋아질 수 있지만 중기적으로 재정 여력과 특정 산업 경쟁력이 약해질 수 있습니다.",
            hint: "정부지출, 생산성, 건설 스트레스, 부채/GDP를 함께 확인하세요."
          },
          turkiyeInflation2018: {
            state: "고물가·환율 불안",
            cause: "환율 약세가 수입물가와 기대인플레이션을 밀어 올리고 고금리 부담이 소비와 투자를 누르고 있습니다.",
            risk: "저소득층 실질소비와 수입비용 노출 기업이 먼저 압박받을 수 있습니다.",
            hint: "환율, 수입물가, 기대인플레이션, 실질금리를 같이 보세요."
          }
        };
        return historicalMessages[historical.key] || {
          state: "역사 시나리오 진행 중",
          cause: "선택한 역사 시나리오의 단계별 충격이 기존 거시·금융 경로에 반영되고 있습니다.",
          risk: "충격은 즉시 붕괴보다 신용, 심리, 대외 지표를 통해 지연 전이됩니다.",
          hint: "역사 시나리오 상태와 전달 경로를 함께 확인하세요."
        };
      }

      if (state.metrics.creditCrunchRisk > 0.60 || (state.metrics.creditSupplyIndex < 72 && state.metrics.creditOfficerCaution > 0.55)) {
        return {
          state: "신용경색 위험",
          cause: "예금자 신뢰와 은행 간 신뢰가 약해지고 여신심사가 보수화되면서 신용공급이 빠르게 조여지고 있습니다.",
          risk: "기업 투자가 고용보다 먼저 둔화되고, 이후 매출 기대와 채용 계획이 늦게 약해질 수 있습니다.",
          hint: "기준금리보다 대출금리, 신용스프레드, 은행 자금조달 압력을 함께 보세요."
        };
      }
      if (state.metrics.creditExcessRisk > 0.62 || (state.metrics.riskUnderpricing > 0.55 && state.metrics.creditGap > 0.20)) {
        return {
          state: "신용 과다 누적",
          cause: "신용공급은 원활하지만 위험이 과소평가되고 심사품질이 낮아져 레버리지와 자산 취약성이 누적되고 있습니다.",
          risk: "단기 성장은 좋아 보여도 금리 상승이나 자산가격 조정 시 부실이 뒤늦게 확대될 수 있습니다.",
          hint: "신용갭, 인수심사 품질, 자산가격 괴리를 함께 확인하세요."
        };
      }
      if (state.metrics.bondMarketStress > 0.58 || state.metrics.longBondPriceIndex < 82) {
        return {
          state: "국채시장 스트레스",
          cause: "장기채 가격 하락과 국채시장 유동성 약화가 장기금리와 정부 조달비용을 밀어 올리고 있습니다.",
          risk: "주택담보금리, 성장기업 밸류에이션, 재정 이자비용에 동시에 압력이 생길 수 있습니다.",
          hint: "3개월~30년 수익률곡선과 장기채 가격지수를 같이 보세요."
        };
      }
      if (state.metrics.depositorConfidence < 0.50 || state.metrics.interbankTrust < 0.50 || state.metrics.bankFundingPressure > 0.58) {
        return {
          state: "은행 심리 위축",
          cause: "은행 건전성 자체보다 예금자 신뢰, 은행 간 신뢰, 자금조달 압력이 먼저 악화되고 있습니다.",
          risk: "신용스프레드가 확대되고 대출태도가 보수화되어 투자 둔화가 선행될 수 있습니다.",
          hint: "은행 심리 지표와 실제 신용공급지수를 분리해서 확인하세요."
        };
      }
      if (state.metrics.bondYield30Y > state.metrics.bondYield10Y + 1.5 || state.metrics.bondYield30Y > 8.0) {
        return {
          state: "장기금리 충격",
          cause: "30년물 장기금리가 상승하면서 장기 투자와 부동산 가치평가에 더 큰 할인율 압력이 생겼습니다.",
          risk: "주택담보 부담, 성장기업 투자심리, 정부 평균 조달금리가 지연 상승할 수 있습니다.",
          hint: "장기금리와 주택담보금리, 장기채 가격 하락을 함께 확인하세요."
        };
      }
      if (state.metrics.safeHavenDemand > 55 && state.metrics.flightToQualityDemand > 0.42) {
        return {
          state: "안전자산 선호형 긴축",
          cause: "안전자산 선호가 높아지며 위험회피 심리와 국채시장 변동성이 금융여건을 조이고 있습니다.",
          risk: "주식·부동산 심리와 은행 위험선호가 함께 약해져 신용경로가 좁아질 수 있습니다.",
          hint: "금·은 가격보다 신용스프레드와 은행 위험선호의 동반 변화를 보세요."
        };
      }
      if (state.metrics.consumptionTaxPain > 0.58 && state.metrics.lowIncomeStress > 0.48) {
        return {
          state: "부가세 부담형 소비둔화",
          cause: "부가세가 소비자가 보는 체감가격을 높이면서 저소득층 소비여력과 생활비 심리를 먼저 압박하고 있습니다.",
          risk: "기업 매출은 명목상 버텨 보여도 순수 민간수요와 내수 회복력은 약해질 수 있습니다.",
          hint: "부가세 수입, 저소득층 소비여력, 물가 기대를 함께 보세요."
        };
      }
      if (state.metrics.corporateTaxPressure > 0.62 && state.metrics.investmentConversionRate < 0.24) {
        return {
          state: "법인세 부담형 투자둔화",
          cause: "법인세 부담과 약한 세후이익이 기업의 내부자금 여력을 낮춰 투자 전환율을 떨어뜨리고 있습니다.",
          risk: "수요가 약한 국면에서는 생산보다 투자와 채용 계획이 먼저 보수화될 수 있습니다.",
          hint: "법인세율 자체보다 세후이익, 투자 전환율, 신용공급을 같이 확인하세요."
        };
      }
      if (state.metrics.buybackPayoutRatio > 0.34 && state.metrics.investmentConversionRate < 0.24) {
        return {
          state: "자사주 우선 배분",
          cause: "기업이 늘어난 세후현금을 설비투자보다 자사주·배당, 부채상환, 현금보유에 우선 배분하고 있습니다.",
          risk: "주가지수와 자산가 심리는 단기 지지될 수 있지만 고용과 생산능력 확대로 이어지는 힘은 제한적입니다.",
          hint: "법인세 인하 효과는 수요전망과 신용여건이 좋아야 투자로 전환됩니다."
        };
      }
      if (state.metrics.taxSentimentScore > 0.62 && state.metrics.classSentimentGap > 0.30) {
        return {
          state: "세금 체감 격차 확대",
          cause: "부가세, 소득세, 법인세가 계층별로 다른 경로를 통해 심리와 소비·투자 의사결정에 전달되고 있습니다.",
          risk: "헤드라인 세수는 안정적이어도 저소득층 체감물가와 고소득층 세후소득 불만이 동시에 커질 수 있습니다.",
          hint: "세수 구성과 계층별 소비여력, 세금 체감 지표를 함께 확인하세요."
        };
      }
      if (state.metrics.marketFailureRisk > 0.62) {
        return {
          state: "시장 실패 위험",
          cause: `${state.metrics.marketFailureType || "정보·신용·외부비용"} 경로가 자원배분을 왜곡해 시장 효율성이 약해지고 있습니다.`,
          risk: "GDP가 버텨도 신용, 가격, 정보, 불평등 경로에서 숨은 비용이 누적될 수 있습니다.",
          hint: "시장 평가의 실패유형과 배분품질, 신용갭을 함께 확인하세요."
        };
      }
      if (state.metrics.marketSuccessScore > 0.72 && state.metrics.marketFailureRisk < 0.35) {
        return {
          state: state.metrics.marketSuccessType === "생산성 개선" ? "생산성 기반 성장" : "시장 기능 개선",
          cause: `${state.metrics.marketSuccessType || "균형 성장"} 경로가 작동하며 신용공급, 투자효율, 물가 안정이 함께 개선되고 있습니다.`,
          risk: "성공 국면에서도 자산가격과 신용 과다로 전환되는지 점검해야 합니다.",
          hint: "시장 성공점수와 실패위험이 동시에 낮게 유지되는지 보세요."
        };
      }
      if (state.metrics.foreignInvestorSentiment < 0.42 || state.metrics.foreignBondDemand < 0.42) {
        return {
          state: "해외자본 유출 압력",
          cause: "해외 투자심리나 해외 채권수요가 약해져 환율과 장기금리 압력이 동시에 커지고 있습니다.",
          risk: "수입물가, 정부 조달비용, 주식시장 심리가 함께 악화될 수 있습니다.",
          hint: "외국 부문의 투자심리, 채권수요, 환율지수를 같이 보세요."
        };
      }
      if (state.metrics.agricultureStress > 0.62) {
        return {
          state: "농업 공급 충격",
          cause: "농업 부문의 비용과 공급 스트레스가 식품가격과 저소득층 체감물가에 먼저 전달되고 있습니다.",
          risk: "헤드라인 물가보다 생활물가 부담이 더 크게 느껴져 소비심리가 약해질 수 있습니다.",
          hint: "농업 스트레스, 저소득층 소비여력, 부가세 부담을 함께 확인하세요."
        };
      }
      if (state.metrics.energyStress > 0.62 || state.metrics.energyPriceIndex > 138) {
        return {
          state: "에너지 비용 충격",
          cause: "에너지 가격과 에너지산업 스트레스가 생산비, 수입물가, 기대인플레이션을 함께 밀어 올리고 있습니다.",
          risk: "제조업 마진과 가계 실질소비가 동시에 약해지는 스태그플레이션형 압력이 생길 수 있습니다.",
          hint: "에너지 가격, 제조업 스트레스, 기대인플레이션을 같이 보세요."
        };
      }
      if (state.metrics.centralBankCredibility < 0.45 || state.metrics.inflationTargetCredibility < 0.45) {
        return {
          state: "중앙은행 신뢰도 약화",
          cause: "정책 신뢰도가 낮아져 기대인플레이션이 목표에서 이탈하기 쉽습니다.",
          risk: "같은 물가 충격에도 더 큰 금리 조정과 더 느린 기대 안정이 필요할 수 있습니다.",
          hint: "금리 수준뿐 아니라 정책 명확성과 기대인플레이션 고정 정도를 함께 보세요."
        };
      }
      if (state.metrics.importInflationPressure > 1.2 || state.metrics.commodityCostPressure > 1.6) {
        return {
          state: state.metrics.commodityCostPressure > state.metrics.importInflationPressure ? "원자재 비용 충격" : "수입물가 충격",
          cause: "환율 약세와 원자재·에너지 비용이 기업 마진과 소비자 실질소득을 동시에 압박합니다.",
          risk: "수요가 강하지 않아도 비용발 물가와 실질소비 둔화가 함께 나타날 수 있습니다.",
          hint: "제조업 스트레스, 저소득층 소비여력, 기대인플레이션을 같이 확인하세요."
        };
      }
      if (state.metrics.socialStressIndex > 0.62) {
        return {
          state: "사회적 압력 상승",
          cause: `물가, 주거비, 불평등, 소비심리 약화가 결합되어 ${state.metrics.mainPressureClass || "가계"}의 체감 압력이 커졌습니다.`,
          risk: "정부 이전지출 요구가 늘고 재정 여력이 빠르게 소진될 수 있습니다.",
          hint: "저소득층 소비여력과 중산층 주거부담을 우선 점검하세요."
        };
      }
      if (state.metrics.hiddenVulnerabilityIndex > 0.58 && gdpGrowth > 0 && unemployment < 9) {
        return {
          state: "숨은 취약성 누적",
          cause: `GDP와 고용은 안정적이지만 ${state.metrics.dominantVulnerability || "일부 부문"} 취약성이 누적되어 체감경제와 헤드라인 지표가 갈라지고 있습니다.`,
          risk: "같은 금리·원자재·자산가격 충격도 취약성이 높을 때 소비, 신용, 투자로 더 크게 전이될 수 있습니다.",
          hint: "종합 취약성과 주요 취약 부문, 계층별 압박을 함께 확인하세요."
        };
      }
      if (state.metrics.lowIncomeStress > 0.62) {
        return {
          state: "저소득층 물가 부담",
          cause: "저소득층은 물가와 임대료, 고용 불안에 민감해 실질소비가 빠르게 약해질 수 있습니다.",
          risk: "필수소비 중심으로 지출 압박이 커져 총수요 회복이 제한될 수 있습니다.",
          hint: "물가 안정과 생계 지원, 이전지출의 소비 지지 효과를 함께 보세요."
        };
      }
      if (state.metrics.middleClassMortgageStress > 0.62) {
        return {
          state: "중산층 주거비 부담",
          cause: "중산층은 고용보다 주택담보금리와 주거비 변화에 더 민감하게 반응하고 있습니다.",
          risk: "주택담보 부담이 소비심리를 낮추고 내수 둔화로 이어질 수 있습니다.",
          hint: "주택담보금리, 주거비 부담, 부채상환 부담을 같이 확인하세요."
        };
      }
      if (state.metrics.wealthyAssetStress > 0.62 && state.metrics.wealthInequality > 0.50) {
        return {
          state: "자산효과 편중",
          cause: "자산가격 변화가 자산가 심리에 크게 작용하고 계층별 체감경기 격차를 키우고 있습니다.",
          risk: "헤드라인 GDP가 안정적이어도 주거비 부담과 자산불평등이 사회적 압력으로 누적될 수 있습니다.",
          hint: "자산효과, 주거비 부담, 자산불평등을 함께 비교하세요."
        };
      }
      if (state.metrics.zombieFirmRatio > 18) {
        return {
          state: "좀비기업 누적",
          cause: "낮은 금리와 신용완화가 취약기업 생존을 돕지만 투자와 생산성은 약합니다.",
          risk: "단기 실업은 안정되어도 장기 성장률과 산업 역동성이 둔화될 수 있습니다.",
          hint: "신용공급을 유지하되 기업 DSCR과 생산성 회복 여부를 같이 보세요."
        };
      }
      if (sectorStressValue("construction") > 0.58 || sectorStressValue("manufacturing") > 0.58 || sectorStressValue("technology") > 0.58) {
        const sector = state.metrics.mostStressedSector || "특정 산업";
        return {
          state: "산업별 불균형",
          cause: `${sector}이 금리, 비용, 수요 변화에 가장 민감하게 반응하고 있습니다.`,
          risk: "총량 지표가 안정적이어도 특정 산업 고용과 투자가 먼저 흔들릴 수 있습니다.",
          hint: "산업별 스트레스와 기업 신용등급 분포를 함께 보세요."
        };
      }
      if (state.metrics.lowIncomeConsumptionCapacity < 0.70 && state.metrics.wealthInequality > 0.52) {
        return {
          state: "계층별 소비 양극화",
          cause: "저소득층 소비여력은 약하지만 자산가격 효과는 고소득층과 자산가에게 집중됩니다.",
          risk: "GDP가 버텨도 넓은 소비 기반이 약해져 경기 회복의 질이 낮아질 수 있습니다.",
          hint: "이전지출, 소득세, 물가 부담이 계층별 소비에 어떻게 전달되는지 보세요."
        };
      }

      if (state.metrics.fiscalSpaceScore < 0.25 || state.metrics.debtToGdpRatio > 1.6) {
        return {
          state: "재정 여력 제한",
          cause: "정부 부채비율과 이자비용이 재정지출 여지를 줄이고 있습니다.",
          risk: "자동안정화 지출은 유지되지만 추가 부양의 효과가 약해질 수 있습니다.",
          hint: "지출 규모와 세수 기반, 성장률을 함께 비교하세요."
        };
      }
      if (state.metrics.averageHouseholdDebtBurden > 18) {
        return {
          state: "가계 부채 부담",
          cause: "금리 상승이 가계 부채상환 부담을 키워 소비 여력을 낮추고 있습니다.",
          risk: "소비 둔화가 기업 매출과 고용으로 전이될 수 있습니다.",
          hint: "소득세와 금리의 누적 효과를 함께 점검하세요."
        };
      }
      if (state.metrics.averageFirmDSCR < 1.2) {
        return {
          state: "기업 부채 부담",
          cause: "기업 현금흐름 대비 부채상환 부담이 높아 투자 여력이 낮습니다.",
          risk: "법인세 수입은 유지되어도 순이익 약화가 투자 둔화로 이어질 수 있습니다.",
          hint: "법인세, 금리, 매출 회복을 동시에 비교하세요."
        };
      }
      if (state.metrics.rateUncertainty > 0.55 || Math.abs(state.metrics.policySurpriseRate) > 0.35) {
        return {
          state: "정책 불확실성 상승",
          cause: "예상보다 큰 금리 변화가 시장의 금리 경로 해석을 흔들고 있습니다.",
          risk: "주가 변동성과 위험회피가 커지며 투자 결정이 지연될 수 있습니다.",
          hint: "정책 명확성과 예상 금리 경로, 공포지수를 함께 확인하세요."
        };
      }
      if (state.metrics.termSpread < -0.25) {
        return {
          state: "장단기 금리차 역전 위험",
          cause: "단기금리가 장기금리보다 높아 시장이 경기 둔화와 향후 완화를 반영하고 있습니다.",
          risk: "은행 대출태도가 보수화되고 기업 투자심리가 약해질 수 있습니다.",
          hint: "2년·10년 국채금리와 신용공급지수를 함께 보세요."
        };
      }
      if (state.metrics.realPolicyRate > 3 && outputGap < -1) {
        return {
          state: "실질금리 부담",
          cause: "기대인플레이션을 뺀 실질정책금리가 높아 투자와 주택수요를 누르고 있습니다.",
          risk: "물가 둔화보다 실물 둔화가 먼저 나타나 실업률이 지연 상승할 수 있습니다.",
          hint: "명목금리보다 실질금리, 대출금리, 부채상환 부담을 같이 보세요."
        };
      }
      if (state.metrics.mortgageRate > 7 && state.metrics.housingAffordability > 1.45) {
        return {
          state: "주택담보 부담형 둔화",
          cause: "10년 금리와 주택담보금리 상승이 주택구입부담을 높이고 있습니다.",
          risk: "부동산 수요와 건설·부동산업 투자가 먼저 둔화될 수 있습니다.",
          hint: "주택담보금리, 주거비 부담, 건설업 스트레스를 함께 확인하세요."
        };
      }
      if (state.metrics.stockValuationPressure > 0.65 && state.metrics.stockMonthlyReturn > 1.5) {
        return {
          state: "주식시장 과열",
          cause: `주가지수 ${formatIndexPoint(state.metrics.stockIndexPoints)}가 기업 이익보다 빠르게 상승해 밸류에이션 부담이 커지고 있습니다.`,
          risk: "조정이 시작되면 가계 자산효과와 기업 투자심리가 동시에 약해질 수 있습니다.",
          hint: "금리, 신용스프레드, 기업 이익이 주가 상승을 뒷받침하는지 함께 보세요."
        };
      }
      if (state.metrics.housingMispricing > 20 && state.metrics.realEstateNeverFallsBelief > 0.62) {
        return {
          state: "부동산 불패 과열",
          cause: "부동산 가격은 소득과 대출 부담에 비해 높지만 불패 믿음이 수요를 지지합니다.",
          risk: "금리 부담이나 음의 자산 상태가 늘면 믿음이 빠르게 약해질 수 있습니다.",
          hint: "주택구입부담, 담보가치, 부동산 기초가치 괴리를 함께 보세요."
        };
      }
      if (state.metrics.stockMispricing > 24 && state.metrics.stockMarketNeverFailsBelief > 0.62) {
        return {
          state: "주식 불패 과열",
          cause: "기업 이익 증가보다 주가지수 상승이 빠르지만 FOMO와 저가매수 믿음이 매수세를 유지합니다.",
          risk: "밸류에이션 부담이 커져 악재 발생 시 변동성이 급격히 커질 수 있습니다.",
          hint: "기업 이익, 주식 기초가치 괴리, 공포지수를 같이 확인하세요."
        };
      }
      if (state.metrics.panicSellingPressure > 0.62) {
        return {
          state: "믿음 붕괴 위험",
          cause: "손실회피와 군중심리가 패닉 매도 압력으로 전환되고 있습니다.",
          risk: "자산가격 하락이 은행 위험선호와 신용공급을 동시에 압박할 수 있습니다.",
          hint: "정책 명확성과 신용스프레드가 안정되는지 확인하세요."
        };
      }
      if (state.metrics.assetBubbleRiskScore > 0.68) {
        return {
          state: "자산시장 과열",
          cause: "주식 또는 부동산 가격이 실물 성장보다 빠르게 올라 버블 위험이 커지고 있습니다.",
          risk: "자산가격 조정이 소비심리와 기업 금융여건을 동시에 약화시킬 수 있습니다.",
          hint: "금리, 가계부채, 주택구입부담을 함께 점검하세요."
        };
      }
      if (state.metrics.housingAffordability > 1.65) {
        return {
          state: "부동산 부담",
          cause: "부동산 가격과 주택담보 금리 부담이 가계의 주거비 부담을 높이고 있습니다.",
          risk: "가처분소득 감소가 소비 둔화로 이어질 수 있습니다.",
          hint: "소득세, 금리, 가계 부채부담을 함께 비교하세요."
        };
      }
      if (state.metrics.commercialVacancy > 18 || state.metrics.commercialReturn < -0.35) {
        return {
          state: "상업용 부동산 스트레스",
          cause: "공실률 상승과 상업용 가격 조정이 기업 담보가치와 은행 건전성을 압박합니다.",
          risk: "신용공급이 위축되면 기업 투자와 고용 회복이 늦어질 수 있습니다.",
          hint: "상업용 공실률, 담보가치지수, 은행 위험선호를 함께 보세요."
        };
      }
      if (state.metrics.collateralValueIndex < 90) {
        return {
          state: "담보가치 하락",
          cause: "부동산 담보가치 하락이 은행의 대출태도와 기업 차입 여건을 동시에 조이고 있습니다.",
          risk: "신용공급 축소가 투자 둔화로 전이될 수 있습니다.",
          hint: "단순 금리보다 담보가치와 신용공급지수를 같이 확인하세요."
        };
      }
      if (state.metrics.stockReturn < -0.8 && state.metrics.housingReturn < -0.35) {
        return {
          state: "금융여건 긴축",
          cause: "주식과 부동산 가격이 동시에 하락해 자산효과와 투자심리가 약해졌습니다.",
          risk: "금융 스트레스가 소비와 기업 투자로 전이될 수 있습니다.",
          hint: "자산가격 조정이 실물 수요를 얼마나 낮추는지 관찰하세요."
        };
      }
      if (state.metrics.bankingCrisisRiskScore > 0.62 || state.metrics.bankHealthIndex < 65) {
        return {
          state: "은행 스트레스 위험",
          cause: "은행 건전성과 부실대출 지표가 악화되어 신용공급이 위축되고 있습니다.",
          risk: "대출태도 긴축이 기업 투자와 가계 차입을 늦출 수 있습니다.",
          hint: "신용스프레드, 은행건전성, 부실대출비율을 함께 확인하세요."
        };
      }
      if (state.metrics.creditSpread > 5.5 || state.metrics.creditSupplyIndex < 70) {
        return {
          state: "신용위축",
          cause: "신용스프레드 확대와 대출태도 긴축이 민간 부문 자금조달을 어렵게 합니다.",
          risk: "투자 둔화와 소비 위축이 뒤따를 수 있습니다.",
          hint: "금리 수준뿐 아니라 실제 대출금리와 신용공급지수를 비교하세요."
        };
      }
      if (state.metrics.bondYield > state.metrics.interestRatePercent + 3.5 && state.metrics.debtToGdpRatio > 0.9) {
        return {
          state: "재정금리 부담",
          cause: "정부 부채비율 상승으로 국채금리와 이자비용 압력이 커지고 있습니다.",
          risk: "재정 여력이 약해져 자동안정화 지출의 부담이 커질 수 있습니다.",
          hint: "정부 부채/GDP, 국채금리, 재정수지를 함께 보세요."
        };
      }

      if (firmStressRatio > 45 || hiringFreezeRatio > 35) {
        return {
          state: "기업 금융 스트레스",
          cause: "기업 현금흐름과 부채 부담이 투자·고용 결정을 제약합니다.",
          risk: "투자 회복 지연과 신용 경색이 다음 위험입니다.",
          hint: "금리만 보기보다 부채상환 부담과 기업 유동성을 함께 점검하세요."
        };
      }
      if (inventoryDemandRatio > 2.7) {
        return {
          state: "재고 과잉",
          cause: "생산이 최종수요보다 빠르게 누적되어 재고 부담이 커졌습니다.",
          risk: "기업은 먼저 생산 이용률을 낮추고 이후 고용과 투자를 줄일 수 있습니다.",
          hint: "단순 고용 확대보다 생산 조절과 완만한 수요 회복이 우선입니다."
        };
      }
      if (inflation > TARGET_INFLATION + 1.5 && outputGap < -1.5) {
        return {
          state: "스태그플레이션 위험",
          cause: "산출갭은 음수인데 물가 압력이 높아 비용 또는 공급 제약이 의심됩니다.",
          risk: "긴축은 실업을 키우고 완화는 물가를 자극할 수 있습니다.",
          hint: "수요 부양보다 공급·비용 요인의 완화 여부를 먼저 확인하세요."
        };
      }
      if (outputGap > 2 && inflation > TARGET_INFLATION + 0.8 && unemployment < TARGET_UNEMPLOYMENT) {
        return {
          state: "과열",
          cause: "실제 지출이 잠재 산출을 웃돌고 노동시장이 타이트합니다.",
          risk: "임금-가격 압력이 누적될 수 있습니다.",
          hint: "정책 완화 속도를 낮추거나 금리 정상화를 검토할 수 있습니다."
        };
      }
      if (unemploymentGap > 2 && outputGap < -2) {
        return {
          state: gdpGrowth > 0 ? "침체 회복 국면" : "수요 부족",
          cause: "실업률이 자연실업률보다 높고 산출갭이 음수입니다.",
          risk: "가계 소득 둔화가 소비 회복을 지연시킬 수 있습니다.",
          hint: "물가 압력이 낮다면 완만한 재정 확대가 유효할 수 있습니다."
        };
      }
      if (inflation < TARGET_INFLATION - 1 && gdpGrowth >= -1) {
        return {
          state: "디스인플레이션",
          cause: "물가상승률이 목표보다 낮고 가격 압력이 약합니다.",
          risk: "기대물가가 낮아지면 소비와 투자 결정이 지연될 수 있습니다.",
          hint: "수요 회복과 기업 투자 여건을 함께 관찰하세요."
        };
      }
      if (policyGap > 3 && inflation < TARGET_INFLATION + 0.5) {
        return {
          state: "정책 긴축 과다",
          cause: "유효 정책금리가 중립금리보다 높고 물가 압력은 제한적입니다.",
          risk: "투자와 고용 회복이 과도하게 느려질 수 있습니다.",
          hint: "금리 효과는 몇 개월에 걸쳐 누적되므로 급격한 추가 긴축은 신중해야 합니다."
        };
      }
      if (policyGap < -2.5 && inflation > TARGET_INFLATION + 0.5) {
        return {
          state: "정책 완화 과다",
          cause: "유효 정책금리가 중립금리보다 낮은 가운데 물가 압력이 남아 있습니다.",
          risk: "수요 확대가 물가 기대를 다시 높일 수 있습니다.",
          hint: "정책 정상화 속도와 산출갭을 함께 비교하세요."
        };
      }
      return {
        state: "안정 성장",
        cause: "물가, 실업, 산출갭이 기준 범위 안에서 움직입니다.",
        risk: "재고와 기업 스트레스가 누적되면 안정성이 약해질 수 있습니다.",
        hint: "정책은 급격한 변경보다 점진적 조정이 적합합니다."
      };
    }

    function explainMacroState() {
      if (explainMacroState.cached && state.tick > 0 && state.tick % 3 !== 0) {
        els.macroNarrative.innerHTML = explainMacroState.cached;
        updateMacroFocusLine();
        renderPolicyRecommendations();
        return;
      }

      const producerCount = Math.max(1, state.producers.length);
      const macroState = classifyMacroState({
        unemployment: state.metrics.unemploymentRate,
        inflation: state.metrics.inflation,
        outputGap: state.metrics.outputGap,
        inventoryDemandRatio: state.metrics.inventoryToDemand,
        firmStressRatio: state.producers.filter(isFirmActuallyStressed).length / producerCount * 100,
        hiringFreezeRatio: state.producers.filter((producer) => (producer.hiringFreezeTicks || 0) > 0).length / producerCount * 100,
        policyGap: state.metrics.policyGap,
        gdpGrowth: getGDPGrowthWindow()
      });
      const drivers = [
        { name: "수요초과", value: state.metrics.demandPullPressure },
        { name: "임금비용", value: state.metrics.costPushPressure },
        { name: "재고부족", value: state.metrics.shortagePressure },
        { name: "기대물가", value: state.metrics.inflationExpectationPressure }
      ].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

      const inflationCause = drivers[0].value > 0.05
        ? `물가는 ${drivers[0].name} 때문에 오르고 있습니다.`
        : drivers[0].value < -0.05
          ? `${drivers[0].name} 둔화가 물가를 식히고 있습니다.`
          : "물가는 비교적 안정적입니다.";

      const unemploymentCause = state.metrics.unemploymentRate > 14
        ? "실업은 기업의 약한 이윤과 재고 부담 때문에 높습니다."
        : state.metrics.unemploymentRate < 7
          ? "고용은 안정적이고 임금 압력이 있습니다."
          : "고용은 천천히 조정되고 있습니다.";

      const investmentCause = state.metrics.investment < state.metrics.consumption * 0.04
        ? "투자는 금리와 기업 부채 때문에 약합니다."
        : "투자는 수요가 버텨 유지되고 있습니다.";

      let bottleneck = "";
      if (state.metrics.inventoryToDemand < 1.05) bottleneck = "재고 부족이 가격 압력입니다.";
      if (state.metrics.inventoryToDemand > 2.6) bottleneck = "과잉 재고가 고용을 늦춥니다.";
      if (state.metrics.debtServiceBurden > 8) bottleneck = "부채 부담이 소비와 투자를 누릅니다.";
      if (state.metrics.averageBusinessOutlook < 0.72) bottleneck = "기업 심리가 약합니다.";
      const assetLine = explainAssetMarketState();
      const financialLine = explainFinancialMarketState();
      const chainLine = explainTransmissionChain();

      const secondLine = state.metrics.unemploymentRate > 14 ? unemploymentCause : investmentCause;
      const narrative = `
        <strong>${macroState.state}</strong>: ${macroState.cause}<br>
        ${chainLine || `${inflationCause} ${secondLine}${bottleneck ? ` ${bottleneck}` : ""}${assetLine ? ` ${assetLine}` : ""}${financialLine ? ` ${financialLine}` : ""}`}<br>
        정책 힌트: ${macroState.hint}
      `;
      explainMacroState.cached = narrative;
      els.macroNarrative.innerHTML = narrative;
      updateMacroFocusLine(macroState);
      renderPolicyRecommendations(macroState);
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

    function renderPolicyRecommendations(macroState = classifyMacroState()) {
      if (!els.policyRecommendationValue) return;
      const recommendations = [];
      const historical = state.historicalScenario || createInitialHistoricalScenario();
      if (historical.key && safeNumber(state.metrics.historicalScenarioIntensity, historical.intensity) > 0.30) {
        const historicalRecommendations = {
          koreaImf1997: "외환위기형 충격에서는 금리 수준만 보지 말고 해외 신뢰, 은행 간 신뢰, 수출 회복 경로를 동시에 안정시켜야 합니다.",
          usFinancialCrisis2007: "주택담보 신용위기형 충격에서는 기준금리 인하보다 담보가치, 은행 유동성, 신용스프레드 전이를 먼저 완충해야 합니다.",
          japanBubbleEconomy: "버블경제형 국면에서는 단기 성장보다 위험 과소평가와 담보대출 확대를 점검해 조정 취약성을 낮추는 것이 중요합니다.",
          germanyReunification: "재정이전형 성장에서는 건설 수요가 총수요를 지지하지만 생산성 격차와 재정 이자비용을 함께 관리해야 합니다.",
          turkiyeInflation2018: "고물가·환율 불안형 충격에서는 명목금리, 기대인플레이션, 환율 안정, 수입물가 경로를 분리해서 봐야 합니다."
        };
        recommendations.push(historicalRecommendations[historical.key] || "역사 시나리오는 핵심 전송 경로를 모사하므로 충격의 직접 효과보다 지연되는 신용·심리 반응을 확인하세요.");
      }
      if (state.metrics.inventoryToDemand > 2.4) recommendations.push("재고 과잉이 높다면 단순 고용 확대보다 생산 조절이 우선입니다.");
      if (state.metrics.unemploymentGap > 2 && state.metrics.inflationGap < 0.8) recommendations.push("물가 압력이 낮고 실업률이 높다면 완만한 재정 확대가 유효할 수 있습니다.");
      if (state.metrics.policyGap > 3 && state.metrics.outputGap < 0) recommendations.push("금리가 중립 수준보다 높아 투자 회복을 늦출 수 있습니다.");
      if (state.metrics.policyGap < -2 && state.metrics.inflationGap > 0.8) recommendations.push("완화적 금리 환경에서는 물가 기대 재상승을 점검해야 합니다.");
      if (state.producers.length && state.producers.filter(isFirmActuallyStressed).length / state.producers.length * 100 > 35) recommendations.push("기업 금융 스트레스가 높다면 금리보다 부채상환 부담 완화가 더 직접적일 수 있습니다.");
      if (state.metrics.assetBubbleRiskScore > 0.65) recommendations.push("자산가격이 빠르게 오를 때는 소비심리 개선과 금융취약성 증가를 함께 봐야 합니다.");
      if (state.metrics.housingAffordability > 1.65) recommendations.push("주택구입부담이 높다면 금리와 가계부채가 소비를 누를 수 있습니다.");
      if (state.metrics.creditSpread > 5.5) recommendations.push("신용스프레드가 넓어지면 기준금리보다 실제 대출금리가 더 강하게 작동합니다.");
      if (state.metrics.bankHealthIndex < 70) recommendations.push("은행 건전성이 약할 때는 재정 부양도 신용경로에서 일부 약해질 수 있습니다.");
      if (state.metrics.creditCrunchRisk > 0.55) recommendations.push("신용경색 위험이 높을 때는 금리 조정보다 은행 유동성, 대출태도, 신뢰 회복 경로가 더 직접적일 수 있습니다.");
      if (state.metrics.creditExcessRisk > 0.55) recommendations.push("신용 과다 국면에서는 단순 긴축보다 여신심사 정상화와 위험 과소평가 완화가 중요합니다.");
      if (state.metrics.depositorConfidence < 0.58 || state.metrics.interbankTrust < 0.58) recommendations.push("예금자·은행 간 신뢰가 약하면 명확한 유동성 안전장치가 신용경색 전이를 줄일 수 있습니다.");
      if (state.metrics.bondMarketStress > 0.55 || state.metrics.longBondPriceIndex < 84) recommendations.push("국채시장 스트레스가 높으면 재정 신뢰와 발행·유동성 안정이 장기금리 경로에 중요합니다.");
      if (state.metrics.bondYield30Y > state.metrics.bondYield10Y + 1.5) recommendations.push("장기금리 충격은 주택담보금리와 성장기업 밸류에이션을 통해 실물경제에 지연 전달됩니다.");
      if (state.metrics.bondYield > state.metrics.interestRatePercent + 3.5) recommendations.push("국채금리 상승은 정부 이자비용을 키워 재정 여력을 줄일 수 있습니다.");
      if (state.metrics.realPolicyRate > 3 && state.metrics.outputGap < 0) recommendations.push("명목금리보다 실질금리 부담이 커 투자와 주택수요가 먼저 둔화될 수 있습니다.");
      if (state.metrics.mortgageRate > 7 && state.metrics.housingAffordability > 1.45) recommendations.push("장기금리와 주택담보금리 상승은 주거비 부담을 통해 소비를 늦게 압박할 수 있습니다.");
      if (state.metrics.termSpread < -0.25) recommendations.push("장단기 금리차 역전은 경기둔화 기대와 은행 대출태도 보수화를 함께 시사합니다.");
      if (state.metrics.rateUncertainty > 0.55 || Math.abs(state.metrics.policySurpriseRate) > 0.35) recommendations.push("예상 밖 금리 변화가 크면 정책 명확성을 높여 변동성과 투자 지연을 줄이는 것이 중요합니다.");
      if (state.metrics.realPolicyRate < -1 && state.metrics.assetBubbleRiskScore > 0.55) recommendations.push("낮은 실질금리는 자산가격과 차입 수요를 지지하지만 버블 취약성을 키울 수 있습니다.");
      if (state.metrics.inflationGap > 1.2 && state.metrics.bankHealthIndex < 75) recommendations.push("금리 인상은 물가 안정에는 도움이 될 수 있지만 은행 스트레스와 부채상환 부담을 키울 수 있습니다.");
      if (state.metrics.inflationGap > 1.2 && state.metrics.bankRiskAppetite < 0.55) recommendations.push("금리 인상은 물가 기대를 낮출 수 있지만 은행 위험선호와 기업 투자심리를 더 약화시킬 수 있습니다.");
      if (state.metrics.consumerSentiment < 0.48) recommendations.push("소비심리가 낮은 상태에서는 세율 인하보다 직접 이전지출이 더 빠르게 수요를 지지할 수 있습니다.");
      if (state.metrics.lowIncomeStress > 0.58) recommendations.push("저소득층 물가·임대료 부담이 높으면 이전지출과 생계비 안정이 소비를 빠르게 지지할 수 있습니다.");
      if (state.metrics.consumptionTaxPain > 0.56 && state.metrics.lowIncomeStress > 0.46) recommendations.push("부가세 부담은 저소득층 체감물가를 빠르게 높이므로 세수 효과와 소비 둔화를 함께 평가해야 합니다.");
      if (state.metrics.middleClassMortgageStress > 0.58) recommendations.push("금리 인상은 물가 안정에는 도움이 될 수 있지만 중산층 주택담보 부담을 키워 내수를 둔화시킬 수 있습니다.");
      if (state.metrics.highIncomeTaxStress > 0.58) recommendations.push("소득세 인상은 고소득층 세부담을 키우지만 저소득층 소비에는 이전지출 설계가 더 중요합니다.");
      if (state.metrics.corporateTaxPressure > 0.58 && state.metrics.investmentConversionRate < 0.25) recommendations.push("법인세 부담이 높고 투자 전환율이 낮다면 세후이익보다 수요전망과 신용여건 개선이 먼저 필요할 수 있습니다.");
      if (state.metrics.buybackPayoutRatio > 0.34 && state.metrics.investmentConversionRate < 0.24) recommendations.push("법인세 인하가 약한 수요와 만나면 설비투자보다 자사주·배당·부채상환으로 흐를 수 있습니다.");
      if (state.metrics.marketFailureRisk > 0.58) recommendations.push(`시장 실패 위험은 ${state.metrics.marketFailureType || "복합 요인"} 경로가 큽니다. 가격·신용·정보가 왜곡되는 원인을 먼저 분리해 보세요.`);
      if (state.metrics.marketSuccessScore > 0.70 && state.metrics.marketFailureRisk < 0.35) recommendations.push(`현재 시장 성공 경로는 ${state.metrics.marketSuccessType || "균형 성장"}입니다. 과도한 신용·자산 과열로 변질되는지만 점검하면 됩니다.`);
      if (state.metrics.foreignInvestorSentiment < 0.45 || state.metrics.foreignBondDemand < 0.45) recommendations.push("해외 자본유출 압력이 있으면 환율 안정, 재정 신뢰, 장기금리 관리를 함께 봐야 합니다.");
      if (state.metrics.agricultureStress > 0.58) recommendations.push("농업 공급 충격은 저소득층 체감물가를 빠르게 악화시키므로 생계비·식품가격 경로를 우선 점검하세요.");
      if (state.metrics.energyStress > 0.58 || state.metrics.energyPriceIndex > 138) recommendations.push("에너지 비용 충격은 제조업 마진과 물가를 동시에 압박하므로 금리만으로 해결하기 어렵습니다.");
      if (state.metrics.wealthyAssetEffect > 1 && state.metrics.wealthInequality > 0.50) recommendations.push("자산가격 상승은 자산가 소비심리를 개선하지만 무주택 계층의 주거비 부담을 키울 수 있습니다.");
      if (state.metrics.businessSentiment < 0.48) recommendations.push("기업심리가 약하면 금리 인하만으로 투자 회복이 제한될 수 있어 신용공급 개선이 중요합니다.");
      if (state.metrics.fiscalCredibility < 0.48) recommendations.push("재정 신뢰도가 낮아진 상태에서는 지출 확대 효과가 국채금리 상승으로 일부 상쇄될 수 있습니다.");
      if (state.metrics.unemploymentGap > 2 && state.metrics.fiscalSpaceScore > 0.55) recommendations.push("재정 여력이 충분하므로 이전지출이나 공공조달을 통한 수요 보강이 가능합니다.");
      if (state.metrics.housingAffordability > 1.55) recommendations.push("주택담보 부담이 높아 단순 금리 인상은 소비 둔화를 키울 수 있습니다.");
      if (state.producers.length && state.producers.filter(isFirmActuallyStressed).length / state.producers.length * 100 > 35 && state.metrics.creditSupplyIndex < 80) recommendations.push("기업 스트레스가 높은 상황에서는 신용공급 완화가 더 직접적인 경로일 수 있습니다.");
      if (state.metrics.unemploymentRate < TARGET_UNEMPLOYMENT - 1 && state.metrics.inflationGap > 0) recommendations.push("실업률이 자연실업률보다 낮고 물가가 상승하면 긴축 압력이 커질 수 있습니다.");
      if (state.metrics.stockVolatilityIndex > 45 && Math.abs(state.metrics.outputGap) < 3) recommendations.push("기초 여건보다 공포심리가 더 빠르게 악화되고 있습니다. 정책 명확성을 높이면 과잉반응을 줄일 수 있습니다.");
      if (state.metrics.sentimentInflationExpectations > state.metrics.inflation + 1.2) recommendations.push("실제 물가보다 기대인플레이션이 높아 임금과 가격 결정이 선제적으로 올라갈 수 있습니다.");
      if (state.metrics.misperceptionIndex > 0.55) recommendations.push("정보 격차가 커진 상태에서는 정책 효과가 늦게 전달되거나 시장이 과잉반응할 수 있습니다.");
      if (state.information?.rumorType === "bank" && state.metrics.rumorIntensity > 0.35) recommendations.push("은행 부실 루머가 신용공급을 위축시키고 있어 실제 부실 여부와 별개로 투자 둔화가 나타날 수 있습니다.");
      if (state.metrics.behavioralMispricingIndex > 0.58 && Math.max(state.metrics.realEstateNeverFallsBelief, state.metrics.stockMarketNeverFailsBelief) > 0.62) recommendations.push("자산가격이 기초 여건보다 높지만 불패 믿음이 강하면 금리 인상 효과가 늦게 나타날 수 있습니다.");
      if (state.metrics.realEstateNeverFallsBelief > 0.68 && state.metrics.housingAffordability > 1.45) recommendations.push("부동산 불패 믿음이 강한 상태에서는 금리 인상만으로 투기 수요를 충분히 낮추기 어렵습니다.");
      if (state.metrics.stockMarketNeverFailsBelief > 0.68 && state.metrics.stockMispricing > 18) recommendations.push("주식 불패 기대가 강하면 초기 악재에도 시장이 버티지만, 기대가 깨질 때 변동성이 급격히 커질 수 있습니다.");
      if (state.metrics.panicSellingPressure > 0.55 && Math.abs(state.metrics.outputGap) < 3) recommendations.push("공포심리가 실제 지표보다 과도하면 정책 명확성 강화가 금리 조정보다 빠르게 불안을 줄일 수 있습니다.");
      if (!recommendations.length) recommendations.push(macroState.hint);
      els.policyRecommendationValue.innerHTML = recommendations.slice(0, 3).map((text) => `<div>${text}</div>`).join("");
    }

    function renderSelectedAgent() {
      if (!state.selected) {
        els.selectedAgent.textContent = "캔버스에서 노드를 클릭하면 상세 상태가 표시됩니다.";
        return;
      }

      if (state.selected.type === "consumer") {
        const consumer = state.consumers[state.selected.id];
        if (!consumer) return;
        const employer = consumer.employerId === null ? "없음" : `기업 ${consumer.employerId + 1}`;
        els.selectedAgent.innerHTML = `
          <strong>소비자 ${consumer.id + 1}</strong><br>
          계층 ${consumer.incomeClass || "중산층"} / MPC ${round(safeNumber(consumer.mpc, consumer.consumptionPropensity), 2)}<br>
          현금 ${money(consumer.cash)} / 부채 ${money(consumer.debt)}<br>
          고용 ${consumer.employed ? "예" : "아니오"} / 고용주 ${employer}<br>
          소비성향 ${round(consumer.consumptionPropensity, 2)} / 금리 민감도 ${round(consumer.interestSensitivity, 2)}<br>
          계층 소비여력 ${round(safeNumber(consumer.consumptionCapacity, 1), 2)} / 계층심리 ${classStatusLabel(safeNumber(consumer.classConfidence, consumer.confidence), safeNumber(state.classAnalysis?.classes?.[consumer.incomeSegment]?.stress, 0))}<br>
          계층 압박 ${consumer.mainPressure || "보통"} / 요구 ${consumer.policyDemand || "경제 여건 관찰"}<br>
          물가 민감도 ${round(safeNumber(consumer.inflationSensitivity, 1), 2)} / 고용위험 민감도 ${round(safeNumber(consumer.jobRiskSensitivity, 1), 2)}<br>
          소비 심리 ${round(consumer.confidence, 2)} / 부채 스트레스 ${percent(consumer.debtStress * 100, 1)}<br>
          주거 상태 ${housingStatusLabel(consumer.housingStatus)} / ${consumer.housingStatus === "renter" ? `임대료 부담 ${percent(safeNumber(consumer.rentBurden, 0) * 100, 1)}` : `주택가치 ${money(consumer.homeValue || consumer.housingWealth)} / 주택담보 ${money(consumer.mortgageDebt)}`}<br>
          자산순가치 ${money(consumer.assetWealth)} / 자산효과 ${signedPercent(safeNumber(consumer.wealthEffect, 0) * 100)} / 부채불안 ${round(safeNumber(consumer.debtAnxiety, 0), 2)}<br>
          ${consumer.negativeEquity ? "음의 자산 상태" : "담보 안정"} / 주택담보 부담 ${percent(safeNumber(consumer.mortgageBurden, 0) * 100, 1)}<br>
          신용한도 ${money(consumer.creditLimit)} / 상태 ${consumer.financiallyStressed ? "금융 스트레스" : "정상"}<br>
          선호 ${translatePreference(consumer.demandPreference)}
        `;
      } else if (state.selected.type === "producer") {
        const producer = state.producers[state.selected.id];
        if (!producer) return;
        els.selectedAgent.innerHTML = `
          <strong>기업 ${producer.id + 1}</strong><br>
          산업 ${sectorLabel(producer.sector)} / 전략 ${firmStrategyLabel(producer.firmStrategy)} / 신용등급 ${producer.creditRating || "BBB"} (${producer.ratingOutlook || "안정"}) ${producer.zombieFirm ? "/ 좀비기업" : ""}<br>
          현금 ${money(producer.cash)} / 부채 ${money(producer.debt)} / 재고 ${round(producer.inventory, 1)} 단위<br>
          가격 ${money(producer.price, 2)} / 제시 임금 ${money(producer.wageOffered, 1)}<br>
          고용 ${producer.employees.length}명 / 생산능력 ${round(producer.productionCapacity, 1)}<br>
          생산성 ${round(producer.productivity, 2)} / 예상 수요 ${round(producer.expectedDemand, 1)} / 전망 ${round(producer.businessOutlook, 2)}<br>
          기대물가 ${signedPercent(producer.expectedInflation)} / 부채 스트레스 ${percent(producer.debtStress * 100, 1)}<br>
          전기 이윤 ${money(producer.lastProfit)} / 이윤 추세 ${money(producer.profitTrend)}<br>
          자사주·배당 ${money(producer.buybackAndDividendTick)} / 부채상환 배분 ${money(producer.debtRepaymentAllocationTick)} / 투자 전환율 ${percent(safeNumber(producer.investmentConversionRate, 0) * 100, 1)}<br>
          기업 주가 ${money(producer.stockPrice, 1)} / 월간 수익률 ${formatStockReturn(safeNumber(producer.stockReturn, 0) * TICKS_PER_MONTH)} / 밸류에이션 ${valuationPressureLabel(producer.valuationPressure)}<br>
          기업심리 ${round(safeNumber(producer.businessConfidence, producer.businessOutlook), 2)} / 정보 불투명성 ${percent(safeNumber(producer.informationOpacity, 0) * 100, 1)}<br>
          부동산 유형 ${propertyExposureLabel(producer.propertyExposure)} / 담보가치 ${money(producer.collateralValue)} / DSCR ${round(producer.dscr, 2).toFixed(2)}<br>
          수출노출 ${percent(safeNumber(producer.exportExposure, 0) * 100, 0)} / 수입비용노출 ${percent(safeNumber(producer.importCostExposure, 0) * 100, 0)} / 부도위험 ${percent(safeNumber(producer.defaultRisk, 0) * 100, 1)}<br>
          주식시장 금융여건 ${round(producer.equityFinancingCondition || state.assetMarket?.equityFinancingCondition || 1, 2)}
        `;
      } else {
        els.selectedAgent.innerHTML = `
          <strong>정부</strong><br>
          소득세 ${percent(state.government.householdIncomeTaxRate * 100, 1)} / 법인세 ${percent(state.government.corporateTaxRate * 100, 1)} / 부가세 ${percent(state.government.valueAddedTaxRate * 100, 1)} / 정책 금리 ${percent(state.government.interestRate * 100, 2)}<br>
          계획 지출 ${money(state.government.spending)} / 부채조정 지출 ${money(state.government.effectiveSpending)}<br>
          실업지원 ${money(state.government.supportTick)} / 조달 ${money(state.government.procurementTick)} / 보조금 ${money(state.government.subsidyTick)}<br>
          소득세 ${money(state.government.householdIncomeTaxCollectedTick)} / 법인세 ${money(state.government.corporateTaxCollectedTick)} / 재정수지 ${money(state.government.balance)}<br>
          누적 부채 ${money(state.government.debt)} / 이자비용 ${money(state.government.debtServiceTick)}
          <br>주가지수 ${formatIndexPoint(state.metrics.stockIndexPoints)} / 주거 ${round(state.metrics.residentialIndex || state.metrics.housingIndex, 1)} / 상업 ${round(state.metrics.commercialIndex, 1)} / 담보 ${round(state.metrics.collateralValueIndex, 1)}
          <br>국채금리 ${percent(state.metrics.bondYield, 2)} / 대출금리 ${percent(state.metrics.loanRate, 2)} / 은행위기 위험 ${state.metrics.bankingCrisisRiskLabel}
        `;
      }
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
      try {
        renderSimulation(timestamp);
      } catch (error) {
        recordRuntimeError(error, "렌더링 오류", "캔버스 렌더링 오류를 건너뛰었습니다.");
      }
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
    // 캔버스에는 소비자, 생산자, 정부 노드와 최근 거래 흐름을 가볍게 애니메이션으로 그린다.
    function renderSimulation(timestamp) {
      syncUiPerformanceState();
      if (state.ui) state.ui.lastCanvasRenderTick = state.tick;
      const canvas = els.simCanvas;
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const width = Math.max(320, rect.width);
      const height = Math.max(260, rect.height);

      if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        if (state.ui) state.ui.canvasPositionCacheKey = "";
      }

      const ctx = canvas.getContext("2d");
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);

      drawCanvasBackdrop(ctx, width, height);
      const positionCacheKey = getCanvasPositionCacheKey(width, height, ratio);
      if (!state.ui || state.ui.canvasPositionCacheKey !== positionCacheKey) {
        computeNodePositions(width, height);
        if (state.ui) state.ui.canvasPositionCacheKey = positionCacheKey;
      }
      drawFlows(ctx, timestamp);
      drawGovernment(ctx);
      drawProducers(ctx);
      drawConsumers(ctx);
      drawCanvasLabels(ctx, width, height);
    }

    function drawCanvasBackdrop(ctx, width, height) {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "rgba(255, 250, 240, 0.72)");
      gradient.addColorStop(1, "rgba(231, 242, 228, 0.78)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.fillStyle = "rgba(107, 181, 142, 0.10)";
      roundedRect(ctx, 14, 86, width * 0.48, height - 114, 18);
      ctx.fill();
      ctx.fillStyle = "rgba(64, 124, 168, 0.10)";
      roundedRect(ctx, width * 0.58, 86, width * 0.39, height - 114, 18);
      ctx.fill();
      ctx.fillStyle = "rgba(216, 137, 49, 0.12)";
      roundedRect(ctx, width * 0.38, 16, width * 0.24, 70, 20);
      ctx.fill();
      ctx.strokeStyle = "rgba(22, 48, 46, 0.10)";
      ctx.lineWidth = 1;
      roundedRect(ctx, 14, 86, width * 0.48, height - 114, 18);
      ctx.stroke();
      roundedRect(ctx, width * 0.58, 86, width * 0.39, height - 114, 18);
      ctx.stroke();
      roundedRect(ctx, width * 0.38, 16, width * 0.24, 70, 20);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = "#16302e";
      ctx.font = "900 34px Pretendard, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("가계", 34, height - 52);
      ctx.textAlign = "right";
      ctx.fillText("기업", width - 34, height - 52);
      ctx.textAlign = "center";
      ctx.fillText("정부", width / 2, 72);
      ctx.restore();
    }

    function computeNodePositions(width, height) {
      state.positions.consumers = [];
      state.positions.producers = [];
      state.positions.government = { x: width * 0.50, y: 54, r: 28 };

      const consumerAreaWidth = width * 0.47;
      const consumerTop = 110;
      const consumerBottom = height - 28;
      const consumerRows = Math.max(2, Math.floor((consumerBottom - consumerTop) / 24));
      const consumerCols = Math.max(1, Math.ceil(state.consumers.length / consumerRows));
      const consumerSpacingX = Math.min(24, (consumerAreaWidth - 42) / Math.max(1, consumerCols));
      const consumerSpacingY = Math.min(24, (consumerBottom - consumerTop) / Math.max(1, consumerRows - 1));

      state.consumers.forEach((consumer, index) => {
        const col = Math.floor(index / consumerRows);
        const row = index % consumerRows;
        state.positions.consumers[consumer.id] = {
          x: 30 + col * consumerSpacingX + (row % 2) * 3,
          y: consumerTop + row * consumerSpacingY,
          r: clamp(4.3 + consumer.cash / 700, 4.5, 8.2)
        };
      });

      const producerCols = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(state.producers.length))));
      const producerRows = Math.ceil(state.producers.length / producerCols);
      const startX = width * 0.62;
      const startY = 128;
      const areaW = width * 0.34;
      const areaH = height - 166;
      const gapX = areaW / Math.max(1, producerCols);
      const gapY = areaH / Math.max(1, producerRows);

      state.producers.forEach((producer, index) => {
        const col = index % producerCols;
        const row = Math.floor(index / producerCols);
        state.positions.producers[producer.id] = {
          x: startX + col * gapX + gapX * 0.5 + producer.layoutJitterX,
          y: startY + row * gapY + gapY * 0.45 + producer.layoutJitterY,
          w: clamp(54 + producer.productionCapacity * 0.6, 58, 94),
          h: 38
        };
      });
    }

    function drawGovernment(ctx) {
      const gov = state.positions.government;
      const active = (state.selected && state.selected.type === "government") || (state.hovered && state.hovered.type === "government");
      const scale = state.selected && state.selected.type === "government" ? 1.2 : active ? 1.08 : 1;
      const w = 116 * scale;
      const h = 54 * scale;
      ctx.save();
      ctx.shadowColor = active ? "rgba(216, 137, 49, 0.48)" : "rgba(216, 137, 49, 0.28)";
      ctx.shadowBlur = state.selected && state.selected.type === "government" ? 32 : active ? 24 : 14;
      ctx.fillStyle = "#d88931";
      roundedRect(ctx, gov.x - w / 2, gov.y - h / 2, w, h, 18);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (active) {
        ctx.strokeStyle = "#fff4c8";
        ctx.lineWidth = scale > 1.1 ? 4 : 3;
        roundedRect(ctx, gov.x - w / 2, gov.y - h / 2, w, h, 18);
        ctx.stroke();
      }
      ctx.fillStyle = "#fffaf0";
      ctx.font = "800 13px Pretendard, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("정부", gov.x, gov.y - 2);
      ctx.font = "700 10px Pretendard, sans-serif";
      ctx.fillText(`수지 ${compactMoney(state.government.balance || 0)}`, gov.x, gov.y + 15);
      ctx.restore();
    }

    function drawProducers(ctx) {
      const maxRenderedProducers = isLargeEconomyMode() ? 36 : state.config.performanceMode === "light" ? 28 : 80;
      const step = Math.max(1, Math.ceil(state.producers.length / maxRenderedProducers));
      state.producers.forEach((producer) => {
        const pos = state.positions.producers[producer.id];
        if (!pos) return;

        const inventoryPressure = clamp(producer.inventory / Math.max(1, producer.expectedDemand * 2), 0, 2);
        const fill = inventoryPressure < 0.7 ? "#c85f32" : inventoryPressure > 1.45 ? "#407ca8" : "#247173";
        const selected = state.selected && state.selected.type === "producer" && state.selected.id === producer.id;
        const hovered = state.hovered && state.hovered.type === "producer" && state.hovered.id === producer.id;
        if (!selected && !hovered && producer.id % step !== 0) return;

        const producerWidth = clamp(54 + producer.productionCapacity * 0.6, 58, 94);
        const producerHeight = 38;
        const scale = selected ? 1.2 : hovered ? 1.08 : 1;
        ctx.save();
        ctx.shadowColor = selected || hovered ? "rgba(200, 95, 50, 0.38)" : "rgba(22, 48, 46, 0.18)";
        ctx.shadowBlur = selected ? 28 : hovered ? 20 : 10;
        ctx.fillStyle = fill;
        roundedRect(ctx, pos.x - (producerWidth * scale) / 2, pos.y - (producerHeight * scale) / 2, producerWidth * scale, producerHeight * scale, 10);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = selected || hovered ? "#fff4c8" : "rgba(255, 250, 240, 0.42)";
        ctx.lineWidth = selected ? 4 : hovered ? 3 : 1.5;
        roundedRect(ctx, pos.x - (producerWidth * scale) / 2, pos.y - (producerHeight * scale) / 2, producerWidth * scale, producerHeight * scale, 10);
        ctx.stroke();
        ctx.fillStyle = "#fffaf0";
        ctx.font = "800 11px Pretendard, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`기업 ${producer.id + 1}`, pos.x, pos.y - 5);
        ctx.font = "700 9px Pretendard, sans-serif";
        ctx.fillText(`${money(producer.price, 1)} · ${producer.employees.length}명`, pos.x, pos.y + 10);
        ctx.restore();
      });
    }

    function drawConsumers(ctx) {
      const maxRenderedConsumers = isLargeEconomyMode() ? 48 : state.config.performanceMode === "light" ? 36 : 64;
      const step = Math.max(1, Math.ceil(state.consumers.length / maxRenderedConsumers));
      state.consumers.forEach((consumer) => {
        const pos = state.positions.consumers[consumer.id];
        if (!pos) return;

        const selected = state.selected && state.selected.type === "consumer" && state.selected.id === consumer.id;
        const hovered = state.hovered && state.hovered.type === "consumer" && state.hovered.id === consumer.id;
        if (!selected && !hovered && consumer.id % step !== 0) return;
        const baseRadius = clamp(4.3 + consumer.cash / 700, 4.5, 8.2);
        const radius = selected ? baseRadius * 1.2 + 3 : hovered ? baseRadius * 1.08 + 2 : baseRadius;
        ctx.save();
        if (selected || hovered) {
          ctx.shadowColor = selected ? "rgba(255, 244, 200, 0.72)" : "rgba(216, 137, 49, 0.42)";
          ctx.shadowBlur = selected ? 18 : 12;
        }
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = consumer.employed ? "#6bb58e" : "#c85f32";
        ctx.globalAlpha = clamp(consumer.confidence, 0.38, 1);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = selected || hovered ? "#fff4c8" : "rgba(22, 48, 46, 0.18)";
        ctx.lineWidth = selected ? 4 : hovered ? 3 : 1;
        ctx.stroke();
        ctx.restore();
      });
    }

    function drawFlows(ctx, timestamp) {
      state.flows = state.flows.filter((flow) => timestamp - flow.born < flow.life);

      const maxRenderedFlows = isLargeEconomyMode() ? 8 : state.config.performanceMode === "light" ? 6 : 20;
      [...state.flows].sort((a, b) => b.amount - a.amount).slice(0, maxRenderedFlows).forEach((flow) => {
        const from = getNodePosition(flow.fromType, flow.fromId);
        const to = getNodePosition(flow.toType, flow.toId);
        if (!from || !to) return;

        const age = (timestamp - flow.born) / flow.life;
        const alpha = Math.pow(clamp(1 - age, 0, 1), 2.1);
        const color = flowColor(flow.kind);
        const curve = flow.kind === "investment" ? 16 : 38;
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2 - curve;

        ctx.save();
        ctx.globalAlpha = alpha * 0.45;
        ctx.strokeStyle = color;
        ctx.lineWidth = clamp(flow.amount / 180, 1, 3.2);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(midX, midY, to.x, to.y);
        ctx.stroke();

        const dot = quadraticPoint(from.x, from.y, midX, midY, to.x, to.y, clamp(age, 0, 1));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, clamp(2.4 + flow.amount / 260, 2.4, 5.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    function drawCanvasLabels(ctx, width, height) {
      ctx.save();
      ctx.fillStyle = "rgba(22, 48, 46, 0.68)";
      ctx.font = "800 12px Pretendard, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`소비자 구역 · ${state.consumers.length}명 중 대표 노드 표시`, 28, 92);
      ctx.textAlign = "right";
      ctx.fillText(`생산자 구역 · ${state.producers.length}개 기업`, width - 28, 92);
      ctx.textAlign = "center";
      ctx.fillText("정부 정책 노드", width / 2, 24);

      ctx.fillStyle = "rgba(22, 48, 46, 0.50)";
      ctx.font = "700 11px Pretendard, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("상위 거래 흐름만 표시합니다. 노드에 마우스를 올리면 빠른 요약이 나타납니다.", width / 2, height - 13);
      ctx.restore();
    }

    function getNodePosition(type, id) {
      if (type === "consumer") return state.positions.consumers[id];
      if (type === "producer") {
        const pos = state.positions.producers[id];
        return pos ? { x: pos.x, y: pos.y } : null;
      }
      if (type === "government") return state.positions.government;
      return null;
    }

    function handleCanvasClick(event) {
      const rect = els.simCanvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      state.selected = findAgentAtPoint(x, y);
      updateInspector();
      safeRenderSimulation(performance.now());
    }

    function handleCanvasHover(event) {
      const rect = els.simCanvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      state.hovered = findAgentAtPoint(x, y);

      if (state.hovered) {
        showCanvasTooltip(event.clientX - rect.left, event.clientY - rect.top, getAgentTooltip(state.hovered));
      } else {
        hideCanvasTooltip();
      }
      safeRenderSimulation(performance.now());
    }

    function findAgentAtPoint(x, y) {
      let nearest = null;
      let nearestDistance = Infinity;

      state.positions.consumers.forEach((pos, id) => {
        if (!pos) return;
        const consumer = state.consumers[id];
        const radius = consumer ? clamp(4.3 + consumer.cash / 700, 4.5, 8.2) : pos.r;
        const distance = Math.hypot(pos.x - x, pos.y - y);
        if (distance < radius + 18 && distance < nearestDistance) {
          nearest = { type: "consumer", id };
          nearestDistance = distance;
        }
      });

      state.positions.producers.forEach((pos, id) => {
        if (!pos) return;
        const producer = state.producers[id];
        const width = producer ? clamp(54 + producer.productionCapacity * 0.6, 58, 94) : pos.w;
        const height = 38;
        const padding = 16;
        const inside = x >= pos.x - width / 2 - padding && x <= pos.x + width / 2 + padding && y >= pos.y - height / 2 - padding && y <= pos.y + height / 2 + padding;
        if (inside) {
          nearest = { type: "producer", id };
          nearestDistance = 0;
        }
      });

      const gov = state.positions.government;
      if (Math.abs(x - gov.x) < 74 && Math.abs(y - gov.y) < 44) {
        nearest = { type: "government", id: 0 };
      }

      return nearest;
    }

    function showCanvasTooltip(x, y, html) {
      els.canvasTooltip.innerHTML = html;
      els.canvasTooltip.style.left = `${x}px`;
      els.canvasTooltip.style.top = `${y}px`;
      els.canvasTooltip.classList.add("visible");
    }

    function hideCanvasTooltip() {
      els.canvasTooltip.classList.remove("visible");
    }

    function getAgentTooltip(agent) {
      if (agent.type === "consumer") {
        const consumer = state.consumers[agent.id];
        return `<strong>가계 ${agent.id + 1}</strong><br>${consumer.employed ? "고용" : "실업"} · 현금 ${compactMoney(consumer.cash)}<br>심리 ${round(consumer.confidence, 2)}`;
      }
      if (agent.type === "producer") {
        const producer = state.producers[agent.id];
        return `<strong>기업 ${agent.id + 1}</strong><br>가격 ${money(producer.price, 2)} · 고용 ${producer.employees.length}명<br>재고 ${round(producer.inventory, 1)}`;
      }
      return `<strong>정부</strong><br>금리 ${percent(state.government.interestRate * 100, 2)} · 소득세 ${percent(state.government.householdIncomeTaxRate * 100, 1)} · 법인세 ${percent(state.government.corporateTaxRate * 100, 1)} · 부가세 ${percent(safeNumber(state.government.valueAddedTaxRate, 0.10) * 100, 1)}<br>수지 ${compactMoney(state.government.balance)} · 재정여력 ${state.government.fiscalSpaceLabel || "충분함"}`;
    }

    function flowColor(kind) {
      if (kind === "wage") return "#2d8f61";
      if (kind === "tax") return "#c85f32";
      if (kind === "spending") return "#e5b949";
      if (kind === "investment") return "#247173";
      return "#407ca8";
    }

    function translatePreference(preference) {
      if (preference === "budget") return "저가 선호";
      if (preference === "quality") return "품질 선호";
      return "균형 선호";
    }

    function money(value, digits = 0) {
      const safe = safeNumber(value, 0);
      return `₩${safe.toLocaleString("ko-KR", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits
      })}`;
    }

    function macroMoney(value, digits = 0) {
      const scale = safeNumber(state.scale?.currencyScale, 1000);
      return money(safeNumber(value, 0) * scale, digits);
    }

    function compactMoney(value) {
      const safe = safeNumber(value, 0);
      const sign = safe < 0 ? "-" : "";
      const abs = Math.abs(safe);
      if (abs >= 1000000) return `${sign}₩${round(abs / 1000000, 1)}M`;
      if (abs >= 1000) return `${sign}₩${round(abs / 1000, 1)}K`;
      return `${sign}₩${round(abs, 0)}`;
    }

    function percent(value, digits = 1) {
      return `${safeNumber(value, 0).toFixed(digits)}%`;
    }

    function formatSigned(value, digits = 1) {
      const safe = safeNumber(value, 0);
      const sign = safe > 0 ? "+" : "";
      return `${sign}${safe.toFixed(digits)}`;
    }

    function signedPercent(value) {
      const safe = safeNumber(value, 0);
      const sign = safe > 0 ? "+" : "";
      return `${sign}${safe.toFixed(2)}%`;
    }

    function formatIndexPoint(value) {
      return `${Math.round(safeNumber(value, 0)).toLocaleString("ko-KR")}pt`;
    }

    function formatStockReturn(value) {
      const safe = safeNumber(value, 0) * 100;
      const sign = safe > 0 ? "+" : "";
      return `${sign}${safe.toFixed(1)}%`;
    }

    function stockVolatilityLabel(value) {
      const monthlyVolatility = safeNumber(value, 0) * 100;
      if (monthlyVolatility < 1.5) return "낮음";
      if (monthlyVolatility < 3.5) return "보통";
      if (monthlyVolatility < 6.0) return "높음";
      return "매우 높음";
    }

    function valuationPressureLabel(value) {
      const pressure = safeNumber(value, 0);
      if (pressure < 0.28) return "낮음";
      if (pressure < 0.58) return "주의";
      return "높음";
    }

    function stockRiskSentimentLabel(value) {
      const sentiment = safeNumber(value, 0.65);
      if (sentiment >= 0.65) return "안정";
      if (sentiment >= 0.40) return "주의";
      return "위험";
    }

    function fearGreedLabel(value) {
      const index = safeNumber(value, 50);
      if (index < 20) return "극단적 공포";
      if (index < 40) return "공포";
      if (index < 60) return "중립";
      if (index < 80) return "탐욕";
      return "극단적 탐욕";
    }

    function stockVolatilityIndexLabel(value) {
      const index = safeNumber(value, 18);
      if (index < 16) return "낮음";
      if (index < 30) return "보통";
      if (index < 48) return "높음";
      return "공포";
    }

    function realEstateStressLabel(value) {
      const stress = safeNumber(value, 0);
      if (stress < 0.25) return "낮음";
      if (stress < 0.50) return "주의";
      if (stress < 0.72) return "높음";
      return "위험";
    }

    function housingStatusLabel(value) {
      const labels = {
        renter: "임차",
        lowMortgageOwner: "저부담 자가",
        highMortgageOwner: "고부담 자가",
        highAssetOwner: "고자산 자가"
      };
      return labels[value] || "주거 상태 미상";
    }

    function propertyExposureLabel(value) {
      const labels = {
        assetLight: "자산 경량",
        renter: "임차 기업",
        propertyOwner: "부동산 보유",
        leveragedProperty: "레버리지 부동산"
      };
      return labels[value] || "일반";
    }

    function applyEquilibriumGravity() {
      const inflationGap = Math.max(0, safeNumber(state.metrics.inflation, 0) - 4.0);
      const unemploymentGap = Math.max(0, safeNumber(state.metrics.unemploymentRate, 0) - 12.0);
      const gdpFloor = Math.max(1, state.consumers.length * effectiveBaseWage() * 0.16);
      const collapseGap = state.metrics.gdp > 0 ? Math.max(0, 1 - state.metrics.gdp / gdpFloor) : 0;
      return {
        demandAdjustment: clamp(1 - inflationGap * 0.0020 + unemploymentGap * 0.0018 + collapseGap * 0.016, 0.972, 1.036),
        priceAdjustment: clamp(-inflationGap * 0.00055, -0.003, 0)
      };
    }
