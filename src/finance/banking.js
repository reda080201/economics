import { CALIBRATION, HOUSING_RETURN_LIMIT, TARGET_UNEMPLOYMENT } from "../core/config.js";
import { clamp, safeNumber, smoothValue } from "../core/mathUtils.js";

export function updateBankingSector(context) {
      const {
        state,
        createInitialCreditCycle,
        createInitialMacroFinancialTransmission,
        createInitialRateStructure,
        getGDPGrowthWindow
      } = context;

      const financial = state.financialMarket;
      const transmission = state.macroFinancial || createInitialMacroFinancialTransmission(state.config);
      const rates = state.rates || createInitialRateStructure(state.config || {});
      const householdStress = safeNumber(state.metrics.debtStressedHouseholdRatio, 0) / 100;
      const firmStress = safeNumber(state.metrics.debtStressedFirmRatio, 0) / 100;
      const unemploymentStress = Math.max(0, safeNumber(state.metrics.unemploymentRate, TARGET_UNEMPLOYMENT) - TARGET_UNEMPLOYMENT) / 22;
      const assetDecline = Math.max(0, -safeNumber(state.assetMarket?.stockReturn, 0)) * 7 + Math.max(0, -safeNumber(state.assetMarket?.housingReturn, 0)) * 10 + Math.max(0, -safeNumber(transmission.wealthEffect, 0)) * 1.8;
      const collateralStress = Math.max(0, 100 - safeNumber(state.realEstate?.collateralValueIndex, 100)) / 100;
      const commercialStress = Math.max(0, safeNumber(state.realEstate?.commercialVacancy, 0.08) - 0.12) * 1.8 + Math.max(0, -safeNumber(state.realEstate?.commercialReturn, 0)) * 10;
      const negativeEquityStress = safeNumber(state.metrics.negativeEquityRatio, 0) / 100;
      const dscrStress = clamp((1.4 - safeNumber(state.metrics.averageFirmDSCR, 1.4)) / 1.4, 0, 1);
      const creditCycle = state.creditCycle || createInitialCreditCycle();
      const nplTarget = clamp(0.014 + householdStress * 0.032 + firmStress * 0.044 + unemploymentStress * 0.026 + dscrStress * 0.024, 0.005, 0.24);
      financial.nonPerformingLoanRatio = smoothValue(safeNumber(financial.nonPerformingLoanRatio, 0.025), nplTarget, 0.045);
      const bankRiskAppetite = safeNumber(state.sentiment?.bankRiskAppetite, 0.72);
      const marginRelief = clamp((safeNumber(rates.bankNetInterestMargin, 0.025) - 0.026) * 2.8, -0.06, 0.08);
      const bondPortfolioLoss = Math.max(0, 100 - safeNumber(financial.bondPriceIndex, 100)) / 100 * 0.45 + Math.max(0, 100 - safeNumber(financial.longBondPriceIndex, 100)) / 100 * 0.55;
      const depositorConfidenceTarget = clamp(0.92 - financial.nonPerformingLoanRatio * 0.80 - safeNumber(financial.bankStress, 0.12) * 0.30 - safeNumber(financial.liquidityStress, 0.05) * 0.20 - safeNumber(creditCycle.creditCrunchRisk, 0.12) * 0.14 + marginRelief * 0.28, 0.20, 1.05);
      const interbankTrustTarget = clamp(0.88 - safeNumber(financial.bankStress, 0.12) * 0.38 - financial.nonPerformingLoanRatio * 1.10 - safeNumber(financial.bondMarketStress, 0.10) * 0.16 - safeNumber(creditCycle.eventType === "interbankDistrust" ? creditCycle.eventIntensity * 0.25 : 0, 0), 0.18, 1.02);
      const fundingPressureTarget = clamp(0.10 + Math.max(0, 0.76 - depositorConfidenceTarget) * 0.40 + Math.max(0, 0.72 - interbankTrustTarget) * 0.34 + safeNumber(financial.bondMarketStress, 0.10) * 0.20 + safeNumber(creditCycle.creditCrunchRisk, 0.12) * 0.18, 0, 1);
      const capitalConfidenceTarget = clamp(0.88 - bondPortfolioLoss * 0.38 - financial.nonPerformingLoanRatio * 1.25 - firmStress * 0.18 - collateralStress * 0.14, 0.15, 1.05);
      const creditOfficerTarget = clamp(0.18 + financial.bankStress * 0.34 + safeNumber(creditCycle.creditCrunchRisk, 0.12) * 0.32 + safeNumber(financial.bondMarketStress, 0.10) * 0.14 + Math.max(0, 0.76 - interbankTrustTarget) * 0.26 - safeNumber(creditCycle.creditExcessRisk, 0.12) * 0.10, 0.05, 0.92);
      financial.depositorConfidence = smoothValue(safeNumber(financial.depositorConfidence, 0.88), depositorConfidenceTarget, depositorConfidenceTarget < safeNumber(financial.depositorConfidence, 0.88) ? 0.10 : 0.045);
      financial.interbankTrust = smoothValue(safeNumber(financial.interbankTrust, 0.84), interbankTrustTarget, interbankTrustTarget < safeNumber(financial.interbankTrust, 0.84) ? 0.11 : 0.045);
      financial.bankFundingPressure = clamp(smoothValue(safeNumber(financial.bankFundingPressure, 0.12), fundingPressureTarget, 0.08), 0, 1);
      financial.creditOfficerCaution = clamp(smoothValue(safeNumber(financial.creditOfficerCaution, 0.28), creditOfficerTarget, 0.08), 0, 1);
      financial.bankCapitalConfidence = smoothValue(safeNumber(financial.bankCapitalConfidence, 0.82), capitalConfidenceTarget, capitalConfidenceTarget < safeNumber(financial.bankCapitalConfidence, 0.82) ? 0.09 : 0.04);
      const loanDemandTarget = clamp(102 + Math.max(0, state.metrics.salesPressure - 1) * 20 + Math.max(0, state.metrics.residentialReturn || 0) * 2.0 - safeNumber(rates.realLoanRate, 0) * 120 - financial.creditOfficerCaution * 18 - safeNumber(creditCycle.creditCrunchRisk, 0.12) * 14 + safeNumber(creditCycle.creditExcessRisk, 0.12) * 8, 45, 122);
      financial.loanDemandIndex = clamp(smoothValue(safeNumber(financial.loanDemandIndex, 100), loanDemandTarget, 0.055), 45, 122);
      financial.riskUnderpricing = clamp(smoothValue(safeNumber(financial.riskUnderpricing, 0.12), safeNumber(creditCycle.creditExcessRisk, 0.12) * 0.45 + Math.max(0, financial.creditSupplyIndex - 100) / 100 * 0.36 + Math.max(0, 0.24 - financial.bankStress) * 0.20, 0.055), 0, 1);
      const rawStress = clamp((financial.nonPerformingLoanRatio * 2.5 + householdStress * 0.22 + firmStress * 0.30 + unemploymentStress * 0.20 + assetDecline * 0.22 + collateralStress * 0.18 + commercialStress * 0.16 + negativeEquityStress * 0.14 + safeNumber(financial.creditSpread, 0.02) * 2.5 + Math.max(0, 0.62 - bankRiskAppetite) * 0.18 + bondPortfolioLoss * 0.16 + financial.bankFundingPressure * 0.18 + Math.max(0, 0.62 - financial.interbankTrust) * 0.16 - marginRelief) * CALIBRATION.bankStressWeight, 0, 1);
      financial.bankStress = clamp(smoothValue(safeNumber(financial.bankStress, 0.12), rawStress, 0.055), 0, 1);
      const healthTarget = clamp(112 - financial.bankStress * 72 - financial.nonPerformingLoanRatio * 95 - safeNumber(financial.liquidityStress, 0) * 20 + marginRelief * 55 - bondPortfolioLoss * 22 - financial.bankFundingPressure * 14 + financial.bankCapitalConfidence * 8, 0, 120);
      financial.bankHealthIndex = clamp(smoothValue(safeNumber(financial.bankHealthIndex, 100), healthTarget, 0.050), 0, 120);
    }

