export function updateInspectorPanel(context) {
  const {
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
  } = context;

  els.taxCollectedValue.textContent = macroMoney(state.metrics.taxCollected);
  els.householdIncomeTaxValue.textContent = macroMoney(state.metrics.householdIncomeTaxCollected);
  els.corporateTaxCollectedValue.textContent = macroMoney(state.metrics.corporateTaxCollected);
  els.vatRevenueValue.textContent = macroMoney(state.metrics.valueAddedTaxCollected);
  els.taxCompositionValue.textContent = taxCompositionLabel();
  setSentimentPill(els.taxSentimentValue, state.metrics.taxSentimentLabel || "보통", state.metrics.taxSentimentScore > 0.52);
  els.spendingActualValue.textContent = macroMoney(state.metrics.governmentSpendingActual);
  els.governmentDebtServiceValue.textContent = macroMoney(state.metrics.governmentDebtService);
  els.debtToGdpValue.textContent = percent(state.metrics.debtToGdpRatio * 100, 1);
  els.fiscalSpaceValue.textContent = state.metrics.fiscalSpaceLabel;
  els.wagesValue.textContent = macroMoney(state.metrics.wages);
  els.unitsSoldValue.textContent = round(state.metrics.unitsSold, 1).toLocaleString("ko-KR");
  els.unitsProducedValue.textContent = round(state.metrics.productionUnits, 1).toLocaleString("ko-KR");
  els.giniValue.textContent = round(state.metrics.gini, 2).toFixed(2);
  els.householdDebtValue.textContent = macroMoney(state.metrics.householdDebt);
  els.firmDebtValue.textContent = macroMoney(state.metrics.firmDebt);
  els.debtBurdenValue.textContent = percent(state.metrics.debtServiceBurden, 1);
  els.firmDscrValue.textContent = round(state.metrics.averageFirmDSCR, 2).toFixed(2);
  els.incomeInequalityValue.textContent = round(state.metrics.incomeInequality, 2).toFixed(2);
  els.wealthInequalityValue.textContent = round(state.metrics.wealthInequality, 2).toFixed(2);
  setSentimentPill(els.lowIncomeConsumptionCapacityValue, capacityLabel(state.metrics.lowIncomeConsumptionCapacity), state.metrics.lowIncomeConsumptionCapacity < 0.75);
  els.middleClassHousingBurdenValue.textContent = percent(state.metrics.middleClassHousingBurden, 1);
  els.wealthyAssetEffectValue.textContent = signedPercent(state.metrics.wealthyAssetEffect);
  setSentimentPill(els.socialStressIndexValue, riskLabel(state.metrics.socialStressIndex), true);
  els.mainPressureClassValue.textContent = state.metrics.mainPressureClass || "없음";
  setSentimentPill(els.lowIncomeStressValue, riskLabel(state.metrics.lowIncomeStress), true);
  setSentimentPill(els.middleMortgageStressValue, riskLabel(state.metrics.middleClassMortgageStress), true);
  setSentimentPill(els.wealthyAssetStressValue, riskLabel(state.metrics.wealthyAssetStress), true);
  setSentimentPill(els.hiddenVulnerabilityValue, state.metrics.vulnerabilityLabel || riskLabel(state.metrics.hiddenVulnerabilityIndex), true);
  els.dominantVulnerabilityValue.textContent = state.metrics.dominantVulnerability || "없음";
  setSentimentPill(els.householdVulnerabilityValue, riskLabel(state.metrics.householdVulnerability), true);
  setSentimentPill(els.firmVulnerabilityValue, riskLabel(state.metrics.firmVulnerability), true);
  setSentimentPill(els.bankVulnerabilityValue, riskLabel(state.metrics.bankVulnerability), true);
  setSentimentPill(els.housingVulnerabilityValue, riskLabel(state.metrics.housingVulnerability), true);
  setSentimentPill(els.externalVulnerabilityValue, riskLabel(state.metrics.externalVulnerability), true);
  setSentimentPill(els.marketSuccessValue, state.metrics.marketSuccessScore > 0.68 ? "강함" : state.metrics.marketSuccessScore > 0.52 ? "보통" : "약함");
  setSentimentPill(els.marketFailureValue, riskLabel(state.metrics.marketFailureRisk), true);
  setSentimentPill(els.allocationQualityValue, sentimentLabel(state.metrics.allocationQuality));
  els.marketFailureTypeValue.textContent = state.metrics.marketFailureType || "없음";
  els.marketSuccessTypeValue.textContent = state.metrics.marketSuccessType || "형성 중";
  if (els.historicalScenarioStatusValue) {
    els.historicalScenarioStatusValue.textContent = historicalScenarioStatusLabel();
  }
  updateModelReliabilityPanel();
  setSentimentPill(els.manufacturingStressValue, riskLabel(sectorStressValue("manufacturing")), true);
  setSentimentPill(els.servicesDemandValue, sectorDemandLabel("services"));
  setSentimentPill(els.constructionStressValue, riskLabel(sectorStressValue("construction")), true);
  setSentimentPill(els.financialSectorStressValue, riskLabel(sectorStressValue("financial")), true);
  setSentimentPill(els.technologyValuationPressureValue, valuationPressureLabel(clamp(sectorStressValue("technology") + state.metrics.stockValuationPressure * 0.35, 0, 1)), true);
  setSentimentPill(els.agricultureStressValue, riskLabel(sectorStressValue("agriculture")), true);
  setSentimentPill(els.energySectorStressValue, riskLabel(sectorStressValue("energy")), true);
  els.mostStressedSectorValue.textContent = state.metrics.mostStressedSector || "없음";
  els.sectorCountSummaryValue.textContent = sectorCountSummaryLabel();
  els.sectorProfitInvestmentValue.textContent = `${macroMoney(state.metrics.sectorTotalProfit)} / ${macroMoney(state.metrics.sectorTotalInvestment)}`;
  els.buybackShareValue.textContent = macroMoney(state.metrics.buybackDividendSpending);
  els.investmentConversionValue.textContent = percent(state.metrics.investmentConversionRate * 100, 1);
  els.cashDebtAllocationValue.textContent = `${macroMoney(state.metrics.retainedEarningsAllocation)} / ${macroMoney(state.metrics.debtRepaymentAllocation)}`;
  els.exchangeRateIndexValue.textContent = round(state.metrics.exchangeRateIndex, 1).toFixed(1);
  els.importPriceIndexValue.textContent = round(state.metrics.importPriceIndex, 1).toFixed(1);
  els.commodityPriceIndexValue.textContent = round(state.metrics.commodityPriceIndex, 1).toFixed(1);
  els.energyPriceIndexValue.textContent = round(state.metrics.energyPriceIndex, 1).toFixed(1);
  els.tradeBalanceValue.textContent = macroMoney(state.metrics.tradeBalance);
  els.foreignConsumerDemandValue.textContent = round(state.metrics.foreignConsumerDemand, 1).toFixed(1);
  setSentimentPill(els.foreignInvestorSentimentValue, sentimentLabel(state.metrics.foreignInvestorSentiment));
  setSentimentPill(els.foreignBondDemandValue, sentimentLabel(state.metrics.foreignBondDemand));
  setSentimentPill(els.foreignSupplierPressureValue, riskLabel(state.metrics.foreignSupplierPressure), true);
  els.foreignCapitalFlowValue.textContent = macroMoney(state.metrics.foreignCapitalFlow);
  setSentimentPill(els.centralBankCredibilityValue, sentimentLabel(state.metrics.centralBankCredibility));
  els.expectedRatePathValue.textContent = state.metrics.ratePathLabel || "중립";
  setSentimentPill(els.forwardGuidanceClarityValue, sentimentLabel(state.metrics.forwardGuidanceClarity));
  setSentimentPill(els.inflationTargetCredibilityValue, sentimentLabel(state.metrics.inflationTargetCredibility));
  els.policyRateDetailValue.textContent = percent(state.metrics.interestRatePercent, 2);
  els.shortTermRateValue.textContent = percent(state.metrics.shortTermRate, 2);
  els.treasuryBill3MValue.textContent = percent(state.metrics.treasuryBill3M, 2);
  els.bondYield2YValue.textContent = percent(state.metrics.bondYield2Y, 2);
  els.bondYield5YValue.textContent = percent(state.metrics.bondYield5Y, 2);
  els.bondYield10YValue.textContent = percent(state.metrics.bondYield10Y, 2);
  els.bondYield30YValue.textContent = percent(state.metrics.bondYield30Y, 2);
  els.loanRateDetailValue.textContent = percent(state.metrics.loanRate, 2);
  els.mortgageRateDetailValue.textContent = percent(state.metrics.mortgageRate, 2);
  els.corporateLoanRateValue.textContent = percent(state.metrics.corporateLoanRate, 2);
  els.depositRateDetailValue.textContent = percent(state.metrics.depositRate, 2);
  els.realPolicyRateValue.textContent = signedPercent(state.metrics.realPolicyRate);
  els.termSpreadValue.textContent = `${round(state.metrics.termSpread, 2).toFixed(2)}%p`;
  els.longBondPriceIndexValue.textContent = round(state.metrics.longBondPriceIndex, 1).toFixed(1);
  setSentimentPill(els.bondMarketStressValue, riskLabel(state.metrics.bondMarketStress), true);
  setSentimentPill(els.rateUncertaintyValue, state.metrics.rateUncertainty < 0.25 ? "낮음" : state.metrics.rateUncertainty < 0.50 ? "주의" : state.metrics.rateUncertainty < 0.75 ? "높음" : "위험", true);
  els.averageCreditRatingValue.textContent = creditRatingLabelFromScore(state.metrics.averageCreditRatingScore);
  els.distressedFirmRatioValue.textContent = percent(state.metrics.distressedFirmRatio, 1);
  els.zombieFirmRatioValue.textContent = percent(state.metrics.zombieFirmRatio, 1);
  els.averageDefaultRiskValue.textContent = percent(state.metrics.averageDefaultRisk, 1);
  els.stockIndexValue.textContent = formatIndexPoint(state.metrics.stockIndexPoints);
  els.housingIndexValue.textContent = round(state.metrics.residentialIndex || state.metrics.housingIndex, 1).toFixed(1);
  els.commercialIndexValue.textContent = round(state.metrics.commercialIndex, 1).toFixed(1);
  els.stockReturnValue.textContent = formatStockReturn(state.metrics.stockMonthlyReturn / 100);
  els.stockVolatilityValue.textContent = state.metrics.stockVolatilityLabel || stockVolatilityLabel((state.metrics.stockVolatility || 0) / 100);
  els.stockValuationPressureValue.textContent = state.metrics.stockValuationPressureLabel || valuationPressureLabel(state.metrics.stockValuationPressure);
  els.stockMispricingValue.textContent = signedPercent(state.metrics.stockMispricing);
  els.housingMispricingValue.textContent = signedPercent(state.metrics.housingMispricing);
  els.speculativeDemandValue.textContent = behavioralLabel(state.metrics.speculativeDemandPressure);
  els.stockRiskSentimentValue.textContent = state.metrics.stockRiskSentimentLabel || stockRiskSentimentLabel(state.metrics.stockRiskSentiment);
  els.housingReturnValue.textContent = signedPercent(state.metrics.residentialReturn || state.metrics.housingReturn);
  els.wealthEffectValue.textContent = signedPercent(state.metrics.wealthEffect);
  els.housingAffordabilityValue.textContent = round(state.metrics.housingAffordability, 2).toFixed(2);
  els.mortgageBurdenValue.textContent = percent(state.metrics.averageMortgageBurden, 1);
  els.negativeEquityRatioValue.textContent = percent(state.metrics.negativeEquityRatio, 1);
  els.assetBubbleRiskValue.textContent = state.metrics.assetBubbleRiskLabel;
  els.landIndexValue.textContent = round(state.metrics.landIndex, 1).toFixed(1);
  els.rentIndexValue.textContent = round(state.metrics.rentIndex, 1).toFixed(1);
  els.commercialVacancyValue.textContent = percent(state.metrics.commercialVacancy, 1);
  els.collateralValueIndexValue.textContent = round(state.metrics.collateralValueIndex, 1).toFixed(1);
  els.realEstateStressValue.textContent = realEstateStressLabel(state.metrics.realEstateStress);
  els.averageFirmStockPriceValue.textContent = money(state.metrics.averageFirmStockPrice, 1);
  els.firmStockRangeValue.textContent = `${money(state.metrics.highestFirmStockPrice, 1)} / ${money(state.metrics.lowestFirmStockPrice, 1)}`;
  els.firmStockVolatilityValue.textContent = percent(state.metrics.firmStockVolatility, 1);
  els.opaqueFirmRatioValue.textContent = percent(state.metrics.opaqueFirmRatio, 1);
  els.stockCrashFirmCountValue.textContent = `${Math.round(state.metrics.stockCrashFirmCount || 0)}개`;
  els.financialConditionIndexValue.textContent = round(state.metrics.financialConditionIndex, 1).toFixed(1);
  els.bondYieldValue.textContent = percent(state.metrics.bondYield, 2);
  els.bondPriceIndexValue.textContent = round(state.metrics.bondPriceIndex, 1).toFixed(1);
  els.creditSpreadValue.textContent = `${round(state.metrics.creditSpread, 2).toFixed(2)}%p`;
  els.bankHealthValue.textContent = round(state.metrics.bankHealthIndex, 1).toFixed(1);
  els.bankLendingStandardValue.textContent = state.metrics.bankLendingStandard || "정상";
  els.creditSupplyValue.textContent = round(state.metrics.creditSupplyIndex, 1).toFixed(1);
  setSentimentPill(els.depositorConfidenceValue, sentimentLabel(state.metrics.depositorConfidence));
  setSentimentPill(els.interbankTrustValue, sentimentLabel(state.metrics.interbankTrust));
  setSentimentPill(els.bankFundingPressureValue, riskLabel(state.metrics.bankFundingPressure), true);
  setSentimentPill(els.creditOfficerCautionValue, riskLabel(state.metrics.creditOfficerCaution), true);
  els.loanDemandIndexValue.textContent = round(state.metrics.loanDemandIndex, 1).toFixed(1);
  els.creditCyclePhaseValue.textContent = state.metrics.creditCyclePhase || "정상";
  els.depositRateValue.textContent = percent(state.metrics.depositRate, 2);
  els.loanRateValue.textContent = percent(state.metrics.loanRate, 2);
  els.nplRatioValue.textContent = percent(state.metrics.nonPerformingLoanRatio, 1);
  els.goldIndexValue.textContent = round(state.metrics.goldIndex, 1).toFixed(1);
  els.silverIndexValue.textContent = round(state.metrics.silverIndex, 1).toFixed(1);
  els.safeHavenDemandValue.textContent = percent(state.metrics.safeHavenDemand, 1);
  els.bankingCrisisRiskValue.textContent = state.metrics.bankingCrisisRiskLabel;
  updateSentimentPanel();
  updateClassAnalysisPanel();
  updateMarketPsychologyPanel();
  updateInformationGapPanel();
  updateBehaviorPanel();
  renderEarlyWarningPanel();
  renderCausalDecompositionPanel();
  updateTransmissionMap();
  updatePolicyImpactPanel();
  safeUpdateBalanceDiagnostics();
  explainMacroState();
  renderSelectedAgent();
  renderEventLog();
}
