export function shouldRunSimulationStep(state) {
  return state.game.status === "active" || state.game.mode === "sandbox";
}

export function stepSimulationEngine(context) {
      try {
        runSimulationStepEngine(context);
        return true;
      } catch (error) {
        context.state.running = false;
        context.callbacks.repairSimulationState();
        context.callbacks.safeUpdateAllDisplays();
        context.callbacks.updateRunState();
        context.callbacks.recordRuntimeError(error, "시뮬레이션 오류", "오류가 감지되어 일시정지했습니다.");
        return false;
      }
    }

export function safeStepSimulationEngine(context) {
      try {
        return stepSimulationEngine(context);
      } catch (error) {
        context.state.running = false;
        context.callbacks.repairSimulationState();
        context.callbacks.safeUpdateAllDisplays();
        context.callbacks.updateRunState();
        context.callbacks.recordRuntimeError(error, "시뮬레이션 오류", "오류가 감지되어 일시정지했습니다.");
        return false;
      }
    }

export function runSimulationStepEngine(context) {
      const { state, callbacks, performanceNow } = context;
      if (!shouldRunSimulationStep(state)) return;
      if (state.game.activeEvent) return;
      callbacks.syncLivePolicy();
      callbacks.applyAutomaticPolicyIfEnabled();
      callbacks.syncLivePolicy();
      state.tick += 1;
      resetTickAccountingEngine(context);
      callbacks.advanceShockClock();
      callbacks.advancePolicyTransmission();
      callbacks.updateInterestRateStructure();

      callbacks.updateMacroFinancialTransmission();
      callbacks.updatePerceivedEconomy();
      callbacks.updateExpectationsSystem();
      callbacks.updateSentimentSystem();
      callbacks.updateBehavioralSystem();
      callbacks.updateExternalSector();
      callbacks.updatePolicyCredibility();
      callbacks.updateInterestRateStructure();
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
      callbacks.updateWagePriceSpiral();
      callbacks.updateLaborMarket();
      callbacks.payWages();
      callbacks.produceGoods();
      callbacks.executeGovernmentSpending();
      callbacks.executeConsumerPurchases();
      callbacks.executeExternalTrade();
      callbacks.executeProducerInvestment();
      callbacks.adjustProducerPricesAndExpectations();
      callbacks.collectProfitTaxes();
      callbacks.updateMacroMetrics();
      callbacks.updateExternalSector();
      callbacks.updateAssetMarkets();
      callbacks.updateFinancialMarkets();
      callbacks.updateInterestRateStructure();
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
      callbacks.updateTaxSentimentMetrics();
      callbacks.updateVulnerabilitySystem();
      callbacks.applyWealthEffects();
      callbacks.updateInflationExpectations();
      callbacks.updateBusinessOutlook();
      callbacks.updateConsumerConfidence();
      callbacks.applySentimentToConsumers();
      callbacks.applySentimentToFirms();
      callbacks.stabilizeEconomy();
      callbacks.sanitizeEconomy();
      callbacks.repairSimulationState();
      callbacks.updateSfcAccountingLayer();
      callbacks.appendHistory();
      callbacks.updateGameSystems();
      if (!state.debug.suppressVisualUpdates) {
        if (callbacks.shouldUpdateDomThisTick()) callbacks.safeUpdateAllDisplays();
        callbacks.safeUpdateCharts();
      }
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