export function computeCreditSpread(context) {
      const {
        state,
        createInitialCreditCycle,
        createInitialMacroFinancialTransmission,
        createInitialRateStructure,
        getGDPGrowthWindow
      } = context;

      const financial = state.financialMarket;
      const firmStress = safeNumber(state.metrics.debtStressedFirmRatio, 0) / 100;
      const unemploymentPressure = Math.max(0, safeNumber(state.metrics.unemploymentRate, TARGET_UNEMPLOYMENT) - TARGET_UNEMPLOYMENT) / 100;
      const assetDecline = Math.max(0, -safeNumber(state.assetMarket?.stockReturn, 0)) * 2.2 + Math.max(0, -safeNumber(state.assetMarket?.housingReturn, 0)) * 2.8;
      const liquidity = safeNumber(financial.liquidityStress, 0);
      const profitRelief = state.metrics.averageFirmProfit > 0 && getGDPGrowthWindow() > -1 ? -0.004 : 0;
      const riskAppetiteRelief = Math.max(0, safeNumber(state.sentiment?.bankRiskAppetite, 0.7) - 0.7) * 0.010;
      const rumorPremium = state.information?.rumorType === "bank" ? safeNumber(state.information.rumorIntensity, 0) * safeNumber(state.information.rumorCredibility, 0) * 0.016 : 0;
      const overreactionPremium = safeNumber(state.information?.marketOverreaction, 0.1) * 0.006;
      const behavioralPremium = safeNumber(state.behavior?.panicSellingPressure, 0.05) * 0.010 + safeNumber(state.behavior?.herdIntensity, 0.18) * safeNumber(state.sentiment?.recessionFear, 0.2) * 0.008 - safeNumber(state.behavior?.realEstateNeverFallsBelief, 0.46) * Math.max(0, safeNumber(state.realEstate?.collateralValueIndex, 100) - 100) * 0.000025;
      const cycle = state.creditCycle || createInitialCreditCycle();
      const bankPsychPremium = safeNumber(financial.bankFundingPressure, 0.12) * 0.020 + Math.max(0, 0.66 - safeNumber(financial.interbankTrust, 0.84)) * 0.022 + safeNumber(financial.creditOfficerCaution, 0.28) * 0.011;
      const creditCyclePremium = safeNumber(cycle.creditCrunchRisk, 0.12) * 0.030 - safeNumber(cycle.creditExcessRisk, 0.12) * 0.010 + Math.max(0, 0.62 - safeNumber(cycle.underwritingQuality, 0.76)) * 0.012;
      const targetSpreadRaw = 0.012 + financial.bankStress * 0.050 * CALIBRATION.creditChannelWeight + firmStress * 0.030 * CALIBRATION.creditChannelWeight + unemploymentPressure * 0.12 + assetDecline + liquidity * 0.030 + bankPsychPremium + creditCyclePremium + rumorPremium + overreactionPremium + behavioralPremium + profitRelief - riskAppetiteRelief;
      const normalCreditCeiling = state.metrics.unemploymentRate < 10 && financial.bankStress < 0.62 ? 0.048 : 0.12;
      const targetSpread = clamp(targetSpreadRaw, 0.01, normalCreditCeiling);
      financial.creditSpread = clamp(smoothValue(safeNumber(financial.creditSpread, 0.02), targetSpread, 0.060), 0.01, 0.12);
    }

