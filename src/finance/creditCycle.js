import { TICKS_PER_MONTH } from "../core/config.js";
import { clamp, safeNumber, smoothValue } from "../core/mathUtils.js";

export function updateCreditCycle(context) {
      const {
        state,
        addEventMarker,
        createInitialCreditCycle,
        createInitialFinancialMarket,
        createInitialRateStructure,
        pushEvent
      } = context;

      if (!state.creditCycle) state.creditCycle = createInitialCreditCycle();
      if (!state.financialMarket) state.financialMarket = createInitialFinancialMarket(state.config);
      const cycle = state.creditCycle;
      const financial = state.financialMarket;
      const rates = state.rates || createInitialRateStructure(state.config || {});
      cycle.eventIntensity = clamp(safeNumber(cycle.eventIntensity, 0) * safeNumber(cycle.eventHalfLife, 0.93), 0, 1);
      if (cycle.eventIntensity < 0.035) {
        cycle.eventIntensity = 0;
        cycle.eventType = "none";
      }

      const creditEase = clamp((safeNumber(financial.creditSupplyIndex, 100) - 100) / 22, -1, 1);
      const spreadEase = clamp((0.030 - safeNumber(financial.creditSpread, 0.02)) / 0.025, -1, 1);
      const loanDemand = clamp((safeNumber(financial.loanDemandIndex, 100) - 100) / 24, -1, 1);
      const leverageTarget = clamp(
        safeNumber(state.metrics.averageHouseholdDebtBurden, 0) / 30 * 0.32
          + safeNumber(state.metrics.firmDebt, 0) / Math.max(1, safeNumber(state.metrics.gdp, 1) * 18) * 0.28
          + Math.max(0, safeNumber(state.metrics.housingMispricing, 0)) / 100 * 0.20
          + Math.max(0, safeNumber(state.metrics.stockMispricing, 0)) / 100 * 0.12,
        0,
        1
      );
      cycle.privateLeveragePressure = clamp(smoothValue(safeNumber(cycle.privateLeveragePressure, 0.18), leverageTarget, 0.06), 0, 1);
      cycle.creditGap = clamp(smoothValue(safeNumber(cycle.creditGap, 0), creditEase * 0.38 + spreadEase * 0.28 + loanDemand * 0.22 + (cycle.privateLeveragePressure - 0.35) * 0.22, 0.06), -1, 1);
      const qualityTarget = clamp(0.82 - safeNumber(financial.riskUnderpricing, 0.12) * 0.30 - Math.max(0, cycle.creditGap) * 0.18 - cycle.privateLeveragePressure * 0.12 + safeNumber(financial.creditOfficerCaution, 0.28) * 0.10, 0.22, 0.96);
      cycle.underwritingQuality = clamp(smoothValue(safeNumber(cycle.underwritingQuality, 0.76), qualityTarget, 0.055), 0, 1);
      const eventCrunch = ["creditCrunch", "depositorAnxiety", "interbankDistrust", "bondVolatility", "longRateSpike"].includes(cycle.eventType) ? cycle.eventIntensity : 0;
      const eventExcess = cycle.eventType === "creditExcess" ? cycle.eventIntensity : 0;
      cycle.creditExcessRisk = clamp(smoothValue(safeNumber(cycle.creditExcessRisk, 0.12), Math.max(0, cycle.creditGap) * 0.48 + cycle.privateLeveragePressure * 0.28 + Math.max(0, 0.58 - cycle.underwritingQuality) * 0.24 + eventExcess * 0.22, 0.07), 0, 1);
      cycle.creditCrunchRisk = clamp(smoothValue(safeNumber(cycle.creditCrunchRisk, 0.12), Math.max(0, -cycle.creditGap) * 0.38 + safeNumber(financial.bankFundingPressure, 0.12) * 0.28 + Math.max(0, 0.62 - safeNumber(financial.interbankTrust, 0.84)) * 0.28 + safeNumber(financial.bondMarketStress, 0.10) * 0.16 + eventCrunch * 0.24, 0.08), 0, 1);
      const nextPhase = cycle.creditCrunchRisk > 0.62
        ? "신용경색"
        : cycle.creditExcessRisk > 0.62
          ? "신용 과다"
          : cycle.creditGap > 0.24
            ? "완화"
            : cycle.creditGap < -0.24
              ? "긴축"
              : "정상";
      cycle.monthsInPhase = nextPhase === cycle.phase ? safeNumber(cycle.monthsInPhase, 0) + 1 / TICKS_PER_MONTH : 0;
      cycle.phase = nextPhase;

      if (cycle.eventIntensity > 0) {
        const intensity = cycle.eventIntensity;
        if (cycle.eventType === "creditCrunch") {
          financial.bankFundingPressure = clamp(financial.bankFundingPressure + intensity * 0.025, 0, 1);
          financial.loanDemandIndex = clamp(financial.loanDemandIndex - intensity * 2.2, 45, 122);
        } else if (cycle.eventType === "creditExcess") {
          financial.riskUnderpricing = clamp(financial.riskUnderpricing + intensity * 0.025, 0, 1);
          financial.loanDemandIndex = clamp(financial.loanDemandIndex + intensity * 2.4, 45, 122);
        } else if (cycle.eventType === "depositorAnxiety") {
          financial.depositorConfidence = clamp(financial.depositorConfidence - intensity * 0.025, 0.18, 1.05);
          financial.bankFundingPressure = clamp(financial.bankFundingPressure + intensity * 0.030, 0, 1);
        } else if (cycle.eventType === "interbankDistrust") {
          financial.interbankTrust = clamp(financial.interbankTrust - intensity * 0.030, 0.18, 1.02);
          financial.liquidityStress = clamp(financial.liquidityStress + intensity * 0.022, 0, 1);
        } else if (cycle.eventType === "bondVolatility") {
          financial.bondMarketStress = clamp(financial.bondMarketStress + intensity * 0.035, 0, 1);
          rates.bondMarketLiquidity = clamp(safeNumber(rates.bondMarketLiquidity, 0.86) - intensity * 0.014, 0.35, 1.05);
        } else if (cycle.eventType === "longRateSpike") {
          rates.bondYield10Y = clamp(safeNumber(rates.bondYield10Y, 0.04) + intensity * 0.0009, 0.004, 0.24);
          rates.bondYield30Y = clamp(safeNumber(rates.bondYield30Y, 0.05) + intensity * 0.0014, 0.006, 0.26);
          financial.bondMarketStress = clamp(financial.bondMarketStress + intensity * 0.026, 0, 1);
        } else if (cycle.eventType === "safeHavenSurge") {
          financial.safeHavenDemand = clamp(financial.safeHavenDemand + intensity * 0.026, 0, 1);
          financial.flightToQualityDemand = clamp(financial.flightToQualityDemand + intensity * 0.030, 0, 1);
        }
      }

      syncCreditCycleMetrics(context);
    }

