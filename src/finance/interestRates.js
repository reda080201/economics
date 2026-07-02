import { BOND_PRICE_RETURN_LIMIT, NEUTRAL_INTEREST_RATE, TARGET_INFLATION } from "../core/config.js";
import { clamp, safeNumber, smoothValue } from "../core/mathUtils.js";

export function updateInterestRateStructure(context) {
  const {
    state,
    createInitialFinancialMarket,
    createInitialPolicyCredibility,
    createInitialRateStructure,
    createInitialSentimentState,
    getGDPGrowthWindow
  } = context;

  if (!state.rates) state.rates = createInitialRateStructure(state.config || {});
  const rates = state.rates;
  const financial = state.financialMarket || createInitialFinancialMarket(state.config || {});
  const sentiment = state.sentiment || createInitialSentimentState();
  const credibility = state.policyCredibility || createInitialPolicyCredibility();
  const policyRate = safeNumber(state.policy?.interestTarget, safeNumber(state.config?.interestRate, NEUTRAL_INTEREST_RATE / 100));
  const effectivePolicyRate = safeNumber(state.policy?.interestEffective, safeNumber(state.government?.interestRate, policyRate));
  const expectedInflation = clamp(safeNumber(sentiment.inflationExpectations, TARGET_INFLATION) / 100, -0.02, 0.09);
  const inflationGap = safeNumber(state.metrics.inflationGap, 0) / 100;
  const unemploymentGap = safeNumber(state.metrics.unemploymentGap, 0) / 100;
  const taylorGap = inflationGap * 0.55 - unemploymentGap * 0.30 + safeNumber(state.metrics.outputGap, 0) / 100 * 0.10;
  const credibilityGap = 1 - safeNumber(credibility.centralBankCredibility, 0.78);
  const marketFear = safeNumber(sentiment.recessionFear, 0.2) * 0.010 + Math.max(0, 0.55 - safeNumber(sentiment.marketRiskSentiment, 0.7)) * 0.012;
  const expectedRateChange = clamp(taylorGap + credibilityGap * Math.max(0, inflationGap) * 0.8 - marketFear, -0.045, 0.055);
  const expectedPathTarget = clamp(effectivePolicyRate + expectedRateChange, 0, 0.28);
  const previousEffective = safeNumber(rates.effectivePolicyRate, effectivePolicyRate);
  const policySurprise = clamp((effectivePolicyRate - previousEffective) - safeNumber(rates.expectedRateChangeNext12M, 0) / 12, -0.04, 0.04);
  const fiscalRisk = clamp(safeNumber(state.metrics.debtToGdpRatio, 0) * 0.010 + Math.max(0, 0.45 - safeNumber(state.metrics.fiscalSpaceScore, 1)) * 0.014 + credibilityGap * 0.010, 0, 0.065);
  const sovereignRiskPremium = clamp(smoothValue(safeNumber(rates.sovereignRiskPremium, 0.006), fiscalRisk + Math.max(0, 0.55 - safeNumber(state.metrics.fiscalCredibility, 0.78)) * 0.012, 0.07), 0, 0.08);
  const bondMarketLiquidity = clamp(smoothValue(safeNumber(rates.bondMarketLiquidity, 0.86), 0.94 - safeNumber(financial.liquidityStress, 0.05) * 0.28 - safeNumber(financial.bondMarketStress, 0.10) * 0.22 + safeNumber(financial.flightToQualityDemand, 0.05) * 0.08, 0.06), 0.35, 1.05);
  const termPremium = clamp(0.008 + safeNumber(financial.riskAversion, 0.2) * 0.010 + sovereignRiskPremium * 0.55 + Math.max(0, 0.82 - bondMarketLiquidity) * 0.018 - Math.max(0, -expectedRateChange) * 0.10, 0.002, 0.060);
  const durationRiskPremium = clamp(0.004 + Math.max(0, termPremium - 0.012) * 0.55 + safeNumber(rates.rateUncertainty, 0.08) * 0.008 + Math.max(0, 0.76 - bondMarketLiquidity) * 0.016, 0.001, 0.045);
  const creditSpread = safeNumber(financial.creditSpread, safeNumber(rates.creditSpread, 0.02));
  const bankStressPremium = safeNumber(financial.bankStress, 0.12) * 0.025;
  const mortgageSpread = safeNumber(rates.mortgageSpread, 0.022) + safeNumber(financial.bankStress, 0.12) * 0.012;
  const corporateRiskPremium = creditSpread * 0.55 + safeNumber(state.metrics.distressedFirmRatio, 0) / 100 * 0.018 + safeNumber(state.metrics.zombieFirmRatio, 0) / 100 * 0.010;
  const bill3MTarget = clamp(effectivePolicyRate * 0.86 + expectedPathTarget * 0.14 + expectedInflation * 0.035, 0, 0.22);
  const bond2YTarget = clamp(expectedPathTarget * 0.72 + effectivePolicyRate * 0.28 + expectedInflation * 0.18 + credibilityGap * 0.010, 0.002, 0.24);
  const longRunRate = safeNumber(rates.neutralRate, NEUTRAL_INTEREST_RATE / 100) + expectedRateChange * 0.35;
  const bond5YTarget = clamp(bond2YTarget * 0.42 + longRunRate * 0.34 + expectedInflation * 0.35 + termPremium * 0.60 + sovereignRiskPremium * 0.36, 0.003, 0.24);
  const bond10YTarget = clamp(longRunRate + expectedInflation * 0.55 + termPremium + sovereignRiskPremium, 0.004, 0.24);
  const bond30YTarget = clamp(longRunRate + expectedInflation * 0.68 + termPremium * 1.15 + sovereignRiskPremium * 1.10 + durationRiskPremium, 0.006, 0.26);

  rates.policyRate = policyRate;
  rates.effectivePolicyRate = effectivePolicyRate;
  rates.expectedRateChangeNext12M = smoothValue(safeNumber(rates.expectedRateChangeNext12M, 0), expectedRateChange, 0.12);
  rates.expectedPolicyRatePath = smoothValue(safeNumber(rates.expectedPolicyRatePath, expectedPathTarget), expectedPathTarget, 0.16);
  rates.shortTermRate = smoothValue(safeNumber(rates.shortTermRate, effectivePolicyRate), effectivePolicyRate, 0.25);
  rates.treasuryBill3M = clamp(smoothValue(safeNumber(rates.treasuryBill3M, bill3MTarget), bill3MTarget, 0.22), 0, 0.22);
  rates.depositRate = clamp(smoothValue(safeNumber(rates.depositRate, effectivePolicyRate * 0.62), effectivePolicyRate * 0.65, 0.10), 0, 0.16);
  rates.bondYield2Y = clamp(smoothValue(safeNumber(rates.bondYield2Y, bond2YTarget), bond2YTarget, 0.16), 0.002, 0.24);
  rates.bondYield5Y = clamp(smoothValue(safeNumber(rates.bondYield5Y, bond5YTarget), bond5YTarget, 0.11), 0.003, 0.24);
  rates.bondYield10Y = clamp(smoothValue(safeNumber(rates.bondYield10Y, bond10YTarget), bond10YTarget, 0.08), 0.004, 0.24);
  rates.bondYield30Y = clamp(smoothValue(safeNumber(rates.bondYield30Y, bond30YTarget), bond30YTarget, 0.055), 0.006, 0.26);
  rates.creditSpread = clamp(creditSpread, 0.01, 0.12);
  rates.loanRate = clamp(smoothValue(safeNumber(rates.loanRate, effectivePolicyRate + creditSpread), effectivePolicyRate + creditSpread + bankStressPremium, 0.08), 0.005, 0.28);
  rates.mortgageRate = clamp(smoothValue(safeNumber(rates.mortgageRate, rates.bondYield10Y + mortgageSpread), rates.bondYield10Y + mortgageSpread + bankStressPremium * 0.65, 0.06), 0.006, 0.30);
  rates.corporateLoanRate = clamp(smoothValue(safeNumber(rates.corporateLoanRate, rates.loanRate + 0.006), Math.max(rates.loanRate, rates.bondYield2Y + corporateRiskPremium) + bankStressPremium * 0.35, 0.075), 0.006, 0.32);
  rates.realPolicyRate = clamp(rates.effectivePolicyRate - expectedInflation, -0.08, 0.18);
  rates.realLoanRate = clamp(rates.loanRate - expectedInflation, -0.08, 0.22);
  rates.realDepositRate = clamp(rates.depositRate - expectedInflation, -0.08, 0.16);
  rates.termSpread = clamp(rates.bondYield10Y - rates.shortTermRate, -0.10, 0.12);
  rates.sovereignRiskPremium = sovereignRiskPremium;
  rates.termPremium = termPremium;
  rates.durationRiskPremium = durationRiskPremium;
  rates.bondMarketLiquidity = bondMarketLiquidity;
  rates.rateShock = clamp(smoothValue(safeNumber(rates.rateShock, 0), Math.abs(effectivePolicyRate - previousEffective), 0.22), 0, 0.06);
  rates.policySurprise = clamp(smoothValue(safeNumber(rates.policySurprise, 0), policySurprise, 0.18), -0.04, 0.04);
  rates.rateUncertainty = clamp(smoothValue(safeNumber(rates.rateUncertainty, 0.08), Math.abs(rates.policySurprise) * 12 + Math.abs(rates.expectedRateChangeNext12M) * 2.0 + (1 - safeNumber(credibility.forwardGuidanceClarity, 0.76)) * 0.28, 0.08), 0, 1);
  rates.bankNetInterestMargin = clamp(rates.loanRate - rates.depositRate, 0.002, 0.20);
  rates.governmentAverageFundingRate = clamp(smoothValue(safeNumber(rates.governmentAverageFundingRate, rates.bondYield10Y), rates.bondYield10Y + sovereignRiskPremium * 0.22 + Math.max(0, 0.75 - bondMarketLiquidity) * 0.012, 0.035), 0.004, 0.26);
  rates.globalPolicyRate = smoothValue(safeNumber(rates.globalPolicyRate, 0.032), 0.032 + safeNumber(state.external?.globalRiskSentiment, 0.2) * 0.006, 0.015);
  rates.interestRateDifferential = clamp(rates.shortTermRate - rates.globalPolicyRate, -0.12, 0.18);
  rates.ratePathLabel = rates.expectedRateChangeNext12M > 0.008 ? "긴축 기대" : rates.expectedRateChangeNext12M < -0.008 ? "완화 기대" : "중립";

  state.rates = rates;
  if (state.financialMarket) {
    state.financialMarket.depositRate = rates.depositRate;
    state.financialMarket.loanRate = rates.loanRate;
    state.financialMarket.bondYield = rates.bondYield10Y;
    state.financialMarket.bondYield2Y = rates.bondYield2Y;
    state.financialMarket.bondYield5Y = rates.bondYield5Y;
    state.financialMarket.bondYield10Y = rates.bondYield10Y;
    state.financialMarket.bondYield30Y = rates.bondYield30Y;
    state.financialMarket.creditSpread = rates.creditSpread;
  }
  if (state.realEstate) state.realEstate.mortgageRate = rates.mortgageRate;
  syncRateMetrics(context);
}

