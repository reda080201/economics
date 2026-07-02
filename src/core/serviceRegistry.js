export function createSimulationServices(callbacks) {
  return {
    policy: {
      syncLivePolicy: callbacks.syncLivePolicy,
      applyAutomaticPolicyIfEnabled: callbacks.applyAutomaticPolicyIfEnabled,
      advanceShockClock: callbacks.advanceShockClock,
      advancePolicyTransmission: callbacks.advancePolicyTransmission
    },
    rates: {
      updateInterestRateStructure: callbacks.updateInterestRateStructure,
      applyInterestEffects: callbacks.applyInterestEffects
    },
    expectations: {
      updateMacroFinancialTransmission: callbacks.updateMacroFinancialTransmission,
      updatePerceivedEconomy: callbacks.updatePerceivedEconomy,
      updateExpectationsSystem: callbacks.updateExpectationsSystem,
      updateSentimentSystem: callbacks.updateSentimentSystem,
      updateBehavioralSystem: callbacks.updateBehavioralSystem,
      updateExternalSector: callbacks.updateExternalSector,
      updatePolicyCredibility: callbacks.updatePolicyCredibility,
      updateInflationExpectations: callbacks.updateInflationExpectations,
      updateBusinessOutlook: callbacks.updateBusinessOutlook,
      updateConsumerConfidence: callbacks.updateConsumerConfidence,
      applySentimentToConsumers: callbacks.applySentimentToConsumers,
      applySentimentToFirms: callbacks.applySentimentToFirms
    },
    finance: {
      updateFinancialMarkets: callbacks.updateFinancialMarkets,
      computeDebtStress: callbacks.computeDebtStress,
      propagateFinancialStress: callbacks.propagateFinancialStress
    },
    realEconomy: {
      updateWagePriceSpiral: callbacks.updateWagePriceSpiral,
      updateLaborMarket: callbacks.updateLaborMarket,
      payWages: callbacks.payWages,
      produceGoods: callbacks.produceGoods,
      executeGovernmentSpending: callbacks.executeGovernmentSpending,
      executeConsumerPurchases: callbacks.executeConsumerPurchases,
      executeExternalTrade: callbacks.executeExternalTrade,
      executeProducerInvestment: callbacks.executeProducerInvestment,
      adjustProducerPricesAndExpectations: callbacks.adjustProducerPricesAndExpectations,
      collectProfitTaxes: callbacks.collectProfitTaxes,
      updateMacroMetrics: callbacks.updateMacroMetrics
    },
    assets: {
      updateAssetMarkets: callbacks.updateAssetMarkets,
      applyWealthEffects: callbacks.applyWealthEffects
    },
    diagnostics: {
      updateFirmCreditRatings: callbacks.updateFirmCreditRatings,
      updateZombieFirms: callbacks.updateZombieFirms,
      computeInequalityMetrics: callbacks.computeInequalityMetrics,
      computeSocialStress: callbacks.computeSocialStress,
      computeMarketOutcome: callbacks.computeMarketOutcome,
      updateCausalDecomposition: callbacks.updateCausalDecomposition,
      updateEarlyWarningSystem: callbacks.updateEarlyWarningSystem,
      advanceHistoricalScenarioTimeline: callbacks.advanceHistoricalScenarioTimeline,
      syncHistoricalScenarioMetrics: callbacks.syncHistoricalScenarioMetrics,
      updateTaxSentimentMetrics: callbacks.updateTaxSentimentMetrics,
      updateVulnerabilitySystem: callbacks.updateVulnerabilitySystem,
      updateGameSystems: callbacks.updateGameSystems
    },
    history: {
      updateSfcAccountingLayer: callbacks.updateSfcAccountingLayer,
      appendHistory: callbacks.appendHistory
    },
    ui: {
      shouldUpdateDomThisTick: callbacks.shouldUpdateDomThisTick,
      safeUpdateAllDisplays: callbacks.safeUpdateAllDisplays,
      safeUpdateCharts: callbacks.safeUpdateCharts,
      updateRunState: callbacks.updateRunState,
      recordRuntimeError: callbacks.recordRuntimeError
    },
    safety: {
      stabilizeEconomy: callbacks.stabilizeEconomy,
      sanitizeEconomy: callbacks.sanitizeEconomy,
      repairSimulationState: callbacks.repairSimulationState
    }
  };
}