export function triggerCreditCycleEvent(context, type, intensity = 0.65, message = "") {
      const {
        state,
        addEventMarker,
        createInitialCreditCycle,
        createInitialFinancialMarket,
        createInitialRateStructure,
        pushEvent
      } = context;

      if (!state.creditCycle) state.creditCycle = createInitialCreditCycle();
      const cycle = state.creditCycle;
      cycle.eventType = type;
      cycle.eventIntensity = clamp(Math.max(safeNumber(cycle.eventIntensity, 0), intensity), 0, 1);
      cycle.eventHalfLife = type === "creditExcess" ? 0.965 : type === "longRateSpike" || type === "bondVolatility" ? 0.945 : 0.935;
      const labels = {
        creditCrunch: "신용경색",
        creditExcess: "신용 과다",
        bondVolatility: "국채시장 변동성",
        depositorAnxiety: "예금자 불안",
        interbankDistrust: "은행 간 신뢰 하락",
        longRateSpike: "장기금리 급등",
        safeHavenSurge: "안전자산 선호 급등"
      };
      pushEvent(message || `${labels[type] || "신용 사건"}: 금융시장 충격이 반감기를 두고 잔류합니다.`);
      addEventMarker("신용");
    }

export function syncCreditCycleMetrics(context) {
      const {
        state,
        addEventMarker,
        createInitialCreditCycle,
        createInitialFinancialMarket,
        createInitialRateStructure,
        pushEvent
      } = context;

      if (!state.metrics || !state.creditCycle) return;
      const c = state.creditCycle;
      state.metrics.creditCyclePhase = c.phase || "정상";
      state.metrics.creditGap = safeNumber(c.creditGap, 0);
      state.metrics.privateLeveragePressure = safeNumber(c.privateLeveragePressure, 0.18);
      state.metrics.underwritingQuality = safeNumber(c.underwritingQuality, 0.76);
      state.metrics.creditExcessRisk = safeNumber(c.creditExcessRisk, 0.12);
      state.metrics.creditCrunchRisk = safeNumber(c.creditCrunchRisk, 0.12);
      state.metrics.creditEventIntensity = safeNumber(c.eventIntensity, 0);
      state.metrics.creditEventType = c.eventType || "none";
    }