export function syncRateMetrics(context) {
  const {
    state,
    createInitialFinancialMarket,
    createInitialPolicyCredibility,
    createInitialRateStructure,
    createInitialSentimentState,
    getGDPGrowthWindow
  } = context;

  if (!state.metrics) return;
  if (!state.rates) state.rates = createInitialRateStructure(state.config || {});
  const rates = state.rates;
  state.metrics.policyRate = safeNumber(rates.policyRate, 0) * 100;
  state.metrics.interestRatePercent = safeNumber(rates.effectivePolicyRate, safeNumber(rates.policyRate, 0)) * 100;
  state.metrics.shortTermRate = safeNumber(rates.shortTermRate, 0) * 100;
  state.metrics.treasuryBill3M = safeNumber(rates.treasuryBill3M, rates.shortTermRate || 0) * 100;
  state.metrics.bondYield2Y = safeNumber(rates.bondYield2Y, 0) * 100;
  state.metrics.bondYield5Y = safeNumber(rates.bondYield5Y, rates.bondYield2Y || 0) * 100;
  state.metrics.bondYield10Y = safeNumber(rates.bondYield10Y, 0) * 100;
  state.metrics.bondYield30Y = safeNumber(rates.bondYield30Y, rates.bondYield10Y || 0) * 100;
  state.metrics.bondYield = state.metrics.bondYield10Y;
  state.metrics.loanRate = safeNumber(rates.loanRate, 0) * 100;
  state.metrics.mortgageRate = safeNumber(rates.mortgageRate, 0) * 100;
  state.metrics.corporateLoanRate = safeNumber(rates.corporateLoanRate, 0) * 100;
  state.metrics.depositRate = safeNumber(rates.depositRate, 0) * 100;
  state.metrics.realPolicyRate = safeNumber(rates.realPolicyRate, 0) * 100;
  state.metrics.realLoanRate = safeNumber(rates.realLoanRate, 0) * 100;
  state.metrics.realDepositRate = safeNumber(rates.realDepositRate, 0) * 100;
  state.metrics.termSpread = safeNumber(rates.termSpread, 0) * 100;
  state.metrics.creditSpread = safeNumber(rates.creditSpread, 0.02) * 100;
  state.metrics.rateShock = safeNumber(rates.rateShock, 0) * 100;
  state.metrics.rateUncertainty = safeNumber(rates.rateUncertainty, 0);
  state.metrics.policySurpriseRate = safeNumber(rates.policySurprise, 0) * 100;
  state.metrics.policySurprise = state.metrics.policySurpriseRate;
  state.metrics.bankNetInterestMargin = safeNumber(rates.bankNetInterestMargin, 0) * 100;
  state.metrics.governmentAverageFundingRate = safeNumber(rates.governmentAverageFundingRate, 0) * 100;
  state.metrics.interestRateDifferential = safeNumber(rates.interestRateDifferential, 0) * 100;
  state.metrics.globalPolicyRate = safeNumber(rates.globalPolicyRate, 0) * 100;
  state.metrics.expectedRatePath = safeNumber(rates.expectedRateChangeNext12M, 0) * 100;
  state.metrics.sovereignRiskPremium = safeNumber(rates.sovereignRiskPremium, 0) * 100;
  state.metrics.termPremium = safeNumber(rates.termPremium, 0) * 100;
  state.metrics.durationRiskPremium = safeNumber(rates.durationRiskPremium, 0) * 100;
  state.metrics.bondMarketLiquidity = safeNumber(rates.bondMarketLiquidity, 0.86);
  state.metrics.marketRateExpectation = safeNumber(rates.expectedPolicyRatePath, 0) * 100;
  state.metrics.ratePathLabel = rates.ratePathLabel || "중립";
  state.metrics.policyGap = (safeNumber(rates.effectivePolicyRate, 0) - safeNumber(rates.neutralRate, NEUTRAL_INTEREST_RATE / 100)) * 100;
}

