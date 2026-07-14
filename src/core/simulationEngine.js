export function shouldRunSimulationStep(state) {
  return state.game.status === "active" || state.game.mode === "sandbox";
}

export function stepSimulationEngine(context) {
      try {
        runSimulationStepEngine(context);
        return true;
      } catch (error) {
        context.state.running = false;
        const callbacks = getEngineCallbacks(context);
        callbacks.repairSimulationState();
        callbacks.safeUpdateAllDisplays();
        callbacks.updateRunState();
        callbacks.recordRuntimeError(error, "시뮬레이션 오류", "오류가 감지되어 일시정지했습니다.");
        return false;
      }
    }

export function safeStepSimulationEngine(context) {
      try {
        return stepSimulationEngine(context);
      } catch (error) {
        context.state.running = false;
        const callbacks = getEngineCallbacks(context);
        callbacks.repairSimulationState();
        callbacks.safeUpdateAllDisplays();
        callbacks.updateRunState();
        callbacks.recordRuntimeError(error, "시뮬레이션 오류", "오류가 감지되어 일시정지했습니다.");
        return false;
      }
    }

export function runSimulationStepEngine(context) {
      const { state, performanceNow } = context;
      const callbacks = getEngineCallbacks(context);
      if (!shouldRunSimulationStep(state)) return;
      if (state.game.activeEvent) return;
      runPolicyPreTickPhase(callbacks);
      state.tick += 1;
      resetTickAccountingEngine(context);
      runPolicyPhase(callbacks);
      runExpectationPhase(callbacks);
      runFinancePhase(callbacks);
      runRealEconomyPhase(callbacks);
      runAssetPhase(callbacks);
      runDiagnosticPhase(callbacks);
      runPostExpectationPhase(callbacks);
      runSafetyPhase(callbacks);
      runHistoryPhase(callbacks);
      runRenderPhase(state, callbacks);
      state.debug.lastSuccessfulTickTime = performanceNow();
    }

export function resetTickAccountingEngine(context) {
      const { state, createEmptyMetrics, safeNumber } = context;
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

function runPolicyPreTickPhase(callbacks) {
  callbacks.syncLivePolicy();
  callbacks.applyAutomaticPolicyIfEnabled();
  callbacks.syncLivePolicy();
}

function runPolicyPhase(callbacks) {
  callbacks.advanceShockClock();
  callbacks.advancePolicyTransmission();
  callbacks.updateInterestRateStructure();
}

function runExpectationPhase(callbacks) {
  callbacks.updateMacroFinancialTransmission();
  callbacks.updatePerceivedEconomy();
  callbacks.updateExpectationsSystem();
  callbacks.updateSentimentSystem();
  callbacks.updateBehavioralSystem();
  callbacks.updateExternalSector();
  callbacks.updatePolicyCredibility();
  callbacks.updateInterestRateStructure();
}

function runFinancePhase(callbacks) {
  callbacks.updateFinancialMarkets();
  callbacks.updateMacroFinancialTransmission();
  callbacks.updatePerceivedEconomy();
  callbacks.updateExpectationsSystem();
  callbacks.updateSentimentSystem();
  callbacks.updateBehavioralSystem();
  callbacks.updateExternalSector();
  callbacks.updatePolicyCredibility();
  callbacks.updateInterestRateStructure();
  callbacks.applyInterestEffects();
  callbacks.computeDebtStress();
  callbacks.propagateFinancialStress();
}

function runRealEconomyPhase(callbacks) {
  callbacks.updateWagePriceSpiral();
  callbacks.updateLaborMarket();
  callbacks.payWages();
  callbacks.produceGoods();
  callbacks.executeGovernmentSpending();
  callbacks.executeConsumerPurchases();
  callbacks.executeProducerInvestment();
  callbacks.executeExternalTrade();
  callbacks.adjustProducerPricesAndExpectations();
  callbacks.collectProfitTaxes();
  callbacks.updateMacroMetrics();
  callbacks.updateExternalSector();
}

function runAssetPhase(callbacks) {
  callbacks.updateAssetMarkets();
  callbacks.updateFinancialMarkets();
  callbacks.updateInterestRateStructure();
}

function runDiagnosticPhase(callbacks) {
  callbacks.updateMacroFinancialTransmission();
  callbacks.updatePerceivedEconomy();
  callbacks.updateExpectationsSystem();
  callbacks.updateSentimentSystem();
  callbacks.updateBehavioralSystem();
  callbacks.updateFirmCreditRatings();
  callbacks.updateZombieFirms();
  callbacks.computeInequalityMetrics();
  callbacks.computeSocialStress();
  callbacks.computeMarketOutcome();
  callbacks.updateCausalDecomposition();
  callbacks.updateEarlyWarningSystem();
  callbacks.advanceHistoricalScenarioTimeline();
  callbacks.syncHistoricalScenarioMetrics();
  callbacks.updateVulnerabilitySystem();
}

function runPostExpectationPhase(callbacks) {
  callbacks.applyWealthEffects();
  callbacks.updateInflationExpectations();
  callbacks.updateBusinessOutlook();
  callbacks.updateConsumerConfidence();
  callbacks.applySentimentToConsumers();
  callbacks.applySentimentToFirms();
}

function runSafetyPhase(callbacks) {
  callbacks.stabilizeEconomy();
  callbacks.sanitizeEconomy();
  callbacks.repairSimulationState();
}

function runHistoryPhase(callbacks) {
  callbacks.updateSfcAccountingLayer();
  callbacks.appendHistory();
  callbacks.updateGameSystems();
}

function runRenderPhase(state, callbacks) {
  if (state.debug.suppressVisualUpdates) return;
  if (callbacks.shouldUpdateDomThisTick()) callbacks.safeUpdateAllDisplays();
  callbacks.safeUpdateCharts();
}

function getEngineCallbacks(context) {
  if (context.callbacks) return context.callbacks;
  const services = context.services || {};
  return {
    ...(services.policy || {}),
    ...(services.rates || {}),
    ...(services.expectations || {}),
    ...(services.finance || {}),
    ...(services.realEconomy || {}),
    ...(services.assets || {}),
    ...(services.diagnostics || {}),
    ...(services.history || {}),
    ...(services.ui || {}),
    ...(services.safety || {})
  };
}
