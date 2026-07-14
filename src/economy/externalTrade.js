import {
  CALIBRATION,
  HOUSEHOLD_DEBT_SERVICE_SCALE,
  NEUTRAL_INTEREST_RATE,
  TARGET_INFLATION,
  TARGET_UNEMPLOYMENT,
  TICKS_PER_MONTH
} from "../core/config.js";
import { average, clamp, rand, safeNumber, shuffle, smoothValue, sum } from "../core/mathUtils.js";
import { getImportFlowProfile } from "./sectorProfiles.js";

export function executeExternalTrade(context) {
  const {
    state,
    calculateUnemploymentRate,
    computeConsumptionResponseSignal,
    createInitialBehavioralState,
    createInitialCreditCycle,
    createInitialExternalActors,
    createInitialExternalSector,
    createInitialFinancialMarket,
    createInitialInformationSystem,
    createInitialMacroFinancialTransmission,
    createInitialPerceivedEconomy,
    createInitialRateStructure,
    effectiveBaseWage,
    getRecentUnemploymentTrend,
    recordFlow
  } = context;

  // 대외 수요는 제조업 중심의 수출 매출로 들어오고, 약한 통화는 수출에는 도움을 주지만 수입 비용을 높인다.
  const external = state.external || createInitialExternalSector();
  const actors = state.externalActors || createInitialExternalActors();
  const foreignPull = safeNumber(actors.foreignConsumers?.exportPull, safeNumber(actors.foreignConsumers?.demandIndex, 100) / 100);
  const exportDemandFactor = clamp((safeNumber(external.exportDemand, 100) / 100) * clamp(foreignPull, 0.55, 1.70), 0.45, 1.95);
  const exchangeCompetitiveness = clamp(1 + (safeNumber(external.exchangeRateIndex, 100) - 100) * 0.0022, 0.80, 1.18);
  let exportSales = 0;

  state.producers.forEach((producer) => {
    const exposure = safeNumber(producer.exportExposure, 0);
    if (exposure <= 0.01 || producer.inventory <= 0) return;
    const sectorMultiplier = producer.sector === "manufacturing" ? 1.20 : producer.sector === "technology" ? 1.05 : producer.sector === "energy" ? 1.12 : producer.sector === "agriculture" ? 0.92 : 0.72;
    const targetUnits = producer.expectedDemand * exposure * exportDemandFactor * exchangeCompetitiveness * sectorMultiplier * 0.18;
    const units = Math.min(producer.inventory, Math.max(0, targetUnits));
    if (units <= 0) return;

    const revenue = units * producer.price * clamp(0.96 + exchangeCompetitiveness * 0.05, 0.96, 1.08);
    producer.inventory -= units;
    producer.cash += revenue;
    producer.revenueTick += revenue;
    producer.unitsSoldTick += units;
    exportSales += revenue;
    state.metrics.exportSales = safeNumber(state.metrics.exportSales, 0) + revenue;
    state.metrics.unitsSold += units;
  });

  state.metrics.exportSales = safeNumber(state.metrics.exportSales, 0);
  const importFlows = computeCurrentImportFlows(state);
  applyImportFlows(state, importFlows);
  state.metrics.netExports = state.metrics.exportSales - state.metrics.importCosts;
  if (state.external) state.external.tradeBalance = smoothValue(safeNumber(state.external.tradeBalance, 0), state.metrics.netExports, 0.10);
}