export function computeCreditSupply(context) {
      const {
        state,
        createInitialCreditCycle,
        createInitialMacroFinancialTransmission,
        createInitialRateStructure,
        getGDPGrowthWindow
      } = context;

      const financial = state.financialMarket;
      const transmission = state.macroFinancial || createInitialMacroFinancialTransmission(state.config);
      const collateralTightening = Math.max(0, 100 - safeNumber(state.realEstate?.collateralValueIndex, 100)) * 0.22;
      const vacancyTightening = Math.max(0, safeNumber(state.realEstate?.commercialVacancy, 0.08) - 0.12) * 55;
      const behavioralTightening = safeNumber(state.behavior?.panicSellingPressure, 0.05) * 8 + safeNumber(state.behavior?.herdIntensity, 0.18) * Math.max(0, 0.6 - safeNumber(state.sentiment?.bankRiskAppetite, 0.7)) * 8;
      const boomLeniency = safeNumber(state.behavior?.realEstateNeverFallsBelief, 0.46) * Math.max(0, safeNumber(state.realEstate?.collateralValueIndex, 100) - 100) * 0.035;
      const cycle = state.creditCycle || createInitialCreditCycle();
      const bankPsychTightening = safeNumber(financial.creditOfficerCaution, 0.28) * 13 + safeNumber(financial.bankFundingPressure, 0.12) * 16 + Math.max(0, 0.70 - safeNumber(financial.interbankTrust, 0.84)) * 22 + Math.max(0, 0.62 - safeNumber(financial.depositorConfidence, 0.88)) * 14;
      const creditCycleAdjustment = safeNumber(cycle.creditExcessRisk, 0.12) * 7 - safeNumber(cycle.creditCrunchRisk, 0.12) * 18 + safeNumber(cycle.creditGap, 0) * 4;
      const loanDemandSupport = clamp((safeNumber(financial.loanDemandIndex, 100) - 100) * 0.12, -5, 4);
      const creditFloor = state.metrics.unemploymentRate < 12 && financial.bankStress < 0.66 ? 76 : 35;
      const targetSupply = clamp(108 - financial.bankStress * 46 * CALIBRATION.creditChannelWeight - financial.creditSpread * 210 * CALIBRATION.creditChannelWeight - safeNumber(financial.liquidityStress, 0) * 24 - collateralTightening - vacancyTightening - behavioralTightening - bankPsychTightening - Math.max(0, safeNumber(transmission.riskAversion, 0.2) - 0.35) * 10 + boomLeniency + creditCycleAdjustment + loanDemandSupport + (safeNumber(state.sentiment?.bankRiskAppetite, 0.7) - 0.7) * 10 + Math.max(0, state.metrics.averageFirmProfit) / 900, creditFloor, 112);
      financial.creditSupplyIndex = clamp(smoothValue(safeNumber(financial.creditSupplyIndex, 100), targetSupply, 0.050), 35, 112);
      financial.bankLendingStandard = financial.creditSupplyIndex < 50 || financial.bankStress > 0.75
        ? "위기"
        : financial.creditSupplyIndex < 72 || financial.bankStress > 0.52
          ? "긴축"
          : financial.creditSupplyIndex > 103 && financial.bankStress < 0.18
            ? "완화"
            : "정상";
    }

