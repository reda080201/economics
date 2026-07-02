import {
  NEUTRAL_INTEREST_RATE,
  TARGET_INFLATION,
  TARGET_UNEMPLOYMENT
} from "./config.js";
import { clamp, safeNumber } from "./mathUtils.js";

export function createInitialScale(config = {}) {
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

export function createInitialAssetMarket() {
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

export function createInitialRealEstateMarket() {
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

export function createInitialFinancialMarket(config = {}) {
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

export function createInitialRateStructure(config = {}) {
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

export function createInitialMacroFinancialTransmission(config = {}) {
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

export function createInitialCreditCycle() {
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

export function createInitialSentimentState() {
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

export function createInitialInformationSystem() {
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

export function createInitialBehavioralState() {
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

export function createInitialExternalSector() {
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

export function createInitialExternalActors() {
  return {
    foreignConsumers: { demandIndex: 100, confidence: 0.72, exportPull: 1 },
    foreignInvestors: { sentiment: 0.72, capitalFlow: 0, equityFlow: 0 },
    foreignBondholders: { demand: 0.74, fundingPressure: 0.12 },
    foreignSuppliers: { pressure: 0.18, deliveryStress: 0.12 }
  };
}

export function createInitialModelReliability() {
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

export function createInitialHistoricalScenario() {
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

export function createInitialPolicyCredibility() {
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

export function createInitialPerceivedEconomy() {
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

export function createInitialClassAnalysis() {
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

export function householdClassOrder() {
  return [
    { key: "low", label: "저소득층", defaultShare: 35 },
    { key: "middle", label: "중산층", defaultShare: 40 },
    { key: "high", label: "고소득층", defaultShare: 18 },
    { key: "wealthy", label: "자산가", defaultShare: 7 }
  ];
}

export function createInitialVulnerabilityState() {
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
