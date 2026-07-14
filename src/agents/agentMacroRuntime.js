// Agent sentiment, information, behavioral, inequality, and vulnerability runtime.
// Extracted from main.js with formulas preserved; dependencies are supplied by context.
export function createAgentMacroRuntime(context) {
  const {
    state,
    CALIBRATION,
    NEUTRAL_INTEREST_RATE,
    TARGET_INFLATION,
    TARGET_UNEMPLOYMENT,
    TICKS_PER_MONTH,
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
    rand,
    pushEvent,
    safeNumber,
    safeValue,
    sectorLabel,
    sentimentLabel,
    sentimentSmoothing,
    smoothValue,
    sum,
    updatePerceivedValue
  } = context;

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



  function computeRumorEffects() {
    const info = state.information;
    if (!info) return;
    const decay = Math.pow(0.5, 1 / Math.max(4, safeNumber(info.rumorHalfLife, 18)));
    info.rumorIntensity = clamp(safeNumber(info.rumorIntensity, 0) * decay, 0, 1);
    info.newsShockIntensity = clamp(safeNumber(info.newsShockIntensity, 0) * 0.92, 0, 1);
    if (state.tick > TICKS_PER_MONTH * 6 && state.tick - safeNumber(info.lastRumorTick, -999) > TICKS_PER_MONTH * 10 && rand(0, 1) < 0.0025) {
      const candidates = [
        { type: "recession", label: "경기침체 우려 확산", credibility: 0.48 },
        { type: "bank", label: "은행 부실 루머", credibility: 0.42 },
        { type: "housing", label: "부동산 가격 하락 우려", credibility: 0.44 },
        { type: "rateCut", label: "금리 인하 기대 확대", credibility: 0.38 },
        { type: "earnings", label: "기업 실적 개선 기대", credibility: 0.34 },
        { type: "fiscal", label: "정부 재정 신뢰도 논란", credibility: 0.40 },
        { type: "inflation", label: "인플레이션 재가속 우려", credibility: 0.45 }
      ];
      const rumor = candidates[Math.floor(rand(0, candidates.length))];
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



  return {
    updateSentimentSystem,
    updatePerceivedEconomy,
    updateInformationSystem,
    computeRumorEffects,
    updateExpectationsSystem,
    syncInformationMetrics,
    syncSentimentMetrics,
    updateBehavioralSystem,
    computeHerdBehavior,
    syncBehaviorMetrics,
    computeInequalityMetrics,
    computeClassMetrics,
    computeClassSentiment,
    computeClassStress,
    computeClassMainPressure,
    computeClassPolicyDemand,
    computeSocialStress,
    updateVulnerabilitySystem
  };
}