export function computeBankingCrisisRisk(context) {
      const {
        state,
        createInitialCreditCycle,
        createInitialMacroFinancialTransmission,
        createInitialRateStructure,
        getGDPGrowthWindow
      } = context;

      const financial = state.financialMarket;
      const healthRisk = clamp((70 - financial.bankHealthIndex) / 70, 0, 1);
      const nplRisk = clamp((financial.nonPerformingLoanRatio - 0.05) / 0.14, 0, 1);
      const spreadRisk = clamp((financial.creditSpread - 0.035) / 0.075, 0, 1);
      const housingFallRisk = clamp(-safeNumber(state.assetMarket?.housingReturn, 0) / HOUSING_RETURN_LIMIT, 0, 1);
      const firmStressRisk = safeNumber(state.metrics.debtStressedFirmRatio, 0) / 100;
      const rawRisk = clamp(healthRisk * 0.34 + nplRisk * 0.24 + spreadRisk * 0.18 + housingFallRisk * 0.10 + firmStressRisk * 0.14, 0, 1);
      financial.bankingCrisisRisk = clamp(smoothValue(safeNumber(financial.bankingCrisisRisk, 0), rawRisk, 0.06), 0, 1);
      financial.bankingCrisisRiskLabel = financial.bankingCrisisRisk < 0.25 ? "낮음" : financial.bankingCrisisRisk < 0.50 ? "주의" : financial.bankingCrisisRisk < 0.75 ? "높음" : "위험";
      financial.financialMarketSummary = financial.bankingCrisisRisk > 0.65
        ? "위기 위험"
        : safeNumber(state.creditCycle?.creditCrunchRisk, 0.12) > 0.58
          ? "신용경색"
          : safeNumber(state.creditCycle?.creditExcessRisk, 0.12) > 0.62
            ? "신용 과다"
            : safeNumber(financial.bondMarketStress, 0.10) > 0.55
              ? "국채 스트레스"
              : financial.bankStress > 0.52 || financial.creditSupplyIndex < 72
                ? "스트레스"
                : financial.loanRate > state.government.interestRate + 0.055 || financial.creditSpread > 0.045
                  ? "긴축"
                  : "정상";
    }

