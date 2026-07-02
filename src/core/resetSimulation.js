import { cloneModelParameters, defaultModelParameters } from "./modelParameters.js";
import { createFlowLedger } from "./flowLedger.js";
import { createSectorState } from "./sectorState.js";
import { average } from "./mathUtils.js";
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
  createInitialVulnerabilityState
} from "./domainStateFactory.js";
import { createInitialCausalDecomposition } from "../analysis/causalDecomposition.js";
import { createInitialEarlyWarning } from "../analysis/earlyWarning.js";
import { createInitialMarketOutcome } from "../analysis/marketOutcome.js";

export function resetSimulationState(context) {
  const {
    state,
    readConfigFromControls,
    createConsumers,
    createProducers,
    initializePolicyState,
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
    now = () => performance.now()
  } = context;

  state.config = readConfigFromControls();
  state.tick = 0;
  state.consumers = createConsumers(state.config.consumerCount);
  state.producers = createProducers(state.config.producerCount);
  state.assetMarket = createInitialAssetMarket();
  state.realEstate = createInitialRealEstateMarket();
  state.financialMarket = createInitialFinancialMarket(state.config);
  state.creditCycle = createInitialCreditCycle();
  state.macroFinancial = createInitialMacroFinancialTransmission(state.config);
  state.classAnalysis = createInitialClassAnalysis();
  state.vulnerabilities = createInitialVulnerabilityState();
  state.sentiment = createInitialSentimentState();
  state.information = createInitialInformationSystem();
  state.behavior = createInitialBehavioralState();
  state.external = createInitialExternalSector();
  state.externalActors = createInitialExternalActors();
  state.marketOutcome = createInitialMarketOutcome();
  state.causalDecomposition = createInitialCausalDecomposition();
  state.earlyWarning = createInitialEarlyWarning();
  state.historicalScenario = createInitialHistoricalScenario();
  state.policyCredibility = createInitialPolicyCredibility();
  state.perceived = createInitialPerceivedEconomy();
  state.sectorState = createSectorState();
  state.flowLedger = createFlowLedger();
  state.modelParameters = cloneModelParameters(defaultModelParameters);
  state.modelReliability = createInitialModelReliability();
  state.calibrationDataset = null;
  state.scale = createInitialScale(state.config);
  state.government = {
    taxRate: state.config.householdIncomeTaxRate,
    householdIncomeTaxRate: state.config.householdIncomeTaxRate,
    corporateTaxRate: state.config.corporateTaxRate,
    valueAddedTaxRate: state.config.valueAddedTaxRate,
    interestRate: state.config.interestRate,
    spending: state.config.governmentSpending,
    effectiveSpending: state.config.governmentSpending,
    taxCollectedTick: 0,
    householdIncomeTaxCollectedTick: 0,
    corporateTaxCollectedTick: 0,
    valueAddedTaxCollectedTick: 0,
    spendingActualTick: 0,
    debtServiceTick: 0,
    supportTick: 0,
    procurementTick: 0,
    subsidyTick: 0,
    publicServicesTick: 0,
    balance: 0,
    debt: 8500,
    debtToGdpRatio: 0,
    fiscalSpaceScore: 1,
    fiscalSpaceLabel: "충분함"
  };
  initializePolicyState(state.config);
  state.rates = createInitialRateStructure(state.config);
  state.metrics = createEmptyMetrics();
  state.history = [];
  state.flows = [];
  state.events = [];
  state.markers = [];
  state.selected = null;
  state.hovered = null;
  state.debug.lastSuccessfulTickTime = now();
  state.debug.suppressVisualUpdates = false;
  resetGameStateForCurrentMode();
  state.shock = {
    label: "충격 없음",
    ticksRemaining: 0,
    demandMultiplier: 1,
    productivityMultiplier: 1,
    pricePressure: 0
  };
  assignInitialEmployment();
  applyGameModeStartingConditions();
  state.config = readConfigFromControls();
  initializePolicyState(state.config);
  state.rates = createInitialRateStructure(state.config);
  state.producers.forEach((producer) => {
    producer.longRunPrice = producer.price;
    producer.smoothedTargetEmployees = producer.employees.length;
  });
  state.previousAveragePrice = average(state.producers.map((producer) => producer.price));
  state.previousAverageWage = average(state.producers.map((producer) => producer.wageOffered));
  state.potentialOutputEstimate = state.metrics.gdp || 1;
  state.financialConditionIndex = state.government.interestRate * 100;
  state.smoothedInflation = 0;
  state.smoothedWageGrowth = 0;
  state.priceDrivers = {
    demandPull: 0,
    costPush: 0,
    shortage: 0,
    expectations: 0
  };
  updateMacroMetrics();
  updateMacroFinancialTransmission();
  updatePerceivedEconomy();
  updateExpectationsSystem();
  updateSentimentSystem();
  updateBehavioralSystem();
  updateGameSummaryStats();
  computeScore();
  updateObjectives();
}
