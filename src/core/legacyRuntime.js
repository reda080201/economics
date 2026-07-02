// Large legacy runtime facade extracted from main.js.
// This keeps formulas stable while main.js moves toward app orchestration only.
export function createLegacyRuntime(context) {
  const {
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
  } = context;

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



  return {
    repairSimulationState,
    sanitizeEconomy,
    classifyMacroState,
    getBalanceDiagnosticSnapshot,
    appendHistory,
    getDominantTransmissionChain,
    updateMacroFinancialTransmission,
    createEmptyMetrics,
    executeProducerInvestment,
    updateBalanceDiagnostics,
    updateRealEstateMarkets,
    renderPolicyRecommendations,
    applyHistoricalPhaseEffects,
    getHistoricalScenarioTimeline,
    getCalibrationPresets,
    getPolicyEvents,
    computeStockReturn,
    computeDebtStress,
    updateFirmStocks,
    renderSelectedAgent,
    applyCalibrationState,
    createConsumers,
    createProducers,
    applyInterestEffects,
    updateFirmCreditRatings,
    updateAssetMarkets,
    applyWealthEffects,
    applyShock,
    updateFinancialConditionIndex,
    stabilizeEconomy,
    getModelHealthWarnings,
    applyGameModeStartingConditions,
    computeAssetBubbleRisk,
    checkFailureConditions,
    syncAssetMetrics,
    applySentimentToFirms,
    updateBusinessOutlook,
    updateObjectives,
    triggerPolicyEvent,
    updateWagePriceSpiral,
    computeFearGreedIndex,
    applySentimentToConsumers,
    updateConsumerConfidence,
    computeScore,
    syncRealEstateMetrics,
    updateMarketPsychology,
    computeHousingReturn,
    updatePolicyCredibility,
    getCurrentEconomySnapshot,
    explainMacroState,
    propagateFinancialStress,
    renderFeedbackBanners,
    handlePolicyChange,
    updateGameDisplay,
    getCalendarLabel,
    getEconomyPhase,
    renderObjectives
  };
}
