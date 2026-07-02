export function cacheElements(els, documentRef = document) {
  const cacheElementIds = (ids) => {
    ids.forEach((id) => {
      els[id] = documentRef.getElementById(id);
    });
  };

  cacheElementIds([
    "runPulse", "runState", "tickDisplay", "startBtn", "pauseBtn", "resetBtn", "stepBtn", "shockBtn",
    "modeStatusValue", "gameModeSelect", "startGameModeBtn", "speedValue", "speedSlider",
    "performanceModeSelect", "consumerValue", "consumerSlider", "producerValue", "producerSlider",
    "interestValue", "interestSlider", "taxValue", "taxSlider", "corporateTaxValue",
    "corporateTaxSlider", "vatValue", "vatSlider", "spendingValue", "spendingSlider",
    "wageValue", "wageSlider", "inflationSensitivityValue", "inflationSlider", "scenarioSelect",
    "applyScenarioBtn", "historicalScenarioBtn", "autoPolicyToggle", "randomPolicyEventsToggle"
  ]);

  cacheElementIds([
    "calendarValue", "phaseValue", "scoreValue", "bestScoreValue", "feedbackBanners",
    "macroFocusLineValue",
    "gdpValue", "outputValue", "consumptionValue", "investmentValue", "unemploymentValue",
    "employmentValue", "priceValue", "inflationValue", "rateValue", "balanceValue",
    "debtValue", "householdCashValue", "confidenceValue", "firmCashValue", "inventoryValue",
    "shockBadge", "consumptionDeltaValue", "investmentDeltaValue", "unemploymentDeltaValue",
    "priceDeltaValue"
  ]);

  cacheElementIds([
    "simCanvas", "canvasTooltip", "gdpChart", "priceChart", "unemploymentChart", "demandChart",
    "governmentChart", "assetChart", "firmStockChart", "financialChart", "safeAssetChart",
    "sentimentChart", "modelChart"
  ]);

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

  cacheElementIds([
    "modelSelector", "useCurrentEconomyBtn", "runModelBtn", "modelInputs", "modelResultSummary",
    "modelInterpretation", "modelComparisonList"
  ]);

  cacheElementIds([
    "toastStack", "endOverlay", "endTitle", "endReason", "endSummaryGrid", "endRestartBtn",
    "endSandboxBtn"
  ]);
}
