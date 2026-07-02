import { GOLD_RETURN_LIMIT, SILVER_RETURN_LIMIT, TARGET_INFLATION } from "../core/config.js";
import { clamp, rand, safeNumber, smoothValue } from "../core/mathUtils.js";

export function computeSafeHavenDemand(context) {
      const {
        state,
        createInitialCreditCycle,
        createInitialMacroFinancialTransmission,
        getGDPGrowthWindow,
        getRecentUnemploymentTrend
      } = context;

      const financial = state.financialMarket;
      const transmission = state.macroFinancial || createInitialMacroFinancialTransmission(state.config);
      const inflationVolatility = Math.abs(safeNumber(state.metrics.inflation, TARGET_INFLATION) - TARGET_INFLATION) / 8;
      const assetSelloff = Math.max(0, -safeNumber(state.assetMarket?.stockReturn, 0)) * 9 + Math.max(0, -safeNumber(state.assetMarket?.housingReturn, 0)) * 7;
      const fiscalStress = Math.max(0, 0.35 - safeNumber(transmission.fiscalSpace, state.metrics.fiscalSpaceScore || 1));
      const unemploymentMomentum = Math.max(0, getRecentUnemploymentTrend()) / 10;
      const stabilityRelief = Math.abs(state.metrics.inflationGap) < 0.8 && Math.abs(state.metrics.outputGap) < 2.5 && financial.bankHealthIndex > 85 ? 0.08 : 0;
      const cycle = state.creditCycle || createInitialCreditCycle();
      const eventSafeHaven = cycle.eventType === "safeHavenSurge" ? safeNumber(cycle.eventIntensity, 0) * 0.22 : 0;
      const target = clamp(inflationVolatility * 0.25 + financial.bankStress * 0.33 + assetSelloff * 0.20 + fiscalStress * 0.22 + unemploymentMomentum * 0.16 + safeNumber(financial.bondMarketStress, 0.10) * 0.12 + safeNumber(cycle.creditCrunchRisk, 0.12) * 0.10 + eventSafeHaven - stabilityRelief, 0, 1);
      financial.safeHavenDemand = clamp(smoothValue(safeNumber(financial.safeHavenDemand, 0), target, 0.055), 0, 1);
      financial.riskAversion = clamp(smoothValue(safeNumber(financial.riskAversion, 0.2), 0.16 + financial.safeHavenDemand * 0.58 + financial.bankStress * 0.22, 0.05), 0.05, 1);
      financial.liquidityStress = clamp(smoothValue(safeNumber(financial.liquidityStress, 0.05), financial.bankStress * 0.48 + Math.max(0, 78 - financial.creditSupplyIndex) / 100 + assetSelloff * 0.10, 0.05), 0, 1);
    }

export function computeSafeAssetMarkets(context) {
      const {
        state,
        createInitialCreditCycle,
        createInitialMacroFinancialTransmission,
        getGDPGrowthWindow,
        getRecentUnemploymentTrend
      } = context;

      const financial = state.financialMarket;
      const transmission = state.macroFinancial || createInitialMacroFinancialTransmission(state.config);
      const realRate = safeNumber(transmission.bondYield, safeNumber(financial.bondYield, state.government.interestRate)) - safeNumber(state.smoothedInflation, TARGET_INFLATION) / 100;
      const inflationHedge = Math.max(0, safeNumber(state.smoothedInflation, TARGET_INFLATION) - TARGET_INFLATION) / 100;
      const fiscalStress = Math.max(0, 0.4 - safeNumber(transmission.fiscalSpace, state.metrics.fiscalSpaceScore || 1));
      const goldValuationAnchor = clamp((112 - safeNumber(financial.goldIndex, 100)) / 100 * 0.0022, -0.0040, 0.0025);
      const goldRaw = clamp(inflationHedge * 0.020 + financial.safeHavenDemand * 0.0032 + safeNumber(state.sentiment?.safeHavenSentiment, 0.1) * 0.0020 - realRate * 0.006 + fiscalStress * 0.002 + goldValuationAnchor + rand(-0.0025, 0.0025), -GOLD_RETURN_LIMIT, GOLD_RETURN_LIMIT);
      financial.goldReturn = clamp(smoothValue(safeNumber(financial.goldReturn, 0), goldRaw, 0.28), -GOLD_RETURN_LIMIT, GOLD_RETURN_LIMIT);
      const industrialDemand = clamp(getGDPGrowthWindow() / 100 * 0.012 + (state.metrics.outputGap / 100) * 0.004, -0.004, 0.006);
      const silverValuationAnchor = clamp((112 - safeNumber(financial.silverIndex, 100)) / 100 * 0.0026, -0.0060, 0.0030);
      const silverRaw = clamp(financial.goldReturn * 0.48 + industrialDemand + silverValuationAnchor + rand(-0.0045, 0.0045), -SILVER_RETURN_LIMIT, SILVER_RETURN_LIMIT);
      financial.silverReturn = clamp(smoothValue(safeNumber(financial.silverReturn, 0), silverRaw, 0.30), -SILVER_RETURN_LIMIT, SILVER_RETURN_LIMIT);
      financial.goldIndex = clamp(safeNumber(financial.goldIndex, 100) * (1 + financial.goldReturn), 55, 220);
      financial.silverIndex = clamp(safeNumber(financial.silverIndex, 100) * (1 + financial.silverReturn), 40, 260);
    }