export function computeLoanAndDepositRates(context) {
  const {
    state,
    createInitialFinancialMarket,
    createInitialPolicyCredibility,
    createInitialRateStructure,
    createInitialSentimentState,
    getGDPGrowthWindow
  } = context;

  const financial = state.financialMarket;
  if (!financial) return;
  if (!state.rates) state.rates = createInitialRateStructure(state.config || {});
  const rates = state.rates;
  financial.depositRate = clamp(safeNumber(rates.depositRate, financial.depositRate), 0, 0.16);
  financial.loanRate = clamp(safeNumber(rates.loanRate, financial.loanRate), 0.005, 0.28);
  financial.creditSpread = clamp(safeNumber(rates.creditSpread, financial.creditSpread), 0.01, 0.12);
}

export function computeBondMarket(context) {
  const {
    state,
    createInitialFinancialMarket,
    createInitialPolicyCredibility,
    createInitialRateStructure,
    createInitialSentimentState,
    getGDPGrowthWindow
  } = context;

  const financial = state.financialMarket;
  if (!financial) return;
  if (!state.rates) state.rates = createInitialRateStructure(state.config || {});
  const rates = state.rates;
  const previousYield = safeNumber(financial.bondYield, safeNumber(rates.bondYield10Y, NEUTRAL_INTEREST_RATE / 100));
  const previous2Y = safeNumber(financial.bondYield2Y, safeNumber(rates.bondYield2Y, previousYield));
  const previous5Y = safeNumber(financial.bondYield5Y, safeNumber(rates.bondYield5Y, previousYield));
  const previous30Y = safeNumber(financial.bondYield30Y, safeNumber(rates.bondYield30Y, previousYield));
  financial.bondYield = clamp(safeNumber(rates.bondYield10Y, previousYield), 0.004, 0.24);
  financial.bondYield2Y = clamp(safeNumber(rates.bondYield2Y, financial.bondYield), 0.002, 0.24);
  financial.bondYield5Y = clamp(safeNumber(rates.bondYield5Y, financial.bondYield), 0.003, 0.24);
  financial.bondYield10Y = financial.bondYield;
  financial.bondYield30Y = clamp(safeNumber(rates.bondYield30Y, financial.bondYield), 0.006, 0.26);
  const yieldChange = financial.bondYield - previousYield;
  const yieldChange2Y = financial.bondYield2Y - previous2Y;
  const yieldChange5Y = financial.bondYield5Y - previous5Y;
  const yieldChange30Y = financial.bondYield30Y - previous30Y;
  const priceReturn = clamp(-yieldChange * 8.5 + (100 - safeNumber(financial.bondPriceIndex, 100)) / 100 * 0.0012, -BOND_PRICE_RETURN_LIMIT, BOND_PRICE_RETURN_LIMIT);
  financial.bondPriceIndex = clamp(safeNumber(financial.bondPriceIndex, 100) * (1 + priceReturn), 55, 145);
  const shortReturn = clamp(-yieldChange2Y * 2.1 + (100 - safeNumber(financial.shortBondPriceIndex, 100)) / 100 * 0.0010, -0.025, 0.025);
  const mediumReturn = clamp(-yieldChange5Y * 5.2 + (100 - safeNumber(financial.mediumBondPriceIndex, 100)) / 100 * 0.0011, -0.040, 0.040);
  const longReturn = clamp(-yieldChange30Y * 14.0 + (100 - safeNumber(financial.longBondPriceIndex, 100)) / 100 * 0.0014, -0.060, 0.055);
  financial.shortBondPriceIndex = clamp(safeNumber(financial.shortBondPriceIndex, 100) * (1 + shortReturn), 70, 135);
  financial.mediumBondPriceIndex = clamp(safeNumber(financial.mediumBondPriceIndex, 100) * (1 + mediumReturn), 58, 145);
  financial.longBondPriceIndex = clamp(safeNumber(financial.longBondPriceIndex, 100) * (1 + longReturn), 42, 160);
  const liquidityStress = Math.max(0, 0.78 - safeNumber(rates.bondMarketLiquidity, 0.86));
  financial.bondMarketStress = clamp(smoothValue(safeNumber(financial.bondMarketStress, 0.10), Math.abs(yieldChange30Y) * 18 + Math.max(0, 100 - financial.longBondPriceIndex) / 100 * 0.42 + liquidityStress * 0.55 + safeNumber(rates.sovereignRiskPremium, 0) * 3.0, 0.08), 0, 1);
  financial.flightToQualityDemand = clamp(smoothValue(safeNumber(financial.flightToQualityDemand, 0.05), safeNumber(financial.safeHavenDemand, 0) * 0.42 + Math.max(0, 0.60 - safeNumber(state.sentiment?.marketRiskSentiment, 0.74)) * 0.34 + Math.max(0, -getGDPGrowthWindow()) * 0.020, 0.06), 0, 1);
}
