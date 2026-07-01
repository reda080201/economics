import { CALIBRATION, TARGET_INFLATION } from "../core/config.js";
import { applyInertia, clamp, rand, safeNumber, smoothValue } from "../core/mathUtils.js";

// 고용자 수와 생산성이 재고 증가로 이어지며, 공급 충격은 생산량을 낮춘다.
export function produceGoods(context) {
  const { state } = context;
  state.producers.forEach((producer) => {
    // 생산계획은 최대 생산능력이 아니라 기대수요와 적정 재고버퍼(약 1.2개월)를 기준으로 부분 조정된다.
    const targetInventory = Math.max(8, producer.expectedDemand * 1.2);
    const inventoryRatio = producer.inventory / targetInventory;
    const inventoryDemandRatio = producer.inventory / Math.max(1, producer.expectedDemand);
    const desiredInventoryChange = targetInventory - producer.inventory;
    const utilizationTarget = inventoryRatio > 2.4
      ? 0.14
      : inventoryRatio > 1.7
        ? 0.34
        : inventoryRatio > 1.15
          ? 0.62
          : inventoryRatio < 0.75
            ? 1.04
            : 0.86;
    producer.productionUtilization = clamp(
      smoothValue(safeNumber(producer.productionUtilization, 1), utilizationTarget, inventoryRatio > 1.15 ? 0.22 : 0.10),
      0.10,
      1.06
    );
    const inventorySlowdown = inventoryRatio > 1
      ? clamp(1 / (1 + (inventoryRatio - 1) * 1.35), 0.18, 1)
      : 1;
    const productionTarget = clamp(producer.expectedDemand * rand(0.92, 1.08) + desiredInventoryChange * 0.18, 0.35, producer.productionCapacity);
    producer.productionPlan = smoothValue(safeNumber(producer.productionPlan, productionTarget), productionTarget, 0.16);
    const demandPlan = clamp(producer.productionPlan / Math.max(1, producer.productionCapacity), 0.18, 1.12);
    const outlookPlan = clamp(producer.businessOutlook, 0.58, 1.16);
    const activityDrag = clamp(producer.activityDrag || 1, 0.35, 1.04);
    producer.desiredProduction = smoothValue(producer.desiredProduction || producer.expectedDemand, producer.productionPlan * outlookPlan * activityDrag * producer.productionUtilization, 0.12);
    const laborOutput = producer.employees.length * producer.productivity * rand(0.88, 1.13);
    const baselineOutput = producer.productionCapacity * rand(0.030, 0.066);
    const fallbackFloor = Math.min(producer.productionCapacity * 0.12, Math.max(0.8, producer.expectedDemand * 0.09 + producer.employees.length * 0.04));
    const output = clamp(
      (laborOutput + baselineOutput) * demandPlan * outlookPlan * inventorySlowdown * producer.productionUtilization * activityDrag * state.shock.productivityMultiplier,
      inventoryDemandRatio > 3.0 ? fallbackFloor * 0.06 : inventoryDemandRatio > 2.2 ? fallbackFloor * 0.18 : fallbackFloor,
      producer.productionCapacity
    );

    producer.productionTick = output;
    // 재고 과잉은 먼저 생산 이용률을 낮추고, 오래 쌓인 초과 재고는 일부 폐기/구식화되어 재고-수요 비율이 영구 고착되지 않게 한다.
    if (inventoryDemandRatio > 3.2) {
      const clearanceRate = inventoryDemandRatio > 4.2 ? 0.010 : 0.006;
      const inventoryClearance = Math.min(producer.inventory * clearanceRate, producer.expectedDemand * 0.08);
      producer.inventory = Math.max(0, producer.inventory - inventoryClearance);
    }
    producer.inventory += output;
    state.metrics.productionUnits += output;
  });
}