export function updateExternalSector(context) {
  const {
    state,
    createInitialExternalActors,
    createInitialExternalSector,
    createInitialFinancialMarket,
    createInitialPolicyCredibility,
    createInitialRateStructure,
    getGDPGrowthWindow
  } = context;

  // 대외 부문은 환율-수입물가-수출-원자재 비용 경로를 단순화해 실물경제와 물가에 연결한다.
  if (!state.external) state.external = createInitialExternalSector();
  if (!state.externalActors) state.externalActors = createInitialExternalActors();
  const e = state.external;
  const actors = state.externalActors;
  const financial = state.financialMarket || createInitialFinancialMarket(state.config);
  const credibility = state.policyCredibility || createInitialPolicyCredibility();
  const rates = state.rates || createInitialRateStructure(state.config || {});
  const rateGap = safeNumber(rates.interestRateDifferential, safeNumber(state.macroFinancial?.effectivePolicyRate, state.government?.interestRate || 0.03) - safeNumber(rates.globalPolicyRate, 0.032));
  const externalRisk = clamp((safeNumber(financial.safeHavenDemand, 0) * 0.25 + safeNumber(financial.bankStress, 0) * 0.18 + (1 - safeNumber(credibility.centralBankCredibility, 0.78)) * 0.20 + safeNumber(state.information?.rumorIntensity, 0) * 0.10) * CALIBRATION.externalShockWeight, 0, 1);
  const exchangeTarget = clamp(100 - rateGap * 150 + externalRisk * 18 + Math.max(0, state.metrics.inflationGap) * 1.8 + Math.max(0, 0.55 - safeNumber(credibility.centralBankCredibility, 0.78)) * 16 - safeNumber(e.tradeBalance, 0) / Math.max(800, safeNumber(state.metrics.gdp, 1) * 18), 72, 155);
  e.exchangeRateIndex = clamp(smoothValue(e.exchangeRateIndex, exchangeTarget, 0.045), 70, 160);
  e.globalRiskSentiment = clamp(smoothValue(e.globalRiskSentiment, externalRisk, 0.055), 0, 1);
  e.foreignInvestorSentiment = clamp(smoothValue(e.foreignInvestorSentiment, 0.78 - externalRisk * 0.32 - Math.max(0, state.metrics.debtToGdpRatio - 1.2) * 0.06 + safeNumber(credibility.centralBankCredibility, 0.78) * 0.08, 0.055), 0, 1.1);
  e.globalDemand = clamp(smoothValue(e.globalDemand, 100 + getGDPGrowthWindow() * 0.40 - externalRisk * 10 + rand(-0.35, 0.35), 0.030), 72, 135);
  // 외국 주체는 개별 에이전트 대신 대표부문으로 두어 수출, 자본유입, 장기금리, 수입비용을 연결한다.
  actors.foreignConsumers.confidence = clamp(smoothValue(safeNumber(actors.foreignConsumers.confidence, 0.72), 0.70 + (e.globalDemand - 100) * 0.006 - externalRisk * 0.22, 0.060), 0.25, 1.05);
  actors.foreignConsumers.demandIndex = clamp(smoothValue(safeNumber(actors.foreignConsumers.demandIndex, 100), e.globalDemand * 0.82 + actors.foreignConsumers.confidence * 22 + Math.max(0, e.exchangeRateIndex - 100) * 0.20 - 16, 0.055), 55, 170);
  actors.foreignConsumers.exportPull = clamp(actors.foreignConsumers.demandIndex / 100, 0.55, 1.70);
  actors.foreignInvestors.sentiment = clamp(smoothValue(safeNumber(actors.foreignInvestors.sentiment, 0.72), safeNumber(e.foreignInvestorSentiment, 0.72) - safeNumber(financial.bondMarketStress, 0.10) * 0.12 + safeNumber(credibility.centralBankCredibility, 0.78) * 0.06, 0.065), 0.15, 1.10);
  actors.foreignInvestors.capitalFlow = smoothValue(safeNumber(actors.foreignInvestors.capitalFlow, 0), (actors.foreignInvestors.sentiment - 0.62) * Math.max(80, safeNumber(state.metrics.gdp, 100) * 0.18), 0.080);
  actors.foreignInvestors.equityFlow = smoothValue(safeNumber(actors.foreignInvestors.equityFlow, 0), (actors.foreignInvestors.sentiment - 0.58) * Math.max(40, safeNumber(state.metrics.gdp, 100) * 0.08), 0.080);
  actors.foreignBondholders.demand = clamp(smoothValue(safeNumber(actors.foreignBondholders.demand, 0.74), 0.78 - Math.max(0, safeNumber(state.metrics.debtToGdpRatio, 0.7) - 0.9) * 0.12 - safeNumber(financial.bondMarketStress, 0.10) * 0.28 + safeNumber(credibility.fiscalCredibility || state.sentiment?.fiscalCredibility, 0.75) * 0.10, 0.060), 0.18, 1.05);
  actors.foreignBondholders.fundingPressure = clamp(smoothValue(safeNumber(actors.foreignBondholders.fundingPressure, 0.12), Math.max(0, 0.72 - actors.foreignBondholders.demand) + safeNumber(financial.bondMarketStress, 0.10) * 0.35, 0.070), 0, 1);
  actors.foreignSuppliers.pressure = clamp(smoothValue(safeNumber(actors.foreignSuppliers.pressure, 0.18), externalRisk * 0.34 + Math.max(0, safeNumber(e.commodityPriceIndex, 100) - 100) / 145 + safeNumber(state.shock.pricePressure, 0) * 1.4, 0.055), 0, 1);
  actors.foreignSuppliers.deliveryStress = clamp(smoothValue(safeNumber(actors.foreignSuppliers.deliveryStress, 0.12), actors.foreignSuppliers.pressure * 0.62 + Math.max(0, safeNumber(e.energyPriceIndex, 100) - 100) / 170, 0.055), 0, 1);
  e.exportDemand = clamp(smoothValue(e.exportDemand, e.globalDemand * 0.82 + actors.foreignConsumers.demandIndex * 0.18 + Math.max(0, e.exchangeRateIndex - 100) * 0.28 - externalRisk * 5, 0.055), 60, 175);
  e.importPriceIndex = clamp(smoothValue(e.importPriceIndex, 100 + (e.exchangeRateIndex - 100) * 0.42 + safeNumber(e.commodityPriceIndex, 100) * 0.16 - 16 + actors.foreignSuppliers.pressure * 7, 0.055), 70, 200);
  e.commodityPriceIndex = clamp(smoothValue(e.commodityPriceIndex, 100 + externalRisk * 10 + Math.max(0, e.globalDemand - 100) * 0.18 + safeNumber(state.shock.pricePressure, 0) * 30 + actors.foreignSuppliers.pressure * 8 + rand(-0.30, 0.30), 0.030), 65, 225);
  e.energyPriceIndex = clamp(smoothValue(e.energyPriceIndex, 100 + (e.commodityPriceIndex - 100) * 0.58 + externalRisk * 8 + safeNumber(state.shock.pricePressure, 0) * 22 + actors.foreignSuppliers.deliveryStress * 10, 0.040), 60, 245);
  e.importInflationPressure = clamp((e.importPriceIndex - 100) / 100 * 2.4 * CALIBRATION.externalShockWeight, -1, 4.5);
  e.commodityCostPressure = clamp(((e.commodityPriceIndex + e.energyPriceIndex) / 2 - 100) / 100 * 3.0 * CALIBRATION.externalShockWeight, -1, 6);
  e.externalShockPressure = clamp(Math.max(0, e.importInflationPressure) * 0.24 + Math.max(0, e.commodityCostPressure) * 0.18 + externalRisk * 0.20 + actors.foreignSuppliers.pressure * 0.12 + actors.foreignBondholders.fundingPressure * 0.08, 0, 1);
  syncExternalMetrics(context);
}