export function syncFinancialMarketMetrics(context) {
      const {
        state,
        createInitialCreditCycle,
        createInitialMacroFinancialTransmission,
        createInitialRateStructure,
        getGDPGrowthWindow
      } = context;

      if (!state.metrics || !state.financialMarket) return;
      const financial = state.financialMarket;
      state.metrics.bondYield = safeNumber(financial.bondYield, 0) * 100;
      state.metrics.bondYield2Y = safeNumber(state.rates?.bondYield2Y, safeNumber(financial.bondYield2Y, financial.bondYield)) * 100;
      state.metrics.bondYield5Y = safeNumber(state.rates?.bondYield5Y, safeNumber(financial.bondYield5Y, financial.bondYield)) * 100;
      state.metrics.bondYield10Y = safeNumber(state.rates?.bondYield10Y, financial.bondYield) * 100;
      state.metrics.bondYield30Y = safeNumber(state.rates?.bondYield30Y, safeNumber(financial.bondYield30Y, financial.bondYield)) * 100;
      state.metrics.bondPriceIndex = safeNumber(financial.bondPriceIndex, 100);
      state.metrics.shortBondPriceIndex = safeNumber(financial.shortBondPriceIndex, 100);
      state.metrics.mediumBondPriceIndex = safeNumber(financial.mediumBondPriceIndex, 100);
      state.metrics.longBondPriceIndex = safeNumber(financial.longBondPriceIndex, 100);
      state.metrics.bondMarketStress = safeNumber(financial.bondMarketStress, 0.10);
      state.metrics.flightToQualityDemand = safeNumber(financial.flightToQualityDemand, 0.05);
      state.metrics.creditSpread = safeNumber(financial.creditSpread, 0.02) * 100;
      state.metrics.bankHealthIndex = safeNumber(financial.bankHealthIndex, 100);
      state.metrics.bankLendingStandard = financial.bankLendingStandard || "정상";
      state.metrics.creditSupplyIndex = safeNumber(financial.creditSupplyIndex, 100);
      state.metrics.depositorConfidence = safeNumber(financial.depositorConfidence, 0.88);
      state.metrics.interbankTrust = safeNumber(financial.interbankTrust, 0.84);
      state.metrics.bankFundingPressure = safeNumber(financial.bankFundingPressure, 0.12);
      state.metrics.creditOfficerCaution = safeNumber(financial.creditOfficerCaution, 0.28);
      state.metrics.bankCapitalConfidence = safeNumber(financial.bankCapitalConfidence, 0.82);
      state.metrics.loanDemandIndex = safeNumber(financial.loanDemandIndex, 100);
      state.metrics.riskUnderpricing = safeNumber(financial.riskUnderpricing, 0.12);
      state.metrics.depositRate = safeNumber(state.rates?.depositRate, financial.depositRate) * 100;
      state.metrics.loanRate = safeNumber(state.rates?.loanRate, financial.loanRate) * 100;
      state.metrics.mortgageRate = safeNumber(state.rates?.mortgageRate, state.metrics.mortgageRate / 100 || 0) * 100;
      state.metrics.corporateLoanRate = safeNumber(state.rates?.corporateLoanRate, state.metrics.corporateLoanRate / 100 || financial.loanRate) * 100;
      state.metrics.bankStress = safeNumber(financial.bankStress, 0);
      state.metrics.nonPerformingLoanRatio = safeNumber(financial.nonPerformingLoanRatio, 0) * 100;
      state.metrics.goldIndex = safeNumber(financial.goldIndex, 100);
      state.metrics.silverIndex = safeNumber(financial.silverIndex, 100);
      state.metrics.safeHavenDemand = safeNumber(financial.safeHavenDemand, 0) * 100;
      state.metrics.riskAversion = safeNumber(financial.riskAversion, 0.2);
      state.metrics.liquidityStress = safeNumber(financial.liquidityStress, 0);
      state.metrics.bankingCrisisRiskScore = safeNumber(financial.bankingCrisisRisk, 0);
      state.metrics.bankingCrisisRiskLabel = financial.bankingCrisisRiskLabel || "낮음";
    }