// 재고가 부족하면 가격을 올리고, 재고가 쌓이면 가격을 내리는 방식으로 시장 압력을 반영한다.
export function computePriceChange(context, producer, observedDemand) {
  const {
    state,
    computeInflationResponseSignal,
    effectiveBaseWage,
    getGDPGrowthWindow
  } = context;
  const targetInventory = clamp(producer.expectedDemand * 1.85 + 9, 8, producer.productionCapacity * 4.2);
  const inventoryRatio = producer.inventory / Math.max(1, targetInventory);
  const demandPressure = observedDemand / Math.max(1, producer.productionTick + 0.8);
  const wageCostRatio = producer.wageOffered / Math.max(1, effectiveBaseWage());
  const longRunPrice = Math.max(2.2, producer.longRunPrice || producer.price);
  const priceDeviation = (producer.price - longRunPrice) / longRunPrice;

  // 가격 형성: 수요, 비용, 재고, 기대를 비슷한 크기로 정규화한 뒤 관성/평균회귀로 과잉 반응을 줄인다.
  const demandNorm = clamp(demandPressure - 1.0, -1.0, 1.0);
  const costNorm = clamp((wageCostRatio - 1.0) + state.smoothedWageGrowth / 100, -1.0, 1.0);
  const externalCostNorm = clamp(
    Math.max(0, safeNumber(state.metrics.importInflationPressure, 0)) * safeNumber(producer.importCostExposure, 0) * 0.16
      + Math.max(0, safeNumber(state.metrics.commodityCostPressure, 0)) * safeNumber(producer.energyCostExposure, 0) * 0.13,
    0,
    1
  );
  const inventoryNorm = inventoryRatio < 1
    ? clamp(1 - inventoryRatio, 0, 1)
    : -clamp((inventoryRatio - 1.35) / 1.8, 0, 1);
  const expectationNorm = clamp((producer.expectedInflation - TARGET_INFLATION) / 5, -1, 1);

  const demandPull = clamp(demandNorm * 0.010, -0.010, 0.014);
  const costPush = clamp(costNorm * 0.008 + externalCostNorm * 0.006, -0.006, 0.014);
  const shortage = clamp(inventoryNorm * 0.012, -0.010, 0.014);
  const expectations = clamp(expectationNorm * 0.005, -0.004, 0.007);
  const equilibriumPull = clamp((TARGET_INFLATION - state.smoothedInflation) * 0.00220, -0.003, 0.007);
  const meanReversion = clamp(-priceDeviation * 0.006, -0.006, 0.006);
  const responseInflationPressure = computeInflationResponseSignal(producer, observedDemand);

  let rawChange = state.shock.pricePressure + demandPull + costPush + shortage + expectations + equilibriumPull + meanReversion + responseInflationPressure;
  const recessionary = state.metrics.unemploymentRate > 12 || getGDPGrowthWindow() < -4;
  const tightLabor = state.metrics.unemploymentRate < 6 && !recessionary;
  if (state.smoothedInflation < 1.0) rawChange += recessionary ? 0.00250 : 0.00950;
  if (tightLabor && inventoryRatio < 2.4) rawChange += 0.0032;
  if (producer.lastProfit < -60) rawChange += 0.0015;
  if (producer.financiallyStressed && producer.inventory > producer.expectedDemand) rawChange -= 0.0014;

  const firmSize = clamp(producer.productionCapacity / 180, 0, 1);
  const inertiaDrag = clamp(1 - firmSize * 0.28 - (producer.priceInertia || 0.08), 0.58, 0.94);
  const smoothedChange = smoothValue(producer.lastPriceChange || 0, rawChange * inertiaDrag * state.config.inflationSensitivity, 0.42 / Math.max(0.4, CALIBRATION.priceStickiness));
  const positivePriceLimit = 0.025;
  const negativeLimit = recessionary ? -0.015 : tightLabor ? -0.006 : -0.012;
  const change = clamp(smoothedChange, negativeLimit, positivePriceLimit);
  producer.lastPriceChange = change;
  producer.longRunPrice = clamp(smoothValue(longRunPrice, producer.price, 0.006), 2.2, 65);

  return { change, demandPull, costPush, shortage, expectations: expectations + responseInflationPressure };
}

export function adjustProducerPricesAndExpectations(context) {
  const {
    state,
    applyEquilibriumGravity,
    getGDPGrowthWindow
  } = context;
  const drivers = { demandPull: 0, costPush: 0, shortage: 0, expectations: 0 };
  const equilibriumGravity = applyEquilibriumGravity();
  state.producers.forEach((producer) => {
    const observedDemand = producer.unitsSoldTick;
    producer.smoothedObservedDemand = applyInertia(safeNumber(producer.smoothedObservedDemand, observedDemand), observedDemand);
    const procurementDemand = state.metrics.governmentProcurement / Math.max(1, state.metrics.averagePrice || producer.price) * 0.06;
    const inventoryDemandRatio = producer.inventory / Math.max(1, producer.expectedDemand);
    const inventoryExpectationBrake = inventoryDemandRatio > 2.6
      ? 0.92
      : inventoryDemandRatio > 1.8
        ? 0.96
        : 1;
    const rawExpectedDemand = (producer.expectedDemand * 0.72 + producer.smoothedObservedDemand * 0.28 + procurementDemand) * equilibriumGravity.demandAdjustment * inventoryExpectationBrake;
    producer.expectedDemand = clamp(applyInertia(producer.expectedDemand, rawExpectedDemand), 1, producer.productionCapacity * 2.8);

    // 인플레이션 메커니즘: 수요초과, 비용상승, 재고부족, 기대인플레이션을 분리해 완만히 가격에 반영한다.
    const priceResult = computePriceChange(context, producer, observedDemand);
    drivers.demandPull += priceResult.demandPull;
    drivers.costPush += priceResult.costPush;
    drivers.shortage += priceResult.shortage;
    drivers.expectations += priceResult.expectations;
    // 임금-가격 나선 강화: 임금상승률과 기대물가가 가격에 추가 전가되지만, 최종 변화율은 계속 3%로 제한한다.
    const wagePassThrough = clamp((state.smoothedWageGrowth / 100) * 0.5, -0.010, 0.016);
    const expectationAmplification = clamp((producer.expectedInflation - TARGET_INFLATION) / 100 * 0.18, -0.004, 0.010);
    const recessionary = state.metrics.unemploymentRate > 12 || getGDPGrowthWindow() < -4;
    const tightLabor = state.metrics.unemploymentRate < 6 && !recessionary;
    const priceAnchorBoost = state.smoothedInflation < 1.0
      ? (recessionary ? 0.0040 : 0.0170)
      : state.smoothedInflation < TARGET_INFLATION
        ? (recessionary ? 0.0015 : 0.0070)
        : 0;
    const negativeLimit = recessionary ? -0.015 : tightLabor ? -0.006 : -0.012;
    const finalChange = clamp(priceResult.change + wagePassThrough + expectationAmplification + equilibriumGravity.priceAdjustment + priceAnchorBoost, negativeLimit, 0.025);
    producer.lastPriceChange = applyInertia(producer.lastPriceChange || 0, finalChange);
    producer.price = clamp(producer.price * (1 + producer.lastPriceChange), 2.2, 65);
  });

  const n = Math.max(1, state.producers.length);
  state.priceDrivers = {
    demandPull: drivers.demandPull / n,
    costPush: drivers.costPush / n,
    shortage: drivers.shortage / n,
    expectations: drivers.expectations / n
  };
}