export function computeCurrentImportFlows(state) {
  const external = state.external || {};
  const importPriceFactor = Math.max(0.35, safeNumber(external.importPriceIndex, 100) / 100);
  const energyPriceFactor = Math.max(0.30, safeNumber(external.energyPriceIndex, 100) / 100);
  const intermediateImports = sum(state.producers.map((producer) => {
    const outputValue = Math.max(0, safeNumber(producer.productionTick, 0) * safeNumber(producer.price, 0));
    return outputValue * getImportFlowProfile(producer.sector).intermediateImportShare * importPriceFactor;
  }));
  const energyImports = sum(state.producers.map((producer) => {
    const outputValue = Math.max(0, safeNumber(producer.productionTick, 0) * safeNumber(producer.price, 0));
    return outputValue * getImportFlowProfile(producer.sector).energyImportShare * energyPriceFactor;
  }));
  const consumerGoodsImports = Math.max(0, safeNumber(state.metrics.consumerGoodsImports, 0));
  const capitalGoodsImports = Math.max(0, safeNumber(state.metrics.investment, 0)) * 0.32 * importPriceFactor;
  return { intermediateImports, energyImports, consumerGoodsImports, capitalGoodsImports };
}

function applyImportFlows(state, flows) {
  const totalImports = sum(Object.values(flows));
  state.metrics.intermediateImports = flows.intermediateImports;
  state.metrics.energyImports = flows.energyImports;
  state.metrics.consumerGoodsImports = flows.consumerGoodsImports;
  state.metrics.capitalGoodsImports = flows.capitalGoodsImports;
  state.metrics.importCosts = totalImports;
}

export function syncExternalMetrics(context) {
  const {
    state,
    createInitialExternalActors,
    createInitialExternalSector,
    createInitialFinancialMarket,
    createInitialPolicyCredibility,
    createInitialRateStructure,
    getGDPGrowthWindow
  } = context;

  const e = state.external || createInitialExternalSector();
  const actors = state.externalActors || createInitialExternalActors();
  state.metrics.exchangeRateIndex = safeNumber(e.exchangeRateIndex, 100);
  state.metrics.exportDemand = safeNumber(e.exportDemand, 100);
  state.metrics.importPriceIndex = safeNumber(e.importPriceIndex, 100);
  state.metrics.commodityPriceIndex = safeNumber(e.commodityPriceIndex, 100);
  state.metrics.energyPriceIndex = safeNumber(e.energyPriceIndex, 100);
  state.metrics.tradeBalance = safeNumber(e.tradeBalance, 0);
  state.metrics.foreignConsumerDemand = safeNumber(actors.foreignConsumers?.demandIndex, safeNumber(e.exportDemand, 100));
  state.metrics.exportConsumerDemand = state.metrics.foreignConsumerDemand;
  state.metrics.foreignInvestorSentiment = safeNumber(actors.foreignInvestors?.sentiment, safeNumber(e.foreignInvestorSentiment, 0.72));
  state.metrics.foreignCapitalFlow = safeNumber(actors.foreignInvestors?.capitalFlow, 0);
  state.metrics.foreignBondDemand = safeNumber(actors.foreignBondholders?.demand, 0.74);
  state.metrics.foreignSupplierPressure = safeNumber(actors.foreignSuppliers?.pressure, 0.18);
  state.metrics.globalRiskSentiment = safeNumber(e.globalRiskSentiment, 0.28);
  state.metrics.globalDemand = safeNumber(e.globalDemand, 100);
  state.metrics.externalShockPressure = safeNumber(e.externalShockPressure, 0);
  state.metrics.importInflationPressure = safeNumber(e.importInflationPressure, 0);
  state.metrics.commodityCostPressure = safeNumber(e.commodityCostPressure, 0);
}
